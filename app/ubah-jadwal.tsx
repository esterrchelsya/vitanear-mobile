import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLanguage } from "../lib/LanguageContext";
import { supabase } from "../lib/supabase";

function nextNDays(n: number) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });
}
function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}
type Sesi = {
  id: string;
  jam_mulai: string;
  jam_selesai: string;
  kuota_slot: number;
  terpakai: number;
};

type Reservasi = {
  id: string;
  metode: "bpjs" | "umum";
  dokter_id: string | null;
  layanan_id: string;
};

export default function UbahJadwalScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { reservasiId } = useLocalSearchParams<{ reservasiId: string }>();

  const [reservasi, setReservasi] = useState<Reservasi | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const days = useMemo(() => nextNDays(7), []);
  const [selectedDate, setSelectedDate] = useState(days[0]);
  const [dokterNama, setDokterNama] = useState("");
  const [sesiList, setSesiList] = useState<Sesi[]>([]);
  const [selectedSesiId, setSelectedSesiId] = useState<string | null>(null);
  const [loadingSesi, setLoadingSesi] = useState(false);

  const HARI_LABEL = useMemo(
    () =>
      (t("selectSchedule.days") as unknown as string[]) || [
        "Min",
        "Sen",
        "Sel",
        "Rab",
        "Kam",
        "Jum",
        "Sab",
      ],
    [t],
  );
  const BULAN_LABEL = useMemo(
    () =>
      (t("selectSchedule.months") as unknown as string[]) || [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "Mei",
        "Jun",
        "Jul",
        "Agu",
        "Sep",
        "Okt",
        "Nov",
        "Des",
      ],
    [t],
  );

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("reservasi")
        .select("id, metode, dokter_id, layanan_id")
        .eq("id", reservasiId)
        .maybeSingle();
      if (data?.dokter_id) {
        const { data: dk } = await supabase
          .from("dokter")
          .select("nama")
          .eq("id", data.dokter_id)
          .maybeSingle();
        setDokterNama(dk?.nama ?? "");
      }
      setReservasi(data);
      setLoading(false);
    };
    if (reservasiId) load();
  }, [reservasiId]);

  // Metode Umum: tampilkan sesi praktik + sisa kuota (sama seperti pilih-jadwal).
  useEffect(() => {
    if (!reservasi || reservasi.metode !== "umum" || !reservasi.dokter_id)
      return;
    const load = async () => {
      setLoadingSesi(true);
      setSelectedSesiId(null);
      const [jadwalRes, reservasiRes] = await Promise.all([
        supabase
          .from("jadwal_dokter")
          .select("id, jam_mulai, jam_selesai, kuota_slot")
          .eq("dokter_id", reservasi.dokter_id)
          .eq("hari", selectedDate.getDay())
          .eq("aktif", true)
          .order("jam_mulai"),
        supabase
          .from("reservasi")
          .select("jadwal_id")
          .eq("dokter_id", reservasi.dokter_id)
          .eq("tanggal_reservasi", toDateStr(selectedDate))
          .neq("id", reservasi.id)
          .not("status", "in", "(dibatalkan,ditolak)")
          .not("jadwal_id", "is", null),
      ]);
      const terpakaiMap = new Map<string, number>();
      (reservasiRes.data || []).forEach((r) =>
        terpakaiMap.set(r.jadwal_id, (terpakaiMap.get(r.jadwal_id) ?? 0) + 1),
      );
      setSesiList(
        (jadwalRes.data || []).map((j) => ({
          ...j,
          terpakai: terpakaiMap.get(j.id) ?? 0,
        })),
      );
      setLoadingSesi(false);
    };
    load();
  }, [reservasi, selectedDate]);

  const sesiTerpilih = sesiList.find((x) => x.id === selectedSesiId) ?? null;

  const handleSimpan = async () => {
    if (!reservasi) return;
    setSubmitting(true);

    const payload =
      reservasi.metode === "bpjs"
        ? {
            tanggal_reservasi: toDateStr(selectedDate),
            status: "menunggu_verifikasi", // reset -> perlu verifikasi ulang admin
            nomor_antrean: null,
          }
        : {
            tanggal_reservasi: toDateStr(selectedDate),
            jadwal_id: sesiTerpilih?.id,
            jam_reservasi: sesiTerpilih?.jam_mulai.slice(0, 5),
          };

    const { error } = await supabase
      .from("reservasi")
      .update(payload)
      .eq("id", reservasi.id);

    setSubmitting(false);
    if (error) {
      Alert.alert("Gagal", "Perubahan jadwal gagal disimpan. Coba lagi.");
      return;
    }
    Alert.alert("Jadwal Diperbarui", "Jadwal reservasi Anda telah diubah.", [
      {
        text: "OK",
        onPress: () =>
          router.replace({
            pathname: "/reservasi/[id]",
            params: { id: reservasi.id },
          }),
      },
    ]);
  };

  if (loading || !reservasi) {
    return (
      <SafeAreaView style={styles.center} edges={["top"]}>
        <ActivityIndicator color="#0D9488" size="large" />
      </SafeAreaView>
    );
  }

  const isUmum = reservasi.metode === "umum";
  const bisaSimpan = isUmum ? !!sesiTerpilih : true;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color="#0D9488" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ubah Jadwal</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        {reservasi.metode === "bpjs" && (
          <View style={styles.noteBox}>
            <Ionicons name="information-circle" size={16} color="#92400E" />
            <Text style={styles.noteText}>
              Mengubah tanggal reservasi BPJS akan mengembalikan status ke
              "Menunggu Verifikasi" -- perlu diverifikasi ulang oleh admin
              faskes.
            </Text>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>
            {t("selectSchedule.selectDate")}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateRow}
          >
            {days.map((d) => {
              const active = toDateStr(d) === toDateStr(selectedDate);
              return (
                <TouchableOpacity
                  key={toDateStr(d)}
                  style={[styles.dateChip, active && styles.dateChipActive]}
                  onPress={() => setSelectedDate(d)}
                >
                  <Text
                    style={[styles.dateChipHari, active && { color: "#fff" }]}
                  >
                    {HARI_LABEL[d.getDay()]}
                  </Text>
                  <Text
                    style={[
                      styles.dateChipTanggal,
                      active && { color: "#fff" },
                    ]}
                  >
                    {d.getDate()}
                  </Text>
                  <Text
                    style={[styles.dateChipBulan, active && { color: "#fff" }]}
                  >
                    {BULAN_LABEL[d.getMonth()]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {isUmum && (
            <>
              <View style={styles.innerDivider} />
              <Text style={styles.sectionLabel}>
                {t("selectSchedule.selectSession")}
              </Text>
              {loadingSesi ? (
                <ActivityIndicator color="#0D9488" style={{ marginTop: 4 }} />
              ) : sesiList.length === 0 ? (
                <Text style={styles.emptyText}>
                  {t("selectSchedule.emptySession")}
                </Text>
              ) : (
                <View style={{ gap: 10 }}>
                  {sesiList.map((x) => {
                    const sisa = x.kuota_slot - x.terpakai;
                    const penuh = sisa <= 0;
                    const active = selectedSesiId === x.id;
                    return (
                      <TouchableOpacity
                        key={x.id}
                        disabled={penuh}
                        style={[
                          styles.sesiCard,
                          active && styles.sesiCardActive,
                          penuh && styles.sesiCardDisabled,
                        ]}
                        onPress={() => setSelectedSesiId(x.id)}
                      >
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              styles.sesiJam,
                              active && { color: "#fff" },
                            ]}
                          >
                            {x.jam_mulai.slice(0, 5)} -{" "}
                            {x.jam_selesai.slice(0, 5)} WIB
                          </Text>
                          <Text
                            style={[
                              styles.sesiDokter,
                              active && { color: "#E7F5F0" },
                            ]}
                          >
                            {dokterNama}
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.sesiKuota,
                            active && { color: "#fff" },
                            penuh && styles.sesiKuotaPenuh,
                          ]}
                        >
                          {penuh
                            ? t("selectSchedule.fullQuota")
                            : t("selectSchedule.remainingQuota")
                                .replace("{{remaining}}", String(sisa))
                                .replace("{{total}}", String(x.kuota_slot))}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, !bisaSimpan && styles.saveButtonDisabled]}
          onPress={handleSimpan}
          disabled={!bisaSimpan || submitting}
        >
          <Text style={styles.saveButtonText}>
            {submitting ? "Menyimpan..." : "Simpan Perubahan"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F6FBF9" },
  center: {
    flex: 1,
    backgroundColor: "#F6FBF9",
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 16,
    color: "#0D9488",
  },
  noteBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  noteText: {
    flex: 1,
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 12,
    color: "#92400E",
    lineHeight: 17,
  },
  sectionLabel: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 13,
    color: "#374151",
    marginBottom: 10,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  innerDivider: { height: 1, backgroundColor: "#F1F1F1", marginVertical: 16 },
  emptyText: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 13,
    color: "#9CA3AF",
  },
  dateRow: { gap: 8 },
  dateChip: {
    width: 56,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#EEF2F1",
  },
  dateChipActive: { backgroundColor: "#0D9488", borderColor: "#0D9488" },
  dateChipHari: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 11,
    color: "#6B7280",
  },
  dateChipTanggal: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 16,
    color: "#1F2937",
    marginTop: 2,
  },
  dateChipBulan: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 10,
    color: "#9CA3AF",
    marginTop: 1,
  },
  sesiCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#0D9488",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  sesiCardActive: { backgroundColor: "#0D9488" },
  sesiCardDisabled: { borderColor: "#E5E7EB", opacity: 0.6 },
  sesiJam: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 13.5,
    color: "#0D6459",
  },
  sesiDokter: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  sesiKuota: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 12,
    color: "#0D9488",
  },
  sesiKuotaPenuh: { color: "#EF4444" },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#EEF2F1",
  },
  saveButton: {
    backgroundColor: "#0D9488",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveButtonDisabled: { backgroundColor: "#B0D4D0" },
  saveButtonText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: "#fff",
    fontSize: 15,
  },
});
