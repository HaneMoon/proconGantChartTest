import { useState, useEffect } from 'react';
import type { User, Project, Task, Group, Expense, Memo, Member, ConfirmOptions } from './types';
import { initialGroups, initialExpenses, initialMemos, initialMembers } from './types';
import LoginView from './LoginView';
import HomeView from './HomeView';
import ProjectManagerView from './ProjectManagerView';

const STORAGE_KEY_USER = 'lean-connect-user';
const STORAGE_KEY_PROJECTS = 'lean-connect-projects';
const STORAGE_KEY_TASKS = 'lean-connect-tasks-v9';
const STORAGE_KEY_GROUPS = 'lean-connect-groups-v5';
const STORAGE_KEY_EXPENSES = 'lean-connect-expenses-v3';
const STORAGE_KEY_MEMOS = 'lean-connect-memos-v3';
const STORAGE_KEY_MEMBERS = 'lean-connect-members-v3';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_USER);
    return saved ? JSON.parse(saved) : null;
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PROJECTS);
    return saved ? JSON.parse(saved) : [];
  });
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeInitialMode, setActiveInitialMode] = useState<'prep' | 'day'>('prep');
  const [activeInitialView, setActiveInitialView] = useState<'gantt' | 'retrospective'>('gantt');

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

  const [confirmState, setConfirmState] = useState<(ConfirmOptions & { isOpen: boolean }) | null>(null);
  const requestConfirm = (options: ConfirmOptions) => setConfirmState({ ...options, isOpen: true });
  const closeConfirm = () => setConfirmState(prev => prev ? { ...prev, isOpen: false } : null);

  useEffect(() => { if (currentUser) localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(currentUser)); }, [currentUser]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(projects)); }, [projects]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY_GROUPS, JSON.stringify(groups)); }, [groups]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY_EXPENSES, JSON.stringify(expenses)); }, [expenses]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY_MEMOS, JSON.stringify(memos)); }, [memos]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY_MEMBERS, JSON.stringify(members)); }, [members]);

  const handleLogin = (user: User) => setCurrentUser(user);

  const activeProject = projects.find(p => p.id === activeProjectId);

  if (!currentUser) return <LoginView onLogin={handleLogin} />;

  return (
    <div className="flex h-screen w-full bg-gray-50 text-gray-800 font-sans overflow-hidden relative">
      <main className="flex-1 flex flex-col h-full relative overflow-hidden bg-white md:bg-gray-50 md:p-6">
        <div className={`flex-1 flex flex-col h-full relative bg-white ${activeProjectId ? 'md:rounded-2xl md:shadow-sm md:border md:border-gray-200' : ''} overflow-hidden`}>
          
          {!activeProjectId ? (
            <HomeView 
              projects={projects}
              setProjects={setProjects}
              tasks={tasks}
              members={members}
              setMembers={setMembers}
              onSelectProject={(id, view, mode) => {
                setActiveProjectId(id);
                setActiveInitialView(view);
                if (mode) setActiveInitialMode(mode);
              }}
              currentUser={currentUser}
              onLogout={() => {
                requestConfirm({
                  title: 'ログアウト',
                  message: 'ログアウトしてログイン画面に戻りますか？',
                  confirmText: 'ログアウト',
                  isDanger: true,
                  onConfirm: () => {
                    setCurrentUser(null);
                    localStorage.removeItem(STORAGE_KEY_USER);
                  }
                });
              }}
              requestConfirm={requestConfirm}
            />
          ) : activeProject ? (
            <ProjectManagerView 
              project={activeProject}
              currentUser={currentUser}
              projects={projects}
              setProjects={setProjects}
              tasks={tasks}
              setTasks={setTasks}
              groups={groups}
              setGroups={setGroups}
              expenses={expenses}
              setExpenses={setExpenses}
              memos={memos}
              setMemos={setMemos}
              members={members}
              setMembers={setMembers}
              initialMode={activeInitialMode}
              initialView={activeInitialView}
              onBackToHome={() => setActiveProjectId(null)}
              requestConfirm={requestConfirm}
            />
          ) : null}

        </div>
      </main>

      {confirmState && confirmState.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-100 p-4" onClick={closeConfirm}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-6 flex flex-col gap-4 animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
            <h3 className="font-extrabold text-xl text-gray-800">{confirmState.title}</h3>
            <p className="text-gray-600 text-sm whitespace-pre-wrap">{confirmState.message}</p>
            <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
              <button onClick={closeConfirm} className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors">
                {confirmState.cancelText || 'キャンセル'}
              </button>
              <button 
                onClick={() => { confirmState.onConfirm(); closeConfirm(); }} 
                className={`flex-1 py-2.5 text-white font-bold rounded-xl shadow-sm transition-colors ${confirmState.isDanger ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {confirmState.confirmText || 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}