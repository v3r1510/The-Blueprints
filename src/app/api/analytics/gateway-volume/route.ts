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

    // Build 24-hour buckets for today using Toronto local time (same as revenue-today)
    const TZ = "America/Toronto";
    const now = new Date();
    const localDateStr = now.toLocaleDateString("en-CA", { timeZone: TZ });
    const getOffsetMs = (date: Date) => {
      const utc = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
      const local = new Date(date.toLocaleString("en-US", { timeZone: TZ }));
      return utc.getTime() - local.getTime();
    };
    const startOfDay = new Date(`${localDateStr}T00:00:00`);
    const endOfDay = new Date(`${localDateStr}T23:59:59.999`);
    startOfDay.setTime(startOfDay.getTime() + getOffsetMs(startOfDay));
    endOfDay.setTime(endOfDay.getTime() + getOffsetMs(endOfDay));

    const raw = await GatewayEvent.aggregate([
      { $match: { createdAt: { $gte: startOfDay, $lte: endOfDay } } },
      {
        $group: {
          _id: {
            hour: { $hour: { date: "$createdAt", timezone: "America/Toronto" } },
            status: "$status",
          },
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
