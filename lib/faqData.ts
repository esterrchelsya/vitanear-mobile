export type FaqItem = {
  id: string;
  kategori: {
    id: string;
    en: string;
  };
  pertanyaan: {
    id: string;
    en: string;
  };
  jawaban: {
    id: string;
    en: string;
  };
  langkah?: {
    id: string[];
    en: string[];
  };
  catatan?: {
    id: string;
    en: string;
  };
};

// TODO: pindahkan ke tabel Supabase kalau nanti butuh dikelola dari admin.
export const FAQ_DATA: FaqItem[] = [
  {
    id: "booking-1",
    kategori: {
      id: "Booking & Jadwal",
      en: "Booking & Schedule",
    },
    pertanyaan: {
      id: "Bagaimana cara melakukan reservasi BPJS?",
      en: "How do I make a BPJS reservation?",
    },
    jawaban: {
      id: "Ikuti langkah berikut untuk melakukan reservasi BPJS Kesehatan di VitaNear.",
      en: "Follow these steps to make a BPJS Kesehatan reservation at VitaNear.",
    },
    langkah: {
      id: [
        "Pilih fasilitas kesehatan (faskes) yang sudah bekerja sama dengan BPJS.",
        "Pilih layanan/poli dan tanggal kunjungan.",
        "Pilih metode 'BPJS', lalu isi data yang diminta.",
        "Konfirmasi reservasi. Petugas faskes akan memverifikasi sebelum jadwal disetujui.",
      ],
      en: [
        "Select a healthcare facility partnered with BPJS.",
        "Select the polyclinic/service and visit date.",
        "Select the 'BPJS' method, then fill in the required details.",
        "Confirm reservation. Facility staff will verify before the schedule is approved.",
      ],
    },
    catatan: {
      id: "Reservasi BPJS baru bisa diverifikasi oleh admin faskes, jadi nomor antrean belum langsung muncul setelah pengajuan.",
      en: "BPJS reservations need verification by the facility admin, so queue numbers won't appear immediately upon submission.",
    },
  },
  {
    id: "booking-2",
    kategori: {
      id: "Booking & Jadwal",
      en: "Booking & Schedule",
    },
    pertanyaan: {
      id: "Bisakah saya membatalkan reservasi?",
      en: "Can I cancel my reservation?",
    },
    jawaban: {
      id: "Bisa, selama status reservasi belum 'Selesai'. Buka tab Transaksi, pilih reservasi yang ingin dibatalkan, lalu tekan tombol Batalkan.",
      en: "Yes, as long as the status is not 'Completed'. Open the Transactions tab, select the reservation, and press Cancel.",
    },
  },
  {
    id: "bayar-1",
    kategori: {
      id: "Pembayaran & BPJS",
      en: "Payment & BPJS",
    },
    pertanyaan: {
      id: "Apakah bisa menggunakan BPJS Kesehatan?",
      en: "Can I use BPJS Kesehatan?",
    },
    jawaban: {
      id: "Ya. Saat memilih faskes, cari label 'Menerima BPJS' pada halaman detail faskes sebelum membuat reservasi.",
      en: "Yes. When choosing a facility, look for the 'Accepts BPJS' label on the facility detail page before booking.",
    },
  },
  {
    id: "bayar-2",
    kategori: {
      id: "Pembayaran & BPJS",
      en: "Payment & BPJS",
    },
    pertanyaan: {
      id: "Metode pembayaran apa saja yang tersedia untuk pasien umum?",
      en: "What payment methods are available for general patients?",
    },
    jawaban: {
      id: "Saat ini metode pembayaran untuk pasien umum sedang dalam tahap pengembangan dan akan segera tersedia.",
      en: "Currently, payment methods for general patients are under development and will be available soon.",
    },
  },
  {
    id: "akun-1",
    kategori: {
      id: "Akun & Keamanan",
      en: "Account & Security",
    },
    pertanyaan: {
      id: "Bagaimana cara mengubah kata sandi?",
      en: "How do I change my password?",
    },
    jawaban: {
      id: "Ubah kata sandi melalui menu Keamanan pada halaman Profil.",
      en: "Change your password via the Security menu on the Profile page.",
    },
    langkah: {
      id: [
        "Buka Profil, lalu pilih 'Keamanan & Kata Sandi'.",
        "Masukkan kata sandi lama Anda.",
        "Masukkan kata sandi baru dan konfirmasi.",
      ],
      en: [
        "Open Profile, then select 'Security & Password'.",
        "Enter your current password.",
        "Enter your new password and confirm.",
      ],
    },
  },
  {
    id: "akun-2",
    kategori: {
      id: "Akun & Keamanan",
      en: "Account & Security",
    },
    pertanyaan: {
      id: "Data saya aman tidak di aplikasi ini?",
      en: "Is my data safe in this app?",
    },
    jawaban: {
      id: "Kami menjaga keamanan data Anda dengan enkripsi dan protokol keamanan yang ketat. Data pribadi Anda tidak akan dibagikan kepada pihak ketiga tanpa izin Anda.",
      en: "We protect your data security with strict encryption and security protocols. Your personal data will not be shared with third parties without your permission.",
    },
  },
];

export function groupFaqByKategori(data: FaqItem[], lang: "id" | "en" = "id") {
  const map = new Map<
    string,
    {
      id: string;
      pertanyaan: string;
      jawaban: string;
      langkah?: string[];
      catatan?: string;
    }[]
  >();

  data.forEach((item) => {
    const katName = item.kategori[lang] || item.kategori.id;
    if (!map.has(katName)) map.set(katName, []);

    map.get(katName)!.push({
      id: item.id,
      pertanyaan: item.pertanyaan[lang] || item.pertanyaan.id,
      jawaban: item.jawaban[lang] || item.jawaban.id,
      langkah: item.langkah ? item.langkah[lang] || item.langkah.id : undefined,
      catatan: item.catatan ? item.catatan[lang] || item.catatan.id : undefined,
    });
  });

  return Array.from(map.entries()).map(([kategori, items]) => ({
    kategori,
    items,
  }));
}
