import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Trip from "@/models/Trip";
import { RevenueObserver } from "@/lib/observers/RevenueObserver";

const TZ = "America/Toronto";

function getLocalDayBounds(): { startOfDay: Date; endOfDay: Date } {
  const now = new Date();
  const localDateStr = now.toLocaleDateString("en-CA", { timeZone: TZ });

  const startOfDay = new Date(`${localDateStr}T00:00:00`);
  const endOfDay   = new Date(`${localDateStr}T23:59:59.999`);

  const offsetMs = getTimezoneOffsetMs(TZ, startOfDay);
  startOfDay.setTime(startOfDay.getTime() + offsetMs);
  endOfDay.setTime(endOfDay.getTime() + offsetMs);

  return { startOfDay, endOfDay };
}

function getTimezoneOffsetMs(tz: string, date: Date): number {
  const utcStr   = date.toLocaleString("en-US", { timeZone: "UTC" });
  const localStr = date.toLocaleString("en-US", { timeZone: tz });
  return new Date(utcStr).getTime() - new Date(localStr).getTime();
}

export async function GET() {
  const session = await auth();

  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden: admin access only" }, { status: 403 });
  }

  try {
    await connectDB();

    const { startOfDay, endOfDay } = getLocalDayBounds();

    // aggregate across ALL trip types (vehicle and parking both store totalFare)
    const result = await Trip.aggregate([
      {
        $match: {
          status: "Completed",
          endTime: { $gte: startOfDay, $lte: endOfDay },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalFare" },
          vehicleTrips: {
            $sum: { $cond: [{ $eq: ["$resourceType", "vehicle"] }, 1, 0] },
          },
          parkingTrips: {
            $sum: { $cond: [{ $eq: ["$resourceType", "parking"] }, 1, 0] },
          },
          tripCount: { $sum: 1 },
        },
      },
    ]);

    const totalRevenue  = result[0] ? Math.round(result[0].totalRevenue * 100) / 100 : 0;
    const tripCount     = result[0]?.tripCount    ?? 0;
    const vehicleTrips  = result[0]?.vehicleTrips ?? 0;
    const parkingTrips  = result[0]?.parkingTrips ?? 0;

    RevenueObserver.getInstance().setTodayRevenue(totalRevenue);

    return NextResponse.json({ totalRevenue, tripCount, vehicleTrips, parkingTrips });
  } catch (err) {
    console.error("[REVENUE TODAY ERROR]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}