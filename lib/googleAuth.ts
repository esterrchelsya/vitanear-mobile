import Constants, { ExecutionEnvironment } from "expo-constants";
import { supabase } from "./supabase";

// Isi lewat file .env (prefix EXPO_PUBLIC_ wajib agar terbaca di app)
const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "";
const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? "";

// Google Sign-In native tidak tersedia di Expo Go (hanya di dev build / production build)
export const isGoogleNativeAvailable =
  Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;

export const GOOGLE_NATIVE_UNAVAILABLE = "GOOGLE_NATIVE_UNAVAILABLE";

let configured = false;

function getGoogleSignin() {
  if (!isGoogleNativeAvailable) {
    throw new Error(GOOGLE_NATIVE_UNAVAILABLE);
  }
  // require di dalam fungsi agar Expo Go tidak crash saat file ini di-import
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require("@react-native-google-signin/google-signin");
  if (!configured) {
    mod.GoogleSignin.configure({
      webClientId: WEB_CLIENT_ID,
      iosClientId: IOS_CLIENT_ID,
    });
    configured = true;
  }
  return mod;
}

export type GoogleSignInResult = "success" | "cancelled";

export async function signInWithGoogle(): Promise<GoogleSignInResult> {
  const { GoogleSignin, isSuccessResponse, statusCodes } = getGoogleSignin();

  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();

    // User menutup popup
    if (!isSuccessResponse(response)) return "cancelled";

    const idToken = response.data.idToken;
    if (!idToken) throw new Error("Google tidak mengembalikan idToken");

    const { error } = await supabase.auth.signInWithIdToken({
      provider: "google",
      token: idToken,
    });
    if (error) throw error;

    return "success";
  } catch (error) {
    // `error` bertipe unknown di TypeScript, jadi ambil `code`-nya secara aman
    const code = (error as { code?: string } | null)?.code;
    if (
      code === statusCodes.SIGN_IN_CANCELLED ||
      code === statusCodes.IN_PROGRESS
    ) {
      return "cancelled";
    }
    throw error;
  }
}

// Panggil saat logout agar popup pemilihan akun muncul lagi di login berikutnya
export async function signOutGoogle() {
  if (!isGoogleNativeAvailable) return;
  try {
    const { GoogleSignin } = getGoogleSignin();
    await GoogleSignin.signOut();
  } catch {
    // abaikan: user mungkin tidak login lewat Google
  }
}
