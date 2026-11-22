import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SPOT_SLUG_LEXICON } from "@/lib/spot-slug-lexicon";
import {
  SPOT_SLUG_CONSONANTS,
  SPOT_SLUG_MAX_LENGTH,
  allocateSpotSlug,
  fitSpotSlug,
  keepSpotSlug,
  spotPublicPath,
  spotSlugCandidate,
  spotSlugFromName,
  transliterateUnknownHebrew,
} from "@/lib/spot-slug";

const MIGRATION_PATHS = [
  "supabase/migrations/20261122120000_spot_slug.sql",
  "prisma/migrations/20261122120000_spot_slug/migration.sql",
];

/** Published spot names from after-the-sun.com, and the slug the backfill must store. */
const PUBLISHED_SLUGS: Readonly<Record<string, string>> = {
  "מצפה עמק ברכה": "mitzpe-emek-bracha",
  "בריכת הצבים": "breichat-ha-tzavim",
  "חוף פלמחים": "hof-palmachim",
  "תצפית בערד ברובע האמנים": "tatzpit-be-arad-be-rova-ha-omanim",
  "גבעת אברהם הנקין": "givat-avraham-hanakin",
  "יער יתיר": "yaar-yatir",
  גמלא: "gamla",
  "תצפית כנרת מנדל": "tatzpit-kinneret-mandel",
  "מצפה אילן": "mitzpe-ilan",
  עתלית: "atlit",
  עכו: "akko",
  "שדה בוקר": "sde-boker",
  "תצפית בגמזו": "tatzpit-be-gimzo",
  "עין הוד": "ein-hod",
  "גבעות מרר": "gvaot-merar",
  "מצפה חרובים": "mitzpe-haruvim",
  "גן סידנא עלי": "gan-sidna-ali",
  "הר גילה": "har-gilo",
  "מאגר בדליה": "maagar-be-dalia",
  "טיילת ומאגר במרכז שפירא": "tayelet-ve-maagar-be-merkaz-shapira",
  "מצפור ה1000": "mitzpor-ha-1000",
  "חוף הילטון": "hof-hilton",
  "מרינה הרצליה": "marina-herzliya",
  "מצפור צביקה": "mitzpor-tzvika",
  החרמון: "ha-hermon",
  "תצפית עין עוזי": "tatzpit-ein-uzi",
  "טיילת ניצה": "tayelet-nitza",
  "פארק אפק": "park-afek",
  "חוף סוסיתא": "hof-susita",
  "מצפור גיא": "mitzpor-gai",
  "גן הקיפוד": "gan-ha-kipod",
  "טיילת אשקלון": "tayelet-ashkelon",
  "אנדרטת אוגדת הפלדה": "andartat-ugdat-ha-plada",
  "מצפור ארי פולד": "mitzpor-ari-fuld",
  "פרגולה נחל זמרי, פסגת זאב, ירושלים": "pergola-nahal-zimri-pisgat-zeev-yerushalayim",
  "טיילת אילת": "tayelet-eilat",
  "הר הרצל": "har-herzl",
  "תצפית סטלה מאריס": "tatzpit-stella-maris",
  "כפר סטודנטים בדימונה": "kfar-studentim-be-dimona",
  "תצפית בכפר עציון": "tatzpit-be-kfar-etzion",
  "מרכז וולפסון ירושלים": "merkaz-wolfson-yerushalayim",
  "אגמון חפר": "agamon-hefer",
  "מצפה צור שלום": "mitzpe-tzur-shalom",
  "המרפסת של המדינה": "ha-mirpeset-shel-ha-medina",
  "תצפית הפסנתר": "tatzpit-ha-psanter",
  "שקיעה בטרמפיאדה בעפרה": "shkia-be-trempiada-be-ofra",
  "שכונת באר אלחנן": "shchunat-beer-elhanan",
  "שקיעה בכרמי צור בשכונת כרמים": "shkia-be-karmi-tzur-be-shchunat-kramim",
  "חוף אכזיב": "hof-achziv",
  "טיילת בת גלים": "tayelet-bat-galim",
  "מרינה אשקלון": "marina-ashkelon",
  "נמל יפו": "namal-yafo",
  "טיילת המצוק נתניה": "tayelet-ha-matzuk-netanya",
  "חוף גורדון": "hof-gordon",
  "חוף הצפון אילת": "hof-ha-tzafon-eilat",
  "חוף אמת המים בקיסריה": "hof-amat-ha-mayim-be-kesaria",
};

