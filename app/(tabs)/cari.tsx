import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ReactNode, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Keyboard,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLanguage } from "../../lib/LanguageContext";
import { useLocation } from "../../lib/LocationContext";
import { useSearchFilters } from "../../lib/SearchFilterContext";
import { supabase } from "../../lib/supabase";

type Kategori = {
  id: string;
  key: string;
  nama: string;
  icon_library: "ionicons" | "material_community";
  icon_name: string;
};

type IconName = keyof typeof Ionicons.glyphMap;

type PintasanType = {
  labelKey: string;
  icon: IconName;
  filter: "bukaSekarang" | "buka24Jam" | "menerimaBpjs" | "rating";
};

const PINTASAN_ITEMS: PintasanType[] = [
  {
    labelKey: "searchScreen.shortcutOpenNow",
    icon: "time-outline",
    filter: "bukaSekarang",
  },
  {
    labelKey: "searchScreen.shortcutOpen24h",
    icon: "moon-outline",
    filter: "buka24Jam",
  },
  {
    labelKey: "searchScreen.shortcutAcceptBpjs",
    icon: "shield-checkmark-outline",
    filter: "menerimaBpjs",
  },
  {
    labelKey: "searchScreen.shortcutRating4",
    icon: "star-outline",
    filter: "rating",
  },
];

