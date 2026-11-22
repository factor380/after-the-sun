-- Public slug for /spots/<slug> on table "Spot" (Prisma model Spot).
--
-- Apply this file on the live Supabase project BEFORE deploying the app
-- that reads the column. Do not run `prisma migrate deploy` against that
-- project: it has no Prisma migration history.
--
-- Order, so the site never breaks in between:
-- 1. Run this SQL. The app that is live does not select slug, so public
--    pages keep working on /spots/<cuid>. Inserts omit slug; the trigger
--    below fills one, so creating a spot still works.
-- 2. Deploy the app. It links to /spots/<slug> and answers /spots/<cuid>
--    with 308 to that slug.
-- Deploying first takes public pages down: the new client selects slug.
--
-- Safe to run more than once. A second run only fills rows whose slug is
-- still null. It does not change a slug that was already stored, including
-- when a spot is renamed.
--
-- The slug functions mirror src/lib/spot-slug.ts. Keep the lexicon and the
-- consonant map in this file identical to that module.

CREATE OR REPLACE FUNCTION public.spot_slug_lexicon()
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $fn$
  SELECT '{"אביב":"aviv","אגמון":"agamon","אילן":"ilan","אילת":"eilat","אכזיב":"achziv","אלחנן":"elhanan","אמנים":"omanim","אמת":"amat","אנדרטת":"andartat","אפק":"afek","ארי":"ari","ארבל":"arbel","ארמון":"armon","אשקלון":"ashkelon","באר":"beer","בדיקת":"bdikat","בוקר":"boker","בלי":"bli","בת":"bat","גבעות":"gvaot","גבעת":"givat","גוש":"gush","גורדון":"gordon","גיא":"gai","גילה":"gilo","גלבוע":"gilboa","גלים":"galim","גמזו":"gimzo","גמלא":"gamla","גן":"gan","דליה":"dalia","דימונה":"dimona","הרי":"harei","הר":"har","הרצל":"herzl","הרצליה":"herzliya","וולפסון":"wolfson","זאב":"zeev","זמרי":"zimri","חפר":"hefer","חרמון":"hermon","חרובים":"haruvim","חיפה":"haifa","טיילת":"tayelet","יער":"yaar","יפו":"yafo","ירושלים":"yerushalayim","יתיר":"yatir","כנרת":"kinneret","כפר":"kfar","כרמי":"karmi","כרמים":"kramim","מאגר":"maagar","מאריס":"maris","מדינה":"medina","מים":"mayim","מנדל":"mandel","מצפה":"mitzpe","מצפור":"mitzpor","מצוק":"matzuk","מרכז":"merkaz","מרפסת":"mirpeset","מרר":"merar","מרינה":"marina","נחל":"nahal","נמל":"namal","נתניה":"netanya","ניצה":"nitza","נקודה":"nekuda","נציב":"natziv","סוסיתא":"susita","סטודנטים":"studentim","סטלה":"stella","סידנא":"sidna","עכו":"akko","עלי":"ali","עמק":"emek","עפרה":"ofra","עציון":"etzion","ערד":"arad","עתלית":"atlit","פארק":"park","פולד":"fuld","פלדה":"plada","פלמחים":"palmachim","פסגת":"pisgat","פסנתר":"psanter","פרגולה":"pergola","פרטים":"pratim","צבים":"tzavim","צביקה":"tzvika","צוק":"tzuk","צור":"tzur","צפון":"tzafon","קיסריה":"kesaria","קיפוד":"kipod","רובע":"rova","שדה":"sde","שומרון":"shomron","שכונת":"shchunat","של":"shel","שלום":"shalom","שפירא":"shapira","שקיעה":"shkia","תל":"tel","תצפית":"tatzpit","טרמפיאדה":"trempiada","אברהם":"avraham","אוגדת":"ugdat","בריכת":"breichat","ברכה":"bracha","הוד":"hod","הילטון":"hilton","הנקין":"hanakin","חוף":"hof","עין":"ein","עוזי":"uzi"}'::jsonb
