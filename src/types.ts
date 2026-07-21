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

export const initialGroups: Group[] = [
  { id: 'g1', name: '企画' },
  { id: 'g2', name: '調理' },
  { id: 'g3', name: '装飾' },
];

export const mockMembers = ['佐藤', '鈴木', '花子', '田中', '高橋'];

export const timeSlots = ['10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00'];

export const NAV_ITEMS = [
  { id: 'home', label: 'ホーム', iconPath: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { id: 'members', label: 'メンバー', iconPath: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
  { id: 'budget', label: '予算管理', iconPath: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  { id: 'memo', label: '共有メモ', iconPath: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2" }
];