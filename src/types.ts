export type DateItem = {
  date: number;
  dateString: string;
  day: string;
  isWeekend: boolean;
  color?: string;
  yearMonth: string;
};

export type Group = {
  id: string;
  name: string;
};

export type Task = {
  taskId: string;
  taskMode: 'prep' | 'day';
  taskName: string;
  taskStatus: string;
  needHelp: boolean;
  group: string;
  startDate: string;
  endDate: string;
  description?: string;
  taskType?: 'resident' | 'individual';
  startTime?: string;
  endTime?: string;
  currentId?: string;
  color: string;
  assignees?: string[];
  remind?: string;
};

export type Expense = {
  id: string;
  category: string;
  amount: number;
  color: string;
};

export type Reaction = {
  text: string;
  count: number;
  hasReacted?: boolean;
};

export type Memo = {
  id: string;
  authorName: string;
  authorColor: string;
  content: string;
  reactions: Reaction[];
};

export type Member = {
  id: string;
  name: string;
  color: string;
  isMe?: boolean;
};

export const initialGroups: Group[] = [
  { id: 'g1', name: '企画' },
  { id: 'g2', name: '調理' },
  { id: 'g3', name: '装飾' },
];

export const initialMembers: Member[] = [
  { id: 'm1', name: '自分', color: 'bg-blue-600', isMe: true },
  { id: 'm2', name: '佐藤', color: 'bg-pink-500' },
  { id: 'm3', name: '鈴木', color: 'bg-purple-500' },
  { id: 'm4', name: '花子', color: 'bg-indigo-500' },
  { id: 'm5', name: '田中', color: 'bg-sky-500' },
];

export const initialExpenses: Expense[] = [
  { id: 'e1', category: '景品費', amount: 36000, color: '#ef4444' },
  { id: 'e2', category: '材料費', amount: 11200, color: '#f97316' },
  { id: 'e3', category: '装飾費', amount: 8000, color: '#eab308' },
  { id: 'e4', category: '備品費', amount: 4800, color: '#22c55e' },
  { id: 'e5', category: 'その他', amount: 3200, color: '#3b82f6' },
];

// 初期メモは空白に
export const initialMemos: Memo[] = [];

// メニューの「ホーム」を「チャート (gantt)」に変更
export const NAV_ITEMS = [
  { id: 'gantt', label: 'チャート', iconPath: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
  { id: 'members', label: 'メンバー', iconPath: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
  { id: 'budget', label: '予算管理', iconPath: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  { id: 'memo', label: '共有メモ', iconPath: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2" }
];