$fn$;

CREATE OR REPLACE FUNCTION public.spot_slug_consonants()
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $fn$
  SELECT '{"ב":"b","ג":"g","ד":"d","ה":"h","ז":"z","ח":"ch","ט":"t","כ":"k","ך":"k","ל":"l","מ":"m","ם":"m","נ":"n","ן":"n","ס":"s","פ":"p","ף":"f","צ":"tz","ץ":"tz","ק":"k","ר":"r","ש":"sh","ת":"t"}'::jsonb
$fn$;

-- Same cleanup as normalizeSpotText in src/lib/spot-slug.ts.
CREATE OR REPLACE FUNCTION public.spot_normalize_text(value text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $fn$
DECLARE
  result text := '';
  i int;
  ch text;
  cp int;
BEGIN
  value := coalesce(value, '');
  FOR i IN 1..char_length(value) LOOP
    ch := substr(value, i, 1);
    cp := ascii(ch);
    -- hyphen, Hebrew maqaf, en dash, em dash become word breaks
    IF cp IN (45, 1470, 8211, 8212) THEN
      result := result || ' ';
      CONTINUE;
    END IF;
    -- niqqud U+0591–U+05BD and U+05BF–U+05C7 (maqaf U+05BE is handled above)
    IF (cp BETWEEN 1425 AND 1469) OR (cp BETWEEN 1471 AND 1479) THEN
      CONTINUE;
    END IF;
    -- ASCII quotes, Hebrew geresh, Hebrew gershayim
    IF cp IN (34, 39, 1523, 1524) THEN
      CONTINUE;
    END IF;
    result := result || ch;
  END LOOP;
  RETURN result;
END;
$fn$;

CREATE OR REPLACE FUNCTION public.spot_append_consonant(current text, mapped text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $fn$
BEGIN
  IF current <> '' AND right(current, 1) !~ '[aeiou]' THEN
    RETURN current || 'a' || mapped;
  END IF;
  RETURN current || mapped;
END;
$fn$;

CREATE OR REPLACE FUNCTION public.spot_transliterate_unknown(token text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $fn$
DECLARE
  consonants jsonb := public.spot_slug_consonants();
  chars text[];
  i int := 1;
  n int;
  ch text;
  nxt text;
  out text := '';
  mapped text;
BEGIN
  chars := regexp_split_to_array(coalesce(token, ''), '');
  n := coalesce(array_length(chars, 1), 0);
  WHILE i <= n LOOP
    ch := chars[i];
    nxt := CASE WHEN i < n THEN chars[i + 1] ELSE '' END;
    IF ch = 'ו' AND nxt = 'ו' THEN
      out := public.spot_append_consonant(out, 'v');
      i := i + 2;
      CONTINUE;
    END IF;
    IF ch = 'י' AND nxt = 'י' THEN
      out := public.spot_append_consonant(out, 'y');
      i := i + 2;
      CONTINUE;
    END IF;
    IF ch = 'ו' THEN
      out := out || 'o';
      i := i + 1;
      CONTINUE;
    END IF;
    IF ch = 'י' THEN
      out := out || 'i';
      i := i + 1;
      CONTINUE;
    END IF;
    IF ch = 'א' OR ch = 'ע' THEN
      IF out !~ '[aeiou]$' THEN
        out := out || 'a';
      END IF;
      i := i + 1;
      CONTINUE;
    END IF;
    IF ch ~ '^[A-Za-z0-9]$' THEN
      out := out || lower(ch);
      i := i + 1;
      CONTINUE;
    END IF;
    mapped := consonants ->> ch;
    IF mapped IS NOT NULL THEN
      out := public.spot_append_consonant(out, mapped);
    END IF;
    i := i + 1;
  END LOOP;
  RETURN out;
END;
$fn$;

CREATE OR REPLACE FUNCTION public.spot_slug_stem(token text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $fn$
DECLARE
  lexicon jsonb := public.spot_slug_lexicon();
  stemmed text;
  latin text;
BEGIN
  IF token IS NULL OR token = '' THEN
    RETURN NULL;
  END IF;
  IF lexicon ? token THEN
    RETURN lexicon ->> token;
  END IF;
  IF token ~ '^[A-Za-z0-9]+$' THEN
    RETURN lower(token);
  END IF;
  IF char_length(token) > 1 THEN
    IF left(token, 1) = 'ה' THEN
      latin := 'ha';
    ELSIF left(token, 1) = 'ב' THEN
      latin := 'be';
    ELSIF left(token, 1) = 'ו' THEN
      latin := 've';
    ELSE
      latin := NULL;
    END IF;
    IF latin IS NOT NULL THEN
      stemmed := public.spot_slug_stem(substr(token, 2));
      IF stemmed IS NOT NULL THEN
        RETURN latin || '-' || stemmed;
      END IF;
    END IF;
  END IF;
  RETURN NULL;
END;
$fn$;

CREATE OR REPLACE FUNCTION public.spot_fit_slug(value text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $fn$
DECLARE
  cleaned text;
  cut text;
  hyphen_pos int;
BEGIN
  cleaned := lower(coalesce(value, ''));
  cleaned := regexp_replace(cleaned, '[^a-z0-9]+', '-', 'g');
  cleaned := regexp_replace(cleaned, '-+', '-', 'g');
  cleaned := regexp_replace(cleaned, '^-+|-+$', '', 'g');
  IF cleaned IS NULL OR cleaned = '' THEN
    RETURN '';
  END IF;
  IF char_length(cleaned) <= 60 THEN
    RETURN cleaned;
  END IF;
  cut := left(cleaned, 60);
  IF position('-' IN cut) = 0 THEN
    RETURN regexp_replace(cut, '-+$', '', 'g');
  END IF;
  hyphen_pos := char_length(cut) - position('-' IN reverse(cut)) + 1;
  -- JS lastIndexOf is 0-based: keep the shorter cut only when index > 20.
  IF hyphen_pos - 1 > 20 THEN
    cut := left(cut, hyphen_pos - 1);
  END IF;
  RETURN regexp_replace(cut, '-+$', '', 'g');
END;
$fn$;

CREATE OR REPLACE FUNCTION public.spot_slug_base(name text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $fn$
DECLARE
  cleaned text;
  token text;
  stem text;
  parts text[] := ARRAY[]::text[];
BEGIN
  cleaned := public.spot_normalize_text(name);
  FOR token IN
    SELECT part
    FROM regexp_split_to_table(cleaned, '[^0-9A-Za-zא-ת]+') AS part
    WHERE part <> ''
  LOOP
    stem := public.spot_slug_stem(token);
    IF stem IS NULL OR stem = '' THEN
      stem := public.spot_transliterate_unknown(token);
    END IF;
    IF stem IS NOT NULL AND stem <> '' THEN
      parts := array_append(parts, stem);
    END IF;
  END LOOP;
  RETURN public.spot_fit_slug(array_to_string(parts, '-'));
END;
$fn$;

CREATE OR REPLACE FUNCTION public.spot_short_id(id text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $fn$
  SELECT CASE
    WHEN compact = '' THEN ''
    ELSE right(compact, 6)
  END
  FROM (
    SELECT regexp_replace(lower(coalesce(id, '')), '[^a-z0-9]', '', 'g') AS compact
  ) AS trimmed
$fn$;

CREATE OR REPLACE FUNCTION public.spot_slug_from_name(name text, region text, id text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $fn$
DECLARE
  base text;
  region_slug text;
  short_id text;
  suffix text;
  stem text;
BEGIN
  base := public.spot_slug_base(name);
  IF base <> '' THEN
    RETURN base;
  END IF;
  region_slug := public.spot_slug_base(coalesce(region, ''));
  short_id := public.spot_short_id(id);
  IF short_id = '' THEN
    IF region_slug <> '' THEN
      RETURN public.spot_fit_slug(region_slug);
    END IF;
    RETURN 'spot';
  END IF;
  suffix := '-' || short_id;
  IF region_slug = '' THEN
    stem := 'spot';
  ELSE
    stem := regexp_replace(left(region_slug, 60 - char_length(suffix)), '-+$', '', 'g');
    IF stem = '' THEN
      stem := 'spot';
    END IF;
  END IF;
  RETURN public.spot_fit_slug(stem || suffix);
END;
$fn$;

CREATE OR REPLACE FUNCTION public.spot_slug_candidate(base text, occurrence int)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $fn$
DECLARE
  root text;
  suffix text;
  stem text;
BEGIN
  root := public.spot_fit_slug(base);
  IF root = '' THEN
    root := 'spot';
  END IF;
  IF occurrence <= 1 THEN
    RETURN root;
  END IF;
  suffix := '-' || occurrence::text;
  stem := regexp_replace(left(root, 60 - char_length(suffix)), '-+$', '', 'g');
  IF stem = '' THEN
    stem := 'spot';
  END IF;
  RETURN stem || suffix;
END;
$fn$;

-- Reads "Spot".slug, so it is not immutable. Not granted to the API roles.
CREATE OR REPLACE FUNCTION public.spot_allocate_slug(name text, region text, id text)
RETURNS text
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $fn$
DECLARE
  base text;
  candidate text;
  n int := 1;
BEGIN
  base := public.spot_slug_from_name(name, region, id);
  WHILE n < 500 LOOP
    candidate := public.spot_slug_candidate(base, n);
    IF candidate NOT IN ('new', 'mine')
       AND NOT EXISTS (SELECT 1 FROM "Spot" AS s WHERE s.slug = candidate) THEN
      RETURN candidate;
    END IF;
    n := n + 1;
  END LOOP;
  RAISE EXCEPTION 'Could not allocate a spot slug';
END;
$fn$;

REVOKE ALL ON FUNCTION public.spot_allocate_slug(text, text, text) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.spot_fill_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $fn$
BEGIN
  -- Renames and other updates keep the slug. Only a missing one is filled.
  IF NEW.slug IS NULL OR btrim(NEW.slug) = '' THEN
    NEW.slug := public.spot_allocate_slug(NEW.name, NEW.region, NEW.id);
  END IF;
  RETURN NEW;
END;
$fn$;

ALTER TABLE "Spot" ADD COLUMN IF NOT EXISTS slug text;

DO $fn$
DECLARE
  rec record;
BEGIN
  FOR rec IN
    SELECT id, name, region
    FROM "Spot"
    WHERE slug IS NULL
    ORDER BY "createdAt" ASC, id ASC
  LOOP
    UPDATE "Spot"
    SET slug = public.spot_allocate_slug(rec.name, rec.region, rec.id)
    WHERE id = rec.id
      AND slug IS NULL;
  END LOOP;
END;
$fn$;

ALTER TABLE "Spot" ALTER COLUMN slug SET NOT NULL;

ALTER TABLE "Spot" DROP CONSTRAINT IF EXISTS "Spot_slug_format";
ALTER TABLE "Spot"
  ADD CONSTRAINT "Spot_slug_format"
  CHECK (
    slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    AND char_length(slug) <= 60
    AND slug NOT IN ('new', 'mine')
  );

CREATE UNIQUE INDEX IF NOT EXISTS "Spot_slug_key" ON "Spot" (slug);

DROP TRIGGER IF EXISTS spot_fill_slug ON "Spot";
CREATE TRIGGER spot_fill_slug
  BEFORE INSERT OR UPDATE ON "Spot"
  FOR EACH ROW
  EXECUTE FUNCTION public.spot_fill_slug();
