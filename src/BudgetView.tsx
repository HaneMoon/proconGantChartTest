import { useMemo } from 'react';
import type { Expense } from './types';

type BudgetViewProps = {
  totalBudget: number;
  setTotalBudget: (amount: number) => void;
  expenses: Expense[];
  setExpenses: (expenses: Expense[]) => void;
};

export default function BudgetView({ totalBudget, setTotalBudget, expenses, setExpenses }: BudgetViewProps) {
  
  const totalExpenseAmount = useMemo(() => expenses.reduce((sum, e) => sum + e.amount, 0), [expenses]);
  const balance = totalBudget - totalExpenseAmount;

  // 円グラフのグラデーションとラベル位置を計算
  const pieChartData = useMemo(() => {
    if (totalExpenseAmount === 0) return { background: '#e5e7eb', labels: [] };

    let currentPercent = 0;
    const gradientStops: string[] = [];
    const labels: { id: string; x: number; y: number; text: string }[] = [];

    expenses.forEach((e) => {
      const percent = (e.amount / totalExpenseAmount) * 100;
      if (percent > 0) {
        const start = currentPercent;
        const end = currentPercent + percent;
        gradientStops.push(`${e.color} ${start}% ${end}%`);

        // ラベルの座標計算 (中心角から三角関数で位置を割り出す)
        const middleAngle = (start + percent / 2) * 360 / 100; 
        const rad = (middleAngle - 90) * (Math.PI / 180);
        const radius = 35; // 中心からの距離
        labels.push({
          id: e.id,
          x: 50 + radius * Math.cos(rad),
          y: 50 + radius * Math.sin(rad),
          text: `${Math.round(percent)}%`
        });

        currentPercent = end;
      }
    });

    return {
      background: `conic-gradient(${gradientStops.join(', ')})`,
      labels
    };
  }, [expenses, totalExpenseAmount]);

  const handleEditBudget = () => {
    const val = window.prompt('全体予算を入力してください:', String(totalBudget));
    if (val && !isNaN(Number(val))) {
      setTotalBudget(Number(val));
    }
  };

  const handleAddExpense = () => {
    const category = window.prompt('カテゴリ名を入力してください:');
    if (!category) return;
    const amountStr = window.prompt('金額を入力してください:');
    const amount = Number(amountStr);
    if (!isNaN(amount)) {
      const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'];
      const newExpense: Expense = {
        id: `e_${Date.now()}`,
        category,
        amount,
        color: colors[expenses.length % colors.length]
      };
      setExpenses([...expenses, newExpense]);
    }
  };

  const handleDeleteExpense = (id: string) => {
    if (window.confirm('このカテゴリを削除しますか？')) {
      setExpenses(expenses.filter(e => e.id !== id));
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50 p-4 md:p-6 mb-16 md:mb-0 relative">
      <div className="flex items-center gap-2 mb-4 text-xl font-bold text-gray-800">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        予算管理
      </div>

      <div className="max-w-xl mx-auto flex flex-col gap-6">
        <section>
          <h2 className="font-bold text-gray-800 mb-2">予算</h2>
          <div className="bg-white rounded-xl border border-gray-300 shadow-sm p-4">
            <div className="flex justify-between items-center text-center">
              <div className="flex-1">
                <p className="text-xs font-bold text-gray-800 mb-1">全体予算</p>
                <p className="font-bold text-blue-600"><span className="text-lg">{totalBudget.toLocaleString()}</span> <span className="text-sm text-gray-800">円</span></p>
              </div>
              <div className="w-px h-10 bg-gray-400"></div>
              <div className="flex-1">
                <p className="text-xs font-bold text-gray-800 mb-1">支出額</p>
                <p className="font-bold text-orange-500"><span className="text-lg">{totalExpenseAmount.toLocaleString()}</span> <span className="text-sm text-gray-800">円</span></p>
              </div>
              <div className="w-px h-10 bg-gray-400"></div>
              <div className="flex-1">
                <p className="text-xs font-bold text-gray-800 mb-1">残高</p>
                <p className={`font-bold ${balance < 0 ? 'text-red-500' : 'text-green-500'}`}>
                  <span className="text-lg">{balance.toLocaleString()}</span> <span className="text-sm text-gray-800">円</span>
                </p>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={handleEditBudget} className="bg-blue-600/90 text-white text-xs font-bold px-6 py-1.5 rounded hover:bg-blue-700 transition-colors">編集</button>
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-bold text-gray-800 mb-2">支出カテゴリ</h2>
          <div className="bg-white rounded-xl border border-gray-300 shadow-sm p-4">
            <div className="flex flex-col sm:flex-row items-center gap-8 mb-4">
              
              <div className="relative w-40 h-40 shrink-0 rounded-full shadow-sm" style={{ background: pieChartData.background }}>
                <div className="absolute inset-0 m-auto w-20 h-20 bg-white rounded-full"></div>
                {pieChartData.labels.map(l => (
                  <span 
                    key={l.id} 
                    className="absolute text-[11px] font-extrabold text-white"
                    style={{ left: `${l.x}%`, top: `${l.y}%`, transform: 'translate(-50%, -50%)', textShadow: '0px 0px 3px rgba(0,0,0,0.8)' }}
                  >
                    {l.text}
                  </span>
                ))}
              </div>

              <div className="flex-1 w-full text-sm font-bold text-gray-800 flex flex-col gap-2.5">
                {expenses.length === 0 ? (
                  <p className="text-gray-400 text-center">データがありません</p>
                ) : (
                  expenses.map(e => (
                    <div key={e.id} className="flex justify-between items-center group">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleDeleteExpense(e.id)} className="text-red-300 hover:text-red-500 px-1 hidden group-hover:block">&times;</button>
                        <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: e.color }}></span>
                        {e.category}
                      </div>
                      <span className="font-medium">{e.amount.toLocaleString()}円</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-start items-center mt-8">
              <button onClick={handleAddExpense} className="bg-gray-600 text-white text-xs font-bold px-3 py-1.5 rounded flex items-center gap-1.5 hover:bg-gray-700 transition-colors">
                項目を追加 <span className="text-[10px] font-extrabold leading-none bg-white text-gray-600 rounded-full w-3.5 h-3.5 flex items-center justify-center">＋</span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}