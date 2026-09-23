import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLanguage } from "../lib/LanguageContext";
import { useSearchFilters } from "../lib/SearchFilterContext";
import { supabase } from "../lib/supabase";

type Kategori = { id: string; key: string; nama: string };

export default function FilterPencarianScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { filters, setFilters } = useSearchFilters();

  const [poliList, setPoliList] = useState<Kategori[]>([]);
  const [selectedPoli, setSelectedPoli] = useState<string[]>(filters.poliKeys);
  const [jarak, setJarak] = useState(filters.jarakMaksimal);
  const [rating, setRating] = useState(filters.ratingMinimum);
  const [bukaSekarang, setBukaSekarang] = useState(filters.bukaSekarang);
  const [buka24Jam, setBuka24Jam] = useState(filters.buka24Jam);
  const [menerimaBpjs, setMenerimaBpjs] = useState(filters.menerimaBpjs);

  const translateY = useRef(new Animated.Value(600)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 280,
        useNativeDriver: false,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 280,
        useNativeDriver: false,
      }),
    ]).start();

    supabase
      .from("kategori_faskes")
      .select("id, key, nama")
      .eq("aktif", true)
      .order("urutan")
      .then(({ data }) => {
        if (data) setPoliList(data as Kategori[]);
      });
  }, []);

  const closeSheet = (after?: () => void) => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 600,
        duration: 220,
        useNativeDriver: false,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: false,
      }),
    ]).start(() => {
      after?.();
      if (router.canGoBack()) router.back();
      else router.replace("/hasil-pencarian");
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) translateY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 100 || g.vy > 0.8) closeSheet();
        else
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: false,
            bounciness: 4,
          }).start();
      },
    }),
  ).current;

  const togglePoli = (key: string) => {
    setSelectedPoli((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const handleReset = () => {
    setSelectedPoli([]);
    setJarak(20);
    setRating(0);
    setBukaSekarang(false);
    setBuka24Jam(false);
    setMenerimaBpjs(false);
  };

  const handleTerapkan = () => {
    closeSheet(() =>
      setFilters({
        poliKeys: selectedPoli,
        jarakMaksimal: jarak,
        ratingMinimum: rating,
        bukaSekarang,
        buka24Jam,
        menerimaBpjs,
      }),
    );
  };

  return (
    <Animated.View style={[styles.overlay, { opacity: backdropOpacity }]}>
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        activeOpacity={1}
        onPress={() => closeSheet()}
      />

      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.sheet,
          {
            paddingBottom: Math.max(insets.bottom, 20),
            transform: [{ translateY }],
          },
        ]}
      >
        <View style={styles.handle} />

        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => closeSheet()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="close" size={22} color="#666" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("searchFilter.title")}</Text>
          <TouchableOpacity onPress={handleReset}>
            <Text style={styles.resetText}>{t("searchFilter.reset")}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>
          {t("searchFilter.specialtyPoly")}
        </Text>
        <View style={styles.chipWrap}>
          {poliList.map((p) => {
            const active = selectedPoli.includes(p.id);
            return (
              <TouchableOpacity
                key={p.id}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => togglePoli(p.id)}
              >
                <Text
                  style={[styles.chipText, active && styles.chipTextActive]}
                >
                  {p.nama}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.sliderHeader}>
          <Text style={styles.sectionTitle}>
            {t("searchFilter.maxDistance")}
          </Text>
          <Text style={styles.sliderValue}>{jarak} km</Text>
        </View>
        <Slider
          minimumValue={1}
          maximumValue={20}
          step={1}
          value={jarak}
          onValueChange={setJarak}
          minimumTrackTintColor="#0D9488"
          maximumTrackTintColor="#E0E0E0"
          thumbTintColor="#0D9488"
        />
        <View style={styles.sliderLabelRow}>
          <Text style={styles.sliderLabelMuted}>1 km</Text>
          <Text style={styles.sliderLabelMuted}>20 km</Text>
        </View>

        <View style={[styles.sliderHeader, { marginTop: 20 }]}>
          <Text style={styles.sectionTitle}>{t("searchFilter.minRating")}</Text>
          <Text style={styles.sliderValue}>{rating.toFixed(1)}+</Text>
        </View>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((n) => (
            <TouchableOpacity key={n} onPress={() => setRating(n)}>
              <Ionicons
                name={n <= rating ? "star" : "star-outline"}
                size={26}
                color="#EAA23B"
              />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
          {t("searchFilter.availability")}
        </Text>
        <View style={styles.chipWrap}>
          <TouchableOpacity
            style={[styles.chip, bukaSekarang && styles.chipActive]}
            onPress={() => setBukaSekarang(!bukaSekarang)}
          >
            <Ionicons
              name="time-outline"
              size={14}
              color={bukaSekarang ? "#fff" : "#555"}
            />
            <Text
              style={[styles.chipText, bukaSekarang && styles.chipTextActive]}
            >
              {t("searchFilter.openNow")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.chip, buka24Jam && styles.chipActive]}
            onPress={() => setBuka24Jam(!buka24Jam)}
          >
            <Ionicons
              name="moon-outline"
              size={14}
              color={buka24Jam ? "#fff" : "#555"}
            />
            <Text style={[styles.chipText, buka24Jam && styles.chipTextActive]}>
              {t("searchFilter.open24Hours")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.chip, menerimaBpjs && styles.chipActive]}
            onPress={() => setMenerimaBpjs(!menerimaBpjs)}
          >
            <Ionicons
              name="card-outline"
              size={14}
              color={menerimaBpjs ? "#fff" : "#555"}
            />
            <Text
              style={[styles.chipText, menerimaBpjs && styles.chipTextActive]}
            >
              {t("searchFilter.acceptsBpjs")}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.applyButton} onPress={handleTerapkan}>
          <Text style={styles.applyButtonText}>
            {t("searchFilter.applyFilter")}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: "88%",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E0E0E0",
    alignSelf: "center",
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  headerTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 16,
    color: "#222",
  },
  resetText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 13,
    color: "#0D9488",
  },
  sectionTitle: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 14,
    color: "#222",
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
    marginBottom: 4,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipActive: { backgroundColor: "#0D9488", borderColor: "#0D9488" },
  chipText: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 12,
    color: "#555",
  },
  chipTextActive: { color: "#fff" },
  sliderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
  },
  sliderValue: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 13,
    color: "#0D9488",
  },
  sliderLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: -6,
  },
  sliderLabelMuted: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 11,
    color: "#999",
  },
  starsRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  applyButton: {
    backgroundColor: "#0D9488",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 24,
  },
  applyButtonText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: "#fff",
    fontSize: 15,
  },
});
