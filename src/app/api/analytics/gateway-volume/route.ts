import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import GatewayEvent from "@/models/GatewayEvent";

export async function GET() {
  const session = await auth();

  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden: admin access only" }, { status: 403 });
  }

  try {
    await connectDB();

    // Build 24-hour buckets for today (success + failure per hour)
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const raw = await GatewayEvent.aggregate([
      { $match: { createdAt: { $gte: startOfDay, $lte: endOfDay } } },
      {
        $group: {
          _id: { hour: { $hour: "$createdAt" }, status: "$status" },
          count: { $sum: 1 },
        },
      },
    ]);

    // Fill all 24 hours so the chart always has a full x-axis
    const buckets: { hour: number; success: number; failure: number }[] = Array.from(
      { length: 24 },
      (_, h) => ({ hour: h, success: 0, failure: 0 }),
    );

    for (const row of raw) {
      const h: number = row._id.hour;
      if (row._id.status === "success") buckets[h].success = row.count;
      else buckets[h].failure = row.count;
    }

    return NextResponse.json({ data: buckets });
  } catch (err) {
    console.error("[GATEWAY VOLUME ERROR]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
