import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, UrlTile } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLanguage } from "../lib/LanguageContext";
import { useLocation } from "../lib/LocationContext";
import { useSearchFilters } from "../lib/SearchFilterContext";
import { supabase } from "../lib/supabase";

type Faskes = {
  id: string;
  nama: string;
  kategori_id: string | null;
  alamat: string | null;
  latitude: number;
  longitude: number;
  rating: number;
  jumlah_ulasan: number;
  buka_24_jam: boolean;
  jam_buka: string | null;
  jam_tutup: string | null;
  foto_url: string | null;
  jarak_km: number;
};

// Kartu muncul bertahap (fade + naik sedikit) agar peralihan dari halaman cari terasa halus
function Muncul({ index, children }: { index: number; children: ReactNode }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 320,
      delay: Math.min(index, 8) * 55,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [anim, index]);
  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [
          {
            translateY: anim.interpolate({
              inputRange: [0, 1],
              outputRange: [16, 0],
            }),
          },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
}

// < 1 km ditampilkan dalam meter; desimal memakai koma. Ini jarak garis lurus, bukan rute.
function formatJarak(km: number) {
  if (km < 1) return `${Math.max(Math.round(km * 100) * 10, 10)} m`;
  return `${km.toFixed(1).replace(".", ",")} km`;
}

