'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, FileDown, Loader2, List, User, Users, BrainCircuit, Trash2, Share } from 'lucide-react';

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
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);

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

  const personalWeeklyStats: Record<string, {calories: number, protein: number, carbs: number, fat: number, fiber: number}> = {};
  let genericWeekNutrition = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }; 
  let familyMonthlyTotal = 0;
  let monthTotal = 0;
  let weekTotal = 0;

  meals.forEach(meal => {
    const cost = meal.cost || 0;
    
    if (filter === 'all' || meal.record_type === filter) {
      monthTotal += cost;
      if (new Date(meal.date) >= monday) weekTotal += cost;
    }

    if (meal.record_type === 'family') {
      familyMonthlyTotal += cost;
    }

    if (meal.record_type === 'personal' && new Date(meal.date) >= monday) {
      const name = meal.person_name || '個人';
      if (!personalWeeklyStats[name]) personalWeeklyStats[name] = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
      
      if (meal.nutrients) {
        personalWeeklyStats[name].calories += meal.nutrients.calories || 0;
        personalWeeklyStats[name].protein += meal.nutrients.protein || 0;
        personalWeeklyStats[name].carbs += meal.nutrients.carbs || 0;
        personalWeeklyStats[name].fat += meal.nutrients.fat || 0;
        personalWeeklyStats[name].fiber += meal.nutrients.fiber || 0;

        genericWeekNutrition.calories += meal.nutrients.calories || 0;
        genericWeekNutrition.protein += meal.nutrients.protein || 0;
        genericWeekNutrition.carbs += meal.nutrients.carbs || 0;
        genericWeekNutrition.fat += meal.nutrients.fat || 0;
        genericWeekNutrition.fiber += meal.nutrients.fiber || 0;
      }
    }
  });

  const getAIAdvice = async () => {
    setLoadingAdvice(true);
    setAdvice('');
    try {
      const res = await fetch('/api/getAdvice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nutrition: genericWeekNutrition })
      });
      const data = await res.json();
      if (data.success) setAdvice(data.advice);
    } catch (err) {
      alert('網路異常');
    } finally {
      setLoadingAdvice(false);
    }
  };

  const reportTitle = filter === 'all' ? '總覽' : filter === 'personal' ? '個人報表' : '全家報表';

  const handleGeneratePDF = async () => {
    if (!reportRef.current) return;
    setIsDownloading(true);

    // 💡 給予 React 150 毫秒的時間重新渲染畫面，讓按鈕有時間被隱藏起來
    await new Promise(resolve => setTimeout(resolve, 150));

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

      // 💡 關鍵修正：放棄固定 A4 尺寸，將 PDF 畫布大小完全貼齊內容長度！
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [img.width, img.height] 
      });

      pdf.addImage(dataUrl, 'PNG', 0, 0, img.width, img.height);
      setPdfBlob(pdf.output('blob'));

    } catch (error) {
      alert('產生 PDF 失敗。');
    } finally {
      setIsDownloading(false); // 產出完成，恢復顯示按鈕
    }
  };

  const handleNativeShare = async () => {
    if (!pdfBlob) return;
    const fileName = `${currentMonthStr}-${reportTitle}報表.pdf`;
    const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

    if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
      try {
        await navigator.share({ files: [pdfFile], title: fileName });
        setPdfBlob(null);
      } catch (error) {
        setPdfBlob(null);
      }
    } else {
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => {
        window.open(url, '_blank');
        setPdfBlob(null);
      }, 100);
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
            onClick={handleGeneratePDF} 
            disabled={isDownloading} 
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-blue-800 text-white px-6 py-4 rounded-xl font-bold text-xl active:scale-95 transition-transform shadow-md print:hidden"
          >
            {isDownloading ? <Loader2 className="animate-spin" size={28} /> : <FileDown size={28} />}
            {isDownloading ? '製作完美報表中...' : '產生報表 PDF'}
          </button>
        </div>

        {!isDownloading && (
          <div className="flex bg-gray-200 rounded-xl p-1 mb-6 shadow-inner w-full print:hidden">
            <button onClick={() => setFilter('all')} className={`flex-1 flex items-center justify-center gap-1 py-3 rounded-lg text-base font-bold transition-all ${filter === 'all' ? 'bg-white text-gray-800 shadow-md' : 'text-gray-500'}`}><List size={18} /> 總覽</button>
            <button onClick={() => setFilter('personal')} className={`flex-1 flex items-center justify-center gap-1 py-3 rounded-lg text-base font-bold transition-all ${filter === 'personal' ? 'bg-white text-green-700 shadow-md' : 'text-gray-500'}`}><User size={18} /> 個人</button>
            <button onClick={() => setFilter('family')} className={`flex-1 flex items-center justify-center gap-1 py-3 rounded-lg text-base font-bold transition-all ${filter === 'family' ? 'bg-white text-blue-700 shadow-md' : 'text-gray-500'}`}><Users size={18} /> 全家</button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-green-500" size={40} /></div>
        ) : (
          <div ref={reportRef} className="w-full bg-gray-50 p-2">
            
            <div className="text-center mb-6">
              <h2 className="text-3xl font-black text-gray-800">{currentMonthStr} {reportTitle}</h2>
            </div>

            {/* 🔴 模式 1：個人報表 */}
            {filter === 'personal' && (
              <div className="flex flex-col gap-6">
                {Object.keys(personalWeeklyStats).length === 0 ? (
                  <div className="text-center text-gray-400 font-bold p-8 text-lg">本週尚無個人營養紀錄</div>
                ) : (
                  Object.entries(personalWeeklyStats).map(([name, stats]) => (
                    <div key={name} className="bg-white p-6 rounded-2xl border-2 border-gray-100 shadow-sm">
                      <h3 className="text-xl font-bold text-gray-800 mb-5">{name} 的本週營養攝取</h3>
                      <div className="flex flex-col gap-4">
                        <div className="flex justify-between text-base font-bold text-gray-600"><span>🔥 熱量</span><span>{stats.calories} kcal</span></div>
                        <div className="flex justify-between text-base font-bold text-blue-600"><span>🥩 蛋白質</span><span>{stats.protein} g</span></div>
                        <div className="flex justify-between text-base font-bold text-orange-500"><span>🍚 碳水</span><span>{stats.carbs} g</span></div>
                        <div className="flex justify-between text-base font-bold text-yellow-500"><span>🥑 脂肪</span><span>{stats.fat} g</span></div>
                        <div className="flex justify-between text-base font-bold text-green-600"><span>🥦 纖維</span><span>{stats.fiber} g</span></div>
                      </div>
                    </div>
                  ))
                )}

                <div className="bg-white p-6 rounded-2xl border-2 border-gray-100 shadow-sm mb-4">
                  {/* 💡 匯出 PDF 時隱藏分析按鈕 */}
                  {!isDownloading && (
                    <button onClick={getAIAdvice} disabled={loadingAdvice} className="w-full bg-indigo-50 text-indigo-700 border border-indigo-200 py-4 rounded-xl font-bold text-lg flex justify-center items-center gap-2 active:scale-95 transition-colors">
                      {loadingAdvice ? <Loader2 className="animate-spin" size={24} /> : <BrainCircuit size={24} />}
                      分析本週營養建議
                    </button>
                  )}
                  {advice && (
                    <div className={`p-5 bg-indigo-50 border border-indigo-100 text-indigo-900 rounded-xl text-base font-bold leading-relaxed shadow-sm ${!isDownloading ? 'mt-4' : ''}`}>
                      <h4 className="flex items-center gap-2 mb-3 text-indigo-700"><BrainCircuit size={22}/> AI 營養師建議：</h4>
                      {advice}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 🔴 模式 2：全家報表 */}
            {filter === 'family' && (
              <div className="flex flex-col gap-6">
                <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 text-center shadow-sm">
                   <span className="text-base font-bold text-blue-600 mb-2 block">本月全家加總花費</span>
                   <span className="text-5xl font-black text-blue-700">${familyMonthlyTotal}</span>
                </div>
                
                <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm overflow-hidden w-full">
                  <div className="bg-gray-800 text-white p-4 font-bold flex justify-between text-base">
                    <span className="w-1/4 text-center">日期</span>
                    <span className="w-1/4 text-center">餐別</span>
                    <span className="w-2/4">內容與金額</span>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {meals.filter(m => m.record_type === 'family').length === 0 ? (
                       <div className="p-8 text-center text-gray-400 font-bold text-lg">尚無全家紀錄</div>
                    ) : (
                      meals.filter(m => m.record_type === 'family').map((meal) => (
                        <div key={meal.id} className="p-4 flex gap-2 items-center">
                           <span className="w-1/4 text-center font-bold text-gray-800 text-sm">{meal.date.substring(5)}</span>
                           <span className="w-1/4 text-center text-sm font-bold bg-blue-100 text-blue-700 py-1.5 rounded-md">
                             {meal.meal_type === 'breakfast' ? '早餐' : meal.meal_type === 'lunch' ? '午餐' : '晚餐'}
                           </span>
                           <div className="w-2/4 flex flex-col pl-3 border-l border-gray-100">
                              <span className="font-bold text-gray-800">{meal.food_text}</span>
                              <span className="font-black text-lg text-red-500 mt-1">${meal.cost || 0}</span>
                           </div>
                           {/* 💡 匯出 PDF 時隱藏刪除按鈕 */}
                           {!isDownloading && (
                             <button onClick={() => handleDelete(meal.id)} className="ml-auto text-gray-300 hover:text-red-500 p-2"><Trash2 size={20}/></button>
                           )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 🔴 模式 3：預設總覽 */}
            {filter === 'all' && (
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-6 rounded-2xl border-2 border-gray-100 flex flex-col items-center justify-center">
                    <span className="text-base font-bold text-gray-500 mb-2">本週花費</span>
                    <span className="text-4xl font-black text-green-600">${weekTotal}</span>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border-2 border-gray-100 flex flex-col items-center justify-center">
                    <span className="text-base font-bold text-gray-500 mb-2">本月總花費</span>
                    <span className="text-4xl font-black text-blue-600">${monthTotal}</span>
                  </div>
                </div>
                
                <div className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden w-full">
                  <div className="bg-gray-800 text-white p-4 font-bold flex justify-between text-base">
                    <span>日期與餐別</span>
                    <span>金額</span>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {meals.length === 0 ? (
                      <div className="p-8 text-center text-gray-400 font-bold text-lg">無紀錄</div>
                    ) : (
                      meals.map((meal) => (
                        <div key={meal.id} className="p-5 flex flex-col gap-3">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-gray-800 text-lg">{meal.date}</span>
                              <span className="text-sm font-bold bg-gray-100 text-gray-600 px-3 py-1 rounded-md">
                                {meal.meal_type === 'breakfast' ? '早餐' : meal.meal_type === 'lunch' ? '午餐' : '晚餐'}
                              </span>
                              <span className={`text-sm font-bold px-3 py-1 rounded-md text-white ${meal.record_type === 'personal' ? 'bg-green-500' : 'bg-blue-500'}`}>
                                {meal.record_type === 'personal' ? '個人' : '全家'}
                              </span>
                            </div>
                            <span className="font-black text-xl text-gray-800">${meal.cost || 0}</span>
                          </div>
                          <div className="text-gray-600 text-base">
                            <span className="font-bold">{meal.person_name || '全家'}: </span>{meal.food_text}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {pdfBlob && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 transition-opacity">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm flex flex-col items-center gap-4 text-center shadow-2xl">
            <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-1">
              <Share size={36} className="-ml-1" />
            </div>
            <h3 className="text-2xl font-black text-gray-800">報表製作完成！</h3>
            <p className="text-gray-500 text-sm font-bold leading-relaxed px-2">
              為突破 LINE 的瀏覽限制，請點擊下方按鈕，選擇<strong className="text-blue-600">「儲存到檔案」</strong>，或直接分享給親友。
            </p>
            
            <button 
              onClick={handleNativeShare}
              className="w-full bg-blue-600 text-white font-black text-xl py-4 rounded-xl flex justify-center items-center gap-2 active:scale-95 transition-transform shadow-lg mt-2"
            >
              <Share size={24} /> 開啟儲存 / 分享選單
            </button>
            
            <button 
              onClick={() => setPdfBlob(null)}
              className="w-full bg-gray-100 text-gray-600 font-bold text-lg py-4 rounded-xl mt-1 active:scale-95 transition-transform"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </main>
  );
}