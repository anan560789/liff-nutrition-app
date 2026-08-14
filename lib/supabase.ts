import { createClient } from '@supabase/supabase-js';

// 讀取我們剛剛在 .env.local 設定的環境變數
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 建立並匯出 Supabase 客戶端連線
export const supabase = createClient(supabaseUrl, supabaseKey);