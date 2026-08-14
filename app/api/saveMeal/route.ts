export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const userId = (formData.get('userId') as string) || 'test-user-123';
    const date = formData.get('date') as string;
    const mealType = formData.get('mealType') as string;
    const recordType = formData.get('recordType') as string;
    const foodText = formData.get('foodText') as string;
    
    // 取得金鑰
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: '未設定 API Key' }, { status: 400 });
    }

    // 💡 關鍵修正：
    // 1. 使用 v1beta (v1 經常因為權限鎖定而報錯)
    // 2. 這是 REST API 呼叫 gemini-1.5-flash 最標準的寫法
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 授權金鑰 (AQ...) 在 REST API 下，通常需要放在 Authorization Header
        'Authorization': `Bearer ${apiKey}` 
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `分析餐點：${foodText}。回傳JSON: {"calories":0, "protein":0, "carbs":0, "fat":0, "fiber":0}` }] }],
        generationConfig: { responseMimeType: 'application/json' }
      }),
      signal: AbortSignal.timeout(10000) // 延長到 10 秒
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json({ 
        success: false, 
        error: `Google API 錯誤: ${errorData.error?.message || response.statusText}` 
      }, { status: 500 });
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    const nutrients = JSON.parse(text);

    // 寫入 Supabase
    const { error } = await supabase.from('meals').insert([{
      user_id: userId,
      date: date,
      meal_type: mealType,
      record_type: recordType,
      food_text: foodText,
      nutrients: nutrients
    }]);

    if (error) throw error;
    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}