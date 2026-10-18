"use client";

import React, { useEffect, useState } from 'react';
import { Noto_Naskh_Arabic, Noto_Nastaliq_Urdu } from 'next/font/google';

type Lang = 'ar' | 'en' | 'ur';

// Self-hosted at build time: the kiosk must render identically on an Android
// phone, an iPad and a counter PC. Relying on system fonts meant Urdu fell back
// to whatever the device had installed.
const naskh = Noto_Naskh_Arabic({
  subsets: ['arabic'],
  weight: ['400', '700'],
  display: 'swap',
  variable: '--font-naskh',
});

const nastaliq = Noto_Nastaliq_Urdu({
  subsets: ['arabic'],
  weight: ['400', '700'],
  display: 'swap',
  variable: '--font-nastaliq',
});

interface SignOption {
  code: string;
  category: 'medical' | 'gov';
  label: Record<Lang, string>;
  text: Record<Lang, string>;
  urgency: 'routine' | 'urgent' | 'emergency';
}

const SIGNS: SignOption[] = [
  {
    code: 'CHEST_PAIN',
    category: 'medical',
    urgency: 'emergency',
    label: { ar: 'ألم في الصدر', en: 'Chest Pain', ur: 'سینے میں درد' },
    text: {
      ar: 'المريض يعاني من ألم حاد في الصدر ويحتاج إلى طوارئ فورية.',
      en: 'Patient is experiencing severe chest pain and needs immediate emergency care.',
      ur: 'مریض کو سینے میں شدید درد ہے اور فوری ہنگامی طبی امداد درکار ہے۔',
    },
  },
  {
    code: 'FEVER',
    category: 'medical',
    urgency: 'urgent',
    label: { ar: 'حمى / حرارة', en: 'Fever / High Temp', ur: 'بخار / تیز بخار' },
    text: {
      ar: 'المريض يعاني من ارتفاع في درجة الحرارة وصداع.',
      en: 'Patient has high fever and chills.',
      ur: 'مریض کو تیز بخار اور جسم میں درد ہے۔',
    },
  },
  {
    code: 'HELP',
    category: 'gov',
    urgency: 'emergency',
    label: { ar: 'مساعدة عاجلة', en: 'Need Help', ur: 'مدد درکار ہے' },
    text: {
      ar: 'أحتاج إلى مساعدة فورية ومترجم إشارة.',
      en: 'I need immediate assistance and a sign language interpreter.',
      ur: 'مجھے فوری مدد اور اشاروں کی زبان کے مترجم کی ضرورت ہے۔',
    },
  },
  {
    code: 'IQAMA_ID',
    category: 'gov',
    urgency: 'routine',
    label: { ar: 'إقامة / هوية', en: 'Iqama / ID Card', ur: 'اقامہ / شناختی کارڈ' },
    text: {
      ar: 'أحتاج إلى مساعدة في تحديث أو الاستعلام عن الإقامة.',
      en: 'I need assistance regarding my Iqama or ID renewal/status.',
      ur: 'مجھے اپنے اقامے یا شناختی کارڈ کے بارے میں مدد چاہیے۔',
    },
  },
  {
    code: 'PHARMACY',
    category: 'medical',
    urgency: 'routine',
    label: { ar: 'صيدلية / دواء', en: 'Pharmacy / Medicine', ur: 'دواخانہ / دوا' },
    text: {
      ar: 'أبحث عن الصيدلية أو صرف الوصفة الطبية.',
      en: 'I am looking for the pharmacy or prescription pickup.',
      ur: 'مجھے فارمیسی یا ڈاکٹر کا نسخہ حاصل کرنا ہے۔',
    },
  },
  {
    code: 'BREATHING_TROUBLE',
    category: 'medical',
    urgency: 'emergency',
    label: { ar: 'صعوبة في التنفس', en: 'Breathing Difficulty', ur: 'سانس لینے میں دشواری' },
    text: {
      ar: 'المريض يعاني من ضيق في التنفس.',
      en: 'Patient is experiencing acute shortness of breath.',
      ur: 'مریض کو سانس لینے میں شدید دشواری ہو رہی ہے۔',
    },
  },
];

const SCRIPT_FONT: Record<Lang, string> = {
  ar: "var(--font-naskh), 'Segoe UI', system-ui, sans-serif",
  en: "system-ui, -apple-system, 'Segoe UI', sans-serif",
  ur: "var(--font-nastaliq), var(--font-naskh), system-ui, serif",
};

