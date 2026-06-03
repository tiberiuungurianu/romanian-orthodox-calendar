import { getLang, t } from "./i18n.js";

/**
 * Phrase replacements for Romanian ICS titles → English UI copy.
 * Longer / more specific patterns first (applied in order).
 * @type {{ re: RegExp, en: string }[]}
 */
const PHRASE_RULES = [
  { re: /Sfintele Pasti/gi, en: "Holy Pascha" },
  { re: /Inceputul Postului Sfintelor Pasti/gi, en: "Beginning of the Fast of Holy Pascha" },
  { re: /Inceputul Postului/gi, en: "Beginning of the Fast of" },
  { re: /Lasatul secului de carne pentru/gi, en: "Meatfare — eve of" },
  { re: /Lasatul secului pentru/gi, en: "Meatfare Sunday — eve of" },
  { re: /Lasatul Secului pentru/gi, en: "Meatfare Sunday — eve of" },
  { re: /\(Lasatul Secului pentru Postul/gi, en: "(Meatfare Sunday — eve of the Fast of" },
  { re: /\(Lasatul secului pentru Postul/gi, en: "(Meatfare Sunday — eve of the Fast of" },
  { re: /\(Inceputul Postului Adormirii Maicii Domnului\)/gi, en: "(Beginning of the Dormition Fast)" },
  { re: /Duminica Ortodoxiei - prima Duminica din Postul Mare/gi, en: "Sunday of Orthodoxy — first Sunday of Great Lent" },
  { re: /Predica la Duminica/gi, en: "Homily for the Sunday" },
  { re: /Aducerea moastelor Sfantului Apostol/gi, en: "Translation of the relics of Saint Apostle" },
  { re: /Aducerea moastelor Sfantului/gi, en: "Translation of the relics of Saint" },
  { re: /Aducerea moastelor/gi, en: "Translation of the relics of" },
  { re: /Aflarea moastelor sfintilor mucenici/gi, en: "Finding of the relics of the holy martyrs" },
  { re: /Aflarea moastelor/gi, en: "Finding of the relics of" },
  { re: /Pomenirea minunii Sfantului Arhanghel/gi, en: "Commemoration of the miracle of Archangel" },
  { re: /Pomenirea minunii/gi, en: "Commemoration of the miracle of" },
  { re: /Cinstirea icoanei Maicii Domnului/gi, en: "Veneration of the icon of the Mother of God" },
  { re: /Cinstirea icoanei/gi, en: "Veneration of the icon of" },
  { re: /Schimbarea la Fata a Domnului/gi, en: "Transfiguration of the Lord" },
  { re: /Coborarea la iad a Mantuitorului/gi, en: "Descent into Hades of the Saviour" },
  { re: /Adormirea Maicii Domnului/gi, en: "Dormition of the Mother of God" },
  { re: /\(Postul Adormirii Maicii Domnului\)/gi, en: "(Dormition Fast)" },
  { re: /Postul Adormirii Maicii Domnului/gi, en: "Dormition Fast" },
  { re: /Postul Nasterii Domnului/gi, en: "Nativity Fast" },
  { re: /Postul Sfintilor Apostoli Petru si Pavel/gi, en: "Fast of Saints Peter and Paul" },
  { re: /Postul Sfintelor Pasti/gi, en: "Fast of Holy Pascha" },
  { re: /Postul Mare/gi, en: "Great Lent" },
  { re: /Postului Sfintelor Pasti/gi, en: "Holy Pascha" },
  { re: /Postului Nasterii Domnului/gi, en: "the Nativity of the Lord" },
  { re: /Postului/gi, en: "the Fast of" },
  { re: /Postul/gi, en: "Fast of" },
  { re: /Inaltarea Sfintei Cruci/gi, en: "Exaltation of the Holy Cross" },
  { re: /Inaltarea Domnului/gi, en: "Ascension of the Lord" },
  { re: /Intrarea Domnului in Ierusalim/gi, en: "Entry of the Lord into Jerusalem" },
  { re: /Intrarea Domnului/gi, en: "Entry of the Lord" },
  { re: /Nasterea Domnului/gi, en: "Nativity of the Lord" },
  { re: /Nasterii Domnului/gi, en: "Nativity of the Lord" },
  { re: /Buna Vestire/gi, en: "Annunciation" },
  { re: /Ajunul Bobotezei/gi, en: "Eve of Theophany" },
  { re: /Ajunul Craciunului/gi, en: "Christmas Eve" },
  { re: /Boboteaza/gi, en: "Theophany" },
  { re: /Botezul Domnului/gi, en: "Baptism of the Lord" },
  { re: /Floriile/gi, en: "Palm Sunday" },
  { re: /Rusalii/gi, en: "Pentecost" },
  { re: /Cincizecime/gi, en: "Pentecost" },
  { re: /Pogorarea Sfantului Duh/gi, en: "Descent of the Holy Spirit" },
  { re: /Preasfinta Treime/gi, en: "Holy Trinity" },
  { re: /Sfanta Treime/gi, en: "Holy Trinity" },
  { re: /Maicii Domnului/gi, en: "Mother of God" },
  { re: /Maicii Domn/gi, en: "Mother of God" },
  { re: /Mantuitorului/gi, en: "the Saviour" },
  { re: /Domnului/gi, en: "the Lord" },
  { re: /Soborul Sfantului/gi, en: "Synaxis of Saint" },
  { re: /Soborul celor 12 Apostoli/gi, en: "Synaxis of the Twelve Apostles" },
  { re: /Sfintii Apostoli Petru si Pavel/gi, en: "Holy Apostles Peter and Paul" },
  { re: /Sfintii Apostoli/gi, en: "Holy Apostles" },
  { re: /Sfantul Apostol/gi, en: "Saint Apostle" },
  { re: /Sfintii Mucenici/gi, en: "Holy Martyrs" },
  { re: /Sfintii mucenici/gi, en: "holy martyrs" },
  { re: /sfintilor mucenici/gi, en: "holy martyrs" },
  { re: /Sfantul Mucenic/gi, en: "Holy Martyr" },
  { re: /Sfanta Mucenita/gi, en: "Holy Martyr" },
  { re: /Sfantul Ierarh/gi, en: "Saint Hierarch" },
  { re: /Sfantul Arhanghel/gi, en: "Archangel" },
  { re: /Sfantul Proroc/gi, en: "Prophet" },
  { re: /Sfantul Cuvios Marturisitor/gi, en: "Venerable Confessor" },
  { re: /Sfantul Cuvios/gi, en: "Venerable" },
  { re: /Sfanta Cuvioasa/gi, en: "Venerable" },
  { re: /Sf\. Cuv\./gi, en: "Venerable" },
  { re: /Cuvioasa/gi, en: "Venerable" },
  { re: /Cuviosul/gi, en: "Venerable" },
  { re: /Sfantul si Dreptul/gi, en: "Holy and Righteous" },
  { re: /Sfantul Episcop/gi, en: "Saint Bishop" },
  { re: /episcopul/gi, en: "Bishop of" },
  { re: /patriarhul/gi, en: "Patriarch of" },
  { re: /ocrotitorul/gi, en: "protector of" },
  { re: /Sfintii/gi, en: "Saints" },
  { re: /Sfantul/gi, en: "Saint" },
  { re: /Sfanta/gi, en: "Saint" },
  { re: /moastelor/gi, en: "relics of" },
  { re: /Duminica/gi, en: "Sunday" },
  { re: /Zi aliturgica/gi, en: "Non-liturgical day" },
  { re: /Canonul Mare/gi, en: "Great Canon" },
  { re: /dezlegare la peste/gi, en: "dispensation for fish" },
  { re: /dezlegare la ulei si vin/gi, en: "dispensation for oil and wine" },
  { re: /Vindecarea demonizatului/gi, en: "Healing of the demoniac" },
  { re: /din tinutul gherghesenilor/gi, en: "from the country of the Gergesenes" },
  { re: /Bogatul caruia i-a rodit tarina/gi, en: "Parable of the rich man whose land produced abundantly" },
  { re: / dupa /gi, en: " after " },
  { re: / pentru /gi, en: " for " },
  { re: / din /gi, en: " from " },
  { re: / la /gi, en: " at " },
  { re: / si /gi, en: " and " },
  { re: /\(Post\)/gi, en: "(fasting)" },
];

/**
 * @param {string} summary
 * @returns {string}
 */
function translateSummaryToEn(summary) {
  const trimmed = summary.trim();
  const fold = trimmed.toLowerCase();

  if (fold === "post") return t("event.summary.post");
  if (fold === "harti") return t("event.summary.harti");
  if (fold === "canonul mare") return t("event.summary.greatCanon");
  if (fold === "dezlegare la peste") return t("event.summary.dezlegareFish");
  if (fold === "dezlegare la ulei si vin") return t("event.summary.dezlegareOil");

  if (fold.startsWith("dezlegare la ")) {
    if (fold.includes("peste")) return t("event.summary.dezlegareFish");
    if (fold.includes("ulei")) return t("event.summary.dezlegareOil");
  }

  let out = trimmed;
  for (const { re, en } of PHRASE_RULES) {
    out = out.replace(re, en);
  }
  return out;
}

/**
 * @param {string} summary Romanian title from calendar.ics
 * @returns {string}
 */
export function formatEventSummary(summary) {
  if (getLang() === "ro") return summary;
  return translateSummaryToEn(summary);
}
