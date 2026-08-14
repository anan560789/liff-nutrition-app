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
    <main className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto shadow-lg relative">
      <header className="bg-white p-4 flex items-center shadow-sm relative">
        <button
          onClick={() => router.back()}
          className="absolute left-4 p-2 text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft />
        </button>
        <h1 className="text-xl font-bold text-gray-800 w-full text-center">
          {date}
        </h1>
      </header>
      
      <div className="p-4 flex flex-col gap-4 mt-4">
        {meals.map((meal) => (
          <button
            key={meal.id}
            onClick={() => router.push(`/date/${date}/${meal.id}`)}
            className="bg-white p-6 rounded-2xl shadow-sm text-lg font-bold text-gray-700 active:scale-95 transition-transform flex justify-between items-center hover:bg-green-50"
          >
            <span>{meal.name}</span>
            <span className="text-sm font-normal text-green-600">去紀錄 ➔</span>
          </button>
        ))}
      </div>
    </main>
  );
}