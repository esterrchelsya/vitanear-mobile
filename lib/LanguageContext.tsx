import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { supabase } from "./supabase";
import { Language, translations } from "./translations";

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string) => string;
  isLoading: boolean;
};

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

const STORAGE_KEY = "appLanguage";
const DEFAULT_LANGUAGE: Language = "id";

function getNestedValue(obj: any, path: string): string | undefined {
  return path
    .split(".")
    .reduce((acc, key) => (acc ? acc[key] : undefined), obj);
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      // 1. Coba baca preferensi lokal dulu (device ini).
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (isMounted && (stored === "id" || stored === "en")) {
          setLanguageState(stored);
        }
      } catch (e) {
        console.log("Gagal membaca preferensi bahasa lokal:", e);
      }

      // 2. Kalau user sudah login, preferensi di akun (user_metadata)
      //    lebih diutamakan — berguna kalau user login di device baru.
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const accountLanguage = user?.user_metadata?.language;
      if (isMounted && (accountLanguage === "id" || accountLanguage === "en")) {
        setLanguageState(accountLanguage);
        AsyncStorage.setItem(STORAGE_KEY, accountLanguage).catch(() => {});
      }

      if (isMounted) setIsLoading(false);
    };

    init();

    // Kalau user login belakangan (bukan saat app dibuka), sinkronkan juga.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN") {
        const accountLanguage = session?.user?.user_metadata?.language;
        if (accountLanguage === "id" || accountLanguage === "en") {
          setLanguageState(accountLanguage);
          AsyncStorage.setItem(STORAGE_KEY, accountLanguage).catch(() => {});
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);

    try {
      await AsyncStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {
      console.log("Gagal menyimpan preferensi bahasa:", e);
    }

    // Kalau user sudah login, sinkronkan ke Supabase juga —
    // supaya email (OTP, dsb) ikut memakai bahasa yang sama,
    // dan preferensinya ikut kalau login di device lain.
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase.auth.updateUser({ data: { language: lang } });
    }
  };

  const t = (key: string): string => {
    const value = getNestedValue(translations[language], key);
    if (value !== undefined) return value;

    // Fallback ke Bahasa Indonesia kalau key belum ada di bahasa aktif
    // (misalnya baru migrasi ke id.ts tapi belum sempat terjemahkan en.ts).
    const fallback = getNestedValue(translations[DEFAULT_LANGUAGE], key);
    if (fallback !== undefined) return fallback;

    // Fallback terakhir: tampilkan key mentah, biar gampang ketauan
    // kalau ada teks yang belum didaftarkan di translation file.
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isLoading }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage harus dipakai di dalam <LanguageProvider>");
  }
  return context;
}
