import { useState, useEffect } from 'react';
import type { User, Project, Task, Group, Expense, Memo, Member, ConfirmOptions } from './types';
import { initialGroups, initialExpenses, initialMemos, initialMembers } from './types';
import LoginView from './LoginView';
import HomeView from './HomeView';
import ProjectManagerView from './ProjectManagerView';
import ProfileView from './ProfileView';
import { auth, signOut } from './firebase';
import { 
  subscribeUserProjects, 
  subscribeProjectData, 
  saveProject, 
  deleteProjectDoc,
  saveTaskDoc,
  deleteTaskDoc,
  saveGroupDoc,
  deleteGroupDoc,
  saveExpenseDoc,
  deleteExpenseDoc,
  saveMemoDoc,
  deleteMemoDoc
} from './firestoreService';

const STORAGE_KEY_USER = 'lean-connect-user';

type NavViewType = 'gantt' | 'budget' | 'memo' | 'members' | 'retrospective' | 'settings';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_USER);
    return saved ? JSON.parse(saved) : null;
  });

  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeInitialMode, setActiveInitialMode] = useState<'prep' | 'day'>('prep');
  const [currentNav, setCurrentNav] = useState<NavViewType>('gantt');
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const [groups, setGroups] = useState<Group[]>(initialGroups);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [memos, setMemos] = useState<Memo[]>(initialMemos);
  const [members, setMembers] = useState<Member[]>(initialMembers);

  const [confirmState, setConfirmState] = useState<(ConfirmOptions & { isOpen: boolean }) | null>(null);
  const requestConfirm = (options: ConfirmOptions) => setConfirmState({ ...options, isOpen: true });
  const closeConfirm = () => setConfirmState(prev => prev ? { ...prev, isOpen: false } : null);

  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = subscribeUserProjects(currentUser.id, (loadedProjects) => {
      setProjects(loadedProjects);
    });
    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    if (!activeProjectId) return;

    const unsubscribe = subscribeProjectData(activeProjectId, {
      setTasks,
      setGroups,
      setExpenses,
      setMemos,
      setMembers
    });

    return () => {
      unsubscribe();
      setTasks([]);
      setGroups(initialGroups);
      setExpenses(initialExpenses);
      setMemos(initialMemos);
      setMembers(initialMembers);
    };
  }, [activeProjectId]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
  };

  const handleUpdateUser = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updatedUser));
  };

  const handleSetProjects: React.Dispatch<React.SetStateAction<Project[]>> = (valueOrUpdater) => {
    setProjects(prev => {
      const next = typeof valueOrUpdater === 'function' ? valueOrUpdater(prev) : valueOrUpdater;
      const processedNext = next.map(p => {
        if (!p.memberIds || p.memberIds.length === 0) {
          return { ...p, memberIds: currentUser ? [currentUser.id] : [] };
        }
        return p;
      });

      const removed = prev.filter(p => !processedNext.some(np => np.id === p.id));
      removed.forEach(p => deleteProjectDoc(p.id));
      processedNext.forEach(p => saveProject(p));
      return processedNext;
    });
  };

  const handleSetTasks: React.Dispatch<React.SetStateAction<Task[]>> = (valueOrUpdater) => {
    if (!activeProjectId) return;
    setTasks(prev => {
      const next = typeof valueOrUpdater === 'function' ? valueOrUpdater(prev) : valueOrUpdater;
      const removed = prev.filter(t => !next.some(nt => nt.taskId === t.taskId));
      removed.forEach(t => deleteTaskDoc(activeProjectId, t.taskId));
      next.forEach(t => saveTaskDoc(activeProjectId, t));
      return next;
    });
  };

  const handleSetGroups: React.Dispatch<React.SetStateAction<Group[]>> = (valueOrUpdater) => {
    if (!activeProjectId) return;
    setGroups(prev => {
      const next = typeof valueOrUpdater === 'function' ? valueOrUpdater(prev) : valueOrUpdater;
      const removed = prev.filter(g => !next.some(ng => ng.id === g.id));
      removed.forEach(g => deleteGroupDoc(activeProjectId, g.id));
      next.forEach(g => saveGroupDoc(activeProjectId, g));
      return next;
    });
  };

  const handleSetExpenses: React.Dispatch<React.SetStateAction<Expense[]>> = (valueOrUpdater) => {
    if (!activeProjectId) return;
    setExpenses(prev => {
      const next = typeof valueOrUpdater === 'function' ? valueOrUpdater(prev) : valueOrUpdater;
      const removed = prev.filter(e => !next.some(ne => ne.id === e.id));
      removed.forEach(e => deleteExpenseDoc(activeProjectId, e.id));
      next.forEach(e => saveExpenseDoc(activeProjectId, e));
      return next;
    });
  };

  const handleSetMemos: React.Dispatch<React.SetStateAction<Memo[]>> = (valueOrUpdater) => {
    if (!activeProjectId) return;
    setMemos(prev => {
      const next = typeof valueOrUpdater === 'function' ? valueOrUpdater(prev) : valueOrUpdater;
      const removed = prev.filter(m => !next.some(nm => nm.id === m.id));
      removed.forEach(m => deleteMemoDoc(activeProjectId, m.id));
      next.forEach(m => saveMemoDoc(activeProjectId, m));
      return next;
    });
  };

  const activeProject = projects.find(p => p.id === activeProjectId);

  if (!currentUser) return <LoginView onLogin={handleLogin} />;

  return (
    <div className="fixed inset-0 flex flex-col w-screen h-dvh bg-gray-50 text-gray-800 font-sans overflow-hidden">
      
      {/* メイン画面表示領域 */}
      <main className={`flex-1 flex flex-col min-h-0 w-full overflow-hidden bg-white md:bg-gray-50 md:p-6 ${activeProjectId && !isProfileOpen ? 'pb-16 md:pb-0' : ''}`}>
        <div className={`flex-1 flex flex-col h-full w-full min-h-0 relative bg-white ${activeProjectId ? 'md:rounded-2xl md:shadow-sm md:border md:border-gray-200' : ''} overflow-hidden`}>
          
          {isProfileOpen ? (
            <ProfileView
              currentUser={currentUser}
              onUpdateUser={handleUpdateUser}
              onBack={() => setIsProfileOpen(false)}
            />
          ) : !activeProjectId ? (
            <HomeView 
              projects={projects}
              setProjects={handleSetProjects}
              tasks={tasks}
              members={members}
              setMembers={setMembers}
              onSelectProject={(id, view, mode) => {
                setActiveProjectId(id);
                setCurrentNav(view);
                if (mode) setActiveInitialMode(mode);
              }}
              currentUser={currentUser}
              onOpenProfile={() => setIsProfileOpen(true)}
              onLogout={() => {
                requestConfirm({
                  title: 'ログアウト',
                  message: 'ログアウトしてログイン画面に戻りますか？',
                  confirmText: 'ログアウト',
                  isDanger: true,
                  onConfirm: async () => {
                    await signOut(auth);
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
              setProjects={handleSetProjects}
              tasks={tasks}
              setTasks={handleSetTasks}
              groups={groups}
              setGroups={handleSetGroups}
              expenses={expenses}
              setExpenses={handleSetExpenses}
              memos={memos}
              setMemos={handleSetMemos}
              members={members}
              setMembers={setMembers}
              initialMode={activeInitialMode}
              currentNav={currentNav}
              setCurrentNav={setCurrentNav}
              onBackToHome={() => setActiveProjectId(null)}
              onOpenProfile={() => setIsProfileOpen(true)}
              requestConfirm={requestConfirm}
            />
          ) : null}

        </div>
      </main>

      {/* --- スマホ専用：画面最下部に完全に固定されたボトムナビゲーション --- */}
      {activeProjectId && !isProfileOpen && activeProject && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 flex justify-around items-center text-[10px] text-gray-500 z-50 pb-safe shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
          {[
            { id: 'gantt', label: 'チャート', iconPath: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
            { id: 'members', label: 'メンバー', iconPath: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
            { id: 'budget', label: '予算管理', iconPath: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
            { id: 'memo', label: '共有メモ', iconPath: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
            ...(activeProject.status === 'completed' ? [{ id: 'retrospective', label: '振り返り', iconPath: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" }] : [])
          ].map(item => {
            const isActive = currentNav === item.id;
            return (
              <button 
                key={`sp-nav-${item.id}`}
                onClick={() => setCurrentNav(item.id as NavViewType)} 
                className={`flex flex-col items-center justify-center transition-colors flex-1 h-full py-1 cursor-pointer active:bg-gray-100 ${
                  isActive ? 'text-blue-600 font-bold' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.iconPath} />
                </svg>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      )}

      {confirmState && confirmState.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-100 p-4" onClick={closeConfirm}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-6 flex flex-col gap-4 animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
            <h3 className="font-extrabold text-xl text-gray-800">{confirmState.title}</h3>
            <p className="text-gray-600 text-sm whitespace-pre-wrap">{confirmState.message}</p>
            <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
              <button onClick={closeConfirm} className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                {confirmState.cancelText || 'キャンセル'}
              </button>
              <button 
                onClick={() => { confirmState.onConfirm(); closeConfirm(); }} 
                className={`flex-1 py-2.5 text-white font-bold rounded-xl shadow-sm transition-colors cursor-pointer ${confirmState.isDanger ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'}`}
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