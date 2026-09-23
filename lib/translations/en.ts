// English translations.
// Add a new section here every time a screen is migrated to this i18n system.
// Keep the key structure IDENTICAL to id.ts so t() can fall back correctly.

export default {
  common: {
    loading: "Loading...",
    save: "Save",
    cancel: "Cancel",
    error: "Something went wrong. Please try again.",
  },

  login: {
    title: "Log in to VitaNear",
    subtitle: "Trusted healthcare, close to you",
    emailLabel: "Email",
    emailPlaceholder: "e.g. email@example.com",
    passwordLabel: "Password",
    passwordPlaceholder: "Enter your password",
    forgotPassword: "Forgot password?",
    loginButton: "Log In",
    loggingIn: "Processing...",
    or: "Or",
    continueWithGoogle: "Continue with Google",
    noAccount: "Don't have an account?",
    registerLink: "Sign up here",
    errorEmptyFields: "Email and password are required.",
    errorInvalidCredentials: "Incorrect email or password. Please try again.",
  },

  languageSettings: {
    title: "Language Settings",
  },

  tabs: {
    home: "Home",
    search: "Search",
    transactions: "Transactions",
    profile: "Profile",
  },

  register: {
    title: "Sign up for VitaNear",
    subtitle: "Trusted healthcare, close to you",

    emailLabel: "Email",
    emailPlaceholder: "e.g. email@example.com",
    passwordLabel: "Password",
    passwordPlaceholder: "Enter your password",
    passwordHint: "At least 8 characters",

    registerButton: "Sign Up",
    registering: "Processing...",
    or: "Or",
    continueWithGoogle: "Sign up with Google",
    haveAccount: "Already have an account?",
    loginLink: "Log in here",

    errorEmptyFields: "Email and password are required.",
    errorInvalidEmail: "Invalid email format.",
    errorPasswordTooShort: "Password must be at least 8 characters.",
    errorEmailTaken:
      "This email is already registered. Try logging in, or use a different email.",
    errorRateLimit: "Too many attempts. Please try again shortly.",
    errorGeneric: "Registration failed. Please try again.",
    successMessage:
      "Registration successful! Please check your email to verify.",
  },

  otp: {
    title: "Enter OTP Code",
    subtitlePrefix: "Code sent to",
    resendPrefix: "Resend code in 00:",
    resendActive: "Resend Code",
    resending: "Sending...",
    verifyButton: "Verify",
    verifying: "Verifying...",
    errorInvalidOtp: "Incorrect or expired code. Please try again.",
    errorResendGeneric: "Failed to resend code. Please try again shortly.",
  },

  completeProfile: {
    title: "Complete Your Profile",
    subtitle:
      "Your personal data will be used for registration and verification.",

    permissionTitle: "Permission Required",
    permissionMessage: "Allow gallery access to choose a photo.",

    fullNameLabel: "Full Name",
    fullNamePlaceholder: "Enter your full name",

    birthDateLabel: "Date of Birth",
    birthDatePlaceholder: "Select date of birth",
    dateLocale: "en-US",

    nikLabel: "NIK (National ID Number)",
    nikPlaceholder: "e.g. 3573xxxxxxxxxxxx",
    nikHelper: "Must be exactly 16 digits, matching your ID card (KTP).",

    genderLabel: "Gender",
    genderMale: "Male",
    genderFemale: "Female",

    phoneLabel: "Phone Number",
    phonePlaceholder: "812-3456-789",

    consentText:
      "I confirm that the information I've entered is true and matches my identity.",

    saveButton: "Save & Continue",
    saving: "Saving...",
    uploadingPhoto: "Uploading photo...",

    errorEmptyFields: "All fields are required.",
    errorNikLength: "NIK must be exactly 16 digits.",
    errorConsentRequired: "Please confirm the data accuracy statement first.",
    errorSessionNotFound: "Session not found. Please log in again.",
    errorSaveFailed: "Failed to save profile. Please try again.",
    datePickerTitle: "Select Date of Birth",
    datePickerConfirm: "Confirm",
    datePickerCancel: "Cancel",
  },

  editProfile: {
    title: "Edit Profile",

    permissionTitle: "Permission Required",
    permissionMessage: "Allow gallery access to choose a photo.",

    fullNameLabel: "Full Name",
    fullNamePlaceholder: "Enter your full name",

    birthDateLabel: "Date of Birth",
    birthDatePlaceholder: "Select date of birth",
    dateLocale: "en-US",

    nikLabel: "NIK (National ID Number)",
    nikPlaceholder: "e.g. 3578012345670001",
    nikHelper: "Must be exactly 16 digits, matching your ID card (KTP).",

    genderLabel: "Gender",
    genderMale: "Male",
    genderFemale: "Female",

    phoneLabel: "Phone Number",
    phonePlaceholder: "8123456789",

    saveButton: "Save Changes",
    saving: "Saving...",
    uploadingPhoto: "Uploading photo...",

    errorEmptyFields:
      "Make sure all fields are filled and NIK is exactly 16 digits.",
    errorSessionNotFound: "Session not found.",
    errorUploadTitle: "Failed to upload photo",
    errorUploadMessage:
      "Other data has not been saved. Try again, or save without changing the photo.",
    errorSaveFailed: "Failed to save changes. Please try again.",
  },

  familyMembers: {
    title: "Family Members",

    emptyTitle: "No family members yet",
    emptyText:
      "Add family members so you can make reservations for them, without needing a separate account.",

    counterOf: "of",
    counterMembers: "members",

    ageMonthsSuffix: "mo",
    ageYearsSuffix: "yr",

    deleteTitle: "Remove Member",
    deleteConfirmPrefix: "Remove ",
    deleteConfirmSuffix: " from your family list?",
    deleteButton: "Remove",

    limitTitle: "Limit Reached",
    limitMessagePrefix: "Maximum ",
    limitMessageSuffix:
      " family members per account. Remove one to add a new one.",

    addButton: "Add Family Member",
    limitReached: "Member Limit Reached",

    relationHusband: "Husband",
    relationWife: "Wife",
    relationChild: "Child",
    relationParent: "Parent",
    relationOther: "Other",
  },

  addFamilyMember: {
    titleAdd: "Add Member",
    titleEdit: "Edit Member",

    fullNameLabel: "Full Name",
    fullNamePlaceholder: "Enter full name",

    birthDateLabel: "Date of Birth",

    nikLabel: "NIK (Optional)",
    nikPlaceholder: "16-digit NIK",

    relationLabel: "Family Relation",

    bpjsLabel: "BPJS/Insurance No. (Optional)",
    bpjsPlaceholder: "Enter BPJS or insurance number",

    errorRequiredFields:
      "Name, date of birth, gender, and relation are required.",
    errorLimitPrefix: "Maximum ",
    errorLimitSuffix: " family members per account.",
    errorSaveFailed: "Failed to save. Please try again.",

    saveButton: "Save Member",
  },

  symptomChecker: {
    title: "Symptom Check",
    resultTitle: "Symptom Check Result",

    durationLess24h: "< 24 hrs",
    duration1to3Days: "1–3 days",
    durationMore3Days: "> 3 days",
    durationMore1Week: "> 1 week",

    severityMild: "Mild",
    severityModerate: "Moderate",
    severitySevere: "Severe",

    symptomFever: "Fever",
    symptomNauseaVomit: "Nausea / Vomiting",
    symptomDizzy: "Dizziness",
    symptomShortBreath: "Shortness of breath",
    symptomPain: "Pain",
    symptomItchRash: "Itching / Rash",
    symptomOther: "Other",

    aiStepReading: "Reading your complaint",
    aiStepAnalyzing: "Analyzing symptoms & severity",
    aiStepComposing: "Composing relevant guidance",
    aiStepMatching: "Matching facility category",

    stepLabelComplaint: "Complaint",
    stepLabelDuration: "Duration",
    stepLabelSeverity: "Severity",
    stepLabelOtherSymptoms: "Other Symptoms",

    urgencyLowLabel: "Low Urgency",
    urgencyModerateLabel: "Moderate Urgency",
    urgencyHighLabel: "High Urgency — Seek Care Now",

    resultDisclaimerNote:
      "This result is general education, not a medical diagnosis.",
    summaryTitle: "Educational Summary",
    adviceTitle: "Advice",
    categoryLabel: "Suggested facility category",
    searchCategoryButton: "Search This Category",
    checkOtherButton: "Check Other Symptoms",

    loadingTitle: "AI is analyzing",
    loadingSubtitle: "Please wait a moment, usually just a few seconds.",

    heroTitle: "Tell Us Your Symptoms",
    heroSubtitle:
      "VitaNear's health education assistant helps you understand your condition.",
    aiDisclaimerNote:
      "AI can make mistakes. Always consult a healthcare professional.",

    step0Title: "What's your main complaint?",
    step0Hint: "E.g. stomach pain since yesterday, persistent cough, etc.",
    step0Placeholder: "Write your complaint here...",

    step1Title: "How long have you felt this?",
    step2Title: "How severe is it?",
    step3Title: "Any accompanying symptoms? (optional)",
    step3Placeholder: "Describe the other symptom...",

    nextButton: "Next",
    seeResultButton: "See Result",

    errorSubmit: "Failed to process. Check your connection and try again.",
  },

  profile: {
    defaultName: "VitaNear User",

    menuFamilyMembers: "Family Members List",
    menuInsurance: "Insurance Information",
    menuSecurity: "Security & Password",
    menuHelp: "Help Center / FAQ",

    logoutConfirmTitle: "Log Out",
    logoutConfirmMessage: "Are you sure you want to log out?",
    logoutButton: "Log Out",
    logoutAccount: "Log Out",
  },

  helpCenter: {
    title: "Help Center",
    teamName: "VitaNear Team",
    greetingPrefix: "How can we",
    greetingAccent: "help you?",
    subtitle:
      "Find answers regarding reservations, payments, and your account.",
    questionsSuffix: "questions",
  },

  insurance: {
    title: "Insurance Information",
    bpjsTitle: "BPJS Health",
    bpjsNumberLabel: "BPJS Card Number",
    bpjsNumberPlaceholder: "0001234567890",
    faskes1Label: "Tier-1 Health Facility",
    faskes1Placeholder: "Registered clinic/health center name",
    bpjsInfoText:
      "BPJS requires a referral from a Tier-1 facility for specialist consultations, except emergencies. This data will be verified during check-in and automatically used for future BPJS bookings.",
    privateTitle: "Private Insurance",
    optionalTag: "(optional)",
    providerLabel: "Provider Name",
    providerPlaceholder: "e.g. Prudential, Allianz, etc.",
    policyNumberLabel: "Policy Number",
    policyNumberPlaceholder: "Enter your policy number",
    badgeFilled: "Filled",
    badgeEmpty: "Not filled",
    errorSessionNotFound: "Session not found.",
    errorSaveFailed: "Failed to save. Please try again.",
    saveButton: "Save",
    savingButton: "Saving...",
  },

  security: {
    title: "Security & Password",
    heroTitle: "Protect your account",
    heroSubtitle:
      "Update your password regularly and manage devices currently logged in.",
    changePasswordTitle: "Change Password",
    changePasswordDesc:
      "Use a unique password that is not used for other services.",
    currentPasswordLabel: "Current Password",
    currentPasswordPlaceholder: "Enter current password",
    currentPasswordHint: "Required to confirm it's really you.",
    newPasswordLabel: "New Password",
    newPasswordPlaceholder: "At least 8 characters",
    newPasswordHint:
      "At least 8 characters, a combination of letters and numbers is recommended.",
    confirmPasswordLabel: "Confirm New Password",
    confirmPasswordPlaceholder: "Re-enter new password",
    confirmPasswordHint: "Re-type your new password.",
    passwordMatch: "Passwords match.",
    passwordMismatch: "Password confirmation does not match.",

    // Password Strength Labels
    strengthTooShort: "Too short",
    strengthFair: "Fair",
    strengthGood: "Good",
    strengthStrong: "Strong",

    // Device Sessions
    deviceSessionsTitle: "Device Sessions",
    deviceSessionsDesc:
      "Log out from all devices currently logged into this account, including this one.",
    logoutAllButton: "Log Out from All Devices",
    logoutAllAlertTitle: "Log Out from All Devices",
    logoutAllAlertMessage:
      "You will be logged out from all active sessions, including this device. Continue?",

    // Validation Errors & Messages
    errorCurrentRequired: "Current password is required.",
    errorNewRequired: "New password is required.",
    errorNewMinLength: "New password must be at least 8 characters.",
    errorNewSameAsCurrent:
      "New password cannot be the same as current password.",
    errorConfirmRequired: "Password confirmation is required.",
    errorConfirmMismatch: "Password confirmation does not match.",
    errorCurrentWrong: "Current password is incorrect.",
    errorGeneric: "Failed to change password. Please try again.",
    successMessage: "Password updated successfully.",
    saveButton: "Save New Password",
    processingButton: "Processing...",
  },

  transactions: {
    title: "Transaction History",
    subtitle: "Track your registration and transaction status.",

    // Filter Labels
    filterAll: "All",
    filterCompleted: "Completed",
    filterInProcess: "In Process",
    filterRejected: "Rejected",
    filterCancelled: "Cancelled",

    // Status & Badges
    upcomingBadge: "Upcoming",
    selfPatient: "Yourself",

    // Dates
    today: "Today",
    yesterday: "Yesterday",

    // Reviews
    reviewPrompt: "How was your experience?",
    reviewThanks: "Thank you for your review",
    giveReviewButton: "Leave Review",

    // Empty States
    emptyTitle: "No transactions yet",
    emptyDescription:
      "Your transaction history will appear here once you make a reservation.",
    emptyFilterPrefix: 'No transactions with status "',
    emptyFilterSuffix: '".',
  },

  searchScreen: {
    title: "Find Facility",
    selectLocation: "Select location",
    searchPlaceholder: "Search hospital, clinic, or service...",
    popularCategories: "Popular Categories",
    quickSearch: "Quick Search",

    // Quick Shortcuts
    shortcutOpenNow: "Open Now",
    shortcutOpen24h: "Open 24 Hours",
    shortcutAcceptBpjs: "Accepts BPJS",
    shortcutRating4: "Rating 4+",

    // Symptom Checker Banner
    aiTitle: "Not sure which clinic to visit?",
    aiSubtitle:
      "Describe your symptoms, AI will give an initial overview and suggest facility categories.",
    aiButton: "Check Symptoms",
  },

  homeScreen: {
    currentLocation: "Current Location",
    enableLocation: "Enable location",
    detectingLocation: "Detecting location...",
    aiBadge: "HEALTH EDUCATION AI",
    aiTitle: "Understand your symptoms",
    checkSymptomsButton: "Check Symptoms",
    otherCategory: "More",
    nearbyFacilities: "Nearby Health Facilities",
    seeAll: "See All",
    emptyNearby: "No health facilities found around your location.",
    topRatedFacilities: "Top Rated",
    emptyTopRated: "No facility data available.",
    viewDetailButton: "View Details",
    open24Hours: "Open 24 Hours",
    closesAtPrefix: "Closes at ",
  },

  allCategories: {
    title: "All Categories",
    tipTitle: "Didn't find a matching category?",
    tipDesc:
      "Try searching for health facilities directly via the Search menu.",
  },

  facilityDetail: {
    notFound: "Facility not found.",
    open24Hours: "Open 24 Hours",
    hoursUnavailable: "Operating hours unavailable",
    openUntilPrefix: "Open · Closes ",
    closedUntilPrefix: "Closed · Opens ",
    reviewsCountSuffix: " reviews",
    acceptsBpjs: "Accepts BPJS",
    addressUnavailable: "Address unavailable",
    operatingHoursPrefix: "Operating hours: ",
    callButton: "Call",
    routeButton: "Directions",
    shareButton: "Share",
    facilityParking: "Parking",
    facilityWifi: "WiFi",
    facilityAc: "AC",
    aboutSection: "About",
    servicesSection: "Services & Clinics",
    reservationButton: "Book Now",
    patientReviewsSection: "Patient Reviews",
    seeAllReviews: "See all",
    emptyReviews: "No reviews for this facility yet.",
    defaultUser: "User",
    facilityReply: "Facility Reply",
  },

  allReviews: {
    title: "All Reviews",
    reviewsCountSuffix: " reviews",
    emptyReviews: "No reviews yet.",
    defaultUser: "User",
    facilityReply: "Facility Reply",
  },

  notifications: {
    title: "Notifications",
    markAllRead: "Mark all as read",
    today: "Today",
    yesterday: "Yesterday",
    emptyTitle: "No Notifications Yet",
    emptyCaption: "Notifications about your reservations will appear here",
  },

  startReservation: {
    titlePatient: "Who is this reservation for?",
    defaultSelf: "Myself",
    yearsOldSuffix: " yrs",
    addNewMember: "Add New Family Member",
    continueButton: "Continue",
    titleMethod: "Select Reservation Method",
    patientForPrefix: "For: ",
    selfBookingTitle: "Regular Reservation",
    selfBookingDesc: "Select exact date & time, pay online",
    bpjsBookingTitle: "BPJS Reservation",
    bpjsBookingDescActive: "Select date, get queue number",
    bpjsBookingDescInactive: "This facility does not accept BPJS",
  },

  selectSchedule: {
    headerTitle: "Select Schedule",
    emptyDoctor: "No doctors available for this service.",
    selectDate: "Select Date",
    selectSession: "Select Session",
    emptySession: "No practice schedule on this date.",
    fullQuota: "Full",
    remainingQuota: "{{remaining}}/{{total}} left",
    totalFee: "Total Fee",
    continueButton: "Continue",
    days: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    months: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],
  },

  bpjsReservation: {
    headerTitle: "BPJS Reservation",
    selectVisitDate: "Select Visit Date",
    quotaFull: "Quota Full",
    remainingQuota: "Remaining quota: {{remaining}} of {{total}}",
    infoNote:
      "Queue number and estimated time will be issued after BPJS card verification by facility operator.",
    submitting: "Submitting...",
    getQueueNumber: "Get Queue Number",
    alertFailedTitle: "Failed",
    alertFailedMsg: "Reservation failed to submit. Please try again.",
    alertSuccessTitle: "Reservation Submitted",
    alertSuccessMsg:
      "BPJS reservation submitted successfully, awaiting facility admin verification.",
    days: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    months: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],
  },

  categoryResult: {
    defaultTitle: "Category",
    searching: "Searching healthcare facilities for you...",
    foundWithLocation: "{{count}} facilities found near you",
    foundWithoutLocation: "{{count}} facilities found",
    sortByDistance: "Sorted by nearest distance",
    sortByRating: "Sorted by highest rating",
    emptyTitle: "No Facilities Found",
    emptyText:
      'There are no healthcare facilities for the "{{category}}" category near you at the moment.',
    open24Hours: "Open 24 Hours",
    closesAt: "Closes at {{time}}",
    kmFromLocation: "{{distance}} km from your location",
    addressUnavailable: "Address unavailable",
    bpjsBadge: "BPJS",
    tipTitle: "Search other categories?",
    tipDesc: "View all available facility categories.",
  },

  changeLocation: {
    headerTitle: "Change Location",
    searchPlaceholder: "Search address, district, or city...",
    emptySearchTitle: "Address not found",
    emptySearchSubtext: "Try another keyword, e.g. district or city name",
    useCurrentGPS: "Use Current Location",
    savedLocationsSection: "SAVED LOCATIONS",
    emptySaved: "No saved locations yet.",
    addNewLocation: "Add New Location",
  },

  addLocation: {
    headerTitle: "Add Location",
    searchPlaceholder: "Search address, district, or city...",
    emptySearchTitle: "Address not found",
    emptySearchSubtext: "Try another keyword, e.g. district or city name",
    change: "Change",
    locationNameLabel: "Location Name",
    locationNamePlaceholder: "E.g. Home, Office, Preferred Clinic",
    iconLabel: "Icon",
    saveButton: "Save Location",
    savingButton: "Saving...",
    alertFailTitle: "Failed",
    alertFailDesc: "Failed to save location. Please try again.",
    iconOptions: {
      home: "Home",
      office: "Office",
      clinic: "Clinic",
      other: "Other",
    },
  },

  searchResults: {
    searchPlaceholder: "Search hospital, clinic...",
    map: "Map",
    list: "List",
    selectLocation: "Select location",
    nearest: "Nearest",
    highestRating: "Highest Rating",
    openNow: "Open Now",
    open24Hours: "Open 24 Hours",
    acceptsBpjs: "Accepts BPJS",
    rating4Plus: "Rating 4+",
    faskesUnit: "facilities",
    straightLineDistance: "straight-line distance",
    emptyHasLocation: "No healthcare facilities found nearby.",
    emptyNoLocation:
      "Your location is unknown. Enable location permission or select location manually.",
    status24Hours: "Open 24 Hours",
    statusNoHours: "Opening hours unavailable",
    statusClosesAt: "Closes at {{time}}",
    statusClosedOpensAt: "Closed (Opens at {{time}})",
    directions: "Directions",
    viewDetails: "View Details",
  },

  searchFilter: {
    title: "Search Filters",
    reset: "Reset",
    specialtyPoly: "Specialty/Clinic",
    maxDistance: "Maximum Distance",
    minRating: "Minimum Rating",
    availability: "Availability",
    openNow: "Open Now",
    open24Hours: "Open 24 Hours",
    acceptsBpjs: "Accepts BPJS",
    applyFilter: "Apply Filters",
  },

  resetPassword: {
    headerTitle: "Create New Password",
    headerSubtitle:
      "Your new password must be different from previous passwords",
    newPasswordLabel: "New Password",
    newPasswordPlaceholder: "Minimum 8 characters",
    confirmPasswordLabel: "Confirm Password",
    confirmPasswordPlaceholder: "Repeat new password",
    saveButton: "Save New Password",
    processingButton: "Processing...",
    errorBothRequired: "Both fields are required.",
    errorMinLength: "Password must be at least 8 characters.",
    errorMismatch: "Passwords do not match.",
    errorUpdateFailed: "Failed to update password. Please try again.",
  },

  cancelReservation: {
    headerTitle: "Cancel Reservation",
    selectReasonLabel: "Select cancellation reason",
    reasonScheduleConflict: "Schedule conflict with another activity",
    reasonRecoveredOrCancelled: "Recovered / decided not to seek treatment",
    reasonWrongFacilityOrService: "Wrong facility or service selected",
    reasonOther: "Other",
    refundNote:
      "Paid General reservations will be processed for refund manually by facility admin.",
    confirmButton: "Confirm Cancellation",
    processingButton: "Processing...",
    failedTitle: "Failed",
    failedMessage: "Failed to process cancellation. Please try again.",
    successTitle: "Reservation Cancelled",
    successMessage: "Your reservation has been cancelled.",
  },

  giveReview: {
    headerTitle: "Leave a Review",
    ratingQuestion: "How was your visit experience?",
    ratingVeryBad: "Very Bad",
    ratingBad: "Bad",
    ratingFair: "Fair",
    ratingGood: "Good",
    ratingVeryGood: "Very Good",
    whatMadeYouSatisfied: "What made you satisfied?",
    tagFriendlyDoctor: "Friendly Doctor",
    tagFastService: "Fast Service",
    tagCleanFacility: "Clean Facility",
    tagOnTime: "On Time",
    tagOrderlyQueue: "Orderly Queue",
    tellUsMore: "Tell us more (optional)",
    inputPlaceholder: "Share your experience here...",
    submitButton: "Submit Review",
    submittingButton: "Submitting...",
    failedTitle: "Failed",
    failedMessage: "Failed to send review. Please try again.",
    successTitle: "Thank You",
    successMessage: "Your review has been submitted.",
  },

  facilityList: {
    titleNearest: "Nearest Healthcare Facilities",
    titleHighestRating: "Top Rated",
    locationNotActiveTitle: "Location Services Off",
    locationNotActiveDesc:
      "Enable location permissions to view healthcare facilities around you.",
    noFacilityTitle: "No Healthcare Facilities Found",
    noFacilityDesc:
      "No healthcare facilities found within {radius} km radius from your location.",
    countText: "{count} facilities · {sortedBy}",
    sortedByRating: "sorted by highest rating",
    sortedByNearest: "sorted by nearest distance",
    fromYourLocation: "from your location",
    open24Hours: "Open 24 Hours",
    closedAt: "Closes at {time}",
    bpjsBadge: "BPJS",
  },

  confirmPayment: {
    headerTitle: "Payment Confirmation",
    slotTimer: "Slot held for another {time}",
    bookingDetail: "Booking Details",
    selectPaymentMethod: "Select Payment Method",
    recommendation: "Recommended",
    paymentSummary: "Payment Summary",
    consultationFee: "Consultation Fee",
    serviceFee: "Service Fee",
    total: "Total",
    payNowButton: "Pay Now",
    processingButton: "Processing...",
    sessionFullTitle: "Session Full",
    sessionFullMessage:
      "Sorry, this session was just fully booked by another patient. Please select another session.",
    dailyQuotaFullTitle: "Daily Quota Full",
    dailyQuotaFullMessage:
      "Sorry, the patient quota for this service on that date is full. Please select another date.",
    failedTitle: "Failed",
    failedMessage: "Failed to process payment. Please try again.",
    successTitle: "Payment Successful",
    successMessage: "Your reservation has been confirmed.",
  },

  onboarding: {
    skip: "Skip",
    next: "Next",
    start: "Get Started",
    slide1: {
      title: "Find Nearby Facilities",
      description:
        "Discover and locate nearby healthcare facilities quickly and easily.",
    },
    slide2: {
      title: "Check Symptoms with AI",
      description:
        "Get initial insights into your health condition through AI-driven symptom education.",
    },
    slide3: {
      title: "Book Without Long Queues",
      description:
        "Schedule your healthcare appointments digitally without waiting in long lines.",
    },
  },

  ticketDetail: {
    headerTitle: "Reservation Ticket",
    ticketNotFound: "Ticket not found.",
    statusTitle: {
      pendingBpjs: "Awaiting Operator Confirmation",
      pendingUmum: "Awaiting Payment",
      confirmed: "Confirmed",
      ditolak: "Rejected",
      dibatalkan: "Cancelled",
      selesai: "Completed",
    },
    statusSubtitleBpjs:
      "Please wait while staff verify your appointment schedule.",
    rejectionReason: "Reason: {reason}",
    queueNumberLabel: "Your Queue Number",
    queueNumberHint: "Queue number will appear after confirmation",
    qrHint: "Show this code upon check-in at the facility",
    forPatient: "For: {name}",
    myself: "Yourself",
    paymentMethod: "Method: {method}",
    bpjsNote:
      "BPJS eligibility will be re-confirmed by staff upon check-in. Make sure to bring required physical documents.",
    reviewPrompt: "How was your visit experience?",
    writeReviewButton: "Write a Review",
    reviewSubmitted: "Thank you, your review has been submitted",
    rescheduleButton: "Reschedule",
    cancelReservationButton: "Cancel Reservation",
    cancelModal: {
      title: "Cancel Appointment",
      subtitle:
        "Are you sure you want to cancel the {service}{doctor} appointment?",
      withDoctor: " with {name}",
      reasonLabel: "Reason for Cancellation",
      reasons: [
        "Schedule conflicts with another activity",
        "Recovered / cancelled treatment",
        "Wrong facility or service selected",
        "Others",
      ],
      refundNote:
        "Paid General method reservations will be processed for manual refund by the facility admin.",
      confirmButton: "Confirm Cancellation",
      processingButton: "Processing...",
      backButton: "Back",
      failedTitle: "Failed",
      failedMessage: "Failed to process cancellation. Please try again.",
      successTitle: "Reservation Cancelled",
      successMessage: "Your reservation has been cancelled.",
    },
  },
};
