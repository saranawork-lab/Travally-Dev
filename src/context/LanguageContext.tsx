"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type LanguageCode = "en" | "hi" | "te" | "ta" | "kn";

export interface TranslationDictionary {
  // Navigation
  home: string;
  discover: string;
  create: string;
  requests: string;
  chats: string;
  profile: string;
  settings: string;

  // Header & Navbar
  searchPlaceholder: string;
  login: string;
  joinFree: string;
  notifications: string;
  markAllRead: string;
  noNotifications: string;

  // Primary Modes & Feeds
  companion: string;
  travel: string;
  discoverCompanions: string;
  discoverTravel: string;
  allActivities: string;
  allStyles: string;
  createActivity: string;
  createTrip: string;

  // Filters & Sorting
  allCategories: string;
  filterByCategory: string;
  sortLabel: string;
  sortSoonest: string;
  sortSpotsLeft: string;
  sortNewest: string;
  sortName: string;
  sortDestination: string;
  filterByTravelStyle: string;
  spotsAvailable: string;

  // Empty state messages
  noActivitiesFound: string;
  noActivitiesDesc: string;
  noTripsFound: string;
  noTripsDesc: string;

  // Requests Page
  receivedRequests: string;
  sentRequests: string;
  noRequestsReceived: string;
  noRequestsReceivedDesc: string;
  noRequestsSent: string;
  noRequestsSentDesc: string;
  exploreDiscoverFeed: string;
  accept: string;
  decline: string;

  // Chats Page
  chatsTitle: string;
  searchConversations: string;
  noConversations: string;
  noConversationsDesc: string;
  encryptedMessage: string;
  privateGateTitle: string;
  privateGateDesc: string;
  chatExpiredTitle: string;
  chatExpiredDesc: string;
  returnToDiscover: string;
  returnToChats: string;
  tapToMessage: string;
  callBtn: string;
  e2eeNotice: string;

  // Profile Page
  myProfile: string;
  editProfile: string;
  saveProfile: string;
  bio: string;
  interests: string;
  city: string;
  travallyPass: string;
  digitalIdentityPass: string;
  tapCardToFlip: string;
  copyId: string;
  copied: string;
  copyPass: string;
  passNumberCopied: string;
  verifiedBadges: string;
  verifiedBadgesDesc: string;
  identityVerification: string;
  verifiedMember: string;
  unverifiedMember: string;
  verifiedMemberDesc: string;
  unverifiedMemberDesc: string;
  tierLabel: string;
  meetupsLabel: string;
  tripsLabel: string;
  sinceLabel: string;
  travallyCardBtn: string;

  // Settings Header & Cards
  settingsTitle: string;
  account: string;
  accountInfo: string;
  changePassword: string;
  changePasswordSub: string;
  emailPrefs: string;
  pushNotifs: string;
  privacyDiscovery: string;
  onlineStatus: string;
  blockedUsers: string;
  security: string;
  securityE2EE: string;
  safetyCenter: string;
  appearance: string;
  darkMode: string;
  language: string;
  dataStorage: string;
  storageUsage: string;
  downloadData: string;
  clearCache: string;
  helpSupport: string;
  helpCenter: string;
  contactSupport: string;
  termsOfService: string;
  privacyPolicy: string;
  about: string;
  aboutTravally: string;
  accountActions: string;
  signOut: string;
  deactivateOrDelete: string;

  // Common actions
  savePreferences: string;
  cancel: string;
  close: string;
  updatePassword: string;
  deleteForever: string;
  deactivateAccount: string;

  // Create Flow & Detail Pages
  postActivityTitle: string;
  postTripTitle: string;
  chooseCategoryStep1: string;
  fillDetailsStep2: string;
  popularBadge: string;
  selectedCategoryTag: string;
  selectedTravelStyle: string;
  changeTag: string;
  changeStyle: string;
  activityTitleLabel: string;
  activityTitlePlaceholder: string;
  descriptionPlanLabel: string;
  descriptionPlanPlaceholder: string;
  dateLabel: string;
  startTimeLabel: string;
  durationLabel: string;
  genderPrefLabel: string;
  closeReqsLabel: string;
  joiningReqsLabel: string;
  joiningReqsPlaceholder: string;
  coverImageLabel: string;
  clickToUpload: string;
  organizerReviewSafety: string;
  organizerReviewSafetyDesc: string;
  backToTags: string;
  backToStyles: string;
  publishActivity: string;
  publishTrip: string;
  publishing: string;
  destinationLabel: string;
  departureCityLabel: string;
  startDateLabel: string;
  endDateLabel: string;
  minBudgetLabel: string;
  maxBudgetLabel: string;
  accommodationLabel: string;
  transitPrefLabel: string;
  attractionsLabel: string;
  addAttractionBtn: string;
  activityDetailsTitle: string;
  tripDetailsTitle: string;
  backToDiscover: string;
  requestToJoin: string;
  cancelRequest: string;
  requestSent: string;
  chatUnlocked: string;
  share: string;
  report: string;
  deleteBtn: string;
  organizerLabel: string;
  confirmedMembers: string;

  // Companion Categories (Titles & Hints)
  catFoodTitle: string;
  catFoodHint: string;
  catMoviesTitle: string;
  catMoviesHint: string;
  catSportsTitle: string;
  catSportsHint: string;
  catTechTitle: string;
  catTechHint: string;
  catPubsTitle: string;
  catPubsHint: string;
  catShoppingTitle: string;
  catShoppingHint: string;
  catDrivesTitle: string;
  catDrivesHint: string;
  catOtherTitle: string;
  catOtherHint: string;

  // Travel Styles (Titles & Descriptions)
  styleBikersTitle: string;
  styleBikersDesc: string;
  styleCulturalTitle: string;
  styleCulturalDesc: string;
  styleSlowTravelTitle: string;
  styleSlowTravelDesc: string;
  styleBackpackingTitle: string;
  styleBackpackingDesc: string;
  styleAdventureTitle: string;
  styleAdventureDesc: string;
  styleRoadTripTitle: string;
  styleRoadTripDesc: string;
  styleLuxuryTitle: string;
  styleLuxuryDesc: string;
  styleRelaxationTitle: string;
  styleRelaxationDesc: string;

  // Dropdown Options
  genderAny: string;
  genderWomenOnly: string;
  genderMenOnly: string;

  cutoff1Hour: string;
  cutoff30Mins: string;
  cutoff2Hours: string;
  cutoff3Hours: string;
  cutoff6Hours: string;
  cutoff12Hours: string;
  cutoff24Hours: string;

  accHostel: string;
  accHotel: string;
  accLuxury: string;
  accFlexible: string;

  transitTrain: string;
  transitFlight: string;
  transitBus: string;
  transitSelfDrive: string;
  transitFlexible: string;
}

