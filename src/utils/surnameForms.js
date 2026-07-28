// Морфология фамилий для подсказок групп и авто-подписей (фронт-only).
// canonicalSurname — общий бесполый корень (муж/жен форма → равный результат).
// familyLabel — русский плюрал семьи best-effort (добавляется в Task 2).

const CYR_RE = /[а-яё]/;

// Правила приведения к корню: [суффикс-regex, замена]. Первое совпадение — стоп.
// Цель — чтобы мужская и женская форма одной фамилии дали одинаковый результат.
// Порядок: длинный/специфичный суффикс раньше короткого.
const LAT_CANON = [
  [/(sk|tsk)aya$/, "$1"],          // vishnevskaya -> vishnevsk
  [/(sk|tsk)(y|iy|ii|i)$/, "$1"],  // vishnevsky   -> vishnevsk
  [/aya$/, ""],                    // tolstaya     -> tolst
  [/(oy|oi|yy|iy)$/, ""],          // tolstoy      -> tolst
  [/(ov|ev|yov|iov|in|yn)a$/, "$1"], // alekseeva  -> alekseev
];

const CYR_CANON = [
  [/(ск|цк)ая$/, "$1"],            // вишневская -> вишневск
  [/(ск|цк)ий$/, "$1"],            // вишневский -> вишневск
  [/ая$/, ""],                     // толстая    -> толст
  [/(ой|ый|ий)$/, ""],             // толстой    -> толст
  [/(ов|ев|ёв|ин|ын)а$/, "$1"],    // иванова    -> иванов
];

export const canonicalSurname = (stem) => {
  const s = (stem ?? "").toString().trim().toLowerCase();
  if (!s) return "";
  const rules = CYR_RE.test(s) ? CYR_CANON : LAT_CANON;
  for (const [re, rep] of rules) {
    if (re.test(s)) return s.replace(re, rep);
  }
  return s;
};

// Обратный транслит латиница→кириллица (best-effort). Мультисимвольные раньше
// одиночных. Приблизителен по природе (Е/Ё/Э→E, ъ/ь выпали при прямом переводе).
const LAT2CYR_MULTI = [
  ["shch", "щ"], ["sch", "щ"], ["zh", "ж"], ["kh", "х"], ["ts", "ц"],
  ["ch", "ч"], ["sh", "ш"], ["yu", "ю"], ["iu", "ю"], ["ya", "я"],
  ["ia", "я"], ["yo", "ё"],
];

const LAT2CYR_ONE = {
  a: "а", b: "б", v: "в", g: "г", d: "д", e: "е", z: "з", i: "и", j: "й",
  k: "к", l: "л", m: "м", n: "н", o: "о", p: "п", r: "р", s: "с", t: "т",
  u: "у", f: "ф", h: "х", y: "ы", x: "кс", c: "к", q: "к", w: "в",
};

const translitStem = (input) => {
  const lower = input.toLowerCase();
  let out = "";
  let i = 0;
  while (i < lower.length) {
    let matched = false;
    for (const [lat, cyr] of LAT2CYR_MULTI) {
      if (lower.startsWith(lat, i)) {
        out += cyr;
        i += lat.length;
        matched = true;
        break;
      }
    }
    if (matched) continue;
    const ch = lower[i];
    out += LAT2CYR_ONE[ch] ?? ch;
    i += 1;
  }
  return out;
};

// [regex со стемом в группе 1, готовое кириллическое плюральное окончание].
// Порядок: tsk/sk раньше адъективного -oy/-aya, иначе «-skiy» уйдёт в «-iy».
const LAT_PLURAL = [
  [/^(.*)tsk(?:aya|iy|ii|y|i)$/, "цкие"],
  [/^(.*)sk(?:aya|iy|ii|y|i)$/, "ские"],
  [/^(.*)(?:oy|oi|yy|iy|aya)$/, "ые"],
  [/^(.*)(?:yov|iov)a?$/, "ёвы"],
  [/^(.*)ova?$/, "овы"],
  [/^(.*)eva?$/, "евы"],
  [/^(.*)yna?$/, "ыны"],
  [/^(.*)ina?$/, "ины"],
];

const CYR_PLURAL = [
  [/^(.*)цк(?:ая|ий)$/, "цкие"],
  [/^(.*)ск(?:ая|ий)$/, "ские"],
  [/^(.*)(?:ой|ый|ий|ая)$/, "ые"],
  [/^(.*)ёва?$/, "ёвы"],
  [/^(.*)ова?$/, "овы"],
  [/^(.*)ева?$/, "евы"],
  [/^(.*)ына?$/, "ыны"],
  [/^(.*)ина?$/, "ины"],
];

// Русский плюрал семьи из репрезентативной фамилии (муж/жен, любая раскладка).
// Уверенное русское окончание → корень (кириллицей) + верный плюрал. Иначе —
// исходный токен как есть (не форсируем русский). Guard короткого стема < 2.
export const familyLabel = (name) => {
  const raw = (name ?? "").toString().trim();
  if (!raw) return raw;
  const s = raw.toLowerCase();
  const isCyr = CYR_RE.test(s);
  const rules = isCyr ? CYR_PLURAL : LAT_PLURAL;
  for (const [re, plural] of rules) {
    const m = re.exec(s);
    if (!m) continue;
    const stemLower = m[1];
    if (stemLower.length < 2) return raw; // слишком короткий стем → оставить токен
    const stemCyr = isCyr ? stemLower : translitStem(stemLower);
    const label = stemCyr + plural;
    return label.charAt(0).toUpperCase() + label.slice(1);
  }
  return raw; // нет узнаваемого русского окончания → оставить как в данных
};
