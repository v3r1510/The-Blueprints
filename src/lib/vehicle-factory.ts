import { VehicleType, ResourceState } from "@/models/Vehicle";

interface VehicleInput {
  zone: string;
  coordinates: [number, number];
  state?: ResourceState;
  batteryLevel?: number;
}

interface VehicleData {
  type: VehicleType;
  zone: string;
  state: ResourceState;
  batteryLevel: number;
  location: {
    type: "Point";
    coordinates: [number, number];
  };
}

export interface ResourceFactory {
  readonly vehicleType: VehicleType;
  create(input: VehicleInput): VehicleData;
}

function scatter(coord: number, variance = 0.002): number {
  return coord + (Math.random() * variance * 2 - variance);
}

function scatterCoords(coords: [number, number]): [number, number] {
  return [scatter(coords[0]), scatter(coords[1])];
}

class CarFactory implements ResourceFactory {
  readonly vehicleType: VehicleType = "Car";

  create(input: VehicleInput): VehicleData {
    return {
      type: this.vehicleType,
      zone: input.zone,
      state: input.state ?? "Available",
      batteryLevel: input.batteryLevel ?? Math.floor(Math.random() * 51) + 50,
      location: { type: "Point", coordinates: scatterCoords(input.coordinates) },
    };
  }
}

class BikeFactory implements ResourceFactory {
  readonly vehicleType: VehicleType = "Bike";

  create(input: VehicleInput): VehicleData {
    return {
      type: this.vehicleType,
      zone: input.zone,
      state: input.state ?? "Available",
      batteryLevel: input.batteryLevel ?? 100,
      location: { type: "Point", coordinates: scatterCoords(input.coordinates) },
    };
  }
}

class ScooterFactory implements ResourceFactory {
  readonly vehicleType: VehicleType = "Scooter";

  create(input: VehicleInput): VehicleData {
    return {
      type: this.vehicleType,
      zone: input.zone,
      state: input.state ?? "Available",
      batteryLevel: input.batteryLevel ?? Math.floor(Math.random() * 76) + 25,
      location: { type: "Point", coordinates: scatterCoords(input.coordinates) },
    };
  }
}

const factories: Record<VehicleType, ResourceFactory> = {
  Car: new CarFactory(),
  Bike: new BikeFactory(),
  Scooter: new ScooterFactory(),
};

export function getFactory(type: VehicleType): ResourceFactory {
  return factories[type];
}
