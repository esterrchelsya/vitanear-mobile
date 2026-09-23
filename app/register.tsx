import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
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
import Svg, { Path } from "react-native-svg";
import { useLanguage } from "../lib/LanguageContext";
import { GOOGLE_NATIVE_UNAVAILABLE, signInWithGoogle } from "../lib/googleAuth";
import { supabase } from "../lib/supabase";

function GoogleIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18">
      <Path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.259h2.908c1.702-1.567 2.684-3.874 2.684-6.617z"
        fill="#4285F4"
      />
      <Path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
        fill="#34A853"
      />
      <Path
        d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <Path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </Svg>
  );
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

// Menerjemahkan pesan error mentah dari Supabase ke key translation kita,
// supaya user tidak pernah melihat teks bahasa Inggris "bocor" saat app
// sedang dalam mode Bahasa Indonesia (atau sebaliknya).
function mapSupabaseError(message: string | undefined): string {
  if (!message) return "register.errorGeneric";
  const m = message.toLowerCase();

  if (m.includes("already registered") || m.includes("already exists")) {
    return "register.errorEmailTaken";
  }
  if (m.includes("invalid") && m.includes("email")) {
    return "register.errorInvalidEmail";
  }
  if (m.includes("password") && m.includes("least")) {
    return "register.errorPasswordTooShort";
  }
  if (m.includes("rate limit")) {
    return "register.errorRateLimit";
  }
  return "register.errorGeneric";
}

