import { Upload, FileSpreadsheet } from 'lucide-react';

export function AttendanceView() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="p-8 rounded-xl border border-slate-800 bg-slate-900/60">
        <div className="flex items-center gap-3 mb-6">
          <FileSpreadsheet className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-bold text-slate-100">근태 데이터 업로드</h2>
        </div>
        <p className="text-sm text-slate-400 mb-6">
          출퇴근 기록 엑셀 파일을 업로드하여 파싱합니다. 위아고 표준 양식을 지원합니다.
        </p>
        <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-700 rounded-lg cursor-pointer hover:border-slate-600 hover:bg-slate-800/50 transition-colors">
          <Upload className="w-8 h-8 text-slate-500 mb-3" />
          <span className="text-sm text-slate-400">엑셀 파일을 드래그하거나 클릭하여 선택하세요</span>
          <span className="text-xs text-slate-600 mt-1">.xlsx, .xls, .csv</span>
          <input type="file" className="hidden" accept=".xlsx,.xls,.csv" />
        </label>
      </div>
    </div>
  );
}
