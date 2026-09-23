import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "expo-router/react-navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLanguage } from "../lib/LanguageContext";
import { useLocation } from "../lib/LocationContext";
import { supabase } from "../lib/supabase";

type HasilCari = { display_name: string; lat: string; lon: string };
type LokasiTersimpan = {
  id: string;
  label: string;
  alamat: string;
  latitude: number;
  longitude: number;
  icon_name: string;
};

function parsePhotonResult(feature: any): HasilCari {
  const p = feature.properties;
  const bagian = [p.name, p.street, p.city, p.state].filter(Boolean);
  return {
    display_name: [...new Set(bagian)].join(", "),
    lat: String(feature.geometry.coordinates[1]),
    lon: String(feature.geometry.coordinates[0]),
  };
}

function Skeleton({ style }: { style?: any }) {
  const o = useRef(new Animated.Value(0.45)).current;
  useEffect(() => {
    const a = Animated.loop(
      Animated.sequence([
        Animated.timing(o, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(o, {
          toValue: 0.45,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    a.start();
    return () => a.stop();
  }, [o]);
  return (
    <Animated.View
      style={[
        { backgroundColor: "#DCE9E5", borderRadius: 8, opacity: o },
        style,
      ]}
    />
  );
}

export default function UbahLokasiScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { location, detectCurrentLocation, setManualLocation } = useLocation();

  const [query, setQuery] = useState("");
  const [hasil, setHasil] = useState<HasilCari[]>([]);
  const [mencari, setMencari] = useState(false);
  const [lokasiTersimpan, setLokasiTersimpan] = useState<LokasiTersimpan[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(true);

  // Muat ulang tiap layar fokus -> data tambah/hapus lokasi selalu terbaru.
  useFocusEffect(
    useCallback(() => {
      const loadSaved = async () => {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setLoadingSaved(false);
          return;
        }
        const { data } = await supabase
          .from("lokasi_tersimpan")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true });
        setLokasiTersimpan(data || []);
        setLoadingSaved(false);
      };
      loadSaved();
    }, []),
  );

  useEffect(() => {
    if (query.trim().length < 2) {
      setHasil([]);
      return;
    }
    const timeout = setTimeout(async () => {
      setMencari(true);
      try {
        const biasParam = location
          ? `&lat=${location.latitude}&lon=${location.longitude}`
          : "";
        const res = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(
            query,
          )}&limit=8${biasParam}`,
        );
        if (!res.ok) throw new Error(`Photon error: ${res.status}`);
        const json = await res.json();
        setHasil((json.features || []).map(parsePhotonResult));
      } catch (e) {
        console.log("Gagal mencari lokasi:", e);
        setHasil([]);
      }
      setMencari(false);
    }, 250);
    return () => clearTimeout(timeout);
  }, [query, location]);

  const hapusLokasi = (l: LokasiTersimpan) => {
    Alert.alert("Hapus Lokasi", `Hapus "${l.label}" dari lokasi tersimpan?`, [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus",
        style: "destructive",
        onPress: async () => {
          const { error } = await supabase
            .from("lokasi_tersimpan")
            .delete()
            .eq("id", l.id);
          if (error) {
            Alert.alert("Gagal", "Lokasi gagal dihapus. Coba lagi.");
            return;
          }
          setLokasiTersimpan((prev) => prev.filter((x) => x.id !== l.id));
          const aktif =
            !!location &&
            (location.label === l.label ||
              (Math.abs(location.latitude - l.latitude) < 1e-6 &&
                Math.abs(location.longitude - l.longitude) < 1e-6));
          if (aktif && !(await detectCurrentLocation())) {
            Alert.alert(
              "Lokasi saat ini tidak terdeteksi",
              "Pastikan GPS aktif dan izin lokasi diberikan.",
            );
          }
        },
      },
    ]);
  };

  const pilihLokasi = (label: string, lat: number, lng: number) => {
    setManualLocation?.({ label, latitude: lat, longitude: lng });
    router.back();
  };

  const handleGunakanGPS = async () => {
    if (await detectCurrentLocation()) {
      router.back();
    } else {
      Alert.alert(
        "Lokasi saat ini tidak terdeteksi",
        "Pastikan GPS aktif dan izin lokasi diberikan.",
      );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color="#0D9488" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t("changeLocation.headerTitle")}
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={{ paddingHorizontal: 20 }}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder={t("changeLocation.searchPlaceholder")}
            placeholderTextColor="#A0A0A0"
            value={query}
            onChangeText={setQuery}
          />
          {query ? (
            <TouchableOpacity onPress={() => setQuery("")} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color="#C4C4C4" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 14,
          paddingBottom: 40,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {query.trim().length >= 2 ? (
          mencari ? (
            <View style={styles.resultPanel}>
              {[0, 1, 2, 3].map((i) => (
                <View key={i} style={styles.hasilRow}>
                  <Skeleton
                    style={{ width: 16, height: 16, borderRadius: 8 }}
                  />
                  <Skeleton style={{ flex: 1, height: 14 }} />
                </View>
              ))}
            </View>
          ) : hasil.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="location-outline" size={28} color="#C9D6D2" />
              <Text style={styles.emptyText}>
                {t("changeLocation.emptySearchTitle")}
              </Text>
              <Text style={styles.emptySubtext}>
                {t("changeLocation.emptySearchSubtext")}
              </Text>
            </View>
          ) : (
            <View style={styles.resultPanel}>
              {hasil.map((h, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.hasilRow,
                    idx === hasil.length - 1 && { borderBottomWidth: 0 },
                  ]}
                  onPress={() =>
                    pilihLokasi(
                      h.display_name,
                      parseFloat(h.lat),
                      parseFloat(h.lon),
                    )
                  }
                  activeOpacity={0.6}
                >
                  <Ionicons name="location-outline" size={16} color="#0D9488" />
                  <Text style={styles.hasilText} numberOfLines={2}>
                    {h.display_name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )
        ) : (
          <>
            <TouchableOpacity
              style={styles.gpsButton}
              onPress={handleGunakanGPS}
              activeOpacity={0.8}
            >
              <View style={styles.gpsIconWrapper}>
                <Ionicons name="navigate" size={16} color="#fff" />
              </View>
              <Text style={styles.gpsText}>
                {t("changeLocation.useCurrentGPS")}
              </Text>
              <Ionicons name="chevron-forward" size={18} color="#B0B0B0" />
            </TouchableOpacity>

            <Text style={styles.sectionLabel}>
              {t("changeLocation.savedLocationsSection")}
            </Text>

            {loadingSaved ? (
              [0, 1, 2].map((i) => (
                <View key={i} style={styles.savedRow}>
                  <Skeleton
                    style={{ width: 34, height: 34, borderRadius: 17 }}
                  />
                  <View style={{ flex: 1, gap: 6 }}>
                    <Skeleton style={{ width: "40%", height: 13 }} />
                    <Skeleton style={{ width: "75%", height: 11 }} />
                  </View>
                </View>
              ))
            ) : lokasiTersimpan.length === 0 ? (
              <Text style={styles.emptySavedText}>
                {t("changeLocation.emptySaved")}
              </Text>
            ) : (
              lokasiTersimpan.map((l) => (
                <TouchableOpacity
                  key={l.id}
                  style={styles.savedRow}
                  onPress={() => pilihLokasi(l.label, l.latitude, l.longitude)}
                  activeOpacity={0.8}
                >
                  <View style={styles.savedIconWrapper}>
                    <Ionicons
                      name={l.icon_name as any}
                      size={18}
                      color="#0D9488"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.savedLabel}>{l.label}</Text>
                    <Text style={styles.savedAlamat} numberOfLines={1}>
                      {l.alamat}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => hapusLokasi(l)}
                    hitSlop={10}
                    style={styles.deleteButton}
                  >
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))
            )}

            <TouchableOpacity
              style={styles.addRow}
              onPress={() => router.push("/tambah-lokasi")}
              activeOpacity={0.7}
            >
              <View style={styles.addIconWrapper}>
                <Ionicons name="add" size={18} color="#0D9488" />
              </View>
              <Text style={styles.addText}>
                {t("changeLocation.addNewLocation")}
              </Text>
              <Ionicons name="chevron-forward" size={18} color="#9FD3C9" />
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
    color: "#0D9488",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 13.5,
    color: "#222",
  },
  emptyWrap: {
    alignItems: "center",
    gap: 6,
    marginTop: 40,
  },
  emptyText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 13.5,
    color: "#6B7280",
  },
  emptySubtext: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
  },
  emptySavedText: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 12.5,
    color: "#9CA3AF",
    marginBottom: 14,
  },
  resultPanel: {
    backgroundColor: "#fff",
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  hasilRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F1F1",
  },
  hasilText: {
    flex: 1,
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 13,
    color: "#374151",
    lineHeight: 18,
  },
  gpsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  gpsIconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#0D9488",
    alignItems: "center",
    justifyContent: "center",
  },
  gpsText: {
    flex: 1,
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 13.5,
    color: "#0D9488",
  },
  sectionLabel: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 11.5,
    color: "#9CA3AF",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  savedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  savedLabel: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 13.5,
    color: "#1F2937",
  },
  savedAlamat: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  savedIconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#E1F5EE",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
  },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1.5,
    borderColor: "#CDE9E2",
    borderStyle: "dashed",
    borderRadius: 14,
    backgroundColor: "#F0F9F7",
    padding: 14,
    marginTop: 4,
  },
  addIconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#E1F5EE",
    alignItems: "center",
    justifyContent: "center",
  },
  addText: {
    flex: 1,
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 13,
    color: "#0D9488",
  },
});
