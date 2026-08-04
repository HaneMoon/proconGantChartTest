import { useState } from 'react';
import type { Project, Task, User, Member, ConfirmOptions } from './types';

type HomeViewProps = {
  projects: Project[];
  setProjects: (projects: Project[]) => void;
  tasks: Task[];
  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  onSelectProject: (id: string, view: 'gantt' | 'retrospective', mode?: 'prep' | 'day') => void;
  currentUser: User | null;
  onLogout: () => void;
  requestConfirm: (options: ConfirmOptions) => void;
};

export default function HomeView({ projects, setProjects, tasks, members, setMembers, onSelectProject, currentUser, onLogout, requestConfirm }: HomeViewProps) {
  
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectMembers, setNewProjectMembers] = useState<string>('佐藤, 鈴木, 花子');

  const submitCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    
    const projectId = `p_${Date.now()}`;
    const newProject: Project = {
      id: projectId,
      name: newProjectName.trim(),
      status: 'active',
      budget: 50000,
      createdAt: Date.now()
    };

    const memberNames = newProjectMembers.split(',').map(m => m.trim()).filter(Boolean);
    const colors = ['bg-pink-500', 'bg-purple-500', 'bg-indigo-500', 'bg-sky-500', 'bg-green-500', 'bg-red-500', 'bg-yellow-500'];
    
    const createdMembers: Member[] = [
      { id: `m_${Date.now()}_me`, projectId, name: currentUser?.name || '自分', color: 'bg-blue-600', isMe: true },
      ...memberNames.map((name, idx) => ({
        id: `m_${Date.now()}_${idx}`,
        projectId,
        name,
        color: colors[idx % colors.length]
      }))
    ];

    setProjects([...projects, newProject]);
    setMembers([...members, ...createdMembers]);
    setNewProjectName('');
    setIsCreating(false);
  };

  const handleDeleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    requestConfirm({
      title: 'プロジェクトの削除',
      message: 'このプロジェクトを削除しますか？\nタスクや予算などすべてのデータが失われます。',
      confirmText: '削除する',
      isDanger: true,
      onConfirm: () => setProjects(projects.filter(p => p.id !== id))
    });
  };

  const handleCompleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    requestConfirm({
      title: 'プロジェクトの完了',
      message: 'プロジェクトを完了にして振り返りを生成しますか？',
      confirmText: '完了にする',
      onConfirm: () => setProjects(projects.map(p => p.id === id ? { ...p, status: 'completed' } : p))
    });
  };

  const handleRevertProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    requestConfirm({
      title: 'プロジェクトの再開',
      message: 'このプロジェクトを完了状態から進行中に戻しますか？',
      confirmText: '再開する',
      onConfirm: () => setProjects(projects.map(p => p.id === id ? { ...p, status: 'active' } : p))
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 relative overflow-hidden">
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 shadow-sm z-20">
        <div className="font-extrabold text-2xl text-blue-600 tracking-tight">Lean Connect</div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold hidden sm:inline">{currentUser?.name ?? 'ゲスト'}</span>
          {currentUser?.iconUrl ? (
            <img src={currentUser.iconUrl} alt="icon" className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
              {currentUser?.name?.charAt(0) ?? '?'}
            </div>
          )}
          <button onClick={onLogout} className="md:hidden text-xs text-gray-500 ml-2">ログアウト</button>
        </div>
      </header>

      <div className={`flex-1 overflow-auto flex flex-col items-center pb-24 p-4 md:p-6 transition-all duration-300 ${isCreating ? 'lg:mr-96' : ''}`}>
        <div className="w-full max-w-2xl flex flex-col gap-8">
          
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">プロジェクト一覧</h2>
            <button onClick={() => setIsCreating(true)} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-full shadow-sm hover:bg-blue-700 transition-colors flex items-center gap-2">
              新規作成 <span className="text-lg leading-none">＋</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {projects.length === 0 ? (
              <div className="col-span-full text-center py-10 text-gray-400 font-bold bg-white border border-dashed rounded-xl">
                プロジェクトがありません。<br/>右上のボタンから作成してください。
              </div>
            ) : projects.map(p => {
              const projectTasks = tasks.filter(t => t.projectId === p.id);
              const prepTasks = projectTasks.filter(t => t.taskMode === 'prep');
              const completedTasks = prepTasks.filter(t => t.taskStatus === 'completed').length;
              const progress = prepTasks.length === 0 ? 0 : Math.round((completedTasks / prepTasks.length) * 100);

              if (p.status === 'completed') {
                return (
                  <div key={p.id} className="bg-gray-100 rounded-xl border border-gray-200 p-5 shadow-sm opacity-90 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg text-gray-700">{p.name}</h3>
                        <button onClick={(e) => handleDeleteProject(p.id, e)} className="text-gray-400 hover:text-red-500 transition-colors">🗑</button>
                      </div>
                      <span className="text-xs font-bold text-green-600 bg-green-100 px-2.5 py-1 rounded-full">✅ 完了済</span>
                    </div>
                    <div className="mt-5 flex gap-2 flex-col">
                      <button onClick={() => onSelectProject(p.id, 'gantt')} className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-blue-700 shadow-sm transition-colors flex items-center justify-center gap-1.5">
                        <span>📝</span> 振り返りページを見る[cite: 23]
                      </button>
                      <button onClick={(e) => handleRevertProject(p.id, e)} className="w-full bg-white border border-blue-300 text-blue-600 py-2 rounded-lg text-sm font-bold hover:bg-blue-50">
                        🔄 再開する
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div key={p.id} onClick={() => onSelectProject(p.id, 'gantt', 'prep')} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 cursor-pointer hover:shadow-md transition-shadow flex flex-col justify-between group">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg text-gray-800">{p.name}</h3>
                      <button onClick={(e) => handleDeleteProject(p.id, e)} className="text-gray-300 hover:text-red-500 md:opacity-0 group-hover:opacity-100 transition-opacity">🗑</button>
                    </div>
                    <div className="bg-blue-50 text-blue-800 text-xs font-bold px-3 py-1 rounded-full w-max mb-3">
                      準備進捗 {progress}%
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button onClick={(e) => { e.stopPropagation(); onSelectProject(p.id, 'gantt', 'prep'); }} className="flex-1 bg-blue-50 text-blue-700 py-2 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors">
                      📄 準備モード
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onSelectProject(p.id, 'gantt', 'day'); }} className="flex-1 bg-pink-50 text-pink-700 py-2 rounded-lg text-xs font-bold hover:bg-pink-100 transition-colors">
                      🕒 当日モード
                    </button>
                  </div>
                  <div className="mt-2">
                    <button onClick={(e) => handleCompleteProject(p.id, e)} className="w-full border border-green-300 text-green-600 py-2 rounded-lg text-xs font-bold hover:bg-green-50">
                      イベント完了にする
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {isCreating && (
        <div className="absolute inset-0 bg-black/20 z-40 lg:hidden" onClick={() => setIsCreating(false)} />
      )}

      <div className={`absolute top-0 right-0 h-full w-full lg:w-96 bg-white shadow-2xl border-l border-gray-200 transform transition-transform duration-300 z-50 flex flex-col ${isCreating ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50 shrink-0">
          <h3 className="font-extrabold text-lg text-gray-800">新規プロジェクト</h3>
          <button onClick={() => setIsCreating(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          <form onSubmit={submitCreateProject} className="flex flex-col gap-5 h-full">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">プロジェクト名</label>
              <input 
                type="text" 
                required 
                value={newProjectName} 
                onChange={e => setNewProjectName(e.target.value)} 
                className="w-full border border-gray-300 rounded-md p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" 
                placeholder="例: 文化祭2026" 
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">メンバー招待 (カンマ区切り)</label>
              <textarea 
                value={newProjectMembers} 
                onChange={e => setNewProjectMembers(e.target.value)} 
                className="w-full border border-gray-300 rounded-md p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" 
                rows={3}
                placeholder="佐藤, 鈴木, 花子" 
              />
              <p className="text-[11px] text-gray-400 mt-1">※ あなたのほかに招待するメンバーの名前をカンマ区切りで入力してください。</p>
            </div>
            <div className="mt-auto pt-4">
              <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl shadow-sm hover:bg-blue-700 transition-colors">
                作成する
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}