import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ReactNode, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  LayoutAnimation,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FAQ_DATA, groupFaqByKategori } from "../lib/faqData";
import { useLanguage } from "../lib/LanguageContext";

const WARNA_HEADER = "#1F2937";

type IconName = keyof typeof Ionicons.glyphMap;

const IKON_KATEGORI: { kunci: string[]; ikon: IconName }[] = [
  {
    kunci: ["keamanan", "sandi", "privasi", "security", "password", "privacy"],
    ikon: "lock-closed-outline",
  },
  {
    kunci: [
      "akun",
      "profil",
      "daftar",
      "login",
      "masuk",
      "account",
      "profile",
      "sign up",
    ],
    ikon: "person-circle-outline",
  },
  {
    kunci: [
      "reservasi",
      "booking",
      "antre",
      "janji",
      "jadwal",
      "reservation",
      "schedule",
    ],
    ikon: "calendar-outline",
  },
  {
    kunci: [
      "bayar",
      "transaksi",
      "biaya",
      "tagihan",
      "payment",
      "transaction",
      "billing",
    ],
    ikon: "card-outline",
  },
  {
    kunci: ["bpjs", "asuransi", "insurance"],
    ikon: "shield-checkmark-outline",
  },
  { kunci: ["gejala", "symptom"], ikon: "pulse-outline" },
  {
    kunci: ["faskes", "lokasi", "cari", "facility", "location", "search"],
    ikon: "location-outline",
  },
  { kunci: ["keluarga", "family"], ikon: "people-outline" },
  { kunci: ["ulasan", "rating", "review"], ikon: "star-outline" },
  { kunci: ["notifikasi", "notification"], ikon: "notifications-outline" },
  {
    kunci: ["aplikasi", "teknis", "app", "technical"],
    ikon: "phone-portrait-outline",
  },
];

function ikonKategori(nama: string): IconName {
  const n = nama.toLowerCase();
  return (
    IKON_KATEGORI.find((k) => k.kunci.some((x) => n.includes(x)))?.ikon ??
    "help-circle-outline"
  );
}

