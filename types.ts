
export interface Vocabulary {
  word: string;
  meaning: string;
}

export interface Figure {
  name: string;
  description: string;
}

export interface BibleSection {
  range: string;
  background: string;
  vocabulary: Vocabulary[];
  figures: Figure[];
  summary: string;
}

export interface DailyReflection {
  old_testament: BibleSection;
  new_testament: BibleSection;
  meditation_question: string;
}

export interface ReadingPlan {
  otBook: string;
  otStartChapter: number;
  ntBook: string;
  ntStartChapter: number;
  startDate: string; // ISO format
  otChaptersPerDay: number;
  ntChaptersPerDay: number;
  isPaused: boolean;
  pausedAt: string | null;
  totalPausedDays: number;
}

export interface Bookmark {
  id?: string;
  text: string;
  source: string;
  note?: string;
  created_at?: string;
}

export interface BibleVerse {
  verseNum: string;
  text: string;
}

export interface ExegesisItem {
  verseNum: string;
  text: string;
  explanation: string;
}

export interface DetailedExegesisResult {
  range: string;
  version: string;
  items: ExegesisItem[];
}

export interface AIState {
  loading: boolean;
  error: string | null;
  detailedExegesis: DetailedExegesisResult | null;
  reflectionResponse: string | null;
}

export interface ReadingHistory {
  [date: string]: 'success' | 'fail';
}
