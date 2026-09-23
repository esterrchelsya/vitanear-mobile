import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  Linking,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLanguage } from "../../lib/LanguageContext";
import { supabase } from "../../lib/supabase";

type Layanan = { id: string; nama_layanan: string; icon_name: string | null };
type Ulasan = {
  id: string;
  rating: number;
  komentar: string | null;
  created_at: string;
  user_id: string;
  balasan_admin: string | null;
  profiles: { nama: string | null }[] | null;
};

type FaskesDetail = {
  id: string;
  nama: string;
  alamat: string | null;
  latitude: number;
  longitude: number;
  rating: number;
  jumlah_ulasan: number;
  buka_24_jam: boolean;
  jam_buka: string | null;
  jam_tutup: string | null;
  foto_url: string | null;
  deskripsi: string | null;
  no_telepon: string | null;
  menerima_bpjs: boolean;
  fasilitas_parkir: boolean;
  fasilitas_wifi: boolean;
  fasilitas_ac: boolean;
};

function getStatus(f: FaskesDetail, t: (key: string) => string) {
  if (f.buka_24_jam)
    return { text: t("facilityDetail.open24Hours"), open: true };
  if (!f.jam_buka || !f.jam_tutup)
    return { text: t("facilityDetail.hoursUnavailable"), open: false };
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const [bh, bm] = f.jam_buka.split(":").map(Number);
  const [th, tm] = f.jam_tutup.split(":").map(Number);
  const isOpen = nowMinutes >= bh * 60 + bm && nowMinutes <= th * 60 + tm;
  return isOpen
    ? {
        text: `${t("facilityDetail.openUntilPrefix")}${f.jam_tutup.slice(0, 5)}`,
        open: true,
      }
    : {
        text: `${t("facilityDetail.closedUntilPrefix")}${f.jam_buka.slice(0, 5)}`,
        open: false,
      };
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

function DetailSkeleton() {
  return (
    <View>
      <SkeletonBox style={styles.hero} />
      <View style={styles.content}>
        <SkeletonBox style={{ height: 20, width: "70%", borderRadius: 4 }} />
        <SkeletonBox
          style={{ height: 12, width: "35%", borderRadius: 4, marginTop: 8 }}
        />
        <View style={[styles.badgeRow, { gap: 8 }]}>
          <SkeletonBox style={{ height: 22, width: 90, borderRadius: 999 }} />
          <SkeletonBox style={{ height: 22, width: 110, borderRadius: 999 }} />
        </View>
        <SkeletonBox
          style={{ height: 14, width: "90%", borderRadius: 4, marginTop: 16 }}
        />
        <View style={styles.actionRow}>
          <SkeletonBox style={{ height: 40, width: 60, borderRadius: 10 }} />
          <SkeletonBox style={{ height: 40, width: 60, borderRadius: 10 }} />
          <SkeletonBox style={{ height: 40, width: 60, borderRadius: 10 }} />
        </View>
        <SkeletonBox
          style={{ height: 15, width: 120, borderRadius: 4, marginTop: 20 }}
        />
        <SkeletonBox
          style={{ height: 46, width: "100%", borderRadius: 10, marginTop: 10 }}
        />
        <SkeletonBox
          style={{ height: 46, width: "100%", borderRadius: 10, marginTop: 10 }}
        />
      </View>
    </View>
  );
}

export default function FaskesDetailScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [faskes, setFaskes] = useState<FaskesDetail | null>(null);
  const [layanan, setLayanan] = useState<Layanan[]>([]);
  const [ulasan, setUlasan] = useState<Ulasan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      const [faskesRes, layananRes, ulasanRes] = await Promise.all([
        supabase.from("faskes").select("*").eq("id", id).maybeSingle(),
        supabase
          .from("layanan_faskes")
          .select("id, nama_layanan, icon_name")
          .eq("faskes_id", id)
          .eq("aktif", true),
        supabase
          .from("ulasan")
          .select(
            "id, rating, komentar, created_at, user_id, balasan_admin, profiles(nama)",
          )
          .eq("faskes_id", id)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);
      if (faskesRes.data) setFaskes(faskesRes.data as FaskesDetail);
      if (layananRes.data) setLayanan(layananRes.data as Layanan[]);
      if (ulasanRes.data) setUlasan(ulasanRes.data as Ulasan[]);
      setLoading(false);
    };
    if (id) fetchDetail();
  }, [id]);

  const handleReservasi = (layananItem: Layanan) => {
    router.push({
      pathname: "/mulai-reservasi",
      params: {
        faskesId: id,
        faskesNama: faskes?.nama ?? "",
        layananId: layananItem.id,
        layananNama: layananItem.nama_layanan,
        menerimaBpjs: String(faskes?.menerima_bpjs ?? false),
      },
    });
  };

  const handleTelepon = () => {
    if (faskes?.no_telepon) Linking.openURL(`tel:${faskes.no_telepon}`);
  };

  const handleRute = () => {
    if (!faskes) return;
    Linking.openURL(
      `https://www.google.com/maps/dir/?api=1&destination=${faskes.latitude},${faskes.longitude}`,
    );
  };

  const handleBagikan = () => {
    if (!faskes) return;
    Share.share({ message: `${faskes.nama}\n${faskes.alamat ?? ""}` });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView>
          <DetailSkeleton />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!faskes) {
    return (
      <SafeAreaView style={styles.loadingScreen} edges={["top"]}>
        <Text style={styles.notFoundText}>{t("facilityDetail.notFound")}</Text>
      </SafeAreaView>
    );
  }

  const status = getStatus(faskes, t);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView>
        <View style={styles.hero}>
          {faskes.foto_url ? (
            <Image source={{ uri: faskes.foto_url }} style={styles.heroImage} />
          ) : (
            <View style={styles.heroPlaceholder}>
              <Ionicons name="business" size={48} color="#0D9488" />
            </View>
          )}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={18} color="#222" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.name}>{faskes.nama}</Text>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={12} color="#EAA23B" />
              <Text style={styles.ratingText}>{faskes.rating.toFixed(1)}</Text>
            </View>
          </View>
          <Text style={styles.reviewCount}>
            {faskes.jumlah_ulasan} {t("facilityDetail.reviewsCountSuffix")}
          </Text>

          <View style={styles.badgeRow}>
            <View
              style={[
                styles.statusBadge,
                !status.open && styles.statusBadgeClosed,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  !status.open && styles.statusTextClosed,
                ]}
              >
                {status.text}
              </Text>
            </View>
            {faskes.menerima_bpjs ? (
              <View style={styles.bpjsBadge}>
                <Ionicons name="checkmark-circle" size={12} color="#0D9488" />
                <Text style={styles.bpjsText}>
                  {t("facilityDetail.acceptsBpjs")}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.addressRow}>
            <Ionicons
              name="location-outline"
              size={16}
              color="#888"
              style={{ marginTop: 2 }}
            />
            <Text style={styles.addressText}>
              {faskes.alamat || t("facilityDetail.addressUnavailable")}
            </Text>
          </View>

          {!faskes.buka_24_jam && faskes.jam_buka && faskes.jam_tutup ? (
            <View style={styles.addressRow}>
              <Ionicons
                name="time-outline"
                size={16}
                color="#888"
                style={{ marginTop: 2 }}
              />
              <Text style={styles.addressText}>
                {t("facilityDetail.operatingHoursPrefix")}
                {faskes.jam_buka.slice(0, 5)} - {faskes.jam_tutup.slice(0, 5)}
              </Text>
            </View>
          ) : null}

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleTelepon}
              disabled={!faskes.no_telepon}
            >
              <Ionicons
                name="call-outline"
                size={18}
                color={faskes.no_telepon ? "#0D9488" : "#CCC"}
              />
              <Text
                style={[
                  styles.actionLabel,
                  !faskes.no_telepon && styles.actionLabelDisabled,
                ]}
              >
                {t("facilityDetail.callButton")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleRute}>
              <Ionicons name="navigate-outline" size={18} color="#0D9488" />
              <Text style={styles.actionLabel}>
                {t("facilityDetail.routeButton")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleBagikan}
            >
              <Ionicons name="share-social-outline" size={18} color="#0D9488" />
              <Text style={styles.actionLabel}>
                {t("facilityDetail.shareButton")}
              </Text>
            </TouchableOpacity>
          </View>

          {faskes.fasilitas_parkir ||
          faskes.fasilitas_wifi ||
          faskes.fasilitas_ac ? (
            <View style={styles.facilityRow}>
              {faskes.fasilitas_parkir ? (
                <View style={styles.facilityChip}>
                  <Ionicons name="car-outline" size={13} color="#0D9488" />
                  <Text style={styles.facilityText}>
                    {t("facilityDetail.facilityParking")}
                  </Text>
                </View>
              ) : null}
              {faskes.fasilitas_wifi ? (
                <View style={styles.facilityChip}>
                  <Ionicons name="wifi-outline" size={13} color="#0D9488" />
                  <Text style={styles.facilityText}>
                    {t("facilityDetail.facilityWifi")}
                  </Text>
                </View>
              ) : null}
              {faskes.fasilitas_ac ? (
                <View style={styles.facilityChip}>
                  <Ionicons name="snow-outline" size={13} color="#0D9488" />
                  <Text style={styles.facilityText}>
                    {t("facilityDetail.facilityAc")}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {faskes.deskripsi ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {t("facilityDetail.aboutSection")}
              </Text>
              <Text style={styles.description}>{faskes.deskripsi}</Text>
            </View>
          ) : null}

          {layanan.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {t("facilityDetail.servicesSection")}
              </Text>
              {layanan.map((l) => (
                <View key={l.id} style={styles.layananRow}>
                  <View style={styles.layananIconWrapper}>
                    <Ionicons name="medkit-outline" size={16} color="#0D9488" />
                  </View>
                  <Text style={styles.layananName}>{l.nama_layanan}</Text>
                  <TouchableOpacity
                    style={styles.reservasiButton}
                    onPress={() => handleReservasi(l)}
                  >
                    <Text style={styles.reservasiButtonText}>
                      {t("facilityDetail.reservationButton")}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.section}>
            <View style={styles.ulasanHeader}>
              <Text style={styles.sectionTitle}>
                {t("facilityDetail.patientReviewsSection")}
              </Text>
              <TouchableOpacity
                onPress={() => router.push(`/faskes/${id}/ulasan`)}
              >
                <Text style={styles.lihatSemuaText}>
                  {t("facilityDetail.seeAllReviews")}
                </Text>
              </TouchableOpacity>
            </View>
            {ulasan.length === 0 ? (
              <Text style={styles.emptyUlasanText}>
                {t("facilityDetail.emptyReviews")}
              </Text>
            ) : (
              ulasan.map((u) => {
                const namaPengulas =
                  u.profiles?.[0]?.nama || t("facilityDetail.defaultUser");
                const inisial = namaPengulas.charAt(0).toUpperCase();
                return (
                  <View key={u.id} style={styles.ulasanCard}>
                    <View style={styles.ulasanTopRow}>
                      <View style={styles.ulasanAvatar}>
                        <Text style={styles.ulasanAvatarText}>{inisial}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.ulasanName}>{namaPengulas}</Text>
                        <Text style={styles.ulasanDate}>
                          {new Date(u.created_at).toLocaleDateString(
                            language === "en" ? "en-US" : "id-ID",
                          )}
                        </Text>
                      </View>
                      <View style={{ flexDirection: "row", gap: 1 }}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Ionicons
                            key={i}
                            name={i < u.rating ? "star" : "star-outline"}
                            size={12}
                            color="#EAA23B"
                          />
                        ))}
                      </View>
                    </View>
                    {u.komentar ? (
                      <Text style={styles.ulasanComment}>{u.komentar}</Text>
                    ) : null}
                    {u.balasan_admin ? (
                      <View style={styles.balasanBox}>
                        <Text style={styles.balasanLabel}>
                          {t("facilityDetail.facilityReply")}
                        </Text>
                        <Text style={styles.balasanText}>
                          {u.balasan_admin}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  skeletonBase: { backgroundColor: "#E3ECEA", borderRadius: 8 },
  container: { flex: 1, backgroundColor: "#fff" },
  loadingScreen: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  notFoundText: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 14,
    color: "#888",
  },
  hero: { height: 200, backgroundColor: "#E1F5EE" },
  heroImage: { width: "100%", height: "100%" },
  heroPlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  backButton: {
    position: "absolute",
    top: 12,
    left: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  content: { padding: 20 },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  name: {
    flex: 1,
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 18,
    color: "#222",
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#FFF7E8",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  ratingText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 12,
    color: "#B8860B",
  },
  reviewCount: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  badgeRow: { flexDirection: "row", gap: 8, marginTop: 10, flexWrap: "wrap" },
  statusBadge: {
    backgroundColor: "#E1F5EE",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusBadgeClosed: { backgroundColor: "#FDEDED" },
  statusText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 11,
    color: "#0D9488",
  },
  statusTextClosed: { color: "#DC2626" },
  bpjsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#E1F5EE",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  bpjsText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 11,
    color: "#0D9488",
  },
  addressRow: { flexDirection: "row", gap: 8, marginTop: 14 },
  addressText: {
    flex: 1,
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 13,
    color: "#555",
    lineHeight: 19,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 18,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#F1F1F1",
    paddingVertical: 14,
  },
  actionButton: { alignItems: "center", gap: 4 },
  actionLabel: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 11,
    color: "#0D9488",
  },
  actionLabelDisabled: { color: "#CCC" },
  facilityRow: { flexDirection: "row", gap: 8, marginTop: 16 },
  facilityChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderColor: "#E1F5EE",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  facilityText: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 11,
    color: "#0D9488",
  },
  section: { marginTop: 20 },
  sectionTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 15,
    color: "#222",
    marginBottom: 6,
  },
  description: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 13,
    color: "#666",
    lineHeight: 20,
  },
  layananRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F1F1",
  },
  layananIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#E1F5EE",
    alignItems: "center",
    justifyContent: "center",
  },
  layananName: {
    flex: 1,
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 13,
    color: "#222",
  },
  reservasiButton: {
    borderWidth: 1,
    borderColor: "#0D9488",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  reservasiButtonText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 11,
    color: "#0D9488",
  },
  ulasanHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lihatSemuaText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 12,
    color: "#0D9488",
  },
  emptyUlasanText: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 13,
    color: "#888",
    marginTop: 4,
  },
  ulasanCard: {
    borderBottomWidth: 1,
    borderBottomColor: "#F1F1F1",
    paddingVertical: 12,
  },
  ulasanTopRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  ulasanAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E1F5EE",
    alignItems: "center",
    justifyContent: "center",
  },
  ulasanAvatarText: {
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
  ulasanComment: {
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
