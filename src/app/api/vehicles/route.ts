import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Vehicle, { VehicleType, IVehicle } from "@/models/Vehicle";
import { QueryFilter } from "mongoose";

const VALID_TYPES: VehicleType[] = ["Car", "Bike", "Scooter"];

export async function GET(req: NextRequest) {
  //Riders must be logged in to search/reserve
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const type = req.nextUrl.searchParams.get("type") as VehicleType | null;
    const latStr = req.nextUrl.searchParams.get("lat");
    const lngStr = req.nextUrl.searchParams.get("lng");
    const radiusStr = req.nextUrl.searchParams.get("radius");

    if (type && !VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: "Invalid vehicle type filter" },
        { status: 400 },
      );
    }

    const filter: QueryFilter<IVehicle> = {
      state: "Available",
    };

    if (type) {
      filter.type = type;
    }

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

  
    const vehicles = await Vehicle.find(filter).sort({ createdAt: -1 });


    return NextResponse.json(vehicles);
  } catch (err) {
    console.error("[VEHICLES FETCH ERROR]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
