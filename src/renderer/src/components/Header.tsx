interface HeaderProps {
  currentMonth: string;
}

export function Header({ currentMonth }: HeaderProps) {
  return (
    <header className="h-14 border-b border-slate-800 bg-slate-950/80 backdrop-blur flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <h2 className="text-sm font-medium text-slate-200">{currentMonth} 급여 처리</h2>
      </div>
      <div className="flex items-center gap-3">
        <button className="px-3 py-1.5 text-xs font-medium text-slate-400 bg-slate-900 border border-slate-700 rounded-md hover:text-slate-200 hover:border-slate-600 transition-colors">
          이전 월
        </button>
        <button className="px-3 py-1.5 text-xs font-medium text-slate-400 bg-slate-900 border border-slate-700 rounded-md hover:text-slate-200 hover:border-slate-600 transition-colors">
          다음 월
        </button>
      </div>
    </header>
  );
}
