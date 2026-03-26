import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Vehicle from "@/models/Vehicle";

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
          _id: "$zone",
          total: { $sum: 1 },
          available: {
            $sum: { $cond: [{ $eq: ["$state", "Available"] }, 1, 0] },
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
        },
      },
    ]);

    return NextResponse.json(stations);
  } catch (err) {
    console.error("[STATION STATUS ERROR]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
