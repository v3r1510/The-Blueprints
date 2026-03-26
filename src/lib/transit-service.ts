import GtfsRealtimeBindings from "gtfs-realtime-bindings";

const { FeedMessage, VehiclePosition } = GtfsRealtimeBindings.transit_realtime;

const STM_VEHICLES_URL =
  "https://api.stm.info/pub/od/gtfs-rt/ic/v2/vehiclePositions";
const STM_TRIPS_URL =
  "https://api.stm.info/pub/od/gtfs-rt/ic/v2/tripUpdates";
const STM_API_KEY = process.env.STM_API_KEY!;

/* ──────────────────────── Types ──────────────────────── */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface TransitVehicle {
  vehicleId: string;
  label: string;
  routeId: string;
  tripId: string;
  directionId: number;
  nextStopDeparture: number;
  latitude: number;
  longitude: number;
  bearing: number;
  speed: number;
  stopSequence: number;
  stopId: string;
  status: string;
  timestamp: number;
  occupancy: string;
}

export interface TransitRoute {
  routeId: string;
  activeBuses: number;
  vehicles: TransitVehicle[];
}

export interface TransitOptions {
  timestamp: number;
  totalVehicles: number;
  totalRoutes: number;
  routes: TransitRoute[];
}

export interface RouteResult {
  routeId: string;
  nearestVehicleDistance: number;
  vehiclesNearStart: number;
  vehiclesNearDestination: number;
  sampleVehicle: TransitVehicle;
}

/* ─────────────────────── Helpers ─────────────────────── */

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

function toLong(val: unknown): number {
  if (!val) return 0;
  if (typeof val === "number") return val;
  if (typeof val === "object" && val !== null && "toNumber" in val)
    return (val as { toNumber: () => number }).toNumber();
  if (typeof val === "object" && val !== null && "low" in val)
    return (val as { low: number }).low;
  return Number(val) || 0;
}

/** Haversine distance in kilometres between two lat/lng points. */
function haversineKm(a: Coordinates, b: Coordinates): number {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const h =
    sinLat * sinLat +
    Math.cos((a.latitude * Math.PI) / 180) *
      Math.cos((b.latitude * Math.PI) / 180) *
      sinLon * sinLon;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/* ───────────────────── Service class ───────────────────── */

/**
 * Encapsulates all interactions with the STM real-time transit feeds.
 *
 * Maps to the class-diagram entity:
 *   PublicTransitService { +calculateRoute(start, destination); +displayOptions() }
 */
export class PublicTransitService {
  private static readonly SEARCH_RADIUS_KM = 1.5;

  /* ── Core: fetch + decode both STM feeds into TransitVehicle[] ── */

  private async fetchAllVehicles(): Promise<TransitVehicle[]> {
    const [vehiclesRes, tripsRes] = await Promise.all([
      fetch(STM_VEHICLES_URL, { headers: { apikey: STM_API_KEY }, cache: "no-store" }),
      fetch(STM_TRIPS_URL, { headers: { apikey: STM_API_KEY }, cache: "no-store" }),
    ]);

    if (!vehiclesRes.ok) {
      throw new Error(`STM API returned ${vehiclesRes.status}`);
    }

    const vehiclesFeed = FeedMessage.decode(
      new Uint8Array(await vehiclesRes.arrayBuffer())
    );

    const tripStopTimes = new Map<
      string,
      { stopSequence: number; stopId: string; departureTime: number }[]
    >();

    if (tripsRes.ok) {
      const tripsFeed = FeedMessage.decode(
        new Uint8Array(await tripsRes.arrayBuffer())
      );
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

    return vehiclesFeed.entity
      .filter((e) => e.vehicle?.trip?.routeId)
      .map((e) => {
        const v = e.vehicle!;
        const tripId = v.trip?.tripId ?? "";
        const currentSeq = v.currentStopSequence ?? 0;
        const currentStopId = v.stopId ?? "";

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
  }

  /* ── Public API ── */

  /**
   * Return all active transit options: every route with its live vehicles,
   * optionally filtered to a single route.
   */
  async displayOptions(routeFilter?: string): Promise<TransitOptions> {
    const allVehicles = await this.fetchAllVehicles();

    const vehicles = routeFilter
      ? allVehicles.filter((v) => v.routeId === routeFilter)
      : allVehicles;

    const routeMap = new Map<string, TransitVehicle[]>();
    for (const v of vehicles) {
      const arr = routeMap.get(v.routeId);
      if (arr) arr.push(v);
      else routeMap.set(v.routeId, [v]);
    }

    const routes: TransitRoute[] = Array.from(routeMap.entries())
      .map(([routeId, vList]) => ({
        routeId,
        activeBuses: vList.length,
        vehicles: vList,
      }))
      .sort((a, b) => {
        const aNum = parseInt(a.routeId);
        const bNum = parseInt(b.routeId);
        if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
        return a.routeId.localeCompare(b.routeId);
      });

    return {
      timestamp: Date.now(),
      totalVehicles: vehicles.length,
      totalRoutes: routes.length,
      routes,
    };
  }

  /**
   * Given a start and destination coordinate, find bus routes that have
   * active vehicles near both points – i.e. routes that can plausibly
   * carry a rider between the two locations.
   */
  async calculateRoute(
    start: Coordinates,
    destination: Coordinates
  ): Promise<RouteResult[]> {
    const radius = PublicTransitService.SEARCH_RADIUS_KM;
    const allVehicles = await this.fetchAllVehicles();

    // Index vehicles by route
    const byRoute = new Map<string, TransitVehicle[]>();
    for (const v of allVehicles) {
      const arr = byRoute.get(v.routeId);
      if (arr) arr.push(v);
      else byRoute.set(v.routeId, [v]);
    }

    const results: RouteResult[] = [];

    for (const [routeId, vehicles] of byRoute) {
      const nearStart = vehicles.filter(
        (v) => haversineKm(start, { latitude: v.latitude, longitude: v.longitude }) <= radius
      );
      const nearDest = vehicles.filter(
        (v) => haversineKm(destination, { latitude: v.latitude, longitude: v.longitude }) <= radius
      );

      if (nearStart.length === 0 || nearDest.length === 0) continue;

      let closest = nearStart[0];
      let closestDist = haversineKm(start, { latitude: closest.latitude, longitude: closest.longitude });
      for (const v of nearStart) {
        const d = haversineKm(start, { latitude: v.latitude, longitude: v.longitude });
        if (d < closestDist) { closest = v; closestDist = d; }
      }

      results.push({
        routeId,
        nearestVehicleDistance: Math.round(closestDist * 1000),
        vehiclesNearStart: nearStart.length,
        vehiclesNearDestination: nearDest.length,
        sampleVehicle: closest,
      });
    }

    return results.sort((a, b) => a.nearestVehicleDistance - b.nearestVehicleDistance);
  }
}
