import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLanguage } from "../lib/LanguageContext";
import { supabase } from "../lib/supabase";

type Notifikasi = {
  id: string;
  tipe: string;
  judul: string;
  pesan: string;
  reservasi_id: string | null;
  dibaca: boolean;
  created_at: string;
  icon_name: string;
  warna: string;
};

function labelTanggal(
  dateStr: string,
  lang: string,
  t: (key: string) => string,
): string {
  const d = new Date(dateStr);
  const now = new Date();
  const kemarin = new Date(now);
  kemarin.setDate(now.getDate() - 1);
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (sameDay(d, now)) return t("notifications.today");
  if (sameDay(d, kemarin)) return t("notifications.yesterday");
  return d.toLocaleDateString(lang === "en" ? "en-US" : "id-ID", {
    day: "2-digit",
    month: "long",
  });
}

function labelJam(dateStr: string, lang: string): string {
  return new Date(dateStr).toLocaleTimeString(
    lang === "en" ? "en-US" : "id-ID",
    {
      hour: "2-digit",
      minute: "2-digit",
    },
  );
}

export default function NotifikasiScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [data, setData] = useState<Notifikasi[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const load = async () => {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          if (isActive) setLoading(false);
          return;
        }
        const { data: rows } = await supabase
          .from("notifikasi")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        if (isActive) {
          setData(rows || []);
          setLoading(false);
        }
      };
      load();
      return () => {
        isActive = false;
      };
    }, []),
  );

  const adaBelumDibaca = data.some((n) => !n.dibaca);

  const handleTandaiSemua = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("notifikasi")
      .update({ dibaca: true })
      .eq("user_id", user.id)
      .eq("dibaca", false);
    setData((prev) => prev.map((n) => ({ ...n, dibaca: true })));
  };

  const handleTapNotif = async (n: Notifikasi) => {
    if (!n.dibaca) {
      await supabase.from("notifikasi").update({ dibaca: true }).eq("id", n.id);
      setData((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, dibaca: true } : x)),
      );
    }
    if (n.reservasi_id) {
      router.push({
        pathname: "/reservasi/[id]",
        params: { id: n.reservasi_id },
      });
    }
  };

  const groups = data.reduce<Record<string, Notifikasi[]>>((acc, n) => {
    const key = labelTanggal(n.created_at, language, t);
    if (!acc[key]) acc[key] = [];
    acc[key].push(n);
    return acc;
  }, {});

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color="#0D9488" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("notifications.title")}</Text>
        <View style={{ width: 22 }} />
      </View>

      {adaBelumDibaca && (
        <TouchableOpacity
          onPress={handleTandaiSemua}
          style={styles.markAllRow}
          hitSlop={8}
        >
          <Text style={styles.markAllText}>
            {t("notifications.markAllRead")}
          </Text>
        </TouchableOpacity>
      )}

      {loading ? (
        <ActivityIndicator color="#0D9488" style={{ marginTop: 40 }} />
      ) : data.length === 0 ? (
        <View style={styles.emptyWrap}>
          <View style={styles.illustrationCircle}>
            <Ionicons name="notifications-outline" size={40} color="#0D9488" />
          </View>
          <Text style={styles.emptyTitle}>{t("notifications.emptyTitle")}</Text>
          <Text style={styles.emptyCaption}>
            {t("notifications.emptyCaption")}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{
            padding: 20,
            paddingTop: 4,
            paddingBottom: 40,
          }}
        >
          {Object.entries(groups).map(([label, items]) => (
            <View key={label} style={{ marginBottom: 20 }}>
              <Text style={styles.groupLabel}>{label}</Text>
              {items.map((n) => {
                return (
                  <TouchableOpacity
                    key={n.id}
                    style={[styles.card, !n.dibaca && styles.cardUnread]}
                    activeOpacity={0.8}
                    onPress={() => handleTapNotif(n)}
                  >
                    <View
                      style={[
                        styles.iconWrapper,
                        { backgroundColor: n.warna + "1A" },
                      ]}
                    >
                      <Ionicons
                        name={n.icon_name as any}
                        size={17}
                        color={n.warna}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.titleRow}>
                        <Text style={styles.judul} numberOfLines={1}>
                          {n.judul}
                        </Text>
                        {!n.dibaca && <View style={styles.unreadDot} />}
                      </View>
                      <Text style={styles.pesan}>{n.pesan}</Text>
                      <Text style={styles.jam}>
                        {labelJam(n.created_at, language)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F6FBF9" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 16,
    color: "#0D9488",
  },
  markAllRow: {
    alignItems: "flex-end",
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  markAllText: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 11.5,
    color: "#0D9488",
  },
  groupLabel: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 13,
    color: "#374151",
    marginBottom: 8,
  },
  card: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardUnread: {
    backgroundColor: "#F0FAF8",
    borderWidth: 1,
    borderColor: "#D5F0EA",
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  judul: {
    flex: 1,
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 13.5,
    color: "#1F2937",
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#0D9488",
  },
  pesan: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 12.5,
    color: "#6B7280",
    marginTop: 3,
    lineHeight: 17,
  },
  jam: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 10.5,
    color: "#B0B0B0",
    marginTop: 4,
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    marginTop: -80,
  },
  illustrationCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#E1F5EE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  emptyTitle: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 14,
    color: "#0D9488",
  },
  emptyCaption: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 12.5,
    color: "#999",
    marginTop: 4,
    textAlign: "center",
    lineHeight: 18,
  },
});
