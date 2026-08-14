'use client';

import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Coffee, Sun, Moon } from 'lucide-react';
import Link from 'next/link';

export const runtime = 'edge';

export default function DailyView() {
  const params = useParams();
  const router = useRouter();
  
  // 取得網址上的日期參數
  const date = params.date as string;

  // 定義三餐的卡片樣式與資料
  const meals = [
    { id: 'breakfast', name: '早餐', icon: Coffee, color: 'text-amber-600', bg: 'bg-amber-50' },
    { id: 'lunch', name: '午餐', icon: Sun, color: 'text-orange-500', bg: 'bg-orange-50' },
    { id: 'dinner', name: '晚餐', icon: Moon, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ];

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto shadow-lg relative">
      {/* 頂部導覽列 */}
      <header className="bg-white p-4 flex items-center shadow-sm relative">
        <button 
          onClick={() => router.push('/')} 
          className="absolute left-4 p-2 text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft />
        </button>
        <h1 className="text-xl font-bold text-gray-800 w-full text-center">
          {date}
        </h1>
      </header>

      {/* 三餐選擇區塊 */}
      <div className="p-4 flex-1 flex flex-col gap-4 mt-4">
        {meals.map((meal) => {
          const Icon = meal.icon;
          return (
            <Link
              key={meal.id}
              href={`/date/${date}/${meal.id}`}
              className="bg-white p-6 rounded-2xl shadow-sm flex items-center justify-between active:scale-95 transition-transform"
            >
              <div className="flex items-center gap-4">
                <div className={`p-4 rounded-full ${meal.bg}${meal.color}`}>
                  <Icon size={28} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">{meal.name}</h2>
                  <p className="text-sm text-gray-400 mt-1">點擊紀錄內容與花費</p>
                </div>
              </div>
              <div className="text-gray-300">
                <ChevronLeft className="rotate-180" />
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}