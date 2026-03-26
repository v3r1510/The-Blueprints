import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Vehicle from "@/models/Vehicle";
import Trip from "@/models/Trip";
import { paymentSystem } from "@/lib/payment";
import { PaymentObserver } from "@/lib/observers/PaymentObserver";
import { getMobilityProviderService } from "@/lib/mobility-provider/service";

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

    const existingTrip = await Trip.findOne({
      userId: session.user.id,
      status: { $in: ["Reserved", "Active"] },
    });
    if (existingTrip) {
      return NextResponse.json(
        { error: "You already have an active rental. End it before reserving another vehicle." },
        { status: 409 },
      );
    }

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    const hasFunds = await paymentSystem.verifyBalance(session.user.id as string);
    if (!hasFunds) {
      PaymentObserver.getInstance().recordFailure(session.user.id as string);
      return NextResponse.json(
        { error: "Insufficient balance to reserve this vehicle" },
        { status: 402 },
      );
    }

    try {
      const providerService = getMobilityProviderService();
      await providerService.reserveVehicle(vehicleId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Vehicle is no longer available";
      const status = message.includes("Invalid state transition") ? 400 : 500;
      return NextResponse.json(
        { error: message.includes("Invalid state transition") ? "Vehicle is no longer available" : message },
        { status },
      );
    }


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
        vehicleState: "Reserved",
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
