import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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
import { supabase } from "../lib/supabase";

type Kategori = {
  id: string;
  key: string;
  nama: string;
  icon_library: "ionicons" | "material_community";
  icon_name: string;
};

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

function CategoryItemSkeleton() {
  return (
    <View style={styles.categoryItem}>
      <SkeletonBox style={styles.categoryIconWrapper} />
      <SkeletonBox style={{ height: 11, width: 44, borderRadius: 4 }} />
    </View>
  );
}

export default function KategoriLengkapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const [categories, setCategories] = useState<Kategori[]>([]);
  const [loading, setLoading] = useState(true);

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
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from("kategori_faskes")
        .select("id, key, nama, icon_library, icon_name")
        .eq("aktif", true)
        .order("urutan", { ascending: true });
      if (!error && data) setCategories(data as Kategori[]);
      setLoading(false);
    };
    fetchCategories();
  }, []);

  const closeSheet = () => {
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
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/home");
      }
    });
  };

  const bukaHasilKategori = (item: Kategori) => {
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
      router.replace({
        pathname: "/hasil-kategori",
        params: {
          kategoriId: item.id,
          kategoriNama: item.nama,
          iconLib: item.icon_library,
          iconName: item.icon_name,
        },
      });
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        gesture.dy > 6 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) translateY.setValue(gesture.dy);
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > 100 || gesture.vy > 0.8) {
          closeSheet();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: false,
            bounciness: 4,
          }).start();
        }
      },
    }),
  ).current;

  return (
    <Animated.View style={[styles.overlay, { opacity: backdropOpacity }]}>
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        activeOpacity={1}
        onPress={closeSheet}
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
          <Text style={styles.headerTitle}>{t("allCategories.title")}</Text>
          <TouchableOpacity
            onPress={closeSheet}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="close" size={22} color="#666" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.grid}>
            {Array.from({ length: 9 }).map((_, i) => (
              <CategoryItemSkeleton key={i} />
            ))}
          </View>
        ) : (
          <View style={styles.grid}>
            {categories.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.categoryItem}
                activeOpacity={0.8}
                onPress={() => bukaHasilKategori(item)}
              >
                <LinearGradient
                  colors={["#E1F5EE", "#C7EAE0"]}
                  style={styles.categoryIconWrapper}
                >
                  {item.icon_library === "ionicons" ? (
                    <Ionicons
                      name={item.icon_name as any}
                      size={24}
                      color="#0D9488"
                    />
                  ) : (
                    <MaterialCommunityIcons
                      name={item.icon_name as any}
                      size={24}
                      color="#0D9488"
                    />
                  )}
                </LinearGradient>
                <Text style={styles.categoryLabel} numberOfLines={1}>
                  {item.nama}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={styles.tipCard}
          activeOpacity={0.85}
          onPress={() => router.push("/cari")}
        >
          <View style={styles.tipIconWrapper}>
            <Ionicons name="search" size={20} color="#0D9488" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.tipTitle}>{t("allCategories.tipTitle")}</Text>
            <Text style={styles.tipDesc}>{t("allCategories.tipDesc")}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#0D9488" />
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  skeletonBase: { backgroundColor: "#E3ECEA", borderRadius: 8 },
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
    marginBottom: 20,
  },
  headerTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 17,
    color: "#222",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 20,
  },
  categoryItem: { alignItems: "center", gap: 8, width: "30%" },
  categoryIconWrapper: {
    width: 58,
    height: 58,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryLabel: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 12,
    color: "#444",
    textAlign: "center",
  },
  tipCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#F6FBF9",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EEF2F1",
    padding: 14,
    marginTop: 24,
  },
  tipIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#E1F5EE",
    alignItems: "center",
    justifyContent: "center",
  },
  tipTitle: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 13,
    color: "#222",
  },
  tipDesc: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
});
