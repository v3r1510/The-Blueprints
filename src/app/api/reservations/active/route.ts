import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Trip from "@/models/Trip";
import Vehicle from "@/models/Vehicle";
import ParkingSpot from "@/models/ParkingSpot";

export async function GET() {
  const session = await auth();

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const trip = await Trip.findOne({
      userId: session.user.id,
      status: { $in: ["Reserved", "Active"] },
    });

    if (!trip) {
      return NextResponse.json({ activeTrip: null });
    }

    const isParking =
      trip.resourceType === "parking" ||
      (!!trip.parkingSpotId && !trip.vehicleId);

    if (isParking) {
      const spot = await ParkingSpot.findById(trip.parkingSpotId);
      return NextResponse.json({
        activeTrip: {
          tripId: trip._id,
          startTime: trip.startTime,
          resourceType: "parking" as const,
          vehicle: null,
          parkingSpot: spot
            ? {
                _id: spot._id,
                lotNumber: spot.lotNumber,
                zone: spot.zone,
                flatRate: spot.flatRate,
                state: spot.state,
                location: spot.location,
              }
            : null,
        },
      });
    }

    const vehicle = await Vehicle.findById(trip.vehicleId);

    return NextResponse.json({
      activeTrip: {
        tripId: trip._id,
        startTime: trip.startTime,
        resourceType: "vehicle" as const,
        vehicle: vehicle
          ? {
              _id: vehicle._id,
              type: vehicle.type,
              zone: vehicle.zone,
              batteryLevel: vehicle.batteryLevel,
              state: vehicle.state,
              location: vehicle.location,
            }
          : null,
        parkingSpot: null,
      },
    });
  } catch (err) {
    console.error("[ACTIVE TRIP ERROR]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
