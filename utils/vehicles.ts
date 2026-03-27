import type { FuelMode, MileageType, VehicleRecord } from "@/types/vehicle";

export function filterVehiclesByMode(vehicles: VehicleRecord[], mode: FuelMode) {
  if (mode === "electric") {
    return vehicles.filter((vehicle) => vehicle.fuelType === "electric");
  }

  if (mode === "fuel") {
    return vehicles.filter((vehicle) => vehicle.fuelType !== "electric");
  }

  return vehicles;
}

function toSortedUnique(values: string[]) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right, "ko-KR"));
}

export function getManufacturers(vehicles: VehicleRecord[], mode: FuelMode) {
  return toSortedUnique(filterVehiclesByMode(vehicles, mode).map((vehicle) => vehicle.manufacturer));
}

export function getModelsForManufacturer(vehicles: VehicleRecord[], manufacturer: string, mode: FuelMode) {
  return toSortedUnique(
    filterVehiclesByMode(vehicles, mode)
      .filter((vehicle) => vehicle.manufacturer === manufacturer)
      .map((vehicle) => vehicle.model)
  );
}

export function getPowertrainsForModel(
  vehicles: VehicleRecord[],
  manufacturer: string,
  model: string,
  mode: FuelMode
) {
  return toSortedUnique(
    filterVehiclesByMode(vehicles, mode)
      .filter((vehicle) => vehicle.manufacturer === manufacturer && vehicle.model === model)
      .map((vehicle) => vehicle.powertrain)
  );
}

export function getVehicleBySelection<T extends VehicleRecord>(
  vehicles: T[],
  manufacturer?: string,
  model?: string,
  powertrain?: string
) {
  return vehicles.find(
    (vehicle) =>
      vehicle.manufacturer === manufacturer && vehicle.model === model && vehicle.powertrain === powertrain
  );
}

export function getSelectedEfficiency(vehicle: VehicleRecord | undefined, mileageType: MileageType) {
  if (!vehicle) {
    return 0;
  }

  if (vehicle.fuelType === "electric") {
    return vehicle.efficiency;
  }

  return vehicle.mpg[mileageType];
}
