import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLanguage } from "../lib/LanguageContext";
import { supabase } from "../lib/supabase";

type Dokter = {
  id: string;
  nama: string;
  foto_url: string | null;
  biaya_konsultasi: number;
};
type JadwalRow = {
  id: string;
  dokter_id: string;
  jam_mulai: string;
  jam_selesai: string;
  kuota_slot: number;
};

type Sesi = JadwalRow & { dokter: Dokter; terpakai: number };

function nextNDays(n: number) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });
}

export default function PilihJadwalScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const params = useLocalSearchParams<{
    faskesId: string;
    faskesNama: string;
    layananId: string;
    layananNama: string;
    anggotaKeluargaId?: string;
    pasienNama?: string;
  }>();

  const [dokterList, setDokterList] = useState<Dokter[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [sesiList, setSesiList] = useState<Sesi[]>([]);
  const [selectedSesiId, setSelectedSesiId] = useState<string | null>(null);
  const [loadingDokter, setLoadingDokter] = useState(true);
  const [loadingSesi, setLoadingSesi] = useState(false);

  const days = useMemo(() => nextNDays(7), []);

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
        .from("dokter")
        .select("id, nama, foto_url, biaya_konsultasi")
        .eq("faskes_id", params.faskesId)
        .eq("layanan_id", params.layananId)
        .eq("aktif", true);
      setDokterList(data || []);
      setLoadingDokter(false);
    };
    load();
  }, [params.faskesId, params.layananId]);

  useEffect(() => {
    if (dokterList.length === 0) return;
    const load = async () => {
      setLoadingSesi(true);
      setSelectedSesiId(null);
      const tanggalStr = selectedDate.toISOString().slice(0, 10);
      const dokterIds = dokterList.map((d) => d.id);

      const [jadwalRes, reservasiRes] = await Promise.all([
        supabase
          .from("jadwal_dokter")
          .select("id, dokter_id, jam_mulai, jam_selesai, kuota_slot")
          .in("dokter_id", dokterIds)
          .eq("hari", selectedDate.getDay())
          .eq("aktif", true)
          .order("jam_mulai"),
        supabase
          .from("reservasi")
          .select("jadwal_id")
          .in("dokter_id", dokterIds)
          .eq("tanggal_reservasi", tanggalStr)
          .not("status", "in", "(dibatalkan,ditolak)")
          .not("jadwal_id", "is", null),
      ]);

      const terpakaiMap = new Map<string, number>();
      (reservasiRes.data || []).forEach((r) => {
        terpakaiMap.set(r.jadwal_id, (terpakaiMap.get(r.jadwal_id) ?? 0) + 1);
      });

      const list: Sesi[] = ((jadwalRes.data as JadwalRow[] | null) || [])
        .map((j) => {
          const dokter = dokterList.find((d) => d.id === j.dokter_id);
          if (!dokter) return null;
          return { ...j, dokter, terpakai: terpakaiMap.get(j.id) ?? 0 };
        })
        .filter((s): s is Sesi => s !== null);

      setSesiList(list);
      setLoadingSesi(false);
    };
    load();
  }, [dokterList, selectedDate]);

  const sesiTerpilih = sesiList.find((s) => s.id === selectedSesiId) ?? null;

  const handleLanjut = () => {
    if (!sesiTerpilih) return;
    router.push({
      pathname: "/konfirmasi-pembayaran",
      params: {
        faskesId: params.faskesId,
        faskesNama: params.faskesNama,
        layananId: params.layananId,
        layananNama: params.layananNama,
        dokterId: sesiTerpilih.dokter.id,
        dokterNama: sesiTerpilih.dokter.nama,
        biayaKonsultasi: String(sesiTerpilih.dokter.biaya_konsultasi),
        jadwalId: sesiTerpilih.id,
        tanggal: selectedDate.toISOString().slice(0, 10),
        jam: sesiTerpilih.jam_mulai.slice(0, 5),
        jamSelesai: sesiTerpilih.jam_selesai.slice(0, 5),
        anggotaKeluargaId: params.anggotaKeluargaId ?? "",
        pasienNama: params.pasienNama ?? "",
      },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color="#0D9488" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t("selectSchedule.headerTitle")}
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        <View style={styles.infoCard}>
          <View style={styles.infoIconWrapper}>
            <Ionicons name="medkit" size={16} color="#0D9488" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.layananNama}>{params.layananNama}</Text>
            <Text style={styles.faskesNama}>{params.faskesNama}</Text>
          </View>
        </View>

        {loadingDokter ? (
          <ActivityIndicator color="#0D9488" style={{ marginTop: 20 }} />
        ) : dokterList.length === 0 ? (
          <Text style={styles.emptyText}>
            {t("selectSchedule.emptyDoctor")}
          </Text>
        ) : (
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
                const active = d.toDateString() === selectedDate.toDateString();
                return (
                  <TouchableOpacity
                    key={d.toISOString()}
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
                      style={[
                        styles.dateChipBulan,
                        active && { color: "#fff" },
                      ]}
                    >
                      {BULAN_LABEL[d.getMonth()]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

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
                {sesiList.map((s) => {
                  const sisa = s.kuota_slot - s.terpakai;
                  const penuh = sisa <= 0;
                  const active = selectedSesiId === s.id;
                  return (
                    <TouchableOpacity
                      key={s.id}
                      disabled={penuh}
                      style={[
                        styles.sesiCard,
                        active && styles.sesiCardActive,
                        penuh && styles.sesiCardDisabled,
                      ]}
                      onPress={() => setSelectedSesiId(s.id)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[styles.sesiJam, active && { color: "#fff" }]}
                        >
                          {s.jam_mulai.slice(0, 5)} -{" "}
                          {s.jam_selesai.slice(0, 5)} WIB
                        </Text>
                        <Text
                          style={[
                            styles.sesiDokter,
                            active && { color: "#E7F5F0" },
                          ]}
                        >
                          {s.dokter.nama}
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
                              .replace("{{total}}", String(s.kuota_slot))}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {sesiTerpilih && (
        <View style={styles.footer}>
          <View>
            <Text style={styles.footerLabel}>
              {t("selectSchedule.totalFee")}
            </Text>
            <Text style={styles.footerPrice}>
              Rp
              {sesiTerpilih.dokter.biaya_konsultasi.toLocaleString(
                language === "en" ? "en-US" : "id-ID",
              )}
            </Text>
          </View>
          <TouchableOpacity style={styles.lanjutButton} onPress={handleLanjut}>
            <Text style={styles.lanjutButtonText}>
              {t("selectSchedule.continueButton")}
            </Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
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
  },
  headerTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 16,
    color: "#0D9488",
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  infoIconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#E1F5EE",
    alignItems: "center",
    justifyContent: "center",
  },
  layananNama: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 14.5,
    color: "#1F2937",
  },
  faskesNama: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  emptyText: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 13,
    color: "#9CA3AF",
    paddingHorizontal: 4,
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
  sectionLabel: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 13,
    color: "#374151",
    marginBottom: 10,
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#EEF2F1",
  },
  footerLabel: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 11.5,
    color: "#6B7280",
  },
  footerPrice: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 16,
    color: "#0D9488",
    marginTop: 2,
  },
  lanjutButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#0D9488",
    borderRadius: 14,
    paddingHorizontal: 22,
    paddingVertical: 14,
  },
  lanjutButtonText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: "#fff",
    fontSize: 14.5,
  },
});
