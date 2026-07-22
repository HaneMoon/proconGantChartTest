import { useState } from 'react';
import type { Memo } from './types';

type MemoViewProps = {
  memos: Memo[];
  setMemos: (memos: Memo[]) => void;
};

export default function MemoView({ memos, setMemos }: MemoViewProps) {
  const [newMemoText, setNewMemoText] = useState('');

  const handleAddMemo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemoText.trim()) return;
    
    const newMemo: Memo = {
      id: `memo_${Date.now()}`,
      authorName: '自分',
      authorColor: 'bg-blue-500',
      content: newMemoText,
      reactions: []
    };
    
    setMemos([...memos, newMemo]);
    setNewMemoText('');
  };

  const handleAddReaction = (memoId: string) => {
    const emoji = window.prompt('リアクションを入力してください (例: 👍, 偉業, 草):');
    if (!emoji) return;

    setMemos(memos.map(m => {
      if (m.id === memoId) {
        const existing = m.reactions.find(r => r.text === emoji);
        if (existing) {
          return {
            ...m,
            reactions: m.reactions.map(r => r.text === emoji ? { ...r, count: r.count + 1 } : r)
          };
        } else {
          return { ...m, reactions: [...m.reactions, { text: emoji, count: 1 }] };
        }
      }
      return m;
    }));
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 relative pb-16 md:pb-0">
      <div className="flex items-center gap-2 p-4 md:p-6 pb-2 text-xl font-bold text-gray-800 shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        共有メモ
      </div>

      <div className="flex-1 overflow-auto p-4 md:px-6 flex flex-col gap-6">
        {memos.map(m => (
          <div key={m.id} className="flex gap-3">
            <div className={`${m.authorColor} w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm`}>
              {m.authorName.charAt(0)}
            </div>
            <div className="flex flex-col items-start max-w-[85%]">
              <div className="bg-white border border-gray-300 rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm text-sm font-medium text-gray-800 leading-relaxed">
                {m.content}
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {m.reactions.map((r, i) => (
                  <span key={i} className="bg-white border border-gray-300 rounded-full px-3 py-1 text-xs font-bold text-gray-700 shadow-sm flex items-center gap-1">
                    {r.text} <span className="text-gray-400">{r.count}</span>
                  </span>
                ))}
                <button 
                  onClick={() => handleAddReaction(m.id)}
                  className="bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-500 rounded-full px-3 py-1 text-xs font-bold shadow-sm transition-colors"
                >
                  ＋
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-white border-t border-gray-200 shrink-0 mb-16 md:mb-0">
        <form onSubmit={handleAddMemo} className="flex gap-2">
          <input 
            type="text" 
            value={newMemoText}
            onChange={(e) => setNewMemoText(e.target.value)}
            placeholder="共有したいことを書く..."
            className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" className="bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold hover:bg-blue-700 shadow-sm">
            送信
          </button>
        </form>
      </div>
    </div>
  );
}