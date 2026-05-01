import Link from 'next/link';
import { api } from '@/lib/api';
import { bnNum, bnDay, bnTime, SUBJECT_BN, BATCH_TYPE_BN } from '@/lib/format';

export const dynamic = 'force-dynamic';

async function fetchData() {
  const [batches, teachers, top, resources] = await Promise.all([
    api<any[]>('/batches').catch(() => []),
    api<any[]>('/teachers').catch(() => []),
    api<any[]>('/exams/top-performers?limit=3').catch(() => []),
    api<any[]>('/resources/public').catch(() => []),
  ]);
  return { batches, teachers, top, resources };
}

export default async function Home() {
  const { batches, teachers, top, resources } = await fetchData();

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-10 sm:py-16 md:py-24 grid md:grid-cols-2 gap-8 md:gap-10 items-center">
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-white/15 text-xs sm:text-sm mb-4">
              অনলাইন লাইভ একাডেমি · এইচএসসি ও এসএসসি
            </span>
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold leading-tight">
              সাশ্রয়ী ফি-তে ইংরেজি ও আইসিটি'র লাইভ ক্লাস
            </h1>
            <p className="mt-4 sm:mt-5 text-brand-100 max-w-xl text-sm sm:text-base">
              মাত্র <strong>৩৫০–৫০০ টাকা</strong> মাসিক ফি-তে এইচএসসি ও এসএসসি'র ইংরেজি ১ম, ২য় পত্র ও
              আইসিটি বিষয়ের লাইভ ক্লাস — Google Meet-এ। আর্থিকভাবে অস্বচ্ছল শিক্ষার্থীদের
              মানসম্মত শিক্ষা পৌঁছে দিতে আমরা প্রতিশ্রুতিবদ্ধ।
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/batches" className="btn bg-white text-brand-700 hover:bg-brand-50 font-semibold">
                ব্যাচ দেখুন
              </Link>
              <Link href="/register" className="btn bg-accent-500 hover:bg-accent-600 text-white font-semibold">
                ভর্তি হোন
              </Link>
            </div>
            <div className="mt-8 grid grid-cols-3 gap-4 max-w-md">
              <Stat label="শিক্ষক" value={bnNum(teachers.length || 3)} />
              <Stat label="ব্যাচ" value={bnNum(batches.length || 4)} />
              <Stat label="ক্লাস" value="GMeet" />
            </div>
          </div>
          <div className="bg-white/10 rounded-2xl backdrop-blur p-6 border border-white/20">
            <h3 className="font-semibold text-lg mb-4">কেন তাসিন ইংলিশ একাডেমি?</h3>
            <ul className="space-y-3 text-brand-50">
              <li className="flex gap-3"><span>✅</span><span>সাশ্রয়ী মাসিক ফি (৩৫০–৫০০ টাকা)</span></li>
              <li className="flex gap-3"><span>✅</span><span>প্রিমিয়াম ব্যাচ সর্বোচ্চ ১০ জন, পার্সোনাল কেয়ার</span></li>
              <li className="flex gap-3"><span>✅</span><span>প্রথম ২–৩টি ক্লাস ফ্রি, পরে পেমেন্ট</span></li>
              <li className="flex gap-3"><span>✅</span><span>Google Meet-এ লাইভ ক্লাস ও রেকর্ডিং</span></li>
              <li className="flex gap-3"><span>✅</span><span>সাপ্তাহিক পরীক্ষা, লেকচার শিট, সাজেশন</span></li>
              <li className="flex gap-3"><span>✅</span><span>bKash এ পেমেন্ট, ম্যানুয়াল অনুমোদন</span></li>
            </ul>
          </div>
        </div>
      </section>

      {/* Batches */}
      <section className="max-w-7xl mx-auto px-4 py-10 sm:py-16">
        <SectionHeader title="চলমান ব্যাচসমূহ" subtitle="আপনার পছন্দের ব্যাচে এখনই ভর্তি হোন" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {batches.slice(0, 6).map((b: any) => (
            <Link key={b._id} href={`/batches/${b._id}`} className="card hover:shadow-md transition block">
              <div className="flex items-center justify-between mb-2">
                <span className={`badge ${b.type === 'premium' ? 'bg-amber-100 text-amber-800' : 'bg-brand-100 text-brand-800'}`}>
                  {BATCH_TYPE_BN[b.type]}
                </span>
                <span className="text-sm text-slate-500">{b.code}</span>
              </div>
              <div className="text-lg font-semibold text-slate-900">{b.nameBn || b.name}</div>
              <div className="text-sm text-slate-600 mt-1">{SUBJECT_BN[b.subject] || b.subject}</div>
              <div className="mt-3 flex items-center justify-between">
                <div className="text-sm text-slate-600">
                  <span className="font-medium text-slate-800">মাসিক ফি:</span> ৳{bnNum(b.monthlyFee)}
                </div>
                <div className="text-sm text-slate-600">
                  সিট: {bnNum(b.maxStudents - (b.enrolledCount || 0))}/{bnNum(b.maxStudents)}
                </div>
              </div>
              {b.schedule?.length ? (
                <div className="mt-3 text-xs text-slate-500">
                  {b.schedule.map((s: any) => `${bnDay(s.day)} ${bnTime(s.startTime)}`).join(' • ')}
                </div>
              ) : null}
            </Link>
          ))}
          {!batches.length && (
            <div className="col-span-full text-center text-slate-500 py-8">এখনও কোনও ব্যাচ যোগ করা হয়নি।</div>
          )}
        </div>
      </section>

      {/* Top performers */}
      <section className="bg-white py-10 sm:py-16 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4">
          <SectionHeader
            title="সাম্প্রতিক পরীক্ষায় সেরা পারফর্মার"
            subtitle="ব্যাচভিত্তিক সর্বশেষ মূল্যায়িত পরীক্ষার শীর্ষ ৩ জন"
          />
          <div className="grid lg:grid-cols-2 gap-6">
            {top.map((g: any, i: number) => (
              <div key={i} className="card">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-lg font-semibold">{g.batch?.name}</div>
                    <div className="text-sm text-slate-500">{g.top?.[0]?.exam?.title}</div>
                  </div>
                  <span className={`badge ${g.batch?.type === 'premium' ? 'bg-amber-100 text-amber-800' : 'bg-brand-100 text-brand-800'}`}>
                    {BATCH_TYPE_BN[g.batch?.type]}
                  </span>
                </div>
                <ol className="space-y-2">
                  {g.top.map((r: any) => (
                    <li key={r._id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                      <span className={`w-8 h-8 grid place-items-center rounded-full font-bold text-white
                        ${r.rank === 1 ? 'bg-amber-500' : r.rank === 2 ? 'bg-slate-400' : 'bg-amber-700'}`}>
                        {bnNum(r.rank)}
                      </span>
                      <div className="flex-1">
                        <div className="font-medium">{r.student?.name}</div>
                        <div className="text-xs text-slate-500">
                          {r.student?.institution || '—'} · {r.student?.level}
                        </div>
                      </div>
                      <div className="font-bold text-brand-700">
                        {bnNum(r.marks)}/{bnNum(r.totalMarks)}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
            {!top.length && (
              <div className="col-span-full text-center text-slate-500 py-8">
                এখনও পরীক্ষার ফলাফল প্রকাশ হয়নি।
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Teachers */}
      <section className="max-w-7xl mx-auto px-4 py-10 sm:py-16">
        <SectionHeader title="আমাদের শিক্ষকবৃন্দ" subtitle="অভিজ্ঞ ও আন্তরিক শিক্ষকমণ্ডলী" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {teachers.slice(0, 3).map((t: any) => (
            <div key={t._id} className="card text-center">
              <div className="w-20 h-20 mx-auto rounded-full bg-brand-100 text-brand-700 grid place-items-center text-2xl font-bold">
                {(t.name || '').slice(0, 1)}
              </div>
              <div className="mt-3 font-semibold text-lg">{t.nameBn || t.name}</div>
              <div className="text-sm text-slate-600">{t.designationBn || t.designation}</div>
              <div className="mt-3 text-xs text-slate-500">{t.subjects?.join(' · ')}</div>
            </div>
          ))}
        </div>
        <div className="text-center mt-6">
          <Link href="/teachers" className="btn-secondary">সব শিক্ষক দেখুন</Link>
        </div>
      </section>

      {/* Resources */}
      {resources.length > 0 && (
        <section className="bg-white py-10 sm:py-16 border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4">
            <SectionHeader title="টিপস, হ্যাকস ও সাজেশন" subtitle="বিনামূল্যে — সবার জন্য" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {resources.slice(0, 6).map((r: any) => (
                <div key={r._id} className="card">
                  <div className="text-xs text-brand-700 uppercase tracking-wide">{r.kind}</div>
                  <div className="mt-1 font-semibold">{r.titleBn || r.title}</div>
                  <p className="mt-2 text-sm text-slate-600 line-clamp-3">{r.bodyBn || r.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/15 rounded-lg p-3 text-center">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-brand-100 mt-1">{label}</div>
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-8 text-center">
      <h2 className="text-2xl md:text-3xl font-bold text-slate-900">{title}</h2>
      {subtitle && <p className="mt-2 text-slate-600">{subtitle}</p>}
    </div>
  );
}
