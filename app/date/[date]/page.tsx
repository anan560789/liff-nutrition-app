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
    <main className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto shadow-lg">
      <header className="bg-white p-4 flex items-center justify-center shadow-sm relative">
        <button onClick={() => router.back()} className="absolute left-4 p-2 text-gray-500 hover:bg-gray-100 rounded-full">
          <ChevronLeft size={26} />
        </button>
        <h1 className="text-lg font-bold text-gray-800">{date}</h1>
      </header>
      
      {/* 這裡強制使用 w-full 讓按鈕撐滿左右寬度，並加大內距 p-6 */}
      <div className="p-5 flex flex-col gap-4 mt-4 w-full">
        {meals.map((meal) => (
          <button
            key={meal.id}
            onClick={() => router.push(`/date/${date}/${meal.id}`)}
            className="w-full bg-white p-6 rounded-2xl shadow-sm text-xl font-bold text-gray-700 active:scale-95 transition-transform flex justify-between items-center border border-gray-100"
          >
            <span>{meal.name}</span>
            <span className="text-sm font-normal text-green-600 bg-green-50 px-4 py-2 rounded-full">
              去紀錄 ➔
            </span>
          </button>
        ))}
      </div>
    </main>
  );
}