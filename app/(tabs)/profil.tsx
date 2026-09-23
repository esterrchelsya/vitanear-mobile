import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../lib/AuthContext";
import { useLanguage } from "../../lib/LanguageContext";
import { formatPhoneDisplay } from "../../lib/phone";
import { supabase } from "../../lib/supabase";

type ProfileData = {
  nama: string | null;
  no_hp: string | null;
  foto_profil: string | null;
};

function SkeletonBox({ style }: { style?: any }) {
  const opacity = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);
  return <Animated.View style={[styles.skeletonBase, style, { opacity }]} />;
}

const MENU_SKELETON_COUNT = 5;

export default function ProfilScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { language, t } = useLanguage();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const fetchProfile = async () => {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          if (isActive) setLoading(false);
          return;
        }
        const { data } = await supabase
          .from("profiles")
          .select("nama, no_hp, foto_profil")
          .eq("id", user.id)
          .maybeSingle();
        if (isActive) {
          setProfile(data);
          setLoading(false);
        }
      };

      fetchProfile();
      return () => {
        isActive = false;
      };
    }, []),
  );

  const handleLogout = () => {
    Alert.alert(
      t("profile.logoutConfirmTitle"),
      t("profile.logoutConfirmMessage"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("profile.logoutButton"),
          style: "destructive",
          onPress: signOut,
        },
      ],
    );
  };

  // TODO: sambungkan onPress ke halaman masing-masing begitu dibangun.
  const menuItems = [
    {
      id: "language",
      icon: "globe-outline" as const,
      label: t("languageSettings.title"),
      badge: language.toUpperCase(),
      onPress: () => router.push("/pengaturan-bahasa"),
    },
    {
      id: "family",
      icon: "people-outline" as const,
      label: t("profile.menuFamilyMembers"),
      onPress: () => router.push("/anggota-keluarga"),
    },
    {
      id: "insurance",
      icon: "shield-checkmark-outline" as const,
      label: t("profile.menuInsurance"),
      onPress: () => router.push("/informasi-asuransi"),
    },
    {
      id: "security",
      icon: "lock-closed-outline" as const,
      label: t("profile.menuSecurity"),
      onPress: () => router.push("/keamanan-kata-sandi"),
    },
    {
      id: "help",
      icon: "help-circle-outline" as const,
      label: t("profile.menuHelp"),
      onPress: () => router.push("/pusat-bantuan"),
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <View style={{ width: 24 }} />
        <Text style={styles.headerTitle}>{t("tabs.profile")}</Text>
        <TouchableOpacity
          onPress={() => router.push("/edit-profil")}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="create-outline" size={22} color="#0D9488" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.avatarWrapper}>
          {loading ? (
            <SkeletonBox style={styles.avatar} />
          ) : profile?.foto_profil ? (
            <Image
              source={{ uri: profile.foto_profil }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarFallback}>
              <Ionicons name="person" size={36} color="#0D9488" />
            </View>
          )}
        </View>

        {loading ? (
          <View style={{ alignItems: "center", marginBottom: 24 }}>
            <SkeletonBox style={{ height: 16, width: 140, borderRadius: 4 }} />
            <SkeletonBox
              style={{ height: 12, width: 100, borderRadius: 4, marginTop: 8 }}
            />
          </View>
        ) : (
          <>
            <Text style={styles.name}>
              {profile?.nama || t("profile.defaultName")}
            </Text>
            <Text style={styles.phone}>
              {formatPhoneDisplay(profile?.no_hp)}
            </Text>
          </>
        )}

        <View style={styles.menuCard}>
          {loading
            ? Array.from({ length: MENU_SKELETON_COUNT }).map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.menuRow,
                    index !== MENU_SKELETON_COUNT - 1 && styles.menuRowBorder,
                  ]}
                >
                  <SkeletonBox
                    style={{ width: 20, height: 20, borderRadius: 6 }}
                  />
                  <SkeletonBox
                    style={{ flex: 1, height: 13, borderRadius: 4 }}
                  />
                </View>
              ))
            : menuItems.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.menuRow,
                    index !== menuItems.length - 1 && styles.menuRowBorder,
                  ]}
                  onPress={item.onPress}
                  activeOpacity={0.7}
                >
                  <Ionicons name={item.icon} size={20} color="#0D9488" />
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  {"badge" in item && item.badge ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{item.badge}</Text>
                    </View>
                  ) : null}
                  <Ionicons name="chevron-forward" size={18} color="#B0B0B0" />
                </TouchableOpacity>
              ))}
        </View>

        {!loading && (
          <TouchableOpacity style={styles.logoutRow} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={18} color="#DC2626" />
            <Text style={styles.logoutText}>{t("profile.logoutAccount")}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  skeletonBase: { backgroundColor: "#E3ECEA", borderRadius: 8 },
  safeArea: { flex: 1, backgroundColor: "#F6FBF9" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 17,
    color: "#0D9488",
  },
  scrollContent: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  avatarWrapper: { marginTop: 12, marginBottom: 16 },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
    borderColor: "#0D9488",
  },
  avatarFallback: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#E1F5EE",
    borderWidth: 2,
    borderColor: "#0D9488",
    alignItems: "center",
    justifyContent: "center",
  },
  name: { fontFamily: "PlusJakartaSans_700Bold", fontSize: 16, color: "#222" },
  phone: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 13,
    color: "#666",
    marginTop: 4,
    marginBottom: 24,
  },
  menuCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EEF2F1",
    overflow: "hidden",
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuRowBorder: { borderBottomWidth: 1, borderBottomColor: "#F1F1F1" },
  menuLabel: {
    flex: 1,
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 14,
    color: "#333",
  },
  badge: {
    backgroundColor: "#E1F5EE",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 6,
  },
  badgeText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 11,
    color: "#0D9488",
  },
  logoutRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 28,
  },
  logoutText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 14,
    color: "#DC2626",
  },
});
