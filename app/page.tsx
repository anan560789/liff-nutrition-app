'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDays, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  
  // 記錄目前顯示的月份，預設為今天
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // 計算月曆天數 (以週一為每週第一天)
  const firstDay = new Date(year, month, 1).getDay();
  const emptyDays = firstDay === 0 ? 6 : firstDay - 1; 
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));

  // 取得今天的日期字串用來標示特別顏色 (YYYY-MM-DD格式)
  // 注意：這裡考慮到時區問題，使用本地時間
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const handleDayClick = (day: number) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    router.push(`/date/${year}-${m}-${d}`);
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto shadow-lg">
      {/* 頂部 Header */}
      <header className="bg-white p-4 flex items-center justify-between shadow-sm">
        <CalendarDays className="text-green-600" size={28} />
        <h1 className="text-xl font-bold text-gray-800">
          Jasmine專屬飲食記錄
        </h1>
        <button 
          onClick={() => router.push('/stats')} 
          className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
        >
          <BarChart3 size={24} />
        </button>
      </header>
      
      {/* 月曆主體區塊 */}
      <div className="p-4 flex flex-col mt-4 bg-white m-4 rounded-3xl shadow-sm border border-gray-100">
        
        {/* 月曆控制列 */}
        <div className="flex justify-between items-center mb-6 px-2">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
            <ChevronLeft size={28} />
          </button>
          <h2 className="text-xl font-bold text-gray-800 tracking-wide">
            {year}年 {month + 1}月
          </h2>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
            <ChevronRight size={28} />
          </button>
        </div>

        {/* 星期標題 (一 到 日) */}
        <div className="grid grid-cols-7 gap-1 mb-2 text-center">
          {['一', '二', '三', '四', '五', '六', '日'].map(day => (
            <div key={day} className="text-sm font-bold text-gray-400 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* 日期格子區域 */}
        <div className="grid grid-cols-7 gap-2">
          {/* 月初空白格子 */}
          {Array.from({ length: emptyDays }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square"></div>
          ))}
          
          {/* 實際天數按鈕 */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = dateStr === todayStr;

            return (
              <button
                key={day}
                onClick={() => handleDayClick(day)}
                className={`aspect-square flex items-center justify-center rounded-2xl text-lg font-medium transition-all active:scale-90
                  ${isToday 
                    ? 'bg-green-500 text-white shadow-md font-bold' // 今天的日期用綠底白字凸顯
                    : 'text-gray-700 bg-gray-50 hover:bg-green-100 hover:text-green-700' // 其他日期加了淺灰底色，像實體的按鈕
                  }
                `}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
    </main>
  );
}