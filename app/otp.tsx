import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLanguage } from "../lib/LanguageContext";
import { supabase } from "../lib/supabase";

// context yang valid: "signup" (dari Daftar) atau "recovery" (dari Lupa Kata Sandi)
type OtpContext = "signup" | "recovery";

const RESEND_COOLDOWN = 60; // detik — disamakan dengan rate limit resend Supabase

export default function OtpScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ email: string; context: OtpContext }>();
  const email = params.email ?? "";
  const context: OtpContext =
    params.context === "recovery" ? "recovery" : "signup";

  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const maskedEmail = maskEmail(email);
  const otpCode = digits.join("");
  const isComplete = otpCode.length === 6;

  function maskEmail(rawEmail: string) {
    const [name, domain] = rawEmail.split("@");
    if (!name || !domain) return rawEmail;
    const visible = name.slice(0, 1);
    return `${visible}${"*".repeat(Math.max(name.length - 1, 3))}@${domain}`;
  }

  function handleDigitChange(text: string, index: number) {
    if (!/^\d*$/.test(text)) return; // cuma terima angka

    const newDigits = [...digits];
    newDigits[index] = text.slice(-1);
    setDigits(newDigits);
    setErrorMsg("");

    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyPress(e: any, index: number) {
    if (e.nativeEvent.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  async function handleVerify() {
    setErrorMsg("");
    if (!isComplete) return;

    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otpCode,
      type: context, // "signup" atau "recovery"
    });
    setLoading(false);

    if (error) {
      setErrorMsg(t("otp.errorInvalidOtp"));
      setDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
      return;
    }

    // Verifikasi berhasil — arahkan sesuai konteks
    if (context === "signup") {
      router.replace("/complete-profile");
    } else {
      router.replace("/reset-password");
    }
  }

  async function handleResend() {
    if (countdown > 0 || resending) return;
    setErrorMsg("");
    setResending(true);

    const { error } =
      context === "signup"
        ? await supabase.auth.resend({ type: "signup", email })
        : await supabase.auth.resetPasswordForEmail(email);

    setResending(false);

    if (error) {
      // error.message dari Supabase (mis. rate limit) belum dipetakan ke
      // key translation kita, jadi tetap bisa muncul dalam bahasa Inggris
      // mentah — sama seperti catatan di register.tsx sebelumnya.
      setErrorMsg(error.message || t("otp.errorResendGeneric"));
      return;
    }

    setCountdown(RESEND_COOLDOWN);
    setDigits(["", "", "", "", "", ""]);
    inputRefs.current[0]?.focus();
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Ionicons name="arrow-back" size={24} color="#222" />
      </TouchableOpacity>

      <Text style={styles.title}>{t("otp.title")}</Text>
      <Text style={styles.subtitle}>
        {t("otp.subtitlePrefix")}{" "}
        <Text style={styles.subtitleEmail}>{maskedEmail}</Text>
      </Text>

      <View style={styles.otpRow}>
        {digits.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => {
              inputRefs.current[index] = ref;
            }}
            style={[
              styles.otpBox,
              digit ? styles.otpBoxFilled : null,
              errorMsg ? styles.otpBoxError : null,
            ]}
            value={digit}
            onChangeText={(text) => handleDigitChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            keyboardType="number-pad"
            maxLength={1}
            textAlign="center"
          />
        ))}
      </View>

      {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

      <View style={styles.resendRow}>
        {countdown > 0 ? (
          <Text style={styles.resendMuted}>
            {t("otp.resendPrefix")}
            {countdown.toString().padStart(2, "0")}
          </Text>
        ) : (
          <TouchableOpacity onPress={handleResend} disabled={resending}>
            <Text style={styles.resendActive}>
              {resending ? t("otp.resending") : t("otp.resendActive")}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        style={[
          styles.verifyButton,
          !isComplete && styles.verifyButtonDisabled,
        ]}
        onPress={handleVerify}
        disabled={!isComplete || loading}
      >
        <Text style={styles.verifyButtonText}>
          {loading ? t("otp.verifying") : t("otp.verifyButton")}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    // paddingTop dipindah ke JSX (dinamis: insets.top + 16)
  },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: 32,
  },
  title: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 22,
    color: "#222",
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 14,
    color: "#666",
    marginBottom: 32,
  },
  subtitleEmail: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: "#222",
  },
  otpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  otpBox: {
    width: 48,
    height: 56,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    fontSize: 20,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: "#222",
  },
  otpBoxFilled: {
    borderColor: "#0D9488",
  },
  otpBoxError: {
    borderColor: "#DC2626",
  },
  errorText: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 13,
    color: "#DC2626",
    marginBottom: 12,
  },
  resendRow: {
    marginBottom: 32,
  },
  resendMuted: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 13,
    color: "#999",
  },
  resendActive: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 13,
    color: "#0D9488",
  },
  verifyButton: {
    backgroundColor: "#0D9488",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  verifyButtonDisabled: {
    backgroundColor: "#B0D4D0",
  },
  verifyButtonText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: "#fff",
    fontSize: 16,
  },
});
