import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Vehicle from "@/models/Vehicle";
import Trip from "@/models/Trip";
import { paymentSystem } from "@/lib/payment";

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const body = await req.json();
    const { vehicleId, pricingStrategy = "PerMinute" } = body;

    if (!vehicleId) {
      return NextResponse.json(
        { error: "Vehicle ID is required" },
        { status: 400 },
      );
    }

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

    //assuming session.user.id exists. ELSE session.user.email
    const hasFunds = paymentSystem.verifyBalance(session.user.id as string);
    if (!hasFunds) {
      return NextResponse.json(
        { error: "Insufficient balance to reserve this vehicle" },
        { status: 402 },
      );
    }

    vehicle.state = "Reserved";
    await vehicle.save();


    const newTrip = await Trip.create({
      userId: session.user.id, //or session.user.email
      vehicleId: vehicle._id,
      pricingStrategy: pricingStrategy,
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
  } catch (err) {
    console.error("[RESERVATION ERROR]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
