import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Vehicle from "@/models/Vehicle";

export async function GET() {
  try {
    await connectDB();
    await Vehicle.deleteMany({}); // Clear old data

    const vehicles = [
      {
        type: "Scooter",
        zone: "Station Place-des-Arts",
        state: "Available",
        batteryLevel: 85,
        location: { type: "Point", coordinates: [-73.568, 45.508] },
      },
      {
        type: "Scooter",
        zone: "Station Place-des-Arts",
        state: "Available",
        batteryLevel: 12,
        location: { type: "Point", coordinates: [-73.569, 45.507] },
      },
      {
        type: "Bike",
        zone: "Station McGill",
        state: "Available",
        batteryLevel: 95,
        location: { type: "Point", coordinates: [-73.577, 45.504] },
      },
      {
        type: "Car",
        zone: "Station Berri-UQAM",
        state: "Available",
        batteryLevel: 60,
        location: { type: "Point", coordinates: [-73.56, 45.515] },
      },
      {
        type: "Scooter",
        zone: "Station Mont-Royal",
        state: "Available",
        batteryLevel: 45,
        location: { type: "Point", coordinates: [-73.582, 45.523] },
      },
    ];

    await Vehicle.insertMany(vehicles);
    return NextResponse.json({
      message: "Success! 5 vehicles added to your DB.",
    });
  } catch (_err) {
    return NextResponse.json({ error: "Seed failed" }, { status: 500 });
  }
}
