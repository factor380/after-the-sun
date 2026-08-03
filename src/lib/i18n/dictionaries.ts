export type Locale = "he";

export const locales: Locale[] = ["he"];

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
  loadingMap: string;
  viewSpot: string;
  backToMap: string;
  latitude: string;
  longitude: string;
  openOsm: string;
  welcomeTitle: string;
  welcomeBody: string;
  welcomeViewMap: string;
  welcomeAddSpot: string;
  welcomeClose: string;
  drawerExpand: string;
  drawerCollapse: string;
  sortByDistance: string;
  locatingPosition: string;
  sortedByDistance: string;
  locationDenied: string;
  locationUnavailable: string;
  locationError: string;
  retryLocation: string;
};

export const dictionary: Dict = {
  brand: "After the Sun",
  tagline: "מצאו את השקיעה שלכם על המפה.",
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
  loadingMap: "טוען מפה…",
  viewSpot: "צפייה בנקודה",
  backToMap: "חזרה למפה",
  latitude: "קו רוחב",
  longitude: "קו אורך",
  openOsm: "פתיחה ב־OpenStreetMap",
  welcomeTitle: "ברוכים הבאים ל-After the Sun",
  welcomeBody:
    "הקהילה של אוהבי השקיעות. בואו לגלות לוקיישנים נסתרים, לדרג תצפיות מרהיבות ולהוסיף את המקומות הסודיים שלכם למפה.",
  welcomeViewMap: "למפה",
  welcomeAddSpot: "הוספת נקודה",
  welcomeClose: "סגירת ברוכים הבאים",
  drawerExpand: "הרחבת רשימת נקודות",
  drawerCollapse: "צמצום רשימת נקודות",
  sortByDistance: "מיון לפי קרבה אליי",
  locatingPosition: "מאתר מיקום…",
  sortedByDistance: "ממוין לפי מרחק ממך",
  locationDenied: "אין גישה למיקום — הרשימה לפי תאריך הוספה.",
  locationUnavailable: "לא ניתן לקבוע מיקום במכשיר זה.",
  locationError: "איתור המיקום נכשל. נסו שוב.",
  retryLocation: "נסה שוב",
};

/** @deprecated Prefer `dictionary` — kept for call sites that still use Record access */
export const dictionaries: Record<Locale, Dict> = {
  he: dictionary,
};

export type MessageKey = keyof Dict;
