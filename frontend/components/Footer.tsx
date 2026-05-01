import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-brand-900 text-brand-100 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div className="font-bold text-white text-lg">তাসিন ইংলিশ একাডেমি</div>
          <p className="text-sm mt-2 text-brand-200">
            HSC ও SSC শিক্ষার্থীদের জন্য সাশ্রয়ী লাইভ অনলাইন ক্লাস —
            ইংরেজি ১ম, ২য় পত্র ও আইসিটি।
          </p>
        </div>
        <div>
          <div className="font-semibold text-white mb-2">দ্রুত লিঙ্ক</div>
          <ul className="space-y-1 text-sm">
            <li><Link href="/teachers">শিক্ষকবৃন্দ</Link></li>
            <li><Link href="/batches">ব্যাচসমূহ</Link></li>
            <li><Link href="/resources">রিসোর্স</Link></li>
            <li><Link href="/top-performers">সেরা পারফর্মার</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold text-white mb-2">শিক্ষার্থীদের জন্য</div>
          <ul className="space-y-1 text-sm">
            <li><Link href="/register">রেজিস্ট্রেশন</Link></li>
            <li><Link href="/login">লগইন</Link></li>
            <li><Link href="/dashboard">ড্যাশবোর্ড</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold text-white mb-2">যোগাযোগ</div>
          <ul className="space-y-1 text-sm text-brand-200">
            <li>মাসিক ফি: ৩৫০–৫০০ টাকা</li>
            <li>প্রিমিয়াম ব্যাচ: সর্বোচ্চ ১০ জন</li>
            <li>জেনারেল ব্যাচ: ২৫+ জন</li>
            <li>ক্লাস: Google Meet</li>
            <li>পেমেন্ট: bKash (TrxID দিয়ে)</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-brand-800 py-4 text-center text-xs text-brand-300">
        © {new Date().getFullYear()} Tasin English Academy. সকল অধিকার সংরক্ষিত।
      </div>
    </footer>
  );
}
