import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useLanguage } from "../lib/LanguageContext";
import { supabase } from "../lib/supabase";

const WARNA_HEADER = "#1F2937";
type FieldProps = TextInputProps & {
  label: string;
  first?: boolean;
  onFocusInput: (input: TextInput | null) => void;
};

// Kolom isian: outline teal tebal saat aktif, teal lembut saat sudah terisi.
function Field({
  label,
  first,
  onFocusInput,
  value,
  onFocus,
  onBlur,
  ...rest
}: FieldProps) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  return (
    <View style={first ? undefined : { marginTop: 16 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...rest}
        ref={inputRef}
        value={value}
        placeholderTextColor="#A0A0A0"
        style={[
          styles.input,
          !!value && styles.inputFilled,
          focused && styles.inputFocused,
        ]}
        onFocus={(e) => {
          setFocused(true);
          onFocusInput(inputRef.current);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
      />
    </View>
  );
}

export default function InformasiAsuransiScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();

  const [initialLoading, setInitialLoading] = useState(true);
  const [noBpjs, setNoBpjs] = useState("");
  const [faskesTingkat1, setFaskesTingkat1] = useState("");
  const [namaProvider, setNamaProvider] = useState("");
  const [noPolis, setNoPolis] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const scrollRef = useRef<ScrollView>(null);
  // ScrollView tidak punya measureInWindow di tipe TypeScript; ukur pembungkusnya (View).
  const scrollBoxRef = useRef<View>(null);
  const scrollY = useRef(0);
  const keyboardOpenRef = useRef(false);
  const pendingInput = useRef<TextInput | null>(null);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  // Ukur posisi nyata kolom dan area gulir di layar (koordinat jendela), lalu gulir
  // secukupnya agar kolom berada di area yang terlihat. Tidak bergantung pada hitungan
  // tata letak manual, jadi tetap akurat walau ukuran area gulir berubah karena keyboard.
  const tampilkanKolom = (input: TextInput | null) => {
    if (!input || !scrollBoxRef.current) return;
    scrollBoxRef.current.measureInWindow((_sx, sy, _sw, sh) => {
      input.measureInWindow((_ix, iy, _iw, ih) => {
        const margin = 16;
        const atas = sy + margin;
        const bawah = sy + sh - margin;
        let delta = 0;
        if (iy + ih > bawah) delta = iy + ih - bawah;
        else if (iy < atas) delta = iy - atas;
        if (delta !== 0) {
          scrollRef.current?.scrollTo({
            y: Math.max(scrollY.current + delta, 0),
            animated: true,
          });
        }
      });
    });
  };

  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () => {
      keyboardOpenRef.current = true;
      setKeyboardOpen(true);
      // Area gulir baru saja menyusut oleh keyboard: ukur setelah tata letak stabil.
      if (pendingInput.current) {
        const input = pendingInput.current;
        pendingInput.current = null;
        setTimeout(() => tampilkanKolom(input), 150);
      }
    });
    const hide = Keyboard.addListener("keyboardDidHide", () => {
      keyboardOpenRef.current = false;
      setKeyboardOpen(false);
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  // Keyboard sudah terbuka (pindah kolom): langsung tampilkan. Belum: tunggu keyboard muncul.
  const fokusKolom = (input: TextInput | null) => {
    if (keyboardOpenRef.current) setTimeout(() => tampilkanKolom(input), 80);
    else pendingInput.current = input;
  };

  useEffect(() => {
    const loadData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setInitialLoading(false);
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select(
          "no_bpjs, faskes_tingkat_1, nama_asuransi_swasta, no_polis_swasta",
        )
        .eq("id", user.id)
        .maybeSingle();
      if (data) {
        setNoBpjs(data.no_bpjs ?? "");
        setFaskesTingkat1(data.faskes_tingkat_1 ?? "");
        setNamaProvider(data.nama_asuransi_swasta ?? "");
        setNoPolis(data.no_polis_swasta ?? "");
      }
      setInitialLoading(false);
    };
    loadData();
  }, []);

  const handleSave = async () => {
    setErrorMsg("");
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      setErrorMsg(t("insurance.errorSessionNotFound"));
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        no_bpjs: noBpjs || null,
        faskes_tingkat_1: faskesTingkat1 || null,
        nama_asuransi_swasta: namaProvider || null,
        no_polis_swasta: noPolis || null,
      })
      .eq("id", user.id);

    setLoading(false);
    if (error) {
      setErrorMsg(t("insurance.errorSaveFailed"));
      return;
    }
    router.back();
  };

  if (initialLoading) {
    return (
      <SafeAreaView style={styles.loadingScreen} edges={["top"]}>
        <ActivityIndicator color="#0D9488" size="large" />
      </SafeAreaView>
    );
  }

  const bpjsTerisi = Boolean(noBpjs && faskesTingkat1);
  const asuransiTerisi = Boolean(namaProvider && noPolis);

  const Badge = ({ terisi }: { terisi: boolean }) => (
    <View
      style={[styles.badge, terisi ? styles.badgeSuccess : styles.badgeMuted]}
    >
      <Text
        style={[
          styles.badgeText,
          terisi ? styles.badgeTextSuccess : styles.badgeTextMuted,
        ]}
      >
        {terisi ? t("insurance.badgeFilled") : t("insurance.badgeEmpty")}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* "padding" untuk iOS dan Android. Pada Android mode edge-to-edge (Expo SDK 53+),
          jendela tidak menyusut saat keyboard muncul, sehingga kolom di bagian bawah
          tertutup. KeyboardAvoidingView menghitung tumpang tindih dengan keyboard, jadi
          aman juga untuk Android lama yang jendelanya menyusut sendiri. */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="arrow-back" size={22} color={WARNA_HEADER} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("insurance.title")}</Text>
          <View style={{ width: 22 }} />
        </View>

        <View ref={scrollBoxRef} collapsable={false} style={{ flex: 1 }}>
          <ScrollView
            ref={scrollRef}
            onScroll={(e) => {
              scrollY.current = e.nativeEvent.contentOffset.y;
            }}
            scrollEventThrottle={16}
            contentContainerStyle={[
              styles.scrollContent,
              keyboardOpen && { paddingBottom: 56 },
            ]}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>{t("insurance.bpjsTitle")}</Text>
                <Badge terisi={bpjsTerisi} />
              </View>

              <Field
                first
                label={t("insurance.bpjsNumberLabel")}
                placeholder={t("insurance.bpjsNumberPlaceholder")}
                keyboardType="number-pad"
                maxLength={13}
                value={noBpjs}
                onChangeText={(text) => setNoBpjs(text.replace(/[^0-9]/g, ""))}
                onFocusInput={fokusKolom}
              />
              <Field
                label={t("insurance.faskes1Label")}
                placeholder={t("insurance.faskes1Placeholder")}
                value={faskesTingkat1}
                onChangeText={setFaskesTingkat1}
                onFocusInput={fokusKolom}
              />

              <View style={styles.infoBox}>
                <Ionicons
                  name="information-circle"
                  size={16}
                  color="#0D9488"
                  style={{ marginTop: 1 }}
                />
                <Text style={styles.infoText}>
                  {t("insurance.bpjsInfoText")}
                </Text>
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>
                  {t("insurance.privateTitle")}{" "}
                  <Text style={styles.optionalText}>
                    {t("insurance.optionalTag")}
                  </Text>
                </Text>
                <Badge terisi={asuransiTerisi} />
              </View>

              <Field
                first
                label={t("insurance.providerLabel")}
                placeholder={t("insurance.providerPlaceholder")}
                value={namaProvider}
                onChangeText={setNamaProvider}
                onFocusInput={fokusKolom}
              />
              <Field
                label={t("insurance.policyNumberLabel")}
                placeholder={t("insurance.policyNumberPlaceholder")}
                value={noPolis}
                onChangeText={setNoPolis}
                onFocusInput={fokusKolom}
              />
            </View>
          </ScrollView>
        </View>

        <View
          style={[
            styles.footer,
            // Saat keyboard terbuka, area aman bawah sudah tertutup keyboard
            { paddingBottom: keyboardOpen ? 12 : Math.max(insets.bottom, 16) },
          ]}
        >
          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
          <TouchableOpacity
            style={[styles.saveButton, loading && { opacity: 0.75 }]}
            onPress={handleSave}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.saveButtonText}>
              {loading
                ? t("insurance.savingButton")
                : t("insurance.saveButton")}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F6FBF9" },
  loadingScreen: {
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
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F1",
  },
  headerTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 16,
    color: WARNA_HEADER,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    gap: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EEF2F1",
    padding: 16,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  cardTitle: {
    flex: 1,
    marginRight: 8,
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 15,
    color: "#1F2937",
  },
  optionalText: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 12,
    color: "#6B7280",
  },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  badgeSuccess: { backgroundColor: "#E1F5EE" },
  badgeMuted: { backgroundColor: "#F1F1F1" },
  badgeText: { fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 11 },
  badgeTextSuccess: { color: "#0D9488" },
  badgeTextMuted: { color: "#6B7280" },
  label: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 14,
    color: "#333",
    marginBottom: 8,
  },
  input: {
    fontFamily: "PlusJakartaSans_400Regular",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: "#222",
    backgroundColor: "#fff",
  },
  // Sudah terisi: outline teal lembut
  inputFilled: { borderColor: "#A7D8D0" },
  // Sedang diisi: outline teal tegas. Padding dikurangi 0,5 agar ukuran kolom tidak bergeser.
  inputFocused: {
    borderColor: "#0D9488",
    borderWidth: 1.5,
    paddingHorizontal: 13.5,
    paddingVertical: 12.5,
  },
  infoBox: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#F0FAF8",
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
  },
  infoText: {
    flex: 1,
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 12,
    color: "#3A6B62",
    lineHeight: 18,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#EEF2F1",
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: "#fff",
  },
  errorText: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 13,
    color: "#DC2626",
    marginBottom: 10,
  },
  saveButton: {
    backgroundColor: "#0D9488",
    borderRadius: 14,
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: "#fff",
    fontSize: 15,
  },
});
