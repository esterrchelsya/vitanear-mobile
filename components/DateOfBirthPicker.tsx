import { Ionicons } from "@expo/vector-icons";
import { useMemo, useRef, useState } from "react";
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLanguage } from "../lib/LanguageContext";

// Props sama persis dengan versi wheel sebelumnya -> complete-profile.tsx
// TIDAK perlu diubah.

// 0 = minggu mulai hari Minggu, 1 = mulai hari Senin.
const WEEK_STARTS_ON: 0 | 1 = 0;

// Saat user belum pernah memilih tanggal, kalender dibuka di daftar tahun
// dan diposisikan di sekitar (tahun ini - 30). Usia median penduduk
// Indonesia sekitar 30 tahun, jadi tahun ini paling dekat dengan "rata-rata"
// pengguna -> scroll paling sedikit untuk kebanyakan orang.
const DEFAULT_AGE_FOR_START_VIEW = 30;

const BODY_HEIGHT = 300; // tinggi tetap agar sheet tidak "melompat" antar mode
const DAY_ROW_HEIGHT = 44;
const YEAR_ROW_HEIGHT = 52;
const YEAR_COLUMNS = 3;

type Mode = "days" | "months" | "years";

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function daysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

type PickerBodyProps = {
  value: Date | null;
  minimumDate: Date;
  maximumDate: Date;
  locale: string;
  onCancel: () => void;
  onConfirm: (date: Date) => void;
  t: (key: string) => string;
};

