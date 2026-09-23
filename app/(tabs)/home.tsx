import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTabBarSpace } from "../../components/CustomTabBar";
import { useLanguage } from "../../lib/LanguageContext";
import { useLocation } from "../../lib/LocationContext";
import { supabase } from "../../lib/supabase";

type Kategori = {
  id: string;
  key: string;
  nama: string;
  icon_library: "ionicons" | "material_community";
  icon_name: string;
};

type Faskes = {
  id: string;
  nama: string;
  rating: number | null;
  buka_24_jam: boolean;
  jam_tutup: string | null;
  foto_url: string | null;
  jarak_km: number;
};

const MAX_VISIBLE_CATEGORIES = 5;
const NEARBY_COUNT = 3;
const TOP_RATED_COUNT = 3;
const PLACEHOLDER_IMG =
  "https://placehold.co/300x180/E1F5EE/0F6E56?text=Faskes";

function statusFaskes(f: Faskes, t: (key: string) => string) {
  if (f.buka_24_jam) return t("homeScreen.open24Hours");
  return f.jam_tutup
    ? `${t("homeScreen.closesAtPrefix")}${f.jam_tutup.slice(0, 5)}`
    : "";
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

function CategorySkeleton() {
  return (
    <View style={styles.categoryItem}>
      <SkeletonBox style={styles.categoryIconWrapper} />
      <SkeletonBox style={{ width: 40, height: 10, borderRadius: 4 }} />
    </View>
  );
}

function FeaturedCardSkeleton() {
  return (
    <View style={styles.featuredCard}>
      <SkeletonBox style={styles.featuredImage} />
      <View style={styles.facilityInfo}>
        <SkeletonBox style={{ height: 14, width: "80%", borderRadius: 4 }} />
        <SkeletonBox style={{ height: 11, width: "50%", borderRadius: 4 }} />
        <SkeletonBox style={{ height: 32, borderRadius: 10, marginTop: 4 }} />
      </View>
    </View>
  );
}

function RatingRowSkeleton() {
  return (
    <View style={styles.ratingRow}>
      <SkeletonBox style={styles.ratingThumb} />
      <View style={styles.ratingInfo}>
        <SkeletonBox style={{ height: 14, width: "70%", borderRadius: 4 }} />
        <SkeletonBox style={{ height: 11, width: "40%", borderRadius: 4 }} />
        <SkeletonBox style={{ height: 11, width: "55%", borderRadius: 4 }} />
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const tabBarSpace = useTabBarSpace();
  const [categories, setCategories] = useState<Kategori[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [fotoProfil, setFotoProfil] = useState<string | null>(null);
  const [adaNotifBelumDibaca, setAdaNotifBelumDibaca] = useState(false);

  useEffect(() => {
    const fetchFoto = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("foto_profil")
        .eq("id", user.id)
        .maybeSingle();
      if (data?.foto_profil) setFotoProfil(data.foto_profil);
    };
    fetchFoto();
  }, []);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("kategori_faskes")
      .select("id, key, nama, icon_library, icon_name")
      .eq("aktif", true)
      .order("urutan", { ascending: true });

    if (!error && data) setCategories(data as Kategori[]);
    setCategoriesLoading(false);
  };
  useEffect(() => {
    fetchCategories();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const cekNotifBelumDibaca = async () => {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        const { count } = await supabase
          .from("notifikasi")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("dibaca", false);
        setAdaNotifBelumDibaca((count ?? 0) > 0);
      };
      cekNotifBelumDibaca();
    }, []),
  );

  const {
    location,
    isLoading: isLocationLoading,
    permissionDenied,
    detectCurrentLocation,
  } = useLocation();

  const locationText = location
    ? location.label
    : permissionDenied
      ? t("homeScreen.enableLocation")
      : t("homeScreen.detectingLocation");

  const [faskesList, setFaskesList] = useState<Faskes[]>([]);
  const [faskesLoading, setFaskesLoading] = useState(true);

  const fetchFaskes = async () => {
    if (!location?.latitude || !location?.longitude) return;
    const { data, error } = await supabase.rpc("faskes_terdekat", {
      lat: location.latitude,
      lng: location.longitude,
      radius_km: 20,
    });
    if (!error && data) setFaskesList(data as Faskes[]);
    setFaskesLoading(false);
  };
  useEffect(() => {
    fetchFaskes();
  }, [location?.latitude, location?.longitude]);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchCategories(),
      fetchFaskes(),
      detectCurrentLocation(),
    ]);
    setRefreshing(false);
  };

  const nearby = faskesList.slice(0, NEARBY_COUNT);
  const topRated = [...faskesList]
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, TOP_RATED_COUNT);

  const pulseAnim1 = useRef(new Animated.Value(0)).current;
  const pulseAnim2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createPulse = (animValue: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animValue, {
            toValue: 1,
            duration: 1800,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      );

    const anim1 = createPulse(pulseAnim1, 0);
    const anim2 = createPulse(pulseAnim2, 900);

    anim1.start();
    anim2.start();

    return () => {
      anim1.stop();
      anim2.stop();
    };
  }, []);

  const handleTriase = () => {
    router.push("/cek-gejala");
  };

  const handleLihatSemua = (mode: "terdekat" | "rating") => {
    router.push({ pathname: "/daftar-faskes", params: { mode } });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.locationBlock}
          onPress={() => router.push("/ubah-lokasi")}
          activeOpacity={0.7}
        >
          <Image
            source={require("../../assets/images/logo-vitanear-nottext.png")}
            style={styles.locationLogo}
            resizeMode="contain"
          />
          <View>
            <Text style={styles.locationLabel}>
              {t("homeScreen.currentLocation")}
            </Text>
            <View style={styles.locationValueRow}>
              <Text style={styles.locationValue}>{locationText}</Text>
              {isLocationLoading && !location ? (
                <ActivityIndicator
                  size="small"
                  color="#0D9488"
                  style={{ marginLeft: 6 }}
                />
              ) : (
                <Ionicons
                  name="chevron-down"
                  size={14}
                  color="#888"
                  style={{ marginLeft: 4 }}
                />
              )}
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push("/notifikasi")}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="notifications-outline" size={20} color="#333" />
            {adaNotifBelumDibaca && <View style={styles.notifBadge} />}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/profil")}>
            {fotoProfil ? (
              <Image source={{ uri: fotoProfil }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <Ionicons name="person" size={18} color="#0D9488" />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: tabBarSpace + 20 },
        ]}
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
        {/* Banner AI */}
        <LinearGradient
          colors={["#0B6E64", "#12A594"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.aiBanner}
        >
          <View style={styles.aiBannerTextCol}>
            <View style={styles.aiBadge}>
              <Text style={styles.aiBadgeText}>{t("homeScreen.aiBadge")}</Text>
            </View>
            <Text style={styles.aiTitle}>{t("homeScreen.aiTitle")}</Text>
            <TouchableOpacity
              style={styles.aiButton}
              onPress={handleTriase}
              activeOpacity={0.85}
            >
              <Text style={styles.aiButtonText}>
                {t("homeScreen.checkSymptomsButton")}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.aiIllustration}>
            <Animated.View
              style={[
                styles.pulseRing,
                {
                  opacity: pulseAnim1.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 0],
                  }),
                  transform: [
                    {
                      scale: pulseAnim1.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.7],
                      }),
                    },
                  ],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.pulseRing,
                {
                  opacity: pulseAnim2.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 0],
                  }),
                  transform: [
                    {
                      scale: pulseAnim2.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.7],
                      }),
                    },
                  ],
                },
              ]}
            />
            <View style={styles.aiIconCore}>
              <Ionicons name="pulse" size={26} color="#fff" />
            </View>
          </View>
        </LinearGradient>

        {/* Kategori */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginHorizontal: -20 }}
          contentContainerStyle={styles.categoryRow}
        >
          {categoriesLoading ? (
            Array.from({ length: MAX_VISIBLE_CATEGORIES }).map((_, i) => (
              <CategorySkeleton key={i} />
            ))
          ) : (
            <>
              {categories.slice(0, MAX_VISIBLE_CATEGORIES).map((category) => {
                return (
                  <TouchableOpacity
                    key={category.id}
                    style={styles.categoryItem}
                    onPress={() =>
                      router.push({
                        pathname: "/hasil-kategori",
                        params: {
                          kategoriId: category.id,
                          kategoriNama: category.nama,
                          iconLib: category.icon_library,
                          iconName: category.icon_name,
                        },
                      })
                    }
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={["#E1F5EE", "#C7EAE0"]}
                      style={styles.categoryIconWrapper}
                    >
                      {category.icon_library === "ionicons" ? (
                        <Ionicons
                          name={category.icon_name as any}
                          size={22}
                          color="#0D9488"
                        />
                      ) : (
                        <MaterialCommunityIcons
                          name={category.icon_name as any}
                          size={22}
                          color="#0D9488"
                        />
                      )}
                    </LinearGradient>
                    <Text style={styles.categoryLabel}>{category.nama}</Text>
                  </TouchableOpacity>
                );
              })}

              {categories.length > MAX_VISIBLE_CATEGORIES ? (
                <TouchableOpacity
                  style={styles.categoryItem}
                  onPress={() => router.push("/kategori-lengkap")}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={["#E1F5EE", "#C7EAE0"]}
                    style={styles.categoryIconWrapper}
                  >
                    <Ionicons name="apps-outline" size={22} color="#0D9488" />
                  </LinearGradient>
                  <Text style={styles.categoryLabel}>
                    {t("homeScreen.otherCategory")}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </>
          )}
        </ScrollView>

        {/* Fasilitas Kesehatan Terdekat */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            {t("homeScreen.nearbyFacilities")}
          </Text>
          <TouchableOpacity onPress={() => handleLihatSemua("terdekat")}>
            <Text style={styles.sectionLink}>{t("homeScreen.seeAll")}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginHorizontal: -20 }}
          contentContainerStyle={[styles.cardRow, { paddingHorizontal: 20 }]}
        >
          {faskesLoading ? (
            Array.from({ length: NEARBY_COUNT }).map((_, i) => (
              <FeaturedCardSkeleton key={i} />
            ))
          ) : nearby.length === 0 ? (
            <Text style={styles.facilityMetaText}>
              {t("homeScreen.emptyNearby")}
            </Text>
          ) : (
            nearby.map((facility) => (
              <TouchableOpacity
                key={facility.id}
                style={styles.featuredCard}
                activeOpacity={0.85}
                onPress={() =>
                  router.push({
                    pathname: "/faskes/[id]",
                    params: { id: facility.id },
                  })
                }
              >
                <Image
                  source={{ uri: facility.foto_url || PLACEHOLDER_IMG }}
                  style={styles.featuredImage}
                />
                <View style={styles.facilityInfo}>
                  <Text style={styles.facilityName} numberOfLines={1}>
                    {facility.nama}
                  </Text>
                  <View style={styles.facilityMetaRow}>
                    <Ionicons name="star" size={12} color="#EAA23B" />
                    <Text style={styles.facilityMetaText}>
                      {facility.rating ?? "-"}
                    </Text>
                    <Ionicons
                      name="location-outline"
                      size={12}
                      color="#666"
                      style={{ marginLeft: 8 }}
                    />
                    <Text style={styles.facilityMetaText}>
                      {facility.jarak_km.toFixed(1)} km
                    </Text>
                  </View>
                  <Text style={styles.facilityStatus}>
                    {statusFaskes(facility, t)}
                  </Text>
                  <View style={styles.detailButton}>
                    <Text style={styles.detailButtonText}>
                      {t("homeScreen.viewDetailButton")}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        {/* Rating Tertinggi */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            {t("homeScreen.topRatedFacilities")}
          </Text>
          <TouchableOpacity onPress={() => handleLihatSemua("rating")}>
            <Text style={styles.sectionLink}>{t("homeScreen.seeAll")}</Text>
          </TouchableOpacity>
        </View>

        <View style={{ gap: 12 }}>
          {faskesLoading ? (
            Array.from({ length: TOP_RATED_COUNT }).map((_, i) => (
              <RatingRowSkeleton key={i} />
            ))
          ) : topRated.length === 0 ? (
            <Text style={styles.facilityMetaText}>
              {t("homeScreen.emptyTopRated")}
            </Text>
          ) : (
            topRated.map((facility) => (
              <TouchableOpacity
                key={facility.id}
                style={styles.ratingRow}
                activeOpacity={0.85}
                onPress={() =>
                  router.push({
                    pathname: "/faskes/[id]",
                    params: { id: facility.id },
                  })
                }
              >
                <Image
                  source={{ uri: facility.foto_url || PLACEHOLDER_IMG }}
                  style={styles.ratingThumb}
                />
                <View style={styles.ratingInfo}>
                  <Text style={styles.facilityName} numberOfLines={1}>
                    {facility.nama}
                  </Text>
                  <View style={styles.facilityMetaRow}>
                    <Ionicons name="star" size={12} color="#EAA23B" />
                    <Text style={styles.facilityMetaText}>
                      {facility.rating ?? "-"}
                    </Text>
                    <Ionicons
                      name="location-outline"
                      size={12}
                      color="#666"
                      style={{ marginLeft: 8 }}
                    />
                    <Text style={styles.facilityMetaText}>
                      {facility.jarak_km.toFixed(1)} km
                    </Text>
                  </View>
                  <Text style={styles.facilityStatus}>
                    {statusFaskes(facility, t)}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#B0B0B0" />
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  skeletonBase: {
    backgroundColor: "#E3ECEA",
    borderRadius: 8,
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#F6FBF9",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
    backgroundColor: "#F6FBF9",
    borderBottomWidth: 1,
    borderBottomColor: "#EAF1EF",
  },
  locationBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  locationLogo: {
    width: 22,
    height: 22,
  },
  locationLabel: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 11,
    color: "#888",
  },
  locationValueRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationValue: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 14,
    color: "#222",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#EEF2F1",
    alignItems: "center",
    justifyContent: "center",
  },
  notifBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#DC2626",
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E1F5EE",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  aiBanner: {
    flexDirection: "row",
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    alignItems: "center",
    justifyContent: "space-between",
  },
  aiBannerTextCol: {
    flex: 1,
    gap: 10,
  },
  aiBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  aiBadgeText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 10,
    color: "#fff",
    letterSpacing: 0.5,
  },
  aiTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 18,
    color: "#fff",
  },
  aiButton: {
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  aiButtonText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 12,
    color: "#0D9488",
  },
  aiIllustration: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  pulseRing: {
    position: "absolute",
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  aiIconCore: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  categoryRow: {
    gap: 16,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  categoryItem: {
    alignItems: "center",
    gap: 6,
    width: 64,
  },
  categoryIconWrapper: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryLabel: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 11,
    color: "#444",
    textAlign: "center",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 15,
    color: "#222",
  },
  sectionLink: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 12,
    color: "#0D9488",
  },
  cardRow: {
    gap: 14,
    paddingBottom: 28,
  },
  facilityCard: {
    width: 220,
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#EEF2F1",
  },
  featuredCard: {
    width: 268,
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#EEF2F1",
  },
  featuredImage: {
    width: "100%",
    height: 150,
    backgroundColor: "#E1F5EE",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EEF2F1",
    padding: 10,
  },
  ratingThumb: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: "#E1F5EE",
  },
  ratingInfo: {
    flex: 1,
    gap: 4,
  },
  facilityImage: {
    width: "100%",
    height: 110,
    backgroundColor: "#E1F5EE",
  },
  facilityInfo: {
    padding: 12,
    gap: 6,
  },
  facilityName: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 13,
    color: "#222",
  },
  facilityMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  facilityMetaText: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 11,
    color: "#666",
    marginLeft: 2,
  },
  facilityStatus: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 11,
    color: "#0D9488",
  },
  detailButton: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#0D9488",
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
  },
  detailButtonText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 12,
    color: "#0D9488",
  },
});
