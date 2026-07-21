import type { Task } from './types';
import { timeSlots } from './types';

type DayTimelineViewProps = {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onHandover: (task: Task) => void;
};

export default function DayTimelineView({
  tasks,
  onSelectTask,
  onHandover,
}: DayTimelineViewProps) {
  const getRowByTimeString = (timeStr?: string) => {
    if (!timeStr) return 2;
    const index = timeSlots.indexOf(timeStr);
    return index !== -1 ? index + 2 : 2;
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50 p-2 md:p-6 mb-16 md:mb-0 relative">
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm min-w-125 overflow-hidden">
        <div
          className="grid relative"
          style={{
            gridTemplateColumns: `70px 1fr 1fr`,
            gridTemplateRows: `48px repeat(${timeSlots.length}, 60px)`
          }}
        >
          {Array.from({ length: timeSlots.length + 1 }).map((_, i) => (
            <div key={`d-row-${i}`} className="col-span-full border-b border-gray-100" style={{ gridRow: i + 1 }} />
          ))}
          <div className="row-span-full border-r border-gray-100" style={{ gridColumn: 1 }} />
          <div className="row-span-full border-r border-gray-100" style={{ gridColumn: 2 }} />

          <div className="flex items-center justify-center text-xs font-bold text-gray-600 bg-gray-100 border-b border-gray-200" style={{ gridRow: 1, gridColumn: 1 }}>時間</div>
          <div className="flex items-center justify-center text-sm font-bold text-pink-700 bg-pink-50 border-x border-t border-pink-200 mx-1 mt-1 rounded-t-lg" style={{ gridRow: 1, gridColumn: 2 }}>
            📌 常駐タスク
          </div>
          <div className="flex items-center justify-center text-sm font-bold text-blue-700 bg-blue-50 border-x border-t border-blue-200 mx-1 mt-1 rounded-t-lg" style={{ gridRow: 1, gridColumn: 3 }}>
            ⚡ 個別タスク
          </div>

          {timeSlots.map((time, index) => (
            <div
              key={time}
              className="sticky left-0 z-20 flex items-center justify-center text-xs font-bold bg-white border-b border-r border-gray-200 text-gray-500 shadow-[1px_0_0_0_#e5e7eb]"
              style={{ gridRow: index + 2, gridColumn: 1 }}
            >
              {time}
            </div>
          ))}

          {tasks.filter(t => t.taskMode === 'day').map(t => {
            const start = getRowByTimeString(t.startTime);
            const end = getRowByTimeString(t.endTime) + 1;
            const isResident = t.taskType === 'resident';
            const colIndex = isResident ? 2 : 3;
            const isCompleted = t.taskStatus === 'completed';

            return (
              <div
                key={t.taskId}
                onClick={() => onSelectTask(t)}
                className={`
                  ${t.color} text-white text-sm font-bold rounded-lg mx-2 my-1 
                  p-3 flex flex-col justify-between shadow-sm cursor-pointer transition-all hover:scale-[1.01] hover:shadow-md z-10 relative
                  ${isCompleted ? 'opacity-50 border-2 border-dashed border-white/50' : 'opacity-95 hover:opacity-100'}
                  ${t.needHelp ? 'ring-2 ring-red-500 animate-pulse border-red-500' : ''}
                `}
                style={{
                  gridRow: `${start} / ${end}`,
                  gridColumn: colIndex,
                }}
              >
                <div className="flex justify-between items-start">
                  <span className="font-extrabold text-base tracking-wide drop-shadow-sm">{t.taskName}</span>
                  <div className="flex items-center gap-1">
                    {isCompleted && <span className="text-white bg-green-500 rounded-full w-4 h-4 flex items-center justify-center text-[10px]">✓</span>}
                    {t.needHelp && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full animate-bounce">🆘 SOS</span>}
                  </div>
                </div>

                {isResident && (
                  <div className="mt-2 pt-2 border-t border-white/20 flex justify-between items-center text-xs bg-black/10 px-2 py-1 rounded">
                    <span>担当: <strong className="underline">{t.currentId || '未割当'}</strong></span>
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onHandover(t); }}
                      className="bg-white text-gray-800 hover:bg-gray-100 px-2 py-0.5 rounded font-bold shadow-xs text-[11px]"
                    >
                      引き継ぎ &gt;
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}