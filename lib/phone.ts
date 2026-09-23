// Utility format nomor HP. Murni untuk tampilan/input — nilai yang
// DISIMPAN ke database tetap angka polos (mis. "+6285607049097"),
// tidak pernah berubah oleh fungsi-fungsi ini.

// Dipakai di halaman Profil, untuk menampilkan nomor HP lengkap dengan kode negara.
// Contoh: "+6285607049097" -> "+62 856-0704-9097"
export function formatPhoneDisplay(raw: string | null | undefined): string {
  if (!raw) return "-";
  const match = raw.match(/^\+62(\d+)$/);
  if (!match) return raw;
  const rest = match[1];

  const groups: string[] = [rest.slice(0, 3)];
  let remaining = rest.slice(3);
  while (remaining.length > 0) {
    groups.push(remaining.slice(0, 4));
    remaining = remaining.slice(4);
  }
  return `+62 ${groups.join("-")}`;
}

// Dipakai di kolom input form (Lengkapi Profil / Edit Profil), tanpa kode negara
// karena +62 sudah ditampilkan terpisah di kotak sebelahnya.
// Contoh: "85607049097" -> "856-0704-9097"
export function formatPhoneInput(digits: string): string {
  const clean = digits.replace(/[^0-9]/g, "");
  if (clean.length === 0) return "";

  const groups: string[] = [clean.slice(0, 3)];
  let remaining = clean.slice(3);
  while (remaining.length > 0) {
    groups.push(remaining.slice(0, 4));
    remaining = remaining.slice(4);
  }
  return groups.filter(Boolean).join("-");
}
