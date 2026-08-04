import { useState } from 'react';
import type { User } from './types';

type LoginViewProps = {
  onLogin: (user: User) => void;
};

export default function LoginView({ onLogin }: LoginViewProps) {
  const [name, setName] = useState('');
  const [iconUrl, setIconUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onLogin({
      id: `u_${Date.now()}`,
      name: name.trim(),
      iconUrl: iconUrl.trim() || undefined,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-extrabold text-blue-600 mb-2 text-center tracking-tight">Lean Connect</h1>
        <p className="text-gray-500 text-sm text-center mb-8">イベント運営支援システムへようこそ</p>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">ユーザー名 <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="いまは何を入れてもいいよ"
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">アイコン画像URL (任意)</label>
            <input 
              type="url" 
              value={iconUrl}
              onChange={(e) => setIconUrl(e.target.value)}
              placeholder="https://example.com/icon.png"
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
            />
          </div>
          <button 
            type="submit"
            className="mt-4 bg-blue-600 text-white font-bold py-3.5 rounded-lg shadow-md hover:bg-blue-700 transition-colors"
          >
            ログインして始める
          </button>
        </form>
      </div>
    </div>
  );
}