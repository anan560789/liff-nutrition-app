'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, FileDown, Loader2, List, User, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export const runtime = 'edge';

export default function StatsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [meals, setMeals] = useState<any[]>([]);
  const [currentMonthStr, setCurrentMonthStr] = useState('');
  
  // 新增：目前選擇的過濾模式 (預設為全部)
  const [filter, setFilter] = useState<'all' | 'personal' | 'family'>('all');

  // 計算本週一的基準日 (用來判斷哪些花費屬於本週)
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
    try {
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth() + 1;
      setCurrentMonthStr(`${year}年${month}月`);
      const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;

      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .like('date', `${monthPrefix}%`)
        .order('date', { ascending: false });

      if (error) throw error;
      if (data) setMeals(data);
    } catch (err) {
      console.error('獲取資料失敗', err);
      alert('無法載入統計資料');
    } finally {
      setLoading(false);
    }
  };

  // 即時過濾資料
  const filteredMeals = meals.filter(meal => filter === 'all' || meal.record_type === filter);

  // 根據過濾後的資料，即時計算本週與本月花費
  let monthTotal = 0;
  let weekTotal = 0;
  filteredMeals.forEach(meal => {
    const cost = meal.cost || 0;
    monthTotal += cost;
    if (new Date(meal.date) >= monday) {
      weekTotal += cost;
    }
  });

  const handleExportPDF = () => {
    window.print();
  };

  // 根據過濾模式產生報表標題
  const reportTitle = filter === 'all' ? '總報表' : filter === 'personal' ? '個人報表' : '全家報表';

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto shadow-lg pb-10 print:bg-white print:shadow-none print:max-w-full">
      
      {/* 頂部 Header - 列印時隱藏 */}
      <header className="bg-white p-4 flex items-center justify-center shadow-sm relative print:hidden">
        <button onClick={() => router.back()} className="absolute left-2 p-2 text-gray-500 hover:bg-gray-100 rounded-lg flex items-center gap-1">
          <ChevronLeft size={24} /> <span className="text-base font-bold">返回</span>
        </button>
        <h1 className="text-xl font-bold text-gray-800">記帳與報表</h1>
      </header>

      <div className="p-4 w-full">
        
        {/* 標題與匯出按鈕 */}
        <div className="flex justify-between items-center mb-4 print:mb-2">
          <h2 className="text-2xl font-bold text-gray-800">{currentMonthStr} {reportTitle}</h2>
          <button 
            onClick={handleExportPDF}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-bold active:scale-95 transition-transform shadow-md print:hidden"
          >
            <FileDown size={20} /> 匯出 PDF
          </button>
        </div>

        {/* 分類切換標籤頁 (Tabs) - 列印時隱藏 */}
        <div className="flex bg-gray-200 rounded-xl p-1 mb-6 shadow-inner w-full print:hidden">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-sm font-bold transition-all ${
              filter === 'all' ? 'bg-white text-gray-800 shadow-md' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <List size={16} /> 總覽
          </button>
          <button
            onClick={() => setFilter('personal')}
            className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-sm font-bold transition-all ${
              filter === 'personal' ? 'bg-white text-green-700 shadow-md' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <User size={16} /> 個人
          </button>
          <button
            onClick={() => setFilter('family')}
            className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-sm font-bold transition-all ${
              filter === 'family' ? 'bg-white text-blue-700 shadow-md' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users size={16} /> 全家
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin text-green-500" size={40} />
          </div>
        ) : (
          <>
            {/* 動態記帳花費統計卡片 */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center print:border-gray-300">
                <span className="text-sm font-bold text-gray-500 mb-1">本週花費</span>
                <span className="text-3xl font-black text-green-600">${weekTotal}</span>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center print:border-gray-300">
                <span className="text-sm font-bold text-gray-500 mb-1">本月總花費</span>
                <span className="text-3xl font-black text-blue-600">${monthTotal}</span>
              </div>
            </div>

            {/* 過濾後的紀錄列表 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden print:border-gray-300 print:shadow-none">
              <div className="bg-gray-800 text-white p-3 font-bold flex justify-between print:bg-gray-200 print:text-black">
                <span>日期與餐別</span>
                <span>金額</span>
              </div>
              <div className="divide-y divide-gray-100 print:divide-gray-300">
                {filteredMeals.length === 0 ? (
                  <div className="p-6 text-center text-gray-400 font-bold">
                    {filter === 'personal' ? '尚無個人紀錄' : filter === 'family' ? '尚無全家紀錄' : '本月尚無任何紀錄'}
                  </div>
                ) : (
                  filteredMeals.map((meal) => (
                    <div key={meal.id} className="p-4 flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-gray-800">{meal.date}</span>
                          <span className="text-sm font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                            {meal.meal_type === 'breakfast' ? '早餐' : meal.meal_type === 'lunch' ? '午餐' : '晚餐'}
                          </span>
                          {/* 只有在「總覽」模式才需要顯示標籤來區分，獨立模式下不用顯示 */}
                          {filter === 'all' && (
                            <span className={`text-xs font-bold px-2 py-0.5 rounded text-white print:border print:text-black ${meal.record_type === 'personal' ? 'bg-green-500 print:border-green-500' : 'bg-blue-500 print:border-blue-500'}`}>
                              {meal.record_type === 'personal' ? '個人專屬' : '全家紀錄'}
                            </span>
                          )}
                        </div>
                        <span className="font-bold text-lg text-gray-800">${meal.cost || 0}</span>
                      </div>
                      <div className="text-gray-600 text-sm">
                        <span className="font-bold">{meal.person_name}</span>: {meal.food_text}
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
      
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}} />
    </main>
  );
}