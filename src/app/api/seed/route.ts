import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Vehicle from "@/models/Vehicle";

// Helper to generate slightly scattered coordinates around a central station point
const scatter = (coord: number, variance = 0.002) => {
  return coord + (Math.random() * variance * 2 - variance);
};

export async function GET() {
  try {
    await connectDB();

    // Clear the database before seeding to avoid duplicates
    await Vehicle.deleteMany({});

    // Central coordinates for the stations
    const stations = {
      pda: [-73.568, 45.508], // Place-des-Arts
      mcgill: [-73.577, 45.504], // McGill
      berri: [-73.56, 45.515], // Berri-UQAM
      royal: [-73.582, 45.523], // Mont-Royal
      concordia: [-73.579, 45.497], // Concordia
      longueuil: [-73.522, 45.525], // Longueuil
    };

    const vehicles = [
      // --- Station Place-des-Arts ---
      {
        type: "Scooter",
        zone: "Station Place-des-Arts",
        state: "Available",
        batteryLevel: 85,
        location: {
          type: "Point",
          coordinates: [scatter(stations.pda[0]), scatter(stations.pda[1])],
        },
      },
      {
        type: "Scooter",
        zone: "Station Place-des-Arts",
        state: "Available",
        batteryLevel: 42,
        location: {
          type: "Point",
          coordinates: [scatter(stations.pda[0]), scatter(stations.pda[1])],
        },
      },
      {
        type: "Car",
        zone: "Station Place-des-Arts",
        state: "Available",
        batteryLevel: 60,
        location: {
          type: "Point",
          coordinates: [scatter(stations.pda[0]), scatter(stations.pda[1])],
        },
      },
      {
        type: "Bike",
        zone: "Station Place-des-Arts",
        state: "Reserved",
        batteryLevel: 100,
        location: {
          type: "Point",
          coordinates: [scatter(stations.pda[0]), scatter(stations.pda[1])],
        },
      },
      {
        type: "Scooter",
        zone: "Station Place-des-Arts",
        state: "Available",
        batteryLevel: 12,
        location: {
          type: "Point",
          coordinates: [scatter(stations.pda[0]), scatter(stations.pda[1])],
        },
      },

      // --- Station McGill ---
      {
        type: "Bike",
        zone: "Station McGill",
        state: "Available",
        batteryLevel: 95,
        location: {
          type: "Point",
          coordinates: [
            scatter(stations.mcgill[0]),
            scatter(stations.mcgill[1]),
          ],
        },
      },
      {
        type: "Bike",
        zone: "Station McGill",
        state: "Available",
        batteryLevel: 88,
        location: {
          type: "Point",
          coordinates: [
            scatter(stations.mcgill[0]),
            scatter(stations.mcgill[1]),
          ],
        },
      },
      {
        type: "Scooter",
        zone: "Station McGill",
        state: "Available",
        batteryLevel: 100,
        location: {
          type: "Point",
          coordinates: [
            scatter(stations.mcgill[0]),
            scatter(stations.mcgill[1]),
          ],
        },
      },
      {
        type: "Car",
        zone: "Station McGill",
        state: "Maintenance",
        batteryLevel: 5,
        location: {
          type: "Point",
          coordinates: [
            scatter(stations.mcgill[0]),
            scatter(stations.mcgill[1]),
          ],
        },
      },

      // --- Station Berri-UQAM ---
      {
        type: "Car",
        zone: "Station Berri-UQAM",
        state: "Available",
        batteryLevel: 75,
        location: {
          type: "Point",
          coordinates: [scatter(stations.berri[0]), scatter(stations.berri[1])],
        },
      },
      {
        type: "Car",
        zone: "Station Berri-UQAM",
        state: "Available",
        batteryLevel: 30,
        location: {
          type: "Point",
          coordinates: [scatter(stations.berri[0]), scatter(stations.berri[1])],
        },
      },
      {
        type: "Bike",
        zone: "Station Berri-UQAM",
        state: "Available",
        batteryLevel: 50,
        location: {
          type: "Point",
          coordinates: [scatter(stations.berri[0]), scatter(stations.berri[1])],
        },
      },
      {
        type: "Scooter",
        zone: "Station Berri-UQAM",
        state: "InUse",
        batteryLevel: 65,
        location: {
          type: "Point",
          coordinates: [scatter(stations.berri[0]), scatter(stations.berri[1])],
        },
      },
      {
        type: "Bike",
        zone: "Station Berri-UQAM",
        state: "Available",
        batteryLevel: 90,
        location: {
          type: "Point",
          coordinates: [scatter(stations.berri[0]), scatter(stations.berri[1])],
        },
      },

      // --- Station Mont-Royal ---
      {
        type: "Scooter",
        zone: "Station Mont-Royal",
        state: "Available",
        batteryLevel: 100,
        location: {
          type: "Point",
          coordinates: [scatter(stations.royal[0]), scatter(stations.royal[1])],
        },
      },
      {
        type: "Scooter",
        zone: "Station Mont-Royal",
        state: "Available",
        batteryLevel: 82,
        location: {
          type: "Point",
          coordinates: [scatter(stations.royal[0]), scatter(stations.royal[1])],
        },
      },
      {
        type: "Bike",
        zone: "Station Mont-Royal",
        state: "Available",
        batteryLevel: 15,
        location: {
          type: "Point",
          coordinates: [scatter(stations.royal[0]), scatter(stations.royal[1])],
        },
      },
      {
        type: "Car",
        zone: "Station Mont-Royal",
        state: "Reserved",
        batteryLevel: 45,
        location: {
          type: "Point",
          coordinates: [scatter(stations.royal[0]), scatter(stations.royal[1])],
        },
      },

      // --- Station Concordia ---
      {
        type: "Bike",
        zone: "Station Concordia",
        state: "Available",
        batteryLevel: 100,
        location: {
          type: "Point",
          coordinates: [
            scatter(stations.concordia[0]),
            scatter(stations.concordia[1]),
          ],
        },
      },
      {
        type: "Bike",
        zone: "Station Concordia",
        state: "Available",
        batteryLevel: 70,
        location: {
          type: "Point",
          coordinates: [
            scatter(stations.concordia[0]),
            scatter(stations.concordia[1]),
          ],
        },
      },
      {
        type: "Scooter",
        zone: "Station Concordia",
        state: "Available",
        batteryLevel: 25,
        location: {
          type: "Point",
          coordinates: [
            scatter(stations.concordia[0]),
            scatter(stations.concordia[1]),
          ],
        },
      },
      {
        type: "Car",
        zone: "Station Concordia",
        state: "Available",
        batteryLevel: 90,
        location: {
          type: "Point",
          coordinates: [
            scatter(stations.concordia[0]),
            scatter(stations.concordia[1]),
          ],
        },
      },

      // --- Station Longueuil ---
      {
        type: "Car",
        zone: "Station Longueuil",
        state: "Available",
        batteryLevel: 80,
        location: {
          type: "Point",
          coordinates: [
            scatter(stations.longueuil[0]),
            scatter(stations.longueuil[1]),
          ],
        },
      },
      {
        type: "Bike",
        zone: "Station Longueuil",
        state: "Available",
        batteryLevel: 55,
        location: {
          type: "Point",
          coordinates: [
            scatter(stations.longueuil[0]),
            scatter(stations.longueuil[1]),
          ],
        },
      },
      {
        type: "Scooter",
        zone: "Station Longueuil",
        state: "Available",
        batteryLevel: 95,
        location: {
          type: "Point",
          coordinates: [
            scatter(stations.longueuil[0]),
            scatter(stations.longueuil[1]),
          ],
        },
      },
    ];

    await Vehicle.insertMany(vehicles);

    return NextResponse.json({
      message: "Success! 25 vehicles added to your DB.",
      count: vehicles.length,
    });
  } catch (_err) {
    console.error("[SEED ERROR]", _err);
    return NextResponse.json({ error: "Seed failed" }, { status: 500 });
  }
}
