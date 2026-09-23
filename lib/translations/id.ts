// Kumpulan teks Bahasa Indonesia.
// Tambahkan section baru setiap kali migrasi sebuah halaman ke sistem i18n ini.
// Struktur: t("login.title") -> ambil dari login.title di bawah.

export default {
  common: {
    loading: "Memuat...",
    save: "Simpan",
    cancel: "Batal",
    error: "Terjadi kesalahan. Coba lagi.",
  },

  login: {
    title: "Masuk ke VitaNear",
    subtitle: "Kesehatan terdekat, tepercaya untuk semua",
    emailLabel: "Email",
    emailPlaceholder: "contoh@email.com",
    passwordLabel: "Kata Sandi",
    passwordPlaceholder: "Masukkan kata sandi",
    forgotPassword: "Lupa kata sandi?",
    loginButton: "Masuk",
    loggingIn: "Memproses...",
    or: "Atau",
    continueWithGoogle: "Lanjutkan dengan Google",
    noAccount: "Belum punya akun?",
    registerLink: "Daftar di sini",
    errorEmptyFields: "Email dan kata sandi wajib diisi.",
    errorInvalidCredentials: "Email atau kata sandi salah. Silakan coba lagi.",
    errorGoogle: "Login dengan Google gagal. Coba lagi.",
    errorGoogleExpoGo:
      "Login Google hanya tersedia di build aplikasi, bukan Expo Go.",
  },

  languageSettings: {
    title: "Pengaturan Bahasa",
  },

  tabs: {
    home: "Beranda",
    search: "Cari",
    transactions: "Transaksi",
    profile: "Profil",
  },

  register: {
    title: "Daftar ke VitaNear",
    subtitle: "Kesehatan terdekat, tepercaya untuk semua",

    emailLabel: "Email",
    emailPlaceholder: "contoh@email.com",
    passwordLabel: "Kata Sandi",
    passwordPlaceholder: "Masukkan kata sandi",
    passwordHint: "Minimal 8 karakter",

    registerButton: "Daftar",
    registering: "Memproses...",
    or: "Atau",
    continueWithGoogle: "Daftar dengan Google",
    haveAccount: "Sudah punya akun?",
    loginLink: "Masuk di sini",

    errorEmptyFields: "Email dan kata sandi wajib diisi.",
    errorInvalidEmail: "Format email tidak valid.",
    errorPasswordTooShort: "Kata sandi minimal 8 karakter.",
    errorEmailTaken:
      "Email ini sudah terdaftar. Coba masuk, atau gunakan email lain.",
    errorRateLimit:
      "Terlalu banyak percobaan. Silakan coba lagi sebentar lagi.",
    errorGeneric: "Gagal mendaftar. Silakan coba lagi.",
    successMessage: "Pendaftaran berhasil! Silakan cek email untuk verifikasi.",
    errorGoogle: "Daftar dengan Google gagal. Coba lagi.",
    errorGoogleExpoGo:
      "Daftar Google hanya tersedia di build aplikasi, bukan Expo Go.",
  },

  otp: {
    title: "Masukkan Kode OTP",
    subtitlePrefix: "Kode dikirim ke",
    resendPrefix: "Kirim ulang kode dalam 00:",
    resendActive: "Kirim Ulang Kode",
    resending: "Mengirim...",
    verifyButton: "Verifikasi",
    verifying: "Memverifikasi...",
    errorInvalidOtp: "Kode salah atau sudah kedaluwarsa. Coba lagi.",
    errorResendGeneric: "Gagal mengirim ulang kode. Coba beberapa saat lagi.",
  },

  completeProfile: {
    title: "Lengkapi Profil Anda",
    subtitle:
      "Data diri Anda akan digunakan untuk proses pendaftaran dan verifikasi.",

    permissionTitle: "Izin diperlukan",
    permissionMessage: "Izinkan akses galeri untuk memilih foto.",

    fullNameLabel: "Nama Lengkap",
    fullNamePlaceholder: "Masukkan nama lengkap",

    birthDateLabel: "Tanggal Lahir",
    birthDatePlaceholder: "Pilih tanggal lahir",
    dateLocale: "id-ID",

    nikLabel: "NIK (Nomor Induk Kependudukan)",
    nikPlaceholder: "Contoh: 3573xxxxxxxxxxxx",
    nikHelper:
      "Wajib diisi tepat 16 digit angka, sesuai yang tertera di KTP Anda.",

    genderLabel: "Jenis Kelamin",
    genderMale: "Laki-laki",
    genderFemale: "Perempuan",

    phoneLabel: "Nomor HP",
    phonePlaceholder: "812-3456-789",

    consentText:
      "Saya menyatakan bahwa data yang saya isi adalah benar dan sesuai identitas.",

    saveButton: "Simpan & Lanjutkan",
    saving: "Menyimpan...",
    uploadingPhoto: "Mengunggah foto...",

    errorEmptyFields: "Semua kolom wajib diisi.",
    errorNikLength: "NIK harus tepat 16 digit.",
    errorConsentRequired: "Centang dulu pernyataan kebenaran data.",
    errorSessionNotFound: "Sesi tidak ditemukan. Silakan login ulang.",
    errorSaveFailed: "Gagal menyimpan profil. Coba lagi.",
    datePickerTitle: "Pilih Tanggal Lahir",
    datePickerConfirm: "Pilih",
    datePickerCancel: "Batal",
  },

  editProfile: {
    title: "Edit Profil",

    permissionTitle: "Izin diperlukan",
    permissionMessage: "Izinkan akses galeri untuk memilih foto.",

    fullNameLabel: "Nama Lengkap",
    fullNamePlaceholder: "Masukkan nama lengkap",

    birthDateLabel: "Tanggal Lahir",
    birthDatePlaceholder: "Pilih tanggal lahir",
    dateLocale: "id-ID",

    nikLabel: "NIK (Nomor Induk Kependudukan)",
    nikPlaceholder: "Contoh: 3578012345670001",
    nikHelper: "Wajib diisi tepat 16 digit angka, sesuai KTP.",

    genderLabel: "Jenis Kelamin",
    genderMale: "Laki-laki",
    genderFemale: "Perempuan",

    phoneLabel: "Nomor HP",
    phonePlaceholder: "8123456789",

    saveButton: "Simpan Perubahan",
    saving: "Menyimpan...",
    uploadingPhoto: "Mengunggah foto...",

    errorEmptyFields: "Pastikan semua kolom terisi dan NIK tepat 16 digit.",
    errorSessionNotFound: "Sesi tidak ditemukan.",
    errorUploadTitle: "Gagal mengunggah foto",
    errorUploadMessage:
      "Data lain belum disimpan. Coba lagi, atau simpan tanpa mengganti foto.",
    errorSaveFailed: "Gagal menyimpan perubahan. Coba lagi.",
  },

  familyMembers: {
    title: "Anggota Keluarga",

    emptyTitle: "Belum ada anggota keluarga",
    emptyText:
      "Tambahkan anggota keluarga agar Anda bisa membuat reservasi untuk mereka, tanpa perlu akun terpisah.",

    counterOf: "dari",
    counterMembers: "anggota",

    ageMonthsSuffix: "bln",
    ageYearsSuffix: "thn",

    deleteTitle: "Hapus Anggota",
    deleteConfirmPrefix: "Hapus ",
    deleteConfirmSuffix: " dari daftar keluarga?",
    deleteButton: "Hapus",

    limitTitle: "Batas Tercapai",
    limitMessagePrefix: "Maksimal ",
    limitMessageSuffix:
      " anggota keluarga per akun. Hapus salah satu untuk menambah yang baru.",

    addButton: "Tambah Anggota Keluarga",
    limitReached: "Batas Anggota Tercapai",

    relationHusband: "Suami",
    relationWife: "Istri",
    relationChild: "Anak",
    relationParent: "Orang Tua",
    relationOther: "Lainnya",
  },

  addFamilyMember: {
    titleAdd: "Tambah Anggota",
    titleEdit: "Edit Anggota",

    fullNameLabel: "Nama Lengkap",
    fullNamePlaceholder: "Masukkan nama lengkap",

    birthDateLabel: "Tanggal Lahir",

    nikLabel: "NIK (Opsional)",
    nikPlaceholder: "16 digit NIK",

    relationLabel: "Hubungan Keluarga",

    bpjsLabel: "No. BPJS/Asuransi (Opsional)",
    bpjsPlaceholder: "Masukkan nomor BPJS atau asuransi",

    errorRequiredFields:
      "Nama, tanggal lahir, jenis kelamin, dan hubungan wajib diisi.",
    errorLimitPrefix: "Maksimal ",
    errorLimitSuffix: " anggota keluarga per akun.",
    errorSaveFailed: "Gagal menyimpan. Coba lagi.",

    saveButton: "Simpan Anggota",
  },

  symptomChecker: {
    title: "Cek Gejala",
    resultTitle: "Hasil Cek Gejala",

    durationLess24h: "< 24 jam",
    duration1to3Days: "1–3 hari",
    durationMore3Days: "> 3 hari",
    durationMore1Week: "> 1 minggu",

    severityMild: "Ringan",
    severityModerate: "Sedang",
    severitySevere: "Berat",

    symptomFever: "Demam",
    symptomNauseaVomit: "Mual / Muntah",
    symptomDizzy: "Pusing",
    symptomShortBreath: "Sesak napas",
    symptomPain: "Nyeri",
    symptomItchRash: "Gatal / Ruam",
    symptomOther: "Lainnya",

    aiStepReading: "Membaca keluhan Anda",
    aiStepAnalyzing: "Menganalisis gejala & keparahan",
    aiStepComposing: "Menyusun edukasi yang relevan",
    aiStepMatching: "Mencocokkan kategori faskes",

    stepLabelComplaint: "Keluhan",
    stepLabelDuration: "Durasi",
    stepLabelSeverity: "Keparahan",
    stepLabelOtherSymptoms: "Gejala Lain",

    urgencyLowLabel: "Urgensi Rendah",
    urgencyModerateLabel: "Urgensi Sedang",
    urgencyHighLabel: "Urgensi Tinggi — Segera ke Faskes",

    resultDisclaimerNote:
      "Hasil ini bersifat edukasi umum, bukan diagnosis medis.",
    summaryTitle: "Ringkasan Edukasi",
    adviceTitle: "Saran",
    categoryLabel: "Kategori faskes yang disarankan",
    searchCategoryButton: "Cari Kategori Ini",
    checkOtherButton: "Cek Gejala Lain",

    loadingTitle: "AI sedang menganalisis",
    loadingSubtitle: "Mohon tunggu sebentar, biasanya hanya beberapa detik.",

    heroTitle: "Ceritakan Gejala Anda",
    heroSubtitle:
      "Asisten edukasi kesehatan VitaNear membantu memahami kondisi Anda.",
    aiDisclaimerNote:
      "AI dapat membuat kesalahan. Selalu konsultasikan ke tenaga kesehatan.",

    step0Title: "Apa keluhan utama Anda?",
    step0Hint: "Contoh: nyeri perut sejak kemarin, batuk terus-menerus, dll.",
    step0Placeholder: "Tulis keluhan Anda di sini...",

    step1Title: "Sudah berapa lama dirasakan?",
    step2Title: "Seberapa berat dirasakan?",
    step3Title: "Ada gejala penyerta? (opsional)",
    step3Placeholder: "Sebutkan gejala lainnya...",

    nextButton: "Lanjut",
    seeResultButton: "Lihat Hasil",

    errorSubmit: "Gagal memproses. Periksa koneksi Anda dan coba lagi.",
  },

  profile: {
    defaultName: "Pengguna VitaNear",

    menuFamilyMembers: "Daftar Anggota Keluarga",
    menuInsurance: "Informasi Asuransi",
    menuSecurity: "Keamanan & Kata Sandi",
    menuHelp: "Pusat Bantuan / FAQ",

    logoutConfirmTitle: "Keluar",
    logoutConfirmMessage: "Yakin ingin keluar dari akun?",
    logoutButton: "Keluar",
    logoutAccount: "Keluar Akun",
  },

  helpCenter: {
    title: "Pusat Bantuan",
    teamName: "Tim VitaNear",
    greetingPrefix: "Ada yang bisa kami",
    greetingAccent: "bantu?",
    subtitle: "Temukan jawaban seputar reservasi, pembayaran, dan akun Anda.",
    questionsSuffix: "pertanyaan",
  },

  insurance: {
    title: "Informasi Asuransi",
    bpjsTitle: "BPJS Kesehatan",
    bpjsNumberLabel: "Nomor Kartu BPJS",
    bpjsNumberPlaceholder: "0001234567890",
    faskes1Label: "Faskes Tingkat 1",
    faskes1Placeholder: "Nama klinik/puskesmas terdaftar",
    bpjsInfoText:
      "BPJS memerlukan rujukan dari Faskes Tingkat 1 untuk konsultasi ke dokter spesialis, kecuali kondisi darurat. Data ini akan diverifikasi ulang oleh petugas saat check-in, dan otomatis dipakai setiap kali reservasi BPJS tanpa perlu mengisi ulang.",
    privateTitle: "Asuransi Swasta",
    optionalTag: "(opsional)",
    providerLabel: "Nama Provider",
    providerPlaceholder: "Contoh: Prudential, Allianz, dsb",
    policyNumberLabel: "Nomor Polis",
    policyNumberPlaceholder: "Masukkan nomor polis Anda",
    badgeFilled: "Terisi",
    badgeEmpty: "Belum diisi",
    errorSessionNotFound: "Sesi tidak ditemukan.",
    errorSaveFailed: "Gagal menyimpan. Coba lagi.",
    saveButton: "Simpan",
    savingButton: "Menyimpan...",
  },

  security: {
    title: "Keamanan & Kata Sandi",
    heroTitle: "Jaga keamanan akun Anda",
    heroSubtitle:
      "Perbarui kata sandi secara berkala dan kelola perangkat yang sedang masuk.",
    changePasswordTitle: "Ganti Kata Sandi",
    changePasswordDesc:
      "Gunakan kata sandi yang unik dan tidak dipakai di layanan lain.",
    currentPasswordLabel: "Kata Sandi Saat Ini",
    currentPasswordPlaceholder: "Masukkan kata sandi saat ini",
    currentPasswordHint: "Diperlukan untuk memastikan ini benar-benar Anda.",
    newPasswordLabel: "Kata Sandi Baru",
    newPasswordPlaceholder: "Minimal 8 karakter",
    newPasswordHint:
      "Minimal 8 karakter, disarankan kombinasi huruf dan angka.",
    confirmPasswordLabel: "Konfirmasi Kata Sandi Baru",
    confirmPasswordPlaceholder: "Ulangi kata sandi baru",
    confirmPasswordHint: "Ketik ulang kata sandi baru Anda.",
    passwordMatch: "Kata sandi cocok.",
    passwordMismatch: "Konfirmasi kata sandi tidak cocok.",

    // Label Kekuatan Sandi
    strengthTooShort: "Terlalu pendek",
    strengthFair: "Cukup",
    strengthGood: "Baik",
    strengthStrong: "Kuat",

    // Sesi Perangkat
    deviceSessionsTitle: "Sesi Perangkat",
    deviceSessionsDesc:
      "Keluar dari semua perangkat yang sedang masuk ke akun ini, termasuk perangkat ini.",
    logoutAllButton: "Keluar dari Semua Perangkat",
    logoutAllAlertTitle: "Keluar dari Semua Perangkat",
    logoutAllAlertMessage:
      "Anda akan keluar dari semua sesi aktif, termasuk perangkat ini. Lanjutkan?",

    // Validasi Error & Pesan
    errorCurrentRequired: "Kata sandi saat ini wajib diisi.",
    errorNewRequired: "Kata sandi baru wajib diisi.",
    errorNewMinLength: "Kata sandi baru minimal 8 karakter.",
    errorNewSameAsCurrent:
      "Kata sandi baru tidak boleh sama dengan yang saat ini.",
    errorConfirmRequired: "Konfirmasi kata sandi wajib diisi.",
    errorConfirmMismatch: "Konfirmasi kata sandi tidak cocok.",
    errorCurrentWrong: "Kata sandi saat ini salah.",
    errorGeneric: "Gagal mengubah kata sandi. Coba lagi.",
    successMessage: "Kata sandi berhasil diperbarui.",
    saveButton: "Simpan Kata Sandi Baru",
    processingButton: "Memproses...",
  },

  transactions: {
    title: "Riwayat Transaksi",
    subtitle: "Pantau status pendaftaran dan transaksi Anda.",

    // Filter Labels
    filterAll: "Semua",
    filterCompleted: "Selesai",
    filterInProcess: "Diproses",
    filterRejected: "Ditolak",
    filterCancelled: "Dibatalkan",

    // Status & Badges
    upcomingBadge: "Mendatang",
    selfPatient: "Anda sendiri",

    // Dates
    today: "Hari ini",
    yesterday: "Kemarin",

    // Reviews
    reviewPrompt: "Bagaimana pengalaman Anda?",
    reviewThanks: "Terima kasih atas ulasan Anda",
    giveReviewButton: "Beri Ulasan",

    // Empty States
    emptyTitle: "Belum ada transaksi",
    emptyDescription:
      "Riwayat transaksi Anda akan muncul di sini setelah Anda melakukan reservasi.",
    emptyFilterPrefix: 'Belum ada transaksi berstatus "',
    emptyFilterSuffix: '".',
  },
  searchScreen: {
    title: "Cari Faskes",
    selectLocation: "Pilih lokasi",
    searchPlaceholder: "Cari rumah sakit, klinik, atau layanan...",
    popularCategories: "Kategori Populer",
    quickSearch: "Pencarian Cepat",

    // Pintasan Cepat
    shortcutOpenNow: "Buka Sekarang",
    shortcutOpen24h: "Buka 24 Jam",
    shortcutAcceptBpjs: "Menerima BPJS",
    shortcutRating4: "Rating 4+",

    // Banner Cek Gejala
    aiTitle: "Bingung harus ke poli mana?",
    aiSubtitle:
      "Ceritakan keluhan Anda, AI akan memberi gambaran awal dan menyarangkan kategori faskes.",
    aiButton: "Cek Gejala",
  },

  homeScreen: {
    currentLocation: "Lokasi Saat Ini",
    enableLocation: "Aktifkan lokasi",
    detectingLocation: "Mendeteksi lokasi...",
    aiBadge: "AI EDUKASI KESEHATAN",
    aiTitle: "Pahami gejala Anda",
    checkSymptomsButton: "Cek Gejala",
    otherCategory: "Lainnya",
    nearbyFacilities: "Fasilitas Kesehatan Terdekat",
    seeAll: "Lihat Semua",
    emptyNearby: "Belum ada faskes di sekitar lokasi Anda.",
    topRatedFacilities: "Rating Tertinggi",
    emptyTopRated: "Belum ada data faskes.",
    viewDetailButton: "Lihat Detail",
    open24Hours: "Buka 24 Jam",
    closesAtPrefix: "Tutup Pukul ",
  },

  allCategories: {
    title: "Semua Kategori",
    tipTitle: "Tidak menemukan kategori yang cocok?",
    tipDesc: "Coba cari faskes langsung lewat menu Cari.",
  },

  facilityDetail: {
    notFound: "Faskes tidak ditemukan.",
    open24Hours: "Buka 24 Jam",
    hoursUnavailable: "Jam operasional tidak tersedia",
    openUntilPrefix: "Buka · Tutup ",
    closedUntilPrefix: "Tutup · Buka ",
    reviewsCountSuffix: " ulasan",
    acceptsBpjs: "Menerima BPJS",
    addressUnavailable: "Alamat tidak tersedia",
    operatingHoursPrefix: "Jam operasional: ",
    callButton: "Telepon",
    routeButton: "Rute",
    shareButton: "Bagikan",
    facilityParking: "Parkir",
    facilityWifi: "WiFi",
    facilityAc: "AC",
    aboutSection: "Tentang",
    servicesSection: "Layanan & Poli",
    reservationButton: "Reservasi",
    patientReviewsSection: "Ulasan Pasien",
    seeAllReviews: "Lihat semua",
    emptyReviews: "Belum ada ulasan untuk faskes ini.",
    defaultUser: "Pengguna",
    facilityReply: "Balasan Faskes",
  },

  allReviews: {
    title: "Semua Ulasan",
    reviewsCountSuffix: " ulasan",
    emptyReviews: "Belum ada ulasan.",
    defaultUser: "Pengguna",
    facilityReply: "Balasan Faskes",
  },

  notifications: {
    title: "Notifikasi",
    markAllRead: "Tandai semua dibaca",
    today: "Hari Ini",
    yesterday: "Kemarin",
    emptyTitle: "Belum Ada Notifikasi",
    emptyCaption: "Notifikasi tentang reservasi Anda akan muncul di sini",
  },

  startReservation: {
    titlePatient: "Untuk Siapa Reservasi Ini?",
    defaultSelf: "Diri Sendiri",
    yearsOldSuffix: " thn",
    addNewMember: "Tambah Anggota Keluarga Baru",
    continueButton: "Lanjutkan",
    titleMethod: "Pilih Cara Reservasi",
    patientForPrefix: "Untuk: ",
    selfBookingTitle: "Reservasi Mandiri",
    selfBookingDesc: "Pilih jadwal & jam pasti, bayar online",
    bpjsBookingTitle: "Reservasi BPJS",
    bpjsBookingDescActive: "Pilih tanggal, dapat nomor antrean",
    bpjsBookingDescInactive: "Faskes ini tidak menerima BPJS",
  },

  selectSchedule: {
    headerTitle: "Pilih Jadwal",
    emptyDoctor: "Belum ada dokter tersedia untuk layanan ini.",
    selectDate: "Pilih Tanggal",
    selectSession: "Pilih Sesi",
    emptySession: "Tidak ada jadwal praktik pada tanggal ini.",
    fullQuota: "Penuh",
    remainingQuota: "Sisa {{remaining}}/{{total}}",
    totalFee: "Total Biaya",
    continueButton: "Lanjutkan",
    days: ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"],
    months: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "Mei",
      "Jun",
      "Jul",
      "Agu",
      "Sep",
      "Okt",
      "Nov",
      "Des",
    ],
  },

  bpjsReservation: {
    headerTitle: "Reservasi BPJS",
    selectVisitDate: "Pilih Tanggal Kunjungan",
    quotaFull: "Kuota Penuh",
    remainingQuota: "Sisa kuota: {{remaining}} dari {{total}}",
    infoNote:
      "Nomor antrean dan estimasi jam akan diterbitkan setelah verifikasi kartu BPJS oleh operator faskes.",
    submitting: "Mengirim...",
    getQueueNumber: "Ambil Nomor Antrean",
    alertFailedTitle: "Gagal",
    alertFailedMsg: "Reservasi gagal dikirim. Coba lagi.",
    alertSuccessTitle: "Reservasi Terkirim",
    alertSuccessMsg:
      "Reservasi BPJS berhasil dikirim, menunggu verifikasi admin faskes.",
    days: ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"],
    months: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "Mei",
      "Jun",
      "Jul",
      "Agu",
      "Sep",
      "Okt",
      "Nov",
      "Des",
    ],
  },

  categoryResult: {
    defaultTitle: "Kategori",
    searching: "Mencari faskes untuk Anda...",
    foundWithLocation: "{{count}} faskes ditemukan di sekitar Anda",
    foundWithoutLocation: "{{count}} faskes ditemukan",
    sortByDistance: "Diurutkan berdasarkan jarak terdekat",
    sortByRating: "Diurutkan berdasarkan rating tertinggi",
    emptyTitle: "Belum Ada Faskes",
    emptyText:
      'Belum ada faskes untuk kategori "{{category}}" di sekitar Anda saat ini.',
    open24Hours: "Buka 24 Jam",
    closesAt: "Tutup Pukul {{time}}",
    kmFromLocation: "{{distance}} km dari lokasi Anda",
    addressUnavailable: "Alamat tidak tersedia",
    bpjsBadge: "BPJS",
    tipTitle: "Cari kategori lain?",
    tipDesc: "Lihat semua kategori faskes yang tersedia.",
  },

  changeLocation: {
    headerTitle: "Ubah Lokasi",
    searchPlaceholder: "Cari alamat, kecamatan, atau kota...",
    emptySearchTitle: "Alamat tidak ditemukan",
    emptySearchSubtext: "Coba kata kunci lain, misal nama kecamatan atau kota",
    useCurrentGPS: "Gunakan Lokasi Saat Ini",
    savedLocationsSection: "LOKASI TERSIMPAN",
    emptySaved: "Belum ada lokasi tersimpan.",
    addNewLocation: "Tambah Lokasi Baru",
  },

  addLocation: {
    headerTitle: "Tambah Lokasi",
    searchPlaceholder: "Cari alamat, kecamatan, atau kota...",
    emptySearchTitle: "Alamat tidak ditemukan",
    emptySearchSubtext: "Coba kata kunci lain, misal nama kecamatan atau kota",
    change: "Ganti",
    locationNameLabel: "Nama Lokasi",
    locationNamePlaceholder: "Mis. Rumah, Kantor, Klinik Langganan",
    iconLabel: "Icon",
    saveButton: "Simpan Lokasi",
    savingButton: "Menyimpan...",
    alertFailTitle: "Gagal",
    alertFailDesc: "Lokasi gagal disimpan. Coba lagi.",
    iconOptions: {
      home: "Rumah",
      office: "Kantor",
      clinic: "Klinik",
      other: "Lainnya",
    },
  },

  searchResults: {
    searchPlaceholder: "Cari rumah sakit, klinik...",
    map: "Peta",
    list: "Daftar",
    selectLocation: "Pilih lokasi",
    nearest: "Terdekat",
    highestRating: "Rating Tertinggi",
    openNow: "Buka Sekarang",
    open24Hours: "Buka 24 Jam",
    acceptsBpjs: "Menerima BPJS",
    rating4Plus: "Rating 4+",
    faskesUnit: "faskes",
    straightLineDistance: "jarak garis lurus",
    emptyHasLocation: "Belum ada faskes terdaftar di sekitar Anda.",
    emptyNoLocation:
      "Lokasi Anda belum diketahui. Aktifkan izin lokasi atau pilih lokasi secara manual.",
    status24Hours: "Buka 24 Jam",
    statusNoHours: "Jam buka tidak tersedia",
    statusClosesAt: "Tutup Pukul {{time}}",
    statusClosedOpensAt: "Tutup (Buka {{time}})",
    directions: "Petunjuk Arah",
    viewDetails: "Lihat Detail",
  },

  searchFilter: {
    title: "Filter Pencarian",
    reset: "Reset",
    specialtyPoly: "Spesialisasi/Poli",
    maxDistance: "Jarak Maksimal",
    minRating: "Rating Minimum",
    availability: "Ketersediaan",
    openNow: "Buka Sekarang",
    open24Hours: "Buka 24 Jam",
    acceptsBpjs: "Menerima BPJS",
    applyFilter: "Terapkan Filter",
  },

  resetPassword: {
    headerTitle: "Buat Kata Sandi Baru",
    headerSubtitle: "Kata sandi baru harus berbeda dari yang sebelumnya",
    newPasswordLabel: "Kata Sandi Baru",
    newPasswordPlaceholder: "Minimal 8 karakter",
    confirmPasswordLabel: "Konfirmasi Kata Sandi",
    confirmPasswordPlaceholder: "Ulangi kata sandi baru",
    saveButton: "Simpan Kata Sandi Baru",
    processingButton: "Memproses...",
    errorBothRequired: "Kedua kolom wajib diisi.",
    errorMinLength: "Kata sandi minimal 8 karakter.",
    errorMismatch: "Konfirmasi kata sandi tidak cocok.",
    errorUpdateFailed: "Gagal mengubah kata sandi. Coba lagi.",
  },

  cancelReservation: {
    headerTitle: "Batalkan Reservasi",
    selectReasonLabel: "Pilih alasan pembatalan",
    reasonScheduleConflict: "Jadwal berbenturan dengan kegiatan lain",
    reasonRecoveredOrCancelled: "Sudah sembuh / tidak jadi berobat",
    reasonWrongFacilityOrService: "Salah pilih faskes atau layanan",
    reasonOther: "Lainnya",
    refundNote:
      "Reservasi metode Umum yang sudah dibayar akan diproses pengembalian dana secara manual oleh admin faskes.",
    confirmButton: "Konfirmasi Pembatalan",
    processingButton: "Memproses...",
    failedTitle: "Gagal",
    failedMessage: "Pembatalan gagal diproses. Coba lagi.",
    successTitle: "Reservasi Dibatalkan",
    successMessage: "Reservasi Anda telah dibatalkan.",
  },

  giveReview: {
    headerTitle: "Beri Ulasan",
    ratingQuestion: "Bagaimana pengalaman kunjungan Anda?",
    ratingVeryBad: "Sangat Buruk",
    ratingBad: "Buruk",
    ratingFair: "Cukup",
    ratingGood: "Baik",
    ratingVeryGood: "Sangat Baik",
    whatMadeYouSatisfied: "Apa yang membuat Anda puas?",
    tagFriendlyDoctor: "Dokter Ramah",
    tagFastService: "Pelayanan Cepat",
    tagCleanFacility: "Fasilitas Bersih",
    tagOnTime: "Tepat Waktu",
    tagOrderlyQueue: "Antrean Teratur",
    tellUsMore: "Ceritakan lebih lanjut (opsional)",
    inputPlaceholder: "Bagikan pengalaman Anda di sini...",
    submitButton: "Kirim Ulasan",
    submittingButton: "Mengirim...",
    failedTitle: "Gagal",
    failedMessage: "Ulasan gagal dikirim. Coba lagi.",
    successTitle: "Terima Kasih",
    successMessage: "Ulasan Anda telah dikirim.",
  },

  facilityList: {
    titleNearest: "Faskes Terdekat",
    titleHighestRating: "Rating Tertinggi",
    locationNotActiveTitle: "Lokasi Belum Aktif",
    locationNotActiveDesc:
      "Aktifkan izin lokasi untuk melihat faskes di sekitar Anda.",
    noFacilityTitle: "Belum Ada Faskes",
    noFacilityDesc:
      "Belum ada faskes dalam radius {radius} km dari lokasi Anda.",
    countText: "{count} faskes · {sortedBy}",
    sortedByRating: "diurutkan rating tertinggi",
    sortedByNearest: "diurutkan jarak terdekat",
    fromYourLocation: "dari lokasi Anda",
    open24Hours: "Buka 24 Jam",
    closedAt: "Tutup Pukul {time}",
    bpjsBadge: "BPJS",
  },

  confirmPayment: {
    headerTitle: "Konfirmasi Pembayaran",
    slotTimer: "Slot ditahan selama {time} lagi",
    bookingDetail: "Detail Pemesanan",
    selectPaymentMethod: "Pilih Metode Pembayaran",
    recommendation: "Rekomendasi",
    paymentSummary: "Rincian Pembayaran",
    consultationFee: "Biaya Konsultasi",
    serviceFee: "Biaya Layanan",
    total: "Total",
    payNowButton: "Bayar Sekarang",
    processingButton: "Memproses...",
    sessionFullTitle: "Sesi Sudah Penuh",
    sessionFullMessage:
      "Maaf, sesi ini baru saja penuh dipesan pasien lain. Silakan pilih sesi lain.",
    dailyQuotaFullTitle: "Kuota Hari Ini Penuh",
    dailyQuotaFullMessage:
      "Maaf, kuota pasien untuk layanan ini di tanggal tersebut sudah penuh. Silakan pilih tanggal lain.",
    failedTitle: "Gagal",
    failedMessage: "Pembayaran gagal diproses. Coba lagi.",
    successTitle: "Pembayaran Berhasil",
    successMessage: "Reservasi Anda telah dikonfirmasi.",
  },

  onboarding: {
    skip: "Lewati",
    next: "Lanjut",
    start: "Mulai",
    slide1: {
      title: "Temukan Faskes Terdekat",
      description:
        "Cari dan temukan fasilitas kesehatan di sekitarmu dengan mudah dan cepat.",
    },
    slide2: {
      title: "Cek Gejala dengan AI",
      description:
        "Dapatkan gambaran awal kondisi kesehatanmu lewat edukasi gejala berbasis AI.",
    },
    slide3: {
      title: "Booking Tanpa Antre Lama",
      description:
        "Pesan jadwal layanan kesehatan secara digital tanpa perlu menunggu lama.",
    },
  },

  ticketDetail: {
    headerTitle: "Tiket Reservasi",
    ticketNotFound: "Tiket tidak ditemukan.",
    statusTitle: {
      pendingBpjs: "Menunggu Konfirmasi Operator",
      pendingUmum: "Menunggu Pembayaran",
      confirmed: "Terkonfirmasi",
      ditolak: "Ditolak",
      dibatalkan: "Dibatalkan",
      selesai: "Selesai",
    },
    statusSubtitleBpjs:
      "Harap tunggu sementara petugas memverifikasi jadwal Anda.",
    rejectionReason: "Alasan: {reason}",
    queueNumberLabel: "Nomor Antrean Anda",
    queueNumberHint: "Nomor antrean muncul setelah dikonfirmasi petugas",
    qrHint: "Tunjukkan kode ini saat check-in di faskes",
    forPatient: "Untuk: {name}",
    myself: "Anda sendiri",
    paymentMethod: "Metode: {method}",
    bpjsNote:
      "Kelayakan BPJS akan dikonfirmasi ulang oleh petugas saat check-in. Pastikan membawa dokumen fisik jika diperlukan.",
    reviewPrompt: "Bagaimana pengalaman kunjungan Anda?",
    writeReviewButton: "Beri Ulasan",
    reviewSubmitted: "Terima kasih, ulasan Anda sudah dikirim",
    rescheduleButton: "Ubah Jadwal",
    cancelReservationButton: "Batalkan Reservasi",
    cancelModal: {
      title: "Batalkan Janji Temu",
      subtitle: "Apakah Anda yakin ingin membatalkan jadwal {service}{doctor}?",
      withDoctor: " dengan {name}",
      reasonLabel: "Alasan Pembatalan",
      reasons: [
        "Jadwal berbenturan dengan kegiatan lain",
        "Sudah sembuh / tidak jadi berobat",
        "Salah pilih faskes atau layanan",
        "Lainnya",
      ],
      refundNote:
        "Reservasi metode Umum yang sudah dibayar akan diproses pengembalian dana secara manual oleh admin faskes.",
      confirmButton: "Konfirmasi Pembatalan",
      processingButton: "Memproses...",
      backButton: "Kembali",
      failedTitle: "Gagal",
      failedMessage: "Pembatalan gagal diproses. Coba lagi.",
      successTitle: "Reservasi Dibatalkan",
      successMessage: "Reservasi Anda telah dibatalkan.",
    },
  },
};
