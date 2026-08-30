import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { AttendanceView } from './features/attendance/AttendanceView';

export function App() {
  const [currentStage, setCurrentStage] = useState<number>(1);
  const [currentMonth] = useState<string>('2026-08');

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950">
      <Sidebar currentStage={currentStage} onSelectStage={setCurrentStage} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header currentMonth={currentMonth} />
        <main className="flex-1 overflow-y-auto p-8 bg-slate-900/40">
          {currentStage === 1 && <AttendanceView />}
          {currentStage === 2 && (
            <div className="p-8 rounded-xl border border-slate-800 bg-slate-900/60 text-slate-300">
              <h2 className="text-lg font-bold text-slate-100 mb-2">2단계: 근태 교차 검증</h2>
              <p className="text-sm text-slate-400">출퇴근 기록과 연장/휴일 근무 신청 내역을 대조하여 이상치를 감지하고 보정합니다.</p>
            </div>
          )}
          {currentStage === 3 && (
            <div className="p-8 rounded-xl border border-slate-800 bg-slate-900/60 text-slate-300">
              <h2 className="text-lg font-bold text-slate-100 mb-2">3단계: 급여 산출 엔진</h2>
              <p className="text-sm text-slate-400">연봉직 및 생산직 수당/공제액을 자동 계산하고 워크센터별로 분류합니다.</p>
            </div>
          )}
          {currentStage === 4 && (
            <div className="p-8 rounded-xl border border-slate-800 bg-slate-900/60 text-slate-300">
              <h2 className="text-lg font-bold text-slate-100 mb-2">4단계: 산출물(위아고/은행/미국) 생성</h2>
              <p className="text-sm text-slate-400">위아고 대량업로드 엑셀, 은행 이체 파일, 미국 본사 청구서를 다운로드합니다.</p>
            </div>
          )}
          {currentStage === 5 && (
            <div className="p-8 rounded-xl border border-slate-800 bg-slate-900/60 text-slate-300">
              <h2 className="text-lg font-bold text-slate-100 mb-2">5단계: DB 확정 및 이력 관리</h2>
              <p className="text-sm text-slate-400">당월 정산 데이터를 SQLite에 영구 확정하고 과거 월별 추이를 비교합니다.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
