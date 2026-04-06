import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Rating from "@/models/Rating";
import Trip from "@/models/Trip";

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const body = await req.json();
    const { tripId, stars, comment } = body;

    if (!tripId) {
      return NextResponse.json({ error: "Trip ID is required" }, { status: 400 });
    }

    if (!stars || stars < 1 || stars > 5 || !Number.isInteger(stars)) {
      return NextResponse.json(
        { error: "Stars must be an integer between 1 and 5" },
        { status: 400 },
      );
    }

    const trip = await Trip.findById(tripId);

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    if (trip.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (trip.status !== "Completed") {
      return NextResponse.json(
        { error: "Can only rate completed trips" },
        { status: 400 },
      );
    }

    if (!trip.vehicleId) {
      return NextResponse.json(
        { error: "Only vehicle trips can be rated" },
        { status: 400 },
      );
    }

    const existing = await Rating.findOne({ tripId });
    if (existing) {
      return NextResponse.json(
        { error: "This trip has already been rated" },
        { status: 409 },
      );
    }

    const rating = await Rating.create({
      tripId,
      vehicleId: trip.vehicleId,
      userId: trip.userId,
      stars,
      comment: comment?.trim() || undefined,
    });

    return NextResponse.json({ rating }, { status: 201 });
  } catch (error) {
    console.error("[RATING CREATE ERROR]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
