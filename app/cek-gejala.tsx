import { Ionicons } from "@expo/vector-icons";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
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

// ── Tipe data ────────────────────────────────────────────────────────────
type Kategori = { id: string; key: string; nama: string };

type Durasi = "kurang_24_jam" | "1_3_hari" | "lebih_3_hari" | "lebih_1_minggu";
type Keparahan = "ringan" | "sedang" | "berat";
type GejalaValue =
  | "demam"
  | "mual_muntah"
  | "pusing"
  | "sesak_napas"
  | "nyeri"
  | "gatal_ruam"
  | "lainnya";

type HasilCekGejala = {
  ringkasan: string;
  urgensi: "rendah" | "sedang" | "tinggi";
  saran: string;
  kategori_disarankan_key: string | null;
  disclaimer: string;
};

const OPSI_DURASI: { value: Durasi; labelKey: string }[] = [
  { value: "kurang_24_jam", labelKey: "symptomChecker.durationLess24h" },
  { value: "1_3_hari", labelKey: "symptomChecker.duration1to3Days" },
  { value: "lebih_3_hari", labelKey: "symptomChecker.durationMore3Days" },
  { value: "lebih_1_minggu", labelKey: "symptomChecker.durationMore1Week" },
];

const OPSI_KEPARAHAN: { value: Keparahan; labelKey: string }[] = [
  { value: "ringan", labelKey: "symptomChecker.severityMild" },
  { value: "sedang", labelKey: "symptomChecker.severityModerate" },
  { value: "berat", labelKey: "symptomChecker.severitySevere" },
];

const OPSI_GEJALA_PENYERTA: { value: GejalaValue; labelKey: string }[] = [
  { value: "demam", labelKey: "symptomChecker.symptomFever" },
  { value: "mual_muntah", labelKey: "symptomChecker.symptomNauseaVomit" },
  { value: "pusing", labelKey: "symptomChecker.symptomDizzy" },
  { value: "sesak_napas", labelKey: "symptomChecker.symptomShortBreath" },
  { value: "nyeri", labelKey: "symptomChecker.symptomPain" },
  { value: "gatal_ruam", labelKey: "symptomChecker.symptomItchRash" },
  { value: "lainnya", labelKey: "symptomChecker.symptomOther" },
];

const LANGKAH_AI_KEYS = [
  "symptomChecker.aiStepReading",
  "symptomChecker.aiStepAnalyzing",
  "symptomChecker.aiStepComposing",
  "symptomChecker.aiStepMatching",
];

const STEP_LABEL_KEYS = [
  "symptomChecker.stepLabelComplaint",
  "symptomChecker.stepLabelDuration",
  "symptomChecker.stepLabelSeverity",
  "symptomChecker.stepLabelOtherSymptoms",
];
const TOTAL_STEP = STEP_LABEL_KEYS.length;

const URGENSI_STYLE: Record<
  HasilCekGejala["urgensi"],
  {
    bg: string;
    text: string;
    labelKey: string;
    icon: keyof typeof Ionicons.glyphMap;
  }
> = {
  rendah: {
    bg: "#E1F5EE",
    text: "#0D9488",
    labelKey: "symptomChecker.urgencyLowLabel",
    icon: "checkmark-circle",
  },
  sedang: {
    bg: "#FEF3C7",
    text: "#B45309",
    labelKey: "symptomChecker.urgencyModerateLabel",
    icon: "alert-circle",
  },
  tinggi: {
    bg: "#FEE2E2",
    text: "#B91C1C",
    labelKey: "symptomChecker.urgencyHighLabel",
    icon: "warning",
  },
};