const translations: Record<LanguageCode, TranslationDictionary> = {
  en: {
    home: "Home",
    discover: "Discover",
    create: "Create",
    requests: "Requests",
    chats: "Chats",
    profile: "Profile",
    settings: "Settings",

    searchPlaceholder: "Search activities, trips, vibes...",
    login: "Log In",
    joinFree: "Join Free",
    notifications: "Notifications",
    markAllRead: "Mark all read",
    noNotifications: "No notifications yet",

    companion: "Companion",
    travel: "Travel",
    discoverCompanions: "Discover Companions",
    discoverTravel: "Discover Travel",
    allActivities: "All Activities",
    allStyles: "All Styles",
    createActivity: "Create an Activity",
    createTrip: "Create a Trip Plan",

    allCategories: "All Categories",
    filterByCategory: "Filter by Category",
    sortLabel: "Sort",
    sortSoonest: "Soonest",
    sortSpotsLeft: "Spots Left",
    sortNewest: "Newest",
    sortName: "Name",
    sortDestination: "Destination",
    filterByTravelStyle: "Filter by Travel Style",
    spotsAvailable: "Spots Available",

    noActivitiesFound: "No activities match your filter",
    noActivitiesDesc: "Be the first to organize an activity for this category in your area!",
    noTripsFound: "No expeditions found for this destination or style",
    noTripsDesc: "Publish your upcoming destination and connect with fellow explorers traveling at the same time.",

    receivedRequests: "Received",
    sentRequests: "Sent",
    noRequestsReceived: "No join requests received yet",
    noRequestsReceivedDesc: "When people express interest in your activities or travel expeditions, they will appear here for review.",
    noRequestsSent: "You haven't requested to join any activities yet",
    noRequestsSentDesc: 'Explore activities or travel plans and click "Join Activity" or "Join Expedition".',
    exploreDiscoverFeed: "Explore Discover Feed",
    accept: "Accept",
    decline: "Decline",

    chatsTitle: "Chats",
    searchConversations: "Search conversations...",
    noConversations: "No conversations yet",
    noConversationsDesc: "When an organizer accepts your request, your private encrypted group chat will appear right here.",
    encryptedMessage: "🔒 Encrypted message",
    privateGateTitle: "Private Group Gate",
    privateGateDesc: "This private group chat is protected. Direct messaging unlocks automatically once your join request is accepted by the host.",
    chatExpiredTitle: "Chat Expired & Deleted",
    chatExpiredDesc: "In accordance with Travally’s privacy policy, this chat reached its 7-day validity period after event completion and was permanently deleted from the database.",
    returnToDiscover: "Return to Discover",
    returnToChats: "Return to Chats",
    tapToMessage: "Tap to message",
    callBtn: "Call",
    e2eeNotice: "Messages and calls are end-to-end encrypted. No one outside of this chat, not even Travally, can read or listen to them. Tap to learn more.",

    myProfile: "My Profile",
    editProfile: "Edit Profile",
    saveProfile: "Save Profile",
    bio: "Bio",
    interests: "Interests",
    city: "City",
    travallyPass: "Travally Pass",
    digitalIdentityPass: "DIGITAL IDENTITY PASS",
    tapCardToFlip: "Tap card to flip",
    copyId: "Copy ID",
    copied: "Copied!",
    copyPass: "Copy Pass",
    passNumberCopied: "Pass Number Copied!",
    verifiedBadges: "Verified Badges",
    verifiedBadgesDesc: "Your badges build trust across activity groups and companion listings.",
    identityVerification: "Identity Verification",
    verifiedMember: "Verified Member",
    unverifiedMember: "Unverified Member",
    verifiedMemberDesc: "Identity verified by Travally.",
    unverifiedMemberDesc: "Connect LinkedIn profile to display verified badge on activities.",
    tierLabel: "Tier",
    meetupsLabel: "Meetups",
    tripsLabel: "Trips",
    sinceLabel: "Since",
    travallyCardBtn: "Travally Card",

    settingsTitle: "Settings",
    account: "Account",
    accountInfo: "Account Information",
    changePassword: "Change Password",
    changePasswordSub: "Update your account password",
    emailPrefs: "Email Preferences",
    pushNotifs: "Push Notifications",
    privacyDiscovery: "Privacy & Discovery",
    onlineStatus: "Online Status & Activity",
    blockedUsers: "Blocked Users",
    security: "Security",
    securityE2EE: "Security & E2EE",
    safetyCenter: "Safety Center & Rules",
    appearance: "Appearance",
    darkMode: "Dark Mode",
    language: "Language",
    dataStorage: "Data & Storage",
    storageUsage: "Storage Usage",
    downloadData: "Download My Data",
    clearCache: "Clear Cache",
    helpSupport: "Help & Support",
    helpCenter: "Help Center & Rules",
    contactSupport: "Contact Support",
    termsOfService: "Terms of Service",
    privacyPolicy: "Privacy Policy",
    about: "About",
    aboutTravally: "About Travally",
    accountActions: "Account Actions",
    signOut: "Sign Out",
    deactivateOrDelete: "Deactivate or Delete Account",

    savePreferences: "Save Preferences",
    cancel: "Cancel",
    close: "Close",
    updatePassword: "Update Password",
    deleteForever: "Delete Forever",
    deactivateAccount: "Deactivate Account",

    postActivityTitle: "Post an Activity",
    postTripTitle: "Plan an Expedition",
    chooseCategoryStep1: "First, choose the activity tag or category you want to do.",
    fillDetailsStep2: "Fill in the details for your planned activity.",
    popularBadge: "Popular",
    selectedCategoryTag: "Selected Category Tag",
    selectedTravelStyle: "Selected Travel Style",
    changeTag: "Change Tag",
    changeStyle: "Change Style",
    activityTitleLabel: "Activity Title *",
    activityTitlePlaceholder: "e.g. Screening of Wim Wenders 'Perfect Days' + Post-Film Coffee",
    descriptionPlanLabel: "Description & Plan *",
    descriptionPlanPlaceholder: "Describe what you plan to do, why you're excited about this activity, and what kind of companion would enjoy joining...",
    dateLabel: "Date *",
    startTimeLabel: "Start Time *",
    durationLabel: "Duration (approx. hours)",
    genderPrefLabel: "Gender Preference",
    closeReqsLabel: "Close Requests Before Event",
    joiningReqsLabel: "Joining Requirements or Notes (Optional)",
    joiningReqsPlaceholder: "e.g. Please purchase ticket in advance, or bring comfortable shoes",
    coverImageLabel: "Cover Image (Optional)",
    clickToUpload: "Click to upload an image",
    organizerReviewSafety: "Organizer Review & Safety",
    organizerReviewSafetyDesc: "Interested companions will submit requests. You review their profile and approve before the private 1-on-1 or group chat is unlocked.",
    backToTags: "Back to Tags",
    backToStyles: "Back to Styles",
    publishActivity: "Publish Activity",
    publishTrip: "Publish Expedition",
    publishing: "Publishing...",
    destinationLabel: "Destination *",
    departureCityLabel: "Starting / Departure City *",
    startDateLabel: "Start Date *",
    endDateLabel: "End Date *",
    minBudgetLabel: "Estimated Min Budget per Person (₹)",
    maxBudgetLabel: "Estimated Max Budget per Person (₹)",
    accommodationLabel: "Accommodation Preference",
    transitPrefLabel: "Transit Preference",
    attractionsLabel: "Planned Attractions & Key Stops",
    addAttractionBtn: "Add",
    activityDetailsTitle: "Activity Details",
    tripDetailsTitle: "Travel Plan Details",
    backToDiscover: "Back to Discover",
    requestToJoin: "Request to Join",
    cancelRequest: "Cancel Request",
    requestSent: "Request Sent",
    chatUnlocked: "Chat Unlocked",
    share: "Share",
    report: "Report",
    deleteBtn: "Delete",
    organizerLabel: "Organized by",
    confirmedMembers: "Confirmed Members",

    catFoodTitle: "Street Food & Cafes",
    catFoodHint: "Midnight biryani runs, Irani chai, brewery hopping, street food tasting",
    catMoviesTitle: "Movies & Cinema",
    catMoviesHint: "First day first show (FDFS), IMAX screenings, regional cinema, film festivals",
    catSportsTitle: "Turf Sports & Fitness",
    catSportsHint: "Box cricket, weekend badminton, morning runs, turf football",
    catTechTitle: "Tech & Networking",
    catTechHint: "Startup mixers, coding meetups, co-working sessions, founder discussions",
    catPubsTitle: "Nightlife & Pubs",
    catPubsHint: "Pubs, bars, clubbing, night markets, evening entertainment",
    catShoppingTitle: "Shopping & Bazaars",
    catShoppingHint: "Night markets, Laad Bazaar, weekend mall hopping, flea markets",
    catDrivesTitle: "Long Drives & Getaways",
    catDrivesHint: "Late night drives to outskirts, dhaba dinners, weekend morning rides",
    catOtherTitle: "Other Hangouts",
    catOtherHint: "Board game cafes, casual meetups, or any other shared interest",

    styleBikersTitle: "Bikers Group Trip",
    styleBikersDesc: "Motorcycle touring, biking expeditions, group highway rides & convoys",
    styleCulturalTitle: "Cultural & Heritage",
    styleCulturalDesc: "Historic districts, architecture, museums, culinary heritage",
    styleSlowTravelTitle: "Slow Travel",
    styleSlowTravelDesc: "Neighborhood living, unhurried exploration, local immersion",
    styleBackpackingTitle: "Backpacking & Hostels",
    styleBackpackingDesc: "Hostels, flexible transit, budget-conscious exploration",
    styleAdventureTitle: "Adventure & Hiking",
    styleAdventureDesc: "Mountain trails, outdoor trekking, coastal walks",
    styleRoadTripTitle: "Scenic Road Trip",
    styleRoadTripDesc: "Coastal drives, countryside exploration, road journeys",
    styleLuxuryTitle: "Boutique & Luxury",
    styleLuxuryDesc: "Curated boutique stays, fine dining, private tours",
    styleRelaxationTitle: "Relaxation & Wellness",
    styleRelaxationDesc: "Hot springs, coastal retreats, peaceful escapes",

    genderAny: "Any gender welcome",
    genderWomenOnly: "Women only",
    genderMenOnly: "Men only",

    cutoff1Hour: "1 hour before start (Default)",
    cutoff30Mins: "30 minutes before start",
    cutoff2Hours: "2 hours before start",
    cutoff3Hours: "3 hours before start",
    cutoff6Hours: "6 hours before start",
    cutoff12Hours: "12 hours before start",
    cutoff24Hours: "24 hours before start",

    accHostel: "Backpacker Hostel / Homestay",
    accHotel: "3-Star Hotel / Resort",
    accLuxury: "Boutique Stay / Villa",
    accFlexible: "Flexible / Decide Together",

    transitTrain: "Train Journey",
    transitFlight: "Flight",
    transitBus: "Sleeper Bus / Volvo",
    transitSelfDrive: "Self Drive Car / Bike",
    transitFlexible: "Flexible",
  },
  hi: {
    home: "होम",
    discover: "खोजें",
    create: "बनाएं",
    requests: "अनुरोध",
    chats: "बातचीत",
    profile: "प्रोफ़ाइल",
    settings: "सेटिंग्स",

    searchPlaceholder: "गतिविधियां, यात्राएं खोजें...",
    login: "लॉग इन",
    joinFree: "मुफ़्त जुड़ें",
    notifications: "सूचनाएं",
    markAllRead: "सभी पढ़ी हुई मार्क करें",
    noNotifications: "अभी कोई सूचना नहीं है",

    companion: "साथी",
    travel: "यात्रा",
    discoverCompanions: "साथी खोजें",
    discoverTravel: "यात्रा योजनाएं खोजें",
    allActivities: "सभी गतिविधियां",
    allStyles: "सभी शैलियां",
    createActivity: "गतिविधि बनाएं",
    createTrip: "यात्रा योजना बनाएं",

    allCategories: "सभी श्रेणियां",
    filterByCategory: "श्रेणी के अनुसार फ़िल्टर करें",
    sortLabel: "क्रम",
    sortSoonest: "जल्द",
    sortSpotsLeft: "स्थान उपलब्ध",
    sortNewest: "नवीनतम",
    sortName: "नाम",
    sortDestination: "गंतव्य",
    filterByTravelStyle: "यात्रा शैली द्वारा फ़िल्टर करें",
    spotsAvailable: "स्थान उपलब्ध",

    noActivitiesFound: "फ़िल्टर से मेल खाती कोई गतिविधि नहीं मिली",
    noActivitiesDesc: "अपने क्षेत्र में इस श्रेणी के लिए गतिविधि आयोजित करने वाले पहले व्यक्ति बनें!",
    noTripsFound: "इस गंतव्य या शैली के लिए कोई यात्रा योजना नहीं मिली",
    noTripsDesc: "अपनी आगामी यात्रा साझा करें और साथ यात्रा करने वाले अन्य खोजकर्ताओं से जुड़ें।",

    receivedRequests: "प्राप्त अनुरोध",
    sentRequests: "भेजे गए",
    noRequestsReceived: "अभी तक कोई अनुरोध प्राप्त नहीं हुआ",
    noRequestsReceivedDesc: "जब लोग आपकी गतिविधियों या यात्राओं में रुचि दिखाएंगे, तो वे यहां समीक्षा के लिए दिखाई देंगे।",
    noRequestsSent: "आपने अभी तक कोई अनुरोध नहीं भेजा है",
    noRequestsSentDesc: 'गतिविधियों या यात्राओं का अन्वेषण करें और शामिल होने का अनुरोध करें।',
    exploreDiscoverFeed: "डिस्कवर फ़ीड देखें",
    accept: "स्वीकार करें",
    decline: "अस्वीकार करें",

    chatsTitle: "बातचीत",
    searchConversations: "बातचीत खोजें...",
    noConversations: "अभी कोई बातचीत नहीं है",
    noConversationsDesc: "जब कोई आयोजक आपका अनुरोध स्वीकार करेगा, तो आपका निजी एन्क्रिप्टेड समूह चैट यहां दिखाई देगा।",
    encryptedMessage: "🔒 एन्क्रिप्टेड संदेश",
    privateGateTitle: "निजी समूह गेट",
    privateGateDesc: "यह निजी समूह चैट सुरक्षित है। जब आयोजक आपका अनुरोध स्वीकार कर लेंगे, तब मैसेजिंग अपने आप अनलॉक हो जाएगी।",
    chatExpiredTitle: "चैट समाप्त और हटाई गई",
    chatExpiredDesc: "ट्रैवैली की गोपनीयता नीति के अनुसार, कार्यक्रम पूरा होने के 7 दिनों के बाद यह चैट डेटाबेस से स्थायी रूप से हटा दी गई है।",
    returnToDiscover: "डिस्कवर पर वापस जाएं",
    returnToChats: "बातचीत पर वापस जाएं",
    tapToMessage: "संदेश लिखने के लिए टैप करें",
    callBtn: "कॉल करें",
    e2eeNotice: "संदेश और कॉल एंड-टू-एंड एन्क्रिप्टेड हैं। इस चैट के बाहर कोई भी, यहाँ तक कि ट्रैवैली भी, इन्हें पढ़ या सुन नहीं सकता।",

    myProfile: "मेरी प्रोफ़ाइल",
    editProfile: "प्रोफ़ाइल संपादित करें",
    saveProfile: "प्रोफ़ाइल सहेजें",
    bio: "बायो",
    interests: "रुचियां",
    city: "शहर",
    travallyPass: "ट्रैवैली पास",
    digitalIdentityPass: "डिजिटल पहचान पास",
    tapCardToFlip: "पलटने के लिए कार्ड पर टैप करें",
    copyId: "आईडी कॉपी करें",
    copied: "कॉपी हो गया!",
    copyPass: "पास कॉपी करें",
    passNumberCopied: "पास नंबर कॉपी हो गया!",
    verifiedBadges: "सत्यापित बैज",
    verifiedBadgesDesc: "आपके बैज गतिविधि समूहों और साथी लिस्टिंग में विश्वास बढ़ाते हैं।",
    identityVerification: "पहचान सत्यापन",
    verifiedMember: "सत्यापित सदस्य",
    unverifiedMember: "असत्यापित सदस्य",
    verifiedMemberDesc: "ट्रैवैली द्वारा पहचान सत्यापित।",
    unverifiedMemberDesc: "गतिविधियों पर सत्यापित बैज प्रदर्शित करने के लिए लिंक्डइन प्रोफ़ाइल कनेक्ट करें।",
    tierLabel: "स्तर",
    meetupsLabel: "मुलाक़ातें",
    tripsLabel: "यात्राएं",
    sinceLabel: "सदस्य बने",
    travallyCardBtn: "ट्रैवैली कार्ड",

    settingsTitle: "सेटिंग्स",
    account: "खाता",
    accountInfo: "खाते की जानकारी",
    changePassword: "पासवर्ड बदलें",
    changePasswordSub: "अपना पासवर्ड अपडेट करें",
    emailPrefs: "ईमेल प्राथमिकताएं",
    pushNotifs: "पुश सूचनाएं",
    privacyDiscovery: "गोपनीयता और खोज",
    onlineStatus: "ऑनलाइन स्थिति और गतिविधि",
    blockedUsers: "अवरुद्ध उपयोगकर्ता",
    security: "सुरक्षा",
    securityE2EE: "सुरक्षा और एन्क्रिप्शन",
    safetyCenter: "सुरक्षा केंद्र और नियम",
    appearance: "दिखावट",
    darkMode: "डार्क मोड",
    language: "भाषा",
    dataStorage: "डेटा और संग्रहण",
    storageUsage: "मेमोरी उपयोग",
    downloadData: "मेरा डेटा डाउनलोड करें",
    clearCache: "कैश साफ़ करें",
    helpSupport: "सहायता और समर्थन",
    helpCenter: "सहायता केंद्र और नियम",
    contactSupport: "समर्थन से संपर्क करें",
    termsOfService: "सेवा की शर्तें",
    privacyPolicy: "गोपनीयता नीति",
    about: "के बारे में",
    aboutTravally: "ट्रैवैली के बारे में",
    accountActions: "खाता कार्रवाइयां",
    signOut: "साइन आउट",
    deactivateOrDelete: "खाता निष्क्रिय या हटाएं",

    savePreferences: "प्राथमिकताएं सहेजें",
    cancel: "रद्द करें",
    close: "बंद करें",
    updatePassword: "पासवर्ड अपडेट करें",
    deleteForever: "हमेशा के लिए हटाएं",
    deactivateAccount: "खाता निष्क्रिय करें",

    postActivityTitle: "गतिविधि पोस्ट करें",
    postTripTitle: "यात्रा की योजना बनाएं",
    chooseCategoryStep1: "पहले वह श्रेणी या टैग चुनें जो आप करना चाहते हैं।",
    fillDetailsStep2: "अपनी नियोजित गतिविधि का विवरण भरें।",
    popularBadge: "लोकप्रिय",
    selectedCategoryTag: "चयनित श्रेणी टैग",
    selectedTravelStyle: "चयनित यात्रा शैली",
    changeTag: "टैग बदलें",
    changeStyle: "शैली बदलें",
    activityTitleLabel: "गतिविधि का शीर्षक *",
    activityTitlePlaceholder: "उदा. नई फिल्म देखना + कॉफी पर बातचीत",
    descriptionPlanLabel: "विवरण और योजना *",
    descriptionPlanPlaceholder: "बताएं कि आप क्या करने की योजना बना रहे हैं और कैसा साथी चाहते हैं...",
    dateLabel: "तारीख *",
    startTimeLabel: "प्रारंभ समय *",
    durationLabel: "अवधि (लगभग घंटे)",
    genderPrefLabel: "लिंग प्राथमिकता",
    closeReqsLabel: "इवेंट से पहले अनुरोध बंद करें",
    joiningReqsLabel: "शामिल होने की आवश्यकताएं (वैकल्पिक)",
    joiningReqsPlaceholder: "उदा. कृपया पहले से टिकट खरीदें या आरामदायक जूते पहनें",
    coverImageLabel: "कवर छवि (वैकल्पिक)",
    clickToUpload: "छवि अपलोड करने के लिए क्लिक करें",
    organizerReviewSafety: "आयोजक समीक्षा और सुरक्षा",
    organizerReviewSafetyDesc: "इच्छुक साथी अनुरोध भेजेंगे। निजी चैट अनलॉक होने से पहले आप उनकी प्रोफ़ाइल देख सकते हैं।",
    backToTags: "टैग पर वापस",
    backToStyles: "शैलियों पर वापस",
    publishActivity: "गतिविधि प्रकाशित करें",
    publishTrip: "यात्रा प्रकाशित करें",
    publishing: "प्रकाशित हो रहा है...",
    destinationLabel: "गंतव्य *",
    departureCityLabel: "शुरुआती / प्रस्थान शहर *",
    startDateLabel: "प्रारंभ तिथि *",
    endDateLabel: "समाप्ति तिथि *",
    minBudgetLabel: "न्यूनतम अनुमानित बजट (₹)",
    maxBudgetLabel: "अधिकतम अनुमानित बजट (₹)",
    accommodationLabel: "आवास प्राथमिकता",
    transitPrefLabel: "पारगमन प्राथमिकता",
    attractionsLabel: "नियोजित आकर्षण और मुख्य पड़ाव",
    addAttractionBtn: "जोड़ें",
    activityDetailsTitle: "गतिविधि विवरण",
    tripDetailsTitle: "यात्रा योजना विवरण",
    backToDiscover: "डिस्कवर पर वापस",
    requestToJoin: "जुड़ने का अनुरोध करें",
    cancelRequest: "अनुरोध रद्द करें",
    requestSent: "अनुरोध भेजा गया",
    chatUnlocked: "चैट अनलॉक",
    share: "साझा करें",
    report: "रिपोर्ट करें",
    deleteBtn: "हटाएं",
    organizerLabel: "आयोजक",
    confirmedMembers: "पुष्टि किए गए सदस्य",

    catFoodTitle: "स्ट्रीट फूड और कैफे",
    catFoodHint: "देर रात बिरयानी, ईरानी चाय, ब्रूअरी हॉपिंग, स्ट्रीट फूड का स्वाद",
    catMoviesTitle: "फिल्में और सिनेमा",
    catMoviesHint: "फर्स्ट डे फर्स्ट शो, आईमैक्स स्क्रीनिंग, क्षेत्रीय सिनेमा, फिल्म समारोह",
    catSportsTitle: "टर्फ स्पोर्ट्स और फिटनेस",
    catSportsHint: "बॉक्स क्रिकेट, सप्ताहांत बैडमिंटन, सुबह की दौड़, टर्फ फुटबॉल",
    catTechTitle: "तकनीक और नेटवर्किंग",
    catTechHint: "स्टार्टअप मीटअप, कोडिंग सत्र, को-वर्किंग, संस्थापक चर्चाएं",
    catPubsTitle: "नाइटलाइफ़ और पब्स",
    catPubsHint: "पब्स, बार, क्लबिंग, नाइट मार्केट, शाम का मनोरंजन",
    catShoppingTitle: "शॉपिंग और बाज़ार",
    catShoppingHint: "नाइट मार्केट, स्ट्रीट शॉपिंग, वीकेंड मॉल, पिस्सू बाज़ार",
    catDrivesTitle: "लॉन्ग ड्राइव और सैर",
    catDrivesHint: "शहर के बाहर देर रात ड्राइव, ढाबा डिनर, सप्ताहांत की सुबह की सवारी",
    catOtherTitle: "अन्य मुलाक़ातें",
    catOtherHint: "बोर्ड गेम कैफे, सामान्य मुलाक़ातें, या कोई अन्य साझा रुचि",

    styleBikersTitle: "बाइकर्स ग्रुप ट्रिप",
    styleBikersDesc: "मोटरसाइकिल टूरिंग, बाइकिंग अभियान, ग्रुप हाईवे राइड और काफिला",
    styleCulturalTitle: "सांस्कृतिक और विरासत",
    styleCulturalDesc: "ऐतिहासिक स्थल, वास्तुकला, संग्रहालय, पाक विरासत",
    styleSlowTravelTitle: "धीमी यात्रा",
    styleSlowTravelDesc: "स्थानीय जीवन, इत्मीनान से खोज, स्थानीय संस्कृति में घुलना",
    styleBackpackingTitle: "बैकपैकिंग और हॉस्टल",
    styleBackpackingDesc: "हॉस्टल, लचीला पारगमन, कम बजट की यात्रा",
    styleAdventureTitle: "साहसिक और लंबी पैदल यात्रा",
    styleAdventureDesc: "पहाड़ी रास्ते, आउटडोर ट्रेकिंग, तटीय सैर",
    styleRoadTripTitle: "सड़क यात्रा",
    styleRoadTripDesc: "तटीय ड्राइव, ग्रामीण इलाकों की खोज, सड़क यात्राएं",
    styleLuxuryTitle: "बुटीक और विलासिता",
    styleLuxuryDesc: "शानदार ठहराव, बेहतरीन भोजन, निजी पर्यटन",
    styleRelaxationTitle: "विश्राम और तंदुरुस्ती",
    styleRelaxationDesc: "गर्म झरने, तटीय विश्राम स्थल, शांतिपूर्ण यात्राएं",

    genderAny: "कोई भी लिंग स्वागत योग्य",
    genderWomenOnly: "केवल महिलाएं",
    genderMenOnly: "केवल पुरुष",

    cutoff1Hour: "शुरू होने से 1 घंटा पहले (डिफ़ॉल्ट)",
    cutoff30Mins: "शुरू होने से 30 मिनट पहले",
    cutoff2Hours: "शुरू होने से 2 घंटे पहले",
    cutoff3Hours: "शुरू होने से 3 घंटे पहले",
    cutoff6Hours: "शुरू होने से 6 घंटे पहले",
    cutoff12Hours: "शुरू होने से 12 घंटे पहले",
    cutoff24Hours: "शुरू होने से 24 घंटे पहले",

    accHostel: "बैकपैकर हॉस्टल / होमस्टे",
    accHotel: "3-स्टार होटल / रिज़ॉर्ट",
    accLuxury: "बुटीक स्टे / विला",
    accFlexible: "लचीला / मिलकर तय करें",

    transitTrain: "ट्रेन यात्रा",
    transitFlight: "उड़ान (फ्लाइट)",
    transitBus: "स्लीपर बस / वोल्वो",
    transitSelfDrive: "सेल्फ ड्राइव कार / बाइक",
    transitFlexible: "लचीला",
  },
  te: {
    home: "హోమ్",
    discover: "కనుగొనండి",
    create: "సృష్టించండి",
    requests: "అభ్యర్థనలు",
    chats: "చాట్‌లు",
    profile: "ప్రొఫైల్",
    settings: "సెట్టింగ్‌లు",

    searchPlaceholder: "యాక్టివిటీలు, పర్యటనలు శోధించండి...",
    login: "లాగిన్",
    joinFree: "ఉచితంగా చేరండి",
    notifications: "నోటిఫికేషన్లు",
    markAllRead: "అన్నీ చదివినట్లు గుర్తించు",
    noNotifications: "ఇంకా నోటిఫికేషన్‌లు లేవు",

    companion: "తోడు/కంపానియన్",
    travel: "ప్రయాణం",
    discoverCompanions: "కంపానియన్లను కనుగొనండి",
    discoverTravel: "ప్రయాణ ప్రణాళికలను కనుగొనండి",
    allActivities: "అన్ని కార్యకలాపాలు",
    allStyles: "అన్ని రకాలు",
    createActivity: "కార్యకలాపాన్ని సృష్టించండి",
    createTrip: "ప్రయాణాన్ని ప్లాన్ చేయండి",

    allCategories: "అన్ని కేటగిరీలు",
    filterByCategory: "కేటగిరీ వారీగా ఫిల్టర్",
    sortLabel: "క్రమం",
    sortSoonest: "త్వరలో",
    sortSpotsLeft: "ఖాళీలు",
    sortNewest: "కొత్తవి",
    sortName: "పేరు ప్రకారం",
    sortDestination: "గమ్యస్థానం ప్రకారం",
    filterByTravelStyle: "ప్రయాణ రకం వారీగా ఫిల్టర్",
    spotsAvailable: "స్థలాలు అందుబాటులో ఉన్నాయి",

    noActivitiesFound: "మీ ఫిల్టర్‌కు సరిపోలే యాక్టివిటీలు లేవు",
    noActivitiesDesc: "మీ ప్రాంతంలో ఈ కేటగిరీ కింద మొదటి యాక్టివిటీని మీరే నిర్వహించండి!",
    noTripsFound: "ఈ ప్రదేశానికి తగిన యాత్రలు లభించలేదు",
    noTripsDesc: "మీ రాబోయే ప్రయాణ వివరాలను పోస్ట్ చేయండి, మీతో కలిసి ప్రయాణించే వారితో కలవండి.",

    receivedRequests: "వచ్చిన అభ్యర్థనలు",
    sentRequests: "పంపినవి",
    noRequestsReceived: "ఇంకా ఎలాంటి అభ్యర్థనలు రాలేదు",
    noRequestsReceivedDesc: "మీ యాక్టివిటీలు లేదా ప్రయాణాలలో ఇతరులు ఆసక్తి చూపినప్పుడు, అవి ఇక్కడ సమీక్ష కోసం కనిపిస్తాయి.",
    noRequestsSent: "మీరు ఇంకా ఏ అభ్యర్థనలు పంపలేదు",
    noRequestsSentDesc: 'యాక్టివిటీలు లేదా ప్రయాణ ప్రణాళికలను అన్వేషించి చేరడానికి అభ్యర్థించండి.',
    exploreDiscoverFeed: "డిస్కవర్ ఫీడ్‌ను అన్వేషించండి",
    accept: "అంగీకరించు",
    decline: "తిరస్కరించు",

    chatsTitle: "చాట్‌లు",
    searchConversations: "చాట్‌లను శోధించండి...",
    noConversations: "ఇంకా సంభాషణలు లేవు",
    noConversationsDesc: "నిర్వాహకుడు మీ అభ్యర్థనను అంగీకరించినప్పుడు, మీ ప్రైవేట్ ఎన్‌క్రిప్ట్ చేసిన గ్రూప్ చాట్ ఇక్కడ కనిపిస్తుంది.",
    encryptedMessage: "🔒 సురక్షిత సందేశం",
    privateGateTitle: "ప్రైవేట్ గ్రూప్ గేట్",
    privateGateDesc: "ఈ ప్రైవేట్ గ్రూప్ చాట్ రక్షించబడింది. మీ అభ్యర్థనను నిర్వాహకుడు ఆమోదించిన తర్వాత చాట్ ఆటోమేటిక్‌గా అన్‌లాక్ అవుతుంది.",
    chatExpiredTitle: "చాట్ గడువు ముగిసింది & తొలగించబడింది",
    chatExpiredDesc: "ట్రావల్లీ గోప్యతా విధానం ప్రకారం, ఈవెంట్ ముగిసిన 7 రోజుల తర్వాత ఈ చాట్ డేటాబేస్ నుండి శాశ్వతంగా తొలగించబడింది.",
    returnToDiscover: "డిస్కవర్‌కి తిరిగి వెళ్లండి",
    returnToChats: "చాట్‌లకు తిరిగి వెళ్లండి",
    tapToMessage: "మెసేజ్ చేయడానికి ఇక్కడ టైప్ చేయండి",
    callBtn: "కాల్",
    e2eeNotice: "సందేశాలు మరియు కాల్స్ ఎండ్-టు-ఎండ్ ఎన్‌క్రిప్ట్ చేయబడ్డాయి. ఈ చాట్‌లోని వారు తప్ప ట్రావల్లీ కూడా వీటిని చదవలేరు లేదా వినలేరు.",

    myProfile: "నా ప్రొఫైల్",
    editProfile: "ప్రొఫైల్ సవరించండి",
    saveProfile: "ప్రొఫైల్ సేవ్ చేయండి",
    bio: "పరిచయం (బయో)",
    interests: "ఆసక్తులు",
    city: "నగరం",
    travallyPass: "ట్రావల్లీ పాస్",
    digitalIdentityPass: "డిజిటల్ గుర్తింపు పాస్",
    tapCardToFlip: "కార్డును తిప్పడానికి ట్యాప్ చేయండి",
    copyId: "ఐడీ కాపీ చేయండి",
    copied: "కాపీ అయింది!",
    copyPass: "పాస్ కాపీ చేయండి",
    passNumberCopied: "పాస్ నంబర్ కాపీ అయింది!",
    verifiedBadges: "ధృవీకరించబడిన బ్యాడ్జ్‌లు",
    verifiedBadgesDesc: "మీ బ్యాడ్జ్‌లు యాక్టివిటీ సమూహాలు మరియు సహచరులలో నమ్మకాన్ని పెంచుతాయి.",
    identityVerification: "గుర్తింపు ధృవీకరణ",
    verifiedMember: "ధృవీకరించబడిన సభ్యుడు",
    unverifiedMember: "ధృవీకరించబడని సభ్యుడు",
    verifiedMemberDesc: "ట్రావల్లీ ద్వారా గుర్తింపు ధృవీకరించబడింది.",
    unverifiedMemberDesc: "యాక్టివిటీలపై ధృవీకరించబడిన బ్యాడ్జ్ పొందడానికి లింక్డ్‌ఇన్ ప్రొఫైల్‌ను కనెక్ట్ చేయండి.",
    tierLabel: "శ్రేణి",
    meetupsLabel: "మీటప్‌లు",
    tripsLabel: "ట్రిప్‌లు",
    sinceLabel: "సభ్యత్వం నుండి",
    travallyCardBtn: "ట్రావల్లీ కార్డ్",

    settingsTitle: "సెట్టింగ్‌లు",
    account: "ఖాతా",
    accountInfo: "ఖాతా వివరాలు",
    changePassword: "పాస్‌వర్డ్ మార్చండి",
    changePasswordSub: "మీ ఖాతా పాస్‌వర్డ్ నవీకరించండి",
    emailPrefs: "ఇమెయిల్ ప్రాధాన్యతలు",
    pushNotifs: "నోటిఫికేషన్‌లు",
    privacyDiscovery: "గోప్యత మరియు శోధన",
    onlineStatus: "ఆన్‌లైన్ స్థితి & కార్యకలాపాలు",
    blockedUsers: "బ్లాక్ చేయబడిన వినియోగదారులు",
    security: "భద్రత",
    securityE2EE: "భద్రత & ఎన్‌క్రిప్షన్",
    safetyCenter: "భద్రతా కేంద్రం & నిబంధనలు",
    appearance: "రూపురేఖలు",
    darkMode: "డార్క్ మోడ్",
    language: "భాష",
    dataStorage: "డేటా & నిల్వ",
    storageUsage: "నిల్వ వినియోగం",
    downloadData: "నా డేటాను డౌన్‌లోడ్ చేయండి",
    clearCache: "కాష్ క్లియర్ చేయండి",
    helpSupport: "సహాయం & మద్దతు",
    helpCenter: "సహాయ కేంద్రం & నియమాలు",
    contactSupport: "మద్దతును సంప్రదించండి",
    termsOfService: "సేవా నిబంధనలు",
    privacyPolicy: "గోప్యతా విధానం",
    about: "గురించి",
    aboutTravally: "ట్రావల్లీ గురించి",
    accountActions: "ఖాతా చర్యలు",
    signOut: "సైన్ అవుట్",
    deactivateOrDelete: "ఖాతాను నిష్క్రియం చేయండి లేదా తొలగించండి",

    savePreferences: "ప్రాధాన్యతలను సేవ్ చేయండి",
    cancel: "రద్దు చేయండి",
    close: "మూసివేయండి",
    updatePassword: "పాస్‌వర్డ్ నవీకరించండి",
    deleteForever: "శాశ్వతంగా తొలగించండి",
    deactivateAccount: "ఖాతా నిష్క్రియం చేయండి",

    postActivityTitle: "యాక్టివిటీని పోస్ట్ చేయండి",
    postTripTitle: "యాత్రను ప్లాన్ చేయండి",
    chooseCategoryStep1: "ముందుగా మీరు చేయాలనుకుంటున్న యాక్టివిటీ ట్యాగ్ లేదా కేటగిరీని ఎంచుకోండి.",
    fillDetailsStep2: "మీ ప్రణాళిక యాక్టివిటీ వివరాలను నమోదు చేయండి.",
    popularBadge: "పాపులర్",
    selectedCategoryTag: "ఎంచుకున్న కేటగిరీ ట్యాగ్",
    selectedTravelStyle: "ఎంచుకున్న ప్రయాణ రకం",
    changeTag: "ట్యాగ్ మార్చండి",
    changeStyle: "రకం మార్చండి",
    activityTitleLabel: "యాక్టివిటీ శీర్షిక *",
    activityTitlePlaceholder: "ఉదా. కొత్త సినిమా చూడటం + కాఫీ తాగడం",
    descriptionPlanLabel: "వివరణ & ప్లాన్ *",
    descriptionPlanPlaceholder: "మీరు ఏమి చేయాలనుకుంటున్నారు మరియు ఎలాంటి తోడు కావాలనుకుంటున్నారో వివరించండి...",
    dateLabel: "తేదీ *",
    startTimeLabel: "ప్రారంభ సమయం *",
    durationLabel: "వ్యవధి (సుమారు గంటలు)",
    genderPrefLabel: "లింగ ప్రాధాన్యత",
    closeReqsLabel: "ఈవెంట్ కంటే ముందు రిక్వెస్ట్‌లను ముగించు",
    joiningReqsLabel: "చేరడానికి నిబంధనలు (ఐచ్ఛికం)",
    joiningReqsPlaceholder: "ఉదా. ముందే టికెట్ తీసుకోండి లేదా సౌకర్యవంతమైన బూట్లు వేసుకోండి",
    coverImageLabel: "కవర్ ఇమేజ్ (ఐచ్ఛికం)",
    clickToUpload: "ఫోటో అప్‌లోడ్ చేయడానికి క్లిక్ చేయండి",
    organizerReviewSafety: "ఆర్గనైజర్ సమీక్ష & భద్రత",
    organizerReviewSafetyDesc: "ఆసక్తిగల సభ్యులు అభ్యర్థనలు పంపుతారు. ప్రైవేట్ చాట్ అన్‌లాక్ కావడానికి ముందు మీరు వారి ప్రొఫైల్‌ను పరిశీలించి ఆమోదించవచ్చు.",
    backToTags: "ట్యాగ్‌లకు వెనక్కి",
    backToStyles: "రకాలకు వెనక్కి",
    publishActivity: "యాక్టివిటీని ప్రచురించండి",
    publishTrip: "యాత్రను ప్రచురించండి",
    publishing: "ప్రచురిస్తోంది...",
    destinationLabel: "గమ్యస్థానం *",
    departureCityLabel: "ప్రారంభ / బయలుదేరే నగరం *",
    startDateLabel: "ప్రారంభ తేదీ *",
    endDateLabel: "ముగింపు తేదీ *",
    minBudgetLabel: "కనీస అంచనా బడ్జెట్ (₹)",
    maxBudgetLabel: "గరిష్ట అంచనా బడ్జెట్ (₹)",
    accommodationLabel: "వసతి ప్రాధాన్యత",
    transitPrefLabel: "రవాణా ప్రాధాన్యత",
    attractionsLabel: "ప్రణాళికాబద్ధమైన ఆకర్షణలు & ముఖ్య ప్రదేశాలు",
    addAttractionBtn: "జోడించు",
    activityDetailsTitle: "యాక్టివిటీ వివరాలు",
    tripDetailsTitle: "ప్రయాణ ప్రణాళిక వివరాలు",
    backToDiscover: "డిస్కవర్‌కు వెనక్కి",
    requestToJoin: "చేరడానికి అభ్యర్థించండి",
    cancelRequest: "అభ్యర్థనను రద్దు చేయండి",
    requestSent: "అభ్యర్థన పంపబడింది",
    chatUnlocked: "చాట్ అన్‌లాక్ అయింది",
    share: "షేర్ చేయండి",
    report: "రిపోర్ట్ చేయండి",
    deleteBtn: "తొలగించు",
    organizerLabel: "నిర్వాహకుడు",
    confirmedMembers: "ధృవీకరించబడిన సభ్యులు",

    catFoodTitle: "స్ట్రీట్ ఫుడ్ & కేఫ్‌లు",
    catFoodHint: "రాత్రి బిర్యానీ, ఇరానీ చాయ్, బ్రూవరీ హాపింగ్, స్ట్రీట్ ఫుడ్ రుచులు",
    catMoviesTitle: "సినిమాలు & వినోదం",
    catMoviesHint: "ఫస్ట్ డే ఫస్ట్ షో (FDFS), ఐమాక్స్ ప్రదర్శనలు, సినిమా ఉత్సవాలు",
    catSportsTitle: "ట్రఫ్ స్పోర్ట్స్ & ఫిట్‌నెస్",
    catSportsHint: "బాక్స్ క్రికెట్, బ్యాడ్మింటన్, మార్నింగ్ రన్, టర్ఫ్ ఫుట్‌బాల్",
    catTechTitle: "టెక్ & నెట్‌వర్కింగ్",
    catTechHint: "స్టార్టప్ మీటప్‌లు, కోడింగ్ సెషన్‌లు, కో-వర్కింగ్, ఫౌండర్ చర్చలు",
    catPubsTitle: "నైట్‌లైఫ్ & పబ్‌లు",
    catPubsHint: "పబ్‌లు, బార్‌లు, క్లబ్బింగ్, నైట్ మార్కెట్‌లు, ఈవినింగ్ పార్టీలు",
    catShoppingTitle: "షాపింగ్ & బజార్లు",
    catShoppingHint: "నైట్ మార్కెట్, లాడ్ బజార్, వీకెండ్ మాల్ షాపింగ్",
    catDrivesTitle: "లాంగ్ డ్రైవ్స్ & ప్రయాణాలు",
    catDrivesHint: "అవుట్‌స్కర్ట్స్ లాంగ్ డ్రైవ్స్, దాబా డిన్నర్స్, వీకెండ్ బైక్ రైడ్స్",
    catOtherTitle: "ఇతర సమావేశాలు",
    catOtherHint: "బోర్డ్ గేమ్స్ కేఫ్‌లు, క్యాజువల్ మీటప్‌లు లేదా ఇతర హాబీలు",

    styleBikersTitle: "బైకర్స్ గ్రూప్ ట్రిప్",
    styleBikersDesc: "మోటార్‌సైకిల్ టూరింగ్, బైకింగ్ సాహసాలు, గ్రూప్ హైవే రైడ్‌లు & కాన్వాయ్స్",
    styleCulturalTitle: "సాంస్కృతిక & వారసత్వ",
    styleCulturalDesc: "చారిత్రక ప్రదేశాలు, శిల్పకళ, మ్యూజియంలు, స్థానిక వంటకాలు",
    styleSlowTravelTitle: "ప్రశాంత ప్రయాణం (స్లో ట్రావెల్)",
    styleSlowTravelDesc: "తీరికగా అన్వేషించడం, స్థానిక సంస్కృతిలో భాగస్వామ్యం",
    styleBackpackingTitle: "బ్యాక్‌ప్యాకింగ్ & హాస్టల్స్",
    styleBackpackingDesc: "బడ్జెట్ హాస్టల్స్, ఫ్లెక్సిబుల్ ట్రావెల్, కొత్త ప్రదేశాల శోధన",
    styleAdventureTitle: "సాహస & హైకింగ్",
    styleAdventureDesc: "పర్వత మార్గాలు, ట్రెక్కింగ్, ప్రకృతి నడక",
    styleRoadTripTitle: "రోడ్ ట్రిప్ యాత్ర",
    styleRoadTripDesc: "హైవే డ్రైవ్‌లు, పల్లెటూరి అందాలు, బైక్/కార్ ప్రయాణాలు",
    styleLuxuryTitle: "లగ్జరీ & బోటిక్ స్టే",
    styleLuxuryDesc: "లగ్జరీ రిసార్ట్‌లు, ప్రైవేట్ టూర్స్, విశిష్ట విడిది",
    styleRelaxationTitle: "విశ్రాంతి & వెల్‌నెస్",
    styleRelaxationDesc: "హాట్ స్ప్రింగ్స్, తీర ప్రాంత విశ్రాంతి, మానసిక ప్రశాంతత",

    genderAny: "ఎవరైనా చేరవచ్చు (అందరికీ స్వాగతం)",
    genderWomenOnly: "మహిళలకు మాత్రమే",
    genderMenOnly: "పురుషులకు మాత్రమే",

    cutoff1Hour: "ప్రారంభానికి 1 గంట ముందు (డిఫాల్ట్)",
    cutoff30Mins: "ప్రారంభానికి 30 నిమిషాల ముందు",
    cutoff2Hours: "ప్రారంభానికి 2 గంటల ముందు",
    cutoff3Hours: "ప్రారంభానికి 3 గంటల ముందు",
    cutoff6Hours: "ప్రారంభానికి 6 గంటల ముందు",
    cutoff12Hours: "ప్రారంభానికి 12 గంటల ముందు",
    cutoff24Hours: "ప్రారంభానికి 24 గంటల ముందు",

    accHostel: "బ్యాక్‌ప్యాకర్ హాస్టల్ / హోమ్‌స్టే",
    accHotel: "3-స్టార్ హోటల్ / రిసార్ట్",
    accLuxury: "బోటిక్ స్టే / విల్లా",
    accFlexible: "ఫ్లెక్సిబుల్ / కలిసి నిర్ణయించుకుందాం",

    transitTrain: "రైలు ప్రయాణం",
    transitFlight: "విమానం (ఫ్లైట్)",
    transitBus: "స్లీపర్ బస్సు / వోల్వో",
    transitSelfDrive: "సెల్ఫ్ డ్రైవ్ కారు / బైక్",
    transitFlexible: "సౌకర్యాన్ని బట్టి",
  },
  ta: {
    home: "முகப்பு",
    discover: "கண்டுபிடி",
    create: "உருவாக்கு",
    requests: "கோரிக்கைகள்",
    chats: "அரட்டைகள்",
    profile: "சுயவிவரம்",
    settings: "அமைப்புகள்",

    searchPlaceholder: "செயல்பாடுகள், பயணங்களைத் தேடுங்கள்...",
    login: "உள்நுழைக",
    joinFree: "இலவசமாக இணையுங்கள்",
    notifications: "அறிவிப்புகள்",
    markAllRead: "அனைத்தையும் படித்ததாகக் குறிக்கவும்",
    noNotifications: "இன்னும் அறிவிப்புகள் இல்லை",

    companion: "தோழர்",
    travel: "பயணம்",
    discoverCompanions: "தோழர்களைக் கண்டறியவும்",
    discoverTravel: "பயணங்களைக் கண்டறியவும்",
    allActivities: "அனைத்து செயல்பாடுகள்",
    allStyles: "அனைத்து பாணிகள்",
    createActivity: "செயல்பாட்டை உருவாக்கவும்",
    createTrip: "பயணத்தை உருவாக்கவும்",

    allCategories: "அனைத்து வகைகள்",
    filterByCategory: "வகைப்படி வடிகட்டவும்",
    sortLabel: "வரிசை",
    sortSoonest: "விரைவில்",
    sortSpotsLeft: "இடங்கள்",
    sortNewest: "புதியவை",
    sortName: "பெயர்",
    sortDestination: "இலக்கு",
    filterByTravelStyle: "பயண பாணி மூலம் வடிகட்டவும்",
    spotsAvailable: "இடங்கள் கிடைக்கின்றன",

    noActivitiesFound: "எந்த செயல்பாடுகளும் பொருந்தவில்லை",
    noActivitiesDesc: "உங்கள் பகுதியில் இந்த வகைக்கு ஒரு செயல்பாட்டை ஏற்பாடு செய்யும் முதல் நபராக இருங்கள்!",
    noTripsFound: "பயணங்கள் எதுவும் கிடைக்கவில்லை",
    noTripsDesc: "உங்கள் வரவிருக்கும் பயணத்தை வெளியிட்டு, சக பயணிகளுடன் இணையுங்கள்.",

    receivedRequests: "வந்த கோரிக்கைகள்",
    sentRequests: "அனுப்பியவை",
    noRequestsReceived: "இன்னும் கோரிக்கைகள் எதுவும் பெறப்படவில்லை",
    noRequestsReceivedDesc: "உங்கள் செயல்பாடுகள் அல்லது பயணங்களில் பிறர் ஆர்வத்தை வெளிப்படுத்தும்போது, அவை இங்கே தோன்றும்.",
    noRequestsSent: "நீங்கள் இன்னும் எந்தக் கோரிக்கையும் அனுப்பவில்லை",
    noRequestsSentDesc: 'செயல்பாடுகள் அல்லது பயணங்களை ஆராய்ந்து இணையக் கோரிக்கை அனுப்புங்கள்.',
    exploreDiscoverFeed: "கண்டுபிடி பக்கத்திற்குச் செல்லவும்",
    accept: "ஏற்றுக்கொள்",
    decline: "நிராகரி",

    chatsTitle: "அரட்டைகள்",
    searchConversations: "அரட்டைகளைத் தேடுங்கள்...",
    noConversations: "இன்னும் உரையாடல்கள் இல்லை",
    noConversationsDesc: "ஒரு அமைப்பாளர் உங்கள் கோரிக்கையை ஏற்கும் போது, உங்கள் பிரத்தியேக மறைகுறியாக்கப்பட்ட குழு அரட்டை இங்கே தோன்றும்.",
    encryptedMessage: "🔒 என்க்ரிப்ட் செய்யப்பட்ட செய்தி",
    privateGateTitle: "பிரத்தியேக குழு வாயில்",
    privateGateDesc: "இந்த பிரத்தியேக குழு அரட்டை பாதுகாக்கப்பட்டுள்ளது. அமைப்பாளர் உங்கள் கோரிக்கையை ஏற்றவுடன் மெசேஜிங் தானாகவே திறக்கப்படும்.",
    chatExpiredTitle: "அரட்டை காலாவதியானது & நீக்கப்பட்டது",
    chatExpiredDesc: "டிராவல்லியின் தனியுரிமைக் கொள்கையின்படி, நிகழ்வு முடிந்த 7 நாட்களுக்குப் பிறகு இந்த அரட்டை நிரந்தரமாக நீக்கப்பட்டது.",
    returnToDiscover: "கண்டுபிடி பக்கத்திற்குத் திரும்பவும்",
    returnToChats: "அரட்டைகளுக்குத் திரும்பவும்",
    tapToMessage: "செய்தி அனுப்ப தட்டவும்",
    callBtn: "அழைப்பு",
    e2eeNotice: "செய்திகளும் அழைப்புகளும் எண்ட்-டு-எண்ட் என்க்ரிப்ட் செய்யப்பட்டுள்ளன. டிராவல்லி கூட இவற்றை படிக்கவோ கேட்கவோ முடியாது.",

    myProfile: "என் சுயவிவரம்",
    editProfile: "சுயவிவரத்தைத் திருத்து",
    saveProfile: "சுயவிவரத்தைச் சேமி",
    bio: "பயோ",
    interests: "ஆர்வங்கள்",
    city: "நகரம்",
    travallyPass: "டிராவல்லி பாஸ்",
    digitalIdentityPass: "டிஜிட்டல் அடையாள பாஸ்",
    tapCardToFlip: "அட்டையைத் திருப்ப தட்டவும்",
    copyId: "ஐடியை நகலெடு",
    copied: "நகலெடுக்கப்பட்டது!",
    copyPass: "பாஸை நகலெடு",
    passNumberCopied: "பாஸ் எண் நகலெடுக்கப்பட்டது!",
    verifiedBadges: "சரிபார்க்கப்பட்ட பேட்ஜ்கள்",
    verifiedBadgesDesc: "உங்கள் பேட்ஜ்கள் செயல்பாட்டுக் குழுக்களிடையே நம்பிக்கையை வளர்க்கின்றன.",
    identityVerification: "அடையாள சரிபார்ப்பு",
    verifiedMember: "சரிபார்க்கப்பட்ட உறுப்பினர்",
    unverifiedMember: "சரிபார்க்கப்படாத உறுப்பினர்",
    verifiedMemberDesc: "டிராவல்லி மூலம் அடையாளம் சரிபார்க்கப்பட்டது.",
    unverifiedMemberDesc: "செயல்பாடுகளில் சரிபார்க்கப்பட்ட பேட்ஜைக் காட்ட லிங்க்ட்இன் சுயவிவரத்தை இணைக்கவும்.",
    tierLabel: "நிலை",
    meetupsLabel: "சந்திப்புகள்",
    tripsLabel: "பயணங்கள்",
    sinceLabel: "உறுப்பினர் காலம்",
    travallyCardBtn: "டிராவல்லி அட்டை",

    settingsTitle: "அமைப்புகள்",
    account: "கணக்கு",
    accountInfo: "கணக்கு தகவல்",
    changePassword: "கடவுச்சொல்லை மாற்றவும்",
    changePasswordSub: "உங்கள் கணக்கு கடவுச்சொல்லை புதுப்பிக்கவும்",
    emailPrefs: "மின்னஞ்சல் விருப்பங்கள்",
    pushNotifs: "அறிவிப்புகள்",
    privacyDiscovery: "தனியுரிமை மற்றும் கண்டுபிடிப்பு",
    onlineStatus: "ஆன்லைன் நிலை மற்றும் செயல்பாடு",
    blockedUsers: "தடைசெய்யப்பட்ட பயனர்கள்",
    security: "பாதுகாப்பு",
    securityE2EE: "பாதுகாப்பு & என்க்ரிப்ஷன்",
    safetyCenter: "பாதுகாப்பு மையம் & விதிகள்",
    appearance: "தோற்றம்",
    darkMode: "டார்க் பயன்முறை",
    language: "மொழி",
    dataStorage: "தரவு & சேமிப்பகம்",
    storageUsage: "சேமிப்பக பயன்பாடு",
    downloadData: "என் தரவை பதிவிறக்கவும்",
    clearCache: "கேச் அழிக்கவும்",
    helpSupport: "உதவி & ஆதரவு",
    helpCenter: "உதவி மையம் & விதிகள்",
    contactSupport: "ஆதரவை தொடர்பு கொள்ளவும்",
    termsOfService: "சேவை விதிமுறைகள்",
    privacyPolicy: "தனியுரிமை கொள்கை",
    about: "பற்றி",
    aboutTravally: "ட்ராவல்லி பற்றி",
    accountActions: "கணக்கு செயல்கள்",
    signOut: "வெளியேறு",
    deactivateOrDelete: "கணக்கை முடக்கு அல்லது நீக்கு",

    savePreferences: "விருப்பங்களை சேமி",
    cancel: "ரத்து செய்",
    close: "மூடு",
    updatePassword: "கடவுச்சொல்லை புதுப்பி",
    deleteForever: "நிரந்தரமாக நீக்கு",
    deactivateAccount: "கணக்கை முடக்கு",

    postActivityTitle: "செயல்பாட்டை இடுகையிடவும்",
    postTripTitle: "பயணத்தை திட்டமிடுங்கள்",
    chooseCategoryStep1: "முதலில் நீங்கள் செய்ய விரும்பும் வகை அல்லது குறிச்சொல்லைத் தேர்ந்தெடுக்கவும்.",
    fillDetailsStep2: "உங்கள் திட்டமிட்ட செயல்பாட்டின் விவரங்களை நிரப்பவும்.",
    popularBadge: "பிரபலமானது",
    selectedCategoryTag: "தேர்ந்தெடுக்கப்பட்ட வகை",
    selectedTravelStyle: "தேர்ந்தெடுக்கப்பட்ட பயண பாணி",
    changeTag: "குறிச்சொல்லை மாற்று",
    changeStyle: "பாணியை மாற்று",
    activityTitleLabel: "செயல்பாட்டின் தலைப்பு *",
    activityTitlePlaceholder: "எ.கா. புதிய திரைப்படம் பார்த்தல் + காபி",
    descriptionPlanLabel: "விளக்கம் மற்றும் திட்டம் *",
    descriptionPlanPlaceholder: "நீங்கள் என்ன செய்ய திட்டமிட்டுள்ளீர்கள் என்பதை விவரிக்கவும்...",
    dateLabel: "தேதி *",
    startTimeLabel: "தொடக்க நேரம் *",
    durationLabel: "கால அளவு (தோராயமாக மணிநேரம்)",
    genderPrefLabel: "பாலின விருப்பம்",
    closeReqsLabel: "நிகழ்வுக்கு முன் கோரிக்கைகளை மூடு",
    joiningReqsLabel: "இணைவதற்கான தேவைகள் (விரும்பினால்)",
    joiningReqsPlaceholder: "எ.கா. முன்கூட்டியே டிக்கெட் வாங்கவும்",
    coverImageLabel: "அட்டைப் படம் (விரும்பினால்)",
    clickToUpload: "படத்தைப் பதிவேற்ற கிளிக் செய்யவும்",
    organizerReviewSafety: "ஒருங்கிணைப்பாளர் ஆய்வு & பாதுகாப்பு",
    organizerReviewSafetyDesc: "ஆர்வமுள்ள தோழர்கள் கோரிக்கைகளை அனுப்புவார்கள். தனிப்பட்ட அரட்டைக்கு முன் அவர்களின் சுயவிவரத்தை நீங்கள் மதிப்பாய்வு செய்யலாம்.",
    backToTags: "குறிச்சொற்களுக்கு திரும்பு",
    backToStyles: "பாணிகளுக்கு திரும்பு",
    publishActivity: "செயல்பாட்டை வெளியிடுங்கள்",
    publishTrip: "பயணத்தை வெளியிடுங்கள்",
    publishing: "வெளியிடுகிறது...",
    destinationLabel: "இலக்கு *",
    departureCityLabel: "புறப்படும் நகரம் *",
    startDateLabel: "தொடக்க தேதி *",
    endDateLabel: "முடிவு தேதி *",
    minBudgetLabel: "குறைந்தபட்ச பட்ஜெட் (₹)",
    maxBudgetLabel: "அதிகபட்ச பட்ஜெட் (₹)",
    accommodationLabel: "தங்குமிடம் விருப்பம்",
    transitPrefLabel: "போக்குவரத்து விருப்பம்",
    attractionsLabel: "திட்டமிடப்பட்ட இடங்கள்",
    addAttractionBtn: "சேர்",
    activityDetailsTitle: "செயல்பாட்டு விவரங்கள்",
    tripDetailsTitle: "பயணத் திட்ட விவரங்கள்",
    backToDiscover: "கண்டுபிடிக்கு திரும்பு",
    requestToJoin: "இணையக் கோருங்கள்",
    cancelRequest: "கோரிக்கையை ரத்து செய்",
    requestSent: "கோரிக்கை அனுப்பப்பட்டது",
    chatUnlocked: "அரட்டை திறக்கப்பட்டது",
    share: "பகிர்",
    report: "புகாரளி",
    deleteBtn: "நீக்கு",
    organizerLabel: "ஒருங்கிணைப்பாளர்",
    confirmedMembers: "உறுதிப்படுத்தப்பட்ட உறுப்பினர்கள்",

    catFoodTitle: "தெரு உணவு & கஃபேக்கள்",
    catFoodHint: "இரவு பிரியாணி, இரானி டீ, உணவு சுவைத்தல், கஃபே சந்திப்புகள்",
    catMoviesTitle: "திரைப்படங்கள் & சினிமா",
    catMoviesHint: "முதல் நாள் முதல் காட்சி (FDFS), ஐமாக்ஸ் திரையிடல், திரைப்பட விழாக்கள்",
    catSportsTitle: "விளையாட்டு & உடற்பயிற்சி",
    catSportsHint: "பாக்ஸ் கிரிக்கெட், பூப்பந்து, காலை ஓட்டம், டர்ஃப் கால்பந்து",
    catTechTitle: "தொழில்நுட்பம் & நெட்வொர்க்கிங்",
    catTechHint: "ஸ்டார்ட்அப் சந்திப்புகள், கோடிங் அமர்வுகள், இணை வேலை",
    catPubsTitle: "இரவு வாழ்க்கை & பப்கள்",
    catPubsHint: "பப்கள், பார்கள், கிளப்பிங், இரவு சந்தைகள், மாலை பார்ட்டிகள்",
    catShoppingTitle: "ஷாப்பிங் & பஜார்கள்",
    catShoppingHint: "இரவு சந்தைகள், தெரு ஷாப்பிங், வார இறுதி மால்கள்",
    catDrivesTitle: "நீண்ட பயணங்கள் (லாங் டிரைவ்)",
    catDrivesHint: "நகருக்கு வெளியே இரவு பயணங்கள், தாபா உணவு, பைக் ரைடு",
    catOtherTitle: "மற்ற சந்திப்புகள்",
    catOtherHint: "போர்டு கேம் கஃபேக்கள், சாதாரண சந்திப்புகள், பகிரப்பட்ட பொழுதுபோக்குகள்",

    styleBikersTitle: "பைக் குழு பயணம்",
    styleBikersDesc: "மோட்டார் சைக்கிள் சுற்றுலா, பைக் பயணங்கள் மற்றும் நெடுஞ்சாலை சவாரிகள்",
    styleCulturalTitle: "கலாச்சாரம் & பாரம்பரியம்",
    styleCulturalDesc: "வரலாற்று இடங்கள், கட்டிடக்கலை, அருங்காட்சியகங்கள்",
    styleSlowTravelTitle: "நிதானமான பயணம் (ஸ்லோ டிராவல்)",
    styleSlowTravelDesc: "அமைதியான ஆய்வு, உள்ளூர் கலாச்சார அனுபவம்",
    styleBackpackingTitle: "பேக்பேக்கிங் & ஹாஸ்டல்கள்",
    styleBackpackingDesc: "குறைந்த பட்ஜெட், நெகிழ்வான பயணம், புதிய இடங்கள்",
    styleAdventureTitle: "சாகசம் & மலையேற்றம்",
    styleAdventureDesc: "மலைப்பாதைகள், மலையேற்றம், இயற்கை நடைபயணம்",
    styleRoadTripTitle: "சாலைப் பயணம் (ரோட் ட்ரிப்)",
    styleRoadTripDesc: "நெடுஞ்சாலைப் பயணம், கிராமப்புற ஆய்வு, பைக்/கார் பயணம்",
    styleLuxuryTitle: "சொகுசு & பூட்டிக் தங்குமிடம்",
    styleLuxuryDesc: "சொகுசு ரிசார்ட்டுகள், சிறந்த உணவு, தனிப்பயன் சுற்றுப்பயணம்",
    styleRelaxationTitle: "ஓய்வு & ஆரோக்கியம்",
    styleRelaxationDesc: "இயற்கை நீரூற்றுகள், கடற்கரை ஓய்வு, அமைதியான இடங்கள்",

    genderAny: "அனைவரும் வரவேற்கப்படுகிறார்கள்",
    genderWomenOnly: "பெண்கள் மட்டும்",
    genderMenOnly: "ஆண்கள் மட்டும்",

    cutoff1Hour: "தொடங்குவதற்கு 1 மணி நேரம் முன் (இயல்புநிலை)",
    cutoff30Mins: "தொடங்குவதற்கு 30 நிமிடங்கள் முன்",
    cutoff2Hours: "தொடங்குவதற்கு 2 மணி நேரம் முன்",
    cutoff3Hours: "தொடங்குவதற்கு 3 மணி நேரம் முன்",
    cutoff6Hours: "தொடங்குவதற்கு 6 மணி நேரம் முன்",
    cutoff12Hours: "தொடங்குவதற்கு 12 மணி நேரம் முன்",
    cutoff24Hours: "தொடங்குவதற்கு 24 மணி நேரம் முன்",

    accHostel: "பேக்பேக்கர் ஹாஸ்டல் / ஹோம்ஸ்டே",
    accHotel: "3-நட்சத்திர ஹோட்டல் / ரிசார்ட்",
    accLuxury: "பூட்டிக் தங்குமிடம் / வில்லா",
    accFlexible: "நெகிழ்வானது / ஒன்றாக முடிவு செய்யலாம்",

    transitTrain: "ரயில் பயணம்",
    transitFlight: "விமானம் (ஃப்ளைட்)",
    transitBus: "ஸ்லீப்பர் பேருந்து / வோல்வோ",
    transitSelfDrive: "சொந்தமாக ஓட்டும் கார் / பைக்",
    transitFlexible: "நெகிழ்வானது",
  },
  kn: {
    home: "ಮುಖಪುಟ",
    discover: "ಅನ್ವೇಷಿಸಿ",
    create: "ರಚಿಸಿ",
    requests: "ವಿನಂತಿಗಳು",
    chats: "ಚಾಟ್‌ಗಳು",
    profile: "ಪ್ರೊಫೈಲ್",
    settings: "ಸೆಟ್ಟಿಂಗ್‌ಗಳು",

    searchPlaceholder: "ಚಟುವಟಿಕೆಗಳು, ಪ್ರವಾಸಗಳನ್ನು ಹುಡುಕಿ...",
    login: "ಲಾಗಿನ್",
    joinFree: "ಉಚಿತವಾಗಿ ಸೇರಿ",
    notifications: "ಅಧಿಸೂಚನೆಗಳು",
    markAllRead: "ಎಲ್ಲವನ್ನೂ ಓದಿದ್ದಾಗಿ ಗುರುತಿಸಿ",
    noNotifications: "ಇನ್ನೂ ಯಾವುದೇ ಅಧಿಸೂಚನೆಗಳಿಲ್ಲ",

    companion: "ಸಂಗಾತಿ",
    travel: "ಪ್ರವಾಸ",
    discoverCompanions: "ಸಂಗಾತಿಗಳನ್ನು ಅನ್ವೇಷಿಸಿ",
    discoverTravel: "ಪ್ರವಾಸಗಳನ್ನು ಅನ್ವೇಷಿಸಿ",
    allActivities: "ಎಲ್ಲಾ ಚಟುವಟಿಕೆಗಳು",
    allStyles: "ಎಲ್ಲಾ ಶೈಲಿಗಳು",
    createActivity: "ಚಟುವಟಿಕೆ ರಚಿಸಿ",
    createTrip: "ಪ್ರವಾಸ ಯೋಜಿಸಿ",

    allCategories: "ಎಲ್ಲಾ ವರ್ಗಗಳು",
    filterByCategory: "ವರ್ಗದ ಪ್ರಕಾರ ಫಿಲ್ಟರ್ ಮಾಡಿ",
    sortLabel: "ಕ್ರಮ",
    sortSoonest: "ಶೀಘ್ರದಲ್ಲೇ",
    sortSpotsLeft: "ಲಭ್ಯ",
    sortNewest: "ಹೊಸತು",
    sortName: "ಹೆಸರು",
    sortDestination: "ತಾಣ",
    filterByTravelStyle: "ಪ್ರವಾಸ ಶೈಲಿಯ ಪ್ರಕಾರ ಫಿಲ್ಟರ್",
    spotsAvailable: "ಸ್ಥಳಗಳು ಲಭ್ಯವಿದೆ",

    noActivitiesFound: "ಯಾವುದೇ ಚಟುವಟಿಕೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ",
    noActivitiesDesc: "ನಿಮ್ಮ ಪ್ರದೇಶದಲ್ಲಿ ಈ ವರ್ಗಕ್ಕಾಗಿ ಚಟುವಟಿಕೆಯನ್ನು ಆಯೋಜಿಸಿದ ಮೊದಲ ವ್ಯಕ್ತಿಯಾಗಿ!",
    noTripsFound: "ಯಾವುದೇ ಪ್ರವಾಸಗಳು ಕಂಡುಬಂದಿಲ್ಲ",
    noTripsDesc: "ನಿಮ್ಮ ಮುಂಬರುವ ಗಮ್ಯಸ್ಥಾನವನ್ನು ಪ್ರಕಟಿಸಿ ಮತ್ತು ಸಹ ಪರಿಶೋಧಕರೊಂದಿಗೆ ಸಂಪರ್ಕ ಸಾಧಿಸಿ.",

    receivedRequests: "ಸ್ವೀಕರಿಸಿದ ವಿನಂತಿಗಳು",
    sentRequests: "ಕಳುಹಿಸಿದ ವಿನಂತಿಗಳು",
    noRequestsReceived: "ಇನ್ನೂ ಯಾವುದೇ ವಿನಂತಿಗಳು ಬಂದಿಲ್ಲ",
    noRequestsReceivedDesc: "ನಿಮ್ಮ ಚಟುವಟಿಕೆಗಳು ಅಥವಾ ಪ್ರವಾಸಗಳಲ್ಲಿ ಜನರು ಆಸಕ್ತಿ ತೋರಿಸಿದಾಗ, ಅವು ಇಲ್ಲಿ ಪರಿಶೀಲನೆಗೆ ಕಾಣಿಸಿಕೊಳ್ಳುತ್ತವೆ.",
    noRequestsSent: "ನೀವು ಇನ್ನೂ ಯಾವುದೇ ವಿನಂತಿಯನ್ನು ಕಳುಹಿಸಿಲ್ಲ",
    noRequestsSentDesc: 'ಚಟುವಟಿಕೆಗಳು ಅಥವಾ ಪ್ರವಾಸಗಳನ್ನು ಅನ್ವೇಷಿಸಿ ಮತ್ತು ಸೇರಲು ವಿನಂತಿಸಿ.',
    exploreDiscoverFeed: "ಅನ್ವೇಷಣೆ ಫೀಡ್ ವೀಕ್ಷಿಸಿ",
    accept: "ಸ್ವೀಕರಿಸಿ",
    decline: "ತಿರಸ್ಕರಿಸಿ",

    chatsTitle: "ಚಾಟ್‌ಗಳು",
    searchConversations: "ಸಂಭಾಷಣೆಗಳನ್ನು ಹುಡುಕಿ...",
    noConversations: "ಇನ್ನೂ ಯಾವುದೇ ಸಂಭಾಷಣೆಗಳಿಲ್ಲ",
    noConversationsDesc: "ಸಂಘಟಕರು ನಿಮ್ಮ ವಿನಂತಿಯನ್ನು ಸ್ವೀಕರಿಸಿದಾಗ, ನಿಮ್ಮ ಖಾಸಗಿ ಎನ್‌ಕ್ರಿಪ್ಟ್ ಮಾಡಿದ ಗುಂಪು ಚಾಟ್ ಇಲ್ಲಿ ಕಾಣಿಸಿಕೊಳ್ಳುತ್ತದೆ.",
    encryptedMessage: "🔒 ಎನ್‌ಕ್ರಿಪ್ಟ್ ಮಾಡಿದ ಸಂದೇಶ",
    privateGateTitle: "ಖಾಸಗಿ ಗುಂಪು ಗೇಟ್",
    privateGateDesc: "ಈ ಖಾಸಗಿ ಗುಂಪು ಚಾಟ್ ರಕ್ಷಿಸಲಾಗಿದೆ. ಆಯೋಜಕರು ನಿಮ್ಮ ವಿನಂತಿಯನ್ನು ಅನುಮೋದಿಸಿದ ತಕ್ಷಣ ಚಾಟ್ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಅನ್‌ಲಾಕ್ ಆಗುತ್ತದೆ.",
    chatExpiredTitle: "ಚಾಟ್ ಅವಧಿ ಮುಗಿದಿದೆ & ಅಳಿಸಲಾಗಿದೆ",
    chatExpiredDesc: "ಟ್ರಾವಲ್ಲಿ ಗೌಪ್ಯತಾ ನೀತಿಯ ಪ್ರಕಾರ, ಈವೆಂಟ್ ಮುಗಿದ 7 ದಿನಗಳ ನಂತರ ಈ ಚಾಟ್ ಶಾಶ್ವತವಾಗಿ ಅಳಿಸಲಾಗಿದೆ.",
    returnToDiscover: "ಅನ್ವೇಷಣೆಗೆ ಹಿಂತಿರುಗಿ",
    returnToChats: "ಚಾಟ್‌ಗಳಿಗೆ ಹಿಂತಿರುಗಿ",
    tapToMessage: "ಸಂದೇಶ ಕಳುಹಿಸಲು ಟ್ಯಾಪ್ ಮಾಡಿ",
    callBtn: "ಕರೆ",
    e2eeNotice: "ಸಂದೇಶಗಳು ಮತ್ತು ಕರೆಗಳು ಎಂಡ್-ಟು-ಎಂಡ್ ಎನ್‌ಕ್ರಿಪ್ಟ್ ಆಗಿವೆ. ಈ ಚಾಟ್ ಹೊರಗಿನ ಯಾರೂ, ಟ್ರಾವಲ್ಲಿ ಕೂಡ ಇವುಗಳನ್ನು ಓದಲು ಸಾಧ್ಯವಿಲ್ಲ.",

    myProfile: "ನನ್ನ ಪ್ರೊಫೈಲ್",
    editProfile: "ಪ್ರೊಫೈಲ್ ಸಂಪಾದಿಸಿ",
    saveProfile: "ಪ್ರೊಫೈಲ್ ಉಳಿಸಿ",
    bio: "ಬಯೋ",
    interests: "ಆಸಕ್ತಿಗಳು",
    city: "ನಗರ",
    travallyPass: "ಟ್ರಾವಲ್ಲಿ ಪಾಸ್",
    digitalIdentityPass: "ಡಿಜಿಟಲ್ ಗುರುತಿನ ಪಾಸ್",
    tapCardToFlip: "ಕಾರ್ಡ್ ತಿರುಗಿಸಲು ಟ್ಯಾಪ್ ಮಾಡಿ",
    copyId: "ಐಡಿ ನಕಲಿಸಿ",
    copied: "ನಕಲಿಸಲಾಗಿದೆ!",
    copyPass: "ಪಾಸ್ ನಕಲಿಸಿ",
    passNumberCopied: "ಪಾಸ್ ಸಂಖ್ಯೆ ನಕಲಿಸಲಾಗಿದೆ!",
    verifiedBadges: "ಪರಿಶೀಲಿಸಿದ ಬ್ಯಾಡ್ಜ್‌ಗಳು",
    verifiedBadgesDesc: "ನಿಮ್ಮ ಬ್ಯಾಡ್ಜ್‌ಗಳು ಚಟುವಟಿಕೆ ಗುಂಪುಗಳು ಮತ್ತು ಒಡನಾಡಿಗಳಲ್ಲಿ ನಂಬಿಕೆಯನ್ನು ನಿರ್ಮಿಸುತ್ತವೆ.",
    identityVerification: "ಗುರುತಿನ ಪರಿಶೀಲನೆ",
    verifiedMember: "ಪರಿಶೀಲಿಸಿದ ಸದಸ್ಯ",
    unverifiedMember: "ಪರಿಶೀಲಿಸದ ಸದಸ್ಯ",
    verifiedMemberDesc: "ಟ್ರಾವಲ್ಲಿಯಿಂದ ಗುರುತು ಪರಿಶೀಲಿಸಲಾಗಿದೆ.",
    unverifiedMemberDesc: "ಚಟುವಟಿಕೆಗಳಲ್ಲಿ ಪರಿಶೀಲಿಸಿದ ಬ್ಯಾಡ್ಜ್ ಪ್ರದರ್ಶಿಸಲು ಲಿಂಕ್ಡ್‌ಇನ್ ಪ್ರೊಫೈಲ್ ಸಂಪರ್ಕಿಸಿ.",
    tierLabel: "ಹಂತ",
    meetupsLabel: "ಮೀಟಪ್‌ಗಳು",
    tripsLabel: "ಪ್ರವಾಸಗಳು",
    sinceLabel: "ಸದಸ್ಯತ್ವ",
    travallyCardBtn: "ಟ್ರಾವಲ್ಲಿ ಕಾರ್ಡ್",

    settingsTitle: "ಸೆಟ್ಟಿಂಗ್‌ಗಳು",
    account: "ಖಾತೆ",
    accountInfo: "ಖಾತೆ ಮಾಹಿತಿ",
    changePassword: "ಪಾಸ್‌ವರ್ಡ್ ಬದಲಾಯಿಸಿ",
    changePasswordSub: "ನಿಮ್ಮ ಖಾತೆ ಪಾಸ್‌ವರ್ಡ್ ನವೀಕರಿಸಿ",
    emailPrefs: "ಇಮೇಲ್ ಆದ್ಯತೆಗಳು",
    pushNotifs: "ಅಧಿಸೂಚನೆಗಳು",
    privacyDiscovery: "ಗೌಪ್ಯತೆ ಮತ್ತು ಶೋಧನೆ",
    onlineStatus: "ಆನ್‌ಲೈನ್ ಸ್ಥಿತಿ ಮತ್ತು ಚಟುವಟಿಕೆ",
    blockedUsers: "ನಿರ್ಬಂಧಿತ ಬಳಕೆದಾರರು",
    security: "ಭದ್ರತೆ",
    securityE2EE: "ಭದ್ರತೆ & ಗೂಢಲಿಪೀಕರಣ",
    safetyCenter: "ಭದ್ರತಾ ಕೇಂದ್ರ & ನಿಯಮಗಳು",
    appearance: "ಗೋಚರತೆ",
    darkMode: "ಡಾರ್ಕ್ ಮೋಡ್",
    language: "ಭಾಷೆ",
    dataStorage: "ಡೇಟಾ ಮತ್ತು ಸಂಗ್ರಹಣೆ",
    storageUsage: "ಸಂಗ್ರಹಣೆ ಬಳಕೆ",
    downloadData: "ನನ್ನ ಡೇಟಾ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ",
    clearCache: "ಕ್ಯಾಶ್ ತೆರವುಗೊಳಿಸಿ",
    helpSupport: "ಸಹಾಯ ಮತ್ತು ಬೆಂಬಲ",
    helpCenter: "ಸಹಾಯ ಕೇಂದ್ರ & ನಿಯಮಗಳು",
    contactSupport: "ಬೆಂಬಲವನ್ನು ಸಂಪರ್ಕಿಸಿ",
    termsOfService: "ಸೇವಾ ನಿಯಮಗಳು",
    privacyPolicy: "ಗೌಪ್ಯತಾ ನೀತಿ",
    about: "ಕುರಿತು",
    aboutTravally: "ಟ್ರಾವಲ್ಲಿ ಕುರಿತು",
    accountActions: "ಖಾತೆ ಕ್ರಿಯೆಗಳು",
    signOut: "ಸೈನ್ ಔಟ್",
    deactivateOrDelete: "ಖಾತೆ ನಿಷ್ಕ್ರಿಯಗೊಳಿಸಿ ಅಥವಾ ಅಳಿಸಿ",

    savePreferences: "ಆದ್ಯತೆಗಳನ್ನು ಉಳಿಸಿ",
    cancel: "ರದ್ದುಮಾಡಿ",
    close: "ಮುಚ್ಚಿ",
    updatePassword: "ಪಾಸ್‌ವರ್ಡ್ ನವೀಕರಿಸಿ",
    deleteForever: "ಶಾಶ್ವತವಾಗಿ ಅಳಿಸಿ",
    deactivateAccount: "ಖಾತೆ ನಿಷ್ಕ್ರಿಯಗೊಳಿಸಿ",

    postActivityTitle: "ಚಟುವಟಿಕೆಯನ್ನು ಪೋಸ್ಟ್ ಮಾಡಿ",
    postTripTitle: "ಪ್ರವಾಸವನ್ನು ಯೋಜಿಸಿ",
    chooseCategoryStep1: "ಮೊದಲು ನೀವು ಮಾಡಲು ಬಯಸುವ ಚಟುವಟಿಕೆ ಟ್ಯಾಗ್ ಅಥವಾ ವರ್ಗವನ್ನು ಆಯ್ಕೆಮಾಡಿ.",
    fillDetailsStep2: "ನಿಮ್ಮ ಯೋಜಿತ ಚಟುವಟಿಕೆಯ ವಿವರಗಳನ್ನು ಭರ್ತಿ ಮಾಡಿ.",
    popularBadge: "ಜನಪ್ರಿಯ",
    selectedCategoryTag: "ಆಯ್ಕೆಮಾಡಿದ ವರ್ಗ ಟ್ಯಾಗ್",
    selectedTravelStyle: "ಆಯ್ಕೆಮಾಡಿದ ಪ್ರವಾಸ ಶೈಲಿ",
    changeTag: "ಟ್ಯಾಗ್ ಬದಲಾಯಿಸಿ",
    changeStyle: "ಶೈಲಿ ಬದಲಾಯಿಸಿ",
    activityTitleLabel: "ಚಟುವಟಿಕೆಯ ಶೀರ್ಷಿಕೆ *",
    activityTitlePlaceholder: "ಉದಾ. ಹೊಸ ಚಲನಚಿತ್ರ ವೀಕ್ಷಣೆ + ಕಾಫಿ",
    descriptionPlanLabel: "ವಿವರಣೆ ಮತ್ತು ಯೋಜನೆ *",
    descriptionPlanPlaceholder: "ನೀವು ಏನು ಮಾಡಲು ಯೋಜಿಸುತ್ತಿದ್ದೀರಿ ಎಂಬುದನ್ನು ವಿವರಿಸಿ...",
    dateLabel: "ದಿನಾಂಕ *",
    startTimeLabel: "ಪ್ರಾರಂಭದ ಸಮಯ *",
    durationLabel: "ಅವಧಿ (ಅಂದಾಜು ಗಂಟೆಗಳು)",
    genderPrefLabel: "ಲಿಂಗ ಆದ್ಯತೆ",
    closeReqsLabel: "ಈವೆಂಟ್‌ಗೆ ಮುಂಚಿತವಾಗಿ ವಿನಂತಿಗಳನ್ನು ಮುಚ್ಚಿ",
    joiningReqsLabel: "ಸೇರಲು ಅಗತ್ಯತೆಗಳು (ಐಚ್ಛಿಕ)",
    joiningReqsPlaceholder: "ಉದಾ. ಮುಂಚಿತವಾಗಿ ಟಿಕೆಟ್ ಖರೀದಿಸಿ",
    coverImageLabel: "ಕವರ್ ಚಿತ್ರ (ಐಚ್ಛಿಕ)",
    clickToUpload: "ಚಿತ್ರ ಅಪ್‌ಲೋಡ್ ಮಾಡಲು ಕ್ಲಿಕ್ ಮಾಡಿ",
    organizerReviewSafety: "ಸಂಘಟಕರ ಪರಿಶೀಲನೆ ಮತ್ತು ಸುರಕ್ಷತೆ",
    organizerReviewSafetyDesc: "ಆಸಕ್ತ ಸಂಗಾತಿಗಳು ವಿನಂತಿಗಳನ್ನು ಕಳುಹಿಸುತ್ತಾರೆ. ಖಾಸಗಿ ಚಾಟ್ ಮೊದಲು ನೀವು ಅವರ ಪ್ರೊಫೈಲ್ ಪರಿಶೀಲಿಸಬಹುದು.",
    backToTags: "ಟ್ಯಾಗ್‌ಗಳಿಗೆ ಹಿಂತಿರುಗಿ",
    backToStyles: "ಶೈಲಿಗಳಿಗೆ ಹಿಂತಿರುಗಿ",
    publishActivity: "ಚಟುವಟಿಕೆ ಪ್ರಕಟಿಸಿ",
    publishTrip: "ಪ್ರವಾಸ ಪ್ರಕಟಿಸಿ",
    publishing: "ಪ್ರಕಟಿಸಲಾಗುತ್ತಿದೆ...",
    destinationLabel: "ತಾಣ *",
    departureCityLabel: "ಪ್ರಾರಂಭದ ನಗರ *",
    startDateLabel: "ಪ್ರಾರಂಭದ ದಿನಾಂಕ *",
    endDateLabel: "ಮುಕ್ತಾಯದ ದಿನಾಂಕ *",
    minBudgetLabel: "ಕನಿಷ್ಠ ಬಜೆಟ್ (₹)",
    maxBudgetLabel: "ಗರಿಷ್ಠ ಬಜೆಟ್ (₹)",
    accommodationLabel: "ವಸತಿ ಆದ್ಯತೆ",
    transitPrefLabel: "ಸಾರಿಗೆ ಆದ್ಯತೆ",
    attractionsLabel: "ಯೋಜಿತ ಆಕರ್ಷಣೆಗಳು ಮತ್ತು ತಾಣಗಳು",
    addAttractionBtn: "ಸೇರಿಸಿ",
    activityDetailsTitle: "ಚಟುವಟಿಕೆ ವಿವರಗಳು",
    tripDetailsTitle: "ಪ್ರವಾಸ ಯೋಜನೆ ವಿವರಗಳು",
    backToDiscover: "ಅನ್ವೇಷಣೆಗೆ ಹಿಂತಿರುಗಿ",
    requestToJoin: "ಸೇರಲು ವಿನಂತಿಸಿ",
    cancelRequest: "ವಿನಂತಿಯನ್ನು ರದ್ದುಮಾಡಿ",
    requestSent: "ವಿನಂತಿ ಕಳುಹಿಸಲಾಗಿದೆ",
    chatUnlocked: "ಚಾಟ್ ಅನ್‌ಲಾಕ್ ಆಗಿದೆ",
    share: "ಹಂಚಿಕೊಳ್ಳಿ",
    report: "ವರದಿ ಮಾಡಿ",
    deleteBtn: "ಅಳಿಸಿ",
    organizerLabel: "ಆಯೋಜಕರು",
    confirmedMembers: "ದೃಢಪಡಿಸಿದ ಸದಸ್ಯರು",

    catFoodTitle: "ಸ್ಟ್ರೀಟ್ ಫುಡ್ & ಕೆಫೆಗಳು",
    catFoodHint: "ರಾತ್ರಿ ಬಿರಿಯಾನಿ, ಇರಾನಿ ಚಹಾ, ಬ್ರೂವರಿ ಹಾಪಿಂಗ್, ಸ್ಟ್ರೀಟ್ ಫುಡ್ ರುಚಿ",
    catMoviesTitle: "ಚಲನಚಿತ್ರಗಳು & ಸಿನಿಮಾ",
    catMoviesHint: "ಮೊದಲ ದಿನ ಮೊದಲ ಪ್ರದರ್ಶನ (FDFS), ಐಮ್ಯಾಕ್ಸ್ ಸ್ಕ್ರೀನಿಂಗ್, ಸಿನಿಮಾ ಉತ್ಸವಗಳು",
    catSportsTitle: "ಟರ್ಫ್ ಸ್ಪೋರ್ಟ್ಸ್ & ಫಿಟ್‌ನೆಸ್",
    catSportsHint: "ಬಾಕ್ಸ್ ಕ್ರಿಕೆಟ್, ಬ್ಯಾಡ್ಮಿಂಟನ್, ಬೆಳಗಿನ ಓಟ, ಟರ್ಫ್ ಫುಟ್‌ಬಾಲ್",
    catTechTitle: "ಟೆಕ್ & ನೆಟ್‌ವರ್ಕಿಂಗ್",
    catTechHint: "ಸ್ಟಾರ್ಟಪ್ ಮೀಟಪ್, ಕೋಡಿಂಗ್ ಸೆಷನ್, ಸಹ-ಕೆಲಸ, ಸಂಸ್ಥಾಪಕರ ಚರ್ಚೆಗಳು",
    catPubsTitle: "ನೈಟ್‌ಲೈಫ್ & ಪಬ್‌ಗಳು",
    catPubsHint: "ಪಬ್‌ಗಳು, ಬಾರ್‌ಗಳು, ಕ್ಲಬ್, ನೈಟ್ ಮಾರ್ಕೆಟ್, ಸಂಜೆಯ ಮನರಂಜನೆ",
    catShoppingTitle: "ಶಾಪಿಂಗ್ & ಬಜಾರ್‌ಗಳು",
    catShoppingHint: "ನೈಟ್ ಮಾರ್ಕೆಟ್, ಬೀದಿ ಶಾಪಿಂಗ್, ವಾರಾಂತ್ಯದ ಮಾಲ್ ಭೇಟಿ",
    catDrivesTitle: "ಲಾಂಗ್ ಡ್ರೈವ್ & ಪ್ರವಾಸ",
    catDrivesHint: "ನಗರದ ಹೊರಗೆ ರಾತ್ರಿ ಡ್ರೈವ್, ಧಾಬಾ ಊಟ, ವಾರಾಂತ್ಯದ ರೈಡ್",
    catOtherTitle: "ಇತರ ಸಭೆಗಳು",
    catOtherHint: "ಬೋರ್ಡ್ ಗೇಮ್ ಕೆಫೆಗಳು, ಸಾಮಾನ್ಯ ಸಭೆಗಳು, ಅಥವಾ ಹಂಚಿಕೊಂಡ ಆಸಕ್ತಿಗಳು",

    styleBikersTitle: "ಬೈಕರ್ಸ್ ಗ್ರೂಪ್ ಟ್ರಿಪ್",
    styleBikersDesc: "ಮೋಟಾರ್‌ಸೈಕಲ್ ಪ್ರವಾಸ, ಬೈಕಿಂಗ್ ಸಾಹಸಗಳು ಮತ್ತು ಹೈವೇ ರೈಡ್‌ಗಳು",
    styleCulturalTitle: "ಸಾಂಸ್ಕೃತಿಕ & ಪರಂಪರೆ",
    styleCulturalDesc: "ಐತಿಹಾಸಿಕ ಸ್ಥಳಗಳು, ವಾಸ್ತುಶಿಲ್ಪ, ವಸ್ತುಸಂಗ್ರಹಾಲಯಗಳು",
    styleSlowTravelTitle: "ಶಾಂತ ಪ್ರವಾಸ (ಸ್ಲೋ ಟ್ರಾವೆಲ್)",
    styleSlowTravelDesc: "ನೆಮ್ಮದಿಯ ಅನ್ವೇಷಣೆ, ಸ್ಥಳೀಯ ಸಂಸ್ಕೃತಿಯ ಅನುಭವ",
    styleBackpackingTitle: "ಬ್ಯಾಕ್‌ಪ್ಯಾಕಿಂಗ್ & ಹಾಸ್ಟೆಲ್‌ಗಳು",
    styleBackpackingDesc: "ಬಜೆಟ್ ಹಾಸ್ಟೆಲ್‌ಗಳು, ಹೊಂದಿಕೊಳ್ಳುವ ಪ್ರವಾಸ, ಹೊಸ ತಾಣಗಳು",
    styleAdventureTitle: "ಸಾಹಸ & ಹೈಕಿಂಗ್",
    styleAdventureDesc: "ಪರ್ವತ ಹಾದಿಗಳು, ಟ್ರೆಕ್ಕಿಂಗ್, ನಿಸರ್ಗ ನಡಿಗೆ",
    styleRoadTripTitle: "ರೋಡ್ ಟ್ರಿಪ್",
    styleRoadTripDesc: "ಹೆದ್ದಾರಿ ಡ್ರೈವ್, ಗ್ರಾಮೀಣ ಅನ್ವೇಷಣೆ, ಬೈಕ್/ಕಾರು ಪ್ರಯಾಣ",
    styleLuxuryTitle: "ಐಷಾರಾಮಿ & ಬೊಟಿಕ್ ವಾಸ್ತವ್ಯ",
    styleLuxuryDesc: "ಐಷಾರಾಮಿ ರೆಸಾರ್ಟ್‌ಗಳು, ಉತ್ತಮ ಭೋಜನ, ಖಾಸಗಿ ಪ್ರವಾಸಗಳು",
    styleRelaxationTitle: "ವಿಶ್ರಾಂತಿ & ಕ್ಷೇಮ",
    styleRelaxationDesc: "ಬಿಸಿನೀರಿನ ಬುಗ್ಗೆಗಳು, ಕಡಲತೀರದ ವಿಶ್ರಾಂತಿ, ಶಾಂತಿಯುತ ಸ್ಥಳಗಳು",

    genderAny: "ಯಾವುದೇ ಲಿಂಗದವರಿಗೂ ಸ್ವಾಗತ",
    genderWomenOnly: "ಮಹಿಳೆಯರಿಗೆ ಮಾತ್ರ",
    genderMenOnly: "ಪುರುಷರಿಗೆ ಮಾತ್ರ",

    cutoff1Hour: "ಪ್ರಾರಂಭಕ್ಕೆ 1 ಗಂಟೆ ಮೊದಲು (ಡೀಫಾಲ್ಟ್)",
    cutoff30Mins: "ಪ್ರಾರಂಭಕ್ಕೆ 30 ನಿಮಿಷ ಮೊದಲು",
    cutoff2Hours: "ಪ್ರಾರಂಭಕ್ಕೆ 2 ಗಂಟೆ ಮೊದಲು",
    cutoff3Hours: "ಪ್ರಾರಂಭಕ್ಕೆ 3 ಗಂಟೆ ಮೊದಲು",
    cutoff6Hours: "ಪ್ರಾರಂಭಕ್ಕೆ 6 ಗಂಟೆ ಮೊದಲು",
    cutoff12Hours: "ಪ್ರಾರಂಭಕ್ಕೆ 12 ಗಂಟೆ ಮೊದಲು",
    cutoff24Hours: "ಪ್ರಾರಂಭಕ್ಕೆ 24 ಗಂಟೆ ಮೊದಲು",

    accHostel: "ಬ್ಯಾಕ್‌ಪ್ಯಾಕರ್ ಹಾಸ್ಟೆಲ್ / ಹೋಮ್‌ಸ್ಟೇ",
    accHotel: "3-ಸ್ಟಾರ್ ಹೋಟೆಲ್ / ರೆಸಾರ್ಟ್",
    accLuxury: "ಬೊಟಿಕ್ ವಾಸ್ತವ್ಯ / ವಿಲ್ಲಾ",
    accFlexible: "ಹೊಂದಿಕೊಳ್ಳುವ / ಒಟ್ಟಿಗೆ ನಿರ್ಧರಿಸಿ",

    transitTrain: "ರೈಲು ಪ್ರಯಾಣ",
    transitFlight: "ವಿಮಾನ ಪ್ರಯಾಣ",
    transitBus: "ಸ್ಲೀಪರ್ ಬಸ್ / ವೋಲ್ವೋ",
    transitSelfDrive: "ಸೆಲ್ಫ್ ಡ್ರೈವ್ ಕಾರ್ / ಬೈಕ್",
    transitFlexible: "ಹೊಂದಿಕೊಳ್ಳುವ",
  },
};

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: TranslationDictionary;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  t: translations.en,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>("en");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem("travally-language") as LanguageCode;
      if (saved && translations[saved]) {
        setLanguageState(saved);
        document.documentElement.lang = saved;
      }
    } catch {
      /* ignore */
    }

    const handleCustomChange = (e: any) => {
      const newLang = e.detail?.language as LanguageCode;
      if (newLang && translations[newLang]) {
        setLanguageState(newLang);
        document.documentElement.lang = newLang;
      }
    };

    window.addEventListener("travally-language-change", handleCustomChange);
    return () => window.removeEventListener("travally-language-change", handleCustomChange);
  }, []);

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("travally-language", lang);
        document.documentElement.lang = lang;
        window.dispatchEvent(new CustomEvent("travally-language-change", { detail: { language: lang } }));
      } catch {
        /* ignore */
      }
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: translations[language] || translations.en }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