export default function HasilPencarianScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const params = useLocalSearchParams<{
    query?: string;
    kategoriNama?: string;
  }>();
  const {
    location,
    isLoading: lokasiLoading,
    permissionDenied,
  } = useLocation();
  const { filters, setFilters } = useSearchFilters();

  const [query, setQuery] = useState(params.query ?? "");
  const [searchFocused, setSearchFocused] = useState(false);
  const [view, setView] = useState<"peta" | "daftar">("daftar");
  const [urut, setUrut] = useState<"jarak" | "rating">("jarak");

  const [results, setResults] = useState<Faskes[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFaskes, setSelectedFaskes] = useState<Faskes | null>(null);
  const mapRef = useRef<MapView>(null);
  const [kategoriMap, setKategoriMap] = useState<Record<string, string[]>>({});
  const [namaKategori, setNamaKategori] = useState<Record<string, string>>({});

  const getStatus = (f: Faskes): { text: string; open: boolean } => {
    if (f.buka_24_jam)
      return { text: t("searchResults.status24Hours"), open: true };
    if (!f.jam_buka || !f.jam_tutup)
      return { text: t("searchResults.statusNoHours"), open: false };

    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const [bh, bm] = f.jam_buka.split(":").map(Number);
    const [th, tm] = f.jam_tutup.split(":").map(Number);
    const isOpen = nowMinutes >= bh * 60 + bm && nowMinutes <= th * 60 + tm;

    return isOpen
      ? {
          text: t("searchResults.statusClosesAt").replace(
            "{{time}}",
            f.jam_tutup.slice(0, 5),
          ),
          open: true,
        }
      : {
          text: t("searchResults.statusClosedOpensAt").replace(
            "{{time}}",
            f.jam_buka.slice(0, 5),
          ),
          open: false,
        };
  };

  useEffect(() => {
    supabase
      .from("kategori_faskes")
      .select("id, nama")
      .then(({ data }) => {
        const m: Record<string, string> = {};
        (data ?? []).forEach((k: { id: string; nama: string }) => {
          m[k.id] = k.nama;
        });
        setNamaKategori(m);
      });
  }, []);

  useEffect(() => {
    supabase
      .from("faskes_kategori_aktif")
      .select("faskes_id, kategori_id")
      .then(({ data }) => {
        const m: Record<string, string[]> = {};
        (data ?? []).forEach(
          (r: { faskes_id: string; kategori_id: string }) => {
            if (!m[r.faskes_id]) m[r.faskes_id] = [];
            m[r.faskes_id].push(r.kategori_id);
          },
        );
        setKategoriMap(m);
      });
  }, []);

  useEffect(() => {
    if (!location) return;
    let dibatalkan = false;
    const fetchNearby = async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc("faskes_terdekat", {
        lat: location.latitude,
        lng: location.longitude,
        radius_km: 20,
      });
      if (dibatalkan) return;
      if (!error && data) setResults(data as Faskes[]);
      setLoading(false);
    };
    fetchNearby();
    return () => {
      dibatalkan = true;
    };
  }, [location?.latitude, location?.longitude]);

  useEffect(() => {
    if (!location && !lokasiLoading) setLoading(false);
  }, [location, lokasiLoading]);

  const filteredResults = useMemo(() => {
    let list = [...results];
    if (query.trim()) {
      list = list.filter((f) =>
        f.nama.toLowerCase().includes(query.trim().toLowerCase()),
      );
    }
    if (filters.poliKeys.length > 0) {
      list = list.filter(
        (f) =>
          (f.kategori_id && filters.poliKeys.includes(f.kategori_id)) ||
          (kategoriMap[f.id] ?? []).some((k) => filters.poliKeys.includes(k)),
      );
    }
    list = list.filter((f) => f.jarak_km <= filters.jarakMaksimal);
    if (filters.ratingMinimum > 0) {
      list = list.filter((f) => f.rating >= filters.ratingMinimum);
    }
    if (filters.bukaSekarang) {
      list = list.filter((f) => getStatus(f).open);
    }
    if (filters.buka24Jam) {
      list = list.filter((f) => f.buka_24_jam);
    }
    if (filters.menerimaBpjs) {
      list = list.filter((f) => (f as any).menerima_bpjs);
    }
    list = [...list].sort((a, b) =>
      urut === "rating" ? b.rating - a.rating : a.jarak_km - b.jarak_km,
    );
    return list;
  }, [results, query, urut, filters, kategoriMap]);

  const mapRegion = useMemo(() => {
    if (filteredResults.length === 0) {
      return {
        latitude: location?.latitude ?? -7.9666,
        longitude: location?.longitude ?? 112.6326,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }
    const lats = filteredResults.map((f) => f.latitude);
    const lngs = filteredResults.map((f) => f.longitude);
    const minLat = Math.min(...lats),
      maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs),
      maxLng = Math.max(...lngs);
    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(maxLat - minLat, 0.03) * 1.6,
      longitudeDelta: Math.max(maxLng - minLng, 0.03) * 1.6,
    };
  }, [filteredResults, location]);

  const labelKategori =
    filters.poliKeys
      .map((id) => namaKategori[id])
      .filter(Boolean)
      .join(", ") ||
    (filters.poliKeys.length > 0 ? (params.kategoriNama ?? "") : "");

  type ChipDef = {
    key: string;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    active: boolean;
    onPress: () => void;
  };
  const aturFilter = (patch: Partial<typeof filters>) =>
    setFilters({ ...filters, ...patch });
  const urutChips: ChipDef[] = [
    {
      key: "jarak",
      label: t("searchResults.nearest"),
      icon: "navigate-circle-outline",
      active: urut === "jarak",
      onPress: () => setUrut("jarak"),
    },
    {
      key: "rating",
      label: t("searchResults.highestRating"),
      icon: "trophy-outline",
      active: urut === "rating",
      onPress: () => setUrut("rating"),
    },
  ];
  const filterChips: ChipDef[] = [
    {
      key: "buka",
      label: t("searchResults.openNow"),
      icon: "time-outline",
      active: filters.bukaSekarang,
      onPress: () => aturFilter({ bukaSekarang: !filters.bukaSekarang }),
    },
    {
      key: "24jam",
      label: t("searchResults.open24Hours"),
      icon: "moon-outline",
      active: filters.buka24Jam,
      onPress: () => aturFilter({ buka24Jam: !filters.buka24Jam }),
    },
    {
      key: "bpjs",
      label: t("searchResults.acceptsBpjs"),
      icon: "shield-checkmark-outline",
      active: filters.menerimaBpjs,
      onPress: () => aturFilter({ menerimaBpjs: !filters.menerimaBpjs }),
    },
    {
      key: "rating4",
      label: t("searchResults.rating4Plus"),
      icon: "star-outline",
      active: filters.ratingMinimum >= 4,
      onPress: () =>
        aturFilter({ ratingMinimum: filters.ratingMinimum >= 4 ? 0 : 4 }),
    },
  ];
  const renderChip = (c: ChipDef) => (
    <TouchableOpacity
      key={c.key}
      style={[styles.chip, c.active && styles.chipActive]}
      onPress={c.onPress}
      activeOpacity={0.8}
    >
      <Ionicons name={c.icon} size={13} color={c.active ? "#fff" : "#6B7280"} />
      <Text style={[styles.chipText, c.active && styles.chipTextActive]}>
        {c.label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={22} color="#1F2937" />
        </TouchableOpacity>
        <View
          style={[styles.searchBar, searchFocused && styles.searchBarFocused]}
        >
          <Ionicons
            name="search"
            size={16}
            color={searchFocused ? "#0D9488" : "#888"}
          />
          <TextInput
            style={styles.searchInput}
            placeholder={labelKategori || t("searchResults.searchPlaceholder")}
            placeholderTextColor="#A0A0A0"
            value={query}
            onChangeText={setQuery}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          {query ? (
            <TouchableOpacity onPress={() => setQuery("")}>
              <Ionicons name="close-circle" size={16} color="#A0A0A0" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <View style={styles.segment}>
        {(
          [
            ["peta", t("searchResults.map"), "map-outline"],
            ["daftar", t("searchResults.list"), "list-outline"],
          ] as const
        ).map(([key, label, icon]) => {
          const active = view === key;
          return (
            <TouchableOpacity
              key={key}
              style={[styles.segmentItem, active && styles.segmentItemActive]}
              onPress={() => setView(key)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={icon}
                size={16}
                color={active ? "#0D9488" : "#6B7280"}
              />
              <Text
                style={[styles.segmentText, active && styles.segmentTextActive]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.filterWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
          style={{ flex: 1 }}
        >
          <TouchableOpacity
            style={[
              styles.lokasiChip,
              permissionDenied && styles.lokasiChipWarn,
            ]}
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
                styles.lokasiChipText,
                permissionDenied && { color: "#B45309" },
              ]}
              numberOfLines={1}
            >
              {location?.label ?? t("searchResults.selectLocation")}
            </Text>
            <Ionicons
              name="chevron-down"
              size={13}
              color={permissionDenied ? "#B45309" : "#0D9488"}
            />
          </TouchableOpacity>
          {urutChips.map(renderChip)}
          <View style={styles.chipDivider} />
          {filterChips.map(renderChip)}
        </ScrollView>

        <TouchableOpacity
          style={styles.filterIconButton}
          onPress={() => router.push("/filter-pencarian")}
        >
          <Ionicons name="options-outline" size={16} color="#555" />
          {(filters.poliKeys.length > 0 ||
            filters.ratingMinimum > 0 ||
            filters.bukaSekarang ||
            filters.buka24Jam ||
            filters.menerimaBpjs) && <View style={styles.filterActiveDot} />}
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color="#0D9488" style={{ marginTop: 40 }} />
      ) : view === "daftar" && filteredResults.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="location-outline" size={40} color="#B0D4D0" />
          <Text style={styles.emptyText}>
            {location
              ? t("searchResults.emptyHasLocation")
              : t("searchResults.emptyNoLocation")}
          </Text>
          {!location && (
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push("/ubah-lokasi")}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyButtonText}>
                {t("searchResults.selectLocation")}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : view === "daftar" ? (
        <ScrollView contentContainerStyle={styles.listContent}>
          <Text style={styles.resultCount}>
            <Text style={styles.resultCountBold}>
              {filteredResults.length} {t("searchResults.faskesUnit")}
            </Text>
            {labelKategori ? ` · ${labelKategori}` : ""} ·{" "}
            {t("searchResults.straightLineDistance")}
          </Text>
          {filteredResults.map((f, i) => {
            const status = getStatus(f);
            return (
              <Muncul key={f.id} index={i}>
                <TouchableOpacity
                  style={styles.listCard}
                  activeOpacity={0.85}
                  onPress={() => router.push(`/faskes/${f.id}`)}
                >
                  <View style={styles.listImageWrap}>
                    {f.foto_url ? (
                      <Image
                        source={{ uri: f.foto_url }}
                        style={styles.listImage}
                      />
                    ) : (
                      <LinearGradient
                        colors={["#E1F5EE", "#BFE6DC"]}
                        style={styles.listImage}
                      >
                        <Ionicons
                          name="business-outline"
                          size={30}
                          color="#0D9488"
                        />
                      </LinearGradient>
                    )}
                    <View style={styles.distancePill}>
                      <Ionicons name="navigate" size={10} color="#fff" />
                      <Text style={styles.distanceText}>
                        {formatJarak(f.jarak_km)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.listInfo}>
                    <Text style={styles.listName} numberOfLines={2}>
                      {f.nama}
                    </Text>
                    <View style={styles.listRatingRow}>
                      <Ionicons name="star" size={12} color="#EAA23B" />
                      <Text style={styles.ratingText}>
                        {f.rating.toFixed(1)}
                      </Text>
                      <Text style={styles.reviewCount}>
                        ({f.jumlah_ulasan})
                      </Text>
                    </View>
                    {f.alamat ? (
                      <Text style={styles.listMeta} numberOfLines={1}>
                        {f.alamat}
                      </Text>
                    ) : null}
                    <View style={styles.statusRow}>
                      <View
                        style={[
                          styles.statusDot,
                          {
                            backgroundColor: status.open
                              ? "#16A34A"
                              : "#DC2626",
                          },
                        ]}
                      />
                      <Text
                        style={[
                          styles.listStatus,
                          !status.open && styles.listStatusClosed,
                        ]}
                        numberOfLines={1}
                      >
                        {status.text}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </Muncul>
            );
          })}
        </ScrollView>
      ) : (
        <View style={{ flex: 1, position: "relative" }}>
          <MapView
            key={`map-${view}`}
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            mapType="none"
            onMapReady={() => {
              setTimeout(() => {
                mapRef.current?.animateToRegion(mapRegion, 300);
              }, 200);
            }}
            initialRegion={mapRegion}
          >
            <UrlTile
              urlTemplate="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
              maximumZ={19}
            />
            {filteredResults.map((f) => (
              <Marker
                key={f.id}
                coordinate={{ latitude: f.latitude, longitude: f.longitude }}
                pinColor="#0D9488"
                onPress={() => setSelectedFaskes(f)}
              />
            ))}
          </MapView>
          <Text style={styles.mapAttribution}>© Esri</Text>

          {selectedFaskes ? (
            <View style={styles.mapCard}>
              <View style={styles.mapCardTop}>
                {selectedFaskes.foto_url ? (
                  <Image
                    source={{ uri: selectedFaskes.foto_url }}
                    style={styles.mapCardImage}
                  />
                ) : (
                  <LinearGradient
                    colors={["#E1F5EE", "#BFE6DC"]}
                    style={styles.mapCardImage}
                  >
                    <Ionicons
                      name="business-outline"
                      size={24}
                      color="#0D9488"
                    />
                  </LinearGradient>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.listName} numberOfLines={2}>
                    {selectedFaskes.nama}
                  </Text>
                  <View style={styles.listRatingRow}>
                    <Ionicons name="star" size={12} color="#EAA23B" />
                    <Text style={styles.ratingText}>
                      {selectedFaskes.rating.toFixed(1)}
                    </Text>
                    <Text style={styles.reviewCount}>
                      ({selectedFaskes.jumlah_ulasan})
                    </Text>
                    <Text style={styles.reviewCount}> · </Text>
                    <Ionicons name="navigate" size={11} color="#0D9488" />
                    <Text style={styles.mapDistance}>
                      {formatJarak(selectedFaskes.jarak_km)}
                    </Text>
                  </View>
                  <View style={styles.statusRow}>
                    <View
                      style={[
                        styles.statusDot,
                        {
                          backgroundColor: getStatus(selectedFaskes).open
                            ? "#16A34A"
                            : "#DC2626",
                        },
                      ]}
                    />
                    <Text
                      style={[
                        styles.listStatus,
                        !getStatus(selectedFaskes).open &&
                          styles.listStatusClosed,
                      ]}
                      numberOfLines={1}
                    >
                      {getStatus(selectedFaskes).text}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => setSelectedFaskes(null)}
                  hitSlop={8}
                >
                  <Ionicons name="close" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              <View style={styles.mapCardActions}>
                <TouchableOpacity
                  style={styles.arahButton}
                  activeOpacity={0.8}
                  onPress={() =>
                    Linking.openURL(
                      `https://www.google.com/maps/dir/?api=1&destination=${selectedFaskes.latitude},${selectedFaskes.longitude}`,
                    )
                  }
                >
                  <Ionicons name="navigate-outline" size={16} color="#0D9488" />
                  <Text style={styles.arahButtonText}>
                    {t("searchResults.directions")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.detailButton}
                  activeOpacity={0.85}
                  onPress={() => router.push(`/faskes/${selectedFaskes.id}`)}
                >
                  <Text style={styles.detailButtonText}>
                    {t("searchResults.viewDetails")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
        </View>
      )}
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
  container: { flex: 1, backgroundColor: "#F6FBF9" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#EEF2F1",
    alignItems: "center",
    justifyContent: "center",
    ...SHADOW,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 46,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#EEF2F1",
    ...SHADOW,
  },
  searchBarFocused: {
    borderColor: "#0D9488",
    borderWidth: 1.5,
    paddingHorizontal: 13.5,
  },
  searchInput: {
    flex: 1,
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 14,
    color: "#222",
  },
  segment: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 14,
    padding: 4,
    borderRadius: 14,
    backgroundColor: "#E3F1EE",
  },
  segmentItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    borderRadius: 11,
  },
  segmentItemActive: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  segmentText: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 13.5,
    color: "#6B7280",
  },
  segmentTextActive: {
    color: "#0D9488",
    fontFamily: "PlusJakartaSans_700Bold",
  },
  filterWrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 16,
    paddingRight: 8,
    paddingVertical: 12,
    gap: 8,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingRight: 8,
  },
  lokasiChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    maxWidth: 190,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#E1F5EE",
  },
  chipDivider: {
    width: 1,
    height: 18,
    backgroundColor: "#D9E3E0",
    marginHorizontal: 2,
  },
  lokasiChipWarn: { backgroundColor: "#FEF3C7" },
  lokasiChipText: {
    flexShrink: 1,
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 12,
    color: "#0D6459",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipActive: { backgroundColor: "#0D9488", borderColor: "#0D9488" },
  chipText: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 12,
    color: "#4B5563",
  },
  chipTextActive: { color: "#fff" },
  filterIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  filterActiveDot: {
    position: "absolute",
    top: 5,
    right: 5,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#0D9488",
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 40,
    paddingBottom: 48,
  },
  emptyText: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 19,
  },
  emptyButton: {
    minHeight: 44,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#0D9488",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  emptyButtonText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 14,
    color: "#0D9488",
  },
  listContent: { paddingHorizontal: 16, paddingTop: 2, paddingBottom: 24 },
  resultCount: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 12,
  },
  resultCountBold: { fontFamily: "PlusJakartaSans_700Bold", color: "#1F2937" },
  listCard: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#EEF2F1",
    padding: 10,
    marginBottom: 12,
    ...SHADOW,
  },
  listImageWrap: { width: 92, height: 92 },
  listImage: {
    width: 92,
    height: 92,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  distancePill: {
    position: "absolute",
    left: 6,
    bottom: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(17,24,39,0.72)",
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  distanceText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 10.5,
    color: "#fff",
  },
  listInfo: { flex: 1, justifyContent: "center" },
  listName: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 14.5,
    lineHeight: 19,
    color: "#1F2937",
  },
  listRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  ratingText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 12,
    color: "#B45309",
  },
  reviewCount: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 11.5,
    color: "#9CA3AF",
  },
  mapDistance: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 11.5,
    color: "#0D9488",
  },
  listMeta: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 12,
    color: "#6B7280",
    marginTop: 3,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 5,
  },
  statusDot: { width: 7, height: 7, borderRadius: 3.5 },
  listStatus: {
    flex: 1,
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 12,
    color: "#0D6459",
  },
  listStatusClosed: { color: "#DC2626" },
  mapAttribution: {
    position: "absolute",
    bottom: 6,
    right: 8,
    fontSize: 9,
    color: "#666",
    backgroundColor: "rgba(255,255,255,0.7)",
    paddingHorizontal: 4,
  },
  mapCard: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  mapCardTop: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  mapCardImage: {
    width: 64,
    height: 64,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  mapCardActions: { flexDirection: "row", gap: 10, marginTop: 14 },
  arahButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#0D9488",
    backgroundColor: "#fff",
  },
  arahButtonText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 14,
    color: "#0D9488",
  },
  detailButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    backgroundColor: "#0D9488",
    alignItems: "center",
    justifyContent: "center",
  },
  detailButtonText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 14,
    color: "#fff",
  },
});
