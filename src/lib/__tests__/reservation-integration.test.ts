import { BookableResource } from "@/lib/observers/BookableResource";
import { getFactory } from "@/lib/vehicle-factory";
import { IObserver } from "@/lib/observers/ObserverInterfaces";

describe("Reservation Flow Integration", () => {
  it("should create a vehicle from the factory, observe it, and process a valid reservation", () => {
    const scooterFactory = getFactory("Scooter");
    const vehicleData = scooterFactory.create({
      zone: "Concordia Campus",
      coordinates: [-73.578, 45.495],
    });

    const bookableScooter = new BookableResource(
      "scooter-999",
      vehicleData.state,
    );

    const systemObserver: IObserver = { update: jest.fn() };
    bookableScooter.attach(systemObserver);

    bookableScooter.reserve("student-user-1");

    expect(vehicleData.type).toBe("Scooter");
    expect(bookableScooter.status).toBe("Reserved");
    expect(systemObserver.update).toHaveBeenCalledWith(
      expect.objectContaining({
        previousState: "Available",
        newState: "Reserved",
        userId: "student-user-1",
      }),
    ); 
  });
});
