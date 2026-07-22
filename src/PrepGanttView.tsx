import type { Task, Group, DateItem } from './types';

type PrepGanttViewProps = {
  tasks: Task[];
  groups: Group[];
  dates: DateItem[];
  onSelectTask: (task: Task) => void;
  onSelectGroup: (group: Group) => void;
  dateRowRefs: React.MutableRefObject<{ [key: string]: HTMLDivElement | null }>;
};

export default function PrepGanttView({
  tasks,
  groups,
  dates,
  onSelectTask,
  onSelectGroup,
  dateRowRefs,
}: PrepGanttViewProps) {
  const startRow = 2;
  const getRowByDateString = (dateStr: string) => {
    const index = dates.findIndex(d => d.dateString === dateStr);
    return index !== -1 ? index + startRow : startRow; 
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50 p-2 md:p-6 mb-16 md:mb-0 relative">
      {dates.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm min-w-125 overflow-hidden">
          <div
            className="grid relative"
            style={{
              gridTemplateColumns: `60px repeat(${groups.length}, minmax(100px, 1fr))`,
              gridTemplateRows: `48px repeat(${dates.length}, 60px)`
            }}
          >
            {Array.from({ length: dates.length + 1 }).map((_, i) => (
              <div key={`row-${i}`} className="col-span-full border-b border-gray-100" style={{ gridRow: i + 1 }} />
            ))}
            {Array.from({ length: groups.length + 1 }).map((_, i) => (
              <div key={`col-${i}`} className="row-span-full border-r border-gray-100" style={{ gridColumn: i + 1 }} />
            ))}

            {groups.map((g, index) => (
              <div
                key={g.id}
                onClick={() => onSelectGroup(g)}
                className="flex items-center justify-center text-sm font-bold text-gray-700 bg-gray-100 border-x border-t border-gray-200 mx-1 mt-1 rounded-t-lg cursor-pointer hover:bg-gray-200 transition-colors"
                style={{ gridRow: 1, gridColumn: index + 2 }}
                title="タップしてグループ詳細・削除"
              >
                {g.name} ▼
              </div>
            ))}

            {dates.map((d, index) => (
              <div
                key={d.dateString}
                ref={el => { dateRowRefs.current[d.dateString] = el; }}
                className={`sticky left-0 z-20 flex flex-col items-center justify-center text-sm bg-white border-b border-r border-gray-200 shadow-[1px_0_0_0_#e5e7eb] ${d.color || 'text-gray-600'}`}
                style={{ gridRow: index + 2, gridColumn: 1 }}
              >
                <span className="text-[10px] leading-tight">{d.day}</span>
                <span className="font-bold text-base">{d.date}</span>
              </div>
            ))}

            {tasks.filter(t => t.taskMode === 'prep').map(t => {
              const start = getRowByDateString(t.startDate);
              const end = getRowByDateString(t.endDate) + 1; 
              const groupIndex = groups.findIndex(g => g.id === t.group);
              const colIndex = groupIndex !== -1 ? groupIndex + 2 : 2;
              const isCompleted = t.taskStatus === 'completed';

              return (
                <div
                  key={t.taskId}
                  onClick={() => onSelectTask(t)}
                  className={`
                    ${t.color} text-white text-sm font-bold rounded-lg mx-1.5 my-0.75 
                    flex items-center justify-center shadow-sm cursor-pointer transition-all hover:brightness-110 hover:shadow-md z-10 relative
                    ${isCompleted ? 'opacity-50 border-2 border-dashed border-white/50' : 'opacity-90'}
                    ${t.needHelp ? 'ring-2 ring-red-500 animate-pulse border-red-500' : ''}
                  `}
                  style={{
                    gridRow: `${start} / ${end}`,
                    gridColumn: colIndex,
                    writingMode: 'vertical-rl',
                    textOrientation: 'upright'
                  }}
                >
                  {isCompleted && (
                    <span className="absolute top-2 left-1/2 -translate-x-1/2 text-white bg-green-500 rounded-full w-4 h-4 flex items-center justify-center text-[10px]">✓</span>
                  )}
                  {t.needHelp && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full shadow-md animate-bounce" style={{ writingMode: 'horizontal-tb' }}>
                      🆘
                    </span>
                  )}
                  <span className="tracking-widest py-2 drop-shadow-md">
                    {t.taskName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full text-gray-400 font-bold">タスクがありません</div>
      )}
    </div>
  );
}