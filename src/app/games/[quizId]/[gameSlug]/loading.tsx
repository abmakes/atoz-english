export default function GameSetupLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 grandstander bg-[--primary-bg]">
      <div className="max-w-4xl w-full mx-auto bg-white/80 rounded-[32px] p-8 border-2 border-[#1E5167] shadow-[4px_4px_0px_0px_#1E5167]">
        <div className="mx-auto mb-4 h-8 w-56 rounded bg-slate-200 animate-pulse" />
        <div className="mx-auto mb-8 h-16 w-72 rounded-full bg-slate-200 animate-pulse" />
        <div className="mb-6 flex justify-center gap-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-12 w-36 rounded-xl bg-slate-100 border-2 border-slate-200 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="min-h-[180px] rounded-[32px] border-2 border-[#1E5167] bg-white p-6 shadow-[2px_4px_0px_0px_#1E5167] animate-pulse"
            >
              <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-slate-100" />
              <div className="mx-auto mb-3 h-5 w-32 rounded bg-slate-200" />
              <div className="mx-auto h-10 w-full rounded-full bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