describe("spotSlugFromName", () => {
  it("transliterates Hebrew place names into lowercase hyphenated ASCII", () => {
    expect(spotSlugFromName("חוף פלמחים")).toBe("hof-palmachim");
    expect(spotSlugFromName("נמל יפו")).toBe("namal-yafo");
    expect(spotSlugFromName("גן הקיפוד")).toBe("gan-ha-kipod");
    for (const [name, slug] of Object.entries(PUBLISHED_SLUGS)) {
      expect(spotSlugFromName(name), name).toBe(slug);
      expect(slug.length).toBeLessThanOrEqual(SPOT_SLUG_MAX_LENGTH);
    }
  });

  it("keeps Latin words and strips punctuation", () => {
    expect(spotSlugFromName("חוף Hilton")).toBe("hof-hilton");
    expect(spotSlugFromName("  נמל   יפו ")).toBe("namal-yafo");
    expect(spotSlugFromName("תל־אביב")).toBe("tel-aviv");
  });

  it("transliterates an unknown Hebrew word without the lexicon", () => {
    expect(SPOT_SLUG_LEXICON["קדמון"]).toBeUndefined();
    expect(transliterateUnknownHebrew("קדמון")).toBe("kadamon");
    expect(spotSlugFromName("קדמון")).toBe("kadamon");
  });

  it("falls back to the region plus a short id when the name has no letters", () => {
    const id = "cmthi733a0001kz04ukit3wtr";
    expect(spotSlugFromName("???", { region: "תל אביב", id })).toBe("tel-aviv-it3wtr");
    expect(spotSlugFromName("…", { region: null, id })).toBe("spot-it3wtr");
    expect(spotSlugFromName("", { region: "", id: "" })).toBe("spot");
  });

  it("caps the slug at 60 characters on a hyphen boundary", () => {
    const slug = spotSlugFromName(`${"חוף פלמחים ".repeat(12)}`);
    expect(slug.length).toBeLessThanOrEqual(SPOT_SLUG_MAX_LENGTH);
    expect(slug.endsWith("-")).toBe(false);
    expect(slug.startsWith("hof-palmachim")).toBe(true);
    expect(fitSpotSlug("a".repeat(80)).length).toBeLessThanOrEqual(SPOT_SLUG_MAX_LENGTH);
  });
});

describe("allocateSpotSlug", () => {
  it("appends -2 and -3 when the base slug is taken", () => {
    const taken = new Set(["hof-palmachim", "hof-palmachim-2"]);
    expect(allocateSpotSlug("hof-palmachim", (candidate) => taken.has(candidate))).toBe(
      "hof-palmachim-3",
    );
    expect(spotSlugCandidate("hof-palmachim", 1)).toBe("hof-palmachim");
    expect(spotSlugCandidate("hof-palmachim", 2)).toBe("hof-palmachim-2");
  });

  it("does not use the reserved /spots/new and /spots/mine segments", () => {
    expect(allocateSpotSlug("new", () => false)).toBe("new-2");
    expect(allocateSpotSlug("mine", () => false)).toBe("mine-2");
    expect(spotPublicPath("new-2")).toBe("/spots/new-2");
    expect(() => spotPublicPath("new")).toThrow(/Invalid spot slug/);
    expect(() => spotPublicPath("mine")).toThrow(/Invalid spot slug/);
  });
});

describe("keepSpotSlug", () => {
  it("keeps the creation slug when the spot is renamed", () => {
    const created = spotSlugFromName("חוף פלמחים");
    expect(created).toBe("hof-palmachim");
    expect(spotSlugFromName("נמל יפו")).toBe("namal-yafo");
    expect(keepSpotSlug(created, "נמל יפו")).toBe("hof-palmachim");
    expect(keepSpotSlug(created, "נמל יפו")).not.toBe(spotSlugFromName("נמל יפו"));
  });
});

describe("spot slug SQL", () => {
  it("keeps the migration lexicon and consonant map aligned with TypeScript", () => {
    for (const path of MIGRATION_PATHS) {
      const sql = readFileSync(path, "utf8");
      for (const [hebrew, latin] of Object.entries(SPOT_SLUG_LEXICON)) {
        expect(sql, path).toContain(`"${hebrew}":"${latin}"`);
      }
      for (const [hebrew, latin] of Object.entries(SPOT_SLUG_CONSONANTS)) {
        expect(sql, path).toContain(`"${hebrew}":"${latin}"`);
      }
    }
  });
});
