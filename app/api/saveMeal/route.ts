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
    const personName = (formData.get('personName') as string) || null;
    const personAge = formData.get('personAge') ? parseInt(formData.get('personAge') as string) : null;
    const foodText = formData.get('foodText') as string;
    const notes = formData.get('notes') as string;
    const cost = parseInt(formData.get('cost') as string) || 0;

    let nutrients = null;

    if (recordType === 'personal') {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return NextResponse.json({ success: false, error: 'Cloudflare 找不到 API Key' }, { status: 400 });
      }

      const prompt = `分析餐點：${foodText}。請嚴格僅回傳 JSON 格式：{"calories": 數字, "protein": 數字, "carbs": 數字, "fat": 數字, "fiber": 數字}`;
      
      // 使用你截圖中顯示的 3.5 Flash-Lite 正式模型名稱
      const url = `https://generativelanguage.googleapis.com/v1/models/gemini-3.5-flash-lite:generateContent`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey // 使用標準金鑰驗證
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' }
        }),
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        const errText = await response.text();
        return NextResponse.json({ success: false, error: `模型錯誤 (${response.status}): ${errText}` }, { status: 500 });
      }

      const data = await response.json();
      const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (textResult) {
        const cleanText = textResult.replace(/```json/g, '').replace(/```/g, '').trim();
        nutrients = JSON.parse(cleanText);
      }
    }

    const { error } = await supabase.from('meals').insert([{
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

    if (error) throw error;
    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}