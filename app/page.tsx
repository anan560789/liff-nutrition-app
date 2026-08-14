'use client';

import { useEffect } from 'react';
import liff from '@line/liff';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { CalendarDays, BarChart3 } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  
  useEffect(() => {
    const initLiff = async () => {
      try {
        await liff.init({ liffId: '2011063080-0aLaCeqt' });
        if (liff.isLoggedIn()) {
          const profile = await liff.getProfile();
          // 抓到 ID 後，偷偷存進手機瀏覽器的暫存空間裡
          localStorage.setItem('line_user_id', profile.userId);
        }
      } catch (error) {
        console.error('LIFF 初始化失敗', error);
      }
    };
    initLiff();
  }, []);

  const router = useRouter();
  const [date, setDate] = useState<Date>(new Date());

  const handleDateClick = (selectedDate: Date) => {
    const localDate = new Date(selectedDate.getTime() - (selectedDate.getTimezoneOffset() * 60000));
    const formattedDate = localDate.toISOString().split('T')[0];
    router.push(`/date/${formattedDate}`);
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto shadow-lg relative">
      <header className="bg-white p-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <CalendarDays className="text-green-600" />
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          Jasmine專屬飲食記錄
          </h1>
        </div>
        <Link href="/stats" className="text-gray-500 hover:text-green-600">
          <BarChart3 />
        </Link>
      </header>

      <div className="p-4 flex-1">
        <div className="bg-white rounded-2xl shadow-sm p-4 mt-4">
          <h2 className="text-lg font-semibold text-gray-700 mb-4 text-center">
            請選擇要紀錄的日期
          </h2>
          <div className="flex justify-center">
            <Calendar 
              onChange={(value) => setDate(value as Date)} 
              value={date}
              onClickDay={handleDateClick}
              className="border-0 w-full"
            />
          </div>
          {/* 這是新加的匯出報表按鈕 */}
          <button 
            onClick={() => {
              // 抓取目前月曆停留在哪一個月 (格式化為 YYYY-MM)
              const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
              const currentMonthStr = localDate.toISOString().slice(0, 7);
              router.push(`/report/${currentMonthStr}`);
            }}
            className="w-full mt-6 bg-gray-800 text-white font-semibold py-3 rounded-xl shadow hover:bg-gray-700 active:scale-95 transition-transform"
          >
            列印本月報表
          </button>
        </div>
      </div>
    </main>
  );
}