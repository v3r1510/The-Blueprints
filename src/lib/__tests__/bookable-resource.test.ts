import { BookableResource } from "@/lib/observers/BookableResource";
import {
  IObserver,
} from "@/lib/observers/ObserverInterfaces";

describe("BookableResource (State & Observer Patterns)", () => {
  let resource: BookableResource;
  let mockObserver: IObserver;

  beforeEach(() => {
    resource = new BookableResource("veh-123", "Available");
    mockObserver = {
      update: jest.fn(),
    };
  });

  it("should successfully transition from Available to Reserved and notify observers", () => {
    resource.attach(mockObserver);

    resource.reserve("user-456");

    expect(resource.status).toBe("Reserved");

    expect(mockObserver.update).toHaveBeenCalledTimes(1);
    expect(mockObserver.update).toHaveBeenCalledWith(
      expect.objectContaining({
        vehicleId: "veh-123",
        previousState: "Available",
        newState: "Reserved",
        userId: "user-456",
      }),
    );
  });

  it("should block invalid state transitions and NOT notify observers", () => {
    resource.attach(mockObserver);

    expect(() => {
      resource.changeState("InUse");
    }).toThrow("Invalid state transition from Available to InUse");

    expect(mockObserver.update).not.toHaveBeenCalled();
  });

  it("should correctly evaluate canRemove() based on state", () => {
    expect(resource.canRemove()).toBe(true);

    resource.reserve();

    expect(resource.canRemove()).toBe(false);
  });

  it("should allow detaching observers", () => {
    resource.attach(mockObserver);
    resource.detach(mockObserver);

    resource.reserve("user-1"); 

    expect(mockObserver.update).not.toHaveBeenCalled();
  });
});
