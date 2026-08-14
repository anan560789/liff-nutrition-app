'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { saveMealRecord } from '../../../actions'; // 引入我們剛寫好的後端邏輯
import { useState, useEffect } from 'react';
import liff from '@line/liff';

export const runtime = 'edge';

export default function MealInputPage() {
  
  // 建立存放 LINE ID 的狀態
  const [userId, setUserId] = useState('test-user-123');

  useEffect(() => {
    const initLiff = async () => {
      try {
        await liff.init({ liffId: '2011063080-0aLaCeqt' }); // 你的專屬 LIFF ID
        if (liff.isLoggedIn()) {
          const profile = await liff.getProfile();
          setUserId(profile.userId); // 成功抓取真實 LINE ID
        }
      } catch (error) {
        console.error('LIFF 初始化失敗', error);
      }
    };
    initLiff();
  }, []);
  
  const params = useParams();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const date = params.date as string;
  const meal = params.meal as string; 
  const mealName = meal === 'breakfast' ? '早餐' : meal === 'lunch' ? '午餐' : '晚餐';

  // 處理表單送出的事件
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    // 收集表單資料
    const formData = new FormData(e.currentTarget);
    formData.append('date', date);
    formData.append('mealType', meal);

    // 呼叫後端 Action
    const result = await saveMealRecord(formData);

    if (result.success) {
      alert('紀錄成功！');
      router.push(`/date/${date}`); // 成功後跳轉回單日三餐視圖
    } else {
      alert('紀錄失敗：' + result.error);
    }
    
    setIsSubmitting(false);
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto shadow-lg relative">
      <header className="bg-white p-4 flex items-center shadow-sm relative">
        <button 
          onClick={() => router.back()} 
          className="absolute left-4 p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
          disabled={isSubmitting}
        >
          <ChevronLeft />
        </button>
        <h1 className="text-xl font-bold text-gray-800 w-full text-center">
          {date} {mealName}
        </h1>
      </header>

      {/* 將原本的 div 改為 form，並綁定 onSubmit 事件 */}
      <form onSubmit={handleSubmit} className="p-4 flex-1 flex flex-col gap-4 mt-4">
        
        <div className="bg-white p-4 rounded-2xl shadow-sm flex flex-col gap-2">
          <label className="font-semibold text-gray-700">這餐吃了什麼？</label>
          <textarea 
            name="foodText" // 加上 name 屬性讓後端抓取
            required
            className="w-full border rounded-lg p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            rows={3}
            placeholder="例如：黑鮪魚壽司、和牛燒肉、日式涮涮鍋..."
          ></textarea>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm flex flex-col gap-2">
          <label className="font-semibold text-gray-700">備註</label>
          <textarea 
            name="notes"
            className="w-full border rounded-lg p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            rows={2}
            placeholder="例如：飯少、沒有喝湯..."
          ></textarea>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm flex flex-col gap-2">
          <label className="font-semibold text-gray-700">花費金額 (元)</label>
          <input 
            type="number"
            name="cost"
            required
            min="0"
            className="w-full border rounded-lg p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="例如：150"
          />
        </div>

        <input type="hidden" name="userId" value={userId} />

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="bg-green-600 text-white font-bold py-3 rounded-xl mt-4 active:scale-95 transition-transform shadow-md hover:bg-green-700 flex justify-center items-center gap-2 disabled:bg-gray-400"
        >
          {isSubmitting ? <><Loader2 className="animate-spin" /> 處理中...</> : '分析並儲存'}
        </button>
      </form>
    </main>
  );
}