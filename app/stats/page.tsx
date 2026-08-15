'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, FileDown, Loader2, List, User, Users, BrainCircuit, Trash2 } from 'lucide-react';

export const runtime = 'edge';

export default function StatsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [meals, setMeals] = useState<any[]>([]);
  const [currentMonthStr, setCurrentMonthStr] = useState('');
  const [filter, setFilter] = useState<'all' | 'personal' | 'family'>('all');
  
  const [advice, setAdvice] = useState('');
  const [loadingAdvice, setLoadingAdvice] = useState(false);

  const monday = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay(); 
    const diffToMonday = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const m = new Date(today.setDate(diffToMonday));
    m.setHours(0, 0, 0, 0);
    return m;
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth() + 1;
      setCurrentMonthStr(`${year}年${month}月`);
      const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;

      // 改用安全的後端 API 拿資料
      const res = await fetch(`/api/getMeals?month=${monthPrefix}`);
      const result = await res.json();

      if (result.success) {
        setMeals(result.data);
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      console.error(err);
      alert('無法載入統計資料，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  // 刪除紀錄的功能
  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm('確定要刪除這筆紀錄嗎？這將無法復原。');
    if (!confirmDelete) return;

    try {
      const res = await fetch('/api/deleteMeal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const result = await res.json();

      if (result.success) {
        alert('紀錄已刪除');
        fetchData(); // 重新載入最新資料
      } else {
        alert('刪除失敗：' + result.error);
      }
    } catch (err) {
      alert('網路錯誤，刪除失敗');
    }
  };

  const filteredMeals = meals.filter(meal => filter === 'all' || meal.record_type === filter);

  let monthTotal = 0;
  let weekTotal = 0;
  let weekNutrition = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };

  filteredMeals.forEach(meal => {
    const cost = meal.cost || 0;
    monthTotal += cost;
    
    const isThisWeek = new Date(meal.date) >= monday;
    if (isThisWeek) weekTotal += cost;

    if (isThisWeek && meal.record_type === 'personal' && meal.nutrients) {
      weekNutrition.calories += meal.nutrients.calories || 0;
      weekNutrition.protein += meal.nutrients.protein || 0;
      weekNutrition.carbs += meal.nutrients.carbs || 0;
      weekNutrition.fat += meal.nutrients.fat || 0;
      weekNutrition.fiber += meal.nutrients.fiber || 0;
    }
  });

  const getAIAdvice = async () => {
    setLoadingAdvice(true);
    setAdvice('');
    try {
      const res = await fetch('/api/getAdvice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nutrition: weekNutrition })
      });
      const data = await res.json();
      if (data.success) {
        setAdvice(data.advice);
      } else {
        alert('取得建議失敗：' + data.error);
      }
    } catch (err) {
      alert('網路異常，無法取得建議');
    } finally {
      setLoadingAdvice(false);
    }
  };

  const handleExportPDF = () => window.print();
  const reportTitle = filter === 'all' ? '總報表' : filter === 'personal' ? '個人報表' : '全家報表';

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto shadow-lg pb-10 print:bg-white print:shadow-none print:max-w-full">
      <header className="bg-white p-4 flex items-center justify-center shadow-sm relative print:hidden">
        <button onClick={() => router.back()} className="absolute left-2 p-2 text-gray-500 hover:bg-gray-100 rounded-lg flex items-center gap-1">
          <ChevronLeft size={24} /> <span className="text-base font-bold">返回</span>
        </button>
        <h1 className="text-xl font-bold text-gray-800">記帳與報表</h1>
      </header>

      <div className="p-4 w-full">
        <div className="flex justify-between items-center mb-4 print:mb-2">
          <h2 className="text-2xl font-bold text-gray-800">{currentMonthStr} {reportTitle}</h2>
          <button onClick={handleExportPDF} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-bold active:scale-95 transition-transform shadow-md print:hidden">
            <FileDown size={20} /> 匯出 PDF
          </button>
        </div>

        <div className="flex bg-gray-200 rounded-xl p-1 mb-6 shadow-inner w-full print:hidden">
          <button onClick={() => setFilter('all')} className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-sm font-bold transition-all ${filter === 'all' ? 'bg-white text-gray-800 shadow-md' : 'text-gray-500'}`}><List size={16} /> 總覽</button>
          <button onClick={() => setFilter('personal')} className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-sm font-bold transition-all ${filter === 'personal' ? 'bg-white text-green-700 shadow-md' : 'text-gray-500'}`}><User size={16} /> 個人</button>
          <button onClick={() => setFilter('family')} className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-sm font-bold transition-all ${filter === 'family' ? 'bg-white text-blue-700 shadow-md' : 'text-gray-500'}`}><Users size={16} /> 全家</button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-green-500" size={40} /></div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center print:border-gray-300">
                <span className="text-sm font-bold text-gray-500 mb-1">本週花費</span>
                <span className="text-3xl font-black text-green-600">${weekTotal}</span>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center print:border-gray-300">
                <span className="text-sm font-bold text-gray-500 mb-1">本月總花費</span>
                <span className="text-3xl font-black text-blue-600">${monthTotal}</span>
              </div>
            </div>

            {(filter === 'all' || filter === 'personal') && (
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6 print:border-gray-300">
                <h3 className="text-lg font-bold text-gray-800 mb-4">本週營養攝取 (個人)</h3>
                <div className="flex flex-col gap-3 mb-5">
                  <div className="flex justify-between text-sm font-bold text-gray-600"><span>🔥 熱量</span><span>{weekNutrition.calories} kcal</span></div>
                  <div className="flex justify-between text-sm font-bold text-blue-600"><span>🥩 蛋白質</span><span>{weekNutrition.protein} g</span></div>
                  <div className="flex justify-between text-sm font-bold text-orange-500"><span>🍚 碳水</span><span>{weekNutrition.carbs} g</span></div>
                  <div className="flex justify-between text-sm font-bold text-yellow-500"><span>🥑 脂肪</span><span>{weekNutrition.fat} g</span></div>
                  <div className="flex justify-between text-sm font-bold text-green-600"><span>🥦 纖維</span><span>{weekNutrition.fiber} g</span></div>
                </div>
                <div className="print:hidden">
                  <button onClick={getAIAdvice} disabled={loadingAdvice} className="w-full bg-indigo-50 text-indigo-700 border border-indigo-200 py-3 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-indigo-100 transition-colors">
                    {loadingAdvice ? <Loader2 className="animate-spin" size={20} /> : <BrainCircuit size={20} />}
                    分析本週營養建議
                  </button>
                  {advice && <div className="mt-4 p-4 bg-indigo-600 text-white rounded-xl text-sm leading-relaxed shadow-inner">{advice}</div>}
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden print:border-gray-300 print:shadow-none">
              <div className="bg-gray-800 text-white p-3 font-bold flex justify-between print:bg-gray-200 print:text-black">
                <span>日期與餐別</span>
                <span>金額</span>
              </div>
              <div className="divide-y divide-gray-100 print:divide-gray-300">
                {filteredMeals.length === 0 ? (
                  <div className="p-6 text-center text-gray-400 font-bold">無紀錄</div>
                ) : (
                  filteredMeals.map((meal) => (
                    <div key={meal.id} className="p-4 flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-gray-800">{meal.date}</span>
                          <span className="text-sm font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                            {meal.meal_type === 'breakfast' ? '早餐' : meal.meal_type === 'lunch' ? '午餐' : '晚餐'}
                          </span>
                          {filter === 'all' && (
                            <span className={`text-xs font-bold px-2 py-0.5 rounded text-white print:border print:text-black ${meal.record_type === 'personal' ? 'bg-green-500 print:border-green-500' : 'bg-blue-500 print:border-blue-500'}`}>
                              {meal.record_type === 'personal' ? '個人專屬' : '全家紀錄'}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-lg text-gray-800">${meal.cost || 0}</span>
                          {/* 刪除按鈕，列印時自動隱藏 */}
                          <button 
                            onClick={() => handleDelete(meal.id)}
                            className="text-red-400 hover:text-red-600 p-1 rounded-md hover:bg-red-50 transition-colors print:hidden"
                            title="刪除此紀錄"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>

                      </div>
                      <div className="text-gray-600 text-sm">
                        {meal.record_type === 'personal' && <span className="font-bold">{meal.person_name}: </span>}
                        {meal.food_text}
                        {meal.notes && <div className="text-gray-400 text-xs mt-1">備註: {meal.notes}</div>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }`}} />
    </main>
  );
}