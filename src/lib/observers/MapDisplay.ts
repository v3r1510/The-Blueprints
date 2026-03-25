import { IObserver, VehicleStateChange } from "./ObserverInterfaces";

export class MapDisplay implements IObserver {
  private pendingUpdates: Map<string, VehicleStateChange> = new Map();

  // IObserver ----------

  update(data: VehicleStateChange): void {
    this.pendingUpdates.set(data.vehicleId, data);
    console.log(
      `[MapDisplay] Vehicle ${data.vehicleId} changed: ${data.previousState} → ${data.newState}`,
    );
    this.renderIcons();
  }

  toggleView(resourceType: string): void {
    console.log(`[MapDisplay] Toggling view to resource type: ${resourceType}`);
  }

  displayVehicleInfo(vehicleId?: string): void {
    const update = vehicleId
      ? this.pendingUpdates.get(vehicleId)
      : [...this.pendingUpdates.values()].at(-1);

    if (!update) return;
    console.log(
      `[MapDisplay] Displaying info for vehicle ${update.vehicleId} — state: ${update.newState}`,
    );
  }

  renderIcons(): void {
    const summary = [...this.pendingUpdates.entries()]
      .map(([id, e]) => `${id}:${e.newState}`)
      .join(", ");
    console.log(`[MapDisplay] Rendering icons — ${summary || "no pending updates"}`);
  }

  flushUpdates(): VehicleStateChange[] {
    const updates = [...this.pendingUpdates.values()];
    this.pendingUpdates.clear();
    return updates;
  }
}