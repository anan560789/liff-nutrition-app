'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { toPng } from 'html-to-image'; // 換成這個現代的套件
import jsPDF from 'jspdf';

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const month = params.month as string; 
  const [meals, setMeals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchMeals() {
      const startDate = `${month}-01`;
      const endDate = new Date(new Date(startDate).getFullYear(), new Date(startDate).getMonth() + 1, 0).toISOString().split('T')[0];

      const { data } = await supabase
        .from('meals')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

      if (data) setMeals(data);
      setIsLoading(false);
    }
    fetchMeals();
  }, [month]);

  // 處理下載 PDF 的邏輯
  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    setIsDownloading(true);
    
    try {
      // 1. 使用 html-to-image 產生高畫質截圖 (完美支援現代 CSS)
      const dataUrl = await toPng(reportRef.current, { 
        quality: 1, 
        pixelRatio: 2,
        backgroundColor: '#ffffff' // 確保背景是純白
      });
      
      // 2. 建立虛擬圖片以取得實際長寬
      const img = new window.Image();
      img.src = dataUrl;
      await new Promise((resolve) => { img.onload = resolve; });
      
      // 3. 建立 A4 尺寸的 PDF 文件
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // 4. 計算圖片在 A4 紙上的比例
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (img.height * pdfWidth) / img.width;
      
      // 5. 將圖片貼上 PDF 並存檔
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`飲食月報表_${month}.pdf`);
      
    } catch (error) {
      console.error('產生 PDF 失敗:', error);
      alert('產生 PDF 失敗，請再試一次');
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">報表產生中...</div>;

  return (
    <div className="bg-gray-100 min-h-screen p-4 flex flex-col items-center">
      
      {/* 頂部操作列 */}
      <div className="w-full max-w-3xl flex justify-between items-center mb-4 print:hidden">
        <button 
          onClick={() => router.push('/')}
          className="text-sm text-gray-600 hover:text-black font-medium"
        >
          ← 返回首頁
        </button>
        <div className="flex gap-2">
          <button 
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:bg-gray-400 active:scale-95 transition-transform"
          >
            {isDownloading ? '處理中...' : '儲存為 PDF (超商列印)'}
          </button>
        </div>
      </div>

      {/* 報表內容 */}
      <div ref={reportRef} className="w-full max-w-3xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">{month} 飲食與花費月報表</h1>

        {meals.length === 0 ? (
          <p className="text-center text-gray-500 py-10">這個月還沒有任何紀錄喔！</p>
        ) : (
          <table className="w-full border-collapse text-[10px] text-gray-700">
            <thead>
              <tr className="bg-gray-100 text-gray-800 border-b-2 border-gray-300">
                <th className="p-1 text-left whitespace-nowrap">日期</th>
                <th className="p-1 text-left whitespace-nowrap">餐別</th>
                <th className="p-1 text-left">餐點</th>
                <th className="p-1 text-left">備註</th>
                <th className="p-1 text-right">花費</th>
                <th className="p-1 text-right">熱量</th>
                <th className="p-1 text-right">蛋白</th>
                <th className="p-1 text-right">碳水</th>
                <th className="p-1 text-right">脂肪</th>
              </tr>
            </thead>
            <tbody>
              {meals.map(meal => (
                <tr key={meal.id} className="border-b border-gray-200">
                  <td className="p-1 whitespace-nowrap">{meal.date.slice(5)}</td>
                  <td className="p-1 whitespace-nowrap">
                    {meal.meal_type === 'breakfast' ? '早餐' : meal.meal_type === 'lunch' ? '午餐' : '晚餐'}
                  </td>
                  <td className="p-1">{meal.food_text}</td>
                  <td className="p-1 text-gray-500">{meal.notes || '-'}</td>
                  <td className="p-1 text-right">${meal.cost}</td>
                  <td className="p-1 text-right font-medium">{meal.nutrients?.calories || '-'}</td>
                  <td className="p-1 text-right">{meal.nutrients?.protein || '-'}g</td>
                  <td className="p-1 text-right">{meal.nutrients?.carbs || '-'}g</td>
                  <td className="p-1 text-right">{meal.nutrients?.fat || '-'}g</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}