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
  photoOptional: string;
  photoHint: string;
  photoRemove: string;
  photoTooLarge: string;
  photoCompressFailed: string;
  photoCompressing: string;
  photoInvalidType: string;
  photoUploadFailed: string;
  photoUrlOptional: string;
  photoLandscapeGuide: string;
  photoCount: string;
  photoOpenFull: string;
  photoClose: string;
  photoPrevious: string;
  photoNext: string;
  photoDelete: string;
  photoDeleting: string;
  photoDeleteConfirm: string;
  photoDeleteFailed: string;
  photoAddTitle: string;
  photoAddSubtitle: string;
  photoAddSubmit: string;
  photoAddUploading: string;
  photoAddThanks: string;
  photoAddFailed: string;
  photoAddSignIn: string;
  photoAddPickFirst: string;
  photoAddDuplicate: string;
  photoAddSpotLimit: string;
  photoAddUserLimit: string;
  photoAddTooMany: string;
  uploadTermsNotice: string;
  uploadTermsCheckbox: string;
  uploadTermsRequired: string;
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
  navigateToSpot: string;
  themeToggle: string;
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
  reportSpot: string;
  reportSignInLink: string;
  reportTitle: string;
  reportSubtitle: string;
  reportReason: string;
  reportReasonInappropriatePhoto: string;
  reportReasonWrongLocation: string;
  reportReasonSpam: string;
  reportReasonOther: string;
  reportDetailsOptional: string;
  reportDetailsPlaceholder: string;
  reportSubmit: string;
  reportSubmitting: string;
  reportCancel: string;
  reportClose: string;
  reportThanks: string;
  reportFailed: string;
  reportNeedSignIn: string;
  reportTooMany: string;
  mySpotsTitle: string;
  mySpotsSubtitle: string;
  mySpotsEmpty: string;
  mySpotsNav: string;
  editSpot: string;
  editSpotTitle: string;
  editSpotSubtitle: string;
  saveChanges: string;
  deleteSpot: string;
  deletingSpot: string;
  deleteSpotConfirm: string;
  deleteSpotFailed: string;
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
  photoOptional: "תמונת שקיעה (אופציונלי)",
  photoHint: "JPEG, PNG או WebP · עד ~12MB לפני דחיסה אוטומטית",
  photoRemove: "הסרה",
  photoTooLarge: "התמונה גדולה מדי — מקסימום 12MB לפני דחיסה.",
  photoCompressFailed: "דחיסת התמונה נכשלה. נסו תמונה אחרת או קטנה יותר.",
  photoCompressing: "דוחס תמונה…",
  photoInvalidType: "סוג קובץ לא נתמך. בחרו JPEG, PNG או WebP.",
  photoUploadFailed: "העלאת התמונה נכשלה",
  photoUrlOptional: "או הדביקו כתובת תמונה (HTTPS)",
  photoLandscapeGuide:
    "מעלים רק תמונת נוף או מקום שקיעה — בלי פרצופים מזוהים ובלי אנשים במרכז התמונה.",
  photoCount: "{count} תמונות",
  photoOpenFull: "פתיחת התמונה בגודל מלא",
  photoClose: "סגירה",
  photoPrevious: "התמונה הקודמת",
  photoNext: "התמונה הבאה",
  photoDelete: "מחיקת התמונה",
  photoDeleting: "מוחק…",
  photoDeleteConfirm: "למחוק את התמונה? פעולה זו לא ניתנת לביטול.",
  photoDeleteFailed: "מחיקת התמונה נכשלה",
  photoAddTitle: "הוספת תמונה לנקודה",
  photoAddSubtitle:
    "צילמתם כאן שקיעה? הוסיפו תמונה כדי לעזור לאחרים לדעת איך המקום נראה.",
  photoAddSubmit: "הוספת תמונה",
  photoAddUploading: "מעלה…",
  photoAddThanks: "התמונה נוספה. תודה ששיתפתם!",
  photoAddFailed: "הוספת התמונה נכשלה",
  photoAddSignIn: "התחברו כדי להוסיף תמונה לנקודה הזו",
  photoAddPickFirst: "בחרו תמונה להעלאה.",
  photoAddDuplicate: "התמונה הזו כבר קיימת בנקודה.",
  photoAddSpotLimit: "הנקודה הגיעה למספר המרבי של תמונות.",
  photoAddUserLimit: "הגעתם למספר המרבי של תמונות שאפשר להוסיף לנקודה זו.",
  photoAddTooMany: "העליתם יותר מדי תמונות. נסו שוב מאוחר יותר.",
  uploadTermsNotice:
    "אתם אחראים לתוכן שאתם משתפים. מותר רק נקודות ותמונות נוף/מקום שקיעה שיש לכם רשות לפרסם. אפשר להסיר תוכן שלא עומד בכללים.",
  uploadTermsCheckbox:
    "אני מאשר/ת שזו תמונת נוף או מקום (בלי פרצופים מזוהים), שיש לי רשות לשתף, ושאפשר להסיר את התוכן אם יידרש.",
  uploadTermsRequired: "יש לאשר את כללי השיתוף לפני השמירה.",
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
  navigateToSpot: "ניווט לנקודה",
  themeToggle: "החלפת מצב תצוגה",
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
  reportSpot: "דיווח על נקודה זו",
  reportSignInLink: "התחברו כדי לדווח על נקודה זו",
  reportTitle: "דיווח על נקודה",
  reportSubtitle: "הדיווח יגיע לצוות לבדיקה. תודה ששומרים על הקהילה.",
  reportReason: "סיבה",
  reportReasonInappropriatePhoto: "תמונה לא מתאימה (אנשים / לא נוף)",
  reportReasonWrongLocation: "מיקום שגוי או מסוכן",
  reportReasonSpam: "ספאם או תוכן מטעה",
  reportReasonOther: "אחר",
  reportDetailsOptional: "פרטים נוספים (אופציונלי)",
  reportDetailsPlaceholder: "מה לא בסדר בנקודה?",
  reportSubmit: "שליחת דיווח",
  reportSubmitting: "שולח…",
  reportCancel: "ביטול",
  reportClose: "סגירה",
  reportThanks: "הדיווח התקבל. נבדוק בהקדם.",
  reportFailed: "שליחת הדיווח נכשלה",
  reportNeedSignIn: "יש להתחבר כדי לדווח.",
  reportTooMany: "נשלחו יותר מדי דיווחים. נסו שוב מאוחר יותר.",
  mySpotsTitle: "הנקודות שלי",
  mySpotsSubtitle: "צפייה, עריכה או מחיקה של נקודות ששיתפתם.",
  mySpotsEmpty: "עדיין לא שיתפתם נקודות. אפשר להתחיל עכשיו.",
  mySpotsNav: "שלי",
  editSpot: "עריכה",
  editSpotTitle: "עריכת נקודה",
  editSpotSubtitle: "עדכנו את הפרטים או המיקום במפה.",
  saveChanges: "שמירת שינויים",
  deleteSpot: "מחיקה",
  deletingSpot: "מוחק…",
  deleteSpotConfirm: "למחוק את \"{name}\"? פעולה זו לא ניתנת לביטול.",
  deleteSpotFailed: "מחיקת הנקודה נכשלה",
};

/** @deprecated Prefer `dictionary` — kept for call sites that still use Record access */
export const dictionaries: Record<Locale, Dict> = {
  he: dictionary,
};

export type MessageKey = keyof Dict;
