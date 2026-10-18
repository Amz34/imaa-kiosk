/**
 * Imaa — trilingual result card.
 *
 * Design intent: this is the screenshot people share. Three languages, equal
 * weight, no faces, no personal data. Arabic leads and is genuinely RTL, not
 * a left-aligned Western layout with Arabic text dropped into it.
 *
 * It renders from local data so the card works even with the backend down —
 * a demo should never show a broken screen because a service restarted.
 */

type Lang = "ar" | "en" | "ur";

type Card = {
  code: string;
  urgency: "routine" | "urgent" | "emergency";
  text: Record<Lang, string>;
  label: Record<Lang, string>;
};

const DEMO: Card = {
  code: "CHEST_PAIN",
  urgency: "emergency",
  label: {
    ar: "ألم في الصدر",
    en: "Chest pain",
    ur: "سینے میں درد",
  },
  text: {
    ar: "المريض يعاني من ألم في الصدر ويحتاج إلى تدخل طارئ.",
    en: "The patient is experiencing chest pain and requires urgent attention.",
    ur: "مریض کو سینے میں درد ہے اور فوری طبی امداد درکار ہے۔",
  },
};

/** Script-specific stacks: Nastaliq for Urdu, Naskh for Arabic. Latin text in
 *  an Urdu card is a rendering bug, not a style choice. */
const SCRIPT_FONT: Record<Lang, string> = {
  ar: "'Noto Naskh Arabic', 'Segoe UI', system-ui, sans-serif",
  en: "system-ui, -apple-system, 'Segoe UI', sans-serif",
  ur: "'Noto Nastaliq Urdu', 'Noto Naskh Arabic', system-ui, serif",
};

const LANGS: { id: Lang; dir: "rtl" | "ltr"; name: string }[] = [
  { id: "ar", dir: "rtl", name: "العربية" },
  { id: "en", dir: "ltr", name: "English" },
  { id: "ur", dir: "rtl", name: "اردو" },
];

const URGENCY: Record<Card["urgency"], { bg: string; fg: string }> = {
  routine: { bg: "#132e1e", fg: "#68d391" },
  urgent: { bg: "#33260c", fg: "#f6ad55" },
  emergency: { bg: "#3a1214", fg: "#fc8181" },
};

export default function Home() {
  const u = URGENCY[DEMO.urgency];

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 20px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 620 }}>
        <header style={{ marginBottom: 22 }}>
          <div
            style={{
              fontSize: 13,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#6b7a8c",
            }}
          >
            إيماء · Imaa
          </div>
          <h1 style={{ fontSize: 26, margin: "8px 0 0", fontWeight: 600 }}>
            One sign. Three languages.
          </h1>
          <p style={{ color: "#8b9aab", fontSize: 14, marginTop: 8, lineHeight: 1.6 }}>
            Recognised from <strong style={{ color: "#c8d4e0" }}>PSL / ArSL</strong>{" "}
            landmarks in the browser. Nothing but numbers leaves the device.
          </p>
        </header>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: u.bg,
            color: u.fg,
            borderRadius: 999,
            padding: "5px 12px",
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: 14,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: u.fg,
              display: "inline-block",
            }}
          />
          {DEMO.urgency} · {DEMO.code}
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          {LANGS.map((l) => (
            <section
              key={l.id}
              dir={l.dir}
              style={{
                background: "#0e1319",
                border: "1px solid #1b2430",
                borderRadius: 14,
                padding: "16px 18px",
                fontFamily: SCRIPT_FONT[l.id],
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#5f7182",
                }}
              >
                {l.name}
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  margin: "6px 0 4px",
                  lineHeight: 1.5,
                }}
              >
                {DEMO.label[l.id]}
              </div>
              <div style={{ fontSize: 14, color: "#9fb0c2", lineHeight: 1.7 }}>
                {DEMO.text[l.id]}
              </div>
            </section>
          ))}
        </div>

        <footer
          style={{
            marginTop: 18,
            fontSize: 12,
            color: "#63707f",
            lineHeight: 1.7,
          }}
        >
          Server-side classifier · conformal abstention · zero biometric retention.
          <br />
          If the sign is unclear, Imaa says <em>“repeat, please”</em> instead of
          guessing.
        </footer>
      </div>
    </main>
  );
}
