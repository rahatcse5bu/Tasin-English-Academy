const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function bnNum(n: number | string | undefined | null): string {
  if (n === undefined || n === null) return '';
  return String(n).replace(/[0-9]/g, (d) => BN_DIGITS[+d]);
}

const BN_MONTHS = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর',
];

const BN_DAYS = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];

const DAY_BN_MAP: Record<string, string> = {
  Sat: 'শনিবার', Sun: 'রবিবার', Mon: 'সোমবার', Tue: 'মঙ্গলবার',
  Wed: 'বুধবার', Thu: 'বৃহস্পতিবার', Fri: 'শুক্রবার',
};

export function bnDay(day: string): string {
  return DAY_BN_MAP[day] || day;
}

export function bnDate(d: string | Date | undefined): string {
  if (!d) return '';
  const date = new Date(d);
  if (isNaN(+date)) return '';
  return `${bnNum(date.getDate())} ${BN_MONTHS[date.getMonth()]} ${bnNum(date.getFullYear())}`;
}

export function bnDateTime(d: string | Date | undefined): string {
  if (!d) return '';
  const date = new Date(d);
  if (isNaN(+date)) return '';
  let h = date.getHours();
  const m = date.getMinutes();
  const ampm = h >= 12 ? 'অপরাহ্ণ' : 'পূর্বাহ্ণ';
  h = h % 12 || 12;
  return `${bnDate(d)}, ${bnNum(h)}:${bnNum(String(m).padStart(2, '0'))} ${ampm}`;
}

export function bnTime(t: string): string {
  // accepts "HH:MM"
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return t;
  let hh = h % 12 || 12;
  const ampm = h >= 12 ? 'অপরাহ্ণ' : 'পূর্বাহ্ণ';
  return `${bnNum(hh)}:${bnNum(String(m).padStart(2, '0'))} ${ampm}`;
}

export const SUBJECT_BN: Record<string, string> = {
  HSC_ENGLISH_1ST: 'এইচএসসি ইংরেজি ১ম পত্র',
  HSC_ENGLISH_2ND: 'এইচএসসি ইংরেজি ২য় পত্র',
  SSC_ENGLISH_1ST: 'এসএসসি ইংরেজি ১ম পত্র',
  SSC_ENGLISH_2ND: 'এসএসসি ইংরেজি ২য় পত্র',
  ICT: 'আইসিটি',
};

export const BATCH_TYPE_BN: Record<string, string> = {
  premium: 'প্রিমিয়াম',
  general: 'জেনারেল',
};

export const PAYMENT_STATUS_BN: Record<string, string> = {
  pending: 'পেন্ডিং',
  approved: 'অনুমোদিত',
  rejected: 'বাতিল',
};

export const ATTENDANCE_STATUS_BN: Record<string, string> = {
  present: 'উপস্থিত',
  absent: 'অনুপস্থিত',
  late: 'বিলম্বিত',
};

export const RESOURCE_KIND_BN: Record<string, string> = {
  lecture_sheet: 'লেকচার শিট',
  tips: 'টিপস',
  hack: 'হ্যাকস',
  note: 'নোট',
  suggestion: 'সাজেশন',
  best_practice: 'সেরা অনুশীলন',
};
