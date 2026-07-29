export type Locale = "en" | "he";

export const locales: Locale[] = ["en", "he"];

export const localeLabels: Record<Locale, string> = {
  en: "EN",
  he: "עב",
};

type Dict = {
  brand: string;
  tagline: string;
  spots: string;
  spotsEmpty: string;
  addSpot: string;
  signIn: string;
  signOut: string;
  setupNeeded: string;
  shareSpotTitle: string;
  shareSpotSubtitle: string;
  configureSupabase: string;
  backHome: string;
  name: string;
  description: string;
  regionOptional: string;
  photoUrlOptional: string;
  namePlaceholder: string;
  descriptionPlaceholder: string;
  regionPlaceholder: string;
  tapMap: string;
  clickMapError: string;
  saveFailed: string;
  saving: string;
  shareSpot: string;
  signInTitle: string;
  signInSubtitle: string;
  email: string;
  sendMagicLink: string;
  sending: string;
  checkInbox: string;
  supabaseNotConfigured: string;
  magicLinkFailed: string;
  loading: string;
  backToMap: string;
  latitude: string;
  longitude: string;
  openOsm: string;
  welcomeTitle: string;
  welcomeBody: string;
  welcomeCta: string;
  welcomeClose: string;
};

export const dictionaries: Record<Locale, Dict> = {
  en: {
    brand: "After the Sun",
    tagline: "Sunset spots shared across Israel — find yours on the map.",
    spots: "Spots",
    spotsEmpty: "No spots yet. Be the first to share a sunset.",
    addSpot: "Add spot",
    signIn: "Sign in",
    signOut: "Sign out",
    setupNeeded:
      "Connect Supabase in .env (see .env.example), then run npx prisma db push and npm run db:seed.",
    shareSpotTitle: "Share a sunset spot",
    shareSpotSubtitle: "Name it, describe the vibe, and pin it on the map.",
    configureSupabase: "Configure Supabase in .env before adding spots.",
    backHome: "Back home",
    name: "Name",
    description: "Description",
    regionOptional: "Region (optional)",
    photoUrlOptional: "Photo URL (optional)",
    namePlaceholder: "Jaffa Port lookout",
    descriptionPlaceholder: "Why is this a great sunset spot?",
    regionPlaceholder: "Tel Aviv",
    tapMap: "Tap the map to drop a pin",
    clickMapError: "Click the map to set the spot location.",
    saveFailed: "Failed to save spot",
    saving: "Saving…",
    shareSpot: "Share spot",
    signInTitle: "Sign in",
    signInSubtitle: "We'll email you a magic link — no password needed.",
    email: "Email",
    sendMagicLink: "Send magic link",
    sending: "Sending…",
    checkInbox: "Check your inbox for a link to finish signing in.",
    supabaseNotConfigured: "Supabase is not configured yet. Add keys to .env.",
    magicLinkFailed: "Could not send magic link",
    loading: "Loading…",
    backToMap: "Back to map",
    latitude: "Latitude",
    longitude: "Longitude",
    openOsm: "Open in OpenStreetMap",
    welcomeTitle: "Welcome to After the Sun",
    welcomeBody:
      "The community for sunset lovers. Discover hidden spots, rate breathtaking views, and add your own favorite sunset locations to the map.",
    welcomeCta: "Explore Map",
    welcomeClose: "Close welcome",
  },
  he: {
    brand: "After the Sun",
    tagline: "נקודות שקיעה ברחבי ישראל — מצאו את שלכם על המפה.",
    spots: "נקודות",
    spotsEmpty: "עדיין אין נקודות. היו הראשונים לשתף שקיעה.",
    addSpot: "הוספת נקודה",
    signIn: "התחברות",
    signOut: "התנתקות",
    setupNeeded:
      "חברו את Supabase ב־.env (ראו .env.example), ואז הריצו npx prisma db push ו־npm run db:seed.",
    shareSpotTitle: "שיתוף נקודת שקיעה",
    shareSpotSubtitle: "תנו שם, תארו את האווירה, וסמנו על המפה.",
    configureSupabase: "הגדירו את Supabase ב־.env לפני הוספת נקודות.",
    backHome: "חזרה הביתה",
    name: "שם",
    description: "תיאור",
    regionOptional: "אזור (אופציונלי)",
    photoUrlOptional: "כתובת תמונה (אופציונלי)",
    namePlaceholder: "תצפית נמל יפו",
    descriptionPlaceholder: "למה זו נקודת שקיעה מעולה?",
    regionPlaceholder: "תל אביב",
    tapMap: "לחצו על המפה כדי לשים סיכה",
    clickMapError: "לחצו על המפה כדי לקבוע את מיקום הנקודה.",
    saveFailed: "שמירת הנקודה נכשלה",
    saving: "שומר…",
    shareSpot: "שיתוף נקודה",
    signInTitle: "התחברות",
    signInSubtitle: "נשלח אליכם קישור קסם במייל — בלי סיסמה.",
    email: "אימייל",
    sendMagicLink: "שליחת קישור קסם",
    sending: "שולח…",
    checkInbox: "בדקו את תיבת הדואר לקישור להשלמת ההתחברות.",
    supabaseNotConfigured: "Supabase עדיין לא מוגדר. הוסיפו מפתחות ל־.env.",
    magicLinkFailed: "לא ניתן לשלוח קישור קסם",
    loading: "טוען…",
    backToMap: "חזרה למפה",
    latitude: "קו רוחב",
    longitude: "קו אורך",
    openOsm: "פתיחה ב־OpenStreetMap",
    welcomeTitle: "ברוכים הבאים ל-After the Sun",
    welcomeBody:
      "הקהילה של אוהבי השקיעות. בואו לגלות לוקיישנים נסתרים, לדרג תצפיות מרהיבות ולהוסיף את המקומות הסודיים שלכם למפה.",
    welcomeCta: "בואו נתחיל",
    welcomeClose: "סגירת ברוכים הבאים",
  },
};

export type MessageKey = keyof Dict;
