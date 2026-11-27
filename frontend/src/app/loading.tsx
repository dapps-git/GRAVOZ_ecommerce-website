import Header from '@/components/Header';

export default function GlobalRouteLoading() {
  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <Header />
      <main className="max-w-[1240px] mx-auto px-4 sm:px-6 md:px-10 py-8 space-y-6 animate-pulse">
        <div className="h-7 w-48 rounded bg-slate-200/80" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-md border border-[#E5E5E5] p-4 flex gap-4">
                <div className="w-28 h-28 rounded-md bg-slate-200/80 flex-shrink-0" />
                <div className="flex-1 space-y-2.5 py-1">
                  <div className="h-4 w-2/3 rounded bg-slate-200/80" />
                  <div className="h-3 w-1/3 rounded bg-slate-100" />
                  <div className="h-6 w-24 rounded bg-slate-200/80" />
                </div>
              </div>
            ))}
          </div>
          <div className="lg:col-span-4 bg-white rounded-md border border-[#E5E5E5] p-5 space-y-3">
            <div className="h-5 w-32 rounded bg-slate-200/80" />
            <div className="h-4 w-full rounded bg-slate-100" />
            <div className="h-10 w-full rounded-md bg-slate-200/80" />
          </div>
        </div>
      </main>
    </div>
  );
}
