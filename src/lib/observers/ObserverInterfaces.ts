export interface VehicleStateChange {
  vehicleId: string;
  previousState: string;
  newState: string;
  userId?: string;
  timestamp: Date;
}

/** Observer <<interface>> */
export interface IObserver {
  update(data: VehicleStateChange): void;
}

/** Subject <<interface>> */
export interface ISubject {
  attach(observer: IObserver): void;
  detach(observer: IObserver): void;
  notifyObservers(): void;
}