export default function RegisterScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 450,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(cardTranslateY, {
          toValue: 0,
          duration: 450,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const isEmailValid = email.length === 0 || EMAIL_REGEX.test(email);

  const handleRegister = async () => {
    setErrorMsg("");
    setSuccessMsg("");

    if (!email || !password) {
      setErrorMsg(t("register.errorEmptyFields"));
      return;
    }
    if (!EMAIL_REGEX.test(email)) {
      setErrorMsg(t("register.errorInvalidEmail"));
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setErrorMsg(t("register.errorPasswordTooShort"));
      return;
    }

    setLoading(true);
    // Catatan: nama lengkap & data profil lain TIDAK dikumpulkan di sini.
    // Alur aplikasi kamu: daftar (email+password) -> verifikasi email/OTP
    // -> lengkapi profil (complete-profile.tsx). Jadi signUp cukup kirim
    // email & password saja, tanpa `options.data`.
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    setLoading(false);

    if (error) {
      setErrorMsg(t(mapSupabaseError(error.message)));
      return;
    }

    // Jika email sudah terdaftar & terverifikasi, Supabase (dengan email
    // confirmation aktif) TIDAK mengirim error, tapi mengembalikan user
    // dengan identities kosong. Tanpa cek ini, user menunggu OTP yang
    // tidak akan pernah datang.
    if (data.user && data.user.identities?.length === 0) {
      setErrorMsg(t("register.errorEmailTaken"));
      return;
    }

    // Kalau "Confirm email" dimatikan di Supabase, signUp langsung mengembalikan
    // session dan TIDAK ada email OTP yang dikirim. Layar OTP akan menunggu
    // kode yang tidak pernah datang, jadi langsung lanjut ke lengkapi profil.
    if (data.session) {
      router.replace("/complete-profile");
      return;
    }

    // Confirm email aktif. Alur: register -> OTP -> (terverifikasi) -> complete-profile
    router.push({
      pathname: "/otp",
      params: { email, context: "signup" },
    });
  };

  const handleGoogleRegister = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    setGoogleLoading(true);
    try {
      // Di Supabase, sign in & sign up Google itu satu alur:
      // kalau akun belum ada, otomatis dibuat.
      const result = await signInWithGoogle();
      if (result === "success") router.replace("/home");
    } catch (e: any) {
      if (e?.message === GOOGLE_NATIVE_UNAVAILABLE) {
        // Expo Go: kondisi yang sudah diperkirakan, tidak perlu LogBox merah
        setErrorMsg(t("register.errorGoogleExpoGo"));
      } else {
        console.error(e);
        setErrorMsg(t("register.errorGoogle"));
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <LinearGradient
          colors={["#0B6E64", "#12A594"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + 36 }]}
        >
          <Animated.View
            style={{
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
              alignItems: "center",
            }}
          >
            <Image
              source={require("../assets/images/reverse_logovitanear.png")}
              style={styles.logo}
              resizeMode="contain"
              tintColor="#fff"
            />
            <Text style={styles.headerTitle}>{t("register.title")}</Text>
            <Text style={styles.headerSubtitle}>{t("register.subtitle")}</Text>
          </Animated.View>
        </LinearGradient>

        <Animated.View
          style={[
            styles.card,
            {
              opacity: cardOpacity,
              transform: [{ translateY: cardTranslateY }],
            },
          ]}
        >
          <Text style={styles.label}>{t("register.emailLabel")}</Text>
          <View
            style={[
              styles.input,
              emailFocused && styles.inputFocused,
              !isEmailValid && styles.inputError,
            ]}
          >
            <TextInput
              style={styles.inputText}
              placeholder={t("register.emailPlaceholder")}
              placeholderTextColor="#A0A0A0"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              value={email}
              onChangeText={setEmail}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
            />
            {email.length > 0 && isEmailValid && (
              <Ionicons name="checkmark-circle" size={18} color="#15803D" />
            )}
          </View>

          <Text style={[styles.label, styles.fieldSpacing]}>
            {t("register.passwordLabel")}
          </Text>
          <View style={[styles.input, passwordFocused && styles.inputFocused]}>
            <TextInput
              style={styles.inputText}
              placeholder={t("register.passwordPlaceholder")}
              placeholderTextColor="#A0A0A0"
              secureTextEntry={!showPassword}
              autoComplete="password-new"
              textContentType="newPassword"
              value={password}
              onChangeText={setPassword}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={20}
                color="#888"
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.hintText}>{t("register.passwordHint")}</Text>

          {errorMsg ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#DC2626" />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}
          {successMsg ? (
            <View style={styles.successBox}>
              <Ionicons name="checkmark-circle" size={16} color="#15803D" />
              <Text style={styles.successText}>{successMsg}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.registerButton, loading && { opacity: 0.75 }]}
            onPress={handleRegister}
            disabled={loading || googleLoading}
            activeOpacity={0.85}
          >
            {loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.registerButtonText}>
                  {t("register.registering")}
                </Text>
              </View>
            ) : (
              <Text style={styles.registerButtonText}>
                {t("register.registerButton")}
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t("register.or")}</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={[styles.googleButton, googleLoading && { opacity: 0.6 }]}
            onPress={handleGoogleRegister}
            disabled={googleLoading || loading}
            activeOpacity={0.85}
          >
            <GoogleIcon />
            <Text style={styles.googleButtonText}>
              {t("register.continueWithGoogle")}
            </Text>
          </TouchableOpacity>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>{t("register.haveAccount")} </Text>
            <TouchableOpacity onPress={() => router.push("/login")}>
              <Text style={styles.footerLink}>{t("register.loginLink")}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    // paddingTop dinamis (insets.top + 36), aman di semua device.
    paddingBottom: 44,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  logo: {
    width: 72,
    height: 72,
    marginBottom: 14,
  },
  headerTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 22,
    color: "#fff",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 14,
    color: "#E3F5F1",
    textAlign: "center",
    paddingHorizontal: 16,
  },
  card: {
    flex: 1,
    backgroundColor: "#fff",
    marginTop: -28,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 32,
  },
  label: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 14,
    color: "#333",
    marginBottom: 8,
  },
  fieldSpacing: {
    marginTop: 18,
  },
  input: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  inputText: {
    flex: 1,
    fontFamily: "PlusJakartaSans_400Regular",
    paddingVertical: 13,
    fontSize: 15,
    color: "#222",
  },
  inputFocused: {
    borderColor: "#0D9488",
    borderWidth: 1.5,
  },
  inputError: {
    borderColor: "#DC2626",
  },
  hintText: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 12,
    color: "#999",
    marginTop: 6,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FEF2F2",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 16,
  },
  errorText: {
    flex: 1,
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 13,
    color: "#DC2626",
  },
  successBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F0FDF4",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 16,
  },
  successText: {
    flex: 1,
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 13,
    color: "#15803D",
  },
  registerButton: {
    backgroundColor: "#0D9488",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 24,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  registerButtonText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: "#fff",
    fontSize: 16,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E5E5",
  },
  dividerText: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 13,
    color: "#999",
    marginHorizontal: 12,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 14,
    paddingVertical: 14,
  },
  googleButtonText: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 15,
    color: "#333",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  footerText: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 13,
    color: "#666",
  },
  footerLink: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 13,
    color: "#0D9488",
  },
});
