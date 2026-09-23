import { Ionicons } from "@expo/vector-icons";
import { decode } from "base64-arraybuffer";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DateOfBirthPicker from "../components/DateOfBirthPicker";
import { useAuth } from "../lib/AuthContext";
import { useLanguage } from "../lib/LanguageContext";
import { formatPhoneInput } from "../lib/phone";
import { supabase } from "../lib/supabase";

// Value internal TETAP "Laki-laki"/"Perempuan" (Bahasa Indonesia) karena ini
// yang disimpan ke kolom `jenis_kelamin` di database. Yang berubah cuma teks
// yang DITAMPILKAN ke user (lewat t("completeProfile.genderMale"/"genderFemale")),
// bukan value yang dikirim ke Supabase.
type Gender = "Laki-laki" | "Perempuan" | null;

function formatDateDisplay(
  date: Date | null,
  locale: string,
  placeholder: string,
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

export default function CompleteProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { refreshProfile } = useAuth();
  const { t } = useLanguage();

  const [nama, setNama] = useState("");
  const [nik, setNik] = useState("");
  const [noHp, setNoHp] = useState("");
  const [tanggalLahir, setTanggalLahir] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [jenisKelamin, setJenisKelamin] = useState<Gender>(null);
  const [setuju, setSetuju] = useState(false);
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handlePickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        t("completeProfile.permissionTitle"),
        t("completeProfile.permissionMessage"),
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled) return;
    setFotoUri(result.assets[0].uri);
  };

  // Sama seperti edit-profil.tsx: base64 + ArrayBuffer, BUKAN fetch().blob()
  // yang sering gagal diam-diam di RN untuk file lokal.
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
    return `${data.publicUrl}?t=${Date.now()}`;
  };

  const handleSave = async () => {
    setErrorMsg("");

    if (!nama || !noHp || !tanggalLahir || !jenisKelamin || !nik) {
      setErrorMsg(t("completeProfile.errorEmptyFields"));
      return;
    }
    if (nik.length !== 16) {
      setErrorMsg(t("completeProfile.errorNikLength"));
      return;
    }
    if (!setuju) {
      setErrorMsg(t("completeProfile.errorConsentRequired"));
      return;
    }

    setLoading(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setLoading(false);
      setErrorMsg(t("completeProfile.errorSessionNotFound"));
      return;
    }

    let fotoUrl: string | undefined;

    // upsert: kalau baris profil belum ada (mis. akun dibuat sebelum trigger
    // handle_new_user dipasang) baris dibuat sekarang; kalau sudah ada, di-update.
    // .select("id") memastikan ada baris yang benar-benar tersimpan. Tanpa itu,
    // update yang mengenai 0 baris tetap dianggap "sukses" dan user terlempar
    // balik ke halaman ini terus-menerus.
    const { data: saved, error } = await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          nama,
          nik,
          no_hp: `+62${noHp}`,
          tanggal_lahir: formatDateForDb(tanggalLahir),
          jenis_kelamin: jenisKelamin,
        },
        { onConflict: "id" },
      )
      .select("id");

    if (error || !saved || saved.length === 0) {
      console.log("Simpan profil gagal:", error, saved);
      setLoading(false);
      setErrorMsg(t("completeProfile.errorSaveFailed"));
      return;
    }

    // Foto tetap opsional & tidak menggagalkan simpan data utama.
    if (fotoUri) {
      try {
        setUploadingFoto(true);
        fotoUrl = await uploadPhoto(fotoUri, user.id);
        await supabase
          .from("profiles")
          .update({ foto_profil: fotoUrl })
          .eq("id", user.id);
      } catch (err) {
        console.error("Upload foto gagal:", err);
        // sengaja diabaikan -- profil tetap dianggap lengkap tanpa foto
      }
      setUploadingFoto(false);
    }

    setLoading(false);
    await refreshProfile?.();
    router.replace("/home");
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#fff" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.avatarWrapper}>
          <TouchableOpacity onPress={handlePickPhoto} disabled={uploadingFoto}>
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

        <Text style={styles.title}>{t("completeProfile.title")}</Text>
        <Text style={styles.subtitle}>{t("completeProfile.subtitle")}</Text>

        <View style={styles.form}>
          <Text style={styles.label}>{t("completeProfile.fullNameLabel")}</Text>
          <TextInput
            style={styles.input}
            placeholder={t("completeProfile.fullNamePlaceholder")}
            placeholderTextColor="#A0A0A0"
            value={nama}
            onChangeText={setNama}
          />

          <Text style={[styles.label, { marginTop: 18 }]}>
            {t("completeProfile.birthDateLabel")}
          </Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.7}
          >
            <Text
              style={tanggalLahir ? styles.inputText : styles.inputPlaceholder}
            >
              {formatDateDisplay(
                tanggalLahir,
                t("completeProfile.dateLocale"),
                t("completeProfile.birthDatePlaceholder"),
              )}
            </Text>
          </TouchableOpacity>

          <DateOfBirthPicker
            visible={showDatePicker}
            value={tanggalLahir}
            minimumDate={new Date(new Date().getFullYear() - 100, 0, 1)}
            maximumDate={new Date()}
            onClose={() => setShowDatePicker(false)}
            onConfirm={(date) => {
              setTanggalLahir(date);
              setShowDatePicker(false);
            }}
          />

          <Text style={[styles.label, { marginTop: 18 }]}>
            {t("completeProfile.nikLabel")}
          </Text>
          <TextInput
            style={styles.input}
            placeholder={t("completeProfile.nikPlaceholder")}
            placeholderTextColor="#A0A0A0"
            keyboardType="number-pad"
            maxLength={16}
            value={nik}
            onChangeText={(text) => setNik(text.replace(/[^0-9]/g, ""))}
          />
          <Text style={styles.helperText}>
            {t("completeProfile.nikHelper")}
          </Text>

          <Text style={[styles.label, { marginTop: 18 }]}>
            {t("completeProfile.genderLabel")}
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
                {t("completeProfile.genderMale")}
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
                {t("completeProfile.genderFemale")}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.label, { marginTop: 18 }]}>
            {t("completeProfile.phoneLabel")}
          </Text>
          <View style={styles.phoneRow}>
            <View style={styles.phonePrefix}>
              <Text style={styles.phonePrefixText}>+62</Text>
            </View>
            <TextInput
              style={styles.phoneInput}
              placeholder={t("completeProfile.phonePlaceholder")}
              placeholderTextColor="#A0A0A0"
              keyboardType="phone-pad"
              value={formatPhoneInput(noHp)}
              onChangeText={(text) => setNoHp(text.replace(/[^0-9]/g, ""))}
            />
          </View>
        </View>
      </ScrollView>

      <View
        style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}
      >
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setSetuju(!setuju)}
          activeOpacity={0.8}
        >
          <View style={[styles.checkbox, setuju && styles.checkboxChecked]}>
            {setuju ? (
              <Ionicons name="checkmark" size={14} color="#fff" />
            ) : null}
          </View>
          <Text style={styles.checkboxLabel}>
            {t("completeProfile.consentText")}
          </Text>
        </TouchableOpacity>

        {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {uploadingFoto
              ? t("completeProfile.uploadingPhoto")
              : loading
                ? t("completeProfile.saving")
                : t("completeProfile.saveButton")}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: 24, paddingTop: 32, paddingBottom: 24 },
  avatarWrapper: { alignItems: "center", marginBottom: 16 },
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
  title: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 18,
    color: "#222",
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    marginBottom: 28,
    paddingHorizontal: 12,
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
    borderTopWidth: 1,
    borderTopColor: "#EEF2F1",
    paddingHorizontal: 24,
    paddingTop: 14,
    backgroundColor: "#fff",
  },
  checkboxRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: "#0D9488",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  checkboxChecked: { backgroundColor: "#0D9488" },
  checkboxLabel: {
    flex: 1,
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 12.5,
    color: "#555",
    lineHeight: 18,
  },
  errorText: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 13,
    color: "#DC2626",
    marginTop: 10,
  },
  saveButton: {
    backgroundColor: "#0D9488",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 14,
  },
  saveButtonText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: "#fff",
    fontSize: 16,
  },
});
