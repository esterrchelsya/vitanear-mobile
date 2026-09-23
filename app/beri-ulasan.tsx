import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLanguage } from "../lib/LanguageContext";
import { supabase } from "../lib/supabase";

type Ringkasan = {
  faskes_id: string;
  faskes: { nama: string } | null;
  layanan_faskes: { nama_layanan: string } | null;
  dokter: { nama: string } | null;
  tanggal_reservasi: string;
};

export default function BeriUlasanScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { reservasiId } = useLocalSearchParams<{ reservasiId: string }>();

  const [ringkasan, setRingkasan] = useState<Ringkasan | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [tagTerpilih, setTagTerpilih] = useState<string[]>([]);
  const [komentar, setKomentar] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const ratingLabel = [
    "",
    t("giveReview.ratingVeryBad"),
    t("giveReview.ratingBad"),
    t("giveReview.ratingFair"),
    t("giveReview.ratingGood"),
    t("giveReview.ratingVeryGood"),
  ];

  const tagOptions = [
    { key: "friendlyDoctor", label: t("giveReview.tagFriendlyDoctor") },
    { key: "fastService", label: t("giveReview.tagFastService") },
    { key: "cleanFacility", label: t("giveReview.tagCleanFacility") },
    { key: "onTime", label: t("giveReview.tagOnTime") },
    { key: "orderlyQueue", label: t("giveReview.tagOrderlyQueue") },
  ];

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("reservasi")
        .select(
          `faskes_id, tanggal_reservasi,
           faskes:faskes_id ( nama ),
           layanan_faskes:layanan_id ( nama_layanan ),
           dokter:dokter_id ( nama )`,
        )
        .eq("id", reservasiId)
        .maybeSingle();
      setRingkasan(data as unknown as Ringkasan);
      setLoading(false);
    };
    if (reservasiId) load();
  }, [reservasiId]);

  const toggleTag = (tag: string) => {
    setTagTerpilih((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleKirim = async () => {
    if (rating === 0 || !ringkasan) return;
    setSubmitting(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSubmitting(false);
      return;
    }

    const tagText = tagTerpilih.length ? `[${tagTerpilih.join(", ")}] ` : "";
    const { error } = await supabase.from("ulasan").insert({
      faskes_id: ringkasan.faskes_id,
      user_id: user.id,
      reservasi_id: reservasiId,
      rating,
      komentar: `${tagText}${komentar.trim()}`.trim() || null,
    });

    setSubmitting(false);
    if (error) {
      Alert.alert(t("giveReview.failedTitle"), t("giveReview.failedMessage"));
      return;
    }
    Alert.alert(t("giveReview.successTitle"), t("giveReview.successMessage"), [
      { text: "OK", onPress: () => router.back() },
    ]);
  };

  if (loading || !ringkasan) {
    return (
      <SafeAreaView style={styles.center} edges={["top"]}>
        <ActivityIndicator color="#0D9488" size="large" />
      </SafeAreaView>
    );
  }

  const locale = language === "en" ? "en-US" : "id-ID";
  const tanggalLabel = new Date(ringkasan.tanggal_reservasi).toLocaleDateString(
    locale,
    { day: "2-digit", month: "long", year: "numeric" },
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color="#0D9488" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("giveReview.headerTitle")}</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        {/* Ringkasan kunjungan */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryIconWrapper}>
            <Ionicons name="business" size={18} color="#0D9488" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.summaryFaskes}>{ringkasan.faskes?.nama}</Text>
            <Text style={styles.summaryMeta}>
              {ringkasan.layanan_faskes?.nama_layanan}
              {ringkasan.dokter ? ` · ${ringkasan.dokter.nama}` : ""}
            </Text>
            <Text style={styles.summaryMeta}>{tanggalLabel}</Text>
          </View>
        </View>

        {/* Bintang + label */}
        <View style={styles.ratingCard}>
          <Text style={styles.ratingQuestion}>
            {t("giveReview.ratingQuestion")}
          </Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((n) => (
              <TouchableOpacity key={n} onPress={() => setRating(n)}>
                <Ionicons
                  name={n <= rating ? "star" : "star-outline"}
                  size={38}
                  color="#EAA23B"
                />
              </TouchableOpacity>
            ))}
          </View>
          {rating > 0 && (
            <Text style={styles.ratingLabel}>{ratingLabel[rating]}</Text>
          )}
        </View>

        {/* Tag cepat */}
        <Text style={styles.sectionLabel}>
          {t("giveReview.whatMadeYouSatisfied")}
        </Text>
        <View style={styles.tagRow}>
          {tagOptions.map((item) => {
            const active = tagTerpilih.includes(item.label);
            return (
              <TouchableOpacity
                key={item.key}
                style={[styles.tagChip, active && styles.tagChipActive]}
                onPress={() => toggleTag(item.label)}
              >
                <Text style={[styles.tagChipText, active && { color: "#fff" }]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Komentar */}
        <Text style={styles.sectionLabel}>{t("giveReview.tellUsMore")}</Text>
        <View style={styles.inputCard}>
          <TextInput
            style={styles.input}
            placeholder={t("giveReview.inputPlaceholder")}
            placeholderTextColor="#A0A0A0"
            multiline
            numberOfLines={4}
            value={komentar}
            onChangeText={setKomentar}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, rating === 0 && styles.submitDisabled]}
          onPress={handleKirim}
          disabled={rating === 0 || submitting}
        >
          <Text style={styles.submitText}>
            {submitting
              ? t("giveReview.submittingButton")
              : t("giveReview.submitButton")}
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
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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
  summaryIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#E1F5EE",
    alignItems: "center",
    justifyContent: "center",
  },
  summaryFaskes: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 14.5,
    color: "#1F2937",
  },
  summaryMeta: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 12,
    color: "#6B7280",
    marginTop: 1,
  },
  ratingCard: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  ratingQuestion: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 13.5,
    color: "#374151",
  },
  starsRow: { flexDirection: "row", gap: 6, marginTop: 14 },
  ratingLabel: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 13,
    color: "#EAA23B",
    marginTop: 10,
  },
  sectionLabel: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 13,
    color: "#374151",
    marginBottom: 10,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  tagChip: {
    borderWidth: 1,
    borderColor: "#0D9488",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  tagChipActive: { backgroundColor: "#0D9488" },
  tagChipText: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 12.5,
    color: "#0D9488",
  },
  inputCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  input: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 13.5,
    color: "#1F2937",
    textAlignVertical: "top",
    minHeight: 90,
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
    backgroundColor: "#0D9488",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  submitDisabled: { backgroundColor: "#B0D4D0" },
  submitText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: "#fff",
    fontSize: 15,
  },
});