function PickerBody({
  value,
  minimumDate,
  maximumDate,
  locale,
  onCancel,
  onConfirm,
  t,
}: PickerBodyProps) {
  const minDay = startOfDay(minimumDate);
  const maxDay = startOfDay(maximumDate);
  const minYear = minDay.getFullYear();
  const maxYear = maxDay.getFullYear();
  const minMonthKey = minYear * 12 + minDay.getMonth();
  const maxMonthKey = maxYear * 12 + maxDay.getMonth();

  const fallbackYear = useRef(
    Math.min(Math.max(maxYear - DEFAULT_AGE_FOR_START_VIEW, minYear), maxYear),
  ).current;

  const [selected, setSelected] = useState<Date | null>(value);
  const [viewYear, setViewYear] = useState(
    value ? value.getFullYear() : fallbackYear,
  );
  const [viewMonth, setViewMonth] = useState(value ? value.getMonth() : 0);
  // Ada nilai -> langsung tampil kalender bulan itu.
  // Belum ada nilai -> mulai dari pilih tahun (lebih cepat untuk tanggal lahir).
  const [mode, setMode] = useState<Mode>(value ? "days" : "years");

  const viewMonthKey = viewYear * 12 + viewMonth;
  const canGoPrev = viewMonthKey > minMonthKey;
  const canGoNext = viewMonthKey < maxMonthKey;

  const goPrevMonth = () => {
    if (!canGoPrev) return;
    if (viewMonth === 0) {
      setViewYear(viewYear - 1);
      setViewMonth(11);
    } else setViewMonth(viewMonth - 1);
  };
  const goNextMonth = () => {
    if (!canGoNext) return;
    if (viewMonth === 11) {
      setViewYear(viewYear + 1);
      setViewMonth(0);
    } else setViewMonth(viewMonth + 1);
  };

  const monthNames = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) =>
        new Date(2000, i, 1).toLocaleDateString(locale, { month: "short" }),
      ),
    [locale],
  );

  // 1 Jan 2023 adalah hari Minggu -> dipakai untuk menurunkan nama hari
  // sesuai locale tanpa hardcode teks.
  const weekdayLabels = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) =>
        new Date(2023, 0, 1 + ((WEEK_STARTS_ON + i) % 7)).toLocaleDateString(
          locale,
          { weekday: "short" },
        ),
      ),
    [locale],
  );

  // Selalu 6 baris x 7 kolom supaya tinggi kalender konsisten tiap bulan.
  const weeks = useMemo(() => {
    const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
    const offset = (firstWeekday - WEEK_STARTS_ON + 7) % 7;
    const total = daysInMonth(viewYear, viewMonth);
    const cells: Array<number | null> = [
      ...Array(offset).fill(null),
      ...Array.from({ length: total }, (_, i) => i + 1),
    ];
    while (cells.length < 42) cells.push(null);
    return Array.from({ length: 6 }, (_, w) => cells.slice(w * 7, w * 7 + 7));
  }, [viewYear, viewMonth]);

  // Urutan tahun menurun (terbaru di atas).
  const years = useMemo(() => {
    const arr: number[] = [];
    for (let y = maxYear; y >= minYear; y--) arr.push(y);
    return arr;
  }, [minYear, maxYear]);

  const yearListInitialIndex = useMemo(() => {
    const idx = Math.max(0, years.indexOf(viewYear));
    const rowStart = idx - (idx % YEAR_COLUMNS);
    // sisakan 1 baris di atas supaya tahun terpilih tidak nempel di tepi
    return Math.max(0, rowStart - YEAR_COLUMNS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const titleText = new Date(viewYear, viewMonth, 1).toLocaleDateString(
    locale,
    { month: "long", year: "numeric" },
  );
  const selectedText = selected
    ? selected.toLocaleDateString(locale, {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "";

  const isSameDay = (y: number, m: number, d: number) =>
    !!selected &&
    selected.getFullYear() === y &&
    selected.getMonth() === m &&
    selected.getDate() === d;

  const isDayDisabled = (d: number) => {
    const ts = new Date(viewYear, viewMonth, d).getTime();
    return ts < minDay.getTime() || ts > maxDay.getTime();
  };

  const isMonthDisabled = (m: number) => {
    const key = viewYear * 12 + m;
    return key < minMonthKey || key > maxMonthKey;
  };

  const handleTitlePress = () => {
    setMode(mode === "days" ? "years" : "days");
  };

  return (
    <>
      {/* Header: bulan sebelumnya | judul (ketuk = pilih tahun) | bulan berikutnya */}
      <View style={styles.headerRow}>
        {mode === "days" ? (
          <TouchableOpacity
            onPress={goPrevMonth}
            disabled={!canGoPrev}
            style={styles.navButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name="chevron-back"
              size={22}
              color={canGoPrev ? "#222" : "#D0D0D0"}
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.navButton} />
        )}

        <TouchableOpacity
          style={styles.titleButton}
          onPress={handleTitlePress}
          activeOpacity={0.7}
        >
          <Text style={styles.headerTitle}>
            {mode === "days" ? titleText : String(viewYear)}
          </Text>
          <Ionicons
            name={mode === "days" ? "chevron-down" : "chevron-up"}
            size={16}
            color="#0D9488"
          />
        </TouchableOpacity>

        {mode === "days" ? (
          <TouchableOpacity
            onPress={goNextMonth}
            disabled={!canGoNext}
            style={styles.navButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name="chevron-forward"
              size={22}
              color={canGoNext ? "#222" : "#D0D0D0"}
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.navButton} />
        )}
      </View>

      <View style={{ height: BODY_HEIGHT }}>
        {mode === "days" && (
          <View>
            <View style={styles.weekdayRow}>
              {weekdayLabels.map((label, i) => (
                <Text key={i} style={styles.weekdayText}>
                  {label}
                </Text>
              ))}
            </View>
            {weeks.map((week, wi) => (
              <View key={wi} style={styles.weekRow}>
                {week.map((day, di) => {
                  if (day === null) {
                    return <View key={di} style={styles.dayCell} />;
                  }
                  const disabled = isDayDisabled(day);
                  const active = isSameDay(viewYear, viewMonth, day);
                  return (
                    <TouchableOpacity
                      key={di}
                      style={styles.dayCell}
                      disabled={disabled}
                      activeOpacity={0.7}
                      onPress={() =>
                        setSelected(new Date(viewYear, viewMonth, day))
                      }
                    >
                      <View
                        style={[styles.dayCircle, active && styles.dayActive]}
                      >
                        <Text
                          style={[
                            styles.dayText,
                            disabled && styles.dayTextDisabled,
                            active && styles.dayTextActive,
                          ]}
                        >
                          {day}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        )}

        {mode === "years" && (
          <FlatList
            data={years}
            keyExtractor={(y) => String(y)}
            numColumns={YEAR_COLUMNS}
            showsVerticalScrollIndicator={false}
            initialScrollIndex={yearListInitialIndex}
            getItemLayout={(_, index) => ({
              length: YEAR_ROW_HEIGHT,
              offset: YEAR_ROW_HEIGHT * Math.floor(index / YEAR_COLUMNS),
              index,
            })}
            renderItem={({ item: y }) => {
              const active = y === viewYear;
              return (
                <TouchableOpacity
                  style={styles.gridCell}
                  activeOpacity={0.7}
                  onPress={() => {
                    setViewYear(y);
                    setMode("months");
                  }}
                >
                  <View style={[styles.gridPill, active && styles.dayActive]}>
                    <Text
                      style={[styles.gridText, active && styles.dayTextActive]}
                    >
                      {y}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}

        {mode === "months" && (
          <View style={styles.monthsGrid}>
            {monthNames.map((name, m) => {
              const disabled = isMonthDisabled(m);
              const active = m === viewMonth;
              return (
                <TouchableOpacity
                  key={m}
                  style={styles.monthCell}
                  disabled={disabled}
                  activeOpacity={0.7}
                  onPress={() => {
                    setViewMonth(m);
                    setMode("days");
                  }}
                >
                  <View style={[styles.gridPill, active && styles.dayActive]}>
                    <Text
                      style={[
                        styles.gridText,
                        disabled && styles.dayTextDisabled,
                        active && styles.dayTextActive,
                      ]}
                    >
                      {name}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* Ringkasan tanggal terpilih, tinggi tetap agar layout tidak bergeser */}
      <Text style={styles.selectedSummary}>{selectedText}</Text>

      <View style={styles.footerRow}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancel}
          activeOpacity={0.8}
        >
          <Text style={styles.cancelButtonText}>
            {t("completeProfile.datePickerCancel")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.confirmButton, !selected && styles.confirmDisabled]}
          onPress={() => selected && onConfirm(selected)}
          disabled={!selected}
          activeOpacity={0.85}
        >
          <Text style={styles.confirmButtonText}>
            {t("completeProfile.datePickerConfirm")}
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

type DateOfBirthPickerProps = {
  visible: boolean;
  value: Date | null;
  minimumDate: Date;
  maximumDate: Date;
  onClose: () => void;
  onConfirm: (date: Date) => void;
};

export default function DateOfBirthPicker({
  visible,
  value,
  minimumDate,
  maximumDate,
  onClose,
  onConfirm,
}: DateOfBirthPickerProps) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const locale = t("completeProfile.dateLocale");

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <View
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}
        >
          <View style={styles.handle} />
          <Text style={styles.title}>
            {t("completeProfile.datePickerTitle")}
          </Text>

          {/* Dirender ulang setiap dibuka supaya state (mode, bulan, tahun)
              selalu mulai dari `value` terbaru. */}
          {visible ? (
            <PickerBody
              value={value}
              minimumDate={minimumDate}
              maximumDate={maximumDate}
              locale={locale}
              onCancel={onClose}
              onConfirm={onConfirm}
              t={t}
            />
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingHorizontal: 16,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E0E0E0",
    marginBottom: 16,
  },
  title: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 16,
    color: "#222",
    textAlign: "center",
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  navButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  titleButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  headerTitle: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 16,
    color: "#222",
  },
  weekdayRow: {
    flexDirection: "row",
    height: 28,
    alignItems: "center",
  },
  weekdayText: {
    flex: 1,
    textAlign: "center",
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 12,
    color: "#888",
  },
  weekRow: {
    flexDirection: "row",
    height: DAY_ROW_HEIGHT,
  },
  dayCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  dayActive: {
    backgroundColor: "#0D9488",
  },
  dayText: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 15,
    color: "#222",
  },
  dayTextDisabled: {
    color: "#CFCFCF",
  },
  dayTextActive: {
    color: "#fff",
    fontFamily: "PlusJakartaSans_600SemiBold",
  },
  gridCell: {
    width: `${100 / YEAR_COLUMNS}%`,
    height: YEAR_ROW_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  monthsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    height: BODY_HEIGHT,
  },
  monthCell: {
    width: `${100 / 3}%`,
    height: BODY_HEIGHT / 4,
    alignItems: "center",
    justifyContent: "center",
  },
  gridPill: {
    minWidth: 80,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  gridText: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 15,
    color: "#222",
  },
  selectedSummary: {
    height: 22,
    marginTop: 8,
    textAlign: "center",
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 13,
    color: "#0D9488",
  },
  footerRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#0D9488",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },
  cancelButtonText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 15,
    color: "#0D9488",
  },
  confirmButton: {
    flex: 1,
    backgroundColor: "#0D9488",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },
  confirmDisabled: {
    backgroundColor: "#B0D4D0",
  },
  confirmButtonText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 15,
    color: "#fff",
  },
});
