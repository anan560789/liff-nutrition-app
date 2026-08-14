'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Loader2, Users, User } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

export const runtime = 'edge';

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const month = params.month as string;

  const [meals, setMeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMeals = async () => {
      const userId = typeof window !== 'undefined' ? localStorage.getItem('line_user_id') : null;
      
      let query = supabase
        .from('meals')
        .select('*')
        .like('date', `${month}-%`)
        .order('date', { ascending: true });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (data) {
        setMeals(data);
      }
      setLoading(false);
    };
    fetchMeals();
  }, [month]);

  const totalCost = meals.reduce((sum, meal) => sum + (meal.cost || 0), 0);
  const totalCalories = meals.reduce((sum, meal) => sum + (meal.nutrients?.calories || 0), 0);

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto shadow-lg relative pb-10">
      <header className="bg-white p-4 flex items-center shadow-sm sticky top-0 z-10">
        <button 
          onClick={() => router.back()} 
          className="absolute left-4 p-2 text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft />
        </button>
        <h1 className="text-xl font-bold text-gray-800 w-full text-center">
          {month} 月度報表
        </h1>
      </header>

      {loading ? (
        <div className="flex-1 flex justify-center items-center min-h-[50vh]">
          <Loader2 className="animate-spin text-green-600 w-8 h-8" />
        </div>
      ) : (
        <div className="p-4 flex flex-col gap-4">
          {/* 總計數據卡片 */}
          <div className="bg-green-600 text-white p-6 rounded-2xl shadow-md flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-sm opacity-90">本月總花費</span>
              <span className="text-2xl font-bold">${totalCost}</span>
            </div>
            <div className="flex flex-col text-right">
              <span className="text-sm opacity-90">個人攝取熱量</span>
              <span className="text-2xl font-bold">{totalCalories} <span className="text-sm font-normal">大卡</span></span>
            </div>
          </div>

          {/* 紀錄列表 */}
          <h2 className="font-bold text-gray-700 mt-2">詳細紀錄 ({meals.length} 筆)</h2>
          
          <div className="flex flex-col gap-3">
            {meals.length === 0 ? (
              <p className="text-center text-gray-500 py-10">這個月還沒有任何紀錄喔！</p>
            ) : (
              meals.map((meal) => (
                <div key={meal.id} className={`bg-white p-4 rounded-xl shadow-sm flex flex-col gap-2 border-l-4 ${meal.record_type === 'family' ? 'border-blue-500' : 'border-green-500'}`}>
                  
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-800">{meal.date}</span>
                      <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-md">
                        {meal.meal_type === 'breakfast' ? '早餐' : meal.meal_type === 'lunch' ? '午餐' : '晚餐'}
                      </span>
                      
                      {meal.record_type === 'family' ? (
                        <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-md flex items-center gap-1">
                          <Users size={12} /> 全家
                        </span>
                      ) : (
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-md flex items-center gap-1">
                          <User size={12} /> {meal.person_name || '個人'}
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-gray-700">${meal.cost}</span>
                  </div>
                  
                  <p className="text-gray-700 mt-1">{meal.food_text}</p>
                  
                  <div className="bg-gray-50 rounded-lg p-2 mt-2 text-sm text-gray-600">
                    {meal.record_type === 'family' ? (
                      <div className="text-center text-gray-400 italic py-2">
                        — 全家聚餐，專心享受美食不計較熱量 —
                      </div>
                    ) : meal.nutrients ? (
                      <div className="grid grid-cols-4 gap-2 text-center">
                        <div><div className="text-xs text-gray-400">熱量</div><div className="font-semibold text-gray-700">{meal.nutrients.calories}</div></div>
                        <div><div className="text-xs text-gray-400">蛋白</div><div className="font-semibold text-gray-700">{meal.nutrients.protein}g</div></div>
                        <div><div className="text-xs text-gray-400">碳水</div><div className="font-semibold text-gray-700">{meal.nutrients.carbs}g</div></div>
                        <div><div className="text-xs text-gray-400">脂肪</div><div className="font-semibold text-gray-700">{meal.nutrients.fat}g</div></div>
                      </div>
                    ) : (
                      <div className="text-center text-gray-400 italic py-1">無營養素資料</div>
                    )}
                  </div>

                </div>
              ))
            )}
          </div>
        </div>
      )}
    </main>
  );
}