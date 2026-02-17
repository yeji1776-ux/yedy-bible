import { createClient } from '@supabase/supabase-js';
import { ReadingPlan, ReadingHistory, DailyReflection } from '../types';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || ''
);

// ─── Reading Plan ───

export async function loadPlan(): Promise<ReadingPlan | null> {
  const { data } = await supabase
    .from('reading_plan')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  if (!data) return null;
  return {
    otBook: data.ot_book,
    otStartChapter: data.ot_start_chapter,
    ntBook: data.nt_book,
    ntStartChapter: data.nt_start_chapter,
    startDate: data.start_date,
  };
}

export async function savePlan(plan: ReadingPlan): Promise<void> {
  // 기존 계획 삭제 후 새로 저장
  await supabase.from('reading_plan').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('reading_plan').insert({
    ot_book: plan.otBook,
    ot_start_chapter: plan.otStartChapter,
    nt_book: plan.ntBook,
    nt_start_chapter: plan.ntStartChapter,
    start_date: plan.startDate,
  });
}

// ─── Reading History ───

export async function loadHistory(): Promise<ReadingHistory> {
  const { data } = await supabase.from('reading_history').select('date, completed');
  if (!data) return {};
  const history: ReadingHistory = {};
  data.forEach((row) => { history[row.date] = row.completed; });
  return history;
}

export async function markDateComplete(date: string): Promise<void> {
  await supabase.from('reading_history').upsert({ date, completed: true }, { onConflict: 'date' });
}

// ─── Reflection Cache ───

export async function loadReflectionCache(): Promise<Record<string, DailyReflection>> {
  const { data } = await supabase.from('reflection_cache').select('date, data');
  if (!data) return {};
  const cache: Record<string, DailyReflection> = {};
  data.forEach((row) => { cache[row.date] = row.data as DailyReflection; });
  return cache;
}

export async function saveReflection(date: string, reflection: DailyReflection): Promise<void> {
  await supabase.from('reflection_cache').upsert({ date, data: reflection }, { onConflict: 'date' });
}

export async function clearReflectionCache(): Promise<void> {
  await supabase.from('reflection_cache').delete().neq('id', '00000000-0000-0000-0000-000000000000');
}

export async function clearAllData(): Promise<void> {
  await Promise.all([
    supabase.from('reading_plan').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
    supabase.from('reading_history').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
    supabase.from('reflection_cache').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
  ]);
}
