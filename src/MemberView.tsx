import { useState } from 'react';
import type { Member, Task } from './types';

type MemberViewProps = {
  members: Member[];
  setMembers: (members: Member[]) => void;
  tasks: Task[];
};

export default function MemberView({ members, setMembers, tasks }: MemberViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMemberTasks, setSelectedMemberTasks] = useState<{member: Member, tasks: Task[]} | null>(null);

  const handleAddMember = () => {
    const name = window.prompt('招待するメンバーの名前を入力してください:');
    if (!name) return;
    
    const colors = ['bg-pink-500', 'bg-purple-500', 'bg-indigo-500', 'bg-sky-500', 'bg-green-500', 'bg-red-500', 'bg-yellow-500'];
    const newMember: Member = {
      id: `m_${Date.now()}`,
      name,
      color: colors[members.length % colors.length]
    };
    setMembers([...members, newMember]);
  };

  const handleDeleteMember = (id: string, name: string) => {
    if (window.confirm(`${name}さんをメンバーから削除しますか？`)) {
      setMembers(members.filter(m => m.id !== id));
    }
  };

  const showMemberTasks = (member: Member) => {
    const mTasks = tasks.filter(t => t.assignees?.includes(member.name) || t.currentId === member.name);
    setSelectedMemberTasks({ member, tasks: mTasks });
  };

  const filteredMembers = members.filter(m => m.name.includes(searchQuery));

  return (
    <div className="flex-1 overflow-auto bg-gray-50 p-4 md:p-6 mb-16 md:mb-0 relative">
      <div className="flex items-center gap-2 mb-4 text-xl font-bold text-gray-800">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        メンバー
      </div>

      <div className="max-w-md mx-auto flex flex-col gap-6">
        <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg p-1.5 shadow-sm">
          <div className="pl-2 text-gray-400">🔍</div>
          <input 
            type="text" 
            placeholder="名前を検索" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 outline-none text-sm font-medium p-1"
          />
          <button onClick={handleAddMember} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-1.5 rounded transition-colors">
            招待
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {filteredMembers.length === 0 ? (
            <p className="text-gray-400 text-center font-bold mt-4">該当するメンバーがいません</p>
          ) : (
            filteredMembers.map(m => (
              <div key={m.id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className={`${m.color} w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-inner`}>
                    {m.name.charAt(0)}
                  </div>
                  <span className="font-bold text-gray-800 text-lg">
                    {m.name} {m.isMe && <span className="ml-1 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">あなた</span>}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => showMemberTasks(m)}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold px-3 py-2 rounded-lg transition-colors"
                  >
                    担当タスクを表示
                  </button>
                  {!m.isMe && (
                    <button 
                      onClick={() => handleDeleteMember(m.id, m.name)}
                      className="text-gray-300 hover:text-red-500 px-2 transition-colors font-bold text-lg"
                      title="削除"
                    >
                      &times;
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {selectedMemberTasks && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedMemberTasks(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden p-6 flex flex-col gap-4 max-h-[80vh]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className={`${selectedMemberTasks.member.color} w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold`}>
                  {selectedMemberTasks.member.name.charAt(0)}
                </div>
                <h3 className="font-extrabold text-lg text-gray-800">{selectedMemberTasks.member.name} さんのタスク</h3>
              </div>
              <button onClick={() => setSelectedMemberTasks(null)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>

            <div className="overflow-y-auto flex flex-col gap-3">
              {selectedMemberTasks.tasks.length === 0 ? (
                <p className="text-gray-400 text-center font-bold text-sm my-4">担当しているタスクはありません</p>
              ) : (
                selectedMemberTasks.tasks.map(t => (
                  <div key={t.taskId} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-gray-800 text-sm">{t.taskName}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${t.taskStatus === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        {t.taskStatus === 'completed' ? '完了' : '進行中'}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-gray-500">
                      {t.taskMode === 'prep' ? `${t.startDate} 〜 ${t.endDate}` : `当日: ${t.startTime} 〜 ${t.endTime}`}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 shrink-0">
              <button onClick={() => setSelectedMemberTasks(null)} className="w-full py-2.5 border rounded-lg font-bold text-gray-700 hover:bg-gray-50">閉じる</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}