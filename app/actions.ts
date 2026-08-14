'use server';

import { supabase } from '../lib/supabase';

export async function saveMealRecord(formData: FormData) {
  const userId = formData.get('userId') as string || 'test-user-123'; 
  const recordType = formData.get('recordType') as string;
  const foodText = formData.get('foodText') as string;

  let nutrients = null;

  if (recordType === 'personal') {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error('API Key 未設定');

      const prompt = `分析餐點：${foodText}。回傳JSON: {"calories":0, "protein":0, "carbs":0, "fat":0, "fiber":0}`;

      // 針對 AQ... 類型的授權金鑰，必須使用 Bearer 格式
      // 網址不帶 ?key=
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}` // 這是處理 AQ... 金鑰的正確方式
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' }
        }),
        signal: AbortSignal.timeout(5000) // 強制 5 秒超時
      });

      // 檢查回應狀態
      if (!response.ok) {
        const errText = await response.text();
        console.error('API 錯誤回應:', errText); // 這會顯示在 Cloudflare Logs
        throw new Error(`AI 拒絕存取 (${response.status})`);
      }

      const data = await response.json();
      const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text;
      nutrients = JSON.parse(textResult);

    } catch (error: any) {
      console.error('執行發生錯誤:', error.message);
      return { success: false, error: error.message };
    }
  }

  // 資料庫寫入
  const { error } = await supabase.from('meals').insert([{
    user_id: userId,
    date: formData.get('date'),
    meal_type: formData.get('mealType'),
    record_type: recordType,
    person_name: formData.get('personName'),
    person_age: formData.get('personAge'),
    food_text: foodText,
    notes: formData.get('notes'),
    cost: parseInt(formData.get('cost') as string),
    nutrients
  }]);

  return error ? { success: false, error: error.message } : { success: true };
}