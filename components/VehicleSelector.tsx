import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { FlatList, Modal, Pressable, Text, View } from "react-native";
import { FUEL_TYPE_LABELS } from "@/utils/defaults";
import { getManufacturers, getModelsForManufacturer, getPowertrainsForModel, getSelectedEfficiency, getVehicleBySelection } from "@/utils/vehicles";
import type { FuelMode, MileageType, VehicleRecord } from "@/types/vehicle";
import { theme } from "@/theme/tokens";

export type VehicleSelectionState = {
  manufacturer: string;
  model: string;
  powertrain: string;
};

type SelectionField = "manufacturer" | "model" | "powertrain";

type PickerState = {
  field: SelectionField;
  title: string;
  options: string[];
} | null;

function FieldButton({
  disabled = false,
  label,
  onPress,
  placeholder,
  value
}: {
  disabled?: boolean;
  label: string;
  onPress: () => void;
  placeholder: string;
  value: string;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={{
        borderRadius: theme.radius.sm,
        backgroundColor: theme.colors.input,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.md,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        opacity: disabled ? 0.5 : 1
      }}
    >
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={[theme.typography.caption, { fontWeight: "600" }]}>{label}</Text>
        <Text style={[theme.typography.body, { color: value ? theme.colors.text : theme.colors.muted }]}>{value || placeholder}</Text>
      </View>
      <Ionicons color={theme.colors.muted} name="chevron-down" size={18} />
    </Pressable>
  );
}

export function VehicleSelector({
  accentColor = theme.colors.primary,
  mileageType = "combined",
  mode = "all",
  onSelectionChange,
  selection,
  vehicles
}: {
  accentColor?: string;
  mileageType?: MileageType;
  mode?: FuelMode;
  onSelectionChange: (selection: VehicleSelectionState) => void;
  selection: VehicleSelectionState;
  vehicles: VehicleRecord[];
}) {
  const [pickerState, setPickerState] = useState<PickerState>(null);
  const manufacturers = getManufacturers(vehicles, mode);
  const models = selection.manufacturer ? getModelsForManufacturer(vehicles, selection.manufacturer, mode) : [];
  const powertrains =
    selection.manufacturer && selection.model
      ? getPowertrainsForModel(vehicles, selection.manufacturer, selection.model, mode)
      : [];
  const selectedVehicle = getVehicleBySelection(
    vehicles,
    selection.manufacturer,
    selection.model,
    selection.powertrain
  );
  const selectedEfficiency = getSelectedEfficiency(selectedVehicle, mileageType);

  function updateSelection(field: SelectionField, value: string) {
    if (field === "manufacturer") {
      onSelectionChange({
        manufacturer: value,
        model: "",
        powertrain: ""
      });
      return;
    }

    if (field === "model") {
      onSelectionChange({
        ...selection,
        model: value,
        powertrain: ""
      });
      return;
    }

    onSelectionChange({
      ...selection,
      powertrain: value
    });
  }

  function currentFieldValue(field: SelectionField) {
    return selection[field];
  }

  return (
    <View style={{ gap: theme.spacing.sm }}>
      <FieldButton
        label="제조사"
        onPress={() => setPickerState({ field: "manufacturer", title: "제조사를 선택해주세요", options: manufacturers })}
        placeholder="제조사를 선택하세요"
        value={selection.manufacturer}
      />
      <FieldButton
        disabled={!selection.manufacturer}
        label="모델"
        onPress={() => setPickerState({ field: "model", title: "모델을 선택해주세요", options: models })}
        placeholder="모델을 선택하세요"
        value={selection.model}
      />
      <FieldButton
        disabled={!selection.model}
        label="파워트레인"
        onPress={() => setPickerState({ field: "powertrain", title: "파워트레인을 선택해주세요", options: powertrains })}
        placeholder="파워트레인을 선택하세요"
        value={selection.powertrain}
      />

      {selectedVehicle ? (
        <View
          style={{
            borderRadius: theme.radius.sm,
            backgroundColor: `${accentColor}12`,
            padding: theme.spacing.md,
            gap: 4
          }}
        >
          <Text style={[theme.typography.body, { color: theme.colors.text, fontWeight: "600" }]}>
            {selectedVehicle.model} {selectedVehicle.powertrain}
          </Text>
          <Text style={theme.typography.caption}>
            {FUEL_TYPE_LABELS[selectedVehicle.fuelType]} |{" "}
            {selectedVehicle.fuelType === "electric"
              ? `${selectedEfficiency.toFixed(1)}km/kWh`
              : `${mileageType === "combined" ? "복합" : mileageType === "city" ? "도심" : "고속"} ${selectedEfficiency.toFixed(1)}km/L`}
          </Text>
        </View>
      ) : null}

      <Modal animationType="slide" transparent visible={pickerState !== null}>
        <Pressable
          onPress={() => setPickerState(null)}
          style={{
            flex: 1,
            backgroundColor: theme.colors.overlay,
            justifyContent: "flex-end"
          }}
        >
          <Pressable
            onPress={(event) => event.stopPropagation()}
            style={{
              backgroundColor: theme.colors.card,
              borderTopLeftRadius: theme.radius.lg,
              borderTopRightRadius: theme.radius.lg,
              paddingHorizontal: theme.spacing.lg,
              paddingVertical: theme.spacing.md,
              maxHeight: "60%",
              gap: theme.spacing.sm
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <Text style={[theme.typography.subtitle, { color: theme.colors.text }]}>{pickerState?.title}</Text>
              <Pressable onPress={() => setPickerState(null)}>
                <Ionicons color={theme.colors.muted} name="close" size={22} />
              </Pressable>
            </View>
            <FlatList
              data={pickerState?.options ?? []}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    if (pickerState) {
                      updateSelection(pickerState.field, item);
                    }
                    setPickerState(null);
                  }}
                  style={{
                    paddingVertical: theme.spacing.md,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.colors.border,
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <Text style={[theme.typography.body, { color: theme.colors.text }]}>{item}</Text>
                  {pickerState && currentFieldValue(pickerState.field) === item ? (
                    <Ionicons color={accentColor} name="checkmark" size={18} />
                  ) : null}
                </Pressable>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
