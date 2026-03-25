import { ISubject, IObserver, VehicleStateChange } from "./ObserverInterfaces";

export class BookableResource implements ISubject {
  private observers: IObserver[] = [];
  private state: string;
  private lastEvent: VehicleStateChange | null = null;

  constructor(
    private readonly vehicleId: string,
    initialState: string,
  ) {
    this.state = initialState;
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

  changeState(newState: string, userId?: string): void {
    if (newState === this.state) return;

    this.lastEvent = {
      vehicleId: this.vehicleId,
      previousState: this.state,
      newState,
      userId,
      timestamp: new Date(),
    };

    this.state = newState;
    this.notifyObservers();
  }

  getState(): string {
    return this.state;
  }

  getVehicleId(): string {
    return this.vehicleId;
  }
}