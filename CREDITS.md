# קרדיטים · השביל

## איורים

הלוח, שש הדמויות, המדורה הדולקת והאייקון: **יניב ליין**.

## גופן

Assistant, ברישיון SIL Open Font License 1.1 (`src/fonts/OFL-LICENSE.txt`).

## צלילים (מסמך 15, סעיף 3)

כל קובצי הצליל הם **CC0 1.0 (נחלת הכלל)**, או מהכפתור (שם הם כבר מתועדים, וגם הם CC0). אין קובץ ברישיון אחר, ואין סינתזה: כל צליל הוא הקלטה, חתוכה ומעובדת. הקבצים ב-`public/audio/`, נטמנים ב-Service Worker, ולא נטענים מהרשת אחרי הטעינה הראשונה.

| קובץ | מתי | מקור | יוצר/ת | רישיון | עיבוד |
| --- | --- | --- | --- | --- | --- |
| `dice.mp3` | הקובייה מתגלגלת | [GAMEMisc_Dice Roll On Wood_Jaku5.wav](https://freesound.org/people/jakubp.jp/sounds/558204/) (Freesound #558204) | jakubp.jp | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) | 0.20–1.34 שנ' (1.14 שנ'), דעיכה של 250 אלפיות בסוף |
| `paper.mp3` | הקלף עולה ונהפך | `card-slide-3.ogg` מתוך [Casino Audio](https://kenney.nl/assets/casino-audio) | Kenney | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) | 0–0.30 שנ', דעיכה של 100 אלפיות |
| `wood.mp3` | "סיימתי" ו"בוחר/ת לא לענות" (אותו קובץ) | [Marimba note struck](https://freesound.org/people/LloydEvans09/sounds/185833/) (Freesound #185833) | LloydEvans09 | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) | 0–0.40 שנ', דעיכה של 150 אלפיות |
| `pop.mp3` | הקפיצה לאבן הבאה | `drop_003.ogg` מתוך [Interface Sounds](https://kenney.nl/assets/interface-sounds) | Kenney | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) | 0–0.19 שנ', דעיכה של 50 אלפיות |
| `fire.mp3` | פצפוץ המדורה בסיום (לולאה) | [fire small campfire crackling short +air tone.flac](https://freesound.org/people/kyles/sounds/637523/) (Freesound #637523) | kyles | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) | 5–18 שנ', לולאה חלקה של 12 שנ' (השנייה האחרונה מעורבבת לתוך ההתחלה) |
| `melody.mp3` | מוזיקת הרקע (לולאה) | מהכפתור, כמו שהוא: [Calm Ambient Piano Loop](https://freesound.org/people/Jadis0x/sounds/832628/) (Freesound #832628) ו-[Water dripping under bridge in small town.wav](https://freesound.org/people/BonnyOrbit/sounds/442480/) (Freesound #442480) | Jadis0x, BonnyOrbit | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) | ללא שינוי: הקובץ של הכפתור (`..\לקלוד דיזיין\app\public\audio\melody.mp3`, ו-`CREDITS.md` שלו) |

שורת הקרדיט ב-S0: "איורים: יניב ליין · צלילים: Kenney, jakubp.jp, LloydEvans09, kyles (CC0) · מנגינה: Jadis0x, BonnyOrbit (CC0)" (`src/content/content.trail.he.json` › `app.credit`). רישיון CC0 לא דורש קרדיט; הוא כאן מתוך כבוד ליוצרים.

### פרטים טכניים

- MP3 מונו, 64 kbps, בקצב הדגימה של המקור (44.1 או 48 kHz). כל קובץ מנורמל לשיא של ‎-1 dBFS; העוצמות שבמסמך 15 (0.5, 0.4, 0.25, 0.2) נקבעות בקוד (`src/sound.ts`).
- המקורות: ה-preview באיכות הגבוהה של Freesound (MP3 128 kbps), וקובצי ה-OGG מחבילות Kenney. העיבוד: `scripts/make-sounds.mjs` (פענוח, חיתוך, מונו, דעיכות, לולאה, נרמול, קידוד ב-lamejs).
- גודל: 113KB בלי המנגינה (התקציב: עד 1.5MB), והמנגינה 664KB כמו בכפתור.
