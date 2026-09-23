import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useLanguage } from "../lib/LanguageContext";
import { supabase } from "../lib/supabase";

// PENTING: value di sini SAMA PERSIS dengan value di HUBUNGAN_OPTIONS pada
// tambah-anggota.tsx dan dengan yang sudah tersimpan di kolom `hubungan` di DB.
// Kalau item.hubungan bukan salah satu dari ini (misal data lama/manual), akan
// ditampilkan apa adanya (fallback), bukan error.
const HUBUNGAN_LABEL_KEY: Record<string, string> = {
  Suami: "familyMembers.relationHusband",
  Istri: "familyMembers.relationWife",
  Anak: "familyMembers.relationChild",
  "Orang Tua": "familyMembers.relationParent",
  Lainnya: "familyMembers.relationOther",
};

const MAX_ANGGOTA = 8;

// Judul & panah kembali memakai netral gelap (kontras lebih baik dari teal);
// teal dipakai untuk aksi. Ganti nilai ini untuk mengubah warna header halaman ini.
const WARNA_HEADER = "#1F2937";

type Anggota = {
  id: string;
  nama: string;
  hubungan: string;
  tanggal_lahir: string | null;
};

// Bayi < 1 tahun ditampilkan dalam bulan (bukan "0 thn").
function labelUsia(
  tgl: string | null,
  monthSuffix: string,
  yearSuffix: string,
) {
  if (!tgl) return null;
  const lahir = new Date(tgl);
  const now = new Date();
  let bulan =
    (now.getFullYear() - lahir.getFullYear()) * 12 +
    (now.getMonth() - lahir.getMonth());
  if (now.getDate() < lahir.getDate()) bulan -= 1;
  if (bulan < 0) return null;
  return bulan < 12
    ? `${bulan} ${monthSuffix}`
    : `${Math.floor(bulan / 12)} ${yearSuffix}`;
}

