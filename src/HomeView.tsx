import type { Task, Group } from './types';

type HomeViewProps = {
  tasks: Task[];
  groups: Group[];
  onSelectTask: (task: Task) => void;
  onNavigate: (view: 'home' | 'gantt', mode?: 'prep' | 'day') => void;
  displayDays: number;
  progressPercent: number;
  hasUncompleted: boolean;
};

export default function HomeView({
  tasks,
  groups,
  onSelectTask,
  onNavigate,
  displayDays,
  progressPercent,
  hasUncompleted,
}: HomeViewProps) {
  const helpTasks = tasks.filter(t => t.needHelp);

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 relative">
      <header className="md:hidden h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0">
        <div className="font-extrabold text-xl text-blue-600 tracking-tight">Lean Connect</div>
      </header>

      <div className="flex-1 overflow-auto flex flex-col items-center pb-24 p-4 md:p-6">
        <div className="w-full max-w-md flex flex-col gap-6 relative">
          
          {/* ヘルプ要請タスクセクション */}
          {helpTasks.length > 0 && (
            <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 shadow-sm animate-pulse">
              <div className="flex items-center gap-2 text-red-700 font-bold mb-2">
                <span className="text-xl">🚨</span> ヘルプ要請中のタスク ({helpTasks.length}件)
              </div>
              <div className="flex flex-col gap-2">
                {helpTasks.map(ht => (
                  <div 
                    key={`help-${ht.taskId}`}
                    onClick={() => onSelectTask(ht)}
                    className="bg-white p-3 rounded-lg border border-red-200 shadow-sm cursor-pointer hover:bg-red-50 transition-colors flex justify-between items-center"
                  >
                    <div>
                      <p className="font-bold text-gray-800 text-sm">{ht.taskName}</p>
                      <p className="text-xs text-gray-500">グループ: {groups.find(g => g.id === ht.group)?.name}</p>
                    </div>
                    <span className="text-xs bg-red-100 text-red-600 font-bold px-2.5 py-1 rounded-full">対応する &gt;</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 進行中のプロジェクト */}
          <div>
            <h2 className="text-sm font-bold text-gray-700 mb-3">進行中のプロジェクト</h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-gray-800">文化祭2026</h3>
                <span className="bg-gray-200 text-gray-600 text-xs font-bold px-3 py-1.5 rounded-md">残り {displayDays}日</span>
              </div>
              <div className="flex flex-col gap-2.5 mb-5">
                <span className="bg-yellow-100 text-yellow-800 text-sm font-bold px-4 py-1 rounded-full w-max">
                  進捗 {progressPercent}%
                </span>
                
                {hasUncompleted && (
                  <span className="text-sm font-bold text-yellow-600 flex items-center gap-1">
                    ⚠️ 未完了タスクあり
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => onNavigate('gantt', 'prep')} 
                  className="flex-1 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg py-2.5 text-sm font-bold flex justify-between items-center px-4 hover:bg-yellow-100 transition-colors"
                >
                  <span className="flex items-center gap-1"><span className="text-yellow-500">📄</span> 準備モード</span> <span className="text-yellow-500">&gt;</span>
                </button>
                <button 
                  onClick={() => onNavigate('gantt', 'day')} 
                  className="flex-1 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg py-2.5 text-sm font-bold flex justify-between items-center px-4 hover:bg-blue-100 transition-colors"
                >
                  <span className="flex items-center gap-1"><span>🕒</span> 当日モード</span> <span>&gt;</span>
                </button>
              </div>
            </div>
          </div>

          {/* 完了済のプロジェクト */}
          <div>
            <h2 className="text-sm font-bold text-gray-700 mb-3">完了済のプロジェクト</h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="font-bold text-lg text-gray-800 mb-3">文化祭2025</h3>
              <span className="text-sm font-bold text-green-600 flex items-center gap-1 mb-4">
                ✅ 完了
              </span>
              <button className="w-full bg-gray-100 text-gray-600 border border-gray-200 rounded-lg py-2.5 text-sm font-bold flex justify-between items-center px-4 hover:bg-gray-200 transition-colors">
                <span className="flex items-center gap-1">📝 振り返りを見る</span> <span>&gt;</span>
              </button>
            </div>
          </div>

          <div className="mt-2">
            <button className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-full shadow-md hover:bg-blue-700 transition-colors flex justify-center items-center gap-2">
              新規プロジェクト <span className="text-xl leading-none">＋</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}