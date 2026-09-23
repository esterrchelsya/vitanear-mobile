import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import {
  Animated,
  BackHandler,
  Easing,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLanguage } from "../lib/LanguageContext";

const OPTIONS: { code: "id" | "en"; label: string; flag: string }[] = [
  { code: "id", label: "Bahasa Indonesia", flag: "🇮🇩" },
  { code: "en", label: "English", flag: "🇬🇧" },
];

// Jarak geser sheet keluar layar (lebih besar dari tinggi sheet)
const JARAK_KELUAR = 420;

// Pilihan bahasa berbentuk bottom sheet. Didaftarkan di _layout.tsx sebagai
// transparentModal (animation: "none"), jadi animasi masuk/keluar diatur di sini.
export default function PengaturanBahasaScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language, setLanguage, t } = useLanguage();

  const progress = useRef(new Animated.Value(0)).current; // 0 tertutup, 1 terbuka
  const dragY = useRef(new Animated.Value(0)).current; // geseran jari ke bawah
  const closing = useRef(false);

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [progress]);

  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    Animated.timing(progress, {
      toValue: 0,
      duration: 200,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => router.back());
  }, [progress, router]);

  // Tombol kembali Android menutup sheet dengan animasi
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      close();
      return true;
    });
    return () => sub.remove();
  }, [close]);

  // Geser ke bawah pada area judul untuk menutup
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 4,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) dragY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 90 || g.vy > 0.8) {
          if (closing.current) return;
          closing.current = true;
          Animated.parallel([
            Animated.timing(dragY, {
              toValue: JARAK_KELUAR,
              duration: 180,
              useNativeDriver: true,
            }),
            Animated.timing(progress, {
              toValue: 0,
              duration: 180,
              useNativeDriver: true,
            }),
          ]).start(() => router.back());
        } else {
          Animated.spring(dragY, {
            toValue: 0,
            bounciness: 4,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  ).current;

  const pilih = (code: "id" | "en") => {
    if (code === language) {
      close();
      return;
    }
    void setLanguage(code);
    // Beri jeda singkat agar pengguna melihat pilihan berpindah sebelum sheet menutup
    setTimeout(close, 260);
  };

  const sheetY = Animated.add(
    progress.interpolate({
      inputRange: [0, 1],
      outputRange: [JARAK_KELUAR, 0],
    }),
    dragY,
  );

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.backdrop, { opacity: progress }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} />
      </Animated.View>

      <Animated.View
        style={[
          styles.sheet,
          {
            paddingBottom: Math.max(insets.bottom, 12) + 10,
            transform: [{ translateY: sheetY }],
          },
        ]}
      >
        <View {...pan.panHandlers} style={styles.sheetHeader}>
          <View style={styles.handle} />
          <Text style={styles.title}>{t("languageSettings.title")}</Text>
        </View>

        {OPTIONS.map((opt) => {
          const active = language === opt.code;
          return (
            <TouchableOpacity
              key={opt.code}
              style={[styles.option, active && styles.optionActive]}
              onPress={() => pilih(opt.code)}
              activeOpacity={0.8}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
            >
              <Text style={styles.flag}>{opt.flag}</Text>
              <Text style={[styles.label, active && styles.labelActive]}>
                {opt.label}
              </Text>
              {active ? (
                <View style={styles.checkFilled}>
                  <Ionicons name="checkmark" size={14} color="#fff" />
                </View>
              ) : (
                <View style={styles.checkEmpty} />
              )}
            </TouchableOpacity>
          );
        })}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  // Ditulis eksplisit: StyleSheet.absoluteFillObject sudah dihapus di React Native versi baru
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(17,24,39,0.45)",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  // Area yang bisa digeser: handle + judul (tinggi cukup untuk jari)
  sheetHeader: { paddingTop: 10, paddingBottom: 14 },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D1D5DB",
    alignSelf: "center",
    marginBottom: 16,
  },
  title: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 16,
    color: "#1F2937",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 58,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EEF2F1",
    backgroundColor: "#fff",
    marginBottom: 10,
  },
  // Pilihan aktif: outline teal + latar lembut. Padding -0,5 agar ukuran tidak bergeser.
  optionActive: {
    borderColor: "#0D9488",
    borderWidth: 1.5,
    paddingHorizontal: 13.5,
    backgroundColor: "#F0FAF8",
  },
  flag: { fontSize: 22 },
  label: {
    flex: 1,
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 15,
    color: "#374151",
  },
  labelActive: { fontFamily: "PlusJakartaSans_600SemiBold", color: "#0D6459" },
  checkFilled: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#0D9488",
    alignItems: "center",
    justifyContent: "center",
  },
  checkEmpty: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: "#D0D0D0",
  },
});
