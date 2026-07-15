export default function GameModePickerLoading() {
  return (
    <div className="min-h-screen bg-[--primary-bg] text-[--text-color] py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 h-6 w-40 rounded bg-slate-200 animate-pulse" />
        <div className="mb-2 h-10 w-2/3 max-w-md rounded bg-slate-200 animate-pulse" />
        <div className="mb-8 h-5 w-72 rounded bg-slate-100 animate-pulse" />
        <div className="grid gap-6 sm:grid-cols-2">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="flex flex-col rounded-[24px] border-2 border-[#1E5167] bg-white p-6 shadow-[4px_4px_0px_0px_#1E5167] animate-pulse"
            >
              <div className="mb-3 h-12 w-12 rounded-full bg-slate-100 border-2 border-slate-200" />
              <div className="mb-2 h-8 w-40 rounded bg-slate-200" />
              <div className="h-16 w-full rounded bg-slate-100 mb-4" />
              <div className="h-6 w-20 rounded bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
