import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  RefreshControl,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// TODO: sesuaikan path import berikut dengan project kamu
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/LanguageContext";
import { supabase } from "@/lib/supabase";

// ---------- Tipe data ----------
type StatusReservasi =
  | "menunggu_verifikasi"
  | "disetujui"
  | "ditolak"
  | "menunggu_pembayaran"
  | "dibayar"
  | "nomor_antrean_diberikan"
  | "selesai"
  | "dibatalkan";

type FilterKey = "semua" | "selesai" | "diproses" | "ditolak" | "dibatalkan";

type Reservasi = {
  id: string;
  tanggal_reservasi: string;
  created_at: string;
  status: StatusReservasi;
  metode: "bpjs" | "umum";
  jumlah_bayar: number | null;
  faskes: { nama: string } | null;
  layanan_faskes: { nama_layanan: string } | null;
  anggota_keluarga: { nama: string } | null;
  // relasi 1-1 (unique reservasi_id): bisa objek atau array tergantung PostgREST
  ulasan: { rating: number } | { rating: number }[] | null;
};

type Section = { title: string; data: Reservasi[] };

const FILTERS: FilterKey[] = [
  "semua",
  "selesai",
  "diproses",
  "ditolak",
  "dibatalkan",
];

function toFilterKey(status: StatusReservasi): FilterKey {
  if (status === "selesai") return "selesai";
  if (status === "ditolak") return "ditolak";
  if (status === "dibatalkan") return "dibatalkan";
  return "diproses"; // menunggu_verifikasi, disetujui, menunggu_pembayaran, dibayar, nomor_antrean_diberikan
}

