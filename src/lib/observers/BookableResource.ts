import { ISubject, IObserver, VehicleStateChange } from "./ObserverInterfaces";
import { ResourceState as VehicleStatus } from "@/models/Vehicle";

interface ResourceState {
  name: VehicleStatus;
  transitionTo(context: BookableResource, next: VehicleStatus): void;
  canRemove(): boolean;
}

class AvailableState implements ResourceState {
  name: VehicleStatus = "Available";

  transitionTo(context: BookableResource, next: VehicleStatus): void {
    if (next !== "Reserved" && next !== "Maintenance") {
      throw new Error(`Invalid state transition from ${this.name} to ${next}`);
    }
    context.setState(next);
  }

  canRemove(): boolean {
    return true;
  }
}

class ReservedState implements ResourceState {
  name: VehicleStatus = "Reserved";

  transitionTo(context: BookableResource, next: VehicleStatus): void {
    if (next !== "InUse" && next !== "Available" && next !== "Maintenance") {
      throw new Error(`Invalid state transition from ${this.name} to ${next}`);
    }
    context.setState(next);
  }

  canRemove(): boolean {
    return false;
  }
}

class InUseState implements ResourceState {
  name: VehicleStatus = "InUse";

  transitionTo(context: BookableResource, next: VehicleStatus): void {
    if (next !== "Available" && next !== "Maintenance") {
      throw new Error(`Invalid state transition from ${this.name} to ${next}`);
    }
    context.setState(next);
  }

  canRemove(): boolean {
    return false;
  }
}

class MaintenanceState implements ResourceState {
  name: VehicleStatus = "Maintenance";

  transitionTo(context: BookableResource, next: VehicleStatus): void {
    if (next !== "Available") {
      throw new Error(`Invalid state transition from ${this.name} to ${next}`);
    }
    context.setState(next);
  }

  canRemove(): boolean {
    return true;
  }
}

function createState(status: VehicleStatus): ResourceState {
  switch (status) {
    case "Available":
      return new AvailableState();
    case "Reserved":
      return new ReservedState();
    case "InUse":
      return new InUseState();
    case "Maintenance":
      return new MaintenanceState();
    default:
      return new AvailableState();
  }
}

export class BookableResource implements ISubject {
  private observers: IObserver[] = [];
  private currentStatus: VehicleStatus;
  private state: ResourceState;
  private lastEvent: VehicleStateChange | null = null;
  private vehicleId: string;

  constructor(vehicleId: string, initialState: VehicleStatus);
  constructor(initialState: VehicleStatus);
  constructor(vehicleIdOrInitialState: string, initialState?: VehicleStatus) {
    this.vehicleId = initialState ? vehicleIdOrInitialState : "unknown";
    this.currentStatus = initialState ?? (vehicleIdOrInitialState as VehicleStatus);
    this.state = createState(this.currentStatus);
  }

  // ISubject -----------

  attach(observer: IObserver): void {
    if (!this.observers.includes(observer)) {
      this.observers.push(observer);
    }
  }

  detach(observer: IObserver): void {
    this.observers = this.observers.filter((o) => o !== observer);
  }

  notifyObservers(): void {
    if (!this.lastEvent) return;
    for (const observer of this.observers) {
      observer.update(this.lastEvent);
    }
  }

  // State transitions ----------

  changeState(newState: VehicleStatus, userId?: string): void {
    this.transitionTo(newState, userId);
  }

  setState(next: VehicleStatus): void {
    this.currentStatus = next;
    this.state = createState(next);
  }

  transitionTo(newState: VehicleStatus, userId?: string): void {
    const previous = this.currentStatus;
    this.state.transitionTo(this, newState);
    if (previous === this.currentStatus) return;

    this.lastEvent = {
      vehicleId: this.vehicleId,
      previousState: previous,
      newState: this.currentStatus,
      userId,
      timestamp: new Date(),
    };

    this.notifyObservers();
  }

  reserve(userId?: string): void {
    this.transitionTo("Reserved", userId);
  }

  release(userId?: string): void {
    this.transitionTo("Available", userId);
  }

  canRemove(): boolean {
    return this.state.canRemove();
  }

  get status(): VehicleStatus {
    return this.currentStatus;
  }

  getState(): VehicleStatus {
    return this.currentStatus;
  }

  getVehicleId(): string {
    return this.vehicleId;
  }
}