// Efek tekan: elemen mengecil sedikit lalu kembali (umpan balik sentuhan sebelum berpindah halaman)
function PressScale({
  onPress,
  style,
  outerStyle,
  children,
}: {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  outerStyle?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const ke = (v: number) =>
    Animated.spring(scale, {
      toValue: v,
      speed: 40,
      bounciness: 6,
      useNativeDriver: true,
    }).start();
  return (
    <Pressable
      style={outerStyle}
      onPress={onPress}
      onPressIn={() => ke(0.95)}
      onPressOut={() => ke(1)}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

export default function CariScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { filters, setFilters } = useSearchFilters();
  const { location, permissionDenied } = useLocation();
  const [query, setQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [categories, setCategories] = useState<Kategori[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from("kategori_faskes")
        .select("id, key, nama, icon_library, icon_name")
        .eq("aktif", true)
        .order("urutan", { ascending: true })
        .limit(4);
      if (!error && data) setCategories(data as Kategori[]);
      setLoading(false);
    };
    fetchCategories();
  }, []);

  const cariNama = () => {
    Keyboard.dismiss();
    setFilters({ ...filters, poliKeys: [] });
    router.push({ pathname: "/hasil-pencarian", params: { query } });
  };

  const bukaKategori = (item: Kategori) => {
    Keyboard.dismiss();
    setFilters({ ...filters, poliKeys: [item.id] });
    router.push({
      pathname: "/hasil-pencarian",
      params: { kategoriNama: item.nama },
    });
  };

  const bukaPintasan = (p: PintasanType) => {
    Keyboard.dismiss();
    // Mulai dari filter bersih supaya hanya pintasan yang dipilih yang aktif
    setFilters({
      ...filters,
      poliKeys: [],
      bukaSekarang: p.filter === "bukaSekarang",
      buka24Jam: p.filter === "buka24Jam",
      menerimaBpjs: p.filter === "menerimaBpjs",
      ratingMinimum: p.filter === "rating" ? 4 : 0,
    });
    router.push("/hasil-pencarian");
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Text style={styles.title}>{t("searchScreen.title")}</Text>
          {/* Titik acuan pencarian & jarak; ketuk untuk mengubah */}
          <TouchableOpacity
            style={[styles.locPill, permissionDenied && styles.locPillWarn]}
            onPress={() => router.push("/ubah-lokasi")}
            activeOpacity={0.8}
          >
            <Ionicons
              name={permissionDenied ? "warning-outline" : "navigate"}
              size={13}
              color={permissionDenied ? "#B45309" : "#0D9488"}
            />
            <Text
              style={[
                styles.locPillText,
                permissionDenied && { color: "#B45309" },
              ]}
              numberOfLines={1}
            >
              {location?.label ?? t("searchScreen.selectLocation")}
            </Text>
            <Ionicons
              name="chevron-down"
              size={13}
              color={permissionDenied ? "#B45309" : "#0D9488"}
            />
          </TouchableOpacity>
        </View>

        {/* Kolom pencarian: gaya sama dengan halaman hasil pencarian */}
        <View
          style={[styles.searchBar, searchFocused && styles.searchBarFocused]}
        >
          <Ionicons
            name="search"
            size={18}
            color={searchFocused ? "#0D9488" : "#9CA3AF"}
          />
          <TextInput
            style={styles.searchInput}
            placeholder={t("searchScreen.searchPlaceholder")}
            placeholderTextColor="#A0A0A0"
            value={query}
            onChangeText={setQuery}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            onSubmitEditing={cariNama}
            returnKeyType="search"
          />
          {query ? (
            <>
              <TouchableOpacity onPress={() => setQuery("")} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color="#C4C4C4" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.goButton}
                onPress={cariNama}
                activeOpacity={0.85}
              >
                <Ionicons name="arrow-forward" size={16} color="#fff" />
              </TouchableOpacity>
            </>
          ) : null}
        </View>

        <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>
          {t("searchScreen.popularCategories")}
        </Text>
        {loading ? (
          <ActivityIndicator color="#0D9488" style={{ marginVertical: 16 }} />
        ) : (
          <View style={styles.categoryRow}>
            {categories.map((item) => (
              <PressScale
                key={item.id}
                outerStyle={styles.categoryItem}
                style={styles.categoryInner}
                onPress={() => bukaKategori(item)}
              >
                <LinearGradient
                  colors={["#E1F5EE", "#C7EAE0"]}
                  style={styles.categoryIconWrapper}
                >
                  {item.icon_library === "ionicons" ? (
                    <Ionicons
                      name={item.icon_name as any}
                      size={22}
                      color="#0D9488"
                    />
                  ) : (
                    <MaterialCommunityIcons
                      name={item.icon_name as any}
                      size={22}
                      color="#0D9488"
                    />
                  )}
                </LinearGradient>
                <Text style={styles.categoryLabel} numberOfLines={1}>
                  {item.nama}
                </Text>
              </PressScale>
            ))}
          </View>
        )}

        <Text
          style={[styles.sectionTitle, { marginTop: 28, marginBottom: 12 }]}
        >
          {t("searchScreen.quickSearch")}
        </Text>
        <View style={styles.quickWrap}>
          {PINTASAN_ITEMS.map((p) => (
            <PressScale
              key={p.labelKey}
              outerStyle={styles.quickItem}
              style={styles.quickChip}
              onPress={() => bukaPintasan(p)}
            >
              <Ionicons name={p.icon} size={15} color="#0D9488" />
              <Text style={styles.quickText}>{t(p.labelKey)}</Text>
            </PressScale>
          ))}
        </View>

        {/* Jembatan ke Cek Gejala: untuk pengguna yang belum tahu harus memilih layanan apa */}
        <LinearGradient
          colors={["#0B6E64", "#12A594"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.aiCard}
        >
          <Ionicons
            name="pulse"
            size={120}
            color="rgba(255,255,255,0.14)"
            style={styles.aiIcon}
          />
          <Text style={styles.aiTitle}>{t("searchScreen.aiTitle")}</Text>
          <Text style={styles.aiText}>{t("searchScreen.aiSubtitle")}</Text>
          <TouchableOpacity
            style={styles.aiButton}
            onPress={() => router.push("/cek-gejala")}
            activeOpacity={0.85}
          >
            <Text style={styles.aiButtonText}>
              {t("searchScreen.aiButton")}
            </Text>
            <Ionicons name="arrow-forward" size={15} color="#0D9488" />
          </TouchableOpacity>
        </LinearGradient>
      </ScrollView>
    </SafeAreaView>
  );
}

const SHADOW = {
  shadowColor: "#000",
  shadowOpacity: 0.05,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 3 },
  elevation: 2,
} as const;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F6FBF9" },
  scrollContent: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40 },
  title: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 22,
    color: "#1F2937",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 16,
  },
  locPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    maxWidth: 170,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#E1F5EE",
  },
  locPillWarn: { backgroundColor: "#FEF3C7" },
  locPillText: {
    flexShrink: 1,
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 12,
    color: "#0D6459",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 48,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingLeft: 14,
    paddingRight: 8,
    marginBottom: 26,
    borderWidth: 1,
    borderColor: "#EEF2F1",
    ...SHADOW,
  },
  searchBarFocused: {
    borderColor: "#0D9488",
    borderWidth: 1.5,
    paddingLeft: 13.5,
    paddingRight: 7.5,
  },
  searchInput: {
    flex: 1,
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 14,
    color: "#222",
  },
  goButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#0D9488",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 15,
    color: "#1F2937",
  },
  categoryRow: { flexDirection: "row", justifyContent: "space-between" },
  categoryItem: { width: "22%" },
  categoryInner: { alignItems: "center", gap: 8 },
  categoryIconWrapper: {
    width: 52,
    height: 52,
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
  quickWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
  },
  quickItem: { width: "48%" },
  quickChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 46,
    paddingHorizontal: 14,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EEF2F1",
    ...SHADOW,
  },
  quickText: {
    flexShrink: 1,
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 12.5,
    color: "#374151",
  },
  aiCard: {
    marginTop: 28,
    borderRadius: 20,
    padding: 20,
    overflow: "hidden",
  },
  aiIcon: { position: "absolute", right: -14, bottom: -20 },
  aiTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 16,
    color: "#fff",
    paddingRight: 60,
  },
  aiText: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 12.5,
    lineHeight: 18,
    color: "rgba(255,255,255,0.88)",
    marginTop: 6,
    maxWidth: "82%",
  },
  aiButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 38,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: "#fff",
    marginTop: 14,
  },
  aiButtonText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 13,
    color: "#0D9488",
  },
});
