import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
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

const BIAYA_LAYANAN = 2000; // biaya platform flat, sementara hardcode
const METODE_BAYAR = [
  {
    key: "qris",
    label: "QRIS",
    icon: "qr-code-outline" as const,
    rekomendasi: true,
  },
  { key: "ewallet", label: "e-Wallet", icon: "wallet-outline" as const },
  { key: "va", label: "Virtual Account", icon: "business-outline" as const },
];

function formatRupiah(n: number) {
  return `Rp${n.toLocaleString("id-ID")}`;
}

export default function KonfirmasiPembayaranScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const params = useLocalSearchParams<{
    faskesId: string;
    faskesNama: string;
    layananId: string;
    layananNama: string;
    dokterId: string;
    dokterNama: string;
    biayaKonsultasi: string;
    jadwalId: string;
    tanggal: string;
    jam: string;
    jamSelesai: string;
    anggotaKeluargaId?: string;
    pasienNama?: string;
  }>();

  const [metode, setMetode] = useState("qris");
  const [detik, setDetik] = useState(4 * 60 - 1); // 03:59
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (detik <= 0) return;
    const tTimer = setTimeout(() => setDetik((d) => d - 1), 1000);
    return () => clearTimeout(tTimer);
  }, [detik]);

  const biayaKonsultasi = Number(params.biayaKonsultasi) || 0;
  const total = biayaKonsultasi + BIAYA_LAYANAN;
  const menit = String(Math.floor(detik / 60)).padStart(2, "0");
  const sisaDetik = String(detik % 60).padStart(2, "0");

  const locale = language === "en" ? "en-US" : "id-ID";
  const tanggalLabel = new Date(params.tanggal).toLocaleDateString(locale, {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });

  // MOCK: belum terhubung payment gateway asli. Nanti tinggal ganti bagian
  // ini dengan panggilan API gateway sebelum insert status "dibayar".
  const handleBayar = async () => {
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
      dokter_id: params.dokterId,
      jadwal_id: params.jadwalId,
      metode: "umum",
      status: "dibayar", // simulasi -- ganti alur ini saat gateway asli aktif
      payment_status: metode,
      jumlah_bayar: total,
      anggota_keluarga_id: params.anggotaKeluargaId || null,
      tanggal_reservasi: params.tanggal,
      jam_reservasi: params.jam,
    });

    setSubmitting(false);

    if (error) {
      // Trigger cek_kuota_sesi() menolak lewat RAISE EXCEPTION biasa
      if (error.message?.includes("Kuota sesi ini sudah penuh")) {
        Alert.alert(
          t("confirmPayment.sessionFullTitle"),
          t("confirmPayment.sessionFullMessage"),
          [{ text: "OK", onPress: () => router.back() }],
        );
        return;
      }
      if (error.message?.includes("Kuota harian layanan ini sudah penuh")) {
        Alert.alert(
          t("confirmPayment.dailyQuotaFullTitle"),
          t("confirmPayment.dailyQuotaFullMessage"),
          [{ text: "OK", onPress: () => router.back() }],
        );
        return;
      }
      Alert.alert(
        t("confirmPayment.failedTitle"),
        t("confirmPayment.failedMessage"),
      );
      return;
    }

    Alert.alert(
      t("confirmPayment.successTitle"),
      t("confirmPayment.successMessage"),
      [{ text: "OK", onPress: () => router.replace("/home") }],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color="#0D9488" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t("confirmPayment.headerTitle")}
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        <View style={styles.timerBox}>
          <Ionicons name="time-outline" size={15} color="#B45309" />
          <Text style={styles.timerText}>
            {t("confirmPayment.slotTimer").replace(
              "{time}",
              `${menit}:${sisaDetik}`,
            )}
          </Text>
        </View>

        <Text style={styles.sectionLabel}>
          {t("confirmPayment.bookingDetail")}
        </Text>
        <View style={styles.card}>
          <Text style={styles.dokterNama}>{params.dokterNama}</Text>
          <Text style={styles.metaText}>
            {params.layananNama} · {params.faskesNama}
          </Text>
          <View style={styles.jadwalRow}>
            <Ionicons name="calendar-outline" size={14} color="#0D9488" />
            <Text style={styles.jadwalText}>
              {tanggalLabel} · {params.jam} - {params.jamSelesai} WIB
            </Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>
          {t("confirmPayment.selectPaymentMethod")}
        </Text>
        <View style={styles.card}>
          {METODE_BAYAR.map((m, idx) => {
            const active = metode === m.key;
            return (
              <TouchableOpacity
                key={m.key}
                style={[
                  styles.metodeRow,
                  idx !== METODE_BAYAR.length - 1 && styles.metodeRowBorder,
                ]}
                onPress={() => setMetode(m.key)}
              >
                <Ionicons
                  name={active ? "radio-button-on" : "radio-button-off"}
                  size={20}
                  color={active ? "#0D9488" : "#D0D0D0"}
                />
                <Text style={styles.metodeLabel}>{m.label}</Text>
                {m.rekomendasi && (
                  <View style={styles.rekomendasiBadge}>
                    <Text style={styles.rekomendasiText}>
                      {t("confirmPayment.recommendation")}
                    </Text>
                  </View>
                )}
                <Ionicons name={m.icon} size={18} color="#6B7280" />
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>
          {t("confirmPayment.paymentSummary")}
        </Text>
        <View style={styles.card}>
          <View style={styles.rincianRow}>
            <Text style={styles.rincianLabel}>
              {t("confirmPayment.consultationFee")}
            </Text>
            <Text style={styles.rincianValue}>
              {formatRupiah(biayaKonsultasi)}
            </Text>
          </View>
          <View style={styles.rincianRow}>
            <Text style={styles.rincianLabel}>
              {t("confirmPayment.serviceFee")}
            </Text>
            <Text style={styles.rincianValue}>
              {formatRupiah(BIAYA_LAYANAN)}
            </Text>
          </View>
          <View style={[styles.rincianRow, styles.rincianRowTotal]}>
            <Text style={styles.totalLabel}>{t("confirmPayment.total")}</Text>
            <Text style={styles.totalValue}>{formatRupiah(total)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.bayarButton}
          onPress={handleBayar}
          disabled={submitting}
        >
          <Ionicons name="lock-closed" size={15} color="#fff" />
          <Text style={styles.bayarButtonText}>
            {submitting
              ? t("confirmPayment.processingButton")
              : t("confirmPayment.payNowButton")}
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
  },
  headerTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 16,
    color: "#0D9488",
  },
  timerBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 18,
  },
  timerText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 12.5,
    color: "#92400E",
  },
  sectionLabel: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 13,
    color: "#374151",
    marginBottom: 8,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  dokterNama: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 15,
    color: "#1F2937",
  },
  metaText: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 12.5,
    color: "#6B7280",
    marginTop: 2,
  },
  jadwalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
  },
  jadwalText: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 12.5,
    color: "#0D9488",
  },
  metodeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
  },
  metodeRowBorder: { borderBottomWidth: 1, borderBottomColor: "#F1F1F1" },
  metodeLabel: {
    flex: 1,
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 13.5,
    color: "#1F2937",
  },
  rekomendasiBadge: {
    backgroundColor: "#E1F5EE",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 8,
  },
  rekomendasiText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 10,
    color: "#0D9488",
  },
  rincianRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  rincianRowTotal: {
    borderTopWidth: 1,
    borderTopColor: "#F1F1F1",
    marginTop: 6,
    paddingTop: 12,
  },
  rincianLabel: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 13,
    color: "#6B7280",
  },
  rincianValue: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 13,
    color: "#1F2937",
  },
  totalLabel: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 14,
    color: "#1F2937",
  },
  totalValue: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 15,
    color: "#0D9488",
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
  bayarButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#0D9488",
    borderRadius: 14,
    paddingVertical: 16,
  },
  bayarButtonText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: "#fff",
    fontSize: 15,
  },
});
