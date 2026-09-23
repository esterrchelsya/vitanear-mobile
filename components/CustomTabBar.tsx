import { Ionicons } from "@expo/vector-icons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Easing,
  LayoutAnimation,
  LayoutChangeEvent,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLanguage } from "../lib/LanguageContext";

type IconName = keyof typeof Ionicons.glyphMap;

type TabConfigEntry = { label: string; icon: IconName; activeIcon: IconName };

const CHIP_HEIGHT = 42;
const LABEL_MAX_WIDTH = 82; // cukup lebar untuk "Transaksi"/"Transactions", label tetap di-clip rapi

export function useTabBarSpace() {
  const insets = useSafeAreaInsets();
  return Math.max(insets.bottom, 16) + CHIP_HEIGHT + 12;
}

type TabLayout = { x: number; width: number };

function TabItem({
  index,
  isFocused,
  config,
  onPress,
  onItemLayout,
}: {
  index: number;
  isFocused: boolean;
  config: TabConfigEntry;
  onPress: () => void;
  onItemLayout: (index: number, layout: TabLayout) => void;
}) {
  const progress = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  useEffect(() => {
    // Satu Animated.Value ini yang menggerakkan SEMUA aspek transisi label
    // (opacity, geser, skala, DAN lebar) -> semuanya pasti sinkron sempurna,
    // tidak ada lagi sistem animasi lain (LayoutAnimation) yang bentrok.
    Animated.timing(progress, {
      toValue: isFocused ? 1 : 0,
      duration: 280,
      easing: Easing.bezier(0.4, 0.0, 0.2, 1),
      useNativeDriver: false, // width tidak didukung native driver
    }).start();
  }, [isFocused, progress]);

  const labelTranslateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [14, 0],
  });
  const labelScale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.85, 1],
  });
  const labelMaxWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, LABEL_MAX_WIDTH],
  });
  const labelMarginLeft = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 6],
  });

  const handleLayout = (e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout;
    onItemLayout(index, { x, width });
  };

  return (
    <TouchableOpacity
      style={styles.tabColumn}
      onPress={onPress}
      activeOpacity={0.7}
      onLayout={handleLayout}
    >
      <View style={styles.chip}>
        <Ionicons
          name={isFocused ? config.activeIcon : config.icon}
          size={20}
          color={isFocused ? "#0D9488" : "#8E8E93"}
        />
        {/* Selalu ter-render (tidak mount/unmount) supaya animasi progress
            tidak pernah "reset" mendadak -> transisi keluar-masuk tetap mulus. */}
        <Animated.View
          style={{
            overflow: "hidden",
            maxWidth: labelMaxWidth,
            marginLeft: labelMarginLeft,
            opacity: progress,
            transform: [{ translateX: labelTranslateX }, { scale: labelScale }],
          }}
        >
          <Animated.Text
            style={[styles.label, styles.labelActive]}
            numberOfLines={1}
          >
            {config.label}
          </Animated.Text>
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
}

export default function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();

  // Dibuat ulang setiap kali `t` berubah (yaitu setiap kali bahasa di-switch),
  // supaya label tab ikut berubah tanpa perlu restart app.
  const TAB_CONFIG: Record<string, TabConfigEntry> = useMemo(
    () => ({
      home: { label: t("tabs.home"), icon: "home-outline", activeIcon: "home" },
      cari: {
        label: t("tabs.search"),
        icon: "search-outline",
        activeIcon: "search",
      },
      transaksi: {
        label: t("tabs.transactions"),
        icon: "receipt-outline",
        activeIcon: "receipt",
      },
      profil: {
        label: t("tabs.profile"),
        icon: "person-outline",
        activeIcon: "person",
      },
    }),
    [t],
  );

  const tabLayouts = useRef<Record<number, TabLayout>>({}).current;
  const lastPillTarget = useRef<TabLayout | null>(null);
  const hasPositionedPill = useRef(false);
  const settleTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>(
    {},
  ).current;

  const pillX = useRef(new Animated.Value(0)).current;
  const pillWidth = useRef(new Animated.Value(0)).current;

  const movePill = useCallback(
    (layout: TabLayout, animated: boolean) => {
      if (!animated) {
        pillX.setValue(layout.x);
        pillWidth.setValue(layout.width);
        return;
      }
      Animated.parallel([
        Animated.spring(pillX, {
          toValue: layout.x,
          damping: 18,
          stiffness: 150,
          mass: 0.7,
          useNativeDriver: false,
        }),
        Animated.spring(pillWidth, {
          toValue: layout.width,
          damping: 18,
          stiffness: 150,
          mass: 0.7,
          useNativeDriver: false,
        }),
      ]).start();
    },
    [pillX, pillWidth],
  );

  const handleItemLayout = useCallback(
    (index: number, layout: TabLayout) => {
      tabLayouts[index] = layout;
      if (index !== state.index) return;

      // Debounce: selama chip masih dalam proses melebar/mengecil, onLayout
      // akan terus menembak berkali-kali. Kita tunda commit posisi pill
      // sampai ukurannya benar-benar berhenti berubah (settle) -> pill
      // hanya meluncur SEKALI ke tujuan akhir, tidak retarget di tengah jalan.
      if (settleTimers[index]) clearTimeout(settleTimers[index]);
      settleTimers[index] = setTimeout(() => {
        const prev = lastPillTarget.current;
        const changed =
          !prev ||
          Math.abs(prev.x - layout.x) > 0.5 ||
          Math.abs(prev.width - layout.width) > 0.5;

        if (changed) {
          lastPillTarget.current = layout;
          movePill(layout, hasPositionedPill.current);
          hasPositionedPill.current = true;
        }
      }, 40);
    },
    [state.index, movePill, tabLayouts, settleTimers],
  );

  return (
    <View
      style={[styles.wrapper, { bottom: Math.max(insets.bottom, 16) }]}
      pointerEvents="box-none"
    >
      <View style={styles.cardContainer}>
        <View style={styles.bar}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.pill,
              { transform: [{ translateX: pillX }], width: pillWidth },
            ]}
          />

          {state.routes.map((route, index) => {
            const isFocused = state.index === index;
            const config = TAB_CONFIG[route.name] ?? {
              label: route.name,
              icon: "ellipse-outline" as IconName,
              activeIcon: "ellipse" as IconName,
            };

            const onPress = () => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                // Ini HANYA menghaluskan pergeseran posisi tab tetangga akibat
                // reflow "space-between" -> tidak bentrok dengan animasi chip
                // aktif (itu sepenuhnya dikendalikan `progress` di TabItem)
                // ataupun pill (posisinya absolute, tidak kena LayoutAnimation).
                LayoutAnimation.configureNext(
                  LayoutAnimation.create(280, "easeInEaseOut", "opacity"),
                );
                navigation.navigate(route.name);
              }
            };

            return (
              <TabItem
                key={route.key}
                index={index}
                isFocused={isFocused}
                config={config}
                onPress={onPress}
                onItemLayout={handleItemLayout}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 20,
    right: 20,
    borderRadius: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  cardContainer: {
    borderRadius: 32,
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.96)",
  },
  bar: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 6,
    justifyContent: "space-between",
    alignItems: "center",
  },
  pill: {
    position: "absolute",
    top: 6,
    left: 0,
    height: CHIP_HEIGHT,
    borderRadius: 24,
    backgroundColor: "rgba(13, 148, 136, 0.12)",
  },
  tabColumn: {
    alignItems: "center",
    justifyContent: "center",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    height: CHIP_HEIGHT,
  },
  label: {
    fontSize: 13,
  },
  labelActive: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: "#0D9488",
  },
});
