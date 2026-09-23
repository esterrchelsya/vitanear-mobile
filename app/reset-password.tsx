import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
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
import { useLanguage } from "../lib/LanguageContext";
import { supabase } from "../lib/supabase";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { t } = useLanguage();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleReset = async () => {
    setErrorMsg("");

    if (!password || !confirmPassword) {
      setErrorMsg(t("resetPassword.errorBothRequired"));
      return;
    }

    if (password.length < 8) {
      setErrorMsg(t("resetPassword.errorMinLength"));
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg(t("resetPassword.errorMismatch"));
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setLoading(false);
      setErrorMsg(t("resetPassword.errorUpdateFailed"));
      return;
    }

    // Sesi recovery ini cuma dipakai sekali untuk ubah password.
    // Setelah berhasil, keluarkan user supaya login ulang dengan password baru.
    await supabase.auth.signOut();
    setLoading(false);

    router.replace("/login");
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
          style={styles.header}
        >
          <Image
            source={require("../assets/images/reverse_logovitanear.png")}
            style={styles.logo}
            resizeMode="contain"
            tintColor="#fff"
          />
          <Text style={styles.headerTitle}>
            {t("resetPassword.headerTitle")}
          </Text>
          <Text style={styles.headerSubtitle}>
            {t("resetPassword.headerSubtitle")}
          </Text>
        </LinearGradient>

        <View style={styles.card}>
          <Text style={styles.label}>
            {t("resetPassword.newPasswordLabel")}
          </Text>
          <View style={styles.passwordWrapper}>
            <TextInput
              style={styles.passwordInput}
              placeholder={t("resetPassword.newPasswordPlaceholder")}
              placeholderTextColor="#A0A0A0"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
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

          <Text style={[styles.label, { marginTop: 18 }]}>
            {t("resetPassword.confirmPasswordLabel")}
          </Text>
          <View style={styles.passwordWrapper}>
            <TextInput
              style={styles.passwordInput}
              placeholder={t("resetPassword.confirmPasswordPlaceholder")}
              placeholderTextColor="#A0A0A0"
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={showConfirmPassword ? "eye-off" : "eye"}
                size={20}
                color="#888"
              />
            </TouchableOpacity>
          </View>

          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleReset}
            disabled={loading}
          >
            <Text style={styles.resetButtonText}>
              {loading
                ? t("resetPassword.processingButton")
                : t("resetPassword.saveButton")}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 56,
    paddingBottom: 44,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  logo: {
    width: 56,
    height: 56,
    marginBottom: 14,
  },
  headerTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 20,
    color: "#fff",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 13,
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
  passwordWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  passwordInput: {
    fontFamily: "PlusJakartaSans_400Regular",
    flex: 1,
    paddingVertical: 13,
    fontSize: 15,
    color: "#222",
  },
  errorText: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 13,
    color: "#DC2626",
    marginTop: 16,
  },
  resetButton: {
    backgroundColor: "#0D9488",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 24,
  },
  resetButtonText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: "#fff",
    fontSize: 16,
  },
});
