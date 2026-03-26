import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Vehicle from "@/models/Vehicle";
import Trip from "@/models/Trip";
import { VehicleType, ResourceState } from "@/models/Vehicle";
import { getFactory } from "@/lib/vehicle-factory";

const STATIONS: Record<string, { name: string; coordinates: [number, number] }> = {
  pda: { name: "Station Place-des-Arts", coordinates: [-73.568, 45.508] },
  mcgill: { name: "Station McGill", coordinates: [-73.577, 45.504] },
  berri: { name: "Station Berri-UQAM", coordinates: [-73.56, 45.515] },
  royal: { name: "Station Mont-Royal", coordinates: [-73.582, 45.523] },
  concordia: { name: "Station Concordia", coordinates: [-73.579, 45.497] },
  longueuil: { name: "Station Longueuil", coordinates: [-73.522, 45.525] },
};

interface SeedEntry {
  type: VehicleType;
  station: string;
  state?: ResourceState;
  batteryLevel?: number;
}

const SEED_MANIFEST: SeedEntry[] = [
  // Station Place-des-Arts
  { type: "Scooter", station: "pda", batteryLevel: 85 },
  { type: "Scooter", station: "pda", batteryLevel: 42 },
  { type: "Car", station: "pda", batteryLevel: 60 },
  { type: "Bike", station: "pda", state: "Reserved", batteryLevel: 100 },
  { type: "Scooter", station: "pda", batteryLevel: 12 },

  // Station McGill
  { type: "Bike", station: "mcgill", batteryLevel: 95 },
  { type: "Bike", station: "mcgill", batteryLevel: 88 },
  { type: "Scooter", station: "mcgill", batteryLevel: 100 },
  { type: "Car", station: "mcgill", state: "Maintenance", batteryLevel: 5 },

  // Station Berri-UQAM
  { type: "Car", station: "berri", batteryLevel: 75 },
  { type: "Car", station: "berri", batteryLevel: 30 },
  { type: "Bike", station: "berri", batteryLevel: 50 },
  { type: "Scooter", station: "berri", state: "InUse", batteryLevel: 65 },
  { type: "Bike", station: "berri", batteryLevel: 90 },

  // Station Mont-Royal
  { type: "Scooter", station: "royal", batteryLevel: 100 },
  { type: "Scooter", station: "royal", batteryLevel: 82 },
  { type: "Bike", station: "royal", batteryLevel: 15 },
  { type: "Car", station: "royal", state: "Reserved", batteryLevel: 45 },

  // Station Concordia
  { type: "Bike", station: "concordia", batteryLevel: 100 },
  { type: "Bike", station: "concordia", batteryLevel: 70 },
  { type: "Scooter", station: "concordia", batteryLevel: 25 },
  { type: "Car", station: "concordia", batteryLevel: 90 },

  // Station Longueuil
  { type: "Car", station: "longueuil", batteryLevel: 80 },
  { type: "Bike", station: "longueuil", batteryLevel: 55 },
  { type: "Scooter", station: "longueuil", batteryLevel: 95 },
];

export async function GET() {
  try {
    await connectDB();

    // Clear both collections — stale "Reserved" trips are the root cause
    // of inflated active-rental counts across test sessions.
    await Vehicle.deleteMany({});
    await Trip.deleteMany({});

    const vehicles = SEED_MANIFEST.map((entry) => {
      const station = STATIONS[entry.station];
      const factory = getFactory(entry.type);

      return factory.create({
        zone: station.name,
        coordinates: station.coordinates,
        state: entry.state,
        batteryLevel: entry.batteryLevel,
      });
    });

    await Vehicle.insertMany(vehicles);

    return NextResponse.json({
      message: `Success! ${vehicles.length} vehicles added and all trips cleared.`,
      count: vehicles.length,
    });
  } catch (_err) {
    console.error("[SEED ERROR]", _err);
    return NextResponse.json({ error: "Seed failed" }, { status: 500 });
  }
}
