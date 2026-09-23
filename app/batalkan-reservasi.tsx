import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLanguage } from "../lib/LanguageContext";
import { supabase } from "../lib/supabase";

export default function BatalkanReservasiScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { reservasiId } = useLocalSearchParams<{ reservasiId: string }>();
  const [alasan, setAlasan] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const alasanList = [
    {
      key: "scheduleConflict",
      label: t("cancelReservation.reasonScheduleConflict"),
    },
    {
      key: "recoveredOrCancelled",
      label: t("cancelReservation.reasonRecoveredOrCancelled"),
    },
    {
      key: "wrongFacilityOrService",
      label: t("cancelReservation.reasonWrongFacilityOrService"),
    },
    { key: "other", label: t("cancelReservation.reasonOther") },
  ];

  const handleKonfirmasi = async () => {
    if (!alasan) return;
    setSubmitting(true);
    const { error } = await supabase
      .from("reservasi")
      .update({ status: "dibatalkan", alasan_pembatalan: alasan })
      .eq("id", reservasiId);

    setSubmitting(false);
    if (error) {
      Alert.alert(
        t("cancelReservation.failedTitle"),
        t("cancelReservation.failedMessage"),
      );
      return;
    }
    Alert.alert(
      t("cancelReservation.successTitle"),
      t("cancelReservation.successMessage"),
      [{ text: "OK", onPress: () => router.replace("/(tabs)/transaksi") }],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color="#0D9488" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t("cancelReservation.headerTitle")}
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={{ padding: 20 }}>
        <Text style={styles.label}>
          {t("cancelReservation.selectReasonLabel")}
        </Text>
        {alasanList.map((item) => {
          const active = alasan === item.label;
          return (
            <TouchableOpacity
              key={item.key}
              style={[styles.optionRow, active && styles.optionRowActive]}
              onPress={() => setAlasan(item.label)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={active ? "radio-button-on" : "radio-button-off"}
                size={20}
                color={active ? "#0D9488" : "#D0D0D0"}
              />
              <Text
                style={[styles.optionText, active && styles.optionTextActive]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}

        <View style={styles.noteBox}>
          <Ionicons name="information-circle" size={16} color="#A67A3D" />
          <Text style={styles.noteText}>
            {t("cancelReservation.refundNote")}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.confirmButton,
            !alasan && styles.confirmButtonDisabled,
          ]}
          onPress={handleKonfirmasi}
          disabled={!alasan || submitting}
          activeOpacity={0.85}
        >
          <Ionicons name="close-circle-outline" size={17} color="#fff" />
          <Text style={styles.confirmButtonText}>
            {submitting
              ? t("cancelReservation.processingButton")
              : t("cancelReservation.confirmButton")}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F6FBF9" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F1",
  },
  headerTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 16,
    color: "#0D9488",
  },
  label: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 13,
    color: "#374151",
    marginBottom: 10,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: "#F1F5F4",
  },
  optionRowActive: {
    borderColor: "#0D9488",
    backgroundColor: "#F0F9F7",
  },
  optionText: {
    flex: 1,
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 13,
    color: "#1F2937",
  },
  optionTextActive: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: "#0D6459",
  },
  noteBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#FBF3E4",
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  noteText: {
    flex: 1,
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 12,
    color: "#A67A3D",
    lineHeight: 17,
  },
  confirmButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#C6544D",
    borderRadius: 14,
    paddingVertical: 15,
    marginTop: 20,
    shadowColor: "#C6544D",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  confirmButtonDisabled: {
    backgroundColor: "#E8B4B0",
    shadowOpacity: 0,
    elevation: 0,
  },
  confirmButtonText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: "#fff",
    fontSize: 14.5,
  },
});
