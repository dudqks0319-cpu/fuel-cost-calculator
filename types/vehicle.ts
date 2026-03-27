export type FuelType = "gasoline" | "diesel" | "lpg" | "electric";
export type FuelMode = "all" | "fuel" | "electric";
export type MileageType = "combined" | "city" | "highway";

export type FuelPriceMap = {
  gasoline: number;
  diesel: number;
  lpg: number;
  electric: number;
};

export type MpgSet = {
  combined: number;
  city: number;
  highway: number;
};

export type FuelVehicleRecord = {
  manufacturer: string;
  model: string;
  powertrain: string;
  fuelType: Exclude<FuelType, "electric">;
  tankCapacity: number;
  mpg: MpgSet;
};

export type ElectricVehicleRecord = {
  manufacturer: string;
  model: string;
  powertrain: string;
  fuelType: "electric";
  batteryCapacity: number;
  efficiency: number;
};

export type VehicleRecord = FuelVehicleRecord | ElectricVehicleRecord;

export type VehicleDataset = {
  vehicles: VehicleRecord[];
};

export function isElectricVehicle(vehicle: VehicleRecord): vehicle is ElectricVehicleRecord {
  return vehicle.fuelType === "electric";
}

export function isFuelVehicle(vehicle: VehicleRecord): vehicle is FuelVehicleRecord {
  return vehicle.fuelType !== "electric";
}
