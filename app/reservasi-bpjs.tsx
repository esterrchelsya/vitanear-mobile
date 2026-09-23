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

export default function ReservasiBpjsScreen() {
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

  const days = useMemo(() => nextNDays(7), []);
  const [selectedDate, setSelectedDate] = useState(days[0]);
  const [kuotaHarian, setKuotaHarian] = useState(0);
  const [terpakaiPerTanggal, setTerpakaiPerTanggal] = useState<
    Record<string, number>
  >({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const HARI_LABEL = useMemo(
    () =>
      (t("bpjsReservation.days") as unknown as string[]) || [
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
      (t("bpjsReservation.months") as unknown as string[]) || [
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
      const dateStrs = days.map(toDateStr);
      const [layananRes, reservasiRes] = await Promise.all([
        supabase
          .from("layanan_faskes")
          .select("kuota_harian")
          .eq("id", params.layananId)
          .maybeSingle(),
        supabase
          .from("reservasi")
          .select("tanggal_reservasi")
          .eq("layanan_id", params.layananId)
          .in("tanggal_reservasi", dateStrs)
          .not("status", "in", "(dibatalkan,ditolak)"),
      ]);

      setKuotaHarian(layananRes.data?.kuota_harian ?? 30);

      const counter: Record<string, number> = {};
      (reservasiRes.data || []).forEach((r) => {
        counter[r.tanggal_reservasi] = (counter[r.tanggal_reservasi] ?? 0) + 1;
      });
      setTerpakaiPerTanggal(counter);
      setLoading(false);
    };
    load();
  }, [params.layananId]);

  const sisaKuotaTerpilih =
    kuotaHarian - (terpakaiPerTanggal[toDateStr(selectedDate)] ?? 0);
  const kuotaHabis = sisaKuotaTerpilih <= 0;

  const handleAmbilAntrean = async () => {
    setSubmitting(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.from("reservasi").insert({
      user_id: user.id,
      faskes_id: params.faskesId,
      layanan_id: params.layananId,
      metode: "bpjs",
      anggota_keluarga_id: params.anggotaKeluargaId || null,
      tanggal_reservasi: toDateStr(selectedDate),
    });

    setSubmitting(false);

    if (error) {
      Alert.alert(
        t("bpjsReservation.alertFailedTitle"),
        t("bpjsReservation.alertFailedMsg"),
      );
      return;
    }

    Alert.alert(
      t("bpjsReservation.alertSuccessTitle"),
      t("bpjsReservation.alertSuccessMsg"),
      [{ text: "OK", onPress: () => router.replace("/home") }],
    );
  };

  const tanggalLabel = selectedDate.toLocaleDateString(
    language === "en" ? "en-US" : "id-ID",
    {
      weekday: "long",
      day: "2-digit",
      month: "long",
    },
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color="#0D9488" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t("bpjsReservation.headerTitle")}
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <View style={styles.iconWrapper}>
              <Ionicons name="business" size={17} color="#0D9488" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.faskesNama}>{params.faskesNama}</Text>
              <Text style={styles.layananNama}>{params.layananNama}</Text>
            </View>
          </View>

          <View style={styles.innerDivider} />
          <Text style={styles.sectionLabel}>
            {t("bpjsReservation.selectVisitDate")}
          </Text>
          {loading ? (
            <ActivityIndicator color="#0D9488" style={{ marginTop: 4 }} />
          ) : (
            <>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.dateRow}
              >
                {days.map((d) => {
                  const dateStr = toDateStr(d);
                  const active = dateStr === toDateStr(selectedDate);
                  const sisa = kuotaHarian - (terpakaiPerTanggal[dateStr] ?? 0);
                  const habis = sisa <= 0;
                  return (
                    <TouchableOpacity
                      key={dateStr}
                      style={[
                        styles.dateChip,
                        active && styles.dateChipActive,
                        habis && styles.dateChipHabis,
                      ]}
                      onPress={() => setSelectedDate(d)}
                    >
                      <Text
                        style={[
                          styles.dateChipHari,
                          active && { color: "#fff" },
                          habis && { color: "#C0C0C0" },
                        ]}
                      >
                        {HARI_LABEL[d.getDay()]}
                      </Text>
                      <Text
                        style={[
                          styles.dateChipTanggal,
                          active && { color: "#fff" },
                          habis && { color: "#C0C0C0" },
                        ]}
                      >
                        {d.getDate()}
                      </Text>
                      <Text
                        style={[
                          styles.dateChipBulan,
                          active && { color: "#fff" },
                          habis && { color: "#C0C0C0" },
                        ]}
                      >
                        {BULAN_LABEL[d.getMonth()]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <View style={styles.kuotaBox}>
                <View style={styles.kuotaDot} />
                <Text style={styles.kuotaText}>{tanggalLabel}</Text>
                <View style={styles.kuotaBadge}>
                  <Text style={styles.kuotaBadgeText}>
                    {kuotaHabis
                      ? t("bpjsReservation.quotaFull")
                      : t("bpjsReservation.remainingQuota")
                          .replace("{{remaining}}", String(sisaKuotaTerpilih))
                          .replace("{{total}}", String(kuotaHarian))}
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>

        {!loading && (
          <View style={styles.plainNote}>
            <Ionicons
              name="information-circle-outline"
              size={14}
              color="#B45309"
            />
            <Text style={styles.plainNoteText}>
              {t("bpjsReservation.infoNote")}
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            (kuotaHabis || submitting) && styles.submitButtonDisabled,
          ]}
          onPress={handleAmbilAntrean}
          disabled={kuotaHabis || submitting}
        >
          <Text style={styles.submitButtonText}>
            {submitting
              ? t("bpjsReservation.submitting")
              : t("bpjsReservation.getQueueNumber")}
          </Text>
          <Ionicons name="arrow-forward" size={16} color="#fff" />
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
  },
  headerTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 16,
    color: "#0D9488",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  innerDivider: { height: 1, backgroundColor: "#F1F1F1", marginVertical: 14 },
  iconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#E1F5EE",
    alignItems: "center",
    justifyContent: "center",
  },
  faskesNama: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 14.5,
    color: "#1F2937",
  },
  layananNama: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 12.5,
    color: "#6B7280",
    marginTop: 2,
  },
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
  dateChipHabis: { backgroundColor: "#FAFAFA" },
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
  kuotaBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
  },
  kuotaDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#0D9488",
  },
  kuotaText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 12.5,
    color: "#1F2937",
  },
  kuotaBadge: {
    backgroundColor: "#E1F5EE",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginLeft: "auto",
  },
  kuotaBadgeText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 11,
    color: "#0D9488",
  },
  plainNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    paddingHorizontal: 4,
    marginTop: 2,
  },
  plainNoteText: {
    flex: 1,
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 11.5,
    color: "#92400E",
    lineHeight: 16,
  },
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
  submitButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#0D9488",
    borderRadius: 14,
    paddingVertical: 16,
  },
  submitButtonDisabled: { backgroundColor: "#B0D4D0" },
  submitButtonText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: "#fff",
    fontSize: 15,
  },
});
