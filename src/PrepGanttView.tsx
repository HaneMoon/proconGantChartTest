import { useMemo, useCallback } from 'react';
import type { Task, Group, DateItem } from './types';

type PrepGanttViewProps = {
  tasks: Task[];
  groups: Group[];
  dates: DateItem[];
  onSelectTask: (task: Task) => void;
  onSelectGroup: (group: Group) => void;
  onAddGroup: () => void;
  dateRowRefs: React.MutableRefObject<{ [key: string]: HTMLDivElement | null }>;
};

export default function PrepGanttView({ tasks, groups, dates, onSelectTask, onSelectGroup, onAddGroup, dateRowRefs }: PrepGanttViewProps) {
  const startRow = 2;
  const getRowByDateString = useCallback((dateStr: string) => {
    const index = dates.findIndex(d => d.dateString === dateStr);
    return index !== -1 ? index + startRow : startRow; 
  }, [dates]);

  const layoutData = useMemo(() => {
    const groupCols: Record<string, { taskId: string, subCol: number }[]> = {};
    const groupMaxCols: Record<string, number> = {};
    const groupProgress: Record<string, number> = {};
    
    const allGroupIds = ['', ...groups.map(g => g.id)];
    
    allGroupIds.forEach(gid => {
        const gTasks = tasks.filter(t => t.taskMode === 'prep' && (t.group || '') === gid)
                            .sort((a, b) => getRowByDateString(a.startDate) - getRowByDateString(b.startDate));
        
        const cols: number[] = []; 
        const taskLayout: { taskId: string, subCol: number }[] = [];
        
        gTasks.forEach(t => {
            const start = getRowByDateString(t.startDate);
            const end = getRowByDateString(t.endDate) + 1;
            let placed = false;
            for(let i=0; i<cols.length; i++) {
                if (cols[i] <= start) { 
                    cols[i] = end;
                    taskLayout.push({ taskId: t.taskId, subCol: i });
                    placed = true;
                    break;
                }
            }
            if (!placed) {
                cols.push(end);
                taskLayout.push({ taskId: t.taskId, subCol: cols.length - 1 });
            }
        });
        groupCols[gid] = taskLayout;
        groupMaxCols[gid] = Math.max(1, cols.length); 

        if (gid !== '') {
            const comp = gTasks.filter(t => t.taskStatus === 'completed').length;
            groupProgress[gid] = gTasks.length > 0 ? Math.round((comp / gTasks.length) * 100) : 0;
        }
    });

    let currentCol = 2; 
    const groupStartCol: Record<string, number> = {};
    allGroupIds.forEach(gid => {
        groupStartCol[gid] = currentCol;
        currentCol += groupMaxCols[gid];
    });

    return { groupCols, groupMaxCols, groupStartCol, totalCols: currentCol, groupProgress, allGroupIds };
  }, [tasks, groups, getRowByDateString]);

  const { groupCols, groupMaxCols, groupStartCol, totalCols, groupProgress, allGroupIds } = layoutData;

  if (dates.length === 0) {
    return <div className="flex items-center justify-center h-full text-gray-400 font-bold">タスクがありません</div>;
  }

  return (
    <div className="flex-1 overflow-auto bg-white relative w-full h-full mb-16 md:mb-0">
      <div 
        className="grid min-w-max"
        style={{
          gridTemplateColumns: `60px repeat(${totalCols - 2}, minmax(80px, 1fr)) 80px`,
          gridTemplateRows: `56px repeat(${dates.length}, 60px)`
        }}
      >
        {/* --- 1行目: ヘッダー行 --- */}
        <div 
          className="sticky top-0 left-0 z-50 bg-white border-b border-r border-gray-300 shadow-[0_2px_0_0_#e5e7eb]" 
          style={{ gridRow: 1, gridColumn: 1 }}
        ></div>

        <div 
          className="sticky top-0 z-40 col-span-full bg-white border-b border-gray-300 shadow-sm pointer-events-none" 
          style={{ gridRow: 1, gridColumn: `2 / span ${totalCols - 1}` }}
        />

        {/* 未グループ化ヘッダー */}
        <div 
          className="sticky top-0 z-45 flex items-center justify-center text-xs font-bold text-gray-400 bg-white border-r border-gray-200"
          style={{ gridRow: 1, gridColumn: `${groupStartCol['']} / span ${groupMaxCols['']}` }}
        >
          未グループ化
        </div>

        {/* グループ名ヘッダー */}
        {groups.map(g => (
          <div
            key={g.id}
            onClick={() => onSelectGroup(g)}
            className="sticky top-0 z-45 flex flex-col items-center justify-center text-sm font-bold text-blue-800 bg-blue-50/90 border-r border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors backdrop-blur-md"
            style={{ gridRow: 1, gridColumn: `${groupStartCol[g.id]} / span ${groupMaxCols[g.id]}` }}
            title="タップして詳細・削除"
          >
            <span className="truncate w-full text-center px-1">{g.name} ▼</span>
            <span className="text-[10px] text-blue-600 font-extrabold bg-white px-2 py-0.5 rounded-full mt-0.5 shadow-sm leading-none">{groupProgress[g.id]}%</span>
          </div>
        ))}

        {/* 追加ボタン */}
        <div
          onClick={onAddGroup}
          className="sticky top-0 z-45 flex items-center justify-center text-sm font-bold text-gray-500 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
          style={{ gridRow: 1, gridColumn: totalCols }}
        >
          ＋グループ
        </div>


        {/* --- グループごとの背景フレーム（スイムレーン線） --- */}
        {allGroupIds.map((gid: string) => (
          <div
            key={`swimlane-${gid}`}
            className="border-2 border-blue-200 bg-blue-50/10 rounded-xl pointer-events-none z-0"
            style={{
              gridRow: `2 / span ${dates.length}`,
              gridColumn: `${groupStartCol[gid]} / span ${groupMaxCols[gid]}`,
              margin: '4px 2px',
            }}
          />
        ))}


        {/* --- 2行目以降: コンテンツ --- */}
        {/* 日付列 (左固定) */}
        {dates.map((d, index) => (
          <div
            key={d.dateString}
            ref={el => { dateRowRefs.current[d.dateString] = el; }}
            className={`sticky left-0 z-30 flex flex-col items-center justify-center text-sm bg-white border-b border-r border-gray-200 ${d.color || 'text-gray-600'}`}
            style={{ gridRow: index + 2, gridColumn: 1 }}
          >
            <span className="text-[10px] leading-tight">{d.day}</span>
            <span className="font-bold text-base">{d.date}</span>
          </div>
        ))}

        {/* グリッドの線描画 (背景) */}
        {dates.map((_, i) => (
          <div key={`border-row-${i}`} className="col-span-full border-b border-gray-100 pointer-events-none" style={{ gridRow: i + 2 }} />
        ))}
        {Array.from({ length: totalCols - 1 }).map((_, i) => (
          <div key={`border-col-${i}`} className="row-span-full border-r border-gray-50 pointer-events-none" style={{ gridColumn: i + 2, gridRow: `2 / span ${dates.length}` }} />
        ))}

        {/* タスク配置 */}
        {tasks.filter(t => t.taskMode === 'prep').map(t => {
          const start = getRowByDateString(t.startDate);
          const end = getRowByDateString(t.endDate) + 1; 
          const gid = t.group || '';
          const layout = groupCols[gid].find(l => l.taskId === t.taskId);
          const colIndex = groupStartCol[gid] + (layout ? layout.subCol : 0);
          const isCompleted = t.taskStatus === 'completed';

          return (
            <div
              key={t.taskId}
              onClick={() => onSelectTask(t)}
              className={`
                ${t.color} text-white text-sm font-bold rounded-lg mx-1.5 my-1 
                shadow-sm cursor-pointer transition-transform hover:scale-[1.02] hover:shadow-md z-10 relative overflow-hidden
                ${isCompleted ? 'opacity-50 border-2 border-dashed border-white/50' : 'opacity-90'}
                ${t.needHelp ? 'ring-2 ring-red-500 animate-pulse border-red-500' : ''}
              `}
              style={{
                gridRow: `${start} / ${end}`,
                gridColumn: colIndex,
              }}
            >
              <div className="sticky top-16 flex flex-col items-center justify-start py-2 w-full">
                <div className="relative h-5 w-full flex justify-center mb-1">
                  {isCompleted && <span className="absolute text-white bg-green-500 rounded-full w-4 h-4 flex items-center justify-center text-[10px]">✓</span>}
                  {t.needHelp && <span className="absolute right-0 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full shadow-md animate-bounce">🆘</span>}
                </div>
                <span className="tracking-widest drop-shadow-md" style={{ writingMode: 'vertical-rl', textOrientation: 'upright' }}>
                  {t.taskName}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}