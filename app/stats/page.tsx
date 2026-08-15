'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
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

  const reportRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // ✅ 新增：用來儲存 PDF 網址，並控制「下載完成視窗」的顯示
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

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

      const res = await fetch(`/api/getMeals?month=${monthPrefix}`);
      const result = await res.json();
      if (result.success) setMeals(result.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('確定要刪除這筆紀錄嗎？這將無法復原。')) return;
    try {
      const res = await fetch('/api/deleteMeal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const result = await res.json();
      if (result.success) fetchData();
    } catch (err) {
      alert('刪除失敗');
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
      if (data.success) setAdvice(data.advice);
    } catch (err) {
      alert('網路異常，無法取得建議');
    } finally {
      setLoadingAdvice(false);
    }
  };

  const reportTitle = filter === 'all' ? '總覽' : filter === 'personal' ? '個人報表' : '全家報表';

  // ✅ 改寫：產生 PDF 後不直接存檔，而是打開下載視窗
  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setIsDownloading(true);

    try {
      const htmlToImage = await import('html-to-image');
      const { jsPDF } = await import('jspdf');

      const dataUrl = await htmlToImage.toPng(reportRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#f9fafb'
      });

      const img = new window.Image();
      img.src = dataUrl;
      await new Promise((resolve) => { img.onload = resolve; });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (img.height * pdfWidth) / img.width;

      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      const pdfBlob = pdf.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      
      // 將產生好的網址存起來，畫面會自動彈出下載視窗
      setPdfUrl(url);

    } catch (error) {
      console.error('PDF 產生失敗:', error);
      alert('產生 PDF 失敗，請再試一次。');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col w-full pb-10">
      <header className="bg-white p-4 flex items-center justify-center shadow-sm relative w-full print:hidden">
        <button onClick={() => router.back()} className="absolute left-2 p-2 text-gray-500 hover:bg-gray-100 rounded-lg flex items-center gap-1">
          <ChevronLeft size={32} /> <span className="text-xl font-bold">返回</span>
        </button>
        <h1 className="text-2xl font-bold text-gray-800">記帳與報表</h1>
      </header>

      <div className="p-4 w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h2 className="text-3xl font-black text-gray-800">{currentMonthStr} {reportTitle}</h2>
          <button 
            onClick={handleExportPDF} 
            disabled={isDownloading} 
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-4 rounded-xl font-bold text-xl active:scale-95 transition-transform shadow-md print:hidden"
          >
            {isDownloading ? <Loader2 className="animate-spin" size={28} /> : <FileDown size={28} />}
            {isDownloading ? '產生 PDF 中...' : '產生報表 PDF'}
          </button>
        </div>

        <div className="flex bg-gray-200 rounded-xl p-1 mb-6 shadow-inner w-full print:hidden">
          <button onClick={() => setFilter('all')} className={`flex-1 flex items-center justify-center gap-1 py-3 rounded-lg text-base font-bold transition-all ${filter === 'all' ? 'bg-white text-gray-800 shadow-md' : 'text-gray-500'}`}><List size={18} /> 總覽</button>
          <button onClick={() => setFilter('personal')} className={`flex-1 flex items-center justify-center gap-1 py-3 rounded-lg text-base font-bold transition-all ${filter === 'personal' ? 'bg-white text-green-700 shadow-md' : 'text-gray-500'}`}><User size={18} /> 個人</button>
          <button onClick={() => setFilter('family')} className={`flex-1 flex items-center justify-center gap-1 py-3 rounded-lg text-base font-bold transition-all ${filter === 'family' ? 'bg-white text-blue-700 shadow-md' : 'text-gray-500'}`}><Users size={18} /> 全家</button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-green-500" size={40} /></div>
        ) : (
          <div ref={reportRef} className="w-full bg-gray-50 p-2">
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                <span className="text-base font-bold text-gray-500 mb-2">本週花費</span>
                <span className="text-4xl font-black text-green-600">${weekTotal}</span>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                <span className="text-base font-bold text-gray-500 mb-2">本月總花費</span>
                <span className="text-4xl font-black text-blue-600">${monthTotal}</span>
              </div>
            </div>

            {(filter === 'all' || filter === 'personal') && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
                <h3 className="text-xl font-bold text-gray-800 mb-5">本週營養攝取總和 (個人)</h3>
                <div className="flex flex-col gap-4 mb-6">
                  <div className="flex justify-between text-base font-bold text-gray-600"><span>🔥 熱量</span><span>{weekNutrition.calories} kcal</span></div>
                  <div className="flex justify-between text-base font-bold text-blue-600"><span>🥩 蛋白質</span><span>{weekNutrition.protein} g</span></div>
                  <div className="flex justify-between text-base font-bold text-orange-500"><span>🍚 碳水</span><span>{weekNutrition.carbs} g</span></div>
                  <div className="flex justify-between text-base font-bold text-yellow-500"><span>🥑 脂肪</span><span>{weekNutrition.fat} g</span></div>
                  <div className="flex justify-between text-base font-bold text-green-600"><span>🥦 纖維</span><span>{weekNutrition.fiber} g</span></div>
                </div>
                <div data-html2canvas-ignore>
                  <button onClick={getAIAdvice} disabled={loadingAdvice} className="w-full bg-indigo-50 text-indigo-700 border border-indigo-200 py-4 rounded-xl font-bold text-lg flex justify-center items-center gap-2 hover:bg-indigo-100 transition-colors">
                    {loadingAdvice ? <Loader2 className="animate-spin" size={24} /> : <BrainCircuit size={24} />}
                    分析本週營養建議
                  </button>
                  {advice && <div className="mt-4 p-5 bg-indigo-600 text-white rounded-xl text-base leading-relaxed shadow-inner">{advice}</div>}
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden w-full">
              <div className="bg-gray-800 text-white p-4 font-bold flex justify-between text-lg">
                <span>日期與餐別</span>
                <span>金額</span>
              </div>
              <div className="divide-y divide-gray-100">
                {filteredMeals.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 font-bold text-lg">無紀錄</div>
                ) : (
                  filteredMeals.map((meal) => (
                    <div key={meal.id} className="p-5 flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-gray-800 text-lg">{meal.date}</span>
                          <span className="text-base font-bold bg-gray-100 text-gray-600 px-3 py-1 rounded-md">
                            {meal.meal_type === 'breakfast' ? '早餐' : meal.meal_type === 'lunch' ? '午餐' : '晚餐'}
                          </span>
                          {filter === 'all' && (
                            <span className={`text-sm font-bold px-3 py-1 rounded-md text-white ${meal.record_type === 'personal' ? 'bg-green-500' : 'bg-blue-500'}`}>
                              {meal.record_type === 'personal' ? '個人專屬' : '全家紀錄'}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-black text-xl text-gray-800">${meal.cost || 0}</span>
                          <button 
                            data-html2canvas-ignore
                            onClick={() => handleDelete(meal.id)}
                            className="text-red-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={24} />
                          </button>
                        </div>
                      </div>
                      <div className="text-gray-600 text-base">
                        {meal.record_type === 'personal' && <span className="font-bold">{meal.person_name}: </span>}
                        {meal.food_text}
                        {meal.notes && <div className="text-gray-400 text-sm mt-1">備註: {meal.notes}</div>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* ✅ 新增：下載準備完成的彈出視窗 */}
      {pdfUrl && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm flex flex-col items-center gap-5 text-center shadow-2xl">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-2">
              <FileDown size={40} />
            </div>
            <h3 className="text-2xl font-black text-gray-800">報表準備就緒！</h3>
            <p className="text-gray-600 text-base mb-2 font-bold leading-relaxed">
              如果您正在使用 LINE 開啟，可能會無法直接下載。請點擊右上角「⋮」，選擇<strong className="text-red-500 text-lg">「以預設瀏覽器開啟」</strong>（Safari / Chrome）即可順利下載。
            </p>
            
            {/* 實體 <a> 標籤強制觸發下載 */}
            <a 
              href={pdfUrl} 
              download={`${currentMonthStr}-${reportTitle}.pdf`}
              className="w-full bg-blue-600 text-white font-bold text-xl py-4 rounded-xl flex justify-center items-center gap-2 active:scale-95 transition-transform shadow-lg"
            >
              點此儲存 PDF 檔案
            </a>
            
            <button 
              onClick={() => {
                setPdfUrl(null);
                URL.revokeObjectURL(pdfUrl);
              }}
              className="w-full bg-gray-100 text-gray-600 font-bold text-xl py-4 rounded-xl mt-2 active:scale-95 transition-transform"
            >
              關閉
            </button>
          </div>
        </div>
      )}
    </main>
  );
}