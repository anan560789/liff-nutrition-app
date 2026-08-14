'use server';

import { supabase } from '../lib/supabase';

export async function saveMealRecord(formData: FormData) {
  const userId = formData.get('userId') as string || 'test-user-123'; 
  
  const date = formData.get('date') as string;
  const mealType = formData.get('mealType') as string;
  const recordType = formData.get('recordType') as string; 
  const personName = formData.get('personName') as string || null; 
  const personAge = formData.get('personAge') ? parseInt(formData.get('personAge') as string) : null; 
  
  const foodText = formData.get('foodText') as string;
  const notes = formData.get('notes') as string;
  const cost = parseInt(formData.get('cost') as string) || 0;

  let nutrients = null;

  // 如果是「個人紀錄」，使用原生 fetch 呼叫 Gemini API（完美支援 AQ. 金鑰與 Edge 環境）
  if (recordType === 'personal') {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('找不到 Gemini API Key');
      }
      
      const prompt = `
        你是一個專業的營養師。請根據以下餐點內容估算營養素。
        餐點內容：${foodText}
        備註：${notes || '無'}
        請回傳 JSON 格式，必須包含以下整數欄位：
        {"calories": 總熱量大卡, "protein": 蛋白質克, "carbs": 碳水化合物克, "fat": 脂肪克, "fiber": 膳食纖維克}
      `;

      // 直接用原生的 fetch 請求 Google Gemini REST API
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }]
              }
            ],
            generationConfig: {
              responseMimeType: 'application/json'
            }
          })
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini API 錯誤 (${response.status}): ${errText}`);
      }

      const data = await response.json();
      const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!textResult) {
        throw new Error('AI 未能回傳有效內容');
      }

      nutrients = JSON.parse(textResult);

    } catch (error: any) {
      console.error('AI 處理失敗:', error);
      return { success: false, error: 'AI 辨識失敗: ' + error.message };
    }
  }

  // 將所有資料寫入 Supabase
  const { error } = await supabase
    .from('meals')
    .insert([
      {
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
      }
    ]);

  if (error) {
    return { success: false, error: '資料庫寫入失敗: ' + error.message };
  }

  return { success: true };
}