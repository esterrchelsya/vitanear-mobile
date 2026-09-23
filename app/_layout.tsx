import { Stack, useRouter, useSegments } from "expo-router";
import * as SystemUI from "expo-system-ui";
import { useEffect } from "react";
import { Platform } from "react-native";
import { AuthProvider, useAuth } from "../lib/AuthContext";
import { LanguageProvider } from "../lib/LanguageContext";
import { LocationProvider } from "../lib/LocationContext";
import { SearchFilterProvider } from "../lib/SearchFilterContext";

// Android sekarang wajib edge-to-edge -> nav bar SELALU transparan, warnanya
// tidak bisa diset langsung. Yang terlihat "di balik" nav bar itu adalah
// root view app, jadi itu yang perlu diwarnai (expo-system-ui), bukan
// expo-navigation-bar (API warnanya sudah dihapus/deprecated).
if (Platform.OS === "android") {
  SystemUI.setBackgroundColorAsync("#F6FBF9");
}

// ── Peta rute ────────────────────────────────────────────────────────────
// Halaman yang boleh dibuka TANPA login.
// "" = splash screen. "onboarding" WAJIB ada di sini, kalau tidak user yang
// belum login langsung dilempar ke login dan onboarding tidak pernah tampil.
const PUBLIC_ROUTES = [
  "",
  "onboarding",
  "login",
  "register",
  "otp",
  "forgot-password",
  "reset-password",
];

// Halaman khusus tamu: tidak boleh dibuka lagi kalau sudah login & profil lengkap.
const GUEST_ONLY_ROUTES = ["onboarding", "login", "register"];

// Halaman yang punya navigasi sendiri (alur OTP & reset password), jangan dibajak
// oleh redirect "lengkapi profil". Splash ("") juga dikecualikan supaya
// animasinya tidak terpotong; splash menentukan tujuannya sendiri.
const SKIP_PROFILE_REDIRECT = ["", "otp", "reset-password", "complete-profile"];

function RootNavigation() {
  const { session, profileComplete, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return; // masih cek sesi, jangan redirect dulu

    const currentRoute = segments[0] ?? "";

    // 1. BELUM LOGIN (termasuk baru saja keluar akun): hanya boleh di halaman
    //    publik. Selain itu kembali ke splash ("/"), yang lalu meneruskan ke
    //    onboarding. Alur: splash -> onboarding -> login / register.
    if (!session) {
      if (!PUBLIC_ROUTES.includes(currentRoute)) {
        router.replace("/");
      }
      return;
    }

    // 2. SUDAH LOGIN, profil belum lengkap -> paksa ke complete-profile.
    if (profileComplete === false) {
      if (!SKIP_PROFILE_REDIRECT.includes(currentRoute)) {
        router.replace("/complete-profile");
      }
      return;
    }

    // 3. SUDAH LOGIN, profil lengkap -> jangan biarkan nyasar ke halaman tamu.
    if (profileComplete === true && GUEST_ONLY_ROUTES.includes(currentRoute)) {
      router.replace("/home");
    }

    // profileComplete === null: profil masih dimuat, tunggu dulu.
  }, [session, profileComplete, isLoading, segments]);

  return (
    <Stack initialRouteName="index" screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="kategori-lengkap"
        options={{ presentation: "transparentModal", animation: "none" }}
      />
      <Stack.Screen
        name="filter-pencarian"
        options={{ presentation: "transparentModal", animation: "none" }}
      />
      <Stack.Screen
        name="mulai-reservasi"
        options={{ presentation: "transparentModal", animation: "none" }}
      />
      <Stack.Screen
        name="hasil-pencarian"
        options={{ animation: "fade", animationDuration: 220 }}
      />
      <Stack.Screen
        name="pengaturan-bahasa"
        options={{ presentation: "transparentModal", animation: "none" }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <LocationProvider>
          <SearchFilterProvider>
            <RootNavigation />
          </SearchFilterProvider>
        </LocationProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