function BubbleMuncul({
  delay,
  children,
}: {
  delay: number;
  children: ReactNode;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 350,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [anim, delay]);
  return (
    <Animated.View
      style={{
        alignSelf: "stretch",
        alignItems: "flex-start",
        opacity: anim,
        transform: [
          {
            translateY: anim.interpolate({
              inputRange: [0, 1],
              outputRange: [10, 0],
            }),
          },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
}

export default function PusatBantuanScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();

  // Mengelompokkan FAQ berdasarkan bahasa yang sedang aktif
  const sections = groupFaqByKategori(FAQ_DATA, language as "id" | "en");

  const [openId, setOpenId] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const pos = useRef<Record<string, number>>({}).current;
  const rotations = useRef<Record<string, Animated.Value>>({}).current;

  const getRotation = (id: string) => {
    if (!rotations[id]) rotations[id] = new Animated.Value(0);
    return rotations[id];
  };

  const putar = (id: string, v: number) =>
    Animated.timing(getRotation(id), {
      toValue: v,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

  const fokusKe = (getY: () => number) =>
    setTimeout(
      () =>
        scrollRef.current?.scrollTo({
          y: Math.max(getY() - 12, 0),
          animated: true,
        }),
      300,
    );

  const animasi = () =>
    LayoutAnimation.configureNext(
      LayoutAnimation.create(260, "easeInEaseOut", "opacity"),
    );

  const toggle = (id: string, kat: string) => {
    animasi();
    const isOpening = openId !== id;
    if (openId) putar(openId, 0);
    putar(id, isOpening ? 1 : 0);
    setOpenId(isOpening ? id : null);
    if (isOpening)
      fokusKe(() => (pos[`cat:${kat}`] ?? 0) + (pos[`q:${id}`] ?? 0));
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={22} color={WARNA_HEADER} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("helpCenter.title")}</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.chatRow}>
          <View style={styles.chatAvatar}>
            <Ionicons name="headset" size={18} color="#fff" />
          </View>
          <View style={styles.chatCol}>
            <Text style={styles.chatName}>{t("helpCenter.teamName")}</Text>
            <BubbleMuncul delay={0}>
              <View style={styles.bubble}>
                <Text style={styles.bubbleTitle}>
                  {t("helpCenter.greetingPrefix")}
                  {"\u00A0"}
                  <Text style={styles.bubbleAccent}>
                    {t("helpCenter.greetingAccent")}
                  </Text>
                </Text>
              </View>
            </BubbleMuncul>
            <BubbleMuncul delay={260}>
              <View style={[styles.bubble, styles.bubbleNext]}>
                <Text style={styles.bubbleText}>
                  {t("helpCenter.subtitle")}
                </Text>
              </View>
            </BubbleMuncul>
          </View>
        </View>

        {sections.map((section) => (
          <View
            key={section.kategori}
            style={{ marginBottom: 20 }}
            onLayout={(e) => {
              pos[`cat:${section.kategori}`] = e.nativeEvent.layout.y;
            }}
          >
            <View style={styles.card}>
              <LinearGradient
                colors={["#E1F5EE", "#D3EEE6"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.sectionBand}
              >
                <Ionicons
                  name={ikonKategori(section.kategori)}
                  size={72}
                  color="rgba(13,148,136,0.16)"
                  style={styles.sectionBandIcon}
                />
                <Text style={styles.sectionTitle}>{section.kategori}</Text>
                <Text style={styles.sectionCount}>
                  {section.items.length} {t("helpCenter.questionsSuffix")}
                </Text>
              </LinearGradient>
              {section.items.map((item, idx) => {
                const isOpen = openId === item.id;
                const rotate = getRotation(item.id).interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0deg", "180deg"],
                });

                return (
                  <View
                    key={item.id}
                    style={idx !== section.items.length - 1 && styles.rowBorder}
                    onLayout={(e) => {
                      pos[`q:${item.id}`] = e.nativeEvent.layout.y;
                    }}
                  >
                    <TouchableOpacity
                      style={styles.row}
                      activeOpacity={0.7}
                      onPress={() => toggle(item.id, section.kategori)}
                    >
                      <Text style={styles.rowText}>{item.pertanyaan}</Text>
                      <Animated.View style={{ transform: [{ rotate }] }}>
                        <Ionicons
                          name="chevron-down"
                          size={19}
                          color="#0D9488"
                        />
                      </Animated.View>
                    </TouchableOpacity>

                    {isOpen && (
                      <View style={styles.answerBox}>
                        <View style={styles.accentBar} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.answerText}>{item.jawaban}</Text>

                          {item.langkah?.map((step, i) => (
                            <View key={i} style={styles.stepRow}>
                              <View style={styles.stepNumber}>
                                <Text style={styles.stepNumberText}>
                                  {i + 1}
                                </Text>
                              </View>
                              <Text style={styles.stepText}>{step}</Text>
                            </View>
                          ))}

                          {item.catatan && (
                            <View style={styles.noteBox}>
                              <Ionicons
                                name="information-circle"
                                size={15}
                                color="#B45309"
                              />
                              <Text style={styles.noteText}>
                                {item.catatan}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F6FBF9" },
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
    color: WARNA_HEADER,
  },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  chatRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 24,
  },
  chatAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#0D9488",
    alignItems: "center",
    justifyContent: "center",
  },
  chatCol: { flex: 1 },
  chatName: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 6,
  },
  bubble: {
    maxWidth: "96%",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#EEF2F1",
    borderRadius: 18,
    borderTopLeftRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 11,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  bubbleNext: { marginTop: 6 },
  bubbleTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 16,
    lineHeight: 22,
    color: "#1F2937",
  },
  bubbleAccent: { color: "#0D9488" },
  bubbleText: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 13.5,
    lineHeight: 20,
    color: "#4B5563",
  },
  sectionBand: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    overflow: "hidden",
  },
  sectionBandIcon: { position: "absolute", right: -6, bottom: -14 },
  sectionTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 16,
    color: "#1F2937",
    paddingRight: 64,
  },
  sectionCount: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 12,
    color: "#3A6B62",
    marginTop: 2,
    paddingRight: 64,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#EEF2F1",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    paddingHorizontal: 16,
    gap: 8,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: "#F1F1F1" },
  rowText: {
    flex: 1,
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 14.5,
    color: "#1F2937",
  },
  answerBox: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  accentBar: {
    width: 3,
    borderRadius: 2,
    backgroundColor: "#0D9488",
  },
  answerText: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 13.5,
    color: "#4B5563",
    lineHeight: 20,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginTop: 10,
  },
  stepNumber: {
    width: 19,
    height: 19,
    borderRadius: 9.5,
    backgroundColor: "#0D9488",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  stepNumberText: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 11,
    color: "#fff",
  },
  stepText: {
    flex: 1,
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 13.5,
    color: "#4B5563",
    lineHeight: 20,
  },
  noteBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  noteText: {
    flex: 1,
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 12.5,
    color: "#92400E",
    lineHeight: 18,
  },
});
