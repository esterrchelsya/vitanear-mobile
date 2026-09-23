import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLanguage } from "../lib/LanguageContext";

const { width } = Dimensions.get("window");

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);

  const slides = [
    {
      key: "1",
      icon: "location" as const,
      title: t("onboarding.slide1.title"),
      description: t("onboarding.slide1.description"),
    },
    {
      key: "2",
      icon: "pulse" as const,
      title: t("onboarding.slide2.title"),
      description: t("onboarding.slide2.description"),
    },
    {
      key: "3",
      icon: "calendar" as const,
      title: t("onboarding.slide3.title"),
      description: t("onboarding.slide3.description"),
    },
  ];

  const isLastSlide = activeIndex === slides.length - 1;

  const finishOnboarding = async () => {
    try {
      await AsyncStorage.setItem("hasSeenOnboarding", "true");
    } catch (e) {
      console.log("Gagal menyimpan status onboarding:", e);
    }
    router.replace("/login");
  };

  const goToNext = () => {
    if (isLastSlide) {
      finishOnboarding();
      return;
    }
    flatListRef.current?.scrollToIndex({ index: activeIndex + 1 });
  };

  const skip = () => finishOnboarding();

  return (
    <View style={styles.container}>
      {/* Lewati disembunyikan di slide terakhir (sudah ada tombol Mulai). Pakai
          opacity, bukan dihapus dari tree, agar tinggi topBar tetap dan layout tidak melompat. */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={skip}
          disabled={isLastSlide}
          hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}
          style={{ opacity: isLastSlide ? 0 : 1 }}
        >
          <Text style={styles.skipText}>{t("onboarding.skip")}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={slides}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false },
        )}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setActiveIndex(index);
        }}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <View style={styles.iconWrapper}>
              <View style={styles.iconRingOuter} />
              <View style={styles.iconRingInner} />
              <View style={styles.iconBadge}>
                <Ionicons name={item.icon} size={56} color="#0D9488" />
              </View>
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
          </View>
        )}
      />

      <View style={styles.dotsContainer}>
        {slides.map((_, i) => {
          const dotWidth = scrollX.interpolate({
            inputRange: [(i - 1) * width, i * width, (i + 1) * width],
            outputRange: [8, 24, 8],
            extrapolate: "clamp",
          });
          const dotOpacity = scrollX.interpolate({
            inputRange: [(i - 1) * width, i * width, (i + 1) * width],
            outputRange: [0.3, 1, 0.3],
            extrapolate: "clamp",
          });
          return (
            <Animated.View
              key={i}
              style={[styles.dot, { width: dotWidth, opacity: dotOpacity }]}
            />
          );
        })}
      </View>

      <TouchableOpacity
        style={[
          styles.ctaButton,
          { marginBottom: Math.max(insets.bottom, 16) + 16 },
        ]}
        onPress={goToNext}
      >
        <Text style={styles.ctaText}>
          {isLastSlide ? t("onboarding.start") : t("onboarding.next")}
        </Text>
        <Ionicons name="arrow-forward" size={18} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6FBF9",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 24, // sama dengan marginHorizontal tombol di bawah
    paddingBottom: 8,
  },
  skipText: {
    fontSize: 15,
    paddingVertical: 8,
    color: "#666",
    fontWeight: "500",
  },
  slide: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  iconWrapper: {
    width: 180,
    height: 180,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
  },
  iconRingOuter: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#0D948814",
  },
  iconRingInner: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#0D948822",
  },
  iconBadge: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#0D948833",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0D9488",
    textAlign: "center",
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#0D9488",
    marginHorizontal: 4,
  },
  ctaButton: {
    flexDirection: "row",
    backgroundColor: "#0D9488",
    marginHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  ctaText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
