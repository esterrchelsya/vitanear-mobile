import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLanguage } from "../lib/LanguageContext";
import { useLocation } from "../lib/LocationContext";
import { supabase } from "../lib/supabase";

const SKELETON_COUNT = 5;
const PLACEHOLDER_IMG =
  "https://placehold.co/300x180/E1F5EE/0F6E56?text=Faskes";

type Faskes = {
  id: string;
  nama: string;
  alamat: string | null;
  rating: number | null;
  buka_24_jam: boolean;
  jam_tutup: string | null;
  foto_url: string | null;
  menerima_bpjs: boolean;
  latitude: number | null;
  longitude: number | null;
};

function hitungJarak(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

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

function CardSkeleton() {
  return (
    <View style={styles.card}>
      <SkeletonBox style={styles.thumb} />
      <View style={styles.cardInfo}>
        <SkeletonBox style={{ height: 14, width: "75%", borderRadius: 4 }} />
        <SkeletonBox style={{ height: 11, width: "45%", borderRadius: 4 }} />
        <SkeletonBox style={{ height: 11, width: "55%", borderRadius: 4 }} />
      </View>
    </View>
  );
}

export default function HasilKategoriScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { kategoriId, kategoriNama, iconLib, iconName } = useLocalSearchParams<{
    kategoriId: string;
    kategoriNama: string;
    iconLib?: string;
    iconName?: string;
  }>();
  const { location } = useLocation();

  const [list, setList] = useState<Faskes[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const statusFaskes = (f: Faskes) => {
    if (f.buka_24_jam) return t("categoryResult.open24Hours");
    return f.jam_tutup
      ? t("categoryResult.closesAt").replace(
          "{{time}}",
          f.jam_tutup.slice(0, 5),
        )
      : "";
  };

  const fetchFaskes = async () => {
    if (!kategoriId) return;
    const { data, error } = await supabase
      .from("layanan_faskes")
      .select(
        "faskes_id, faskes:faskes_id(id, nama, alamat, rating, buka_24_jam, jam_tutup, foto_url, menerima_bpjs, latitude, longitude)",
      )
      .eq("kategori_id", kategoriId)
      .eq("aktif", true);

    if (!error && data) {
      const unik = new Map<string, Faskes>();
      data.forEach((row: any) => {
        if (row.faskes) unik.set(row.faskes.id, row.faskes);
      });
      setList(Array.from(unik.values()));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFaskes();
  }, [kategoriId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFaskes();
    setRefreshing(false);
  };

  const sorted = [...list].sort((a, b) => {
    if (location && a.latitude && a.longitude && b.latitude && b.longitude) {
      return (
        hitungJarak(
          location.latitude,
          location.longitude,
          a.latitude,
          a.longitude,
        ) -
        hitungJarak(
          location.latitude,
          location.longitude,
          b.latitude,
          b.longitude,
        )
      );
    }
    return (b.rating ?? 0) - (a.rating ?? 0);
  });

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {kategoriNama || t("categoryResult.defaultTitle")}
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <LinearGradient colors={["#0F6E56", "#0D9488"]} style={styles.hero}>
        <View style={styles.heroIconWrapper}>
          {iconLib === "material_community" ? (
            <MaterialCommunityIcons
              name={(iconName as any) || "medkit-outline"}
              size={26}
              color="#fff"
            />
          ) : (
            <Ionicons
              name={(iconName as any) || "medkit-outline"}
              size={26}
              color="#fff"
            />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroTitle} numberOfLines={1}>
            {kategoriNama || t("categoryResult.defaultTitle")}
          </Text>
          <Text style={styles.heroSubtitle}>
            {loading
              ? t("categoryResult.searching")
              : location
                ? t("categoryResult.foundWithLocation").replace(
                    "{{count}}",
                    String(sorted.length),
                  )
                : t("categoryResult.foundWithoutLocation").replace(
                    "{{count}}",
                    String(sorted.length),
                  )}
          </Text>
        </View>
      </LinearGradient>

      {!loading && sorted.length > 0 && (
        <Text style={styles.sortCaption}>
          {location
            ? t("categoryResult.sortByDistance")
            : t("categoryResult.sortByRating")}
        </Text>
      )}

      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#0D9488"]}
            tintColor="#0D9488"
          />
        }
      >
        {loading ? (
          Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <CardSkeleton key={i} />
          ))
        ) : sorted.length === 0 ? (
          <View style={styles.emptyState}>
            <LinearGradient
              colors={["#E1F5EE", "#C7EAE0"]}
              style={styles.emptyIconCircle}
            >
              <Ionicons name="medkit-outline" size={38} color="#0D9488" />
            </LinearGradient>
            <Text style={styles.emptyTitle}>
              {t("categoryResult.emptyTitle")}
            </Text>
            <Text style={styles.emptyText}>
              {t("categoryResult.emptyText").replace(
                "{{category}}",
                kategoriNama || "",
              )}
            </Text>
          </View>
        ) : (
          <>
            {sorted.map((f) => {
              const jarak =
                location && f.latitude && f.longitude
                  ? hitungJarak(
                      location.latitude,
                      location.longitude,
                      f.latitude,
                      f.longitude,
                    )
                  : null;
              return (
                <TouchableOpacity
                  key={f.id}
                  style={styles.card}
                  activeOpacity={0.85}
                  onPress={() =>
                    router.push({
                      pathname: "/faskes/[id]",
                      params: { id: f.id },
                    })
                  }
                >
                  <Image
                    source={{ uri: f.foto_url || PLACEHOLDER_IMG }}
                    style={styles.thumb}
                  />
                  <View style={styles.cardInfo}>
                    <View style={styles.cardTopRow}>
                      <Text style={styles.nama} numberOfLines={1}>
                        {f.nama}
                      </Text>
                      <View style={styles.ratingPill}>
                        <Ionicons name="star" size={11} color="#EAA23B" />
                        <Text style={styles.ratingPillText}>
                          {f.rating ?? "-"}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.subText} numberOfLines={1}>
                      {jarak !== null
                        ? t("categoryResult.kmFromLocation").replace(
                            "{{distance}}",
                            jarak.toFixed(1),
                          )
                        : f.alamat || t("categoryResult.addressUnavailable")}
                    </Text>
                    <View style={styles.metaRow}>
                      <View
                        style={[
                          styles.statusDot,
                          {
                            backgroundColor: f.buka_24_jam
                              ? "#22C55E"
                              : "#9CA3AF",
                          },
                        ]}
                      />
                      <Text style={styles.statusText}>{statusFaskes(f)}</Text>
                      {f.menerima_bpjs && (
                        <View style={styles.bpjsBadge}>
                          <Text style={styles.bpjsBadgeText}>
                            {t("categoryResult.bpjsBadge")}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#B0B0B0" />
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              style={styles.tipCard}
              activeOpacity={0.85}
              onPress={() => router.push("/kategori-lengkap")}
            >
              <View style={styles.tipIconWrapper}>
                <Ionicons name="grid-outline" size={20} color="#0D9488" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.tipTitle}>
                  {t("categoryResult.tipTitle")}
                </Text>
                <Text style={styles.tipDesc}>
                  {t("categoryResult.tipDesc")}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#0D9488" />
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
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
    color: "#1F2937",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 8,
  },
  hero: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginHorizontal: 20,
    marginBottom: 14,
    borderRadius: 18,
    padding: 16,
  },
  heroIconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 16,
    color: "#fff",
  },
  heroSubtitle: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    marginTop: 2,
  },
  tipCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EEF2F1",
    padding: 14,
    marginTop: 4,
  },
  tipIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#E1F5EE",
    alignItems: "center",
    justifyContent: "center",
  },
  tipTitle: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 13,
    color: "#222",
  },
  tipDesc: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 12,
  },
  sortCaption: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 11.5,
    color: "#6B7280",
    marginHorizontal: 20,
    marginBottom: 8,
  },
  skeletonBase: { backgroundColor: "#E3ECEA", borderRadius: 8 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EEF2F1",
    padding: 10,
    shadowColor: "#0D9488",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  thumb: {
    width: 68,
    height: 68,
    borderRadius: 12,
    backgroundColor: "#E1F5EE",
  },
  cardInfo: { flex: 1, gap: 4 },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  nama: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 14,
    color: "#1F2937",
    flexShrink: 1,
  },
  ratingPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#FEF6E9",
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  ratingPillText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 11,
    color: "#B4750E",
  },
  subText: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 11.5,
    color: "#6B7280",
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  statusText: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 11.5,
    color: "#0D9488",
  },
  bpjsBadge: {
    backgroundColor: "#EEF6F4",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  bpjsBadgeText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 10,
    color: "#0D6459",
  },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 60,
  },
  emptyIconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  emptyTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 15,
    color: "#1F2937",
    marginBottom: 6,
  },
  emptyText: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 19,
  },
});
