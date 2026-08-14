'use server';

import { supabase } from '../lib/supabase';

export async function saveMealRecord(formData: FormData) {
  const userId = (formData.get('userId') as string) || 'test-user-123'; 
  const date = formData.get('date') as string;
  const mealType = formData.get('mealType'] as string || formData.get('mealType') as string;
  const recordType = formData.get('recordType') as string; 
  const personName = formData.get('personName') as string || null; 
  const personAge = formData.get('personAge') ? parseInt(formData.get('personAge') as string) : null; 
  const foodText = formData.get('foodText') as string;
  const notes = formData.get('notes') as string;
  const cost = parseInt(formData.get('cost') as string) || 0;

  let nutrients = null;

  if (recordType === 'personal') {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error('找不到 Gemini API Key');
      
      const prompt = `分析餐點：${foodText}。請嚴格僅回傳 JSON 格式：{"calories": 數字, "protein": 數字, "carbs": 數字, "fat": 數字, "fiber": 數字}`;

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

      // 加入 4 秒強制超時機制，保證畫面絕對不會無限轉圈卡死
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' }
        }),
        signal: AbortSignal.timeout(4000) 
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`AI 服務回應錯誤 (${response.status}): ${errText}`);
      }

      const data = await response.json();
      const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (textResult) {
        nutrients = JSON.parse(textResult);
      }
    } catch (error: any) {
      console.error('AI 處理失敗:', error);
      // 如果 AI 逾時或失敗，直接回傳錯誤讓前端跳出提示，不再默默卡住
      return { success: false, error: 'AI 分析失敗: ' + (error.message || '連線逾時') };
    }
  }

  // 將資料寫入 Supabase
  const { error } = await supabase
    .from('meals')
    .insert([{
      user_id: userId,
      date: date,
      meal_type: mealType,
      record_type: recordType,
      person_name: personName,
      person_age: personAge,
      food_text: foodText,
      notes: notes,
      cost: cost,
      nutrients: nutrients 
    }]);

  if (error) {
    return { success: false, error: '資料庫寫入失敗: ' + error.message };
  }

  return { success: true };
}