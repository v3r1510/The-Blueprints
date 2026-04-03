import { NextResponse } from "next/server";
import { PublicTransitService } from "@/lib/transit-service";
import { GatewayAnalyticsObserver } from "@/lib/observers/GatewayAnalyticsObserver";

export const dynamic = "force-dynamic";

const transitService = new PublicTransitService();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const routeFilter = searchParams.get("route");
  const startParam = searchParams.get("start");
  const destParam = searchParams.get("destination");

  const gateway = GatewayAnalyticsObserver.getInstance();
  const t0 = Date.now();

  try {
    // Route calculation mode: ?start=lat,lng&destination=lat,lng
    if (startParam && destParam) {
      const [sLat, sLng] = startParam.split(",").map(Number);
      const [dLat, dLng] = destParam.split(",").map(Number);

      if ([sLat, sLng, dLat, dLng].some(isNaN)) {
        return NextResponse.json(
          { error: "Invalid coordinates. Use ?start=lat,lng&destination=lat,lng" },
          { status: 400 }
        );
      }

      const results = await transitService.calculateRoute(
        { latitude: sLat, longitude: sLng },
        { latitude: dLat, longitude: dLng }
      );

      gateway.onGatewayCall({ service: "STM_DISPLAY", status: "success", latencyMs: Date.now() - t0, httpStatus: 200, timestamp: new Date() });
      return NextResponse.json({ timestamp: Date.now(), results });
    }

    // Default mode: display all transit options
    const options = await transitService.displayOptions(routeFilter ?? undefined);
    gateway.onGatewayCall({ service: "STM_DISPLAY", status: "success", latencyMs: Date.now() - t0, httpStatus: 200, timestamp: new Date() });
    return NextResponse.json(options);
  } catch (err) {
    console.error("Transit API error:", err);
    gateway.onGatewayCall({ service: "STM_DISPLAY", status: "failure", latencyMs: Date.now() - t0, error: String(err), timestamp: new Date() });
    return NextResponse.json(
      { error: "Failed to fetch transit data" },
      { status: 500 }
    );
  }
}
