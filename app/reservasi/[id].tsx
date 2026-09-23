import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLanguage } from "../../lib/LanguageContext";
import { supabase } from "../../lib/supabase";

const BG_LAYAR = "#F6FBF9";

type ReservasiDetail = {
  id: string;
  status: string;
  metode: "bpjs" | "umum";
  nomor_antrean: string | null;
  kode_tiket: string;
  tanggal_reservasi: string;
  jam_reservasi: string | null;
  catatan_admin: string | null;
  faskes_id: string;
  faskes: { nama: string; alamat: string | null } | null;
  layanan_faskes: { nama_layanan: string } | null;
  dokter: { nama: string } | null;
  anggota_keluarga: { nama: string } | null;
};

type Kelompok = "pending" | "confirmed" | "ditolak" | "dibatalkan" | "selesai";

function getKelompok(data: ReservasiDetail): Kelompok {
  if (data.status === "ditolak") return "ditolak";
  if (data.status === "dibatalkan") return "dibatalkan";
  if (data.status === "selesai") return "selesai";
  if (data.nomor_antrean) return "confirmed";
  return "pending";
}

type StatusStyleEntry = {
  bg: string;
  text: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const STATUS_STYLE: Record<Kelompok, StatusStyleEntry> = {
  pending: { bg: "#FBF3E4", text: "#A67A3D", icon: "time-outline" },
  confirmed: {
    bg: "#E7F5F0",
    text: "#3A8F6E",
    icon: "checkmark-circle-outline",
  },
  ditolak: { bg: "#FBEBEA", text: "#B86A64", icon: "close-circle-outline" },
  dibatalkan: { bg: "#F1F5F4", text: "#6B7280", icon: "ban-outline" },
  selesai: { bg: "#F1F5F4", text: "#4B5563", icon: "checkmark-done-outline" },
};

export default function TiketReservasiScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [data, setData] = useState<ReservasiDetail | null>(null);
  const [sudahDiulas, setSudahDiulas] = useState(false);
  const [loading, setLoading] = useState(true);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [alasan, setAlasan] = useState<string | null>(null);
  const [submittingCancel, setSubmittingCancel] = useState(false);

  const load = async () => {
    const { data: row } = await supabase
      .from("reservasi")
      .select(
        `id, status, metode, nomor_antrean, kode_tiket, tanggal_reservasi, jam_reservasi, catatan_admin, faskes_id,
         faskes:faskes_id ( nama, alamat ),
         layanan_faskes:layanan_id ( nama_layanan ),
         dokter:dokter_id ( nama ),
         anggota_keluarga:anggota_keluarga_id ( nama )`,
      )
      .eq("id", id)
      .maybeSingle();
    setData(row as unknown as ReservasiDetail);

    if (row?.status === "selesai") {
      const { data: ulasan } = await supabase
        .from("ulasan")
        .select("id")
        .eq("reservasi_id", id)
        .maybeSingle();
      setSudahDiulas(!!ulasan);
    }
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      if (id) {
        load();
      } else {
        setLoading(false);
      }
    }, [id]),
  );

  const handleKonfirmasiBatal = async () => {
    if (!alasan || !data) return;
    setSubmittingCancel(true);
    const { error } = await supabase
      .from("reservasi")
      .update({ status: "dibatalkan", alasan_pembatalan: alasan })
      .eq("id", data.id);
    setSubmittingCancel(false);

    if (error) {
      Alert.alert(
        t("ticketDetail.cancelModal.failedTitle"),
        t("ticketDetail.cancelModal.failedMessage"),
      );
      return;
    }

    setShowCancelModal(false);
    setAlasan(null);
    Alert.alert(
      t("ticketDetail.cancelModal.successTitle"),
      t("ticketDetail.cancelModal.successMessage"),
      [{ text: "OK", onPress: () => router.replace("/(tabs)/transaksi") }],
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center} edges={["top"]}>
        <ActivityIndicator color="#0D9488" size="large" />
      </SafeAreaView>
    );
  }
  if (!data) {
    return (
      <SafeAreaView style={styles.center} edges={["top"]}>
        <Text style={styles.emptyText}>{t("ticketDetail.ticketNotFound")}</Text>
      </SafeAreaView>
    );
  }

  const kelompok = getKelompok(data);
  const status = STATUS_STYLE[kelompok];
  const bisaDiubah = !["selesai", "dibatalkan", "ditolak"].includes(
    data.status,
  );
  const tampilkanTiket = kelompok === "pending" || kelompok === "confirmed";
  const namaPasien = data.anggota_keluarga?.nama ?? t("ticketDetail.myself");

  const locale = language === "en" ? "en-US" : "id-ID";
  const tanggalLabel = new Date(data.tanggal_reservasi).toLocaleDateString(
    locale,
    { weekday: "long", day: "2-digit", month: "long", year: "numeric" },
  );

  const judulStatus = {
    pending:
      data.metode === "bpjs"
        ? t("ticketDetail.statusTitle.pendingBpjs")
        : t("ticketDetail.statusTitle.pendingUmum"),
    confirmed: t("ticketDetail.statusTitle.confirmed"),
    ditolak: t("ticketDetail.statusTitle.ditolak"),
    dibatalkan: t("ticketDetail.statusTitle.dibatalkan"),
    selesai: t("ticketDetail.statusTitle.selesai"),
  }[kelompok];

  const subtitleStatus =
    kelompok === "pending" && data.metode === "bpjs"
      ? t("ticketDetail.statusSubtitleBpjs")
      : undefined;

  const reasonsList: string[] =
    (t("ticketDetail.cancelModal.reasons") as unknown as string[]) || [];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color="#0D9488" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("ticketDetail.headerTitle")}</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <View style={styles.ticketCard}>
          <View style={[styles.statusStrip, { backgroundColor: status.bg }]}>
            <Ionicons name={status.icon} size={17} color={status.text} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.statusTitle, { color: status.text }]}>
                {judulStatus}
              </Text>
              {subtitleStatus ? (
                <Text style={[styles.statusSubtitle, { color: status.text }]}>
                  {subtitleStatus}
                </Text>
              ) : null}
              {kelompok === "ditolak" && data.catatan_admin ? (
                <Text style={[styles.statusSubtitle, { color: status.text }]}>
                  {t("ticketDetail.rejectionReason").replace(
                    "{reason}",
                    data.catatan_admin,
                  )}
                </Text>
              ) : null}
            </View>
          </View>

          {tampilkanTiket && (
            <View style={styles.heroSection}>
              <Text style={styles.antreanLabel}>
                {t("ticketDetail.queueNumberLabel")}
              </Text>
              <Text style={styles.antreanNomor}>
                {data.nomor_antrean ?? "-"}
              </Text>
              {!data.nomor_antrean && (
                <Text style={styles.antreanHint}>
                  {t("ticketDetail.queueNumberHint")}
                </Text>
              )}
              <View style={styles.qrWrapper}>
                <QRCode value={data.kode_tiket} size={116} color="#0D9488" />
              </View>
              <Text style={styles.qrHint}>{t("ticketDetail.qrHint")}</Text>
            </View>
          )}

          {tampilkanTiket && (
            <View style={styles.stubRow}>
              <View style={[styles.stubHole, styles.stubHoleLeft]} />
              <View style={styles.stubDashedLine} />
              <View style={[styles.stubHole, styles.stubHoleRight]} />
            </View>
          )}

          <View style={styles.infoSection}>
            <View style={styles.faskesRow}>
              <View style={styles.faskesAvatar}>
                <Ionicons name="business" size={17} color="#0D9488" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.faskesNama}>{data.faskes?.nama}</Text>
                <Text style={styles.metaText}>{data.faskes?.alamat}</Text>
              </View>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.rowInfo}>
              <Ionicons name="medkit-outline" size={14} color="#0D9488" />
              <Text style={styles.rowInfoText}>
                {data.layanan_faskes?.nama_layanan}
                {data.dokter ? ` · ${data.dokter.nama}` : ""}
              </Text>
            </View>
            <View style={styles.rowInfo}>
              <Ionicons name="calendar-outline" size={14} color="#0D9488" />
              <Text style={styles.rowInfoText}>
                {tanggalLabel}
                {data.jam_reservasi
                  ? ` · ${data.jam_reservasi.slice(0, 5)} WIB`
                  : ""}
              </Text>
            </View>
            <View style={styles.rowInfo}>
              <Ionicons name="person-outline" size={14} color="#0D9488" />
              <Text style={styles.rowInfoText}>
                {t("ticketDetail.forPatient").replace("{name}", namaPasien)}
              </Text>
            </View>
            <View style={[styles.rowInfo, { marginBottom: 0 }]}>
              <Ionicons name="card-outline" size={14} color="#0D9488" />
              <Text style={styles.rowInfoText}>
                {t("ticketDetail.paymentMethod").replace(
                  "{method}",
                  data.metode === "bpjs" ? "BPJS" : "Umum",
                )}
              </Text>
            </View>
          </View>
        </View>

        {data.metode === "bpjs" && tampilkanTiket && (
          <View style={styles.plainNote}>
            <Ionicons
              name="information-circle-outline"
              size={14}
              color="#A67A3D"
            />
            <Text style={styles.plainNoteText}>
              {t("ticketDetail.bpjsNote")}
            </Text>
          </View>
        )}

        {kelompok === "selesai" && !sudahDiulas && (
          <View style={styles.reviewBlock}>
            <Text style={styles.reviewHint}>
              {t("ticketDetail.reviewPrompt")}
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              activeOpacity={0.85}
              onPress={() =>
                router.push({
                  pathname: "/beri-ulasan",
                  params: { reservasiId: data.id },
                })
              }
            >
              <Ionicons name="star-outline" size={16} color="#fff" />
              <Text style={styles.primaryButtonText}>
                {t("ticketDetail.writeReviewButton")}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        {kelompok === "selesai" && sudahDiulas && (
          <View style={styles.reviewedRow}>
            <Ionicons name="checkmark-circle" size={16} color="#0D9488" />
            <Text style={styles.reviewedText}>
              {t("ticketDetail.reviewSubmitted")}
            </Text>
          </View>
        )}

        {bisaDiubah && (
          <View style={{ marginTop: 4, gap: 10 }}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() =>
                router.push({
                  pathname: "/ubah-jadwal",
                  params: { reservasiId: data.id },
                })
              }
              activeOpacity={0.85}
            >
              <Ionicons name="calendar-outline" size={16} color="#fff" />
              <Text style={styles.primaryButtonText}>
                {t("ticketDetail.rescheduleButton")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.textDangerButton}
              onPress={() => setShowCancelModal(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.textDangerButtonText}>
                {t("ticketDetail.cancelReservationButton")}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showCancelModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCancelModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => !submittingCancel && setShowCancelModal(false)}
          />
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrapper}>
              <Ionicons name="close-circle" size={26} color="#C6544D" />
            </View>
            <Text style={styles.modalTitle}>
              {t("ticketDetail.cancelModal.title")}
            </Text>
            <Text style={styles.modalSubtitle}>
              {t("ticketDetail.cancelModal.subtitle")
                .replace(
                  "{service}",
                  data.layanan_faskes?.nama_layanan ?? "konsultasi",
                )
                .replace(
                  "{doctor}",
                  data.dokter
                    ? t("ticketDetail.cancelModal.withDoctor").replace(
                        "{name}",
                        data.dokter.nama,
                      )
                    : "",
                )}
            </Text>

            <Text style={styles.modalLabel}>
              {t("ticketDetail.cancelModal.reasonLabel")}
            </Text>
            {reasonsList.map((a) => {
              const active = alasan === a;
              return (
                <TouchableOpacity
                  key={a}
                  style={[styles.optionRow, active && styles.optionRowActive]}
                  onPress={() => setAlasan(a)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={active ? "radio-button-on" : "radio-button-off"}
                    size={18}
                    color={active ? "#0D9488" : "#D0D0D0"}
                  />
                  <Text
                    style={[
                      styles.optionText,
                      active && styles.optionTextActive,
                    ]}
                  >
                    {a}
                  </Text>
                </TouchableOpacity>
              );
            })}

            <View style={styles.modalNote}>
              <Ionicons
                name="information-circle-outline"
                size={14}
                color="#A67A3D"
              />
              <Text style={styles.modalNoteText}>
                {t("ticketDetail.cancelModal.refundNote")}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.confirmButton,
                !alasan && styles.confirmButtonDisabled,
              ]}
              onPress={handleKonfirmasiBatal}
              disabled={!alasan || submittingCancel}
              activeOpacity={0.85}
            >
              <Text style={styles.confirmButtonText}>
                {submittingCancel
                  ? t("ticketDetail.cancelModal.processingButton")
                  : t("ticketDetail.cancelModal.confirmButton")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.kembaliButton}
              onPress={() => setShowCancelModal(false)}
              disabled={submittingCancel}
            >
              <Text style={styles.kembaliButtonText}>
                {t("ticketDetail.cancelModal.backButton")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG_LAYAR },
  center: {
    flex: 1,
    backgroundColor: BG_LAYAR,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 13,
    color: "#9CA3AF",
  },
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
  ticketCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "visible",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  statusStrip: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  statusTitle: { fontFamily: "PlusJakartaSans_700Bold", fontSize: 14 },
  statusSubtitle: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 12,
    marginTop: 3,
    lineHeight: 16,
  },
  heroSection: {
    alignItems: "center",
    paddingTop: 18,
    paddingBottom: 4,
    paddingHorizontal: 20,
  },
  antreanLabel: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 12,
    color: "#6B7280",
  },
  antreanNomor: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 34,
    color: "#0D9488",
    marginTop: 2,
  },
  antreanHint: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 11,
    color: "#A67A3D",
    marginTop: 4,
    textAlign: "center",
  },
  qrWrapper: { marginTop: 14 },
  qrHint: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 8,
  },
  stubRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 20,
  },
  stubHole: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: BG_LAYAR,
  },
  stubHoleLeft: { marginLeft: -10 },
  stubHoleRight: { marginRight: -10 },
  stubDashedLine: {
    flex: 1,
    borderTopWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#E3E9E7",
    marginHorizontal: 4,
  },
  infoSection: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 18,
  },
  faskesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  faskesAvatar: {
    width: 36,
    height: 36,
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
  metaText: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  infoDivider: {
    height: 1,
    backgroundColor: "#F1F1F1",
    marginVertical: 12,
  },
  rowInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  rowInfoText: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 13,
    color: "#374151",
  },
  plainNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    paddingHorizontal: 4,
    marginBottom: 16,
  },
  plainNoteText: {
    flex: 1,
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 11.5,
    color: "#9C8055",
    lineHeight: 16,
  },
  primaryButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#0D9488",
    borderRadius: 14,
    minHeight: 50,
  },
  primaryButtonText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 15,
    color: "#fff",
  },
  textDangerButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  textDangerButtonText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 14,
    color: "#B86A64",
  },
  reviewBlock: { gap: 10 },
  reviewHint: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 12.5,
    color: "#6B7280",
    textAlign: "center",
  },
  reviewedRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  reviewedText: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 12.5,
    color: "#6B7280",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(17, 24, 39, 0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 22,
    alignItems: "center",
  },
  modalIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FBEBEA",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  modalTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 16,
    color: "#1F2937",
    textAlign: "center",
  },
  modalSubtitle: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 12.5,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 16,
    lineHeight: 18,
  },
  modalLabel: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 12.5,
    color: "#374151",
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
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
    fontSize: 12.5,
    color: "#1F2937",
  },
  optionTextActive: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: "#0D6459",
  },
  modalNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginTop: 4,
    marginBottom: 18,
    width: "100%",
    paddingHorizontal: 2,
  },
  modalNoteText: {
    flex: 1,
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 11.5,
    color: "#9C8055",
    lineHeight: 16,
  },
  confirmButton: {
    width: "100%",
    alignItems: "center",
    backgroundColor: "#C6544D",
    borderRadius: 14,
    minHeight: 50,
    justifyContent: "center",
  },
  confirmButtonDisabled: {
    backgroundColor: "#E8B4B0",
  },
  confirmButtonText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: "#fff",
    fontSize: 15,
  },
  kembaliButton: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    marginTop: 4,
  },
  kembaliButtonText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: "#6B7280",
    fontSize: 14,
  },
});
