export default function ProductDetailLoading() {
  return (
    <div className="min-h-screen bg-white">
      <div className="h-10 bg-[#F37021] w-full" />
      <div className="h-16 bg-white border-b border-[#E5E5E5] w-full" />
      <main className="max-w-[1240px] w-full mx-auto px-4 sm:px-6 md:px-10 lg:px-12 py-6 space-y-6 animate-pulse">
        <div className="h-4 w-64 rounded bg-slate-100" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
          <div className="lg:col-span-6 space-y-3">
            <div className="w-full aspect-square max-h-[450px] rounded-2xl bg-slate-100" />
            <div className="flex gap-2.5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-16 h-16 rounded-xl bg-slate-100" />
              ))}
            </div>
          </div>
          <div className="lg:col-span-6 space-y-4">
            <div className="h-7 bg-slate-100 rounded w-3/4" />
            <div className="h-4 bg-slate-100 rounded w-1/3" />
            <div className="h-9 bg-slate-100 rounded w-1/4" />
            <div className="flex gap-2 pt-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-9 w-12 rounded-md bg-slate-100" />
              ))}
            </div>
            <div className="h-11 bg-slate-100 rounded-lg w-full mt-2" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-12 bg-slate-200/80 rounded-[10px]" />
              <div className="h-12 bg-slate-100 rounded-[10px]" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

