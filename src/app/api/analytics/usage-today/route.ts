import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Trip from "@/models/Trip";
import Vehicle from "@/models/Vehicle";

export async function GET() {
  const session = await auth();

  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden: admin access only" }, { status: 403 });
  }

  try {
    await connectDB();

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const trips = await Trip.find({
      startTime: { $gte: startOfDay, $lte: endOfDay },
    }).lean();

    const vehicleIds = trips.map((t) => t.vehicleId);
    const vehicles = await Vehicle.find(
      { _id: { $in: vehicleIds } },
      { _id: 1, type: 1 },
    ).lean();

    const vehicleTypeMap = new Map(
      vehicles.map((v) => [v._id.toString(), v.type as string]),
    );

    const buckets: Record<number, { Car: number; Bike: number; Scooter: number }> = {};
    for (let h = 0; h < 24; h++) {
      buckets[h] = { Car: 0, Bike: 0, Scooter: 0 };
    }

    for (const trip of trips) {
      const hour = new Date(trip.startTime).getHours();
      const type = vehicleTypeMap.get(trip.vehicleId.toString());
      if (type === "Car" || type === "Bike" || type === "Scooter") {
        buckets[hour][type]++;
      }
    }

    const data = Object.entries(buckets).map(([hour, counts]) => ({
      hour: parseInt(hour),
      ...counts,
    }));

    return NextResponse.json({ data });
  } catch (err) {
    console.error("[USAGE TODAY ERROR]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}