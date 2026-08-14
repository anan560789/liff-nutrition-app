'use client';

import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

export const runtime = 'edge';

export default function DailyMealsPage() {
  const params = useParams();
  const router = useRouter();
  const date = params.date as string;

  const meals = [
    { id: 'breakfast', name: '早餐' },
    { id: 'lunch', name: '午餐' },
    { id: 'dinner', name: '晚餐' }
  ];

  return (
    <main className="min-h-screen bg-gray-50 block w-full max-w-md mx-auto shadow-lg">
      <header className="bg-white p-4 flex items-center justify-center shadow-sm relative w-full">
        {/* 加入「返回」文字，用來確認有沒有更新成功 */}
        <button onClick={() => router.back()} className="absolute left-2 p-2 text-gray-500 hover:bg-gray-100 rounded-lg flex items-center gap-1">
          <ChevronLeft size={24} /> <span className="text-base font-bold">返回</span>
        </button>
        <h1 className="text-xl font-bold text-gray-800">{date}</h1>
      </header>
      
      {/* 強制 px-4 左右留白，並讓按鈕 w-full 撐滿 */}
      <div className="px-4 py-8 flex flex-col gap-6 w-full">
        {meals.map((meal) => (
          <button
            key={meal.id}
            onClick={() => router.push(`/date/${date}/${meal.id}`)}
            className="w-full bg-white p-6 rounded-2xl shadow-md text-2xl font-bold text-gray-700 active:scale-95 transition-transform flex justify-between items-center border border-gray-100"
          >
            <span>{meal.name}</span>
            <span className="text-lg font-normal text-green-600 bg-green-50 px-5 py-2 rounded-full">
              去紀錄 ➔
            </span>
          </button>
        ))}
      </div>
    </main>
  );
}