import { NextResponse } from "next/server";
import { PublicTransitService } from "@/lib/transit-service";

export const dynamic = "force-dynamic";

const transitService = new PublicTransitService();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const routeFilter = searchParams.get("route");
  const startParam = searchParams.get("start");
  const destParam = searchParams.get("destination");

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

      return NextResponse.json({ timestamp: Date.now(), results });
    }

    // Default mode: display all transit options
    const options = await transitService.displayOptions(routeFilter ?? undefined);
    return NextResponse.json(options);
  } catch (err) {
    console.error("Transit API error:", err);
    return NextResponse.json(
      { error: "Failed to fetch transit data" },
      { status: 500 }
    );
  }
}
