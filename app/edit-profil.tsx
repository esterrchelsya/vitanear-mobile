import { Ionicons } from "@expo/vector-icons";
import { decode } from "base64-arraybuffer";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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
import { formatPhoneInput } from "../lib/phone";
import { supabase } from "../lib/supabase";

type Gender = "Laki-laki" | "Perempuan" | null;

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
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
function parseDateFromDb(value: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

export default function EditProfilScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();

  const [initialLoading, setInitialLoading] = useState(true);
  const [nama, setNama] = useState("");
  const [nik, setNik] = useState("");
  const [noHp, setNoHp] = useState("");
  const [tanggalLahir, setTanggalLahir] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [jenisKelamin, setJenisKelamin] = useState<Gender>(null);
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [uploadingFoto, setUploadingFoto] = useState(false);
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
    const loadProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setInitialLoading(false);
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("nama, nik, no_hp, tanggal_lahir, jenis_kelamin, foto_profil")
        .eq("id", user.id)
        .maybeSingle();

      if (data) {
        setNama(data.nama ?? "");
        setNik(data.nik ?? "");
        setNoHp((data.no_hp ?? "").replace(/^\+62/, ""));
        setTanggalLahir(parseDateFromDb(data.tanggal_lahir));
        setJenisKelamin((data.jenis_kelamin as Gender) ?? null);
        setFotoUri(data.foto_profil ?? null);
      }
      setInitialLoading(false);
    };
    loadProfile();
  }, []);

  const handlePickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        t("editProfile.permissionTitle"),
        t("editProfile.permissionMessage"),
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"], // API baru: array, menggantikan MediaTypeOptions yang deprecated
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled) return;
    setFotoUri(result.assets[0].uri);
  };

  // Dibaca sebagai base64 lalu di-decode ke ArrayBuffer.
  // fetch(uri).blob() SENGAJA TIDAK dipakai: di React Native, blob dari file://
  // lokal sering kosong/rusak tanpa error yang jelas, sehingga upload
  // "berhasil" tapi isinya kosong atau malah gagal total.
  const uploadPhoto = async (uri: string, userId: string) => {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const fileExt = uri.split(".").pop()?.toLowerCase() || "jpg";
    const filePath = `${userId}/avatar.${fileExt}`;
    const contentType = fileExt === "png" ? "image/png" : "image/jpeg";

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, decode(base64), { upsert: true, contentType });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    // Tambahkan cache-buster supaya foto baru langsung tampil,
    // tidak ke-cache oleh <Image> memakai foto lama dengan URL yang sama persis.
    return `${data.publicUrl}?t=${Date.now()}`;
  };

  const handleSave = async () => {
    setErrorMsg("");
    if (!nama || !noHp || !tanggalLahir || !jenisKelamin || nik.length !== 16) {
      setErrorMsg(t("editProfile.errorEmptyFields"));
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

    let fotoUrl: string | undefined;
    if (fotoUri && fotoUri.startsWith("file")) {
      try {
        setUploadingFoto(true);
        fotoUrl = await uploadPhoto(fotoUri, user.id);
      } catch (err) {
        console.error("Upload foto gagal:", err);
        setUploadingFoto(false);
        setLoading(false);
        Alert.alert(
          t("editProfile.errorUploadTitle"),
          t("editProfile.errorUploadMessage"),
        );
        return; // berhenti di sini -> pengguna tahu ada yang gagal, tidak diam-diam dilewati
      }
      setUploadingFoto(false);
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        nama,
        nik,
        no_hp: `+62${noHp}`,
        tanggal_lahir: formatDateForDb(tanggalLahir),
        jenis_kelamin: jenisKelamin,
        ...(fotoUrl ? { foto_profil: fotoUrl } : {}),
      })
      .eq("id", user.id);

    setLoading(false);
    if (error) {
      setErrorMsg(t("editProfile.errorSaveFailed"));
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
            <Ionicons name="arrow-back" size={22} color="#222" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("editProfile.title")}</Text>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.avatarWrapper}>
            <TouchableOpacity
              onPress={handlePickPhoto}
              disabled={uploadingFoto}
            >
              {fotoUri ? (
                <Image source={{ uri: fotoUri }} style={styles.avatarImage} />
              ) : (
                <LinearGradient
                  colors={["#E1F5EE", "#C7EAE0"]}
                  style={styles.avatarCircle}
                >
                  <Ionicons name="person" size={40} color="#0D9488" />
                </LinearGradient>
              )}
              <View style={styles.avatarBadge}>
                <Ionicons name="camera" size={13} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <View
              onLayout={(e) => (fieldOffsets.nama = e.nativeEvent.layout.y)}
            >
              <Text style={styles.label}>{t("editProfile.fullNameLabel")}</Text>
              <TextInput
                style={[
                  styles.input,
                  activeField === "nama" && styles.inputActive,
                ]}
                value={nama}
                onChangeText={setNama}
                onFocus={() => {
                  setActiveField("nama");
                  scrollToField("nama");
                }}
                onBlur={() => setActiveField(null)}
                placeholder={t("editProfile.fullNamePlaceholder")}
                placeholderTextColor="#A0A0A0"
              />
            </View>

            <View
              onLayout={(e) =>
                (fieldOffsets.tanggalLahir = e.nativeEvent.layout.y)
              }
            >
              <Text style={[styles.label, { marginTop: 18 }]}>
                {t("editProfile.birthDateLabel")}
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
                {t("editProfile.nikLabel")}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  activeField === "nik" && styles.inputActive,
                ]}
                keyboardType="number-pad"
                maxLength={16}
                value={nik}
                onChangeText={(val) => setNik(val.replace(/[^0-9]/g, ""))}
                onFocus={() => {
                  setActiveField("nik");
                  scrollToField("nik");
                }}
                onBlur={() => setActiveField(null)}
                placeholder={t("editProfile.nikPlaceholder")}
                placeholderTextColor="#A0A0A0"
              />
              <Text style={styles.helperText}>
                {t("editProfile.nikHelper")}
              </Text>
            </View>

            <Text style={[styles.label, { marginTop: 18 }]}>
              {t("editProfile.genderLabel")}
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

            <View
              onLayout={(e) => (fieldOffsets.noHp = e.nativeEvent.layout.y)}
            >
              <Text style={[styles.label, { marginTop: 18 }]}>
                {t("editProfile.phoneLabel")}
              </Text>
              <View style={styles.phoneRow}>
                <View style={styles.phonePrefix}>
                  <Text style={styles.phonePrefixText}>+62</Text>
                </View>
                <TextInput
                  style={[
                    styles.phoneInput,
                    activeField === "noHp" && styles.inputActive,
                  ]}
                  keyboardType="phone-pad"
                  value={formatPhoneInput(noHp)}
                  onChangeText={(text) => setNoHp(text.replace(/[^0-9]/g, ""))}
                  onFocus={() => {
                    setActiveField("noHp");
                    scrollToField("noHp");
                  }}
                  onBlur={() => setActiveField(null)}
                  placeholder={t("editProfile.phonePlaceholder")}
                  placeholderTextColor="#A0A0A0"
                />
              </View>
            </View>
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
          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {uploadingFoto
                ? t("editProfile.uploadingPhoto")
                : loading
                  ? t("editProfile.saving")
                  : t("editProfile.saveButton")}
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
    color: "#222",
  },
  scrollContent: { paddingHorizontal: 24, paddingTop: 28, paddingBottom: 24 },
  avatarWrapper: { alignItems: "center", marginBottom: 28 },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: { width: 88, height: 88, borderRadius: 44 },
  avatarBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#0D9488",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  form: {},
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
  helperText: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 11.5,
    color: "#888",
    marginTop: 6,
  },
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
  genderOptionActive: { backgroundColor: "#0D9488" },
  genderText: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 14,
    color: "#0D9488",
  },
  genderTextActive: { color: "#fff" },
  phoneRow: { flexDirection: "row", gap: 8 },
  phonePrefix: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    justifyContent: "center",
  },
  phonePrefixText: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 15,
    color: "#222",
  },
  phoneInput: {
    flex: 1,
    fontFamily: "PlusJakartaSans_400Regular",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: "#222",
  },
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
  errorText: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 13,
    color: "#DC2626",
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
