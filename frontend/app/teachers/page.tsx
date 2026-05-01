import { api } from '@/lib/api';
import { bnNum } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function TeachersPage() {
  const teachers = await api<any[]>('/teachers').catch(() => []);
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-12">
      <h1 className="text-3xl font-bold text-slate-900">আমাদের শিক্ষকবৃন্দ</h1>
      <p className="text-slate-600 mt-2">অভিজ্ঞ ও আন্তরিক শিক্ষকমণ্ডলী, সর্বদা আপনার পাশে।</p>
      <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {teachers.map((t: any) => (
          <div key={t._id} className="card">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-brand-100 text-brand-700 grid place-items-center text-xl font-bold">
                {(t.name || '').slice(0, 1)}
              </div>
              <div>
                <div className="font-semibold text-lg">{t.nameBn || t.name}</div>
                <div className="text-sm text-slate-600">{t.designationBn || t.designation}</div>
              </div>
            </div>
            {t.qualificationBn && (
              <div className="mt-4 text-sm">
                <span className="font-medium text-slate-700">যোগ্যতা:</span>{' '}
                <span className="text-slate-600">{t.qualificationBn}</span>
              </div>
            )}
            {t.experienceYears && (
              <div className="mt-1 text-sm">
                <span className="font-medium text-slate-700">অভিজ্ঞতা:</span>{' '}
                <span className="text-slate-600">{bnNum(t.experienceYears)} বছর</span>
              </div>
            )}
            {t.bioBn && <p className="mt-3 text-sm text-slate-600">{t.bioBn}</p>}
            {t.subjects?.length ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {t.subjects.map((s: string) => (
                  <span key={s} className="badge bg-brand-50 text-brand-700">{s}</span>
                ))}
              </div>
            ) : null}
          </div>
        ))}
        {!teachers.length && (
          <div className="col-span-full text-center text-slate-500 py-8">এখনও কোনও শিক্ষক যোগ করা হয়নি।</div>
        )}
      </div>
    </div>
  );
}
