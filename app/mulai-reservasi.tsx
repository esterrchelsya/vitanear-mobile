import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useFocusEffect } from "expo-router/react-navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  BackHandler,
  Dimensions,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLanguage } from "../lib/LanguageContext";
import { supabase } from "../lib/supabase";

type Pasien = { id: string | null; nama: string; label: string };
type Step = "pasien" | "metode";

function hitungUsia(tgl: string | null) {
  if (!tgl) return null;
  return Math.floor(
    (Date.now() - new Date(tgl).getTime()) / (365.25 * 24 * 60 * 60 * 1000),
  );
}

export default function MulaiReservasiSheet() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const params = useLocalSearchParams<{
    faskesId: string;
    faskesNama: string;
    layananId: string;
    layananNama: string;
    menerimaBpjs?: string;
  }>();

  const [step, setStep] = useState<Step>("pasien");
  const [pasienList, setPasienList] = useState<Pasien[]>([]);
  const [selected, setSelected] = useState<string | null>("diri-sendiri");
  const [loading, setLoading] = useState(true);

  const { height: SCREEN_HEIGHT } = Dimensions.get("window");
  const SHEET_HEIGHT = SCREEN_HEIGHT - insets.top - 24;
  const EXPANDED_Y = 0;
  const PEEK_Y = SHEET_HEIGHT * 0.42;
  const DISMISS_Y = SHEET_HEIGHT;

  const translateY = useRef(new Animated.Value(DISMISS_Y)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const restY = useRef(PEEK_Y);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: PEEK_Y,
        duration: 280,
        useNativeDriver: false,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 280,
        useNativeDriver: false,
      }),
    ]).start();
  }, []);

  const closeSheet = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: DISMISS_Y,
        duration: 220,
        useNativeDriver: false,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: false,
      }),
    ]).start(() => {
      if (router.canGoBack()) router.back();
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dy) > 6 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
      onPanResponderMove: (_, gesture) => {
        const next = restY.current + gesture.dy;
        translateY.setValue(Math.max(EXPANDED_Y, next));
      },
      onPanResponderRelease: (_, gesture) => {
        const posSekarang = Math.max(EXPANDED_Y, restY.current + gesture.dy);

        if (posSekarang > PEEK_Y + 100 || gesture.vy > 0.9) {
          closeSheet();
          return;
        }

        const tengah = PEEK_Y / 2;
        let target: number;
        if (gesture.vy < -0.5) target = EXPANDED_Y;
        else if (gesture.vy > 0.5) target = PEEK_Y;
        else target = posSekarang < tengah ? EXPANDED_Y : PEEK_Y;

        restY.current = target;
        Animated.spring(translateY, {
          toValue: target,
          useNativeDriver: false,
          bounciness: 4,
        }).start();
      },
    }),
  ).current;

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (step === "metode") {
        setStep("pasien");
      } else {
        closeSheet();
      }
      return true;
    });
    return () => sub.remove();
  }, [step]);

  const loadPasien = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("nama")
      .eq("id", user.id)
      .maybeSingle();
    const { data: anggota } = await supabase
      .from("anggota_keluarga")
      .select("id, nama, hubungan, tanggal_lahir")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(8);

    setPasienList([
      {
        id: null,
        nama: profile?.nama || t("startReservation.defaultSelf"),
        label: t("startReservation.defaultSelf"),
      },
      ...(anggota || []).map((a) => {
        const usia = hitungUsia(a.tanggal_lahir);
        return {
          id: a.id,
          nama: a.nama,
          label: `${a.hubungan}${usia !== null ? `, ${usia}${t("startReservation.yearsOldSuffix")}` : ""}`,
        };
      }),
    ]);
    setLoading(false);
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      loadPasien();
    }, [loadPasien]),
  );

  const pasienTerpilih = pasienList.find(
    (p) => (p.id ?? "diri-sendiri") === selected,
  );
  const bisaBpjs = params.menerimaBpjs === "true";

  const pilihMandiri = () => {
    router.replace({
      pathname: "/pilih-jadwal",
      params: {
        faskesId: params.faskesId,
        faskesNama: params.faskesNama,
        layananId: params.layananId,
        layananNama: params.layananNama,
        anggotaKeluargaId: pasienTerpilih?.id ?? "",
        pasienNama: pasienTerpilih?.nama ?? "",
      },
    });
  };

  const pilihBpjs = () => {
    router.replace({
      pathname: "/reservasi-bpjs",
      params: {
        faskesId: params.faskesId,
        faskesNama: params.faskesNama,
        layananId: params.layananId,
        layananNama: params.layananNama,
        anggotaKeluargaId: pasienTerpilih?.id ?? "",
        pasienNama: pasienTerpilih?.nama ?? "",
      },
    });
  };

  return (
    <Animated.View style={[styles.overlay, { opacity: backdropOpacity }]}>
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        activeOpacity={1}
        onPress={closeSheet}
      />

      <Animated.View
        style={[
          styles.sheet,
          { height: SHEET_HEIGHT, transform: [{ translateY }] },
        ]}
      >
        <View {...panResponder.panHandlers} style={styles.dragZone}>
          <View style={styles.handle} />
        </View>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={[
            styles.body,
            {
              paddingBottom:
                step === "pasien"
                  ? Math.max(insets.bottom, 16) + 90
                  : Math.max(insets.bottom, 20),
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {step === "pasien" ? (
            <>
              <Text style={styles.title}>
                {t("startReservation.titlePatient")}
              </Text>
              <Text style={styles.subtitle}>
                {params.layananNama} · {params.faskesNama}
              </Text>

              {loading ? (
                <ActivityIndicator
                  color="#0D9488"
                  style={{ marginVertical: 30 }}
                />
              ) : (
                <View style={{ gap: 10, marginTop: 16 }}>
                  {pasienList.map((p) => {
                    const key = p.id ?? "diri-sendiri";
                    const active = selected === key;
                    const initial =
                      p.nama?.trim()?.charAt(0)?.toUpperCase() || "?";
                    return (
                      <TouchableOpacity
                        key={key}
                        style={[
                          styles.pasienCard,
                          active && styles.pasienCardActive,
                        ]}
                        onPress={() => setSelected(key)}
                        activeOpacity={0.8}
                      >
                        <View
                          style={[styles.avatar, active && styles.avatarActive]}
                        >
                          <Text
                            style={[
                              styles.avatarInitial,
                              active && styles.avatarInitialActive,
                            ]}
                          >
                            {initial}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.nama}>{p.nama}</Text>
                          <Text style={styles.label}>{p.label}</Text>
                        </View>
                        <Ionicons
                          name={active ? "checkmark-circle" : "ellipse-outline"}
                          size={21}
                          color={active ? "#0D9488" : "#D0D0D0"}
                        />
                      </TouchableOpacity>
                    );
                  })}
                  <TouchableOpacity
                    style={styles.addCard}
                    onPress={() => router.push("/tambah-anggota")}
                    activeOpacity={0.7}
                  >
                    <View style={styles.addIconWrapper}>
                      <Ionicons name="add" size={18} color="#0D9488" />
                    </View>
                    <Text style={styles.addText}>
                      {t("startReservation.addNewMember")}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          ) : (
            <>
              <View style={styles.stepHeader}>
                <TouchableOpacity onPress={() => setStep("pasien")} hitSlop={8}>
                  <Ionicons name="arrow-back" size={20} color="#0D9488" />
                </TouchableOpacity>
                <Text style={styles.title}>
                  {t("startReservation.titleMethod")}
                </Text>
                <View style={{ width: 20 }} />
              </View>
              <Text style={styles.subtitle}>
                {t("startReservation.patientForPrefix")}
                {pasienTerpilih?.nama}
              </Text>

              <View style={{ gap: 12, marginTop: 16 }}>
                <TouchableOpacity
                  style={[styles.optionCard, styles.optionCardUmum]}
                  onPress={pilihMandiri}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.optionIconWrapper,
                      { backgroundColor: "#E1F5EE" },
                    ]}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={22}
                      color="#0D9488"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.optionTitle}>
                      {t("startReservation.selfBookingTitle")}
                    </Text>
                    <Text style={styles.optionDesc}>
                      {t("startReservation.selfBookingDesc")}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.optionAction,
                      { backgroundColor: "#E1F5EE" },
                    ]}
                  >
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color="#0D9488"
                    />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.optionCard,
                    bisaBpjs
                      ? styles.optionCardBpjs
                      : styles.optionCardDisabled,
                  ]}
                  onPress={pilihBpjs}
                  activeOpacity={0.8}
                  disabled={!bisaBpjs}
                >
                  <View
                    style={[
                      styles.optionIconWrapper,
                      {
                        backgroundColor: bisaBpjs ? "#E3EEFC" : "#ECEFF1",
                      },
                    ]}
                  >
                    <Ionicons
                      name={
                        bisaBpjs
                          ? "shield-checkmark-outline"
                          : "shield-outline"
                      }
                      size={22}
                      color={bisaBpjs ? "#2563EB" : "#9CA3AF"}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.optionTitle,
                        !bisaBpjs && { color: "#9CA3AF" },
                      ]}
                    >
                      {t("startReservation.bpjsBookingTitle")}
                    </Text>
                    <Text
                      style={[
                        styles.optionDesc,
                        !bisaBpjs && { color: "#A8AFB8" },
                      ]}
                    >
                      {bisaBpjs
                        ? t("startReservation.bpjsBookingDescActive")
                        : t("startReservation.bpjsBookingDescInactive")}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.optionAction,
                      {
                        backgroundColor: bisaBpjs ? "#E3EEFC" : "#ECEFF1",
                      },
                    ]}
                  >
                    <Ionicons
                      name={bisaBpjs ? "chevron-forward" : "lock-closed"}
                      size={bisaBpjs ? 16 : 14}
                      color={bisaBpjs ? "#2563EB" : "#9CA3AF"}
                    />
                  </View>
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      </Animated.View>

      {step === "pasien" && (
        <View
          style={[
            styles.floatingFooter,
            { paddingBottom: Math.max(insets.bottom, 16) },
          ]}
        >
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setStep("metode")}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>
              {t("startReservation.continueButton")}
            </Text>
          </TouchableOpacity>
        </View>
      )}
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
    backgroundColor: "#F6FBF9",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
  },
  dragZone: { paddingTop: 10, paddingBottom: 6 },
  scrollArea: { flex: 1 },
  body: { paddingHorizontal: 20 },
  floatingFooter: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 14,
    backgroundColor: "#F6FBF9",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderTopColor: "#EEF2F1",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E0E0E0",
    alignSelf: "center",
  },
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 16,
    color: "#1F2937",
    textAlign: "center",
    flex: 1,
  },
  subtitle: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 12.5,
    color: "#6B7280",
    marginTop: 4,
    textAlign: "center",
  },
  pasienCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "#F1F5F4",
    shadowColor: "#0D9488",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  pasienCardActive: {
    borderColor: "#0D9488",
    backgroundColor: "#F0F9F7",
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 3,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#E1F5EE",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarActive: { backgroundColor: "#0D9488" },
  avatarInitial: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 16,
    color: "#0D9488",
  },
  avatarInitialActive: { color: "#fff" },
  nama: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 14,
    color: "#1F2937",
  },
  label: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  addCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1.5,
    borderColor: "#CDE9E2",
    borderStyle: "dashed",
    borderRadius: 16,
    padding: 14,
  },
  addIconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#E1F5EE",
    alignItems: "center",
    justifyContent: "center",
  },
  addText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 13.5,
    color: "#0D9488",
  },
  primaryButton: {
    backgroundColor: "#0D9488",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryButtonText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: "#fff",
    fontSize: 15,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  optionCardUmum: {
    borderColor: "#CDE9E2",
  },
  optionCardBpjs: {
    borderColor: "#CFE0FA",
  },
  optionCardDisabled: {
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
    backgroundColor: "#F9FAFB",
    shadowOpacity: 0,
    elevation: 0,
  },
  optionIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  optionAction: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  optionTitle: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 14.5,
    color: "#1F2937",
  },
  optionDesc: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 12.5,
    color: "#6B7280",
    marginTop: 2,
  },
});