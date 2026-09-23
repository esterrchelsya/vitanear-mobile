import { Session } from "@supabase/supabase-js";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { supabase } from "./supabase";

type AuthContextType = {
  session: Session | null;
  // null = belum selesai dicek / gagal dicek, true/false = sudah pasti
  profileComplete: boolean | null;
  // true selama sesi ATAU profil belum selesai dicek
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hasil:
//   true  = profil lengkap
//   false = baris profil ada tapi belum lengkap (atau memang belum ada)
//   null  = GAGAL mengecek (error jaringan/RLS) -> jangan dianggap "belum lengkap"
async function checkProfileComplete(userId: string): Promise<boolean | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("nama, no_hp, tanggal_lahir, jenis_kelamin")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.warn("checkProfileComplete gagal:", error.message);
    return null;
  }
  if (!data) return false;

  return Boolean(
    data.nama && data.no_hp && data.tanggal_lahir && data.jenis_kelamin,
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState<boolean | null>(null);
  // userId yang profilnya SUDAH selesai dicek (berhasil atau gagal)
  const [checkedUserId, setCheckedUserId] = useState<string | null>(null);

  const userId = session?.user?.id ?? null;

  // 1) Sesi. Callback onAuthStateChange sengaja SINKRON: jangan `await`
  //    panggilan Supabase lain di dalamnya (bisa deadlock, dan query bisa
  //    jalan sebelum token terpasang sehingga RLS mengembalikan kosong).
  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!isMounted) return;
      setSession(s);
      setSessionLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setSessionLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // 2) Profil. Jalan setiap kali user berubah (login/logout), di luar callback.
  useEffect(() => {
    if (!userId) {
      setProfileComplete(null);
      setCheckedUserId(null);
      return;
    }

    let cancelled = false;
    setProfileComplete(null);

    checkProfileComplete(userId).then((complete) => {
      if (cancelled) return;
      setProfileComplete(complete);
      setCheckedUserId(userId);
    });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Dipanggil setelah complete-profile.tsx berhasil menyimpan data.
  const refreshProfile = async () => {
    if (!userId) {
      setProfileComplete(null);
      return;
    }
    const complete = await checkProfileComplete(userId);
    setProfileComplete(complete);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const isLoading = sessionLoading || (!!userId && checkedUserId !== userId);

  return (
    <AuthContext.Provider
      value={{ session, profileComplete, isLoading, refreshProfile, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth harus dipakai di dalam <AuthProvider>");
  }
  return context;
}
