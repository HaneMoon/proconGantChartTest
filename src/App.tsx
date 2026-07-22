import { useState, useEffect, useMemo, useRef } from 'react';
import type { Task, Group, DateItem, Expense, Memo, Member } from './types';
import { initialGroups, initialExpenses, initialMemos, initialMembers, NAV_ITEMS } from './types';
import HomeView from './HomeView';
import PrepGanttView from './PrepGanttView';
import DayTimelineView from './DayTimelineView';
import BudgetView from './BudgetView';
import MemoView from './MemoView';
import MemberView from './MemberView';

const STORAGE_KEY_TASKS = 'lean-connect-tasks-v8';
const STORAGE_KEY_GROUPS = 'lean-connect-groups-v4';
const STORAGE_KEY_EXPENSES = 'lean-connect-expenses-v2';
const STORAGE_KEY_MEMOS = 'lean-connect-memos-v2';
const STORAGE_KEY_MEMBERS = 'lean-connect-members-v2';
const STORAGE_KEY_BUDGET = 'lean-connect-budget-v2';

const formatDate = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

type ViewType = 'home' | 'gantt' | 'budget' | 'memo' | 'members';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [taskMode, setTaskMode] = useState<'prep' | 'day'>('prep');

  const [groups, setGroups] = useState<Group[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_GROUPS);
    return saved ? JSON.parse(saved) : initialGroups;
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_TASKS);
    return saved ? JSON.parse(saved) : [];
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_EXPENSES);
    return saved ? JSON.parse(saved) : initialExpenses;
  });

  const [memos, setMemos] = useState<Memo[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_MEMOS);
    return saved ? JSON.parse(saved) : initialMemos;
  });

  const [members, setMembers] = useState<Member[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_MEMBERS);
    return saved ? JSON.parse(saved) : initialMembers;
  });

  const [totalBudget, setTotalBudget] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_BUDGET);
    return saved ? Number(saved) : 70000;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskGroup, setNewTaskGroup] = useState('');
  const [newTaskStart, setNewTaskStart] = useState('');
  const [newTaskEnd, setNewTaskEnd] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskType, setNewTaskType] = useState<'resident' | 'individual'>('resident');
  const [newTaskAssignees, setNewTaskAssignees] = useState<string[]>([]);
  
  const [newTaskStartTime, setNewTaskStartTime] = useState('10:00');
  const [newTaskEndTime, setNewTaskEndTime] = useState('12:00');

  const [selectedYearMonth, setSelectedYearMonth] = useState('2026-06');
  const dateRowRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => { localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY_GROUPS, JSON.stringify(groups)); }, [groups]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY_EXPENSES, JSON.stringify(expenses)); }, [expenses]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY_MEMOS, JSON.stringify(memos)); }, [memos]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY_MEMBERS, JSON.stringify(members)); }, [members]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY_BUDGET, String(totalBudget)); }, [totalBudget]);

  const dynamicTimeSlots = useMemo(() => {
    const dayTasks = tasks.filter(t => t.taskMode === 'day');
    if (dayTasks.length === 0) return ['10:00', '10:30', '11:00', '11:30', '12:00'];
    
    let minMin = 24 * 60, maxMin = 0;
    dayTasks.forEach(t => {
      if (t.startTime) {
        const [h, m] = t.startTime.split(':').map(Number);
        minMin = Math.min(minMin, h * 60 + m);
      }
      if (t.endTime) {
        const [h, m] = t.endTime.split(':').map(Number);
        maxMin = Math.max(maxMin, h * 60 + m);
      }
    });

    minMin = Math.floor(minMin / 30) * 30 - 30;
    maxMin = Math.ceil(maxMin / 30) * 30 + 30;

    const slots = [];
    for(let m = minMin; m <= maxMin; m += 30) {
      const hh = String(Math.floor(m / 60)).padStart(2, '0');
      const mm = String(m % 60).padStart(2, '0');
      slots.push(`${hh}:${mm}`);
    }
    return slots;
  }, [tasks]);

  const dates = useMemo(() => {
    const prepTasks = tasks.filter(t => t.taskMode === 'prep');
    const generateDates = (startStr: string, endStr: string): DateItem[] => {
      const generated: DateItem[] = [];
      const start = new Date(startStr);
      const end = new Date(endStr);
      const days = ['日', '月', '火', '水', '木', '金', '土'];
      
      const current = new Date(start);
      let count = 0;
      while (current <= end && count < 730) { 
        const dayOfWeek = current.getDay();
        let color = '';
        if (dayOfWeek === 0) color = 'text-red-500 bg-red-50';
        if (dayOfWeek === 6) color = 'text-blue-500 bg-blue-50';
        
        const y = current.getFullYear();
        const m = String(current.getMonth() + 1).padStart(2, '0');
        
        generated.push({
          date: current.getDate(),
          dateString: formatDate(current),
          day: days[dayOfWeek],
          isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
          color,
          yearMonth: `${y}-${m}`
        });
        
        current.setDate(current.getDate() + 1);
        count++;
      }
      return generated;
    };

    if (prepTasks.length === 0) {
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);
      return generateDates(formatDate(today), formatDate(nextWeek));
    }

    let minDateStr = prepTasks[0].startDate;
    let maxDateStr = prepTasks[0].endDate;

    prepTasks.forEach(t => {
      if (t.startDate < minDateStr) minDateStr = t.startDate;
      if (t.endDate > maxDateStr) maxDateStr = t.endDate;
    });

    const minDateObj = new Date(minDateStr);
    minDateObj.setDate(minDateObj.getDate() - 3);
    const maxDateObj = new Date(maxDateStr);
    maxDateObj.setDate(maxDateObj.getDate() + 5);

    return generateDates(formatDate(minDateObj), formatDate(maxDateObj));
  }, [tasks]);

  const availableYearMonths = useMemo(() => {
    const ymSet = new Set<string>();
    dates.forEach(d => ymSet.add(d.yearMonth));
    return Array.from(ymSet).sort();
  }, [dates]);

  const handleYearMonthChange = (ym: string) => {
    setSelectedYearMonth(ym);
    const targetDate = dates.find(d => d.yearMonth === ym && d.date === 1) || dates.find(d => d.yearMonth === ym);
    if (targetDate && dateRowRefs.current[targetDate.dateString]) {
      dateRowRefs.current[targetDate.dateString]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const stats = useMemo(() => {
    const prepTasks = tasks.filter(t => t.taskMode === 'prep');
    const totalTasks = prepTasks.length;
    const completedTasks = prepTasks.filter(t => t.taskStatus === 'completed').length;
    const progressPercent = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
    const hasUncompleted = totalTasks > completedTasks;

    const todayObj = new Date();
    todayObj.setHours(0, 0, 0, 0);
    
    let maxDateObj = new Date(todayObj);
    if (prepTasks.length > 0) {
      prepTasks.forEach(t => {
        const end = new Date(t.endDate);
        end.setHours(0, 0, 0, 0);
        if (end > maxDateObj) maxDateObj = end;
      });
    }
    
    const diffTime = maxDateObj.getTime() - todayObj.getTime();
    const remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return {
      progressPercent,
      hasUncompleted,
      displayDays: Math.max(0, remainingDays),
    };
  }, [tasks]);

  const handleOpenModal = () => {
    setNewTaskName('');
    setNewTaskGroup(groups.length > 0 ? groups[0].id : '');
    
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    setNewTaskStart(formatDate(today));
    setNewTaskEnd(formatDate(tomorrow));
    setNewTaskDescription('');
    setNewTaskStartTime('10:00');
    setNewTaskEndTime('12:00');
    setNewTaskType('resident');
    setNewTaskAssignees(members.map(m => m.name).slice(0, 3));
    setIsModalOpen(true);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskName.trim() || !newTaskGroup) return;
    
    const actualStart = newTaskStart <= newTaskEnd ? newTaskStart : newTaskEnd;
    const actualEnd = newTaskStart <= newTaskEnd ? newTaskEnd : newTaskStart;

    const newTask: Task = {
      taskId: `task_${Date.now()}`,
      taskMode: taskMode,
      taskName: newTaskName,
      taskStatus: 'active',
      needHelp: false,
      group: newTaskGroup,
      startDate: actualStart,
      endDate: actualEnd,
      description: newTaskDescription,
      taskType: taskMode === 'day' ? newTaskType : undefined,
      startTime: taskMode === 'day' ? newTaskStartTime : undefined,
      endTime: taskMode === 'day' ? newTaskEndTime : undefined,
      currentId: taskMode === 'day' && newTaskType === 'resident' && newTaskAssignees.length > 0 ? newTaskAssignees[0] : undefined,
      color: taskMode === 'day' ? (newTaskType === 'resident' ? 'bg-pink-500' : 'bg-blue-500') : 'bg-blue-500', 
      assignees: newTaskAssignees,
      remind: '締め切り日の2日前',
    };

    setTasks([...tasks, newTask]);
    setIsModalOpen(false);
  };

  const handleDeleteTask = () => {
    if (!selectedTask) return;
    if (window.confirm(`「${selectedTask.taskName}」を削除しますか？`)) {
      setTasks(tasks.filter(t => t.taskId !== selectedTask.taskId));
      setSelectedTask(null);
    }
  };

  const handleDeleteGroup = (groupId: string) => {
    const groupToDelete = groups.find(g => g.id === groupId);
    if (!groupToDelete) return;

    if (window.confirm(`グループ「${groupToDelete.name}」を削除しますか？\nこのグループに含まれるすべてのタスクも一緒に削除されます。`)) {
      setGroups(groups.filter(g => g.id !== groupId));
      setTasks(tasks.filter(t => t.group !== groupId));
      setSelectedGroup(null);
    }
  };

  const updateSelectedTask = (updates: Partial<Task>) => {
    if (!selectedTask) return;
    const updated = { ...selectedTask, ...updates };
    setTasks(prev => prev.map(t => t.taskId === selectedTask.taskId ? updated : t));
    setSelectedTask(updated);
  };

  const handleHandover = (task: Task) => {
    if (!task.assignees || task.assignees.length <= 1) {
      alert('メンバーが複数人登録されている場合に引き継ぎを行えます。\nタスク詳細画面から割り当てを追加してください。');
      return;
    }
    const currentIndex = task.assignees.indexOf(task.currentId || task.assignees[0]);
    const nextIndex = (currentIndex + 1) % task.assignees.length;
    const nextAssignee = task.assignees[nextIndex];

    setTasks(prev => prev.map(t => t.taskId === task.taskId ? { ...t, currentId: nextAssignee } : t));
    if (selectedTask && selectedTask.taskId === task.taskId) {
      setSelectedTask({ ...selectedTask, currentId: nextAssignee });
    }
  };

  return (
    <div className="flex h-screen w-full bg-gray-50 text-gray-800 font-sans overflow-hidden relative">
      
      {/* サイドバー (PC用) */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 z-20 shrink-0 shadow-sm">
        <div className="h-16 flex items-center px-6 border-b border-gray-200 font-extrabold text-2xl text-blue-600 tracking-tight">
          Lean Connect
        </div>
        <nav className="flex-1 py-6 flex flex-col gap-2 px-4">
          {NAV_ITEMS.map(item => {
            const isActive = item.id === currentView;
            return (
              <button 
                key={`pc-nav-${item.id}`}
                onClick={() => setCurrentView(item.id as ViewType)} 
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                  isActive ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.iconPath} />
                </svg>
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 flex flex-col h-full relative overflow-hidden bg-white md:bg-gray-50 md:p-6">
        <div className="flex-1 flex flex-col h-full relative bg-white md:rounded-2xl md:shadow-sm overflow-hidden md:border md:border-gray-200">
          
          {currentView === 'home' ? (
            <HomeView 
              tasks={tasks}
              groups={groups}
              onSelectTask={setSelectedTask}
              onNavigate={(view, mode) => {
                setCurrentView(view);
                if (mode) setTaskMode(mode);
              }}
              displayDays={stats.displayDays}
              progressPercent={stats.progressPercent}
              hasUncompleted={stats.hasUncompleted}
            />
          ) : (
            <>
              {/* プロジェクト内部の共通ヘッダー */}
              <header className="h-16 border-b border-gray-100 px-4 flex items-center justify-between shrink-0 bg-white z-10">
                <div className="flex items-center text-lg font-bold">
                  <button 
                    onClick={() => setCurrentView('home')} 
                    className="mr-3 p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                  </button> 
                  文化祭2026
                </div>

                {currentView === 'gantt' && taskMode === 'prep' && (
                  <div className="flex items-center gap-2">
                    <label htmlFor="yearMonthSelect" className="text-xs font-bold text-gray-500">表示月:</label>
                    <select 
                      id="yearMonthSelect"
                      value={selectedYearMonth}
                      onChange={(e) => handleYearMonthChange(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-1.5 bg-white text-sm font-bold text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      {availableYearMonths.map(ym => {
                        const [y, m] = ym.split('-');
                        return <option key={ym} value={ym}>{y}年 {parseInt(m, 10)}月</option>;
                      })}
                    </select>
                  </div>
                )}
              </header>

              {/* ビューの切り替え */}
              {currentView === 'budget' ? (
                <BudgetView 
                  totalBudget={totalBudget} 
                  setTotalBudget={setTotalBudget}
                  expenses={expenses}
                  setExpenses={setExpenses}
                />
              ) : currentView === 'memo' ? (
                <MemoView memos={memos} setMemos={setMemos} />
              ) : currentView === 'members' ? (
                <MemberView members={members} setMembers={setMembers} tasks={tasks} />
              ) : currentView === 'gantt' ? (
                <>
                  <div className="bg-white border-b border-gray-100 flex justify-between items-center px-4 py-3 gap-3 shrink-0 z-10">
                    <div className="flex bg-gray-100 rounded-lg p-1 w-full sm:w-auto text-sm shadow-inner">
                      <button 
                        onClick={() => setTaskMode('prep')}
                        className={`flex-1 sm:w-32 py-2 flex items-center justify-center gap-2 font-bold transition-all ${
                          taskMode === 'prep' ? 'text-gray-800 bg-white rounded-md shadow-sm' : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        <span className="text-blue-500">📄</span> 準備モード
                      </button>
                      <button 
                        onClick={() => setTaskMode('day')}
                        className={`flex-1 sm:w-32 py-2 flex items-center justify-center gap-2 font-bold transition-all ${
                          taskMode === 'day' ? 'text-gray-800 bg-white rounded-md shadow-sm' : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        <span>🕒</span> 当日モード
                      </button>
                    </div>
                  </div>

                  {taskMode === 'prep' ? (
                    <PrepGanttView 
                      tasks={tasks}
                      groups={groups}
                      dates={dates}
                      onSelectTask={setSelectedTask}
                      onSelectGroup={setSelectedGroup}
                      dateRowRefs={dateRowRefs}
                    />
                  ) : (
                    <DayTimelineView 
                      tasks={tasks}
                      timeSlots={dynamicTimeSlots}
                      onSelectTask={setSelectedTask}
                      onHandover={handleHandover}
                    />
                  )}

                  <div className="absolute bottom-20 md:bottom-8 right-4 md:right-8 z-30">
                    <button 
                      onClick={handleOpenModal}
                      className="bg-blue-600 hover:bg-blue-700 transition-all text-white font-bold p-4 md:py-3 md:px-6 rounded-full shadow-lg flex items-center justify-center gap-2 hover:shadow-xl hover:-translate-y-1"
                    >
                      <span className="hidden md:inline">{taskMode === 'prep' ? '準備タスクを追加' : '当日タスクを追加'}</span>
                      <span className="text-2xl font-light leading-none">＋</span>
                    </button>
                  </div>
                </>
              ) : null}
            </>
          )}
        </div>
      </main>

      {/* ボトムナビゲーション */}
      {currentView !== 'home' && (
        <nav className="md:hidden fixed bottom-0 w-full h-16 bg-white border-t border-gray-200 flex justify-around items-center text-[10px] text-gray-500 z-40 pb-safe">
          {NAV_ITEMS.map(item => {
            const isActive = item.id === currentView;
            return (
              <button 
                key={`mobile-nav-${item.id}`}
                onClick={() => setCurrentView(item.id as ViewType)} 
                className={`flex flex-col items-center transition-colors ${
                  isActive ? 'text-blue-600 font-bold' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.iconPath} />
                </svg>
                <span className={isActive ? "font-bold" : ""}>{item.label}</span>
              </button>
            );
          })}
        </nav>
      )}

      {/* --- グループ詳細・削除モーダル --- */}
      {selectedGroup && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedGroup(null)}
        >
          <div 
            className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden p-6 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-extrabold text-lg text-gray-800">グループ: {selectedGroup.name}</h3>
              <button onClick={() => setSelectedGroup(null)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>

            {(() => {
              const groupTasks = tasks.filter(t => t.group === selectedGroup.id);
              const completedGroupTasks = groupTasks.filter(t => t.taskStatus === 'completed');
              const activeGroupTasks = groupTasks.filter(t => t.taskStatus !== 'completed');
              const gProgress = groupTasks.length === 0 ? 0 : Math.round((completedGroupTasks.length / groupTasks.length) * 100);

              return (
                <div className="flex flex-col gap-4">
                  <div>
                    <span className="text-sm font-bold text-gray-500">進捗度: </span>
                    <span className="bg-blue-100 text-blue-800 font-bold px-3 py-1 rounded-full text-sm">{gProgress}%</span>
                  </div>

                  <div>
                    <p className="text-sm font-bold text-gray-700 mb-1">残っているタスク ({activeGroupTasks.length}件)</p>
                    <div className="bg-gray-50 p-2 rounded-lg border max-h-28 overflow-y-auto text-sm">
                      {activeGroupTasks.length === 0 ? <p className="text-gray-400 text-xs">なし</p> : activeGroupTasks.map(t => <div key={t.taskId} className="py-1">• {t.taskName}</div>)}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-bold text-gray-700 mb-1">完了したタスク ({completedGroupTasks.length}件)</p>
                    <div className="bg-gray-50 p-2 rounded-lg border max-h-28 overflow-y-auto text-sm">
                      {completedGroupTasks.length === 0 ? <p className="text-gray-400 text-xs">なし</p> : completedGroupTasks.map(t => <div key={t.taskId} className="py-1 text-gray-400 line-through">• {t.taskName}</div>)}
                    </div>
                  </div>

                  <div className="pt-4 border-t flex gap-3">
                    <button 
                      onClick={() => setSelectedGroup(null)} 
                      className="flex-1 py-2.5 border rounded-lg font-bold text-gray-700 hover:bg-gray-50"
                    >
                      閉じる
                    </button>
                    <button 
                      onClick={() => handleDeleteGroup(selectedGroup.id)} 
                      className="flex-1 py-2.5 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 shadow-sm"
                    >
                      グループを削除
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* --- 新規タスク追加モーダル --- */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black/50 sm:flex sm:items-center sm:justify-center z-50 p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="w-full bg-white rounded-xl shadow-xl flex flex-col overflow-hidden max-w-sm mx-auto max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            
            <div className="flex justify-between items-center p-4 border-b border-gray-100 shrink-0">
              <h2 className="font-bold text-gray-800 text-lg">
                {taskMode === 'prep' ? '準備タスク追加' : '当日タスク追加'}
              </h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">
                &times;
              </button>
            </div>
            
            <form onSubmit={handleAddTask} className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">タスク項目</label>
                <input 
                  type="text" 
                  required
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="例: 受付対応"
                />
              </div>

              {taskMode === 'day' && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">タスクの種類 (当日)</label>
                  <select 
                    value={newTaskType}
                    onChange={(e) => setNewTaskType(e.target.value as 'resident' | 'individual')}
                    className="w-full border border-gray-300 rounded-md p-2 bg-white font-medium text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="resident">📌 常駐タスク (引き継ぎ管理あり)</option>
                    <option value="individual">⚡ 個別タスク (単発・ステージ運営など)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">タスクの説明</label>
                <textarea 
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                  placeholder="タスクの詳細や手順を入力..."
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">グループに割り当て</label>
                <select 
                  value={newTaskGroup}
                  onChange={(e) => setNewTaskGroup(e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2 bg-white font-medium text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {groups.length === 0 && <option value="">(グループなし)</option>}
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>▼ {g.name}</option>
                  ))}
                </select>
              </div>

              {taskMode === 'prep' ? (
                <div className="flex items-center gap-2 bg-gray-200 rounded-md p-2">
                  <div className="flex items-center gap-1 flex-1">
                    <span className="text-sm font-bold text-gray-600 whitespace-nowrap">開始</span>
                    <input 
                      type="date" 
                      required
                      value={newTaskStart}
                      onChange={(e) => setNewTaskStart(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded p-1 text-sm font-bold outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-1 flex-1">
                    <span className="text-sm font-bold text-gray-600 whitespace-nowrap">終了</span>
                    <input 
                      type="date" 
                      required
                      value={newTaskEnd}
                      onChange={(e) => setNewTaskEnd(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded p-1 text-sm font-bold outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-gray-100 rounded-xl p-3 border border-gray-200 flex flex-col gap-2">
                  <span className="text-xs font-bold text-gray-500 text-center">⏰ アラーム風 時間設定（分単位）</span>
                  <div className="flex items-center justify-center gap-3">
                    <div className="flex flex-col items-center flex-1">
                      <span className="text-[10px] font-bold text-gray-400 mb-1">開始時間</span>
                      <input 
                        type="time" 
                        required
                        value={newTaskStartTime}
                        onChange={(e) => setNewTaskStartTime(e.target.value)}
                        className="w-full bg-white border-2 border-blue-400 rounded-xl py-2 px-2 text-center text-base font-extrabold text-blue-600 outline-none shadow-inner cursor-pointer"
                      />
                    </div>
                    <span className="text-xl font-bold text-gray-400 mt-5">〜</span>
                    <div className="flex flex-col items-center flex-1">
                      <span className="text-[10px] font-bold text-gray-400 mb-1">終了時間</span>
                      <input 
                        type="time" 
                        required
                        value={newTaskEndTime}
                        onChange={(e) => setNewTaskEndTime(e.target.value)}
                        className="w-full bg-white border-2 border-blue-400 rounded-xl py-2 px-2 text-center text-base font-extrabold text-blue-600 outline-none shadow-inner cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-2">
                <button 
                  type="submit"
                  className="w-full bg-blue-600 text-white font-bold py-3 rounded-md shadow-sm hover:bg-blue-700 transition-colors"
                >
                  {taskMode === 'prep' ? '準備タスクを作成' : '当日タスクを作成'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- タスク詳細・編集・削除モーダル --- */}
      {selectedTask && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedTask(null)}
        >
          <div 
            className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden relative max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-gray-800">タスク編集・詳細</h3>
                {selectedTask.taskStatus === 'completed' && (
                  <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-bold border border-green-200">完了済</span>
                )}
              </div>
              <button onClick={() => setSelectedTask(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            
            <div className="p-6 flex flex-col gap-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-bold text-gray-500 mb-1">タスク名</label>
                <input 
                  type="text" 
                  value={selectedTask.taskName}
                  onChange={(e) => updateSelectedTask({ taskName: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2 font-bold text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-500 mb-1">説明</label>
                <textarea 
                  value={selectedTask.description || ''}
                  onChange={(e) => updateSelectedTask({ description: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg p-2.5 text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="説明を入力..."
                  rows={2}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-500 mb-1">担当グループ</label>
                  <select 
                    value={selectedTask.group}
                    onChange={(e) => updateSelectedTask({ group: e.target.value })}
                    className="w-full border border-gray-300 rounded-md p-1.5 bg-white text-sm font-bold text-gray-800"
                  >
                    {groups.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-500 mb-1">
                    {selectedTask.taskMode === 'prep' ? '期間・日付' : '時間設定 (分単位)'}
                  </label>
                  {selectedTask.taskMode === 'prep' ? (
                    <div className="flex flex-col gap-1">
                      <input 
                        type="date" 
                        value={selectedTask.startDate}
                        onChange={(e) => updateSelectedTask({ startDate: e.target.value })}
                        className="w-full border border-gray-300 rounded p-1 text-xs font-bold"
                      />
                      <input 
                        type="date" 
                        value={selectedTask.endDate}
                        onChange={(e) => updateSelectedTask({ endDate: e.target.value })}
                        className="w-full border border-gray-300 rounded p-1 text-xs font-bold"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1">
                      <input 
                        type="time" 
                        value={selectedTask.startTime || '10:00'}
                        onChange={(e) => updateSelectedTask({ startTime: e.target.value })}
                        className="w-full border-2 border-blue-400 rounded-lg py-1 px-1 text-center text-xs font-extrabold text-blue-600 outline-none bg-white"
                      />
                      <input 
                        type="time" 
                        value={selectedTask.endTime || '12:00'}
                        onChange={(e) => updateSelectedTask({ endTime: e.target.value })}
                        className="w-full border-2 border-blue-400 rounded-lg py-1 px-1 text-center text-xs font-extrabold text-blue-600 outline-none bg-white"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-500 mb-1">割り当てメンバー</label>
                <div className="flex flex-wrap gap-2 items-center bg-gray-50 p-2 rounded-lg border border-gray-200 min-h-12">
                  {selectedTask.assignees?.map((name) => {
                    const member = members.find(m => m.name === name);
                    const colorClass = member ? member.color : 'bg-gray-400';
                    return (
                      <span key={name} className={`${colorClass} text-white px-2.5 py-1 rounded-full flex items-center justify-center text-xs font-bold shadow-sm`}>
                        {name}
                        <button 
                          onClick={() => updateSelectedTask({ assignees: selectedTask.assignees?.filter(a => a !== name) })}
                          className="ml-1.5 text-white hover:text-red-200"
                        >&times;</button>
                      </span>
                    );
                  })}
                  <select 
                    onChange={(e) => {
                      if(e.target.value && !selectedTask.assignees?.includes(e.target.value)) {
                        updateSelectedTask({ assignees: [...(selectedTask.assignees || []), e.target.value] });
                      }
                      e.target.value = '';
                    }}
                    className="text-xs border rounded p-1 bg-white"
                  >
                    <option value="">＋追加</option>
                    {members.filter(m => !selectedTask.assignees?.includes(m.name)).map(m => (
                      <option key={m.id} value={m.name}>{m.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedTask.taskMode === 'day' && selectedTask.taskType === 'resident' && (
                <div className="bg-pink-50 p-3 rounded-lg border border-pink-200 flex flex-col gap-2">
                  <p className="text-xs font-bold text-pink-700">📌 常駐タスク引き継ぎ管理</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold">現在の担当: {selectedTask.currentId || '未割当'}</span>
                    <button 
                      type="button"
                      onClick={() => handleHandover(selectedTask)}
                      className="bg-pink-600 text-white text-xs font-bold px-3 py-1.5 rounded shadow-sm hover:bg-pink-700 transition-colors"
                    >
                      次の担当者へ引き継ぎ &gt;
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-2 bg-gray-50 p-4 rounded-lg border border-gray-100 flex flex-col gap-3">
                <p className="text-sm font-bold text-gray-500 mb-1">クイックアクション</p>
                <button 
                  onClick={() => updateSelectedTask({ taskStatus: selectedTask.taskStatus === 'active' ? 'completed' : 'active' })}
                  className={`w-full py-2 rounded-md font-bold text-sm transition-colors flex items-center justify-center gap-2 ${
                    selectedTask.taskStatus === 'completed' 
                      ? 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-100' 
                      : 'bg-green-500 text-white hover:bg-green-600 shadow-sm'
                  }`}
                >
                  {selectedTask.taskStatus === 'completed' ? '「未完了」に戻す' : '✓ タスクを完了にする'}
                </button>
                <button 
                  onClick={() => updateSelectedTask({ needHelp: !selectedTask.needHelp })}
                  className={`w-full py-2 rounded-md font-bold text-sm transition-colors flex items-center justify-center gap-2 border ${
                    selectedTask.needHelp 
                      ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100' 
                      : 'bg-white border-red-300 text-red-500 hover:bg-red-50'
                  }`}
                >
                  {selectedTask.needHelp ? 'ヘルプ要請を取り下げる' : '🆘 ヘルプ(SOS)を要請する'}
                </button>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 flex gap-3 shrink-0">
                <button 
                  onClick={() => setSelectedTask(null)}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  閉じる
                </button>
                <button 
                  onClick={handleDeleteTask}
                  className="flex-1 py-2.5 bg-white border border-red-200 text-red-500 font-bold rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors flex items-center justify-center gap-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  削除する
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}