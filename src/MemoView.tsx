import { useState } from 'react';
import type { Memo, User, ConfirmOptions, Reaction } from './types';

type MemoViewProps = {
  activeProjectId: string;
  memos: Memo[];
  setMemos: (memos: Memo[]) => void;
  currentUser: User;
  isReadOnly?: boolean;
  requestConfirm: (options: ConfirmOptions) => void;
};

const STAMP_TEMPLATES = ['👍', '❤️', '🎉', '👀', '🚀', '🙏', '👏', '🔥'];

export default function MemoView({
  activeProjectId,
  memos,
  setMemos,
  currentUser,
  isReadOnly = false,
  requestConfirm
}: MemoViewProps) {
  const [newMemoContent, setNewMemoContent] = useState('');
  const [activePickerMemoId, setActivePickerMemoId] = useState<string | null>(null);

  const handleAddMemo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemoContent.trim()) return;

    const newMemo: Memo = {
      id: `memo_${Date.now()}`,
      projectId: activeProjectId,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorIcon: currentUser.avatarUrl,
      authorColor: currentUser.color || 'bg-blue-600',
      content: newMemoContent.trim(),
      reactions: [],
      createdAt: Date.now()
    };

    setMemos([...memos, newMemo]);
    setNewMemoContent('');
  };

  const handleDeleteMemo = (memoId: string) => {
    if (isReadOnly) return;
    requestConfirm({
      title: 'メモの削除',
      message: 'このメッセージを削除しますか？',
      confirmText: '削除する',
      isDanger: true,
      onConfirm: () => {
        setMemos(memos.filter((m) => m.id !== memoId));
      }
    });
  };

  const handleToggleReaction = (memoId: string, emoji: string) => {
    const updatedMemos = memos.map((memo) => {
      if (memo.id !== memoId) return memo;

      const currentReactions = memo.reactions || [];
      const existingReactionIndex = currentReactions.findIndex((r) => r.text === emoji);

      let nextReactions: Reaction[];

      if (existingReactionIndex > -1) {
        const target = currentReactions[existingReactionIndex];
        const userIds = target.userIds || [];
        const hasReacted = userIds.includes(currentUser.id);

        if (hasReacted) {
          const nextUserIds = userIds.filter((uid) => uid !== currentUser.id);
          if (nextUserIds.length === 0) {
            nextReactions = currentReactions.filter((r) => r.text !== emoji);
          } else {
            nextReactions = currentReactions.map((r, idx) =>
              idx === existingReactionIndex ? { ...r, count: nextUserIds.length, userIds: nextUserIds } : r
            );
          }
        } else {
          const nextUserIds = [...userIds, currentUser.id];
          nextReactions = currentReactions.map((r, idx) =>
            idx === existingReactionIndex ? { ...r, count: nextUserIds.length, userIds: nextUserIds } : r
          );
        }
      } else {
        nextReactions = [...currentReactions, { text: emoji, count: 1, userIds: [currentUser.id] }];
      }

      return { ...memo, reactions: nextReactions };
    });

    setMemos(updatedMemos);
    setActivePickerMemoId(null);
  };

  return (
    <div 
      className="flex-1 flex flex-col h-full bg-gray-100/70 relative font-sans overflow-hidden"
      onClick={() => setActivePickerMemoId(null)}
    >
      <div className="h-14 bg-white border-b border-gray-200 px-6 flex items-center justify-between shrink-0 shadow-xs z-10">
        <div className="flex items-center gap-2 font-black text-gray-800 text-base">
          <span className="text-xl">💬</span>
          <span>共有メモ・チャット</span>
          <span className="text-xs font-bold text-gray-400 ml-1">({memos.length}件)</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-5">
        {memos.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-3xl">
              📝
            </div>
            <p className="font-extrabold text-sm">共有メモはまだありません</p>
            <p className="text-xs text-gray-400">メッセージや注意事項を書き込んで共有しましょう！</p>
          </div>
        ) : (
          memos.map((memo) => {
            const isMe = memo.authorId === currentUser.id;
            const isPickerOpen = activePickerMemoId === memo.id;

            return (
              <div
                key={memo.id}
                className={`flex gap-3 max-w-[85%] sm:max-w-[70%] group relative ${
                  isMe ? 'self-end flex-row-reverse' : 'self-start flex-row'
                }`}
              >
                {/* ユーザーアバター */}
                <div className="shrink-0 pt-0.5">
                  {memo.authorIcon ? (
                    <img
                      src={memo.authorIcon}
                      alt={memo.authorName}
                      className="w-9 h-9 rounded-full border border-gray-200 object-cover shadow-xs"
                    />
                  ) : (
                    <div
                      className={`w-9 h-9 rounded-full ${
                        isMe ? 'bg-blue-600' : 'bg-gray-500'
                      } text-white font-black text-sm flex items-center justify-center shadow-xs`}
                    >
                      {memo.authorName.charAt(0)}
                    </div>
                  )}
                </div>

                <div className={`flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'} relative`}>
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-xs font-extrabold text-gray-600">
                      {isMe ? 'あなた' : memo.authorName}
                    </span>
                    {isMe && !isReadOnly && (
                      <button
                        onClick={() => handleDeleteMemo(memo.id)}
                        className="text-[11px] font-bold text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        title="メッセージを削除"
                      >
                        削除
                      </button>
                    )}
                  </div>

                  <div
                    className={`p-3.5 rounded-2xl shadow-xs text-sm leading-relaxed whitespace-pre-wrap wrap-break-word ${
                      isMe
                        ? 'bg-blue-600 text-white rounded-tr-none font-medium'
                        : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none font-medium'
                    }`}
                  >
                    {memo.content}
                  </div>

                  {/* リアクション表示 ＆ ＋ボタン */}
                  <div className={`flex flex-wrap items-center gap-1.5 mt-0.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                    {memo.reactions?.map((reaction) => {
                      const hasReacted = reaction.userIds?.includes(currentUser.id);
                      return (
                        <button
                          key={reaction.text}
                          onClick={() => handleToggleReaction(memo.id, reaction.text)}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-extrabold border transition-all cursor-pointer ${
                            hasReacted
                              ? 'bg-blue-50 border-blue-400 text-blue-600 shadow-xs'
                              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <span>{reaction.text}</span>
                          <span>{reaction.count}</span>
                        </button>
                      );
                    })}

                    {/* Slack風 スタンプ追加トリガーボタン（初期は薄く表示、ホバーで強調） */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePickerMemoId(isPickerOpen ? null : memo.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-gray-800 rounded-full px-2 py-0.5 text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1"
                      title="リアクションを追加"
                    >
                      <span>😀</span>
                      <span className="text-[10px] leading-none">＋</span>
                    </button>
                  </div>

                  {/* Slack風 絵文字ピッカー（展開時ポップアップ） */}
                  {isPickerOpen && (
                    <div
                      className={`absolute top-full mt-1 z-30 bg-white border border-gray-200 shadow-lg rounded-2xl p-1.5 flex items-center gap-1 animate-in fade-in zoom-in duration-150 ${
                        isMe ? 'right-0' : 'left-0'
                      }`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {STAMP_TEMPLATES.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleToggleReaction(memo.id, emoji)}
                          className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-base transition-transform hover:scale-125 cursor-pointer"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {!isReadOnly && (
        <div className="p-3 md:p-4 bg-white border-t border-gray-200 shrink-0 shadow-sm">
          <form onSubmit={handleAddMemo} className="max-w-4xl mx-auto flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                value={newMemoContent}
                onChange={(e) => setNewMemoContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    handleAddMemo(e);
                  }
                }}
                rows={2}
                placeholder="メッセージを入力... (Ctrl + Enter で送信)"
                className="w-full border border-gray-300 rounded-2xl p-3 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium resize-none bg-gray-50 focus:bg-white transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={!newMemoContent.trim()}
              className="h-11 px-5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-sm rounded-2xl shadow-sm transition-all disabled:opacity-40 cursor-pointer flex items-center justify-center gap-1"
            >
              <span>送信</span>
              <span className="text-base">🚀</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}