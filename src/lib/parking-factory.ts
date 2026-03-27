import { ParkingResourceState } from "@/models/ParkingSpot";

export interface ParkingInput {
  zone: string;
  lotNumber: string;
  coordinates: [number, number];
  state?: ParkingResourceState;
  flatRate?: number;
}

export interface ParkingSpotData {
  lotNumber: string;
  zone: string;
  state: ParkingResourceState;
  flatRate: number;
  location: {
    type: "Point";
    coordinates: [number, number];
  };
}

/** Factory Method: creates parking spot payloads for the catalog (DB). */
export interface ParkingFactory {
  create(input: ParkingInput): ParkingSpotData;
}

function scatter(coord: number, variance = 0.0015): number {
  return coord + (Math.random() * variance * 2 - variance);
}

function scatterCoords(coords: [number, number]): [number, number] {
  return [scatter(coords[0]), scatter(coords[1])];
}

export class StandardParkingFactory implements ParkingFactory {
  create(input: ParkingInput): ParkingSpotData {
    return {
      lotNumber: input.lotNumber,
      zone: input.zone,
      state: input.state ?? "Available",
      flatRate: input.flatRate ?? 5,
      location: { type: "Point", coordinates: scatterCoords(input.coordinates) },
    };
  }
}

const factory = new StandardParkingFactory();

export function createParkingSpotData(input: ParkingInput): ParkingSpotData {
  return factory.create(input);
}