const HARI_ID = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
];
const BULAN_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const HARI_EN = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const BULAN_EN = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function labelTanggal(
  dateStr: string,
  lang: string,
  t: (key: string) => string,
): string {
  const d = new Date(dateStr);
  const now = new Date();
  const kemarin = new Date(now);
  kemarin.setDate(now.getDate() - 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(d, now)) return t("transactions.today");
  if (sameDay(d, kemarin)) return t("transactions.yesterday");

  if (lang === "en") {
    return `${HARI_EN[d.getDay()]}, ${BULAN_EN[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  }
  return `${HARI_ID[d.getDay()]}, ${d.getDate()} ${BULAN_ID[d.getMonth()]} ${d.getFullYear()}`;
}

function formatRupiah(n: number) {
  return `Rp${n.toLocaleString("id-ID")}`;
}

function isAkanDatang(item: Reservasi) {
  if (["selesai", "dibatalkan", "ditolak"].includes(item.status)) return false;
  const hariIni = new Date();
  hariIni.setHours(0, 0, 0, 0);
  return new Date(item.tanggal_reservasi) >= hariIni;
}

// ---------- Komponen ----------
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

function TransaksiCardSkeleton({ isLast }: { isLast: boolean }) {
  return (
    <View style={[styles.row, isLast ? styles.rowLast : styles.rowDivider]}>
      <View style={styles.rowMain}>
        <SkeletonBox style={styles.avatar} />
        <View style={styles.rowMid}>
          <SkeletonBox style={{ height: 14, width: "70%", borderRadius: 4 }} />
          <SkeletonBox
            style={{ height: 11, width: "55%", borderRadius: 4, marginTop: 6 }}
          />
        </View>
        <View style={styles.rowRight}>
          <SkeletonBox style={{ height: 13, width: 56, borderRadius: 4 }} />
          <SkeletonBox
            style={{ height: 11, width: 60, borderRadius: 4, marginTop: 6 }}
          />
        </View>
      </View>
    </View>
  );
}

export default function TransaksiScreen() {
  const { session } = useAuth();
  const { t, language } = useLanguage();
  const userId = session?.user?.id;
  const [data, setData] = useState<Reservasi[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterKey>("semua");

  // Konfigurasi status dinamis menyesuaikan terjemahan
  const STATUS_CONFIG: Record<
    FilterKey,
    {
      label: string;
      bg: string;
      text: string;
      icon: keyof typeof Ionicons.glyphMap;
    }
  > = useMemo(
    () => ({
      semua: {
        label: t("transactions.filterAll"),
        bg: "#0D9488",
        text: "#FFFFFF",
        icon: "apps",
      },
      selesai: {
        label: t("transactions.filterCompleted"),
        bg: "#E7F5F0",
        text: "#3A8F6E",
        icon: "checkmark-circle",
      },
      diproses: {
        label: t("transactions.filterInProcess"),
        bg: "#FBF3E4",
        text: "#A67A3D",
        icon: "time",
      },
      ditolak: {
        label: t("transactions.filterRejected"),
        bg: "#FBEBEA",
        text: "#B86A64",
        icon: "close-circle",
      },
      dibatalkan: {
        label: t("transactions.filterCancelled"),
        bg: "#F1F5F4",
        text: "#8A9490",
        icon: "ban",
      },
    }),
    [t],
  );

  const fetchData = useCallback(async () => {
    if (!userId) return;
    const { data: rows, error } = await supabase
      .from("reservasi")
      .select(
        `id, tanggal_reservasi, created_at, status, metode, jumlah_bayar,
         faskes:faskes_id ( nama ),
         layanan_faskes:layanan_id ( nama_layanan ),
         anggota_keluarga:anggota_keluarga_id ( nama ),
         ulasan ( rating )`,
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!error && rows) setData(rows as unknown as Reservasi[]);
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      fetchData().finally(() => setLoading(false));
    }, [fetchData]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const sections: Section[] = useMemo(() => {
    const filtered =
      filter === "semua"
        ? data
        : data.filter((r) => toFilterKey(r.status) === filter);

    const groups = new Map<string, Reservasi[]>();
    filtered.forEach((item) => {
      const key = labelTanggal(item.tanggal_reservasi, language, t);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(item);
    });

    return Array.from(groups.entries()).map(([title, items]) => ({
      title,
      data: items,
    }));
  }, [data, filter, language, t]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Text style={styles.title}>{t("transactions.title")}</Text>
      <Text style={styles.subtitle}>{t("transactions.subtitle")}</Text>

      {/* Filter chip -- 1 baris, scroll horizontal */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterRow}
      >
        {FILTERS.map((key) => {
          const active = filter === key;
          return (
            <Pressable
              key={key}
              onPress={() => setFilter(key)}
              style={[
                styles.chip,
                active ? styles.chipActive : styles.chipInactive,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: active ? "#FFFFFF" : "#374151" },
                ]}
              >
                {STATUS_CONFIG[key].label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {loading ? (
        <View style={{ paddingHorizontal: 10, marginTop: 16 }}>
          <SkeletonBox
            style={{
              height: 13,
              width: 90,
              borderRadius: 4,
              marginBottom: 10,
              marginLeft: 4,
            }}
          />
          {Array.from({ length: 4 }).map((_, i) => (
            <TransaksiCardSkeleton key={i} isLast={i === 3} />
          ))}
        </View>
      ) : sections.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons
            name={data.length === 0 ? "receipt-outline" : "funnel-outline"}
            size={44}
            color="#A3C9C2"
            style={styles.emptyIcon}
          />
          {data.length === 0 ? (
            <>
              <Text style={styles.emptyTitle}>
                {t("transactions.emptyTitle")}
              </Text>
              <Text style={styles.emptyText}>
                {t("transactions.emptyDescription")}
              </Text>
            </>
          ) : (
            <Text style={styles.emptyText}>
              {t("transactions.emptyFilterPrefix")}
              {STATUS_CONFIG[filter].label}
              {t("transactions.emptyFilterSuffix")}
            </Text>
          )}
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 24, paddingHorizontal: 10 }}
          stickySectionHeadersEnabled={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#0D9488"
            />
          }
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>{section.title}</Text>
            </View>
          )}
          renderItem={({ item, index, section }) => (
            <TransaksiCard
              item={item}
              isLast={index === section.data.length - 1}
              statusConfig={STATUS_CONFIG}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

function TransaksiCard({
  item,
  isLast,
  statusConfig,
}: {
  item: Reservasi;
  isLast: boolean;
  statusConfig: Record<
    FilterKey,
    {
      label: string;
      bg: string;
      text: string;
      icon: keyof typeof Ionicons.glyphMap;
    }
  >;
}) {
  const router = useRouter();
  const { t } = useLanguage();
  const filterKey = toFilterKey(item.status);
  const badge = statusConfig[filterKey];
  const namaPasien =
    item.anggota_keluarga?.nama ?? t("transactions.selfPatient");
  const ulasan = Array.isArray(item.ulasan) ? item.ulasan[0] : item.ulasan;
  const bisaUlas = item.status === "selesai";

  return (
    <TouchableOpacity
      style={[styles.row, isLast ? styles.rowLast : styles.rowDivider]}
      activeOpacity={0.75}
      onPress={() =>
        router.push({ pathname: "/reservasi/[id]", params: { id: item.id } })
      }
    >
      <View style={styles.rowMain}>
        <View style={[styles.avatar, { backgroundColor: badge.bg }]}>
          <Ionicons name="business" size={17} color={badge.text} />
        </View>

        <View style={styles.rowMid}>
          <Text style={styles.rowFaskes} numberOfLines={1}>
            {item.faskes?.nama ?? "-"}
          </Text>
          <Text style={styles.rowSubtitle} numberOfLines={1}>
            {item.layanan_faskes?.nama_layanan ?? "-"} · {namaPasien}
          </Text>
        </View>

        <View style={styles.rowRight}>
          {isAkanDatang(item) && (
            <View style={styles.upcomingBadge}>
              <Text style={styles.upcomingBadgeText}>
                {t("transactions.upcomingBadge")}
              </Text>
            </View>
          )}
          <Text style={styles.rowPrice}>
            {item.metode === "umum" && item.jumlah_bayar
              ? formatRupiah(item.jumlah_bayar)
              : "BPJS"}
          </Text>
          <View style={styles.statusRow}>
            <Ionicons name={badge.icon} size={11} color={badge.text} />
            <Text style={[styles.statusText, { color: badge.text }]}>
              {badge.label}
            </Text>
          </View>
        </View>
      </View>

      {/* Ulasan: hanya untuk kunjungan selesai */}
      {bisaUlas && (
        <View style={styles.reviewRow}>
          {ulasan ? (
            <>
              <Text style={styles.reviewHint}>
                {t("transactions.reviewThanks")}
              </Text>
              <View style={styles.reviewedWrap}>
                <Ionicons name="star" size={13} color="#EAA23B" />
                <Text style={styles.reviewedText}>{ulasan.rating}</Text>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.reviewHint}>
                {t("transactions.reviewPrompt")}
              </Text>
              <TouchableOpacity
                style={styles.reviewButton}
                activeOpacity={0.8}
                onPress={() =>
                  router.push({
                    pathname: "/beri-ulasan",
                    params: { reservasiId: item.id },
                  })
                }
              >
                <Ionicons name="star-outline" size={13} color="#0D9488" />
                <Text style={styles.reviewButtonText}>
                  {t("transactions.giveReviewButton")}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  skeletonBase: { backgroundColor: "#E3ECEA", borderRadius: 8 },
  container: {
    flex: 1,
    backgroundColor: "#F6FBF9",
    paddingHorizontal: 16,
  },
  title: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 22,
    color: "#0D9488",
    marginTop: 12,
  },
  subtitle: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
    marginBottom: 16,
  },
  filterScroll: {
    flexGrow: 0,
    marginBottom: 16,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chipActive: {
    backgroundColor: "#0D9488",
  },
  chipInactive: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  chipText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 12.5,
  },
  sectionHeader: {
    backgroundColor: "#E8F4F1",
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: -1 },
    elevation: 1,
  },
  sectionHeaderText: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 13,
    color: "#0D6459",
  },
  row: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  rowLast: {
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F4",
  },
  rowMain: { flexDirection: "row", alignItems: "center" },
  reviewRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
    paddingLeft: 52,
  },
  reviewHint: {
    flex: 1,
    marginRight: 8,
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 12,
    color: "#6B7280",
  },
  reviewButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#0D9488",
  },
  reviewButtonText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 12,
    color: "#0D9488",
  },
  reviewedWrap: { flexDirection: "row", alignItems: "center", gap: 4 },
  reviewedText: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 12.5,
    color: "#B45309",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  rowMid: { flex: 1 },
  rowFaskes: {
    flexShrink: 1,
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 14,
    color: "#111827",
  },
  upcomingBadge: {
    backgroundColor: "#E0F2FE",
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginBottom: 4,
  },
  upcomingBadgeText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 9.5,
    color: "#0369A1",
  },
  rowSubtitle: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  rowRight: { alignItems: "flex-end", marginLeft: 8 },
  rowPrice: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 13.5,
    color: "#111827",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 4,
  },
  statusText: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 11,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  emptyIcon: { marginBottom: 12 },
  emptyTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 15,
    color: "#374151",
    marginBottom: 6,
  },
  emptyText: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 13,
    color: "#9CA3AF",
    textAlign: "center",
  },
});
