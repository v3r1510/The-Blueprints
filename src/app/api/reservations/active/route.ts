import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Trip from "@/models/Trip";
import Vehicle from "@/models/Vehicle";

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

    const vehicle = await Vehicle.findById(trip.vehicleId);

    return NextResponse.json({
      activeTrip: {
        tripId: trip._id,
        startTime: trip.startTime,
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
