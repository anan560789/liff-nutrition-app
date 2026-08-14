'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Loader2, Users, User } from 'lucide-react';

export const runtime = 'edge';

export default function MealRecordPage() {
  const params = useParams();
  const router = useRouter();
  const date = params.date as string;
  const meal = params.meal as string;
  
  const [recordType, setRecordType] = useState<'personal' | 'family'>('personal');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mealName = meal === 'breakfast' ? '早餐' : meal === 'lunch' ? '午餐' : '晚餐';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      formData.append('date', date);
      formData.append('mealType', meal);
      formData.append('recordType', recordType);

      const response = await fetch('/api/saveMeal', { method: 'POST', body: formData });
      const result = await response.json();

      if (result.success) {
        alert('紀錄成功！');
        router.push(`/date/${date}`); 
      } else {
        alert('紀錄失敗：' + result.error);
      }
    } catch (err) {
      alert('發生網路錯誤，請稍後再試');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 block w-full max-w-md mx-auto shadow-lg">
      <header className="bg-white p-4 flex items-center justify-center shadow-sm relative w-full">
        {/* 加入「返回」文字 */}
        <button type="button" onClick={() => router.back()} className="absolute left-2 p-2 text-gray-500 hover:bg-gray-100 rounded-lg flex items-center gap-1">
          <ChevronLeft size={24} /> <span className="text-base font-bold">返回</span>
        </button>
        <h1 className="text-xl font-bold text-gray-800">
          {date} {mealName}
        </h1>
      </header>

      {/* 強制 w-full 與 px-4 */}
      <div className="w-full px-4 py-4">
        
        {/* 雙切換按鈕 */}
        <div className="flex bg-gray-200 rounded-xl p-1 mb-6 shadow-inner w-full">
          <button
            type="button"
            onClick={() => setRecordType('personal')}
            className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-lg text-xl font-bold transition-all ${
              recordType === 'personal' ? 'bg-white text-green-700 shadow-md' : 'text-gray-500'
            }`}
          >
            <User size={24} /> 個人專屬
          </button>
          <button
            type="button"
            onClick={() => setRecordType('family')}
            className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-lg text-xl font-bold transition-all ${
              recordType === 'family' ? 'bg-white text-blue-700 shadow-md' : 'text-gray-500'
            }`}
          >
            <Users size={24} /> 全家紀錄
          </button>
        </div>

        {/* 表單區塊 */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full">
          <div className="flex gap-4 w-full">
            <div className="flex-1 flex flex-col gap-2">
              <label className="text-gray-700 font-bold text-lg">名字</label>
              <input name="personName" type="text" defaultValue="Jasmine" className="w-full border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none shadow-sm" />
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <label className="text-gray-700 font-bold text-lg">年齡</label>
              <input name="personAge" type="number" defaultValue="50" className="w-full border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none shadow-sm" />
            </div>
          </div>
          <div className="flex flex-col gap-2 w-full">
            <label className="text-gray-700 font-bold text-lg">這餐吃了什麼？</label>
            <textarea name="foodText" required placeholder="例如：黑鮪魚壽司..." className="w-full border border-gray-300 rounded-xl h-32 resize-none focus:ring-2 focus:ring-green-500 outline-none shadow-sm" />
          </div>
          <div className="flex flex-col gap-2 w-full">
            <label className="text-gray-700 font-bold text-lg">備註</label>
            <textarea name="notes" placeholder="例如：飯少..." className="w-full border border-gray-300 rounded-xl h-24 resize-none focus:ring-2 focus:ring-green-500 outline-none shadow-sm" />
          </div>
          <div className="flex flex-col gap-2 w-full">
            <label className="text-gray-700 font-bold text-lg">花費金額 (元)</label>
            <input name="cost" type="number" required placeholder="例如：150" className="w-full border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none shadow-sm" />
          </div>
          <button 
            type="submit" 
            disabled={isSubmitting} 
            className={`w-full text-white font-bold text-2xl py-5 rounded-xl mt-4 flex justify-center items-center gap-2 shadow-lg transition-colors ${
              recordType === 'personal' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isSubmitting ? (
              <><Loader2 className="animate-spin" /> 處理中...</>
            ) : (
              recordType === 'personal' ? '分析營養並儲存' : '儲存全家紀錄'
            )}
          </button>
        </form>
      </div>
    </main>
  );
}