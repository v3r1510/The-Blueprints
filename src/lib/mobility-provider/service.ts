import Vehicle, { IVehicle, ResourceState } from "@/models/Vehicle";
import {
  CreateVehicleInput,
  VehicleFactoryRegistry,
} from "@/lib/mobility-provider/factory";
import { BookableResource } from "@/lib/mobility-provider/state";

export interface UpdateVehicleInput {
  zone?: string;
  batteryLevel?: number;
  lat?: number;
  lng?: number;
  state?: ResourceState;
}

class MobilityProviderService {
  async listVehicles() {
    return Vehicle.find({}).sort({ createdAt: -1 });
  }

  async addVehicle(input: CreateVehicleInput) {
    const factory = VehicleFactoryRegistry.getFactory(input.type);
    const resourceState = new BookableResource("Available");
    if (input.state && input.state !== "Available") {
      resourceState.transitionTo(input.state);
    }

    const resource = factory.createResource({
      ...input,
      state: resourceState.status,
    });
    return Vehicle.create(resource);
  }

  async updateVehicle(vehicleId: string, input: UpdateVehicleInput) {
    const update: {
      zone?: string;
      batteryLevel?: number;
      state?: ResourceState;
      location?: { type: "Point"; coordinates: [number, number] };
    } = {};

    if (input.zone !== undefined) update.zone = input.zone;
    if (input.batteryLevel !== undefined) update.batteryLevel = input.batteryLevel;
    if (input.state !== undefined) {
      const existing = await Vehicle.findById(vehicleId).select("state");
      if (!existing) {
        throw new Error("Vehicle not found");
      }

      const bookableResource = new BookableResource(existing.state);
      bookableResource.transitionTo(input.state);
      update.state = bookableResource.status;
    }

    if (input.lat !== undefined && input.lng !== undefined) {
      update.location = {
        type: "Point",
        coordinates: [input.lng, input.lat],
      };
    }

    const vehicle = await Vehicle.findByIdAndUpdate(vehicleId, update, {
      new: true,
      runValidators: true,
    });

    if (!vehicle) {
      throw new Error("Vehicle not found");
    }

    return vehicle;
  }

  async removeVehicle(vehicleId: string) {
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      throw new Error("Vehicle not found");
    }

    const bookableResource = new BookableResource(vehicle.state);
    if (!bookableResource.canRemove()) {
      throw new Error("Cannot remove a reserved or in-use vehicle");
    }

    await Vehicle.findByIdAndDelete(vehicleId);
    return vehicle;
  }

  async reserveVehicle(vehicleId: string) {
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      throw new Error("Vehicle not found");
    }

    const bookableResource = new BookableResource(vehicle.state);
    bookableResource.reserve();

    vehicle.state = bookableResource.status;
    await vehicle.save();

    return vehicle;
  }
}

let instance: MobilityProviderService | null = null;

export function getMobilityProviderService() {
  if (!instance) {
    instance = new MobilityProviderService();
  }
  return instance;
}

export function serializeVehicle(vehicle: IVehicle) {
  return {
    _id: vehicle._id.toString(),
    type: vehicle.type,
    state: vehicle.state,
    batteryLevel: vehicle.batteryLevel,
    zone: vehicle.zone,
    location: vehicle.location,
    createdAt: vehicle.createdAt,
    updatedAt: vehicle.updatedAt,
  };
}
