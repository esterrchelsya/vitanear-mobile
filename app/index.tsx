import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { useAuth } from "../lib/AuthContext";

// true  = user yang belum login SELALU melihat onboarding dulu (splash -> onboarding -> login/register)
// false = onboarding hanya tampil sekali; setelah itu langsung ke login
const TAMPILKAN_ONBOARDING_SETIAP_KALI = true;

export default function SplashScreen() {
  const router = useRouter();
  const { session, profileComplete, isLoading } = useAuth();
  const [animDone, setAnimDone] = useState(false);
  const iconScale = useRef(new Animated.Value(0.6)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(1)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;
  const textHeight = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(-30)).current;
  const containerOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(iconOpacity, {
          toValue: 1,
          duration: 700,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(iconScale, {
          toValue: 1.06,
          duration: 700,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(150),
      Animated.timing(ringOpacity, {
        toValue: 0.5,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(ringScale, {
          toValue: 1.6,
          duration: 850,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(ringOpacity, {
          toValue: 0,
          duration: 850,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(iconScale, {
        toValue: 0.85,
        duration: 600,
        easing: Easing.bezier(0.34, 1.4, 0.64, 1),
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(textHeight, {
          toValue: 52,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(textTranslateY, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(1200),
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: 600,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => setAnimDone(true));
  }, []);

  useEffect(() => {
    if (!animDone || isLoading) return;

    // Belum login -> onboarding -> (login / register)
    if (!session) {
      (async () => {
        if (!TAMPILKAN_ONBOARDING_SETIAP_KALI) {
          const seen = await AsyncStorage.getItem("hasSeenOnboarding");
          if (seen) {
            router.replace("/login");
            return;
          }
        }
        router.replace("/onboarding");
      })();
      return;
    }

    // Sudah login. Di titik ini isLoading = false, artinya pengecekan profil
    // SUDAH selesai (lihat AuthContext), jadi:
    //   false -> profil belum lengkap
    //   true  -> profil lengkap
    //   null  -> pengecekan GAGAL (jaringan/RLS). Sama seperti aturan di
    //            _layout.tsx, ini tidak dianggap "belum lengkap", jadi lanjut ke home.
    if (profileComplete === false) {
      router.replace("/complete-profile");
    } else {
      router.replace("/home");
    }
  }, [animDone, isLoading, session, profileComplete]);

  return (
    <Animated.View style={[styles.container, { opacity: containerOpacity }]}>
      <View style={styles.logoCol}>
        <Animated.View
          style={[
            styles.ring,
            {
              opacity: ringOpacity,
              transform: [{ scale: ringScale }],
            },
          ]}
        />
        <Animated.Image
          source={require("../assets/images/logo-vitanear-nottext.png")}
          style={[
            styles.icon,
            {
              opacity: iconOpacity,
              transform: [{ scale: iconScale }],
            },
          ]}
          resizeMode="contain"
        />
        <Animated.View
          style={{ height: textHeight, overflow: "hidden", marginTop: 8 }}
        >
          <Animated.Text
            style={[
              styles.wordmark,
              {
                opacity: textOpacity,
                transform: [{ translateY: textTranslateY }],
              },
            ]}
          >
            VitaNear
          </Animated.Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6FBF9",
    justifyContent: "center",
    alignItems: "center",
  },
  logoCol: {
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
    top: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: "#0D9488",
  },
  icon: { width: 112, height: 112 },
  wordmark: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 38,
    color: "#0D9488",
    textAlign: "center",
  },
});