// Speaker glyph as SVG, not an emoji: emoji fonts differ per device and render
// as tofu boxes on kiosk hardware without a colour-emoji font.
function SpeakerIcon() {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      style={{ flexShrink: 0 }}
    >
      <path d="M11 5 6 9H3v6h3l5 4V5z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M18.5 5.5a9 9 0 0 1 0 13" />
    </svg>
  );
}

// Nastaliq glyphs are far taller than Latin ones: at default line-height the
// ascenders get clipped, so each script gets its own line-height budget.
const SCRIPT_LINE_HEIGHT: Record<Lang, number> = { ar: 1.6, en: 1.3, ur: 2.05 };

export default function ImaaKioskApp() {
  const [selectedSign, setSelectedSign] = useState<SignOption>(SIGNS[0]);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [highContrast, setHighContrast] = useState<boolean>(false);
  const [isSimulatingCamera, setIsSimulatingCamera] = useState<boolean>(false);

  const fontScaleMap = {
    normal: { label: '18px', text: '15px', name: '100%' },
    large: { label: '22px', text: '18px', name: '120%' },
    xlarge: { label: '26px', text: '22px', name: '140%' },
  };

  // Paint the document root, not only <main>: on phones and kiosks the
  // browser chrome and overscroll area must follow the contrast mode too.
  useEffect(() => {
    const bg = highContrast ? '#000000' : '#080b0f';
    document.body.style.background = bg;
    document.documentElement.style.background = bg;
  }, [highContrast]);

  const speakButtonStyle: React.CSSProperties = {
    background: '#1e293b',
    border: '1px solid #334155',
    color: '#38bdf8',
    padding: '10px 16px',
    borderRadius: 10,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    minHeight: 44,
    minWidth: 44,
    whiteSpace: 'nowrap',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  };

  const handleSpeak = (text: string, lang: Lang) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'ar' ? 'ar-SA' : lang === 'ur' ? 'ur-PK' : 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const simulateRecognition = (sign: SignOption) => {
    setIsSimulatingCamera(true);
    setTimeout(() => {
      setSelectedSign(sign);
      setIsSimulatingCamera(false);
    }, 600);
  };

  return (
    <main
      className={`${naskh.variable} ${nastaliq.variable}`}
      style={{
        minHeight: '100vh',
        background: highContrast ? '#000000' : '#080b0f',
        color: highContrast ? '#ffffff' : '#e8eef5',
        fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div className="shell">
        {/* Top Navigation / Header */}
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 10,
            padding: '12px 0',
            borderBottom: '1px solid #1f2937',
            marginBottom: 20,
          }}
        >
          <div>
            <div style={{ fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#38bdf8', fontWeight: 700 }}>
              إيماء · IMAA KIOSK
            </div>
            <h1 style={{ fontSize: 'clamp(16px, 4.2vw, 22px)', margin: '4px 0 0', fontWeight: 600, lineHeight: 1.25 }}>
              Sign Language & Accessibility Bridge
            </h1>
          </div>

          {/* Accessibility Controls for Elderly & Deaf */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={() =>
                setFontSize(fontSize === 'normal' ? 'large' : fontSize === 'large' ? 'xlarge' : 'normal')
              }
              style={{
                background: '#1e293b',
                color: '#fff',
                border: '1px solid #334155',
                padding: '10px 14px',
                borderRadius: 8,
                minHeight: 44,
                minWidth: 44,
                fontSize: 13,
                cursor: 'pointer',
                fontWeight: 600,
              }}
              title="Change Text Size"
            >
              A+ {fontScaleMap[fontSize].name}
            </button>
            <button
              onClick={() => setHighContrast(!highContrast)}
              style={{
                background: highContrast ? '#ffffff' : '#1e293b',
                color: highContrast ? '#000000' : '#fff',
                border: '1px solid #334155',
                padding: '10px 14px',
                borderRadius: 8,
                minHeight: 44,
                minWidth: 44,
                fontSize: 13,
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              {highContrast ? 'Normal' : 'High Contrast'}
            </button>
          </div>
        </header>

        {/* Camera / Recognition Simulation Box */}
        <section
          style={{
            background: '#0f172a',
            border: '2px dashed #334155',
            borderRadius: 16,
            padding: 24,
            textAlign: 'center',
            marginBottom: 24,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 12 }}>
            📸 Camera Landmark Feed (PSL & ArSL Browser WASM Engine)
          </div>
          {isSimulatingCamera ? (
            <div style={{ padding: '30px 0', fontSize: 18, color: '#38bdf8', fontWeight: 600 }}>
              ✨ Recognizing sign landmarks... (<span dir="ltr">194-dim vector match</span>)
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 13, color: '#cbd5e1', marginBottom: 16 }}>
                Tap any test sign below to simulate instant sign recognition for hospitals, banks, and government counters:
              </div>
              <div className="sign-grid">
                {SIGNS.map((s) => (
                  <button
                    key={s.code}
                    onClick={() => simulateRecognition(s)}
                    style={{
                      background: selectedSign.code === s.code ? '#0284c7' : '#1e293b',
                      color: '#ffffff',
                      border: '1px solid #334155',
                      padding: '12px 14px',
                      borderRadius: 10,
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: 600,
                      textAlign: 'center',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div>{s.label.en}</div>
                    <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>{s.label.ar}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Trilingual Output Cards */}
        <div className="cards-grid">
          <div
            className="urgency-bar"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: selectedSign.urgency === 'emergency' ? '#7f1d1d' : '#14532d',
              color: '#fef2f2',
              padding: '10px 16px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: '0.05em',
            }}
          >
            <span>🚨 URGENCY LEVEL: {selectedSign.urgency.toUpperCase()}</span>
            <span>CODE: {selectedSign.code}</span>
          </div>

          {/* Arabic Card (RTL) */}
          <div
            lang="ar"
            dir="rtl"
            style={{
              background: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: 14,
              padding: 20,
              fontFamily: SCRIPT_FONT.ar,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.9, paddingTop: 2, whiteSpace: 'nowrap' }}>العربية</span>
              <button
                onClick={() => handleSpeak(selectedSign.text.ar, 'ar')}
                style={speakButtonStyle}
              >
                <SpeakerIcon />
                <span>نطق</span>
              </button>
            </div>
            <div style={{ fontSize: fontScaleMap[fontSize].label, fontWeight: 700, marginBottom: 6, lineHeight: 1.5, paddingTop: 0 }}>
              {selectedSign.label.ar}
            </div>
            <div style={{ fontSize: fontScaleMap[fontSize].text, color: '#cbd5e1', lineHeight: SCRIPT_LINE_HEIGHT.ar + 0.15, wordSpacing: '0.06em' }}>
              {selectedSign.text.ar}
            </div>
          </div>

          {/* English Card (LTR) */}
          <div
            lang="en"
            dir="ltr"
            style={{
              background: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: 14,
              padding: 20,
              fontFamily: SCRIPT_FONT.en,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', lineHeight: 1.9, paddingTop: 2, whiteSpace: 'nowrap' }}>ENGLISH</span>
              <button
                onClick={() => handleSpeak(selectedSign.text.en, 'en')}
                style={speakButtonStyle}
              >
                <SpeakerIcon />
                <span>Speak</span>
              </button>
            </div>
            <div style={{ fontSize: fontScaleMap[fontSize].label, fontWeight: 700, marginBottom: 6, lineHeight: SCRIPT_LINE_HEIGHT.en }}>
              {selectedSign.label.en}
            </div>
            <div style={{ fontSize: fontScaleMap[fontSize].text, color: '#cbd5e1', lineHeight: SCRIPT_LINE_HEIGHT.en + 0.2 }}>
              {selectedSign.text.en}
            </div>
          </div>

          {/* Urdu Card (RTL) */}
          <div
            lang="ur"
            dir="rtl"
            style={{
              background: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: 14,
              padding: 20,
              fontFamily: SCRIPT_FONT.ur,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 15, color: '#94a3b8', lineHeight: 1.9, paddingTop: 2, whiteSpace: 'nowrap' }}>اردو</span>
              <button
                onClick={() => handleSpeak(selectedSign.text.ur, 'ur')}
                style={speakButtonStyle}
              >
                <SpeakerIcon />
                <span>آواز</span>
              </button>
            </div>
            <div style={{ fontSize: `calc(${fontScaleMap[fontSize].label} * 1.3)`, fontWeight: 400, color: '#f8fafc', marginBottom: 14, lineHeight: SCRIPT_LINE_HEIGHT.ur, paddingTop: 8, wordSpacing: '0.1em' }}>
              {selectedSign.label.ur}
            </div>
            <div style={{ fontSize: `calc(${fontScaleMap[fontSize].text} * 1.08)`, color: '#cbd5e1', lineHeight: SCRIPT_LINE_HEIGHT.ur + 0.35, wordSpacing: '0.1em' }}>
              {selectedSign.text.ur}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer style={{ marginTop: 24, textAlign: 'center', fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>
          إيماء (Imaa) · Designed for KSA Hospitals, Banks & Gov Counters.
          <br />
          Zero biometric data retention · PDPL Compliant · PSL & ArSL Bridge.
        </footer>
      </div>
    </main>
  );
}
