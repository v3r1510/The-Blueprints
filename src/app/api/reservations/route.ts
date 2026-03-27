import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Vehicle from "@/models/Vehicle";
import ParkingSpot from "@/models/ParkingSpot";
import Trip from "@/models/Trip";
import { paymentSystem } from "@/lib/payment";
import { PaymentObserver } from "@/lib/observers/PaymentObserver";

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const body = await req.json();
    const { vehicleId, parkingSpotId, pricingStrategy = "PerMinute" } = body;

    const hasVehicle = !!vehicleId;
    const hasParking = !!parkingSpotId;

    if (!hasVehicle && !hasParking) {
      return NextResponse.json(
        { error: "vehicleId or parkingSpotId is required" },
        { status: 400 },
      );
    }

    if (hasVehicle && hasParking) {
      return NextResponse.json(
        { error: "Provide only one of vehicleId or parkingSpotId" },
        { status: 400 },
      );
    }

    const existingTrip = await Trip.findOne({
      userId: session.user.id,
      status: { $in: ["Reserved", "Active"] },
    });
    if (existingTrip) {
      return NextResponse.json(
        {
          error:
            "You already have an active rental. End it before reserving another resource.",
        },
        { status: 409 },
      );
    }

    const hasFunds = await paymentSystem.verifyBalance(session.user.id as string);
    if (!hasFunds) {
      PaymentObserver.getInstance().recordFailure(session.user.id as string);
      return NextResponse.json(
        { error: "Insufficient balance to reserve" },
        { status: 402 },
      );
    }

    if (hasVehicle) {
      const vehicle = await Vehicle.findById(vehicleId);
      if (!vehicle) {
        return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
      }

      if (vehicle.state !== "Available") {
        return NextResponse.json(
          { error: "Vehicle is no longer available" },
          { status: 400 },
        );
      }

      vehicle.state = "Reserved";
      await vehicle.save();

      const newTrip = await Trip.create({
        userId: session.user.id,
        resourceType: "vehicle",
        vehicleId: vehicle._id,
        pricingStrategy,
        status: "Reserved",
        startTime: new Date(),
      });

      return NextResponse.json(
        {
          message: "Reservation successful!",
          trip: newTrip,
          vehicleState: vehicle.state,
        },
        { status: 201 },
      );
    }

    const spot = await ParkingSpot.findById(parkingSpotId);
    if (!spot) {
      return NextResponse.json({ error: "Parking spot not found" }, { status: 404 });
    }

    if (spot.state !== "Available") {
      return NextResponse.json(
        { error: "Parking spot is no longer available" },
        { status: 400 },
      );
    }

    spot.state = "Reserved";
    await spot.save();

    const newTrip = await Trip.create({
      userId: session.user.id,
      resourceType: "parking",
      parkingSpotId: spot._id,
      pricingStrategy: "FlatRate",
      status: "Reserved",
      startTime: new Date(),
    });

    return NextResponse.json(
      {
        message: "Parking reservation successful!",
        trip: newTrip,
        spotState: spot.state,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[RESERVATION ERROR]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
