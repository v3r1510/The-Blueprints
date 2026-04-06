import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Rating from "@/models/Rating";
import mongoose from "mongoose";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid vehicle ID" }, { status: 400 });
    }

    const result = await Rating.aggregate([
      { $match: { vehicleId: new mongoose.Types.ObjectId(id) } },
      {
        $group: {
          _id: null,
          average: { $avg: "$stars" },
          count: { $sum: 1 },
        },
      },
    ]);

    const stats = result[0] ?? { average: 0, count: 0 };

    const recent = await Rating.find({ vehicleId: id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("stars comment createdAt")
      .lean();

    return NextResponse.json({
      average: Math.round(stats.average * 10) / 10,
      count: stats.count,
      recent,
    });
  } catch (error) {
    console.error("[VEHICLE RATINGS ERROR]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