export default function AnggotaKeluargaScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const [list, setList] = useState<Anggota[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("anggota_keluarga")
      .select("id, nama, hubungan, tanggal_lahir")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    if (data) setList(data as Anggota[]);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  const handleDelete = (item: Anggota) => {
    Alert.alert(
      t("familyMembers.deleteTitle"),
      `${t("familyMembers.deleteConfirmPrefix")}${item.nama}${t("familyMembers.deleteConfirmSuffix")}`,
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("familyMembers.deleteButton"),
          style: "destructive",
          onPress: async () => {
            await supabase.from("anggota_keluarga").delete().eq("id", item.id);
            fetchData();
          },
        },
      ],
    );
  };

  const sudahPenuh = list.length >= MAX_ANGGOTA;

  const handleTambah = () => {
    if (sudahPenuh) {
      Alert.alert(
        t("familyMembers.limitTitle"),
        `${t("familyMembers.limitMessagePrefix")}${MAX_ANGGOTA}${t("familyMembers.limitMessageSuffix")}`,
      );
      return;
    }
    router.push("/tambah-anggota");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={22} color={WARNA_HEADER} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("familyMembers.title")}</Text>
        <View style={{ width: 22 }} />
      </View>

      {loading ? (
        <ActivityIndicator color="#0D9488" style={{ marginTop: 40 }} />
      ) : (
        <>
          <ScrollView
            contentContainerStyle={[
              styles.listContent,
              list.length === 0 && styles.listContentEmpty,
            ]}
            showsVerticalScrollIndicator={false}
          >
            {list.length === 0 ? (
              <View style={styles.emptyState}>
                <LinearGradient
                  colors={["#E1F5EE", "#C7EAE0"]}
                  style={styles.emptyIconCircle}
                >
                  <Ionicons name="people-outline" size={38} color="#0D9488" />
                </LinearGradient>
                <Text style={styles.emptyTitle}>
                  {t("familyMembers.emptyTitle")}
                </Text>
                <Text style={styles.emptyText}>
                  {t("familyMembers.emptyText")}
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.counterRow}>
                  <Text style={styles.counterText}>
                    {list.length} {t("familyMembers.counterOf")} {MAX_ANGGOTA}{" "}
                    {t("familyMembers.counterMembers")}
                  </Text>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${(list.length / MAX_ANGGOTA) * 100}%` },
                      ]}
                    />
                  </View>
                </View>
                {list.map((item) => {
                  const usia = labelUsia(
                    item.tanggal_lahir,
                    t("familyMembers.ageMonthsSuffix"),
                    t("familyMembers.ageYearsSuffix"),
                  );
                  return (
                    <View key={item.id} style={styles.row}>
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                          {item.nama.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.nama} numberOfLines={1}>
                          {item.nama}
                        </Text>
                        <View style={styles.metaRow}>
                          <View style={styles.hubunganPill}>
                            <Text style={styles.hubunganText}>
                              {HUBUNGAN_LABEL_KEY[item.hubungan]
                                ? t(HUBUNGAN_LABEL_KEY[item.hubungan])
                                : item.hubungan}
                            </Text>
                          </View>
                          {usia && <Text style={styles.usiaText}>{usia}</Text>}
                        </View>
                      </View>
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() =>
                          router.push({
                            pathname: "/tambah-anggota",
                            params: { id: item.id },
                          })
                        }
                      >
                        <Ionicons
                          name="pencil-outline"
                          size={19}
                          color="#0D9488"
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => handleDelete(item)}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={19}
                          color="#DC2626"
                        />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </>
            )}
          </ScrollView>

          {/* Tombol tetap di bawah, tidak ikut tergulung / terpotong saat daftar panjang */}
          <View
            style={[
              styles.footer,
              { paddingBottom: Math.max(insets.bottom, 12) + 8 },
            ]}
          >
            <TouchableOpacity
              style={[styles.addButton, sudahPenuh && styles.addButtonDisabled]}
              onPress={handleTambah}
              activeOpacity={0.85}
            >
              <Ionicons
                name="add"
                size={18}
                color={sudahPenuh ? "#9CA3AF" : "#fff"}
              />
              <Text
                style={[
                  styles.addButtonText,
                  sudahPenuh && { color: "#9CA3AF" },
                ]}
              >
                {sudahPenuh
                  ? t("familyMembers.limitReached")
                  : t("familyMembers.addButton")}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
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
    color: WARNA_HEADER,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 10,
  },
  // Saat kosong: konten ditengahkan di area sisa (di atas tombol)
  listContentEmpty: { flexGrow: 1, justifyContent: "center" },
  counterRow: { gap: 6 },
  counterText: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 12,
    color: "#6B7280",
  },
  progressTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: "#E7F2EF",
    overflow: "hidden",
  },
  progressFill: {
    height: 5,
    borderRadius: 3,
    backgroundColor: "#0D9488",
  },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  emptyIconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  emptyTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 15,
    color: "#1F2937",
    marginBottom: 6,
  },
  emptyText: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 19,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EEF2F1",
    paddingVertical: 12,
    paddingLeft: 14,
    paddingRight: 8,
    shadowColor: "#0D9488",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#E1F5EE",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 16,
    color: "#0D9488",
  },
  nama: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 14.5,
    color: "#1F2937",
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  hubunganPill: {
    backgroundColor: "#EEF6F4",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  hubunganText: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 11,
    color: "#0D6459",
  },
  usiaText: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 12,
    color: "#6B7280",
  },
  // Area sentuh 40x40 (sebelumnya ikon 18 dengan hitSlop kecil)
  actionBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#EEF2F1",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#0D9488",
    borderRadius: 14,
    minHeight: 50,
  },
  addButtonDisabled: { backgroundColor: "#E5E7EB" },
  addButtonText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: "#fff",
    fontSize: 15,
  },
});
