import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ReactNode, useEffect, useRef, useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
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
import { useLanguage } from "../lib/LanguageContext";
import { supabase } from "../lib/supabase";

const WARNA_HEADER = "#1F2937";
const MIN_PASSWORD = 8; // sama dengan register.tsx

function skorSandi(pw: string) {
  if (pw.length < MIN_PASSWORD) return 1;
  let skor = 2;
  if (/[A-Za-z]/.test(pw) && /\d/.test(pw)) skor = 3;
  if (skor === 3 && (pw.length >= 12 || /[^A-Za-z0-9]/.test(pw))) skor = 4;
  return skor;
}

const WARNA_SANDI = ["", "#DC2626", "#F59E0B", "#0D9488", "#0B7A55"];

function KekuatanSandi({ password }: { password: string }) {
  const { t } = useLanguage();
  const skor = skorSandi(password);

  const labelSandi = [
    "",
    t("security.strengthTooShort"),
    t("security.strengthFair"),
    t("security.strengthGood"),
    t("security.strengthStrong"),
  ];

  return (
    <View style={styles.kekuatanRow}>
      <View style={styles.kekuatanBars}>
        {[1, 2, 3, 4].map((i) => (
          <View
            key={i}
            style={[
              styles.kekuatanBar,
              { backgroundColor: i <= skor ? WARNA_SANDI[skor] : "#E5E7EB" },
            ]}
          />
        ))}
      </View>
      <Text style={[styles.kekuatanText, { color: WARNA_SANDI[skor] }]}>
        {labelSandi[skor]}
      </Text>
    </View>
  );
}

type Errors = { current?: string; new?: string; confirm?: string };
type Message = { type: "success" | "error"; text: string } | null;

type PasswordFieldProps = {
  label: string;
  placeholder: string;
  hint: string;
  value: string;
  onChangeText: (t: string) => void;
  error?: string;
  // Pesan positif (mis. "Kata sandi cocok") menggantikan hint
  okText?: string;
  first?: boolean;
  isNew?: boolean;
  below?: ReactNode;
  onFocusInput: (input: TextInput | null) => void;
};

// Kolom kata sandi: outline teal saat aktif, teal lembut saat terisi, merah saat error.
// Selalu punya satu baris hint di bawahnya (diganti error/ok) agar tata letak tidak melompat.
function PasswordField(p: PasswordFieldProps) {
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const thick = focused || !!p.error;

  return (
    <View style={p.first ? undefined : { marginTop: 16 }}>
      <Text style={styles.label}>{p.label}</Text>
      <View
        style={[
          styles.inputWrap,
          !!p.value && styles.inputFilled,
          focused && styles.inputFocused,
          !!p.error && styles.inputError,
        ]}
      >
        <TextInput
          ref={inputRef}
          style={[styles.input, thick && { paddingVertical: 12.5 }]}
          secureTextEntry={!show}
          value={p.value}
          onChangeText={p.onChangeText}
          placeholder={p.placeholder}
          placeholderTextColor="#A0A0A0"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete={p.isNew ? "password-new" : "current-password"}
          textContentType={p.isNew ? "newPassword" : "password"}
          onFocus={() => {
            setFocused(true);
            p.onFocusInput(inputRef.current);
          }}
          onBlur={() => setFocused(false)}
        />
        <TouchableOpacity style={styles.eyeBtn} onPress={() => setShow(!show)}>
          <Ionicons name={show ? "eye-off" : "eye"} size={20} color="#888" />
        </TouchableOpacity>
      </View>
      {p.error ? (
        <Text style={[styles.hint, { color: "#DC2626" }]}>{p.error}</Text>
      ) : p.okText ? (
        <Text style={[styles.hint, { color: "#0D9488" }]}>{p.okText}</Text>
      ) : p.below ? (
        p.below
      ) : (
        <Text style={styles.hint}>{p.hint}</Text>
      )}
    </View>
  );
}

