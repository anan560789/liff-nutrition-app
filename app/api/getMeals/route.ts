export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const monthPrefix = searchParams.get('month'); // 例如 "2026-08"

    if (!monthPrefix) {
      return NextResponse.json({ success: false, error: '缺少月份參數' }, { status: 400 });
    }

    // 設定該月的 1 號到 31 號作為搜尋範圍
    const startDate = `${monthPrefix}-01`;
    const endDate = `${monthPrefix}-31`;

    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}