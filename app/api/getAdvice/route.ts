export const runtime = 'edge';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { nutrition } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'API Key 未設定' }, { status: 400 });
    }

    // 結合針對骨骼肌、胰島素與腸道健康的專屬提示詞
    const prompt = `你是一位專業營養師。根據以下本週個人的營養攝取總和，給予一段簡短的飲食建議（約100字內，明確指出該補充什麼食物）。
請著重於維持骨骼肌、電解質平衡、胰島素敏感度及腸道健康。
本週總攝取：熱量 ${nutrition.calories} 大卡，蛋白質 ${nutrition.protein}g，碳水 ${nutrition.carbs}g，脂肪 ${nutrition.fat}g，纖維 ${nutrition.fiber}g。`;

    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-3.5-flash-lite:generateContent`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      }),
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      throw new Error(`AI 模型請求失敗 (${response.status})`);
    }

    const data = await response.json();
    const advice = data.candidates?.[0]?.content?.parts?.[0]?.text || '暫時無法產生建議';

    return NextResponse.json({ success: true, advice });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}