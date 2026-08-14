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

      // 根據金鑰格式自動切換驗證方式（支援 AQ. 憑證與傳統 AIzaSy 金鑰）
      let url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (apiKey.startsWith('AQ.')) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      } else {
        url += `?key=${apiKey}`;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
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
      });

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