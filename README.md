# S.O.M — ניהול הוצאות והכנסות לעצמאים

אפליקציית PWA לעוסק מורשה: תיעוד הוצאות עם קבלה (בגיבוי משולש — רשומה
מבנית, ארכיון עשיר לרו"ח, ו-Dropbox), מעקב הכנסה חודשית וחישוב שכר נטו
משוער, רשימת חשבוניות מסוננת, ודוח גרפי שנתי. שני משתמשים: Owner (בעלים)
ו-Partner (שותף/ה), עם מודל הרשאות אמיתי (RLS).

נבנתה לפי `app-specification.md`. Stack: Next.js (App Router) + Supabase
(Postgres + Auth + Storage) + Vercel + Dropbox API.

## הרצה מקומית

```bash
npm install
cp .env.example .env.local   # למלא את המשתנים, ראו למטה
npm run dev
```

## שני מצבי הרצה

### 1. מצב דמו (ללא הקמת Supabase)

הכי מהיר כדי להתרשם מהאפליקציה: `NEXT_PUBLIC_DEMO_MODE=true` ב-`.env.local`
(או במשתני הסביבה ב-Vercel). כל הנתונים נשמרים מקומית בדפדפן
(`localStorage`) עם נתוני דוגמה לשני משתמשי דמו — לחצו על "בעלים"/"שותף/ה"
בפינת הכותרת כדי להחליף משתמש פעיל ולראות את מודל ההרשאות בפעולה (בעלים
עורך/מוחק הכל, שותף/ה רק את הרשומות שיצר/ה). קריאות Dropbox מדומות
(mock) — אין קריאות רשת אמיתיות. נתוני הדוגמה (`lib/demo/fixtures.ts`)
כוללים הוצאות בכל 7 הקטגוריות ופרוסות על פני שתי שנות מס, כדי שגם בורר
שנת המס יראה תוכן אמיתי.

**דמו חי בלי לגעת ב-production**: הוסיפו את `NEXT_PUBLIC_DEMO_MODE=true`
במשתני הסביבה של Vercel כשהוא **מוגבל ל-Preview בלבד** (לא Production).
כל דיפלוי Preview (כלומר, כל branch/PR שאינו `main`) ירוץ אז אוטומטית
במצב דמו — קישור נפרד לשיתוף, בלי לגעת בנתוני ה-Supabase האמיתיים
שמשרתים את ה-production.

### 2. מצב מלא (Supabase + Dropbox אמיתיים)

1. **Supabase**: צרו פרויקט חדש, והריצו את קובצי המיגרציה שב-
   `supabase/migrations/` לפי הסדר (דרך ה-SQL editor בקונסולה, או
   `supabase db push` עם ה-CLI). זה יוצר את הסכמה, מדיניות ה-RLS, פונקציות
   הדוחות, ה-bucket לקבלות, וזורע את טבלת הקטגוריות.
   - בהגדרות Auth: מומלץ לכבות "Confirm email" כדי שתהליך ההרשמה בתוך
     האפליקציה יעבוד מיד (ראו `app/signup`).
2. מלאו ב-`.env.local` / במשתני הסביבה של Vercel: `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. **Dropbox**: צרו אפליקציה ב-[Dropbox App Console](https://www.dropbox.com/developers/apps)
   עם הרשאת `files.content.write`, והפיקו refresh token (OAuth2, `token_access_type=offline`).
   מלאו `DROPBOX_APP_KEY`, `DROPBOX_APP_SECRET`, `DROPBOX_REFRESH_TOKEN`.
4. **הרשמה**: המשתמש/ת הראשונ/ה שנרשמ/ת דרך `/signup` בוחר/ת "בעלים"
   ויוצר/ת משק בית חדש. קוד ההזמנה (מזהה משק הבית) מוצג במסך הדוחות; יש
   לשתף אותו עם השותף/ה, שנרשמ/ת שני/ה ובוחר/ת "שותף/ה" + מדביק/ה את הקוד.
   זה מחליף את בדיקת האימייל המוקשחת שהייתה במערכת הישנה במודל הרשאות אמיתי.

## פריסה (Vercel + GitHub)

- `main` = production, ענפים אחרים = Preview deployments (חברו את ה-repo
  ל-Vercel והגדירו שם את משתני הסביבה).
- ה-build רץ עם `npm run build`.

## מבנה טכני

- `app/(app)/` — 4 המסכים הראשיים מאחורי ניווט תחתון: `list` (חשבוניות
  שנסרקו), `calc` (מחשבון שכר), `invoice/new` (חשבונית חדשה), `reports`
  (דוחות וסיכומים).
- `app/api/expenses`, `app/api/income` — Route Handlers בצד שרת שמבצעים את
  השמירה המשולשת (רשומה + ארכיון + Storage + Dropbox) עם סודות סביבה
  שאסור לחשוף לצד הלקוח.
- `supabase/migrations/` — סכמה, RLS (הכרעה #4: Owner עורך הכל, Partner רק
  את שלו/ה), seed לקטגוריות (א.3.1), ופונקציות `report_summary`/`report_chart`
  שמחשבות כל מספר מצטבר ב-Backend (הכרעה #8) — לא בצד הלקוח.
- `lib/reports-calc.ts` — אותה נוסחת חישוב בדיוק, כעותק טהור ב-TypeScript,
  לשימוש מצב הדמו (שאין בו Backend אמיתי).
- `public/assets/` — אייקונים/צבעים מה-Design Guide שסופק (עברית RTL,
  Heebo + Assistant, גרדיאנט סגול, אייקוני קטגוריה).

## הערה על הפרט הפתוח במסמך האיפיון

בסעיף א.2.2 צוין כפיצ'ר חדש: צירוף אסמכתא לרשומת הכנסה חודשית. המימוש כאן
מאפשר צירוף מרובה קבצים (תמונות ו-PDF), באותה לוגיקה כמו צירוף קבלה
להוצאה. אם ההעדפה שונה (קובץ יחיד בלבד / סוגי קבצים אחרים) — ניתן לצמצם
בקלות ב-`app/(app)/calc/page.tsx` וב-`app/api/income/route.ts`.
