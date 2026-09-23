import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import DateOfBirthPicker from "../components/DateOfBirthPicker";
import { useLanguage } from "../lib/LanguageContext";
import { supabase } from "../lib/supabase";

type Gender = "Laki-laki" | "Perempuan" | null;

// PENTING: value di sini SENGAJA tetap sama dengan yang sudah tersimpan di
// kolom `hubungan` pada database (tidak diganti jadi kode bahasa-netral),
// supaya data anggota keluarga yang sudah ada tidak perlu dimigrasikan.
// Hanya label yang ditampilkan ke user yang diterjemahkan lewat labelKey.
const HUBUNGAN_OPTIONS: { value: string; labelKey: string }[] = [
  { value: "Suami", labelKey: "familyMembers.relationHusband" },
  { value: "Istri", labelKey: "familyMembers.relationWife" },
  { value: "Anak", labelKey: "familyMembers.relationChild" },
  { value: "Orang Tua", labelKey: "familyMembers.relationParent" },
  { value: "Lainnya", labelKey: "familyMembers.relationOther" },
];
const MAX_ANGGOTA = 8;

function formatDateDisplay(
  date: Date | null,
  placeholder: string,
  locale: string,
) {
  if (!date) return placeholder;
  return date.toLocaleDateString(locale, {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
function formatDateForDb(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default function TambahAnggotaScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = Boolean(id);

  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [nama, setNama] = useState("");
  const [tanggalLahir, setTanggalLahir] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [nik, setNik] = useState("");
  const [jenisKelamin, setJenisKelamin] = useState<Gender>(null);
  const [hubungan, setHubungan] = useState("");
  const [noBpjs, setNoBpjs] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [activeField, setActiveField] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const fieldOffsets = useRef<Record<string, number>>({}).current;
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvt =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvt =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvt, () =>
      setKeyboardVisible(true),
    );
    const hideSub = Keyboard.addListener(hideEvt, () =>
      setKeyboardVisible(false),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Menggeser ScrollView agar kolom yang sedang diisi tidak tertutup keyboard.
  const scrollToField = (key: string) => {
    // Tunggu KeyboardAvoidingView selesai resize dulu, supaya offset
    // scroll dihitung dari layout yang sudah final (kolom bawah tidak tertutup keyboard).
    setTimeout(() => {
      const y = fieldOffsets[key];
      if (y === undefined) return;
      scrollRef.current?.scrollTo({ y: Math.max(y - 16, 0), animated: true });
    }, 120);
  };

  useEffect(() => {
    if (!isEdit) return;
    const load = async () => {
      const { data } = await supabase
        .from("anggota_keluarga")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (data) {
        setNama(data.nama ?? "");
        setTanggalLahir(
          data.tanggal_lahir ? new Date(data.tanggal_lahir) : null,
        );
        setNik(data.nik ?? "");
        setJenisKelamin(data.jenis_kelamin ?? null);
        setHubungan(data.hubungan ?? "");
        setNoBpjs(data.no_bpjs ?? "");
      }
      setInitialLoading(false);
    };
    load();
  }, [id]);

  const handleSave = async () => {
    setErrorMsg("");
    if (!nama || !tanggalLahir || !jenisKelamin || !hubungan) {
      setErrorMsg(t("addFamilyMember.errorRequiredFields"));
      return;
    }

    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      setErrorMsg(t("editProfile.errorSessionNotFound"));
      return;
    }

    // Cadangan pengecekan batas -- pencegahan utama sudah di anggota-keluarga.tsx,
    // ini jaga-jaga kalau ada jalan lain masuk ke halaman ini.
    if (!isEdit) {
      const { count } = await supabase
        .from("anggota_keluarga")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);
      if ((count ?? 0) >= MAX_ANGGOTA) {
        setLoading(false);
        setErrorMsg(
          `${t("addFamilyMember.errorLimitPrefix")}${MAX_ANGGOTA}${t("addFamilyMember.errorLimitSuffix")}`,
        );
        return;
      }
    }

    const payload = {
      user_id: user.id,
      nama,
      tanggal_lahir: formatDateForDb(tanggalLahir),
      nik: nik || null,
      jenis_kelamin: jenisKelamin,
      hubungan,
      no_bpjs: noBpjs || null,
    };

    const { error } = isEdit
      ? await supabase.from("anggota_keluarga").update(payload).eq("id", id)
      : await supabase.from("anggota_keluarga").insert(payload);

    setLoading(false);
    if (error) {
      setErrorMsg(t("addFamilyMember.errorSaveFailed"));
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }} edges={["top"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="arrow-back" size={22} color="#0D9488" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEdit
              ? t("addFamilyMember.titleEdit")
              : t("addFamilyMember.titleAdd")}
          </Text>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View onLayout={(e) => (fieldOffsets.nama = e.nativeEvent.layout.y)}>
            <Text style={styles.label}>
              {t("addFamilyMember.fullNameLabel")}{" "}
              <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                activeField === "nama" && styles.inputActive,
              ]}
              placeholder={t("addFamilyMember.fullNamePlaceholder")}
              placeholderTextColor="#A0A0A0"
              value={nama}
              onChangeText={setNama}
              onFocus={() => {
                setActiveField("nama");
                scrollToField("nama");
              }}
              onBlur={() => setActiveField(null)}
            />
          </View>

          <View
            onLayout={(e) =>
              (fieldOffsets.tanggalLahir = e.nativeEvent.layout.y)
            }
          >
            <Text style={[styles.label, { marginTop: 18 }]}>
              {t("addFamilyMember.birthDateLabel")}{" "}
              <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={[styles.input, showDatePicker && styles.inputActive]}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.7}
            >
              <Text
                style={
                  tanggalLahir ? styles.inputText : styles.inputPlaceholder
                }
              >
                {formatDateDisplay(
                  tanggalLahir,
                  t("editProfile.birthDatePlaceholder"),
                  t("editProfile.dateLocale"),
                )}
              </Text>
            </TouchableOpacity>
            <DateOfBirthPicker
              visible={showDatePicker}
              value={tanggalLahir}
              minimumDate={new Date(1920, 0, 1)}
              maximumDate={new Date()}
              onClose={() => setShowDatePicker(false)}
              onConfirm={(date) => {
                setTanggalLahir(date);
                setShowDatePicker(false);
              }}
            />
          </View>

          <View onLayout={(e) => (fieldOffsets.nik = e.nativeEvent.layout.y)}>
            <Text style={[styles.label, { marginTop: 18 }]}>
              {t("addFamilyMember.nikLabel")}
            </Text>
            <TextInput
              style={[
                styles.input,
                activeField === "nik" && styles.inputActive,
              ]}
              placeholder={t("addFamilyMember.nikPlaceholder")}
              placeholderTextColor="#A0A0A0"
              keyboardType="number-pad"
              maxLength={16}
              value={nik}
              onChangeText={(val) => setNik(val.replace(/[^0-9]/g, ""))}
              onFocus={() => {
                setActiveField("nik");
                scrollToField("nik");
              }}
              onBlur={() => setActiveField(null)}
            />
          </View>

          <Text style={[styles.label, { marginTop: 18 }]}>
            {t("editProfile.genderLabel")}{" "}
            <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.genderRow}>
            <TouchableOpacity
              style={[
                styles.genderOption,
                jenisKelamin === "Laki-laki" && styles.genderOptionActive,
              ]}
              onPress={() => setJenisKelamin("Laki-laki")}
            >
              <Ionicons
                name="male"
                size={18}
                color={jenisKelamin === "Laki-laki" ? "#fff" : "#0D9488"}
              />
              <Text
                style={[
                  styles.genderText,
                  jenisKelamin === "Laki-laki" && styles.genderTextActive,
                ]}
              >
                {t("editProfile.genderMale")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.genderOption,
                jenisKelamin === "Perempuan" && styles.genderOptionActive,
              ]}
              onPress={() => setJenisKelamin("Perempuan")}
            >
              <Ionicons
                name="female"
                size={18}
                color={jenisKelamin === "Perempuan" ? "#fff" : "#0D9488"}
              />
              <Text
                style={[
                  styles.genderText,
                  jenisKelamin === "Perempuan" && styles.genderTextActive,
                ]}
              >
                {t("editProfile.genderFemale")}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.label, { marginTop: 18 }]}>
            {t("addFamilyMember.relationLabel")}{" "}
            <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.chipWrap}>
            {HUBUNGAN_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.chip,
                  hubungan === opt.value && styles.chipActive,
                ]}
                onPress={() => setHubungan(opt.value)}
              >
                <Text
                  style={[
                    styles.chipText,
                    hubungan === opt.value && styles.chipTextActive,
                  ]}
                >
                  {t(opt.labelKey)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View
            onLayout={(e) => (fieldOffsets.noBpjs = e.nativeEvent.layout.y)}
          >
            <Text style={[styles.label, { marginTop: 18 }]}>
              {t("addFamilyMember.bpjsLabel")}
            </Text>
            <TextInput
              style={[
                styles.input,
                activeField === "noBpjs" && styles.inputActive,
              ]}
              placeholder={t("addFamilyMember.bpjsPlaceholder")}
              placeholderTextColor="#A0A0A0"
              value={noBpjs}
              onChangeText={setNoBpjs}
              onFocus={() => {
                setActiveField("noBpjs");
                scrollToField("noBpjs");
              }}
              onBlur={() => setActiveField(null)}
            />
          </View>
        </ScrollView>

        <View
          style={[
            styles.footer,
            {
              paddingBottom: keyboardVisible ? 16 : Math.max(insets.bottom, 16),
            },
          ]}
        >
          {errorMsg ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={16} color="#DC2626" />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading
                ? t("editProfile.saving")
                : t("addFamilyMember.saveButton")}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F1F1",
  },
  headerTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 16,
    color: "#0D9488",
  },
  scrollContent: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 24 },
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
    justifyContent: "center",
  },
  inputText: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 15,
    color: "#222",
  },
  inputPlaceholder: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 15,
    color: "#A0A0A0",
  },
  inputActive: {
    borderColor: "#0D9488",
    borderWidth: 1.5,
  },
  required: { color: "#DC2626" },
  genderRow: { flexDirection: "row", gap: 12 },
  genderOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#0D9488",
    borderRadius: 12,
    paddingVertical: 13,
  },
  genderOptionActive: {
    backgroundColor: "#0D9488",
    shadowColor: "#0D9488",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  genderText: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 14,
    color: "#0D9488",
  },
  genderTextActive: { color: "#fff" },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  chipActive: {
    backgroundColor: "#0D9488",
    borderColor: "#0D9488",
    shadowColor: "#0D9488",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  chipText: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 13,
    color: "#555",
  },
  chipTextActive: { color: "#fff" },
  footer: {
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: "#EEF2F1",
    paddingHorizontal: 24,
    paddingTop: 14,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -4 },
    elevation: 6,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEF2F2",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorText: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 13,
    color: "#DC2626",
    flex: 1,
  },
  saveButton: {
    backgroundColor: "#0D9488",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },
  saveButtonText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: "#fff",
    fontSize: 16,
  },
});
