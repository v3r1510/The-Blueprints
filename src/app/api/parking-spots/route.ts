import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import ParkingSpot, { IParkingSpot } from "@/models/ParkingSpot";
import { QueryFilter } from "mongoose";

export async function GET(req: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const latStr = req.nextUrl.searchParams.get("lat");
    const lngStr = req.nextUrl.searchParams.get("lng");
    const radiusStr = req.nextUrl.searchParams.get("radius");

    const filter: QueryFilter<IParkingSpot> = {
      state: "Available",
    };

    if (latStr && lngStr) {
      const lat = parseFloat(latStr);
      const lng = parseFloat(lngStr);
      const radius = radiusStr ? parseInt(radiusStr, 10) : 1000;

      if (isNaN(lat) || isNaN(lng) || isNaN(radius)) {
        return NextResponse.json(
          { error: "Invalid location parameters" },
          { status: 400 },
        );
      }

      filter.location = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [lng, lat],
          },
          $maxDistance: radius,
        },
      };
    }

    const spots = await ParkingSpot.find(filter).sort({ zone: 1, lotNumber: 1 });

    return NextResponse.json(spots);
  } catch (err) {
    console.error("[PARKING SPOTS FETCH ERROR]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
