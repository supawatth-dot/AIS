import React, { createContext, useContext, useEffect, useState } from 'react';

export type Language = 'th' | 'en';

// Translation dictionary. Keys are shared; values per language.
const translations = {
  th: {
    // App identity
    'app.subtitle': 'Enterprise v1.2',
    'app.refresh': 'รีเฟรชข้อมูล',

    // Login
    'login.title': 'เข้าสู่ระบบการจัดการทรัพย์สิน AIS',
    'login.subtitle': 'กรุณาระบุรหัสผู้ทดสอบเพื่อเข้าสังเกตการณ์ระบบหลังบ้านสมาร์ทคลัง',
    'login.username': 'ชื่อผู้ใช้งาน',
    'login.usernamePlaceholder': 'admin หรือ user',
    'login.password': 'รหัสผ่านลับ',
    'login.passwordPlaceholder': 'admin123 หรือ user123',
    'login.submit': 'เข้าสู่ระบบประเมินค่า',
    'login.hint': 'คำใบ้ผู้ใช้และวิศวกรเพื่อสลับระบบสิทธิ์:',

    // Role badge
    'role.label': 'บทบาทเข้าควบคุม',
    'role.admin': 'ผู้บริหารสูงสุด (Admin)',
    'role.user': 'พนักงานอ่าน (User)',
    'role.swap': 'สลับบทบาท',
    'role.swapError': 'สลับสิทธิ์ขัดข้อง',

    // Nav sections
    'nav.sectionMain': 'แผงควบคุมหลัก',
    'nav.sectionPeople': 'พนักงาน & คลังประดับ',
    'nav.dashboard': 'แดชบอร์ดสรุป (Summary)',
    'nav.assets': 'โทรศัพท์มือถือ (Assets)',
    'nav.contracts': 'ซิม & สัญญาบริการ (SIMs)',
    'nav.assignments': 'บันทึกส่งมอบ/คืน (Handovers)',
    'nav.employees': 'ทะเบียนพนักงาน (Staff)',
    'nav.documents': 'ใบเสัญญาแนบ PDF (Files)',
    'nav.logs': 'บันทึกกิจกรรม (Audit Log)',

    // Footer
    'footer.utcNote': 'สัญญาล่าสุดคำนวณ UTC',
    'footer.logout': 'ออกจากเซสชัน',

    // Header titles
    'header.Dashboard': 'ภาพรวมแดชบอร์ด',
    'header.Assets': 'สารบรรณข้อมูลเครื่องโทรศัพท์',
    'header.Contracts': 'การจัดการบัญชี SIM / คลื่นความถี่สัญญาลอย',
    'header.Assignments': 'คลังเซ็นส่งคืนสัมภาระพนักงาน',
    'header.Employees': 'ข้อมูลทีมงานบริษัท',
    'header.Documents': 'แนบหลักฐาน PDF / ดรอปบุ๊ก',
    'header.Logs': 'ระบบตรวจสอบความมั่นคง Audit Log',
    'header.searchPlaceholder': 'สืบค้นด่วน: IMEI, S/N, เบอร์ AIS หรือชื่อคน...',

    // Notifications
    'notif.title': 'การแจ้งเตือนสัญญาทั้งสิ้น',
    'notif.markAll': 'อ่านทั้งหมด',
    'notif.empty': 'ไม่มีรายการแจ้งเตือนสัญญากดดัน',
    'notif.read': 'อ่าน',
    'notif.close': 'ปิดกล่อง',

    // Loading
    'loading.title': 'กำลังแลกเปลี่ยนแพ็กเกจเสาสัญญาณ...',
    'loading.subtitle': 'เกลี่ยฐานข้อมูลเซิร์ฟเวอร์ AIS',

    // Language toggle
    'lang.toggle': 'EN',
    'lang.label': 'ภาษา',
  },
  en: {
    'app.subtitle': 'Enterprise v1.2',
    'app.refresh': 'Refresh data',

    'login.title': 'AIS Asset Management Login',
    'login.subtitle': 'Enter your test credentials to access the smart inventory backend.',
    'login.username': 'Username',
    'login.usernamePlaceholder': 'admin or user',
    'login.password': 'Password',
    'login.passwordPlaceholder': 'admin123 or user123',
    'login.submit': 'Sign in',
    'login.hint': 'Demo credentials to switch roles:',

    'role.label': 'Access role',
    'role.admin': 'Administrator (Admin)',
    'role.user': 'Read-only staff (User)',
    'role.swap': 'Switch role',
    'role.swapError': 'Failed to switch role',

    'nav.sectionMain': 'Main control',
    'nav.sectionPeople': 'Staff & inventory',
    'nav.dashboard': 'Dashboard (Summary)',
    'nav.assets': 'Mobile devices (Assets)',
    'nav.contracts': 'SIMs & service contracts',
    'nav.assignments': 'Handover / return log',
    'nav.employees': 'Employee registry (Staff)',
    'nav.documents': 'Attached PDF files',
    'nav.logs': 'Activity log (Audit Log)',

    'footer.utcNote': 'Contracts computed in UTC',
    'footer.logout': 'Sign out',

    'header.Dashboard': 'Dashboard overview',
    'header.Assets': 'Mobile device records',
    'header.Contracts': 'SIM account management',
    'header.Assignments': 'Employee handover & return',
    'header.Employees': 'Company team data',
    'header.Documents': 'Attached PDF evidence',
    'header.Logs': 'Security audit log',
    'header.searchPlaceholder': 'Quick search: IMEI, S/N, AIS number or name...',

    'notif.title': 'All contract alerts',
    'notif.markAll': 'Mark all read',
    'notif.empty': 'No pending contract alerts',
    'notif.read': 'Read',
    'notif.close': 'Close',

    'loading.title': 'Syncing signal packages...',
    'loading.subtitle': 'Loading AIS server database',

    'lang.toggle': 'ไทย',
    'lang.label': 'Language',
  },
} as const;

type TranslationKey = keyof typeof translations['th'];

interface LanguageContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

const STORAGE_KEY = 'ais_lang';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === 'th' || saved === 'en') return saved;
    }
    return 'th';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, lang);
      document.documentElement.lang = lang;
    }
  }, [lang]);

  const setLang = (l: Language) => setLangState(l);
  const toggleLang = () => setLangState(prev => (prev === 'th' ? 'en' : 'th'));
  const t = (key: TranslationKey) => translations[lang][key] ?? translations.th[key] ?? key;

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
}
