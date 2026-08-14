'use server';

import { supabase } from '../lib/supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function saveMealRecord(formData: FormData) {
  // 新增這行：從表單接收 userId，如果沒抓到就用預設值（方便你在電腦瀏覽器上測試）
  const userId = formData.get('userId') as string || 'test-user-123'; 
  
  const date = formData.get('date') as string;
  const mealType = formData.get('mealType') as string;
  const foodText = formData.get('foodText') as string;
  const notes = formData.get('notes') as string;
  const cost = parseInt(formData.get('cost') as string) || 0;

  let nutrients = null;

  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('找不到 Gemini API Key');
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      }
    });
    
    const prompt = `
      你是一個專業的營養師。請根據以下餐點內容估算營養素。
      餐點內容：${foodText}
      備註：${notes || '無'}
      請回傳 JSON 格式，必須包含以下整數欄位：
      {"calories": 總熱量大卡, "protein": 蛋白質克, "carbs": 碳水化合物克, "fat": 脂肪克, "fiber": 膳食纖維克}
    `;

    const result = await model.generateContent(prompt);
    nutrients = JSON.parse(result.response.text());

  } catch (error: any) {
    console.error('AI 處理失敗:', error);
    return { success: false, error: 'AI 辨識失敗: ' + error.message };
  }

  // 將資料寫入 Supabase
  const { error } = await supabase
    .from('meals')
    .insert([
      {
        user_id: userId, // 這裡已經換成動態抓取的 LINE ID 了！
        date: date,
        meal_type: mealType,
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