import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Rating from "@/models/Rating";
import Vehicle from "@/models/Vehicle";

function hasOperatorAccess(role?: string) {
  return role === "operator" || role === "admin";
}

export async function GET() {
  const session = await auth();
  if (!session || !hasOperatorAccess(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await connectDB();

    const aggregated = await Rating.aggregate([
      {
        $group: {
          _id: "$vehicleId",
          average: { $avg: "$stars" },
          count: { $sum: 1 },
          latest: { $max: "$createdAt" },
        },
      },
      { $sort: { latest: -1 } },
    ]);

    const vehicleIds = aggregated.map((r) => r._id);
    const vehicles = await Vehicle.find({ _id: { $in: vehicleIds } })
      .select("type zone")
      .lean();

    const vehicleMap = new Map(
      vehicles.map((v) => [v._id.toString(), v]),
    );

    const recentByVehicle = await Rating.aggregate([
      { $match: { vehicleId: { $in: vehicleIds } } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$vehicleId",
          latestComment: { $first: "$comment" },
          latestStars: { $first: "$stars" },
          latestDate: { $first: "$createdAt" },
        },
      },
    ]);

    const recentMap = new Map(
      recentByVehicle.map((r) => [r._id.toString(), r]),
    );

    const results = aggregated.map((entry) => {
      const id = entry._id.toString();
      const vehicle = vehicleMap.get(id);
      const recent = recentMap.get(id);

      return {
        vehicleId: id,
        type: vehicle?.type ?? "Unknown",
        zone: vehicle?.zone ?? "Unknown",
        average: Math.round(entry.average * 10) / 10,
        count: entry.count,
        latestComment: recent?.latestComment ?? null,
        latestStars: recent?.latestStars ?? null,
        latestDate: recent?.latestDate ?? null,
      };
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error("[OPERATOR RATINGS ERROR]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
