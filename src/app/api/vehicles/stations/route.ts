import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Vehicle from "@/models/Vehicle";
import { VehicleType } from "@/models/Vehicle";

const SUPPORTED_TYPES: VehicleType[] = ["Car", "Bike", "Scooter"];

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const stations = await Vehicle.aggregate([
      {
        $group: {
          _id: {
            zone: "$zone",
            type: "$type",
          },
          totalByType: { $sum: 1 },
          availableByType: {
            $sum: { $cond: [{ $eq: ["$state", "Available"] }, 1, 0] },
          },
        },
      },
      {
        $group: {
          _id: "$_id.zone",
          total: { $sum: "$totalByType" },
          available: {
            $sum: "$availableByType",
          },
          byType: {
            $push: {
              type: "$_id.type",
              total: "$totalByType",
              available: "$availableByType",
            },
          },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          name: "$_id",
          total: 1,
          available: 1,
          byType: 1,
        },
      },
    ]);

    return NextResponse.json(
      stations.map((station) => ({
        ...station,
        creatableTypes: SUPPORTED_TYPES,
      })),
    );
  } catch (err) {
    console.error("[STATION STATUS ERROR]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
