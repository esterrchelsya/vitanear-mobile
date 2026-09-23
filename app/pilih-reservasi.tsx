import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PilihReservasiScreen() {
  const router = useRouter();
  const {
    faskesId,
    faskesNama,
    layananId,
    layananNama,
    anggotaKeluargaId,
    pasienNama,
    menerimaBpjs,
  } = useLocalSearchParams<{
    faskesId: string;
    faskesNama: string;
    layananId: string;
    layananNama: string;
    anggotaKeluargaId?: string;
    pasienNama?: string;
    menerimaBpjs?: string;
  }>();

  const bisaBpjs = menerimaBpjs === "true";

  const handleMandiri = () => {
    router.push({
      pathname: "/pilih-jadwal",
      params: {
        faskesId,
        faskesNama,
        layananId,
        layananNama,
        anggotaKeluargaId: anggotaKeluargaId ?? "",
        pasienNama: pasienNama ?? "",
      },
    });
  };

  const handlePilihTanggalBpjs = () => {
    router.push({
      pathname: "/reservasi-bpjs",
      params: {
        faskesId,
        faskesNama,
        layananId,
        layananNama,
        anggotaKeluargaId: anggotaKeluargaId ?? "",
        pasienNama: pasienNama ?? "",
      },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={22} color="#0D9488" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pilih Cara Reservasi</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.infoCard}>
          <Text style={styles.layananNama}>{layananNama}</Text>
          <View style={styles.faskesRow}>
            <Ionicons name="business-outline" size={13} color="#888" />
            <Text style={styles.faskesNama}>{faskesNama}</Text>
          </View>
          {pasienNama ? (
            <View style={[styles.faskesRow, { marginTop: 4 }]}>
              <Ionicons name="person-outline" size={13} color="#0D9488" />
              <Text style={[styles.faskesNama, { color: "#0D9488" }]}>
                Untuk: {pasienNama}
              </Text>
            </View>
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.optionCard}
          onPress={handleMandiri}
          activeOpacity={0.8}
        >
          <View style={styles.optionIconWrapper}>
            <Ionicons name="card-outline" size={20} color="#0D9488" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.optionTitle}>Reservasi Mandiri</Text>
            <Text style={styles.optionDesc}>
              Pilih jadwal & jam pasti, bayar online
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#B0B0B0" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.optionCard, !bisaBpjs && styles.optionCardDisabled]}
          onPress={handlePilihTanggalBpjs}
          activeOpacity={0.8}
          disabled={!bisaBpjs}
        >
          <View
            style={[
              styles.optionIconWrapper,
              !bisaBpjs && { backgroundColor: "#F1F1F1" },
            ]}
          >
            <Ionicons
              name="calendar-outline"
              size={20}
              color={bisaBpjs ? "#0D9488" : "#B0B0B0"}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={[styles.optionTitle, !bisaBpjs && { color: "#B0B0B0" }]}
            >
              Reservasi BPJS
            </Text>
            <Text style={styles.optionDesc}>
              {bisaBpjs
                ? "Pilih tanggal, dapat nomor antrean"
                : "Faskes ini tidak menerima BPJS"}
            </Text>
          </View>
          {bisaBpjs ? (
            <Ionicons name="chevron-forward" size={18} color="#B0B0B0" />
          ) : null}
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
    backgroundColor: "#F6FBF9",
  },
  headerTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 16,
    color: "#0D9488",
  },
  content: { padding: 20, gap: 14 },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 4,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  layananNama: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 15,
    color: "#1F2937",
  },
  faskesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  faskesNama: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 12,
    color: "#6B7280",
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  optionCardDisabled: {
    shadowOpacity: 0,
    elevation: 0,
    backgroundColor: "#FAFAFA",
  },
  optionIconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#E1F5EE",
    alignItems: "center",
    justifyContent: "center",
  },
  optionTitle: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 14.5,
    color: "#1F2937",
  },
  optionDesc: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 12.5,
    color: "#6B7280",
    marginTop: 2,
  },
});
