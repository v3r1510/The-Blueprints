import { VehicleType, ResourceState } from "@/models/Vehicle";

export interface CreateVehicleInput {
    type: VehicleType;
    zone: string;
    batteryLevel?: number;
    lat: number;
    lng: number;
    state?: ResourceState;
}

interface ResourceFactory {
    createResource(input: CreateVehicleInput): {
        type: VehicleType;
        zone: string;
        batteryLevel?: number;
        state: ResourceState;
        location: {
            type: "Point";
            coordinates: [number, number];
        };
    };
}

abstract class BaseVehicleFactory implements ResourceFactory {
    abstract vehicleType: VehicleType;

    createResource(input: CreateVehicleInput) {
        return {
            type: this.vehicleType,
            zone: input.zone,
            batteryLevel: input.batteryLevel,
            state: input.state ?? "Available",
            location: {
                type: "Point" as const,
                coordinates: [input.lng, input.lat] as [number, number],
            },
        };
    }
}

class CarFactory extends BaseVehicleFactory {
    vehicleType: VehicleType = "Car";
}

class BikeFactory extends BaseVehicleFactory {
    vehicleType: VehicleType = "Bike";
}

class ScooterFactory extends BaseVehicleFactory {
    vehicleType: VehicleType = "Scooter";
}

export class VehicleFactoryRegistry {
    private static readonly registry: Record<VehicleType, ResourceFactory> = {
        Car: new CarFactory(),
        Bike: new BikeFactory(),
        Scooter: new ScooterFactory(),
    };

    static getFactory(type: VehicleType): ResourceFactory {
        return this.registry[type];
    }
}
