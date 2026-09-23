import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";

type Pasien = { id: string | null; nama: string; label: string };

function hitungUsia(tgl: string | null) {
  if (!tgl) return null;
  return Math.floor(
    (Date.now() - new Date(tgl).getTime()) / (365.25 * 24 * 60 * 60 * 1000),
  );
}

export default function PilihPasienScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    faskesId: string;
    faskesNama: string;
    layananId: string;
    layananNama: string;
    menerimaBpjs?: string;
  }>();

  const [pasienList, setPasienList] = useState<Pasien[]>([]);
  const [selected, setSelected] = useState<string | null>("diri-sendiri");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
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
        .order("created_at", { ascending: true });

      const list: Pasien[] = [
        {
          id: null,
          nama: profile?.nama || "Diri Sendiri",
          label: "Diri Sendiri",
        },
        ...(anggota || []).map((a) => {
          const usia = hitungUsia(a.tanggal_lahir);
          return {
            id: a.id,
            nama: a.nama,
            label: `${a.hubungan}${usia !== null ? `, ${usia} thn` : ""}`,
          };
        }),
      ];
      setPasienList(list);
      setLoading(false);
    };
    load();
  }, []);

  const handleLanjutkan = () => {
    const pasien = pasienList.find(
      (p) => (p.id ?? "diri-sendiri") === selected,
    );
    router.push({
      pathname: "/pilih-reservasi",
      params: {
        faskesId: params.faskesId,
        faskesNama: params.faskesNama,
        layananId: params.layananId,
        layananNama: params.layananNama,
        menerimaBpjs: params.menerimaBpjs ?? "false",
        anggotaKeluargaId: pasien?.id ?? "",
        pasienNama: pasien?.nama ?? "",
      },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={22} color="#0D9488" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Untuk Siapa Reservasi Ini?</Text>
        <View style={{ width: 22 }} />
      </View>

      <Text style={styles.subtitle}>
        Pilih profil pasien untuk melanjutkan proses reservasi. Anda dapat
        menambahkan anggota keluarga baru jika diperlukan.
      </Text>

      {loading ? (
        <ActivityIndicator color="#0D9488" style={{ marginTop: 30 }} />
      ) : (
        <View style={styles.content}>
          {pasienList.map((p) => {
            const key = p.id ?? "diri-sendiri";
            const active = selected === key;
            return (
              <TouchableOpacity
                key={key}
                style={[styles.card, active && styles.cardActive]}
                onPress={() => setSelected(key)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.avatar,
                    active && { backgroundColor: "#0D9488" },
                  ]}
                >
                  <Ionicons
                    name="person"
                    size={18}
                    color={active ? "#fff" : "#0D9488"}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.nama}>{p.nama}</Text>
                  <Text style={styles.label}>{p.label}</Text>
                </View>
                <Ionicons
                  name={active ? "checkmark-circle" : "ellipse-outline"}
                  size={22}
                  color={active ? "#0D9488" : "#D0D0D0"}
                />
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            style={styles.addRow}
            onPress={() => router.push("/tambah-anggota")}
          >
            <Ionicons name="add" size={16} color="#0D9488" />
            <Text style={styles.addText}>Tambah Anggota Keluarga Baru</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        style={styles.lanjutButton}
        onPress={handleLanjutkan}
        activeOpacity={0.85}
      >
        <Text style={styles.lanjutButtonText}>Lanjutkan</Text>
      </TouchableOpacity>
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
    paddingBottom: 4,
  },
  headerTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 16,
    color: "#0D9488",
  },
  subtitle: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 12.5,
    color: "#6B7280",
    paddingHorizontal: 20,
    marginTop: 8,
    lineHeight: 18,
  },
  content: { paddingHorizontal: 20, paddingTop: 16, gap: 10 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardActive: {
    borderWidth: 1.5,
    borderColor: "#0D9488",
    shadowOpacity: 0.08,
    elevation: 2,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#E1F5EE",
    alignItems: "center",
    justifyContent: "center",
  },
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
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
    alignSelf: "flex-start",
  },
  addText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 13,
    color: "#0D9488",
  },
  lanjutButton: {
    backgroundColor: "#0D9488",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 20,
    shadowColor: "#0D9488",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  lanjutButtonText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: "#fff",
    fontSize: 16,
  },
});
