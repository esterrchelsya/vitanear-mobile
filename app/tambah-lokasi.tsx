import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
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

export default function TambahLokasiScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { location } = useLocation();

  const iconOptions = [
    { name: "home-outline", labelKey: "addLocation.iconOptions.home" },
    { name: "business-outline", labelKey: "addLocation.iconOptions.office" },
    { name: "medkit-outline", labelKey: "addLocation.iconOptions.clinic" },
    { name: "location-outline", labelKey: "addLocation.iconOptions.other" },
  ];

  const [query, setQuery] = useState("");
  const [hasil, setHasil] = useState<HasilCari[]>([]);
  const [mencari, setMencari] = useState(false);
  const [dipilih, setDipilih] = useState<HasilCari | null>(null);
  const [label, setLabel] = useState("");
  const [icon, setIcon] = useState(iconOptions[3].name);
  const [submitting, setSubmitting] = useState(false);

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

  const handleSimpan = async () => {
    if (!dipilih || !label.trim()) return;
    setSubmitting(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.from("lokasi_tersimpan").insert({
      user_id: user.id,
      label: label.trim(),
      alamat: dipilih.display_name,
      latitude: parseFloat(dipilih.lat),
      longitude: parseFloat(dipilih.lon),
      icon_name: icon,
    });

    setSubmitting(false);
    if (error) {
      Alert.alert(
        t("addLocation.alertFailTitle"),
        t("addLocation.alertFailDesc"),
      );
      return;
    }
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color="#0D9488" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("addLocation.headerTitle")}</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {!dipilih ? (
          <>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color="#9CA3AF" />
              <TextInput
                style={styles.searchInput}
                placeholder={t("addLocation.searchPlaceholder")}
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

            {mencari ? (
              <View style={styles.resultCard}>
                {[0, 1, 2, 3].map((i) => (
                  <View
                    key={i}
                    style={[
                      styles.hasilRow,
                      i === 3 && { borderBottomWidth: 0 },
                    ]}
                  >
                    <Skeleton
                      style={{ width: 16, height: 16, borderRadius: 8 }}
                    />
                    <Skeleton style={{ flex: 1, height: 14 }} />
                  </View>
                ))}
              </View>
            ) : query.trim().length >= 2 && hasil.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Ionicons name="location-outline" size={28} color="#C9D6D2" />
                <Text style={styles.emptyText}>
                  {t("addLocation.emptySearchTitle")}
                </Text>
                <Text style={styles.emptySubtext}>
                  {t("addLocation.emptySearchSubtext")}
                </Text>
              </View>
            ) : hasil.length > 0 ? (
              <View style={styles.resultCard}>
                {hasil.map((h, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.hasilRow,
                      idx === hasil.length - 1 && { borderBottomWidth: 0 },
                    ]}
                    onPress={() => setDipilih(h)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="location-outline"
                      size={16}
                      color="#0D9488"
                    />
                    <Text style={styles.hasilText} numberOfLines={2}>
                      {h.display_name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
          </>
        ) : (
          <>
            <View style={styles.alamatCard}>
              <Ionicons name="location" size={16} color="#0D9488" />
              <Text style={styles.alamatText} numberOfLines={2}>
                {dipilih.display_name}
              </Text>
              <TouchableOpacity onPress={() => setDipilih(null)}>
                <Text style={styles.gantiText}>{t("addLocation.change")}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionLabel}>
              {t("addLocation.locationNameLabel")}
            </Text>
            <TextInput
              style={styles.input}
              placeholder={t("addLocation.locationNamePlaceholder")}
              placeholderTextColor="#A0A0A0"
              value={label}
              onChangeText={setLabel}
            />

            <Text style={[styles.sectionLabel, { marginTop: 18 }]}>
              {t("addLocation.iconLabel")}
            </Text>
            <View style={styles.iconRow}>
              {iconOptions.map((opt) => {
                const active = icon === opt.name;
                return (
                  <TouchableOpacity
                    key={opt.name}
                    style={[
                      styles.iconOption,
                      active && styles.iconOptionActive,
                    ]}
                    onPress={() => setIcon(opt.name)}
                  >
                    <Ionicons
                      name={opt.name as any}
                      size={20}
                      color={active ? "#fff" : "#0D9488"}
                    />
                    <Text
                      style={[
                        styles.iconOptionText,
                        active && { color: "#fff" },
                      ]}
                    >
                      {t(opt.labelKey)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={[
                styles.saveButton,
                !label.trim() && styles.saveButtonDisabled,
              ]}
              onPress={handleSimpan}
              disabled={!label.trim() || submitting}
            >
              <Text style={styles.saveButtonText}>
                {submitting
                  ? t("addLocation.savingButton")
                  : t("addLocation.saveButton")}
              </Text>
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
    marginBottom: 14,
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
  resultCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 14,
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
  alamatCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#E1F5EE",
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  alamatText: {
    flex: 1,
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 12.5,
    color: "#0D9488",
  },
  gantiText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 12,
    color: "#0D9488",
  },
  sectionLabel: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 13,
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    fontFamily: "PlusJakartaSans_400Regular",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EEF2F1",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#222",
  },
  iconRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  iconOption: {
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "#0D9488",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  iconOptionActive: { backgroundColor: "#0D9488" },
  iconOptionText: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 11,
    color: "#0D9488",
  },
  saveButton: {
    backgroundColor: "#0D9488",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 24,
  },
  saveButtonDisabled: { backgroundColor: "#B0D4D0" },
  saveButtonText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: "#fff",
    fontSize: 15,
  },
});
