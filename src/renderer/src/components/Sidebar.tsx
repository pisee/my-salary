import { ChevronRight } from 'lucide-react';

interface SidebarProps {
  currentStage: number;
  onSelectStage: (stage: number) => void;
}

const stages = [
  { id: 1, label: '근태 데이터 입력', description: '엑셀 업로드 및 파싱' },
  { id: 2, label: '근태 교차 검증', description: '이상치 감지 및 보정' },
  { id: 3, label: '급여 산출', description: '수당/공제 자동 계산' },
  { id: 4, label: '산출물 생성', description: '엑셀/이체/청구서' },
  { id: 5, label: 'DB 확정', description: '영구 저장 및 이력 관리' },
];

export function Sidebar({ currentStage, onSelectStage }: SidebarProps) {
  return (
    <aside className="w-72 bg-slate-950 border-r border-slate-800 flex flex-col">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-xl font-bold text-slate-100">MySalary</h1>
        <p className="text-xs text-slate-500 mt-1">급여 및 근태 자동화</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {stages.map((stage) => {
          const isActive = stage.id === currentStage;
          const isCompleted = stage.id < currentStage;
          return (
            <button
              key={stage.id}
              onClick={() => onSelectStage(stage.id)}
              className={`w-full text-left p-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-slate-800 text-slate-100'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    isCompleted
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : isActive
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {stage.id}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{stage.label}</p>
                  <p className="text-xs text-slate-500 truncate">{stage.description}</p>
                </div>
                {isActive && <ChevronRight className="w-4 h-4 text-slate-500" />}
              </div>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
