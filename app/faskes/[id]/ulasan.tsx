import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLanguage } from "../../../lib/LanguageContext";
import { supabase } from "../../../lib/supabase";

type Ulasan = {
  id: string;
  rating: number;
  komentar: string | null;
  created_at: string;
  balasan_admin: string | null;
  profiles: { nama: string | null }[] | null;
};

export default function SemuaUlasanScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [ulasan, setUlasan] = useState<Ulasan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("ulasan")
        .select(
          "id, rating, komentar, created_at, balasan_admin, profiles(nama)",
        )
        .eq("faskes_id", id)
        .order("created_at", { ascending: false })
        .limit(100);
      setUlasan((data as Ulasan[]) ?? []);
      setLoading(false);
    };
    if (id) load();
  }, [id]);

  const total = ulasan.length;
  const rata = total ? ulasan.reduce((s, u) => s + u.rating, 0) / total : 0;
  const breakdown = [5, 4, 3, 2, 1].map((bintang) => ({
    bintang,
    jumlah: ulasan.filter((u) => u.rating === bintang).length,
  }));

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color="#0D9488" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("allReviews.title")}</Text>
        <View style={{ width: 22 }} />
      </View>

      {loading ? (
        <ActivityIndicator color="#0D9488" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={ulasan}
          keyExtractor={(u) => u.id}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          ListHeaderComponent={
            <View style={styles.summaryCard}>
              <View style={styles.summaryTop}>
                <Text style={styles.summaryScore}>{rata.toFixed(1)}</Text>
                <View>
                  <View style={{ flexDirection: "row" }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Ionicons
                        key={i}
                        name={i < Math.round(rata) ? "star" : "star-outline"}
                        size={14}
                        color="#EAA23B"
                      />
                    ))}
                  </View>
                  <Text style={styles.summaryCount}>
                    {total} {t("allReviews.reviewsCountSuffix")}
                  </Text>
                </View>
              </View>
              <View style={{ marginTop: 12, gap: 5 }}>
                {breakdown.map((b) => (
                  <View key={b.bintang} style={styles.barRow}>
                    <Text style={styles.barLabel}>{b.bintang}</Text>
                    <Ionicons name="star" size={11} color="#EAA23B" />
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            width: total
                              ? `${(b.jumlah / total) * 100}%`
                              : "0%",
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.barCount}>{b.jumlah}</Text>
                  </View>
                ))}
              </View>
            </View>
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>{t("allReviews.emptyReviews")}</Text>
          }
          renderItem={({ item: u }) => {
            const nama = u.profiles?.[0]?.nama || t("allReviews.defaultUser");
            return (
              <View style={styles.ulasanCard}>
                <View style={styles.ulasanTopRow}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {nama.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ulasanName}>{nama}</Text>
                    <Text style={styles.ulasanDate}>
                      {new Date(u.created_at).toLocaleDateString(
                        language === "en" ? "en-US" : "id-ID",
                      )}
                    </Text>
                  </View>
                  <Text style={styles.stars}>{"★".repeat(u.rating)}</Text>
                </View>
                {u.komentar ? (
                  <Text style={styles.komentar}>{u.komentar}</Text>
                ) : null}
                {u.balasan_admin ? (
                  <View style={styles.balasanBox}>
                    <Text style={styles.balasanLabel}>
                      {t("allReviews.facilityReply")}
                    </Text>
                    <Text style={styles.balasanText}>{u.balasan_admin}</Text>
                  </View>
                ) : null}
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
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
  summaryCard: {
    backgroundColor: "#F6FBF9",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  summaryTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  summaryScore: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 32,
    color: "#222",
  },
  summaryCount: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  barRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  barLabel: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 11,
    color: "#555",
    width: 8,
  },
  barTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
  },
  barFill: { height: 6, backgroundColor: "#EAA23B" },
  barCount: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 11,
    color: "#999",
    width: 20,
    textAlign: "right",
  },
  emptyText: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 13,
    color: "#888",
    textAlign: "center",
    marginTop: 20,
  },
  ulasanCard: {
    borderBottomWidth: 1,
    borderBottomColor: "#F1F1F1",
    paddingVertical: 14,
  },
  ulasanTopRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E1F5EE",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 13,
    color: "#0D9488",
  },
  ulasanName: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 13,
    color: "#222",
  },
  ulasanDate: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 11,
    color: "#999",
  },
  stars: { fontSize: 12, color: "#EAA23B" },
  komentar: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 13,
    color: "#555",
    marginTop: 6,
    lineHeight: 19,
  },
  balasanBox: {
    marginTop: 8,
    backgroundColor: "#F0FAF8",
    borderRadius: 10,
    padding: 10,
  },
  balasanLabel: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 11,
    color: "#0D9488",
    marginBottom: 3,
  },
  balasanText: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 12.5,
    color: "#555",
    lineHeight: 18,
  },
});
