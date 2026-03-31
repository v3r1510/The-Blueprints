import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Vehicle from "@/models/Vehicle";

//slightly scatters coordinates to avoid perfect overlap on the map when multiple vehicles are at the same station
const scatter = (coord: number, variance = 0.001) =>
  coord + (Math.random() * variance * 2 - variance);

export async function GET() {
  try {
    await connectDB();
    await Vehicle.deleteMany({});

    const stations = {
      pda: [-73.5685, 45.5085], // Place-des-Arts
      mcgill: [-73.5745, 45.504], // McGill
      berri: [-73.5601, 45.5153], // Berri-UQAM
      royal: [-73.5816, 45.5242], // Mont-Royal
      concordia: [-73.579, 45.4954], // Concordia
      longueuil: [-73.5222, 45.5247], // Longueuil
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
        type: "Scooter",
        zone: "Station Berri-UQAM",
        state: "InUse",
        batteryLevel: 65,
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
      message: "Success! Vehicles seeded with accurate Montreal coordinates.",
    });
  } catch (err) {
    console.error("[SEED ERROR]", err);
    return NextResponse.json({ error: "Seed failed" }, { status: 500 });
  }
}
