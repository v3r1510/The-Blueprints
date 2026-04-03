import { NextResponse } from "next/server";
import GtfsRealtimeBindings from "gtfs-realtime-bindings";
import { GatewayAnalyticsObserver } from "@/lib/observers/GatewayAnalyticsObserver";

const { FeedMessage } = GtfsRealtimeBindings.transit_realtime;

const STM_TRIPS_URL =
  "https://api.stm.info/pub/od/gtfs-rt/ic/v2/tripUpdates";
const STM_API_KEY = process.env.STM_API_KEY!;

export const dynamic = "force-dynamic";

function toLong(val: unknown): number {
  if (!val) return 0;
  if (typeof val === "number") return val;
  if (typeof val === "object" && val !== null && "toNumber" in val)
    return (val as { toNumber: () => number }).toNumber();
  if (typeof val === "object" && val !== null && "low" in val)
    return (val as { low: number }).low;
  return Number(val) || 0;
}

function extractTime(ev: { delay?: number | null; time?: unknown } | null | undefined) {
  if (!ev) return null;
  return { delay: ev.delay ?? 0, time: toLong(ev.time) };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const routeFilter = searchParams.get("route");

  const gateway = GatewayAnalyticsObserver.getInstance();
  const t0 = Date.now();

  try {
    const res = await fetch(STM_TRIPS_URL, {
      headers: { apikey: STM_API_KEY },
      cache: "no-store",
    });

    if (!res.ok) {
      gateway.onGatewayCall({ service: "STM_TRIPS", status: "failure", latencyMs: Date.now() - t0, httpStatus: res.status, timestamp: new Date() });
      return NextResponse.json(
        { error: `STM API returned ${res.status}` },
        { status: 502 }
      );
    }

    const buffer = await res.arrayBuffer();
    const feed = FeedMessage.decode(new Uint8Array(buffer));

    const SCHED_MAP: Record<number, string> = { 0: "SCHEDULED", 1: "SKIPPED", 2: "NO_DATA" };

    const trips = feed.entity
      .filter((e) => e.tripUpdate?.trip?.routeId)
      .filter((e) => !routeFilter || e.tripUpdate!.trip!.routeId === routeFilter)
      .map((e) => {
        const tu = e.tripUpdate!;
        return {
          tripId: tu.trip?.tripId ?? "",
          routeId: tu.trip!.routeId!,
          directionId: tu.trip?.directionId ?? 0,
          startTime: tu.trip?.startTime ?? "",
          startDate: tu.trip?.startDate ?? "",
          vehicleId: tu.vehicle?.id ?? "",
          timestamp: toLong(tu.timestamp),
          stopTimeUpdates: (tu.stopTimeUpdate ?? []).map((stu) => ({
            stopSequence: stu.stopSequence ?? 0,
            stopId: stu.stopId ?? "",
            arrival: extractTime(stu.arrival),
            departure: extractTime(stu.departure),
            scheduleRelationship: SCHED_MAP[stu.scheduleRelationship as number] ?? "UNKNOWN",
          })),
        };
      });

    gateway.onGatewayCall({ service: "STM_TRIPS", status: "success", latencyMs: Date.now() - t0, httpStatus: 200, timestamp: new Date() });
    return NextResponse.json({
      timestamp: Date.now(),
      totalTrips: trips.length,
      trips,
    });
  } catch (err) {
    console.error("Transit trips API error:", err);
    gateway.onGatewayCall({ service: "STM_TRIPS", status: "failure", latencyMs: Date.now() - t0, error: String(err), timestamp: new Date() });
    return NextResponse.json(
      { error: "Failed to fetch trip updates" },
      { status: 500 }
    );
  }
}
