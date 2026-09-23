import { Ionicons } from "@expo/vector-icons";
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
import { useLocation } from "../lib/LocationContext";
import { supabase } from "../lib/supabase";

const PLACEHOLDER_IMG =
  "https://placehold.co/300x180/E1F5EE/0F6E56?text=Faskes";
const RADIUS_KM = 30;

type Faskes = {
  id: string;
  nama: string;
  alamat: string | null;
  rating: number | null;
  buka_24_jam: boolean;
  jam_tutup: string | null;
  foto_url: string | null;
  menerima_bpjs: boolean;
  jarak_km: number;
};

function statusFaskes(f: Faskes) {
  if (f.buka_24_jam) return "Buka 24 Jam";
  return f.jam_tutup ? `Tutup Pukul ${f.jam_tutup.slice(0, 5)}` : "";
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

export default function DaftarFaskesScreen() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode: "terdekat" | "rating" }>();
  const { location, permissionDenied } = useLocation();
  const isRating = mode === "rating";

  const [list, setList] = useState<Faskes[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFaskes = async () => {
    if (!location?.latitude || !location?.longitude) return;
    const { data, error } = await supabase.rpc("faskes_terdekat", {
      lat: location.latitude,
      lng: location.longitude,
      radius_km: RADIUS_KM,
    });
    if (!error && data) setList(data as Faskes[]);
    setLoading(false);
  };
  useEffect(() => {
    fetchFaskes();
  }, [location?.latitude, location?.longitude]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFaskes();
    setRefreshing(false);
  };

  // Data sama dari 1 RPC -> tinggal disusun ulang sesuai mode, tidak perlu query beda.
  const sorted = isRating
    ? [...list].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    : list; // RPC sudah urut jarak terdekat -> pakai apa adanya

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isRating ? "Rating Tertinggi" : "Faskes Terdekat"}
        </Text>
        <View style={{ width: 22 }} />
      </View>

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
          Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
        ) : permissionDenied ? (
          <View style={styles.emptyState}>
            <Ionicons name="location-outline" size={40} color="#A3C9C2" />
            <Text style={styles.emptyTitle}>Lokasi Belum Aktif</Text>
            <Text style={styles.emptyText}>
              Aktifkan izin lokasi untuk melihat faskes di sekitar Anda.
            </Text>
          </View>
        ) : sorted.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="medkit-outline" size={40} color="#A3C9C2" />
            <Text style={styles.emptyTitle}>Belum Ada Faskes</Text>
            <Text style={styles.emptyText}>
              Belum ada faskes dalam radius {RADIUS_KM} km dari lokasi Anda.
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.counterText}>
              {sorted.length} faskes{" "}
              {isRating
                ? "· diurutkan rating tertinggi"
                : "· diurutkan jarak terdekat"}
            </Text>
            {sorted.map((f) => (
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
                    {f.jarak_km.toFixed(1)} km dari lokasi Anda
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
                        <Text style={styles.bpjsBadgeText}>BPJS</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#B0B0B0" />
              </TouchableOpacity>
            ))}
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
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 24,
    gap: 12,
  },
  counterText: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 2,
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
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
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
    paddingTop: 70,
    gap: 4,
  },
  emptyTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 15,
    color: "#1F2937",
    marginTop: 10,
  },
  emptyText: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 19,
  },
});
