import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Vehicle from "@/models/Vehicle";
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
    const { tripId } = body;

    if (!tripId) {
      return NextResponse.json(
        { error: "Trip ID is required" },
        { status: 400 },
      );
    }

    const trip = await Trip.findById(tripId).populate("vehicleId");
    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    if (trip.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (trip.status === "Completed" || trip.status === "Cancelled") {
      return NextResponse.json(
        { error: "Trip is already " + trip.status.toLowerCase() },
        { status: 400 },
      );
    }

    const vehicle = await Vehicle.findById(trip.vehicleId);
    if (!vehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    const endTime = new Date();
    const strategy = paymentSystem.resolveStrategy(vehicle.type);
    const { fare, durationMinutes, rate, unit } = paymentSystem.calculateFare(
      strategy,
      trip.startTime,
      endTime,
    );

    const debit = await paymentSystem.debitAccount(session.user.id as string, fare);

    if (!debit.success) {
      PaymentObserver.getInstance().recordFailure(session.user.id as string);
      return NextResponse.json(
        {
          error: "Insufficient balance to complete this rental",
          fare,
          balanceRemaining: debit.remaining,
        },
        { status: 402 },
      );
    }

    trip.endTime = endTime;
    trip.totalFare = fare;
    trip.status = "Completed";
    await trip.save();

    vehicle.state = "Available";
    await vehicle.save();

    return NextResponse.json({
      message: "Rental completed",
      receipt: {
        tripId: trip._id,
        vehicleType: vehicle.type,
        zone: vehicle.zone,
        startTime: trip.startTime,
        endTime,
        durationMinutes,
        rate,
        unit,
        totalFare: fare,
        balanceRemaining: debit.remaining,
      },
    });
  } catch (err) {
    console.error("[COMPLETE RENTAL ERROR]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
