'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Loader2, Users, User } from 'lucide-react';

export const runtime = 'edge';

export default function MealInputPage() {
  const [userId, setUserId] = useState('test-user-123');
  // 新增狀態：用來記錄目前選的是全家還是個人，預設為個人
  const [recordType, setRecordType] = useState<'personal' | 'family'>('personal');

  useEffect(() => {
    const storedUserId = typeof window !== 'undefined' ? localStorage.getItem('line_user_id') : null;
    if (storedUserId) {
      setUserId(storedUserId);
    }
  }, []);
  
  const params = useParams();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const date = params.date as string;
  const meal = params.meal as string; 
  const mealName = meal === 'breakfast' ? '早餐' : meal === 'lunch' ? '午餐' : '晚餐';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      formData.append('date', date);
      formData.append('mealType', meal);
      formData.append('recordType', recordType);

      // 直接把資料呼叫我們剛剛建立的專屬 API
      const response = await fetch('/api/saveMeal', {
        method: 'POST',
        body: formData,
      });

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
      setIsSubmitting(false); // 確保轉圈圈一定會消失
    }
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

      <div className="p-4 flex flex-col gap-4 mt-2">
        {/* 切換全家 / 個人的按鈕區塊 */}
        <div className="flex bg-gray-200 rounded-xl p-1 shadow-inner">
          <button
            onClick={() => setRecordType('personal')}
            className={`flex-1 flex justify-center items-center gap-2 py-2 rounded-lg font-bold transition-all ${
              recordType === 'personal' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500'
            }`}
          >
            <User size={18} /> 個人專屬
          </button>
          <button
            onClick={() => setRecordType('family')}
            className={`flex-1 flex justify-center items-center gap-2 py-2 rounded-lg font-bold transition-all ${
              recordType === 'family' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'
            }`}
          >
            <Users size={18} /> 全家紀錄
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {/* 如果是個人紀錄，才顯示名字與年齡 */}
          {recordType === 'personal' && (
            <div className="flex gap-4">
              <div className="bg-white p-4 rounded-2xl shadow-sm flex-1 flex flex-col gap-2">
                <label className="font-semibold text-gray-700">名字</label>
                <input 
                  type="text"
                  name="personName"
                  required
                  defaultValue="Jasmine" // 預設帶入 Jasmine
                  className="w-full border rounded-lg p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="例如：Jasmine"
                />
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm flex-1 flex flex-col gap-2">
                <label className="font-semibold text-gray-700">年齡</label>
                <input 
                  type="number"
                  name="personAge"
                  required
                  min="0"
                  className="w-full border rounded-lg p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="例如：28"
                />
              </div>
            </div>
          )}

          <div className="bg-white p-4 rounded-2xl shadow-sm flex flex-col gap-2">
            <label className="font-semibold text-gray-700">這餐吃了什麼？</label>
            <textarea 
              name="foodText"
              required
              className="w-full border rounded-lg p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              rows={3}
              placeholder={recordType === 'personal' ? "例如：黑鮪魚壽司、和牛燒肉..." : "例如：全家去吃海底撈，點了牛小排..."}
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
            className={`font-bold py-3 rounded-xl mt-4 active:scale-95 transition-transform shadow-md flex justify-center items-center gap-2 text-white disabled:bg-gray-400 ${
              recordType === 'personal' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isSubmitting ? <><Loader2 className="animate-spin" /> 處理中...</> : (recordType === 'personal' ? '分析營養並儲存' : '直接儲存紀錄')}
          </button>
        </form>
      </div>
    </main>
  );
}