export default function KeamananScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();

  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [message, setMessage] = useState<Message>(null);

  const scrollRef = useRef<ScrollView>(null);
  // ScrollView tidak punya measureInWindow di tipe TypeScript; ukur pembungkusnya (View).
  const scrollBoxRef = useRef<View>(null);
  const scrollY = useRef(0);
  const keyboardOpenRef = useRef(false);
  const pendingInput = useRef<TextInput | null>(null);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    supabase.auth
      .getUser()
      .then(({ data }) => setEmail(data.user?.email ?? ""));
  }, []);

  // Ukur posisi nyata kolom & area gulir di layar, gulir secukupnya agar kolom
  // (beserta hint di bawahnya) terlihat di atas keyboard dan tombol Simpan.
  const tampilkanKolom = (input: TextInput | null) => {
    if (!input || !scrollBoxRef.current) return;
    scrollBoxRef.current.measureInWindow((_sx, sy, _sw, sh) => {
      input.measureInWindow((_ix, iy, _iw, ih) => {
        const atas = sy + 16;
        const bawah = sy + sh - 40; // sisakan ruang untuk baris hint
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

  const fokusKolom = (input: TextInput | null) => {
    if (keyboardOpenRef.current) setTimeout(() => tampilkanKolom(input), 80);
    else pendingInput.current = input;
  };

  // Mengetik menghapus error kolom itu dan pesan di footer
  const ubah =
    (key: keyof Errors, set: (text: string) => void) => (text: string) => {
      set(text);
      setMessage(null);
      if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
    };

  const handleChangePassword = async () => {
    Keyboard.dismiss();
    setMessage(null);

    const e: Errors = {};
    if (!currentPassword) e.current = t("security.errorCurrentRequired");
    if (!newPassword) e.new = t("security.errorNewRequired");
    else if (newPassword.length < MIN_PASSWORD)
      e.new = t("security.errorNewMinLength");
    else if (newPassword === currentPassword)
      e.new = t("security.errorNewSameAsCurrent");
    if (!confirmPassword) e.confirm = t("security.errorConfirmRequired");
    else if (newPassword && confirmPassword !== newPassword)
      e.confirm = t("security.errorConfirmMismatch");
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setErrors({});

    setLoading(true);
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });
    if (verifyError) {
      setLoading(false);
      setErrors({ current: t("security.errorCurrentWrong") });
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (error) {
      setMessage({
        type: "error",
        text: t("security.errorGeneric"),
      });
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setMessage({ type: "success", text: t("security.successMessage") });
  };

  const handleLogoutAllDevices = () => {
    Alert.alert(
      t("security.logoutAllAlertTitle"),
      t("security.logoutAllAlertMessage"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("profile.logoutButton"),
          style: "destructive",
          onPress: async () => {
            await supabase.auth.signOut({ scope: "global" });
          },
        },
      ],
    );
  };

  const semuaTerisi = !!(currentPassword && newPassword && confirmPassword);
  // Hint langsung untuk konfirmasi: cocok / belum cocok (hanya setelah panjangnya sama)
  const confirmLive =
    confirmPassword && newPassword
      ? confirmPassword === newPassword
        ? { ok: t("security.passwordMatch") }
        : confirmPassword.length >= newPassword.length
          ? { err: t("security.passwordMismatch") }
          : {}
      : {};

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* "padding" agar area gulir & tombol Simpan terdorong ke atas keyboard (Android edge-to-edge) */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="arrow-back" size={22} color={WARNA_HEADER} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("security.title")}</Text>
          <View style={{ width: 22 }} />
        </View>

        <View ref={scrollBoxRef} collapsable={false} style={{ flex: 1 }}>
          <ScrollView
            ref={scrollRef}
            onScroll={(ev) => {
              scrollY.current = ev.nativeEvent.contentOffset.y;
            }}
            scrollEventThrottle={16}
            contentContainerStyle={[
              styles.scrollContent,
              keyboardOpen && { paddingBottom: 56 },
            ]}
            keyboardShouldPersistTaps="handled"
          >
            <LinearGradient
              colors={["#0B6E64", "#12A594"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.hero}
            >
              {/* Ikon dirender pertama sehingga berada di lapisan bawah, teks di atasnya */}
              <Ionicons
                name="shield-checkmark"
                size={132}
                color="rgba(255,255,255,0.14)"
                style={styles.heroIcon}
              />
              <Text style={styles.heroTitle}>{t("security.heroTitle")}</Text>
              <Text style={styles.heroSubtitle}>
                {t("security.heroSubtitle")}
              </Text>
              <View style={styles.heroEmail}>
                <Ionicons name="mail-outline" size={14} color="#fff" />
                <Text style={styles.heroEmailText} numberOfLines={1}>
                  {email}
                </Text>
              </View>
            </LinearGradient>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                {t("security.changePasswordTitle")}
              </Text>
              <Text style={styles.cardDesc}>
                {t("security.changePasswordDesc")}
              </Text>

              <PasswordField
                first
                label={t("security.currentPasswordLabel")}
                placeholder={t("security.currentPasswordPlaceholder")}
                hint={t("security.currentPasswordHint")}
                value={currentPassword}
                onChangeText={ubah("current", setCurrentPassword)}
                error={errors.current}
                onFocusInput={fokusKolom}
              />
              <PasswordField
                isNew
                label={t("security.newPasswordLabel")}
                placeholder={t("security.newPasswordPlaceholder")}
                hint={t("security.newPasswordHint")}
                value={newPassword}
                onChangeText={ubah("new", setNewPassword)}
                error={errors.new}
                below={
                  newPassword ? (
                    <KekuatanSandi password={newPassword} />
                  ) : undefined
                }
                onFocusInput={fokusKolom}
              />
              <PasswordField
                isNew
                label={t("security.confirmPasswordLabel")}
                placeholder={t("security.confirmPasswordPlaceholder")}
                hint={t("security.confirmPasswordHint")}
                value={confirmPassword}
                onChangeText={ubah("confirm", setConfirmPassword)}
                error={errors.confirm ?? confirmLive.err}
                okText={confirmLive.ok}
                onFocusInput={fokusKolom}
              />
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                {t("security.deviceSessionsTitle")}
              </Text>
              <Text style={styles.cardDesc}>
                {t("security.deviceSessionsDesc")}
              </Text>
              <TouchableOpacity
                style={styles.dangerButton}
                onPress={handleLogoutAllDevices}
                activeOpacity={0.8}
              >
                <Ionicons name="log-out-outline" size={18} color="#DC2626" />
                <Text style={styles.dangerText}>
                  {t("security.logoutAllButton")}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>

        <View
          style={[
            styles.footer,
            { paddingBottom: keyboardOpen ? 12 : Math.max(insets.bottom, 16) },
          ]}
        >
          {message ? (
            <View style={styles.messageRow}>
              <Ionicons
                name={
                  message.type === "success"
                    ? "checkmark-circle"
                    : "alert-circle"
                }
                size={16}
                color={message.type === "success" ? "#0D9488" : "#DC2626"}
              />
              <Text
                style={[
                  styles.messageText,
                  { color: message.type === "success" ? "#0D9488" : "#DC2626" },
                ]}
              >
                {message.text}
              </Text>
            </View>
          ) : null}
          <TouchableOpacity
            style={[
              styles.saveButton,
              !semuaTerisi && styles.saveButtonDisabled,
              loading && { opacity: 0.75 },
            ]}
            onPress={handleChangePassword}
            disabled={!semuaTerisi || loading}
            activeOpacity={0.85}
          >
            <Text style={styles.saveButtonText}>
              {loading
                ? t("security.processingButton")
                : t("security.saveButton")}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  hero: {
    borderRadius: 20,
    padding: 20,
    overflow: "hidden",
  },
  heroIcon: { position: "absolute", right: -16, bottom: -24 },
  heroTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 17,
    color: "#fff",
  },
  heroSubtitle: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 13,
    lineHeight: 19,
    color: "rgba(255,255,255,0.88)",
    marginTop: 6,
    maxWidth: "82%",
  },
  heroEmail: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    maxWidth: "100%",
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  heroEmailText: {
    flexShrink: 1,
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 12,
    color: "#fff",
  },
  kekuatanRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
    minHeight: 17,
  },
  kekuatanBars: { flex: 1, flexDirection: "row", gap: 4 },
  kekuatanBar: { flex: 1, height: 4, borderRadius: 2 },
  kekuatanText: { fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 12 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#EEF2F1",
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  cardTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 15,
    color: "#1F2937",
    marginBottom: 4,
  },
  cardDesc: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 12.5,
    color: "#6B7280",
    lineHeight: 18,
    marginBottom: 16,
  },
  label: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 14,
    color: "#333",
    marginBottom: 8,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    paddingLeft: 14,
    paddingRight: 4,
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    fontFamily: "PlusJakartaSans_400Regular",
    paddingVertical: 13,
    fontSize: 15,
    color: "#222",
  },
  inputFilled: { borderColor: "#A7D8D0" },
  inputFocused: {
    borderColor: "#0D9488",
    borderWidth: 1.5,
    paddingLeft: 13.5,
    paddingRight: 3.5,
  },
  inputError: {
    borderColor: "#DC2626",
    borderWidth: 1.5,
    paddingLeft: 13.5,
    paddingRight: 3.5,
  },
  eyeBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  hint: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 12,
    lineHeight: 17,
    color: "#6B7280",
    marginTop: 6,
    marginLeft: 2,
  },
  dangerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#F3B8B4",
    backgroundColor: "#FFF7F6",
  },
  dangerText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 14,
    color: "#DC2626",
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#EEF2F1",
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: "#fff",
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  messageText: {
    flex: 1,
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 13,
  },
  saveButton: {
    backgroundColor: "#0D9488",
    borderRadius: 14,
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonDisabled: { backgroundColor: "#B0D4D0" },
  saveButtonText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: "#fff",
    fontSize: 15,
  },
});
