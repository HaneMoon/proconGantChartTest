import { useState, useRef, useMemo } from 'react';
import type { User, Project, Task, Group, Expense, Memo, Member, ConfirmOptions, DateItem } from './types';
import { NAV_ITEMS } from './types';
import PrepGanttView from './PrepGanttView';
import DayTimelineView from './DayTimelineView';
import BudgetView from './BudgetView';
import MemoView from './MemoView';
import MemberView from './MemberView';
import RetrospectiveView from './RetrospectiveView';

type ProjectManagerViewProps = {
  project: Project;
  currentUser: User;
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  groups: Group[];
  setGroups: React.Dispatch<React.SetStateAction<Group[]>>;
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  memos: Memo[];
  setMemos: React.Dispatch<React.SetStateAction<Memo[]>>;
  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  initialMode?: 'prep' | 'day';
  initialView?: 'gantt' | 'retrospective';
  onBackToHome: () => void;
  requestConfirm: (options: ConfirmOptions) => void;
};

type ViewType = 'gantt' | 'budget' | 'memo' | 'members' | 'retrospective';

export default function ProjectManagerView({
  project,
  currentUser,
  setProjects,
  tasks = [],
  setTasks,
  groups = [],
  setGroups,
  expenses = [],
  setExpenses,
  memos = [],
  setMemos,
  members = [],
  setMembers,
  initialMode = 'prep',
  initialView = 'gantt',
  onBackToHome,
  requestConfirm,
}: ProjectManagerViewProps) {
  const [currentView, setCurrentView] = useState<ViewType>(initialView);
  const [taskMode, setTaskMode] = useState<'prep' | 'day'>(initialMode);

  const isReadOnly = project.status === 'completed';

  const activeTasks = useMemo(() => (tasks || []).filter(t => t.projectId === project.id), [tasks, project.id]);
  const activeGroups = useMemo(() => (groups || []).filter(g => g.projectId === project.id), [groups, project.id]);
  const activeExpenses = useMemo(() => (expenses || []).filter(e => e.projectId === project.id), [expenses, project.id]);
  const activeMemos = useMemo(() => (memos || []).filter(m => m.projectId === project.id), [memos, project.id]);
  const activeMembers = useMemo(() => (members || []).filter(m => m.projectId === project.id), [members, project.id]);

  const [sidePanelOpen, setSidePanelOpen] = useState<'task' | 'group' | 'addGroup' | null>(null);
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

  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');

  const [selectedYearMonth, setSelectedYearMonth] = useState('2026-06');
  const dateRowRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const formatDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const dynamicTimeSlots = useMemo(() => {
    const dayTasks = activeTasks.filter(t => t.taskMode === 'day');
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
  }, [activeTasks]);

  const dates = useMemo(() => {
    const prepTasks = activeTasks.filter(t => t.taskMode === 'prep');
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
        generated.push({ date: current.getDate(), dateString: formatDate(current), day: days[dayOfWeek], isWeekend: dayOfWeek === 0 || dayOfWeek === 6, color, yearMonth: `${y}-${m}` });
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
  }, [activeTasks]);

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

  const handleOpenNewTaskPanel = () => {
    if (isReadOnly) return;
    setSelectedTask(null);
    setNewTaskName('');
    setNewTaskGroup('');
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    setNewTaskStart(formatDate(today));
    setNewTaskEnd(formatDate(tomorrow));
    setNewTaskDescription('');
    setNewTaskStartTime('10:00');
    setNewTaskEndTime('12:00');
    setNewTaskType('resident');
    setNewTaskAssignees([]);
    setSidePanelOpen('task');
  };

  const handleOpenAddGroupPanel = () => {
    if (isReadOnly) return;
    setNewGroupName('');
    setNewGroupDescription('');
    setSidePanelOpen('addGroup');
  };

  const handleSelectTask = (task: Task) => {
    setSelectedTask(task);
    setSidePanelOpen('task');
  };

  const handleSelectGroup = (group: Group) => {
    setSelectedGroup(group);
    setSidePanelOpen('group');
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly || !newTaskName.trim()) return;
    const actualStart = newTaskStart <= newTaskEnd ? newTaskStart : newTaskEnd;
    const actualEnd = newTaskStart <= newTaskEnd ? newTaskEnd : newTaskStart;
    const newTask: Task = {
      taskId: `task_${Date.now()}`,
      projectId: project.id,
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
    setTasks(prev => [...(prev || []), newTask]);
    setSidePanelOpen(null);
  };

  const submitAddGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly || !newGroupName.trim()) return;
    const newGroupId = `g_${Date.now()}`;
    setGroups(prev => [...(prev || []), { id: newGroupId, projectId: project.id, name: newGroupName.trim(), description: newGroupDescription }]);
    setSidePanelOpen(null);
  };

  const handleDeleteTask = () => {
    if (isReadOnly || !selectedTask) return;
    requestConfirm({
      title: 'タスクの削除',
      message: `「${selectedTask.taskName}」を削除しますか？`,
      confirmText: '削除する',
      isDanger: true,
      onConfirm: () => {
        setTasks(prev => (prev || []).filter(t => t.taskId !== selectedTask.taskId));
        setSidePanelOpen(null);
        setSelectedTask(null);
      }
    });
  };

  const handleDeleteGroup = (groupId: string) => {
    if (isReadOnly) return;
    const groupToDelete = activeGroups.find(g => g.id === groupId);
    if (!groupToDelete) return;
    requestConfirm({
      title: 'グループの削除',
      message: `グループ「${groupToDelete.name}」を削除しますか？\n含まれるタスクも一緒に削除されます。`,
      confirmText: '削除する',
      isDanger: true,
      onConfirm: () => {
        setGroups(prev => (prev || []).filter(g => g.id !== groupId));
        setTasks(prev => (prev || []).filter(t => t.group !== groupId));
        setSidePanelOpen(null);
        setSelectedGroup(null);
      }
    });
  };

  const updateSelectedTask = (updates: Partial<Task>) => {
    if (isReadOnly || !selectedTask) return;
    const updated = { ...selectedTask, ...updates };
    setTasks(prev => (prev || []).map(t => t.taskId === selectedTask.taskId ? updated : t));
    setSelectedTask(updated);
  };

  const handleHandover = (task: Task) => {
    if (isReadOnly) return;
    if (!task.assignees || task.assignees.length <= 1) {
      alert('メンバーが複数人登録されている場合に引き継ぎを行えます。');
      return;
    }
    const currentIndex = task.assignees.indexOf(task.currentId || task.assignees[0]);
    const nextIndex = (currentIndex + 1) % task.assignees.length;
    const nextAssignee = task.assignees[nextIndex];
    setTasks(prev => (prev || []).map(t => t.taskId === task.taskId ? { ...t, currentId: nextAssignee } : t));
    if (selectedTask && selectedTask.taskId === task.taskId) {
      setSelectedTask({ ...selectedTask, currentId: nextAssignee });
    }
  };

  return (
    <div className="flex flex-col h-full w-full relative overflow-hidden bg-white">
      <header className="h-16 border-b border-gray-100 px-6 flex items-center justify-between shrink-0 bg-white z-20">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              if (sidePanelOpen) {
                setSidePanelOpen(null);
              } else {
                onBackToHome();
              }
            }} 
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
          </button> 
          <span className="text-xl font-extrabold text-gray-800">{project.name}</span>
          {project.status === 'completed' && <span className="text-xs bg-green-100 text-green-700 font-bold px-2.5 py-0.5 rounded-full">✅ 振り返りモード (閲覧専用)</span>}
        </div>

        {currentView === 'gantt' && taskMode === 'prep' && (
          <div className="flex items-center gap-2">
            <label htmlFor="yearMonthSelect" className="text-xs font-bold text-gray-500 hidden sm:inline">表示月:</label>
            <select id="yearMonthSelect" value={selectedYearMonth} onChange={(e) => handleYearMonthChange(e.target.value)} className="border border-gray-300 rounded-lg px-2 py-1.5 bg-white text-sm font-bold text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
              {availableYearMonths.map(ym => {
                const [y, m] = ym.split('-');
                return <option key={ym} value={ym}>{y}年 {parseInt(m, 10)}月</option>;
              })}
            </select>
          </div>
        )}
      </header>

      <div className="flex-1 flex flex-row relative overflow-hidden min-w-0 w-full">
        
        <nav className="hidden md:flex flex-col w-64 bg-gray-50 border-r border-gray-200 p-4 shrink-0 gap-2">
          <div className="text-xs font-bold text-gray-400 px-3 mb-1 uppercase tracking-wider">メニュー</div>
          {NAV_ITEMS.map(item => {
            const isActive = item.id === currentView;
            return (
              <button
                key={`left-nav-${item.id}`}
                onClick={() => setCurrentView(item.id as ViewType)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${isActive ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-200/60'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.iconPath} /></svg>
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className={`relative flex-1 flex flex-col min-w-0 h-full overflow-hidden transition-all duration-300 ${sidePanelOpen ? 'lg:mr-96' : ''}`}>
          {currentView === 'budget' ? (
            <BudgetView 
              activeProjectId={project.id} 
              totalBudget={project.budget} 
              setTotalBudget={(amount) => {
                setProjects(prev => (prev || []).map(p => p.id === project.id ? { ...p, budget: amount } : p));
              }} 
              expenses={activeExpenses} 
              setExpenses={(newExp) => setExpenses(prev => [...(prev || []).filter(e => e.projectId !== project.id), ...newExp])} 
              isReadOnly={isReadOnly}
              requestConfirm={requestConfirm} 
            />
          ) : currentView === 'memo' ? (
            <MemoView 
              activeProjectId={project.id} 
              currentUser={currentUser} 
              memos={activeMemos} 
              setMemos={(newMem) => setMemos(prev => [...(prev || []).filter(m => m.projectId !== project.id), ...newMem])} 
              requestConfirm={requestConfirm} 
            />
          ) : currentView === 'members' ? (
            <MemberView 
              activeProjectId={project.id} 
              groups={activeGroups} 
              members={activeMembers} 
              setMembers={(newMem) => setMembers(prev => [...(prev || []).filter(m => m.projectId !== project.id), ...newMem])} 
              tasks={activeTasks} 
              isReadOnly={isReadOnly}
              requestConfirm={requestConfirm} 
            />
          ) : currentView === 'retrospective' ? (
            <RetrospectiveView project={project} tasks={activeTasks} expenses={activeExpenses} members={activeMembers} onBack={() => setCurrentView('gantt')} />
          ) : currentView === 'gantt' ? (
            <>
              <div className="bg-white border-b border-gray-100 flex justify-between items-center px-4 py-3 gap-3 shrink-0 z-10">
                <div className="flex bg-gray-100 rounded-lg p-1 w-full sm:w-auto text-sm shadow-inner">
                  <button onClick={() => setTaskMode('prep')} className={`flex-1 sm:w-32 py-2 flex items-center justify-center gap-2 font-bold transition-all ${taskMode === 'prep' ? 'text-gray-800 bg-white rounded-md shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><span className="text-blue-500">📄</span> 準備</button>
                  <button onClick={() => setTaskMode('day')} className={`flex-1 sm:w-32 py-2 flex items-center justify-center gap-2 font-bold transition-all ${taskMode === 'day' ? 'text-gray-800 bg-white rounded-md shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><span>🕒</span> 当日</button>
                </div>
              </div>

              {taskMode === 'prep' ? (
                <PrepGanttView tasks={activeTasks} groups={activeGroups} dates={dates} onSelectTask={handleSelectTask} onSelectGroup={handleSelectGroup} onAddGroup={handleOpenAddGroupPanel} dateRowRefs={dateRowRefs} />
              ) : (
                <DayTimelineView tasks={activeTasks} timeSlots={dynamicTimeSlots} onSelectTask={handleSelectTask} onHandover={handleHandover} />
              )}

              {!isReadOnly && (
                <div className="absolute bottom-20 md:bottom-8 right-4 md:right-8 z-40">
                  <button onClick={handleOpenNewTaskPanel} className="bg-blue-600 hover:bg-blue-700 transition-all text-white font-bold p-4 md:py-3 md:px-6 rounded-full shadow-lg flex items-center justify-center gap-2 hover:shadow-xl hover:-translate-y-1">
                    <span className="hidden md:inline">{taskMode === 'prep' ? '準備タスクを追加' : '当日タスクを追加'}</span>
                    <span className="text-2xl font-light leading-none">＋</span>
                  </button>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* --- 専用サイドパネル UI --- */}
        {sidePanelOpen && (
          <div className="absolute inset-0 bg-black/20 z-40 lg:hidden" onClick={() => setSidePanelOpen(null)} />
        )}

        {sidePanelOpen && (
          <div className={`absolute top-0 right-0 h-full w-full lg:w-96 bg-white shadow-2xl border-l border-gray-200 transform transition-transform duration-300 z-50 flex flex-col ${sidePanelOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50 shrink-0">
              <h3 className="font-extrabold text-lg text-gray-800">
                {sidePanelOpen === 'group' ? 'グループ詳細' : 
                 sidePanelOpen === 'addGroup' ? '新規グループ追加' : 
                 selectedTask ? 'タスク編集・詳細' : (taskMode === 'prep' ? '準備タスク追加' : '当日タスク追加')}
              </h3>
              <div className="flex items-center gap-3">
                {selectedTask && selectedTask.taskStatus === 'completed' && (
                  <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-bold border border-green-200">完了済</span>
                )}
                <button onClick={() => setSidePanelOpen(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 pb-24 flex flex-col gap-6">
              
              {/* --- 新規グループ追加フォーム --- */}
              {sidePanelOpen === 'addGroup' && !isReadOnly && (
                <form onSubmit={submitAddGroup} className="flex flex-col gap-5 h-full">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">グループ名</label>
                    <input type="text" required value={newGroupName} onChange={e => setNewGroupName(e.target.value)} className="w-full border border-gray-300 rounded-md p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="例: 企画" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">説明 (任意)</label>
                    <textarea value={newGroupDescription} onChange={e => setNewGroupDescription(e.target.value)} className="w-full border border-gray-300 rounded-md p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" rows={4} placeholder="このグループの役割やメモを入力..." />
                  </div>
                  <div className="mt-auto pt-4">
                    <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl shadow-sm hover:bg-blue-700 transition-colors">作成する</button>
                  </div>
                </form>
              )}

              {/* --- グループ詳細パネル --- */}
              {sidePanelOpen === 'group' && selectedGroup && (
                <>
                  <div>
                    <label className="block text-sm font-bold text-gray-500 mb-1">グループ名</label>
                    <div className="font-bold text-lg text-gray-800">{selectedGroup.name}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-500 mb-1">説明</label>
                    <textarea 
                      value={selectedGroup.description || '（説明はありません）'}
                      disabled={isReadOnly}
                      onChange={(e) => {
                        if (isReadOnly) return;
                        const newDesc = e.target.value;
                        setSelectedGroup({ ...selectedGroup, description: newDesc });
                        setGroups((groups || []).map(g => g.id === selectedGroup.id ? { ...g, description: newDesc } : g));
                      }}
                      className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
                      rows={4}
                    />
                  </div>
                  {(() => {
                    const groupTasks = activeTasks.filter(t => t.taskMode === 'prep' && (t.group || '') === selectedGroup.id);
                    const completedTasks = groupTasks.filter(t => t.taskStatus === 'completed');
                    const gProgress = groupTasks.length === 0 ? 0 : Math.round((completedTasks.length / groupTasks.length) * 100);
                    return (
                      <div>
                        <span className="text-sm font-bold text-gray-500">準備進捗: </span>
                        <span className="bg-blue-100 text-blue-800 font-bold px-3 py-1 rounded-full text-sm">{gProgress}%</span>
                      </div>
                    );
                  })()}
                  {!isReadOnly && (
                    <div className="mt-auto pt-4 flex gap-3">
                      <button onClick={() => handleDeleteGroup(selectedGroup.id)} className="w-full py-3 bg-red-50 text-red-600 border border-red-200 rounded-lg font-bold hover:bg-red-100 transition-colors">
                        このグループを削除する
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* --- 新規タスク追加フォーム --- */}
              {sidePanelOpen === 'task' && !selectedTask && !isReadOnly && (
                <form id="add-task-form" onSubmit={handleAddTask} className="flex flex-col gap-5 h-full">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">タスク名</label>
                    <input type="text" required value={newTaskName} onChange={e => setNewTaskName(e.target.value)} className="w-full border border-gray-300 rounded-md p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="例: 受付対応" />
                  </div>
                  {taskMode === 'day' && (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">当日タスクの種類</label>
                      <select value={newTaskType} onChange={e => setNewTaskType(e.target.value as 'resident'|'individual')} className="w-full border border-gray-300 rounded-md p-2.5 outline-none bg-white font-bold">
                        <option value="resident">📌 常駐タスク (ローテーション・引き継ぎあり)</option>
                        <option value="individual">⚡ 個別タスク (単発・ピンポイント)</option>
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">関連グループ (任意)</label>
                    <select value={newTaskGroup} onChange={e => setNewTaskGroup(e.target.value)} className="w-full border border-gray-300 rounded-md p-2.5 outline-none bg-white">
                      <option value="">(未設定)</option>
                      {activeGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                  </div>
                  {taskMode === 'prep' ? (
                    <div className="flex flex-col gap-2">
                      <label className="block text-sm font-bold text-gray-700">期間</label>
                      <div className="flex items-center gap-2">
                        <input type="date" required value={newTaskStart} onChange={e => setNewTaskStart(e.target.value)} className="w-full text-sm border border-gray-300 p-2 rounded-md outline-none focus:ring-2 focus:ring-blue-500" />
                        <span className="text-gray-400 font-bold">〜</span>
                        <input type="date" required value={newTaskEnd} onChange={e => setNewTaskEnd(e.target.value)} className="w-full text-sm border border-gray-300 p-2 rounded-md outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <label className="block text-sm font-bold text-gray-700">時間設定</label>
                      <div className="flex items-center gap-2">
                        <input type="time" required value={newTaskStartTime} onChange={e => setNewTaskStartTime(e.target.value)} className="w-full text-sm border border-gray-300 p-2 rounded-md outline-none focus:ring-2 focus:ring-blue-500" />
                        <span className="text-gray-400 font-bold">〜</span>
                        <input type="time" required value={newTaskEndTime} onChange={e => setNewTaskEndTime(e.target.value)} className="w-full text-sm border border-gray-300 p-2 rounded-md outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">割り当てメンバー</label>
                    <div className="flex flex-wrap gap-2 items-center bg-gray-50 p-3 rounded-lg border border-gray-200 min-h-12">
                      {newTaskAssignees.map(name => {
                        const member = activeMembers.find(m => m.name === name);
                        const colorClass = member ? member.color : 'bg-blue-600';
                        return (
                          <span key={name} className={`${colorClass} text-white px-3 py-1 rounded-full flex items-center gap-1.5 text-xs font-bold shadow-sm`}>
                            {name}
                            <button 
                              type="button" 
                              onClick={() => setNewTaskAssignees(newTaskAssignees.filter(n => n !== name))} 
                              className="text-white hover:text-red-200 font-bold"
                            >
                              &times;
                            </button>
                          </span>
                        );
                      })}
                      {activeMembers.filter(m => !newTaskAssignees.includes(m.name)).length > 0 ? (
                        <select
                          value=""
                          onChange={(e) => {
                            if (e.target.value) {
                              setNewTaskAssignees([...newTaskAssignees, e.target.value]);
                            }
                          }}
                          className="border border-gray-300 rounded-lg px-3 py-1.5 bg-white text-xs font-bold text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        >
                          <option value="" disabled>+ 追加</option>
                          {activeMembers.filter(m => !newTaskAssignees.includes(m.name)).map(m => (
                            <option key={m.id} value={m.name}>{m.name}</option>
                          ))}
                        </select>
                      ) : (
                        newTaskAssignees.length === 0 && <span className="text-xs text-gray-400">メンバーがいません（「メンバー」タブから追加してください）</span>
                      )}
                    </div>
                  </div>
                  <div className="mt-auto pt-4">
                    <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl shadow-sm hover:bg-blue-700 transition-colors">作成する</button>
                  </div>
                </form>
              )}

              {/* --- 既存タスク編集（または閲覧）パネル --- */}
              {sidePanelOpen === 'task' && selectedTask && (
                <>
                  <div>
                    <label className="block text-sm font-bold text-gray-500 mb-1">タスク名</label>
                    <input type="text" disabled={isReadOnly} value={selectedTask.taskName} onChange={(e) => updateSelectedTask({ taskName: e.target.value })} className="w-full border border-gray-300 rounded-lg p-2.5 font-bold text-gray-800 bg-gray-50 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-500 mb-1">説明</label>
                    <textarea value={selectedTask.description || '（説明はありません）'} disabled={isReadOnly} onChange={(e) => updateSelectedTask({ description: e.target.value })} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm bg-gray-50 focus:outline-none" rows={3} />
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-500 mb-1">関連グループ</label>
                      <select value={selectedTask.group || ''} disabled={isReadOnly} onChange={(e) => updateSelectedTask({ group: e.target.value })} className="w-full border border-gray-300 rounded-md p-2 bg-gray-50 text-sm font-bold text-gray-800 outline-none">
                        <option value="">(未設定)</option>
                        {activeGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-500 mb-1">{selectedTask.taskMode === 'prep' ? '期間・日付' : '時間設定 (分単位)'}</label>
                      {selectedTask.taskMode === 'prep' ? (
                        <div className="flex items-center gap-2">
                          <input type="date" disabled={isReadOnly} value={selectedTask.startDate} onChange={(e) => updateSelectedTask({ startDate: e.target.value })} className="w-full border border-gray-300 rounded p-2 text-sm font-bold bg-gray-50 outline-none" />
                          <span className="text-gray-400 font-bold">〜</span>
                          <input type="date" disabled={isReadOnly} value={selectedTask.endDate} onChange={(e) => updateSelectedTask({ endDate: e.target.value })} className="w-full border border-gray-300 rounded p-2 text-sm font-bold bg-gray-50 outline-none" />
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <input type="time" disabled={isReadOnly} value={selectedTask.startTime || '10:00'} onChange={(e) => updateSelectedTask({ startTime: e.target.value })} className="w-full border-2 border-blue-400 rounded-lg p-2 text-center text-sm font-extrabold text-blue-600 bg-gray-50 outline-none" />
                          <span className="text-gray-400 font-bold">〜</span>
                          <input type="time" disabled={isReadOnly} value={selectedTask.endTime || '12:00'} onChange={(e) => updateSelectedTask({ endTime: e.target.value })} className="w-full border-2 border-blue-400 rounded-lg p-2 text-center text-sm font-extrabold text-blue-600 bg-gray-50 outline-none" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-500 mb-2">割り当てメンバー</label>
                    <div className="flex flex-wrap gap-2 items-center bg-gray-50 p-3 rounded-lg border border-gray-200 min-h-12">
                      {selectedTask.assignees?.map((name) => {
                        const member = activeMembers.find(m => m.name === name);
                        const colorClass = member ? member.color : 'bg-blue-600';
                        return (
                          <span key={name} className={`${colorClass} text-white px-3 py-1 rounded-full flex items-center gap-1.5 text-xs font-bold shadow-sm`}>
                            {name}
                            {!isReadOnly && (
                              <button 
                                type="button"
                                onClick={() => updateSelectedTask({ assignees: selectedTask.assignees?.filter(a => a !== name) })} 
                                className="text-white hover:text-red-200 font-bold"
                              >
                                &times;
                              </button>
                            )}
                          </span>
                        );
                      })}
                      {!isReadOnly && activeMembers.filter(m => !selectedTask.assignees?.includes(m.name)).length > 0 ? (
                        <select
                          value=""
                          onChange={(e) => {
                            if (e.target.value) {
                              const current = selectedTask.assignees || [];
                              updateSelectedTask({ assignees: [...current, e.target.value] });
                            }
                          }}
                          className="border border-gray-300 rounded-lg px-3 py-1.5 bg-white text-xs font-bold text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        >
                          <option value="" disabled>+ 追加</option>
                          {activeMembers.filter(m => !selectedTask.assignees?.includes(m.name)).map(m => (
                            <option key={m.id} value={m.name}>{m.name}</option>
                          ))}
                        </select>
                      ) : (
                        selectedTask.assignees?.length === 0 && <span className="text-xs text-gray-400">割り当てなし</span>
                      )}
                    </div>
                  </div>

                  {!isReadOnly && (
                    <>
                      <div className="mt-4 flex flex-col gap-3 pt-4 border-t border-gray-100">
                        <p className="text-sm font-bold text-gray-500">クイックアクション</p>
                        <button onClick={() => updateSelectedTask({ taskStatus: selectedTask.taskStatus === 'active' ? 'completed' : 'active' })} className={`w-full py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 ${selectedTask.taskStatus === 'completed' ? 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-100' : 'bg-green-500 text-white hover:bg-green-600 shadow-sm'}`}>
                          {selectedTask.taskStatus === 'completed' ? '「未完了」に戻す' : '✓ タスクを完了にする'}
                        </button>
                        <button onClick={() => updateSelectedTask({ needHelp: !selectedTask.needHelp })} className={`w-full py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 border ${selectedTask.needHelp ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100' : 'bg-white border-red-300 text-red-500 hover:bg-red-50'}`}>
                          {selectedTask.needHelp ? 'ヘルプ要請を取り下げる' : '🆘 ヘルプ(SOS)を要請する'}
                        </button>
                      </div>

                      <div className="mt-6 pt-4 flex gap-3">
                        <button onClick={handleDeleteTask} className="w-full py-3 bg-white border border-red-200 text-red-500 font-bold rounded-xl hover:bg-red-50 transition-colors flex items-center justify-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          削除する
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <nav className="md:hidden shrink-0 w-full h-16 bg-white border-t border-gray-200 flex justify-around items-center text-[10px] text-gray-500 z-50 pb-safe">
        {NAV_ITEMS.map(item => {
          const isActive = item.id === currentView;
          return (
            <button 
              key={`mobile-nav-${item.id}`}
              onClick={() => setCurrentView(item.id as ViewType)} 
              className={`flex flex-col items-center transition-colors ${isActive ? 'text-blue-600 font-bold' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.iconPath} /></svg>
              <span className={isActive ? "font-bold" : ""}>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}