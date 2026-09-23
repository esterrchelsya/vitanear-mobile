import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
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
import { supabase } from "../lib/supabase";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();

  const [email, setEmail] = useState(params.email ?? "");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSendCode = async () => {
    setErrorMsg("");

    if (!email) {
      setErrorMsg("Email wajib diisi.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);

    if (error) {
      setErrorMsg("Gagal mengirim kode. Periksa kembali email Anda.");
      return;
    }

    router.push({ pathname: "/otp", params: { email, context: "recovery" } });
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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          <View style={{ alignItems: "center" }}>
            <Image
              source={require("../assets/images/reverse_logovitanear.png")}
              style={styles.logo}
              resizeMode="contain"
              tintColor="#fff"
            />
            <Text style={styles.headerTitle}>Reset Kata Sandi</Text>
            <Text style={styles.headerSubtitle}>
              Masukkan email Anda, kami akan kirim kode untuk reset kata sandi
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.card}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="contoh@email.com"
            placeholderTextColor="#A0A0A0"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSendCode}
            disabled={loading}
          >
            <Text style={styles.sendButtonText}>
              {loading ? "Mengirim..." : "Kirim Kode Reset"}
            </Text>
          </TouchableOpacity>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Ingat kata sandi Anda? </Text>
            <TouchableOpacity onPress={() => router.replace("/login")}>
              <Text style={styles.footerLink}>Masuk di sini</Text>
            </TouchableOpacity>
          </View>
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
  backButton: {
    alignSelf: "flex-start",
    marginBottom: 24,
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
  input: {
    fontFamily: "PlusJakartaSans_400Regular",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: "#222",
  },
  errorText: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 13,
    color: "#DC2626",
    marginTop: 12,
  },
  sendButton: {
    backgroundColor: "#0D9488",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 24,
  },
  sendButtonText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: "#fff",
    fontSize: 16,
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
