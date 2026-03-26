import { NextResponse } from "next/server";
import GtfsRealtimeBindings from "gtfs-realtime-bindings";

const { FeedMessage, VehiclePosition } = GtfsRealtimeBindings.transit_realtime;

const STM_VEHICLES_URL =
  "https://api.stm.info/pub/od/gtfs-rt/ic/v2/vehiclePositions";
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

const STATUS_MAP: Record<number, string> = {
  [VehiclePosition.VehicleStopStatus.INCOMING_AT]: "INCOMING_AT",
  [VehiclePosition.VehicleStopStatus.STOPPED_AT]: "STOPPED_AT",
  [VehiclePosition.VehicleStopStatus.IN_TRANSIT_TO]: "IN_TRANSIT_TO",
};

const OCCUPANCY_MAP: Record<number, string> = {
  [VehiclePosition.OccupancyStatus.EMPTY]: "EMPTY",
  [VehiclePosition.OccupancyStatus.MANY_SEATS_AVAILABLE]: "MANY_SEATS_AVAILABLE",
  [VehiclePosition.OccupancyStatus.FEW_SEATS_AVAILABLE]: "FEW_SEATS_AVAILABLE",
  [VehiclePosition.OccupancyStatus.STANDING_ROOM_ONLY]: "STANDING_ROOM_ONLY",
  [VehiclePosition.OccupancyStatus.CRUSHED_STANDING_ROOM_ONLY]: "CRUSHED_STANDING_ROOM_ONLY",
  [VehiclePosition.OccupancyStatus.FULL]: "FULL",
  [VehiclePosition.OccupancyStatus.NOT_ACCEPTING_PASSENGERS]: "NOT_ACCEPTING_PASSENGERS",
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const routeFilter = searchParams.get("route");

  try {
    const [vehiclesRes, tripsRes] = await Promise.all([
      fetch(STM_VEHICLES_URL, { headers: { apikey: STM_API_KEY }, cache: "no-store" }),
      fetch(STM_TRIPS_URL, { headers: { apikey: STM_API_KEY }, cache: "no-store" }),
    ]);

    if (!vehiclesRes.ok) {
      return NextResponse.json(
        { error: `STM API returned ${vehiclesRes.status}` },
        { status: 502 }
      );
    }

    const vehiclesFeed = FeedMessage.decode(new Uint8Array(await vehiclesRes.arrayBuffer()));

    // Build a lookup: tripId -> stop time updates (sorted by stop sequence)
    const tripStopTimes = new Map<string, { stopSequence: number; stopId: string; departureTime: number }[]>();
    if (tripsRes.ok) {
      const tripsFeed = FeedMessage.decode(new Uint8Array(await tripsRes.arrayBuffer()));
      for (const e of tripsFeed.entity) {
        const tu = e.tripUpdate;
        if (!tu?.trip?.tripId || !tu.stopTimeUpdate?.length) continue;
        tripStopTimes.set(
          tu.trip.tripId,
          tu.stopTimeUpdate.map((stu) => ({
            stopSequence: stu.stopSequence ?? 0,
            stopId: stu.stopId ?? "",
            departureTime: toLong(stu.departure?.time),
          }))
        );
      }
    }

    const vehicles = vehiclesFeed.entity
      .filter((e) => e.vehicle?.trip?.routeId)
      .map((e) => {
        const v = e.vehicle!;
        const tripId = v.trip?.tripId ?? "";
        const currentSeq = v.currentStopSequence ?? 0;
        const currentStopId = v.stopId ?? "";

        // Find the next-stop departure from the trip update
        let nextStopDeparture = 0;
        const stops = tripStopTimes.get(tripId);
        if (stops) {
          const match =
            stops.find((s) => s.stopId === currentStopId) ??
            stops.find((s) => s.stopSequence >= currentSeq);
          if (match) nextStopDeparture = match.departureTime;
        }

        return {
          vehicleId: v.vehicle?.id ?? e.id,
          label: v.vehicle?.label ?? "",
          routeId: v.trip!.routeId!,
          tripId,
          directionId: v.trip?.directionId ?? 0,
          nextStopDeparture,
          latitude: v.position?.latitude ?? 0,
          longitude: v.position?.longitude ?? 0,
          bearing: v.position?.bearing ?? 0,
          speed: v.position?.speed ?? 0,
          stopSequence: currentSeq,
          stopId: currentStopId,
          status: STATUS_MAP[v.currentStatus as number] ?? "UNKNOWN",
          timestamp: toLong(v.timestamp),
          occupancy: OCCUPANCY_MAP[v.occupancyStatus as number] ?? "UNKNOWN",
        };
      });

    const filtered = routeFilter
      ? vehicles.filter((v) => v.routeId === routeFilter)
      : vehicles;

    const routeMap = new Map<string, { count: number; vehicles: typeof filtered }>();
    for (const v of filtered) {
      const existing = routeMap.get(v.routeId);
      if (existing) {
        existing.count++;
        existing.vehicles.push(v);
      } else {
        routeMap.set(v.routeId, { count: 1, vehicles: [v] });
      }
    }

    const routes = Array.from(routeMap.entries())
      .map(([routeId, data]) => ({
        routeId,
        activeBuses: data.count,
        vehicles: data.vehicles,
      }))
      .sort((a, b) => {
        const aNum = parseInt(a.routeId);
        const bNum = parseInt(b.routeId);
        if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
        return a.routeId.localeCompare(b.routeId);
      });

    return NextResponse.json({
      timestamp: Date.now(),
      totalVehicles: filtered.length,
      totalRoutes: routes.length,
      routes,
    });
  } catch (err) {
    console.error("Transit API error:", err);
    return NextResponse.json(
      { error: "Failed to fetch transit data" },
      { status: 500 }
    );
  }
}
