import { createClient } from '@supabase/supabase-js';
import { ReadingPlan, ReadingHistory, DailyReflection, Bookmark } from '../types';

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
    otChaptersPerDay: data.ot_chapters_per_day ?? 2,
    ntChaptersPerDay: data.nt_chapters_per_day ?? 1,
    isPaused: data.is_paused ?? false,
    pausedAt: data.paused_at ?? null,
    totalPausedDays: data.total_paused_days ?? 0,
  };
}

export async function savePlan(plan: ReadingPlan): Promise<void> {
  await supabase.from('reading_plan').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('reading_plan').insert({
    ot_book: plan.otBook,
    ot_start_chapter: plan.otStartChapter,
    nt_book: plan.ntBook,
    nt_start_chapter: plan.ntStartChapter,
    start_date: plan.startDate,
    ot_chapters_per_day: plan.otChaptersPerDay,
    nt_chapters_per_day: plan.ntChaptersPerDay,
    is_paused: plan.isPaused,
    paused_at: plan.pausedAt,
    total_paused_days: plan.totalPausedDays,
  });
}

export async function updatePlanPause(isPaused: boolean, pausedAt: string | null, totalPausedDays: number): Promise<void> {
  const { data } = await supabase
    .from('reading_plan')
    .select('id')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  if (!data) return;
  await supabase.from('reading_plan').update({
    is_paused: isPaused,
    paused_at: pausedAt,
    total_paused_days: totalPausedDays,
  }).eq('id', data.id);
}

// ─── Reading History ───

export async function loadHistory(): Promise<ReadingHistory> {
  const { data } = await supabase.from('reading_history').select('date, completed');
  if (!data) return {};
  const history: ReadingHistory = {};
  data.forEach((row) => { history[row.date] = row.completed ? 'success' : 'fail'; });
  return history;
}

export async function markDateStatus(date: string, status: 'success' | 'fail'): Promise<void> {
  await supabase.from('reading_history').upsert({ date, completed: status === 'success' }, { onConflict: 'date' });
}

export async function markDatesStatus(dates: string[], status: 'success' | 'fail'): Promise<void> {
  const rows = dates.map(date => ({ date, completed: status === 'success' }));
  await supabase.from('reading_history').upsert(rows, { onConflict: 'date' });
}

// ─── Reflection Cache (최근 30일만) ───

export async function loadReflectionCache(): Promise<Record<string, DailyReflection>> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const cutoff = thirtyDaysAgo.toISOString().split('T')[0];
  const { data } = await supabase.from('reflection_cache').select('date, data').gte('date', cutoff);
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

// ─── Bookmarks ───

export async function loadBookmarks(): Promise<Bookmark[]> {
  const { data } = await supabase.from('bookmarks').select('*').order('created_at', { ascending: false });
  return data || [];
}

export async function addBookmark(bookmark: Bookmark): Promise<Bookmark> {
  const { data } = await supabase.from('bookmarks').insert({ text: bookmark.text, source: bookmark.source, note: bookmark.note }).select().single();
  return data as Bookmark;
}

export async function deleteBookmark(id: string): Promise<void> {
  await supabase.from('bookmarks').delete().eq('id', id);
}

// ─── Clear All ───

export async function clearAllData(): Promise<void> {
  await Promise.all([
    supabase.from('reading_plan').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
    supabase.from('reading_history').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
    supabase.from('reflection_cache').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
    supabase.from('bookmarks').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
  ]);
}
