'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, BarChart3, Loader2 } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  
  // 為了避免雲端伺服器與台灣手機時區不一致導致畫面當機，
  // 必須確保 mounted 後才開始畫日曆。
  const [mounted, setMounted] = useState(false);
  const [currentDate, setCurrentDate] = useState<Date | null>(null);

  useEffect(() => {
    // 只有在手機端 (Client) 執行時，才抓取正確的台灣時間
    setCurrentDate(new Date());
    setMounted(true);
  }, []);

  const handlePrevMonth = () => {
    if (currentDate) setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    if (currentDate) setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  
  const handleDayClick = (day: number) => {
    if (!day || !currentDate) return;
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    router.push(`/date/${dateStr}`);
  };

  const isToday = (day: number) => {
    if (!day || !currentDate) return false;
    const realToday = new Date(); // 使用當下真實時間作比對
    return realToday.getDate() === day && 
           realToday.getMonth() === currentDate.getMonth() && 
           realToday.getFullYear() === currentDate.getFullYear();
  };

  // 如果還在確認時區，先顯示空白架構，避免崩潰
  if (!mounted || !currentDate) {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col w-full pb-10 justify-center items-center">
         <Loader2 className="animate-spin text-green-500" size={48} />
      </main>
    );
  }

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const days = Array(firstDayOfMonth).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col w-full pb-10">
      <header className="bg-white px-4 py-6 flex items-center justify-between shadow-sm w-full">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-800 tracking-wide flex-1 whitespace-nowrap overflow-hidden text-ellipsis">
          Jasmine專屬飲食紀錄
        </h1>
        <button 
          onClick={() => router.push('/stats')} 
          className="p-3 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl flex items-center justify-center shadow-sm transition-colors ml-2 shrink-0"
        >
          <BarChart3 size={28} />
        </button>
      </header>

      <div className="flex justify-between items-center bg-white px-6 py-6 mt-2 shadow-sm w-full">
        <button onClick={handlePrevMonth} className="p-4 text-gray-500 hover:bg-gray-100 rounded-full active:scale-95 transition-transform">
          <ChevronLeft size={44} strokeWidth={2.5} />
        </button>
        <h2 className="text-4xl font-black text-gray-800">
          {year}年 {month + 1}月
        </h2>
        <button onClick={handleNextMonth} className="p-4 text-gray-500 hover:bg-gray-100 rounded-full active:scale-95 transition-transform">
          <ChevronRight size={44} strokeWidth={2.5} />
        </button>
      </div>

      <div className="flex-1 w-full bg-white px-2 py-4 mt-2 shadow-sm">
        <div className="grid grid-cols-7 gap-2 mb-4 w-full">
          {['日', '一', '二', '三', '四', '五', '六'].map((d) => (
            <div key={d} className="text-center text-2xl font-bold text-gray-400">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2 w-full">
          {days.map((day, index) => (
            <div key={index} className="aspect-square">
              {day && (
                <button
                  onClick={() => handleDayClick(day)}
                  className={`w-full h-full flex items-center justify-center rounded-2xl text-3xl font-black transition-all active:scale-95 ${
                    isToday(day)
                      ? 'bg-green-500 text-white shadow-lg'
                      : 'bg-gray-50 text-gray-800 hover:bg-gray-200 border-2 border-gray-100'
                  }`}
                >
                  {day}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}