'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDays, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const emptyDays = firstDay === 0 ? 6 : firstDay - 1; 
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const handleDayClick = (day: number) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    router.push(`/date/${year}-${m}-${d}`);
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto shadow-lg">
      {/* 標題列：加入 truncate 防止折行，設定 text-lg 確保大小適中 */}
      <header className="bg-white p-4 flex items-center justify-between shadow-sm">
        <CalendarDays className="text-green-600 shrink-0" size={26} />
        <h1 className="text-lg font-bold text-gray-800 truncate px-2">
          Jasmine專屬飲食記錄
        </h1>
        <button onClick={() => router.push('/stats')} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full shrink-0">
          <BarChart3 size={26} />
        </button>
      </header>
      
      <div className="p-4 flex flex-col mt-4 bg-white m-4 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6 px-2">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
            <ChevronLeft size={28} />
          </button>
          <h2 className="text-xl font-bold text-gray-800">
            {year}年 {month + 1}月
          </h2>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
            <ChevronRight size={28} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2 text-center">
          {['一', '二', '三', '四', '五', '六', '日'].map(day => (
            <div key={day} className="text-sm font-bold text-gray-400 py-2">{day}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: emptyDays }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square"></div>
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = dateStr === todayStr;

            return (
              <button
                key={day}
                onClick={() => handleDayClick(day)}
                className={`aspect-square flex items-center justify-center rounded-2xl text-lg font-medium transition-all active:scale-90
                  ${isToday ? 'bg-green-500 text-white shadow-md font-bold' : 'text-gray-700 bg-gray-50 hover:bg-green-100'}
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