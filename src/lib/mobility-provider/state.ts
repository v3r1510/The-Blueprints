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

export class BookableResource {
    private currentStatus: VehicleStatus;
    private state: ResourceState;

    constructor(initialStatus: VehicleStatus) {
        this.currentStatus = initialStatus;
        this.state = createState(initialStatus);
    }

    get status(): VehicleStatus {
        return this.currentStatus;
    }

    setState(next: VehicleStatus): void {
        this.currentStatus = next;
        this.state = createState(next);
    }

    reserve(): void {
        this.state.transitionTo(this, "Reserved");
    }

    release(): void {
        this.state.transitionTo(this, "Available");
    }

    transitionTo(next: VehicleStatus): void {
        this.state.transitionTo(this, next);
    }

    canRemove(): boolean {
        return this.state.canRemove();
    }
}