export default function CekGejalaScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [step, setStep] = useState(0);
  const [kategoriList, setKategoriList] = useState<Kategori[]>([]);

  const [keluhanUtama, setKeluhanUtama] = useState("");
  const [durasi, setDurasi] = useState<Durasi | null>(null);
  const [keparahan, setKeparahan] = useState<Keparahan | null>(null);
  const [gejalaPenyerta, setGejalaPenyerta] = useState<GejalaValue[]>([]);
  const [gejalaLainnyaText, setGejalaLainnyaText] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasil, setHasil] = useState<HasilCekGejala | null>(null);
  const [keluhanFocused, setKeluhanFocused] = useState(false);
  const [lainnyaFocused, setLainnyaFocused] = useState(false);

  useEffect(() => {
    const fetchKategori = async () => {
      const { data } = await supabase
        .from("kategori_faskes")
        .select("id, key, nama")
        .eq("aktif", true);
      if (data) setKategoriList(data as Kategori[]);
    };
    fetchKategori();
  }, []);

  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setLoadingMsgIndex((i) => i + 1);
    }, 1600);
    return () => clearInterval(interval);
  }, [loading]);

  const pulse1 = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;
  const bobAnim = useRef(new Animated.Value(0)).current;
  const stepAnim = useRef(new Animated.Value(1)).current;
  const btnScale = useRef(new Animated.Value(1)).current;
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!loading) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [loading]);

  useEffect(() => {
    const createPulse = (v: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(v, {
            toValue: 1,
            duration: 1800,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(v, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      );
    const a1 = createPulse(pulse1, 0);
    const a2 = createPulse(pulse2, 900);
    a1.start();
    a2.start();

    const bobLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(bobAnim, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bobAnim, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    bobLoop.start();

    return () => {
      a1.stop();
      a2.stop();
      bobLoop.stop();
    };
  }, []);

  useEffect(() => {
    stepAnim.setValue(0);
    Animated.timing(stepAnim, {
      toValue: 1,
      duration: 380,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [step]);

  const handlePressIn = () =>
    Animated.spring(btnScale, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
    }).start();
  const handlePressOut = () =>
    Animated.spring(btnScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
    }).start();

  const toggleGejala = (item: GejalaValue) => {
    setGejalaPenyerta((prev) =>
      prev.includes(item) ? prev.filter((g) => g !== item) : [...prev, item],
    );
    if (item === "lainnya" && gejalaPenyerta.includes("lainnya")) {
      setGejalaLainnyaText("");
    }
  };

  const bisaLanjut = () => {
    if (step === 0) return keluhanUtama.trim().length >= 3;
    if (step === 1) return durasi !== null;
    if (step === 2) return keparahan !== null;
    if (step === 3 && gejalaPenyerta.includes("lainnya")) {
      return gejalaLainnyaText.trim().length > 0;
    }
    return true;
  };

  const handleLanjut = () => {
    if (step < TOTAL_STEP - 1) {
      setStep((s) => s + 1);
    } else {
      handleSubmit();
    }
  };

  const gejalaPenyertaFinal = () =>
    gejalaPenyerta.map((g) => {
      const opt = OPSI_GEJALA_PENYERTA.find((o) => o.value === g)!;
      return g === "lainnya"
        ? `${t(opt.labelKey)}: ${gejalaLainnyaText.trim()}`
        : t(opt.labelKey);
    });

  const handleSubmit = async () => {
    setLoading(true);
    setLoadingMsgIndex(0);
    setErrorMsg(null);
    try {
      const { data, error } = await supabase.functions.invoke("cek-gejala", {
        body: {
          keluhanUtama,
          durasi,
          keparahan,
          gejalaPenyerta: gejalaPenyertaFinal(),
          daftarKategori: kategoriList.map((k) => ({
            key: k.key,
            nama: k.nama,
          })),
          bahasa: language,
        },
      });
      if (error) throw error;
      setHasil(data as HasilCekGejala);
      setStep(TOTAL_STEP);
    } catch (e) {
      // Cetak pesan asli dari Edge Function ke konsol Expo untuk debugging
      if (e instanceof FunctionsHttpError) {
        const detail = await e.context.json().catch(() => null);
        console.log("Edge Function error:", e.context.status, detail);
      } else {
        console.log("Error:", e);
      }
      setErrorMsg(t("symptomChecker.errorSubmit"));
    } finally {
      setLoading(false);
    }
  };

  const kategoriTerpilih = kategoriList.find(
    (k) => k.key === hasil?.kategori_disarankan_key,
  );

  const handleCariFaskes = () => {
    // TODO: sesuaikan pathname/params dengan implementasi asli halaman pencarian.
    router.push({
      pathname: "/cari",
      params: { kategori: kategoriTerpilih?.key ?? "" },
    });
  };

  const resetForm = () => {
    setStep(0);
    setKeluhanUtama("");
    setDurasi(null);
    setKeparahan(null);
    setGejalaPenyerta([]);
    setGejalaLainnyaText("");
    setHasil(null);
    setErrorMsg(null);
  };

  // ── Elemen bersama ──────────────────────────────────────────────────
  const Header = ({ title }: { title: string }) => (
    <View style={styles.headerRow}>
      <TouchableOpacity
        onPress={() => router.back()}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="arrow-back" size={22} color="#222" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={{ width: 22 }} />
    </View>
  );

  // Orb dengan cincin glow di sekelilingnya sendiri (bounded, bukan blob lepas)
  const Orb = ({
    size,
    icon = "sparkles",
    floating = false,
  }: {
    size: number;
    icon?: keyof typeof Ionicons.glyphMap;
    floating?: boolean;
  }) => (
    <Animated.View
      style={[
        styles.orbWrap,
        { width: size * 1.9, height: size * 1.9 },
        floating && {
          transform: [
            {
              translateY: bobAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -6],
              }),
            },
          ],
        },
      ]}
    >
      <View
        style={[
          styles.orbHalo,
          {
            width: size * 1.9,
            height: size * 1.9,
            borderRadius: (size * 1.9) / 2,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.orbRing,
          {
            width: size * 0.9,
            height: size * 0.9,
            borderRadius: (size * 0.9) / 2,
            opacity: pulse1.interpolate({
              inputRange: [0, 1],
              outputRange: [0.45, 0],
            }),
            transform: [
              {
                scale: pulse1.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.7],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.orbRing,
          {
            width: size * 0.9,
            height: size * 0.9,
            borderRadius: (size * 0.9) / 2,
            opacity: pulse2.interpolate({
              inputRange: [0, 1],
              outputRange: [0.45, 0],
            }),
            transform: [
              {
                scale: pulse2.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.7],
                }),
              },
            ],
          },
        ]}
      />
      <LinearGradient
        colors={["#0B6E64", "#12A594"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.orbCore,
          {
            width: size * 0.72,
            height: size * 0.72,
            borderRadius: (size * 0.72) / 2,
          },
        ]}
      >
        <Ionicons name={icon} size={size * 0.32} color="#fff" />
      </LinearGradient>
    </Animated.View>
  );

  // Kartu hero gradient — tertutup rapi (overflow hidden), tidak "bocor" ke header
  const HeroCard = ({
    title,
    subtitle,
    icon = "sparkles",
    compact = false,
  }: {
    title: string;
    subtitle?: string;
    icon?: keyof typeof Ionicons.glyphMap;
    compact?: boolean;
  }) => (
    <LinearGradient
      colors={["#0B6E64", "#12A594"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.heroCard, compact && styles.heroCardCompact]}
    >
      <View style={styles.heroDecorA} />
      <View style={styles.heroDecorB} />
      <Orb size={compact ? 52 : 68} icon={icon} floating />
      <Text style={styles.heroTitle}>{title}</Text>
      {subtitle ? <Text style={styles.heroSubtitle}>{subtitle}</Text> : null}
    </LinearGradient>
  );

  const StepTrack = () => (
    <View style={styles.stepTrack}>
      {STEP_LABEL_KEYS.map((labelKey, i) => (
        <View key={labelKey} style={styles.stepTrackItem}>
          <View style={styles.stepTrackDotRow}>
            {i > 0 && (
              <View
                style={[styles.stepLine, i <= step && styles.stepLineActive]}
              />
            )}
            <View style={[styles.stepDot, i <= step && styles.stepDotActive]}>
              {i < step ? (
                <Ionicons name="checkmark" size={11} color="#fff" />
              ) : (
                <Text
                  style={[
                    styles.stepDotText,
                    i === step && styles.stepDotTextActive,
                  ]}
                >
                  {i + 1}
                </Text>
              )}
            </View>
            {i < TOTAL_STEP - 1 && (
              <View
                style={[styles.stepLine, i < step && styles.stepLineActive]}
              />
            )}
          </View>
          <Text
            style={[
              styles.stepTrackLabel,
              i === step && styles.stepTrackLabelActive,
            ]}
            numberOfLines={1}
          >
            {t(labelKey)}
          </Text>
        </View>
      ))}
    </View>
  );

  // ── Tampilan hasil ───────────────────────────────────────────────────
  if (hasil) {
    const u = URGENSI_STYLE[hasil.urgensi];
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <Header title={t("symptomChecker.resultTitle")} />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View
            style={[
              styles.urgensiBanner,
              { backgroundColor: u.bg, borderColor: u.text + "33" },
            ]}
          >
            <Ionicons name={u.icon} size={26} color={u.text} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.urgensiTitle, { color: u.text }]}>
                {t(u.labelKey)}
              </Text>
              <Text style={styles.urgensiSubtitle}>
                {t("symptomChecker.resultDisclaimerNote")}
              </Text>
            </View>
          </View>

          <View style={[styles.card, styles.resultCard]}>
            <View style={styles.resultCardHeader}>
              <Ionicons name="bulb-outline" size={18} color="#0D9488" />
              <Text style={styles.hasilSectionTitle}>
                {t("symptomChecker.summaryTitle")}
              </Text>
            </View>
            <Text style={styles.hasilBody}>{hasil.ringkasan}</Text>
          </View>

          <View style={[styles.card, styles.resultCard]}>
            <View style={styles.resultCardHeader}>
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={18}
                color="#0D9488"
              />
              <Text style={styles.hasilSectionTitle}>
                {t("symptomChecker.adviceTitle")}
              </Text>
            </View>
            <Text style={styles.hasilBody}>{hasil.saran}</Text>
          </View>

          {kategoriTerpilih && (
            <View style={[styles.card, styles.resultCard]}>
              <Text style={styles.kategoriLabel}>
                {t("symptomChecker.categoryLabel")}
              </Text>
              <Text style={styles.kategoriNama}>{kategoriTerpilih.nama}</Text>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleCariFaskes}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryButtonText}>
                  {t("symptomChecker.searchCategoryButton")}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.disclaimerBox}>
            <Ionicons
              name="information-circle-outline"
              size={16}
              color="#666"
            />
            <Text style={styles.disclaimerText}>{hasil.disclaimer}</Text>
          </View>

          <TouchableOpacity style={styles.secondaryButton} onPress={resetForm}>
            <Text style={styles.secondaryButtonText}>
              {t("symptomChecker.checkOtherButton")}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Tampilan loading ─────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <Header title={t("symptomChecker.title")} />
        <View style={styles.loadingWrap}>
          <Orb size={96} floating />
          <View style={{ alignItems: "center", gap: 6 }}>
            <Text style={styles.loadingTitle}>
              {t("symptomChecker.loadingTitle")}
            </Text>
            <Text style={styles.loadingText}>
              {t("symptomChecker.loadingSubtitle")}
            </Text>
          </View>

          <View style={styles.loadingSteps}>
            {LANGKAH_AI_KEYS.map((labelKey, i) => {
              const current = Math.min(
                loadingMsgIndex,
                LANGKAH_AI_KEYS.length - 1,
              );
              const done = i < current;
              const active = i === current;
              return (
                <View key={labelKey} style={styles.loadingStepRow}>
                  {done ? (
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color="#0D9488"
                    />
                  ) : active ? (
                    <ActivityIndicator
                      size="small"
                      color="#0D9488"
                      style={styles.loadingSpinner}
                    />
                  ) : (
                    <Ionicons
                      name="ellipse-outline"
                      size={18}
                      color="#C9D8D3"
                    />
                  )}
                  <Text
                    style={[
                      styles.loadingStepText,
                      (done || active) && styles.loadingStepTextOn,
                    ]}
                  >
                    {t(labelKey)}
                  </Text>
                </View>
              );
            })}
          </View>

          <Animated.View
            style={[
              styles.skeletonCard,
              {
                opacity: shimmer.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.45, 1],
                }),
              },
            ]}
          >
            <View style={[styles.skelLine, { width: "100%" }]} />
            <View style={[styles.skelLine, { width: "88%" }]} />
            <View style={[styles.skelLine, { width: "62%" }]} />
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  // ── Tampilan form (wizard) ───────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Header title={t("symptomChecker.title")} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "android" ? 24 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <HeroCard
            title={t("symptomChecker.heroTitle")}
            subtitle={t("symptomChecker.heroSubtitle")}
          />

          <StepTrack />

          <View style={styles.aiNoteRow}>
            <Ionicons
              name="information-circle-outline"
              size={12}
              color="#9AAFAA"
            />
            <Text style={styles.aiNoteText}>
              {t("symptomChecker.aiDisclaimerNote")}
            </Text>
          </View>

          <Animated.View
            style={[
              styles.card,
              {
                opacity: stepAnim,
                transform: [
                  {
                    translateY: stepAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [14, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {step === 0 && (
              <View>
                <Text style={styles.stepTitle}>
                  {t("symptomChecker.step0Title")}
                </Text>
                <Text style={styles.stepHint}>
                  {t("symptomChecker.step0Hint")}
                </Text>
                <TextInput
                  value={keluhanUtama}
                  onChangeText={setKeluhanUtama}
                  onFocus={() => setKeluhanFocused(true)}
                  onBlur={() => setKeluhanFocused(false)}
                  placeholder={t("symptomChecker.step0Placeholder")}
                  placeholderTextColor="#999"
                  multiline
                  style={[
                    styles.textInput,
                    keluhanFocused && styles.textInputFocused,
                  ]}
                />
              </View>
            )}

            {step === 1 && (
              <View>
                <Text style={styles.stepTitle}>
                  {t("symptomChecker.step1Title")}
                </Text>
                <View style={styles.chipWrap}>
                  {OPSI_DURASI.map((opt) => (
                    <ChoiceChip
                      key={opt.value}
                      label={t(opt.labelKey)}
                      selected={durasi === opt.value}
                      onPress={() => setDurasi(opt.value)}
                    />
                  ))}
                </View>
              </View>
            )}

            {step === 2 && (
              <View>
                <Text style={styles.stepTitle}>
                  {t("symptomChecker.step2Title")}
                </Text>
                <View style={styles.chipWrap}>
                  {OPSI_KEPARAHAN.map((opt) => (
                    <ChoiceChip
                      key={opt.value}
                      label={t(opt.labelKey)}
                      selected={keparahan === opt.value}
                      onPress={() => setKeparahan(opt.value)}
                    />
                  ))}
                </View>
              </View>
            )}

            {step === 3 && (
              <View>
                <Text style={styles.stepTitle}>
                  {t("symptomChecker.step3Title")}
                </Text>
                <View style={styles.chipWrap}>
                  {OPSI_GEJALA_PENYERTA.map((opt) => (
                    <ChoiceChip
                      key={opt.value}
                      label={t(opt.labelKey)}
                      selected={gejalaPenyerta.includes(opt.value)}
                      onPress={() => toggleGejala(opt.value)}
                    />
                  ))}
                </View>
                {gejalaPenyerta.includes("lainnya") && (
                  <TextInput
                    value={gejalaLainnyaText}
                    onChangeText={setGejalaLainnyaText}
                    onFocus={() => setLainnyaFocused(true)}
                    onBlur={() => setLainnyaFocused(false)}
                    placeholder={t("symptomChecker.step3Placeholder")}
                    placeholderTextColor="#999"
                    style={[
                      styles.textInput,
                      styles.textInputSmall,
                      lainnyaFocused && styles.textInputFocused,
                    ]}
                  />
                )}
              </View>
            )}
          </Animated.View>

          {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}

          <Animated.View style={{ transform: [{ scale: btnScale }] }}>
            <TouchableOpacity
              style={[
                styles.primaryButton,
                !bisaLanjut() && styles.buttonDisabled,
              ]}
              onPress={handleLanjut}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              disabled={!bisaLanjut()}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonText}>
                {step < TOTAL_STEP - 1
                  ? t("symptomChecker.nextButton")
                  : t("symptomChecker.seeResultButton")}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ChoiceChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.choiceChip, selected && styles.choiceChipSelected]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text
        style={[
          styles.choiceChipText,
          selected && styles.choiceChipTextSelected,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F6FBF9" },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 16,
    color: "#222",
  },

  // Orb: cincin glow-nya sendiri dibatasi (bounded), jadi tidak pernah "bocor" ke elemen lain
  orbWrap: { alignItems: "center", justifyContent: "center" },
  orbHalo: { position: "absolute", backgroundColor: "rgba(255,255,255,0.06)" },
  orbRing: { position: "absolute", backgroundColor: "rgba(255,255,255,0.4)" },
  orbCore: { alignItems: "center", justifyContent: "center" },

  // Hero card — gradient tertutup rapi (overflow hidden), pengganti blob lepas
  heroCard: {
    borderRadius: 28,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: "center",
    marginBottom: 22,
    overflow: "hidden",
  },
  heroCardCompact: { paddingVertical: 24 },
  heroDecorA: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(255,255,255,0.06)",
    top: -60,
    right: -50,
  },
  heroDecorB: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.05)",
    bottom: -50,
    left: -40,
  },
  heroTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 19,
    color: "#fff",
    textAlign: "center",
    marginTop: 16,
  },
  heroSubtitle: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    marginTop: 8,
    maxWidth: "88%",
    lineHeight: 18,
  },

  stepTrack: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 22,
  },
  stepTrackItem: { flex: 1, alignItems: "center", maxWidth: 100 },
  stepTrackDotRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  stepDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#E1EDE9",
    alignItems: "center",
    justifyContent: "center",
  },
  stepDotActive: { backgroundColor: "#0D9488" },
  stepDotText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 10,
    color: "#9AAFAA",
  },
  stepDotTextActive: { color: "#fff" },
  stepLine: { flex: 1, height: 2, backgroundColor: "#E1EDE9" },
  stepLineActive: { backgroundColor: "#0D9488" },
  stepTrackLabel: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 10,
    color: "#9AAFAA",
    marginTop: 6,
    textAlign: "center",
    alignSelf: "stretch",
  },
  stepTrackLabelActive: { color: "#0D9488" },

  aiNoteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    justifyContent: "center",
    marginBottom: 18,
  },
  aiNoteText: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 10,
    color: "#9AAFAA",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#EEF2F1",
    padding: 18,
    marginBottom: 14,
    shadowColor: "#0B6E64",
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  // Kartu hasil: datar (tanpa bayangan) agar tidak terlalu ramai
  resultCard: {
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    shadowOpacity: 0,
    elevation: 0,
  },

  stepTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 17,
    color: "#222",
    marginBottom: 6,
  },
  stepHint: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 12,
    color: "#888",
    marginBottom: 14,
  },
  textInput: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 14,
    color: "#222",
    backgroundColor: "#F6FBF9",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EEF2F1",
    padding: 14,
    minHeight: 100,
    textAlignVertical: "top",
  },
  textInputSmall: { minHeight: 0, marginTop: 12, textAlignVertical: "center" },
  textInputFocused: {
    borderColor: "#0D9488",
    borderWidth: 1.5,
    backgroundColor: "#fff",
    shadowColor: "#0D9488",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
  },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  choiceChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#EEF2F1",
    backgroundColor: "#F6FBF9",
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  choiceChipSelected: { backgroundColor: "#0D9488", borderColor: "#0D9488" },
  choiceChipText: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 13,
    color: "#444",
  },
  choiceChipTextSelected: { color: "#fff" },
  primaryButton: {
    backgroundColor: "#0D9488",
    borderRadius: 14,
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  buttonDisabled: { opacity: 0.4 },
  primaryButtonText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 15,
    color: "#fff",
  },
  secondaryButton: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#0D9488",
    borderRadius: 14,
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 15,
    color: "#0D9488",
  },
  errorText: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 12,
    color: "#B91C1C",
    marginBottom: 12,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    paddingHorizontal: 32,
  },
  loadingTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 17,
    color: "#0B6E64",
  },
  loadingSteps: { alignSelf: "stretch", maxWidth: 300, gap: 10 },
  loadingStepRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  loadingSpinner: { width: 18, height: 18 },
  loadingStepText: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 13,
    color: "#A0AEA9",
  },
  loadingStepTextOn: { color: "#333" },
  skeletonCard: {
    alignSelf: "stretch",
    maxWidth: 300,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EEF2F1",
    padding: 16,
    gap: 10,
  },
  skelLine: { height: 10, borderRadius: 5, backgroundColor: "#E1EDE9" },
  urgensiBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  urgensiTitle: { fontFamily: "PlusJakartaSans_700Bold", fontSize: 15 },
  urgensiSubtitle: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 12,
    color: "#555",
    lineHeight: 17,
    marginTop: 2,
  },
  loadingText: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 13,
    color: "#666",
  },
  resultCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  hasilSectionTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 14,
    color: "#222",
  },
  hasilBody: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 13,
    color: "#444",
    lineHeight: 20,
  },
  kategoriLabel: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 11,
    color: "#888",
  },
  kategoriNama: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 15,
    color: "#222",
    marginBottom: 10,
  },
  disclaimerBox: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 4,
    paddingVertical: 8,
    marginTop: 4,
  },
  disclaimerText: {
    flex: 1,
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 11,
    color: "#666",
    lineHeight: 16,
  },
});
