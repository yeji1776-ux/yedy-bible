import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  BookOpen,
  Volume2,
  VolumeX,
  MessageCircle,
  Loader2,
  BookText,
  CheckCircle2,
  Calendar as CalendarIcon,
  X,
  ChevronLeft,
  ChevronRight,
  Settings,
  ArrowLeft,
  ArrowRight,
  Type as TypeIcon,
  Minus,
  Plus,
  Edit2,
  CalendarDays,
  Copy,
  Check,
  AlertCircle,
  RefreshCcw,
  ClipboardCheck,
  Info,
  Users,
  Languages,
  Lock,
  Bookmark,
  BookmarkCheck,
  MessageSquare,
  Trash2,
  Home,
  Hexagon,
  Palette,
  ChevronDown,
  PenLine,
  BarChart3
} from 'lucide-react';
import { DailyReflection, AIState, ReadingHistory, ReadingPlan, Bookmark as BookmarkType, ExegesisItem, BibleVerse } from './types';
import { fetchDailyReflection, streamDetailedExegesis, streamFullBibleText, getDeepReflection, playTTS, fetchWordMeaning } from './services/geminiService';
import { loadPlan, savePlan, loadHistory, markDatesStatus, loadReflectionCache, saveReflection, clearReflectionCache, clearAllData, loadBookmarks, addBookmark, deleteBookmark } from './services/supabase';

const APP_PASSWORD = '0516';


const SettingsPanel: React.FC<{
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  onEditPlan?: () => void;
  onReset: () => void;
  onClose: () => void;
}> = ({ fontSize, onFontSizeChange, onEditPlan, onReset, onClose }) => (
  <div className="fixed inset-0 z-50 bg-accent-black/40 backdrop-blur-sm flex items-end justify-center animate-in fade-in duration-200" onClick={onClose}>
    <div className="bg-bg-primary w-full max-w-2xl rounded-t-3xl p-8 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
      <div className="w-12 h-1 bg-border-light rounded-full mx-auto mb-8" />
      <div className="flex items-center gap-3 mb-8">
        <Settings className="w-5 h-5 text-accent-black" />
        <h3 className="text-xl font-black text-text-primary serif-text uppercase tracking-tighter">Application Archive Settings</h3>
      </div>

      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <TypeIcon className="w-4 h-4 text-text-tertiary" />
          <h4 className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Digital Typeface Size</h4>
        </div>
        <div className="flex items-center gap-6 bg-bg-secondary rounded-2xl p-6 border border-border-light shadow-inner">
          <button onClick={() => onFontSizeChange(Math.max(14, fontSize - 1))} disabled={fontSize <= 14} className="w-10 h-10 flex items-center justify-center bg-bg-primary border border-border-light rounded-xl text-text-secondary hover:border-accent-black transition-all disabled:opacity-30"><Minus className="w-4 h-4" /></button>
          <div className="flex-1 text-center">
            <span className="text-2xl font-mono font-black text-text-primary tabular-nums">{fontSize}pt</span>
          </div>
          <button onClick={() => onFontSizeChange(Math.min(24, fontSize + 1))} disabled={fontSize >= 24} className="w-10 h-10 flex items-center justify-center bg-bg-primary border border-border-light rounded-xl text-text-secondary hover:border-accent-black transition-all disabled:opacity-30"><Plus className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-border-light">
        {onEditPlan && (
          <button onClick={() => { onEditPlan(); onClose(); }} className="btn-analogue w-full flex items-center justify-center gap-2 hover:bg-accent-black hover:text-white transition-all">
            <Edit2 className="w-4 h-4" /> MODIFY READING ARCHIVE
          </button>
        )}
        <button
          onClick={() => { if (confirm("모든 데이터를 초기화하시겠습니까?")) onReset(); }}
          className="w-full bg-bg-primary text-accent-red py-4 rounded-full font-bold text-[10px] hover:bg-accent-red/5 transition-all border border-accent-red/20 uppercase tracking-widest"
        >
          RESET ALL ARCHIVAL DATA
        </button>
      </div>
    </div>
  </div>
);

const PasswordGate: React.FC<{ onAuth: () => void }> = ({ onAuth }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === APP_PASSWORD) {
      sessionStorage.setItem('yedy_bible_auth', 'true');
      onAuth();
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-6 bg-secondary">
      <div className={`w-full max-w-sm ${shake ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
        <div className="sticker-card mb-10 text-center">
          <div className="bg-bg-paper w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-border-light shadow-inner">
            <BookText className="w-10 h-10 text-accent-blue" />
          </div>
          <h1 className="text-3xl font-black text-text-primary tracking-tight serif-text">Yedy's Bible</h1>
          <p className="text-text-tertiary text-xs mt-3 uppercase tracking-widest font-bold">Personal Archive · Daily Journey</p>

          <form onSubmit={handleSubmit} className="space-y-4 mt-10">
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(false); }}
                placeholder="ACCESS CODE"
                className={`w-full pl-11 pr-4 py-4 bg-bg-primary border rounded-xl text-sm font-mono outline-none transition-all ${error ? 'border-accent-red focus:ring-1 focus:ring-accent-red' : 'border-border-light focus:border-accent-black'
                  }`}
                autoFocus
              />
            </div>
            {error && <p className="text-accent-red text-[10px] font-black tracking-widest text-center uppercase">INVALID CODE</p>}
            <button
              type="submit"
              className="btn-analogue w-full"
            >
              AUTHENTICATE
            </button>
          </form>
        </div>
      </div>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
      `}</style>
    </div>
  );
};

const BIBLE_METADATA = {
  OT: [
    { name: "창세기", chapters: 50 }, { name: "출애굽기", chapters: 40 }, { name: "레위기", chapters: 27 },
    { name: "민수기", chapters: 36 }, { name: "신명기", chapters: 34 }, { name: "여호수아", chapters: 24 },
    { name: "사사기", chapters: 21 }, { name: "룻기", chapters: 4 }, { name: "사무엘상", chapters: 31 },
    { name: "사무엘하", chapters: 24 }, { name: "열왕기상", chapters: 22 }, { name: "열왕기하", chapters: 25 },
    { name: "역대상", chapters: 29 }, { name: "역대하", chapters: 36 }, { name: "에스라", chapters: 10 },
    { name: "느헤미야", chapters: 13 }, { name: "에스더", chapters: 10 }, { name: "욥기", chapters: 42 },
    { name: "시편", chapters: 150 }, { name: "잠언", chapters: 31 }, { name: "전도서", chapters: 12 },
    { name: "아가", chapters: 8 }, { name: "이사야", chapters: 66 }, { name: "예레미야", chapters: 52 },
    { name: "예레미야애가", chapters: 5 }, { name: "에스겔", chapters: 48 }, { name: "다니엘", chapters: 12 },
    { name: "호세아", chapters: 14 }, { name: "요엘", chapters: 3 }, { name: "아모스", chapters: 9 },
    { name: "오바댜", chapters: 1 }, { name: "요나", chapters: 4 }, { name: "미가", chapters: 7 },
    { name: "나훔", chapters: 3 }, { name: "하박국", chapters: 3 }, { name: "스바냐", chapters: 3 },
    { name: "학개", chapters: 2 }, { name: "스가랴", chapters: 14 }, { name: "말라기", chapters: 4 }
  ],
  NT: [
    { name: "마태복음", chapters: 28 }, { name: "마가복음", chapters: 16 }, { name: "누가복음", chapters: 24 },
    { name: "요한복음", chapters: 21 }, { name: "사도행전", chapters: 28 }, { name: "로마서", chapters: 16 },
    { name: "고린도전서", chapters: 16 }, { name: "고린도후서", chapters: 13 }, { name: "갈라디아서", chapters: 6 },
    { name: "에베소서", chapters: 6 }, { name: "빌립보서", chapters: 4 }, { name: "골로새서", chapters: 4 },
    { name: "데살로니가전서", chapters: 5 }, { name: "데살로니가후서", chapters: 3 }, { name: "디모데전서", chapters: 6 },
    { name: "디모데후서", chapters: 4 }, { name: "디도서", chapters: 3 }, { name: "빌레몬서", chapters: 1 },
    { name: "히브리서", chapters: 13 }, { name: "야고보서", chapters: 5 }, { name: "베드로전서", chapters: 5 },
    { name: "베드로후서", chapters: 3 }, { name: "요한일서", chapters: 5 }, { name: "요한이서", chapters: 1 },
    { name: "요한삼서", chapters: 1 }, { name: "유다서", chapters: 1 }, { name: "요한계시록", chapters: 22 }
  ]
};

const getReadingPortion = (books: { name: string; chapters: number }[], startBookName: string, startChapter: number, dayDiff: number, chaptersPerDay: number) => {
  if (!books || books.length === 0) return "데이터 오류";
  let startIndex = books.findIndex(b => b.name === startBookName);
  if (startIndex === -1) startIndex = 0;
  let totalChaptersFromStart = (dayDiff * chaptersPerDay);
  let currentBookIndex = startIndex;
  let currentChapter = startChapter + totalChaptersFromStart;
  while (currentBookIndex < books.length && currentChapter > books[currentBookIndex].chapters) {
    currentChapter -= books[currentBookIndex].chapters;
    currentBookIndex++;
  }
  if (currentBookIndex >= books.length) return "통독 완료";
  const startBook = books[currentBookIndex].name;
  const startCh = currentChapter;
  if (chaptersPerDay > 1) {
    let endBookIndex = currentBookIndex;
    let endChapter = currentChapter + (chaptersPerDay - 1);
    while (endBookIndex < books.length && endChapter > books[endBookIndex].chapters) {
      endChapter -= books[endBookIndex].chapters;
      endBookIndex++;
    }
    if (endBookIndex >= books.length) return `${startBook} ${startCh}장 - 통독 끝`;
    if (startBook === books[endBookIndex].name) {
      if (startCh === endChapter) return `${startBook} ${startCh}장`;
      return `${startBook} ${startCh}-${endChapter}장`;
    } else {
      return `${startBook} ${startCh}장 - ${books[endBookIndex].name} ${endChapter}장`;
    }
  }
  return `${startBook} ${startCh}장`;
};

const Header: React.FC<{
  onSettings?: () => void,
  onShowBookmarks?: () => void,
  onShowChat?: () => void,
  onRefresh?: () => void,
}> = ({ onSettings, onShowBookmarks, onShowChat, onRefresh }) => {
  return (
    <header className="bg-bg-primary border-b border-border-light sticky top-0 z-40">
      <div className="max-w-2xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onRefresh ? onRefresh() : window.location.reload()}>
          <div className="w-8 h-8 bg-accent-black flex items-center justify-center rounded">
            <span className="text-white font-mono text-sm font-bold">Y</span>
          </div>
          <div>
            <h1 className="text-base font-black text-text-primary tracking-tight serif-text">Yedy's Bible</h1>
            <p className="text-[9px] font-bold text-text-tertiary uppercase tracking-tighter -mt-1">Volume. 01</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onShowChat && (
            <button onClick={onShowChat} className="p-2 text-text-secondary hover:text-accent-black transition-colors" title="AI 상담">
              <MessageSquare className="w-4 h-4" />
            </button>
          )}
          {onShowBookmarks && (
            <button onClick={onShowBookmarks} className="p-2 text-text-secondary hover:text-accent-black transition-colors" title="북마크">
              <Bookmark className="w-4 h-4" />
            </button>
          )}
          <div className="divider-pipe h-4" />
          {onSettings && (
            <button onClick={onSettings} className="p-2 text-text-secondary hover:text-accent-black transition-colors" title="설정">
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

const Calendar: React.FC<{
  history: ReadingHistory;
  selectedDates: Set<string>;
  onToggleDate: (dateStr: string) => void;
  onAddDates: (dates: string[]) => void;
  onMarkStatus: (status: 'success' | 'fail') => void;
  onClearSelection: () => void;
}> = ({ history, selectedDates, onToggleDate, onAddDates, onMarkStatus, onClearSelection }) => {
  const [viewDate, setViewDate] = useState(new Date());
  const [showStats, setShowStats] = useState(false);
  const isDraggingRef = useRef(false);
  const dragDatesRef = useRef<Set<string>>(new Set());
  const lastDateRef = useRef<string | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const getMonthlyStats = () => {
    const stats: Array<{ year: number; month: number; success: number; fail: number; total: number; rate: number }> = [];
    const months = new Set<string>();
    Object.keys(history).forEach(d => months.add(d.slice(0, 7)));
    const now = `${year}-${String(month + 1).padStart(2, '0')}`;
    months.add(now);
    Array.from(months).sort((a, b) => a.localeCompare(b)).forEach(ym => {
      const [y, m] = ym.split('-').map(Number);
      const dim = new Date(y, m, 0).getDate();
      let success = 0, fail = 0;
      for (let d = 1; d <= dim; d++) {
        const ds = `${ym}-${String(d).padStart(2, '0')}`;
        if (history[ds] === 'success') success++;
        else if (history[ds] === 'fail') fail++;
      }
      const total = success + fail;
      const rate = total > 0 ? Math.round((success / total) * 100) : 0;
      stats.push({ year: y, month: m, success, fail, total, rate });
    });
    return stats;
  };
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);
  const isToday = (d: number) => {
    const today = new Date();
    return today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
  };

  const getDateFromPoint = (x: number, y: number): string | null => {
    const el = document.elementFromPoint(x, y);
    if (!el) return null;
    const btn = el.closest('[data-date]') as HTMLElement | null;
    return btn?.dataset.date || null;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const dateStr = getDateFromPoint(touch.clientX, touch.clientY);
    if (!dateStr) return;
    isDraggingRef.current = false;
    dragDatesRef.current = new Set();
    lastDateRef.current = dateStr;
    longPressTimerRef.current = setTimeout(() => {
      isDraggingRef.current = true;
      dragDatesRef.current.add(dateStr);
      if (navigator.vibrate) navigator.vibrate(30);
    }, 400);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      return;
    }
    e.preventDefault();
    const touch = e.touches[0];
    const dateStr = getDateFromPoint(touch.clientX, touch.clientY);
    if (!dateStr || dateStr === lastDateRef.current) return;
    lastDateRef.current = dateStr;
    dragDatesRef.current.add(dateStr);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (isDraggingRef.current) {
      const dates = Array.from(dragDatesRef.current);
      if (dates.length > 0) onAddDates(dates);
    } else if (lastDateRef.current) {
      onToggleDate(lastDateRef.current);
    }
    isDraggingRef.current = false;
    dragDatesRef.current.clear();
    lastDateRef.current = null;
  };

  return (
    <div className="bg-bg-primary rounded-xl border border-border-light p-6 mt-10 shadow-subtle paper-texture">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3 text-text-primary">
          <CalendarIcon className="w-4 h-4 text-accent-blue" />
          <h3 className="font-black text-xs uppercase tracking-widest">{year}. {String(month + 1).padStart(2, '0')} ARCHIVE</h3>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowStats(s => !s)} className={`p-2 rounded-full transition-colors ${showStats ? 'bg-accent-black text-white' : 'hover:bg-bg-secondary text-text-tertiary'}`} title="Monthly Achievement"><BarChart3 className="w-4 h-4" /></button>
          <button onClick={() => setViewDate(new Date(year, month - 1))} className="p-2 hover:bg-bg-secondary rounded-full transition-colors"><ChevronLeft className="w-4 h-4 text-text-secondary" /></button>
          <button onClick={() => setViewDate(new Date(year, month + 1))} className="p-2 hover:bg-bg-secondary rounded-full transition-colors"><ChevronRight className="w-4 h-4 text-text-secondary" /></button>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6 text-[9px] font-black text-text-tertiary uppercase tracking-widest">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-accent-blue rounded-full" /> ACCOMPLISHED</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-accent-red rounded-full" /> PENDING</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-bg-secondary border border-border-light rounded-full" /> UNRECORDED</span>
      </div>

      {showStats && (
        <div className="mb-6 bg-bg-secondary rounded-2xl p-5 border border-border-light animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-accent-black" />
            <h4 className="text-[10px] font-black text-text-primary uppercase tracking-widest">ACHIEVEMENT RATE</h4>
          </div>
          <div className="space-y-4 max-h-52 overflow-y-auto pr-2">
            {getMonthlyStats().map(s => (
              <div key={`${s.year}-${s.month}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-black text-text-secondary">{s.year} / {String(s.month).padStart(2, '0')}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] text-text-tertiary font-bold tracking-tighter">{s.success} OK / {s.fail} NO</span>
                    <span className={`text-[10px] font-black font-mono ${s.rate >= 80 ? 'text-accent-blue' : s.rate >= 50 ? 'text-accent-yellow' : 'text-accent-red'}`}>{s.rate}%</span>
                  </div>
                </div>
                <div className="h-1 bg-border-light rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${s.rate >= 80 ? 'bg-accent-blue' : s.rate >= 50 ? 'bg-accent-yellow' : 'bg-accent-red'}`}
                    style={{ width: `${s.rate}%` }}
                  />
                </div>
              </div>
            ))}
            {getMonthlyStats().length === 0 && (
              <p className="text-[10px] text-text-tertiary text-center py-4 font-bold uppercase tracking-widest">NO RECORDS FOUND</p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-black text-text-tertiary mb-4 uppercase tracking-tighter">
        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => <div key={d}>{d}</div>)}
      </div>
      <div
        className="grid grid-cols-7 gap-2 touch-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {days.map((day, idx) => {
          if (day === null) return <div key={idx} />;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const status = history[dateStr];
          const isSelectedDate = selectedDates.has(dateStr);
          const isTodayDate = isToday(day);

          return (
            <div
              key={idx}
              data-date={dateStr}
              onPointerUp={(e) => { if (e.pointerType === 'mouse') onToggleDate(dateStr); }}
              className={`aspect-square flex flex-col items-center justify-center rounded-lg text-[10px] font-mono transition-all relative cursor-pointer select-none
                ${isSelectedDate ? 'ring-1 ring-accent-black ring-offset-2 z-10 scale-110' : ''}
                ${status === 'success' ? 'bg-accent-blue text-white font-bold' :
                  status === 'fail' ? 'bg-accent-red text-white font-bold' :
                    'bg-bg-secondary text-text-secondary hover:border-border-dark hover:bg-bg-primary border border-transparent'}
                ${isTodayDate && !status ? 'border-accent-black/30' : ''}
              `}
            >
              {day}
              {isTodayDate && !status && <div className="absolute top-1 right-1 w-1 h-1 bg-accent-black rounded-full" />}
            </div>
          );
        })}
      </div>

      {selectedDates.size > 0 && (
        <div className="mt-8 bg-bg-secondary rounded-xl p-5 border border-border-light animate-in fade-in slide-in-from-bottom-2 duration-300 sticker-card">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black text-text-primary tracking-widest uppercase">{selectedDates.size} DAYS COPIED</span>
            <button onClick={onClearSelection} className="text-[9px] font-black text-text-tertiary hover:text-accent-black transition-colors uppercase tracking-widest">CLEAR ALL</button>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => onMarkStatus('success')}
              className="flex-1 bg-accent-blue text-white py-3.5 rounded-full font-black text-[10px] flex items-center justify-center gap-2 hover:opacity-90 transition-all uppercase tracking-widest"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> LOG SUCCESS
            </button>
            <button
              onClick={() => onMarkStatus('fail')}
              className="flex-1 bg-accent-red text-white py-3.5 rounded-full font-black text-[10px] flex items-center justify-center gap-2 hover:opacity-90 transition-all uppercase tracking-widest"
            >
              <X className="w-3.5 h-3.5" /> LOG FAILURE
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const SetupView: React.FC<{ currentPlan?: ReadingPlan | null, onSave: (p: ReadingPlan) => void, onCancel?: () => void }> = ({ currentPlan, onSave, onCancel }) => {
  const [otBook, setOtBook] = useState(currentPlan?.otBook || "창세기");
  const [otStart, setOtStart] = useState(currentPlan?.otStartChapter || 1);
  const [ntBook, setNtBook] = useState(currentPlan?.ntBook || "마태복음");
  const [ntStart, setNtStart] = useState(currentPlan?.ntStartChapter || 1);
  const [otPerDay, setOtPerDay] = useState(currentPlan?.otChaptersPerDay || 2);
  const [ntPerDay, setNtPerDay] = useState(currentPlan?.ntChaptersPerDay || 1);
  const [startDate, setStartDate] = useState(currentPlan?.startDate ? new Date(currentPlan.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);

  return (
    <div className="max-w-md mx-auto p-8 space-y-12 animate-in fade-in zoom-in-95 duration-500">
      <div className="text-center space-y-4">
        <div className="bg-bg-paper w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-2 shadow-subtle border border-border-light sticker-card after:content-none before:left-1/2 before:-translate-x-1/2 before:w-12 before:top-[-10px]">
          <BookOpen className="w-12 h-12 text-accent-blue" />
        </div>
        <h2 className="text-3xl font-black text-text-primary serif-text uppercase tracking-tighter">{currentPlan ? "Archive Modification" : "Initialize Archive"}</h2>
        <p className="text-text-tertiary text-[10px] font-black leading-relaxed px-6 uppercase tracking-widest">Define your spiritual research parameters and start date.</p>
      </div>

      <div className="space-y-10">
        <div className="space-y-4">
          <h3 className="font-black text-[10px] text-text-tertiary uppercase tracking-widest px-1 flex items-center gap-2"><CalendarDays className="w-3.5 h-3.5" /> MISSION COMMENCEMENT</h3>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="w-full bg-bg-primary border border-border-light rounded-2xl px-5 py-4 text-sm font-mono font-bold outline-none focus:border-accent-black transition-all shadow-subtle"
          />
        </div>

        <div className="space-y-5">
          <h3 className="font-black text-[10px] text-text-tertiary uppercase tracking-widest px-1">OLD TESTAMENT PARAMETERS</h3>
          <div className="grid grid-cols-2 gap-4">
            <select value={otBook} onChange={e => setOtBook(e.target.value)} className="bg-bg-primary border border-border-light rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-accent-black transition-all shadow-subtle">
              {(BIBLE_METADATA.OT || []).map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
            </select>
            <div className="relative">
              <input type="number" value={otStart} onChange={e => setOtStart(parseInt(e.target.value) || 1)} className="w-full bg-bg-primary border border-border-light rounded-2xl px-5 py-4 text-sm font-mono font-bold outline-none focus:border-accent-black transition-all shadow-subtle" />
              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[9px] font-black text-text-tertiary uppercase tracking-tighter">START CH</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[10px] text-text-tertiary font-black uppercase tracking-widest">CHAPTERS / DAY</span>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => setOtPerDay(n)}
                  className={`w-10 h-10 rounded-xl text-xs font-mono font-black transition-all ${otPerDay === n ? 'bg-accent-black text-white shadow-xl' : 'bg-bg-secondary text-text-secondary hover:bg-border-light'}`}
                >{n}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <h3 className="font-black text-[10px] text-text-tertiary uppercase tracking-widest px-1">NEW TESTAMENT PARAMETERS</h3>
          <div className="grid grid-cols-2 gap-4">
            <select value={ntBook} onChange={e => setNtBook(e.target.value)} className="bg-bg-primary border border-border-light rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-accent-black transition-all shadow-subtle">
              {(BIBLE_METADATA.NT || []).map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
            </select>
            <div className="relative">
              <input type="number" value={ntStart} onChange={e => setNtStart(parseInt(e.target.value) || 1)} className="w-full bg-bg-primary border border-border-light rounded-2xl px-5 py-4 text-sm font-mono font-bold outline-none focus:border-accent-black transition-all shadow-subtle" />
              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[9px] font-black text-text-tertiary uppercase tracking-tighter">START CH</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[10px] text-text-tertiary font-black uppercase tracking-widest">CHAPTERS / DAY</span>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => setNtPerDay(n)}
                  className={`w-10 h-10 rounded-xl text-xs font-mono font-black transition-all ${ntPerDay === n ? 'bg-accent-black text-white shadow-xl' : 'bg-bg-secondary text-text-secondary hover:bg-border-light'}`}
                >{n}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 pt-4">
          <button
            onClick={() => onSave({ otBook, otStartChapter: otStart, ntBook, ntStartChapter: ntStart, startDate: new Date(startDate).toISOString(), otChaptersPerDay: otPerDay, ntChaptersPerDay: ntPerDay, isPaused: false, pausedAt: null, totalPausedDays: currentPlan?.totalPausedDays || 0 })}
            className="btn-analogue w-full py-5 text-[10px] tracking-[0.2em] font-black bg-accent-black text-white"
          >
            {currentPlan ? "UPDATE ARCHIVE" : "COMMENCE JOURNEY"}
          </button>
          {onCancel && (
            <button
              onClick={onCancel}
              className="w-full bg-transparent text-text-tertiary py-3.5 rounded-2xl font-black text-[10px] hover:text-accent-black transition-all uppercase tracking-widest"
            >
              DISCARD CHANGES
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const BookmarkPanel: React.FC<{
  bookmarks: BookmarkType[],
  onDelete: (id: string) => void,
  onClose: () => void,
  fontSize: number,
  savedWords: Record<string, Array<{ word: string; meaning: string }>>,
  onDeleteWord: (dateStr: string, word: string) => void
}> = ({ bookmarks, onDelete, onClose, fontSize, savedWords, onDeleteWord }) => {
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'words'>('bookmarks');

  const groupedBookmarks = bookmarks.reduce((acc: Record<string, BookmarkType[]>, bm) => {
    const dateKey = bm.created_at ? new Date(bm.created_at).toISOString().split('T')[0] : 'unknown';
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(bm);
    return acc;
  }, {});
  const sortedBmDates = Object.keys(groupedBookmarks).sort((a, b) => b.localeCompare(a));
  const sortedWordDates = Object.keys(savedWords).filter(k => savedWords[k].length > 0).sort((a, b) => b.localeCompare(a));

  const formatDateHeader = (dateStr: string) => {
    if (dateStr === 'unknown') return 'DATE UNKNOWN';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
  };

  const totalWords = sortedWordDates.reduce((sum, d) => sum + savedWords[d].length, 0);

  return (
    <div className="fixed inset-0 z-50 bg-bg-secondary overflow-hidden flex flex-col animate-in slide-in-from-right duration-300">
      <header className="bg-bg-primary border-b border-border-light p-6 sticky top-0 z-10 flex items-center justify-between shadow-subtle">
        <div>
          <h3 className="text-xl font-black text-text-primary serif-text uppercase tracking-tighter">Personal Library</h3>
          <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Archived Wisdom & Terms</p>
        </div>
        <button onClick={onClose} className="p-3 hover:bg-bg-secondary rounded-full transition-colors border border-border-light shadow-subtle"><X className="w-5 h-5" /></button>
      </header>

      <div className="flex bg-bg-primary border-b border-border-light shrink-0">
        <button
          onClick={() => setActiveTab('bookmarks')}
          className={`flex-1 py-4 text-[10px] font-black text-center transition-all relative uppercase tracking-[0.2em] ${activeTab === 'bookmarks' ? 'text-accent-black' : 'text-text-tertiary opacity-50'}`}
        >
          <span className="inline-flex items-center gap-2">
            <BookmarkCheck className="w-3.5 h-3.5" /> bookmarks
            <span className="text-[9px] font-black text-white bg-accent-black px-1.5 py-0.5 rounded-full">{bookmarks.length}</span>
          </span>
          {activeTab === 'bookmarks' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-accent-black" />}
        </button>
        <button
          onClick={() => setActiveTab('words')}
          className={`flex-1 py-4 text-[10px] font-black text-center transition-all relative uppercase tracking-[0.2em] ${activeTab === 'words' ? 'text-accent-black' : 'text-text-tertiary opacity-50'}`}
        >
          <span className="inline-flex items-center gap-2">
            <Languages className="w-3.5 h-3.5" /> dictionary
            <span className="text-[9px] font-black text-white bg-accent-black px-1.5 py-0.5 rounded-full">{totalWords}</span>
          </span>
          {activeTab === 'words' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-accent-black" />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-secondary paper-texture">
        {activeTab === 'bookmarks' ? (
          bookmarks.length === 0 ? (
            <div className="py-24 text-center">
              <div className="w-16 h-16 bg-bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6 border border-border-light shadow-inner sticker-card">
                <Bookmark className="w-8 h-8 text-text-tertiary opacity-30" />
              </div>
              <p className="font-black text-xs text-text-tertiary uppercase tracking-widest leading-loose text-center">Library currently vacant.<br />Start archiving verses to see them here.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {sortedBmDates.map(dateStr => (
                <div key={dateStr}>
                  <div className="flex items-center gap-3 mb-4">
                    <CalendarDays className="w-3.5 h-3.5 text-text-tertiary" />
                    <h4 className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">{formatDateHeader(dateStr)}</h4>
                  </div>
                  <div className="space-y-4">
                    {groupedBookmarks[dateStr].map((bm) => (
                      <div key={bm.id} className="sticker-card pb-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <span className="badge-archival mb-3">{bm.source}</span>
                            <p className="font-bold text-text-primary mt-2 leading-relaxed serif-text" style={{ fontSize: `${fontSize}px` }}>{bm.text}</p>
                            {bm.note && (
                              <div className="mt-4 p-4 bg-bg-paper border-l-2 border-accent-black rounded-r-lg italic text-text-secondary" style={{ fontSize: `${fontSize - 2}px` }}>
                                "{bm.note}"
                              </div>
                            )}
                          </div>
                          <button onClick={() => bm.id && onDelete(bm.id)} className="p-2 text-text-tertiary hover:text-accent-red transition-colors shrink-0">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          sortedWordDates.length === 0 ? (
            <div className="py-24 text-center">
              <div className="w-16 h-16 bg-bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6 border border-border-light shadow-inner sticker-card">
                <Languages className="w-8 h-8 text-text-tertiary opacity-30" />
              </div>
              <p className="font-black text-xs text-text-tertiary uppercase tracking-widest leading-loose text-center">Archives empty.<br />Add important terms from the text.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {sortedWordDates.map(dateStr => (
                <div key={dateStr}>
                  <div className="flex items-center gap-3 mb-4">
                    <CalendarDays className="w-3.5 h-3.5 text-text-tertiary" />
                    <h4 className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">{formatDateHeader(dateStr)}</h4>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {savedWords[dateStr].map((w, idx) => (
                      <div key={idx} className="sticker-card flex items-start justify-between gap-4 py-4 px-6">
                        <div className="flex-1">
                          <span className="text-xs font-black text-accent-blue font-mono tracking-tighter bg-bg-paper px-2 py-0.5 rounded border border-border-light">{w.word}</span>
                          <p className="text-text-secondary text-xs leading-relaxed mt-3 font-medium serif-text">{w.meaning}</p>
                        </div>
                        <button onClick={() => onDeleteWord(dateStr, w.word)} className="p-2 text-text-tertiary hover:text-accent-red transition-colors shrink-0">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};

const MiniCalendar: React.FC<{
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onClose: () => void;
}> = ({ selectedDate, onSelectDate, onClose }) => {
  const [viewDate, setViewDate] = useState(new Date(selectedDate));
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const isSelected = (d: number) => {
    return selectedDate.getFullYear() === year && selectedDate.getMonth() === month && selectedDate.getDate() === d;
  };
  const isToday = (d: number) => {
    const today = new Date();
    return today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
  };

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-black/20" />
      <div className="absolute top-28 left-1/2 -translate-x-1/2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setViewDate(new Date(year, month - 1))} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><ChevronLeft className="w-4 h-4 text-gray-500" /></button>
          <span className="text-sm font-bold text-gray-900">{year}년 {month + 1}월</span>
          <button onClick={() => setViewDate(new Date(year, month + 1))} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><ChevronRight className="w-4 h-4 text-gray-500" /></button>
        </div>
        <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] font-bold text-gray-400 mb-1">
          {['일', '월', '화', '수', '목', '금', '토'].map(d => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {days.map((day, idx) => {
            if (day === null) return <div key={idx} />;
            return (
              <button
                key={idx}
                onClick={() => {
                  onSelectDate(new Date(year, month, day));
                  onClose();
                }}
                className={`aspect-square flex items-center justify-center rounded-lg text-xs font-semibold transition-all
                  ${isSelected(day) ? 'bg-blue-600 text-white font-bold' : isToday(day) ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-700 hover:bg-gray-100'}
                `}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const Dashboard: React.FC<{
  plan: ReadingPlan;
  onStartReading: () => void;
  todayOtRange: string;
  todayNtRange: string;
  effectiveDayDiff: number;
  otColor: string;
  ntColor: string;
}> = ({ plan, onStartReading, todayOtRange, todayNtRange, effectiveDayDiff, otColor, ntColor }) => {
  const getBookProgresses = (testament: 'OT' | 'NT') => {
    const books = BIBLE_METADATA[testament];
    const startBookName = testament === 'OT' ? plan.otBook : plan.ntBook;
    const startChapter = testament === 'OT' ? plan.otStartChapter : plan.ntStartChapter;
    const chaptersPerDay = testament === 'OT' ? plan.otChaptersPerDay : plan.ntChaptersPerDay;

    let startBookIdx = books.findIndex(b => b.name === startBookName);
    if (startBookIdx === -1) startBookIdx = 0;

    let chaptersBeforeStart = 0;
    for (let i = 0; i < startBookIdx; i++) chaptersBeforeStart += books[i].chapters;

    const totalRead = chaptersBeforeStart + (startChapter - 1) + Math.max(0, effectiveDayDiff) * chaptersPerDay;

    let cumulative = 0;
    return books.map(book => {
      const bookStart = cumulative;
      cumulative += book.chapters;
      const readInBook = Math.max(0, Math.min(book.chapters, totalRead - bookStart));
      const progress = readInBook / book.chapters;
      return { name: book.name, firstChar: book.name[0], progress };
    });
  };

  const getCurrentPosition = (testament: 'OT' | 'NT') => {
    const books = BIBLE_METADATA[testament];
    const startBookName = testament === 'OT' ? plan.otBook : plan.ntBook;
    const startChapter = testament === 'OT' ? plan.otStartChapter : plan.ntStartChapter;
    const chaptersPerDay = testament === 'OT' ? plan.otChaptersPerDay : plan.ntChaptersPerDay;

    let startIndex = books.findIndex(b => b.name === startBookName);
    if (startIndex === -1) startIndex = 0;
    let currentChapter = startChapter + Math.max(0, effectiveDayDiff) * chaptersPerDay;
    let currentBookIndex = startIndex;
    while (currentBookIndex < books.length && currentChapter > books[currentBookIndex].chapters) {
      currentChapter -= books[currentBookIndex].chapters;
      currentBookIndex++;
    }
    if (currentBookIndex >= books.length) return { text: "COMPLETED", bookName: "" };
    return { text: `${books[currentBookIndex].name} CH. ${currentChapter}`, bookName: books[currentBookIndex].name };
  };

  const otBooks = getBookProgresses('OT');
  const ntBooks = getBookProgresses('NT');
  const otPos = getCurrentPosition('OT');
  const ntPos = getCurrentPosition('NT');

  const BookGrid: React.FC<{ books: { name: string; firstChar: string; progress: number }[]; currentBookName: string; color: string }> = ({ books, currentBookName, color }) => (
    <div className="flex flex-wrap gap-1.5">
      {books.map((book, i) => {
        const isCurrent = book.name === currentBookName;
        let bg, text, border;
        if (book.progress >= 1) {
          bg = `bg-${color}`;
          text = 'text-white';
          border = `border-${color}`;
        } else if (book.progress > 0) {
          bg = `bg-bg-paper`;
          text = `text-${color}`;
          border = `border-${color}`;
        } else {
          bg = 'bg-bg-secondary';
          text = 'text-text-tertiary';
          border = 'border-border-light';
        }
        return (
          <div
            key={i}
            title={`${book.name} (${Math.round(book.progress * 100)}%)`}
            className={`w-7 h-7 rounded flex items-center justify-center text-[10px] font-black transition-all border ${bg} ${text} ${border} ${isCurrent ? `ring-1 ring-offset-1 ring-accent-black` : ''}`}
          >
            {book.firstChar}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="p-8 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black text-text-primary serif-text uppercase tracking-tighter">Mission Progress</h2>
        <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">
          {effectiveDayDiff >= 0 ? `Active Phase: ${String(effectiveDayDiff + 1).padStart(3, '0')}` : 'Mission Pending'}
        </p>
      </div>

      <div className="space-y-8">
        <div className="sticker-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className={`badge-archival bg-accent-blue`}>Old Testament</span>
          </div>
          <BookGrid books={otBooks} currentBookName={otPos.bookName} color="accent-blue" />
          <div className="mt-5 pt-4 border-t border-border-light flex justify-between items-center">
            <span className="text-[9px] font-black text-text-tertiary uppercase tracking-widest">Current Position</span>
            <span className="text-xs font-black text-text-primary serif-text">{otPos.text}</span>
          </div>
        </div>

        <div className="sticker-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className={`badge-archival bg-accent-green`}>New Testament</span>
          </div>
          <BookGrid books={ntBooks} currentBookName={ntPos.bookName} color="accent-green" />
          <div className="mt-5 pt-4 border-t border-border-light flex justify-between items-center">
            <span className="text-[9px] font-black text-text-tertiary uppercase tracking-widest">Current Position</span>
            <span className="text-xs font-black text-text-primary serif-text">{ntPos.text}</span>
          </div>
        </div>
      </div>

      <div className="bg-bg-secondary rounded-xl p-6 border border-border-light paper-texture shadow-inner">
        <h3 className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-4">Assigned Reading Portfolio</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-text-tertiary uppercase tracking-tighter">Archive 01 / OT</span>
            <span className="text-sm font-black text-text-primary serif-text">{todayOtRange}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-text-tertiary uppercase tracking-tighter">Archive 02 / NT</span>
            <span className="text-sm font-black text-text-primary serif-text">{todayNtRange}</span>
          </div>
        </div>
      </div>

      <button
        onClick={onStartReading}
        className="btn-analogue w-full py-5 bg-accent-black text-white"
      >
        <BookOpen className="w-4 h-4" /> COMMENCE DAILY RESEARCH
      </button>
    </div>
  );
};

const ChatPanel: React.FC<{
  otRange: string;
  ntRange: string;
  reflection: DailyReflection | null;
  onClose: () => void;
}> = ({ otRange, ntRange, reflection, onClose }) => {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);
    const context = [
      `Range OT: ${otRange}, NT: ${ntRange}`,
      reflection?.old_testament?.summary ? `Summary OT: ${reflection.old_testament.summary}` : '',
      reflection?.new_testament?.summary ? `Summary NT: ${reflection.new_testament.summary}` : '',
    ].filter(Boolean).join('\n');
    const result = await getDeepReflection(userMsg, context);
    setMessages(prev => [...prev, { role: 'assistant', content: result || 'Failed to retrieve response.' }]);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[70] bg-accent-black/40 backdrop-blur-sm flex flex-col items-center justify-end animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-bg-primary w-full max-w-2xl rounded-t-3xl flex flex-col max-h-[85vh] animate-in slide-in-from-bottom duration-300 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-8 pb-4 border-b border-border-light">
          <div className="w-12 h-1 bg-border-light rounded-full mx-auto mb-6" />
          <div className="flex items-center gap-3">
            <MessageSquare className="w-5 h-5 text-accent-blue" />
            <h3 className="text-xl font-black text-text-primary serif-text uppercase tracking-tighter">AI Archival Consultant</h3>
          </div>
          <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mt-2">Spiritual inquisition and research assistant</p>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 paper-texture">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-bg-paper rounded-2xl flex items-center justify-center mx-auto mb-8 border border-border-light shadow-inner sticker-card after:content-none before:left-1/2 before:-translate-x-1/2 before:w-10 before:top-[-8px]">
                <MessageSquare className="w-8 h-8 text-text-tertiary opacity-30" />
              </div>
              <p className="text-xs font-black text-text-tertiary uppercase tracking-widest mb-8">Initiate research parameters</p>
              <div className="grid grid-cols-1 gap-3">
                {['Historical background of the text?', 'Primary theological implications?', 'Sociological context of the era?'].map((q, i) => (
                  <button key={i} onClick={() => setInput(q)} className="block w-full text-left text-[10px] font-black text-text-secondary bg-bg-primary border border-border-light hover:border-accent-black px-5 py-3 rounded-xl transition-all uppercase tracking-widest shadow-subtle">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] px-6 py-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user'
                ? 'bg-accent-black text-white font-bold rounded-br-sm shadow-card'
                : 'bg-bg-paper text-text-primary font-medium rounded-bl-sm border border-border-light serif-text'
                }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-bg-paper p-4 rounded-2xl rounded-bl-sm border border-border-light">
                <Loader2 className="w-4 h-4 text-text-tertiary animate-spin" />
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-border-light bg-bg-secondary">
          <div className="flex gap-3">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Inquire here..."
              className="flex-1 bg-bg-primary border border-border-light rounded-xl px-5 py-4 text-sm font-bold outline-none focus:border-accent-black shadow-subtle"
              autoFocus
            />
            <button onClick={handleSend} disabled={loading || !input.trim()} className="btn-analogue bg-accent-black text-white px-6">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'SEND'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AskPanel: React.FC<{ text: string, source: string, onClose: () => void }> = ({ text, source, onClose }) => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!question.trim()) return;
    setLoading(true);
    const result = await getDeepReflection(question, `Text: ${source} - "${text}"`);
    setAnswer(result);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[70] bg-accent-black/40 backdrop-blur-sm flex items-end justify-center animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-bg-primary w-full max-w-2xl rounded-t-3xl p-8 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-300 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="w-12 h-1 bg-border-light rounded-full mx-auto mb-8" />
        <div className="bg-bg-paper rounded-xl p-6 mb-8 border border-border-light paper-texture sticker-card after:content-none before:top-[-10px] before:left-1/2 before:-translate-x-1/2 before:w-16">
          <span className="badge-archival mb-3">{source}</span>
          <p className="text-sm font-black text-text-primary mt-2 serif-text italic">"{text}"</p>
        </div>
        <div className="flex gap-3">
          <input
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAsk()}
            placeholder="Inquire about this passage..."
            className="flex-1 bg-bg-primary border border-border-light rounded-xl px-5 py-4 text-sm font-bold outline-none focus:border-accent-black shadow-subtle"
            autoFocus
          />
          <button onClick={handleAsk} disabled={loading} className="btn-analogue bg-accent-black text-white px-6">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'INQUIRE'}
          </button>
        </div>
        {answer && (
          <div className="mt-8 bg-bg-paper rounded-xl p-8 border border-border-light text-sm text-text-primary leading-relaxed whitespace-pre-wrap font-medium serif-text shadow-inner">
            {answer}
          </div>
        )}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [isAuthed, setIsAuthed] = useState(() => sessionStorage.getItem('yedy_bible_auth') === 'true');
  const [plan, setPlan] = useState<ReadingPlan | null>(null);
  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const [history, setHistory] = useState<ReadingHistory>({});
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [reflection, setReflection] = useState<DailyReflection | null>(null);
  const [aiState, setAiState] = useState<AIState>({ loading: false, error: null, detailedExegesis: null, reflectionResponse: null });
  const [fontSize, setFontSize] = useState<number>(16);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [askContext, setAskContext] = useState<{ text: string; source: string } | null>(null);
  const [streamingExegesis, setStreamingExegesis] = useState<{ range: string; version: string; items: ExegesisItem[]; done: boolean } | null>(null);
  const [fullBibleText, setFullBibleText] = useState<{ range: string; version: string; verses: BibleVerse[]; done: boolean } | null>(null);
  const [currentView, setCurrentView] = useState<'home' | 'reading'>('home');
  const [showMiniCalendar, setShowMiniCalendar] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [savedWords, setSavedWords] = useState<Record<string, Array<{ word: string; meaning: string }>>>(() => {
    try { const s = localStorage.getItem('bible_saved_words'); return s ? JSON.parse(s) : {}; } catch { return {}; }
  });
  const handleSaveWord = (word: string, meaning: string) => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    setSavedWords(prev => {
      const dayWords = prev[dateStr] || [];
      if (dayWords.some(w => w.word === word)) return prev;
      const next = { ...prev, [dateStr]: [...dayWords, { word, meaning }] };
      localStorage.setItem('bible_saved_words', JSON.stringify(next));
      return next;
    });
  };
  const handleDeleteWord = (dateStr: string, word: string) => {
    setSavedWords(prev => {
      const dayWords = (prev[dateStr] || []).filter(w => w.word !== word);
      const next = { ...prev };
      if (dayWords.length === 0) delete next[dateStr];
      else next[dateStr] = dayWords;
      localStorage.setItem('bible_saved_words', JSON.stringify(next));
      return next;
    });
  };

  const [savedNotes, setSavedNotes] = useState<Record<string, { old?: string; new?: string }>>(() => {
    try { const s = localStorage.getItem('bible_saved_notes'); return s ? JSON.parse(s) : {}; } catch { return {}; }
  });
  const handleSaveNote = (type: 'old' | 'new', note: string) => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    setSavedNotes(prev => {
      const dayNotes = prev[dateStr] || {};
      const next = { ...prev, [dateStr]: { ...dayNotes, [type]: note } };
      localStorage.setItem('bible_saved_notes', JSON.stringify(next));
      return next;
    });
  };

  const reflectionCacheRef = useRef<Record<string, DailyReflection>>({});
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    if (!isAuthed) return;
    (async () => {
      const [savedPlan, savedHistory, savedCache, savedBookmarks] = await Promise.all([
        loadPlan(),
        loadHistory(),
        loadReflectionCache(),
        loadBookmarks(),
      ]);
      if (savedPlan) setPlan(savedPlan);
      setHistory(savedHistory);
      reflectionCacheRef.current = savedCache;
      setBookmarks(savedBookmarks);
      const savedFontSize = localStorage.getItem('bible_reading_font_size');
      if (savedFontSize) setFontSize(parseInt(savedFontSize));
      setDataLoaded(true);
    })();
  }, [isAuthed]);

  useEffect(() => {
    localStorage.setItem('bible_reading_font_size', fontSize.toString());
  }, [fontSize]);

  const countFailDays = useCallback((startDate: string, endDate: Date) => {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    let count = 0;
    const d = new Date(start);
    while (d < end) {
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (history[key] === 'fail') count++;
      d.setDate(d.getDate() + 1);
    }
    return count;
  }, [history]);

  const getEffectiveDayDiff = useCallback((plan: ReadingPlan) => {
    const start = new Date(plan.startDate);
    start.setHours(0, 0, 0, 0);
    const target = new Date(selectedDate);
    target.setHours(0, 0, 0, 0);
    const calendarDays = Math.round((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const failDays = countFailDays(plan.startDate, selectedDate);
    return calendarDays - (plan.totalPausedDays || 0) - failDays;
  }, [selectedDate, countFailDays]);

  const fetchContent = useCallback(async () => {
    if (!plan || isEditingPlan) return;
    const dateStr = selectedDate.toISOString().split('T')[0];
    if (reflectionCacheRef.current[dateStr]) {
      setReflection(reflectionCacheRef.current[dateStr]);
      setAiState(prev => ({ ...prev, loading: false, error: null }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setAiState(prev => ({ ...prev, loading: true, error: null, reflectionResponse: null, detailedExegesis: null }));
    const dayDiff = getEffectiveDayDiff(plan);
    if (dayDiff < 0) {
      setReflection(null);
      setAiState(prev => ({ ...prev, loading: false, error: "시작일 이전의 기록은 확인할 수 없습니다." }));
      return;
    }
    const otRange = getReadingPortion(BIBLE_METADATA.OT, plan.otBook, plan.otStartChapter, dayDiff, plan.otChaptersPerDay);
    const ntRange = getReadingPortion(BIBLE_METADATA.NT, plan.ntBook, plan.ntStartChapter, dayDiff, plan.ntChaptersPerDay);
    try {
      const result = await fetchDailyReflection(otRange, ntRange);
      if (result) {
        setReflection(result);
        reflectionCacheRef.current[dateStr] = result;
        saveReflection(dateStr, result);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (e: any) {
      let errorMsg = "데이터를 불러오는 중 오류가 발생했습니다.";
      if (e.message?.includes('429')) errorMsg = "API 사용량이 초과되었습니다.";
      setAiState(prev => ({ ...prev, error: errorMsg }));
    } finally {
      setAiState(prev => ({ ...prev, loading: false }));
    }
  }, [plan, selectedDate, isEditingPlan, getEffectiveDayDiff]);

  useEffect(() => {
    if (dataLoaded) fetchContent();
  }, [dataLoaded, fetchContent]);

  const handleSavePlan = async (p: ReadingPlan) => {
    await savePlan(p);
    setPlan(p);
    reflectionCacheRef.current = {};
    await clearReflectionCache();
    setIsEditingPlan(false);
  };

  const handleReset = async () => {
    await clearAllData();
    localStorage.clear();
    window.location.reload();
  };

  const handleToggleDate = (dateStr: string) => {
    setSelectedDates(prev => {
      const next = new Set(prev);
      if (next.has(dateStr)) next.delete(dateStr);
      else next.add(dateStr);
      return next;
    });
  };

  const handleAddDates = (dates: string[]) => {
    setSelectedDates(prev => {
      const next = new Set(prev);
      dates.forEach(d => next.add(d));
      return next;
    });
  };

  const handleMarkStatus = async (status: 'success' | 'fail') => {
    const dates: string[] = Array.from(selectedDates);
    if (dates.length === 0) return;
    const newHistory: ReadingHistory = { ...history };
    dates.forEach((d: string) => { newHistory[d] = status; });
    setHistory(newHistory);
    setSelectedDates(new Set<string>());
    await markDatesStatus(dates, status);

    // 실패/성공 표시 변경 시, 해당 날짜 이후의 리플렉션 캐시 무효화
    // (effectiveDayDiff가 바뀌므로 이후 날짜의 읽기 분량이 달라짐)
    const earliestDate = dates.sort()[0];
    Object.keys(reflectionCacheRef.current).forEach(key => {
      if (key >= earliestDate) delete reflectionCacheRef.current[key];
    });
  };

  const handleExegesis = async (type: 'old' | 'new') => {
    if (!reflection) return;
    const data = type === 'old' ? reflection.old_testament : reflection.new_testament;
    if (!data) return;
    setStreamingExegesis({ range: data.range, version: '쉬운성경', items: [], done: false });
    setFullBibleText({ range: data.range, version: '쉬운성경', verses: [], done: false });

    // Stream full text in parallel
    streamFullBibleText(
      data.range,
      (verse) => {
        setFullBibleText(prev => prev ? { ...prev, verses: [...prev.verses, verse] } : prev);
      },
      (range, version) => {
        setFullBibleText(prev => prev ? { ...prev, range, version } : prev);
      },
    ).then(() => {
      setFullBibleText(prev => prev ? { ...prev, done: true } : prev);
    }).catch(() => {
      setFullBibleText(prev => prev ? { ...prev, done: true } : prev);
    });

    // Stream exegesis in parallel
    try {
      await streamDetailedExegesis(
        data.range,
        (item) => {
          setStreamingExegesis(prev => prev ? { ...prev, items: [...prev.items, item] } : prev);
        },
        (range, version) => {
          setStreamingExegesis(prev => prev ? { ...prev, range, version } : prev);
        },
      );
      setStreamingExegesis(prev => prev ? { ...prev, done: true } : prev);
    } catch (e: any) {
      setAiState(prev => ({ ...prev, error: "해설을 불러오지 못했습니다." }));
      setStreamingExegesis(null);
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleToggleBookmark = async (text: string, source: string) => {
    const existing = bookmarks.find(b => b.text === text && b.source === source);
    if (existing && existing.id) {
      await deleteBookmark(existing.id);
      setBookmarks(prev => prev.filter(b => b.id !== existing.id));
      return false;
    }
    const bm: BookmarkType = { text, source };
    const saved = await addBookmark(bm);
    setBookmarks(prev => [saved, ...prev]);
    return true;
  };

  const handleDeleteBookmark = async (id: string) => {
    await deleteBookmark(id);
    setBookmarks(prev => prev.filter(b => b.id !== id));
  };

  const changeDay = (offset: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + offset);
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  if (!isAuthed) return <PasswordGate onAuth={() => setIsAuthed(true)} />;

  if (!dataLoaded) return (
    <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
    </div>
  );

  if (!plan || isEditingPlan) return (
    <div className="min-h-screen bg-[#FDFDFD]">
      <Header />
      <SetupView
        currentPlan={plan}
        onSave={handleSavePlan}
        onCancel={plan ? () => setIsEditingPlan(false) : undefined}
      />
    </div>
  );

  const effectiveDayDiff = getEffectiveDayDiff(plan);
  const dayNum = effectiveDayDiff + 1;
  const dateLabel = selectedDate.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });
  const todayDayDiff = (() => {
    const start = new Date(plan.startDate);
    start.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const calendarDays = Math.round((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const failDays = countFailDays(plan.startDate, today);
    return calendarDays - (plan.totalPausedDays || 0) - failDays;
  })();
  const todayOtRange = getReadingPortion(BIBLE_METADATA.OT, plan.otBook, plan.otStartChapter, todayDayDiff, plan.otChaptersPerDay);
  const todayNtRange = getReadingPortion(BIBLE_METADATA.NT, plan.ntBook, plan.ntStartChapter, todayDayDiff, plan.ntChaptersPerDay);

  return (
    <div className="max-w-2xl mx-auto min-h-screen bg-bg-primary shadow-2xl border-x border-border-light pb-24 font-sans selection:bg-accent-black selection:text-white">
      <Header
        onSettings={() => setShowSettings(true)}
        onShowBookmarks={() => setShowBookmarks(true)}
        onShowChat={() => setShowChat(true)}
        onRefresh={() => {
          const dateStr = selectedDate.toISOString().split('T')[0];
          delete reflectionCacheRef.current[dateStr];
          fetchContent();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
      <div className="bg-bg-secondary/90 backdrop-blur-md border-b border-border-light sticky top-16 z-30 px-6 py-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button onClick={() => changeDay(-1)} className="p-3 hover:bg-bg-primary hover:shadow-subtle rounded-full border border-transparent hover:border-border-light transition-all"><ArrowLeft className="w-5 h-5 text-text-tertiary" /></button>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-3">
              <span
                className="text-sm font-black text-text-primary cursor-pointer hover:text-accent-black transition-colors uppercase tracking-widest serif-text"
                onClick={() => setShowMiniCalendar(true)}
              >
                {dateLabel}
              </span>
              <button onClick={goToToday} className="text-[9px] text-accent-black font-black bg-bg-paper border border-border-light px-2 py-0.5 rounded-full uppercase tracking-widest hover:bg-white transition-colors">Current</button>
            </div>
            <span className="text-[10px] font-black text-text-tertiary mt-1 uppercase tracking-tighter">{dayNum > 0 ? `MISSION Day. ${String(dayNum).padStart(3, '0')}` : '-'}</span>
          </div>
          <button onClick={() => changeDay(1)} className="p-3 hover:bg-bg-primary hover:shadow-subtle rounded-full border border-transparent hover:border-border-light transition-all"><ArrowRight className="w-5 h-5 text-text-tertiary" /></button>
        </div>
      </div>

      {currentView === 'home' ? (
        <Dashboard
          plan={plan}
          onStartReading={() => setCurrentView('reading')}
          todayOtRange={todayOtRange}
          todayNtRange={todayNtRange}
          effectiveDayDiff={todayDayDiff}
          otColor="accent-blue"
          ntColor="accent-green"
        />
      ) : (
        <main className="p-5 space-y-12">
          {aiState.loading && !reflection ? (
            <div className="py-32 flex flex-col items-center justify-center space-y-5">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
              <p className="text-gray-400 font-bold text-sm">말씀을 준비하고 있습니다...</p>
            </div>
          ) : aiState.error ? (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <AlertCircle className="w-10 h-10 text-red-500 mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">{aiState.error}</h3>
              <button onClick={fetchContent} className="flex items-center gap-2 bg-gray-900 text-white px-8 py-3.5 rounded-2xl font-bold hover:bg-black shadow-lg"><RefreshCcw className="w-4 h-4" /> 다시 시도</button>
            </div>
          ) : reflection ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              {reflection.old_testament && (
                <StudySection
                  type="old"
                  section={reflection.old_testament}
                  fontSize={fontSize}
                  onExegesis={() => handleExegesis('old')}
                  onCopy={handleCopyText}
                  copiedId={copiedId}
                  accentColor="accent-blue"
                  note={(savedNotes[selectedDate.toISOString().split('T')[0]] || {}).old || ''}
                  onSaveNote={(n) => handleSaveNote('old', n)}
                />
              )}
              {reflection.new_testament && (
                <StudySection
                  type="new"
                  section={reflection.new_testament}
                  fontSize={fontSize}
                  onExegesis={() => handleExegesis('new')}
                  onCopy={handleCopyText}
                  copiedId={copiedId}
                  accentColor="accent-green"
                  note={(savedNotes[selectedDate.toISOString().split('T')[0]] || {}).new || ''}
                  onSaveNote={(n) => handleSaveNote('new', n)}
                />
              )}
              <div className="bg-accent-blue rounded-xl p-10 shadow-card mb-16 sticker-card before:bg-white/20 before:w-16 before:h-6 before:top-[-10px] before:left-1/2 before:-translate-x-1/2">
                <div className="flex items-center gap-3 mb-6 text-white/70">
                  <MessageCircle className="w-5 h-5" />
                  <h3 className="font-black text-[10px] uppercase tracking-[0.3em]">DAILY JOURNAL ENTRY</h3>
                </div>
                <p className="text-white font-bold text-lg mb-8 leading-relaxed" style={{ fontSize: `${fontSize}px` }}>{reflection.meditation_question}</p>
                <button
                  onClick={async () => {
                    setAiState(prev => ({ ...prev, loading: true }));
                    const context = `구약: ${reflection.old_testament?.summary}, 신약: ${reflection.new_testament?.summary}`;
                    const result = await getDeepReflection(reflection.meditation_question, context);
                    setAiState(prev => ({ ...prev, loading: false, reflectionResponse: result }));
                  }}
                  className="w-full bg-white text-accent-black py-5 rounded-full font-black text-[10px] hover:bg-bg-paper transition-all shadow-subtle uppercase tracking-[0.2em]"
                >
                  EXPAND DEEP ARCHIVE
                </button>
                {aiState.reflectionResponse && (
                  <div className="mt-8 bg-black/10 backdrop-blur-sm p-8 rounded-xl text-white/90 leading-relaxed whitespace-pre-wrap font-medium border border-white/5 serif-text" style={{ fontSize: `${fontSize}px` }}>
                    {aiState.reflectionResponse}
                  </div>
                )}
              </div>
            </div>
          ) : null}
          <Calendar
            history={history}
            selectedDates={selectedDates}
            onToggleDate={handleToggleDate}
            onAddDates={handleAddDates}
            onMarkStatus={handleMarkStatus}
            onClearSelection={() => setSelectedDates(new Set())}
          />
        </main>
      )}

      {/* Bottom navigation */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-2xl bg-white border-t border-gray-200 z-40">
        <div className="flex">
          <button
            onClick={() => setCurrentView('home')}
            className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${currentView === 'home' ? 'text-blue-600' : 'text-gray-400'}`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-bold">홈</span>
          </button>
          <button
            onClick={() => setCurrentView('reading')}
            className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${currentView === 'reading' ? 'text-blue-600' : 'text-gray-400'}`}
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-[10px] font-bold">읽기</span>
          </button>
        </div>
      </div>

      {showMiniCalendar && (
        <MiniCalendar
          selectedDate={selectedDate}
          onSelectDate={(date) => {
            setSelectedDate(date);
            setCurrentView('reading');
          }}
          onClose={() => setShowMiniCalendar(false)}
        />
      )}

      {(streamingExegesis || fullBibleText) && (
        <ExegesisOverlay
          data={streamingExegesis || { range: fullBibleText!.range, version: fullBibleText!.version, items: [], done: true }}
          isStreaming={streamingExegesis ? !streamingExegesis.done : false}
          onClose={() => { setStreamingExegesis(null); setFullBibleText(null); }}
          fontSize={fontSize}
          onCopy={handleCopyText}
          copiedId={copiedId}
          onBookmark={handleToggleBookmark}
          onAsk={(text: string, source: string) => setAskContext({ text, source })}
          fullText={fullBibleText}
          onSaveWord={handleSaveWord}
          onRemoveWord={(word) => handleDeleteWord(selectedDate.toISOString().split('T')[0], word)}
        />
      )}

      {showChat && (
        <ChatPanel
          otRange={todayOtRange}
          ntRange={todayNtRange}
          reflection={reflection}
          onClose={() => setShowChat(false)}
        />
      )}

      {showBookmarks && (
        <BookmarkPanel bookmarks={bookmarks} onDelete={handleDeleteBookmark} onClose={() => setShowBookmarks(false)} fontSize={fontSize} savedWords={savedWords} onDeleteWord={handleDeleteWord} />
      )}

      {askContext && (
        <AskPanel text={askContext.text} source={askContext.source} onClose={() => setAskContext(null)} />
      )}

      {showSettings && (
        <SettingsPanel
          fontSize={fontSize}
          onFontSizeChange={setFontSize}
          onEditPlan={plan ? () => setIsEditingPlan(true) : undefined}
          onReset={handleReset}
          onClose={() => setShowSettings(false)}
        />
      )}

      {aiState.loading && (
        <div className="fixed inset-0 z-[60] bg-white/40 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white p-8 rounded-3xl shadow-2xl border border-gray-100 flex flex-col items-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-5" />
            <p className="text-gray-900 font-black text-sm">깊이 살피는 중...</p>
          </div>
        </div>
      )}
    </div>
  );
};

const StudySection: React.FC<{
  type: 'old' | 'new',
  section: any,
  fontSize: number,
  onExegesis: () => void,
  onCopy: (text: string, id: string) => void,
  copiedId: string | null,
  accentColor: string,
  note: string,
  onSaveNote: (note: string) => void
}> = ({ type, section, fontSize, onExegesis, onCopy, copiedId, accentColor, note, onSaveNote }) => {
  const label = type === 'old' ? 'Old Testament' : 'New Testament';
  const [isPlaying, setIsPlaying] = useState(false);
  const [ttsLoading, setTtsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [showBackground, setShowBackground] = useState(false);
  const [showFigures, setShowFigures] = useState(false);
  const [showVocabulary, setShowVocabulary] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [noteText, setNoteText] = useState(note);

  const handleTTS = async () => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
      setIsPlaying(false);
      return;
    }
    setTtsLoading(true);
    const audio = await playTTS(`${section.range}. ${section.summary}`);
    setTtsLoading(false);
    if (audio) {
      audioRef.current = audio;
      setIsPlaying(true);
      audio.onended = () => {
        setIsPlaying(false);
        audioRef.current = null;
      };
    }
  };

  return (
    <section className="border-b border-border-light pb-16 mb-16 last:border-0 last:mb-0">
      <div className="flex items-center justify-between mb-8">
        <span className={`badge-archival bg-${accentColor}`}>{label}</span>
        <div className="flex items-center gap-2">
          <button onClick={() => onCopy(section.summary, `${type}-summary`)} className={`p-3 rounded-full transition-all border border-border-light hover:bg-bg-secondary shadow-subtle ${copiedId === `${type}-summary` ? 'text-accent-blue' : 'text-text-tertiary'}`}>
            {copiedId === `${type}-summary` ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
          <button onClick={handleTTS} disabled={ttsLoading} className={`p-3 rounded-full transition-all border border-border-light hover:bg-bg-secondary shadow-subtle ${isPlaying ? `text-accent-blue` : `text-text-tertiary`} ${ttsLoading ? 'opacity-50' : ''}`}>
            {ttsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : isPlaying ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <h2 className="text-4xl font-black text-text-primary mb-8 tracking-tighter serif-text flex items-baseline gap-3">
        {section.range}
        <span className="text-[10px] font-black text-text-tertiary uppercase tracking-widest border border-border-light px-2 py-0.5 rounded">Easy Bible</span>
      </h2>

      <div className="space-y-6">
        {section.background && (
          <div className="bg-bg-secondary rounded-xl border border-border-light overflow-hidden shadow-subtle">
            <button onClick={() => setShowBackground(!showBackground)} className="w-full flex items-center gap-4 p-5 text-left transition-colors hover:bg-bg-paper">
              <Info className={`w-4 h-4 text-accent-blue shrink-0`} />
              <h4 className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] flex-1">Historical Context</h4>
              <ChevronDown className={`w-4 h-4 text-text-tertiary transition-transform duration-300 ${showBackground ? 'rotate-180' : ''}`} />
            </button>
            {showBackground && (
              <div className="px-6 pb-6 pt-0 animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="text-text-secondary leading-loose font-medium serif-text italic" style={{ fontSize: `${fontSize}px` }}>{section.background}</p>
              </div>
            )}
          </div>
        )}

        <div className={`bg-bg-paper rounded-xl p-8 border border-border-light shadow-card sticker-card before:left-1/2 before:-translate-x-1/2 before:w-12 before:top-[-10px]`}>
          <h4 className={`text-[9px] font-black text-accent-blue uppercase tracking-[0.3em] mb-4`}>Core Summary</h4>
          <p className="text-text-primary leading-loose font-black serif-text" style={{ fontSize: `${fontSize + 2}px` }}>{section.summary}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {section.figures && section.figures.length > 0 && (
            <div className="bg-bg-primary border border-border-light rounded-xl overflow-hidden shadow-subtle">
              <button onClick={() => setShowFigures(!showFigures)} className="w-full flex items-center gap-4 p-5 text-left transition-colors hover:bg-bg-secondary">
                <Users className={`w-4 h-4 text-accent-green shrink-0`} />
                <h4 className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] flex-1">Key Personnel</h4>
                <ChevronDown className={`w-4 h-4 text-text-tertiary transition-transform duration-300 ${showFigures ? 'rotate-180' : ''}`} />
              </button>
              {showFigures && (
                <div className="px-6 pb-6 pt-0 space-y-4 animate-in fade-in duration-300">
                  {section.figures.map((f: any, i: number) => (
                    <div key={i} className="border-l-2 border-border-light pl-4 py-1">
                      <span className="font-black text-xs text-text-primary uppercase tracking-tight">{f.name}</span>
                      <p className="text-text-tertiary leading-relaxed mt-1" style={{ fontSize: `${fontSize - 3}px` }}>{f.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {section.vocabulary && section.vocabulary.length > 0 && (
            <div className="bg-bg-primary border border-border-light rounded-xl overflow-hidden shadow-subtle">
              <button onClick={() => setShowVocabulary(!showVocabulary)} className="w-full flex items-center gap-4 p-5 text-left transition-colors hover:bg-bg-secondary">
                <Languages className={`w-4 h-4 text-accent-yellow shrink-0`} />
                <h4 className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] flex-1">Terms & Dictionary</h4>
                <ChevronDown className={`w-4 h-4 text-text-tertiary transition-transform duration-300 ${showVocabulary ? 'rotate-180' : ''}`} />
              </button>
              {showVocabulary && (
                <div className="px-6 pb-6 pt-0 space-y-4 animate-in fade-in duration-300">
                  {section.vocabulary.map((v: any, i: number) => (
                    <div key={i} className="border-l-2 border-border-light pl-4 py-1">
                      <span className="font-black text-xs text-accent-yellow uppercase tracking-tighter">{v.word}</span>
                      <p className="text-text-tertiary leading-relaxed mt-1" style={{ fontSize: `${fontSize - 3}px` }}>{v.meaning}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-4 mt-10">
        <button onClick={onExegesis} className="flex-1 btn-analogue bg-accent-black text-white py-5 shadow-card">
          <BookText className="w-4 h-4" /> VERSE-BY-VERSE ANALYSIS
        </button>
        <button onClick={() => setShowNote(true)} className={`p-5 rounded-full border transition-all shadow-subtle ${note ? `bg-bg-paper border-accent-blue text-accent-blue` : 'bg-bg-primary border-border-light text-text-tertiary hover:border-accent-black hover:text-accent-black'}`}>
          <PenLine className="w-5 h-5" />
        </button>
      </div>

      {showNote && (
        <div className="fixed inset-0 z-[70] bg-accent-black/40 backdrop-blur-sm flex items-end justify-center animate-in fade-in duration-200" onClick={() => setShowNote(false)}>
          <div className="bg-bg-primary w-full max-w-2xl rounded-t-3xl p-8 max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-300 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1 bg-border-light rounded-full mx-auto mb-8" />
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <PenLine className={`w-5 h-5 text-accent-blue`} />
                <h3 className="text-xl font-black text-text-primary serif-text uppercase tracking-tighter">Researcher's Log</h3>
                <span className={`badge-archival bg-bg-paper text-text-tertiary border border-border-light`}>{section.range}</span>
              </div>
              <button onClick={() => setShowNote(false)} className="p-2 hover:bg-bg-secondary rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <textarea
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="Record your spiritual reflections and applications here..."
              className="flex-1 min-h-[250px] bg-bg-primary border border-border-light rounded-xl p-6 text-sm font-bold text-text-primary leading-loose outline-none focus:border-accent-black shadow-inner serif-text italic"
              style={{ fontSize: `${fontSize}px` }}
              autoFocus
            />
            <button
              onClick={() => { onSaveNote(noteText); setShowNote(false); }}
              className={`w-full mt-6 btn-analogue bg-accent-black text-white py-5`}
            >
              SAVE TO ARCHIVE
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

const ExegesisOverlay: React.FC<{
  data: { range: string; version: string; items: ExegesisItem[]; done: boolean },
  isStreaming: boolean,
  onClose: () => void,
  fontSize: number,
  onCopy: (t: string, id: string) => void,
  copiedId: string | null,
  onBookmark: (text: string, source: string) => Promise<boolean>,
  onAsk: (text: string, source: string) => void,
  fullText: { range: string; version: string; verses: BibleVerse[]; done: boolean } | null,
  onSaveWord: (word: string, meaning: string) => void,
  onRemoveWord: (word: string) => void
}> = ({ data, isStreaming, onClose, fontSize, onCopy, copiedId, onBookmark, onAsk, fullText, onSaveWord, onRemoveWord }) => {
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'fulltext' | 'exegesis'>('fulltext');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [tappedWords, setTappedWords] = useState<Array<{ word: string; meaning: string | null; loading: boolean }>>([]);
  const [pendingWord, setPendingWord] = useState<{ word: string; verseText: string } | null>(null);
  const [pendingRemoveWord, setPendingRemoveWord] = useState<string | null>(null);

  const extractNoun = (w: string): string => {
    const particles = ['에게서', '으로서', '으로써', '로부터', '에서는', '에게는', '한테서', '까지는', '부터는', '이라고', '이라는', '에서', '에게', '한테', '으로', '까지', '부터', '마저', '조차', '밖에', '처럼', '만큼', '대로', '께서', '로서', '로써', '과는', '와는', '이는', '에는', '들을', '들이', '들은', '은', '는', '이', '가', '을', '를', '의', '에', '도', '만', '와', '과', '로', '께', '서', '들'];
    for (const p of particles) {
      if (w.endsWith(p) && w.length > p.length + 1) return w.slice(0, -p.length);
    }
    return w;
  };

  const handleWordTap = (rawWord: string, verseText: string) => {
    const cleaned = rawWord.replace(/^[^\uAC00-\uD7A3a-zA-Z0-9]+|[^\uAC00-\uD7A3a-zA-Z0-9]+$/g, '');
    const word = extractNoun(cleaned);
    if (word.length < 2) return;
    if (tappedWords.some(w => w.word === word)) {
      setPendingRemoveWord(word);
      setPendingWord(null);
      return;
    }
    setPendingWord({ word, verseText });
    setPendingRemoveWord(null);
  };

  const confirmWord = async () => {
    if (!pendingWord) return;
    const { word, verseText } = pendingWord;
    setPendingWord(null);
    if (tappedWords.some(w => w.word === word)) return;
    setTappedWords(prev => [...prev, { word, meaning: null, loading: true }]);
    try {
      const result = await fetchWordMeaning(word, verseText, data.range);
      setTappedWords(prev => prev.map(w => w.word === word ? { ...w, meaning: result.meaning, loading: false } : w));
      onSaveWord(word, result.meaning);
    } catch {
      setTappedWords(prev => prev.map(w => w.word === word ? { ...w, meaning: 'Could not retrieve definition.', loading: false } : w));
    }
  };

  const handleBookmark = async (text: string, source: string, id: string) => {
    if (bookmarkedIds.has(id)) {
      const added = await onBookmark(text, source);
      if (!added) setBookmarkedIds(prev => { const next = new Set(prev); next.delete(id); return next; });
      return;
    }
    const added = await onBookmark(text, source);
    if (added) setBookmarkedIds(prev => new Set(prev).add(id));
  };

  useEffect(() => {
    if (isStreaming && activeTab === 'exegesis' && scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [data.items.length, isStreaming, activeTab]);

  return (
    <div className="fixed inset-0 z-50 bg-bg-primary flex flex-col animate-in slide-in-from-bottom duration-300">
      <header className="bg-bg-primary border-b border-border-light p-6 flex items-center justify-between shrink-0 shadow-subtle z-10">
        <div>
          <h3 className="text-2xl font-black text-text-primary serif-text uppercase tracking-tighter">{data.range}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="badge-archival bg-accent-blue">Easy Bible Archive</span>
          </div>
        </div>
        <button onClick={onClose} className="p-3 hover:bg-bg-secondary rounded-full border border-border-light shadow-subtle transition-colors"><X className="w-6 h-6" /></button>
      </header>

      <div className="flex bg-bg-primary border-b border-border-light shrink-0">
        <button
          onClick={() => setActiveTab('fulltext')}
          className={`flex-1 py-4 text-[10px] font-black text-center transition-all relative uppercase tracking-[0.2em] ${activeTab === 'fulltext' ? 'text-accent-black' : 'text-text-tertiary opacity-50'}`}
        >
          <span className="inline-flex items-center gap-2">
            MANUSCRIPT
            {activeTab !== 'fulltext' && fullText && !fullText.done && <span className="w-1.5 h-1.5 bg-accent-blue rounded-full animate-pulse" />}
          </span>
          {activeTab === 'fulltext' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-accent-black" />}
        </button>
        <button
          onClick={() => setActiveTab('exegesis')}
          className={`flex-1 py-4 text-[10px] font-black text-center transition-all relative uppercase tracking-[0.2em] ${activeTab === 'exegesis' ? 'text-accent-black' : 'text-text-tertiary opacity-50'}`}
        >
          <span className="inline-flex items-center gap-2">
            EXEGESIS
            {activeTab !== 'exegesis' && isStreaming && <span className="w-1.5 h-1.5 bg-accent-blue rounded-full animate-pulse" />}
          </span>
          {activeTab === 'exegesis' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-accent-black" />}
        </button>
      </div>

      {activeTab === 'fulltext' && (
        <>
          {fullText && fullText.verses.length === 0 && !fullText.done ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-6 paper-texture">
              <Loader2 className="w-10 h-10 text-text-tertiary animate-spin opacity-30" />
              <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Retrieving manuscript...</p>
            </div>
          ) : (
            <div className="flex-1 min-h-0 flex flex-col paper-texture">
              <div className="flex-1 overflow-y-auto">
                <div className="max-w-3xl mx-auto p-8 md:p-12 space-y-6 pb-24">
                  {fullText?.verses.slice().sort((a, b) => {
                    const [ac, av] = a.verseNum.split(':').map(Number);
                    const [bc, bv] = b.verseNum.split(':').map(Number);
                    return (ac - bc) || (av - bv);
                  }).map((verse, idx) => (
                    <div key={idx} className="flex gap-4 items-start animate-in fade-in duration-500 group">
                      <span className="text-accent-blue font-black text-[10px] mt-1.5 shrink-0 w-12 text-right tabular-nums tracking-tighter opacity-50">{verse.verseNum}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-text-primary leading-[2.1] font-medium flex flex-wrap serif-text" style={{ fontSize: `${fontSize}px` }}>
                          {verse.text.split(/(\s+)/).map((segment, sIdx) => {
                            if (/^\s+$/.test(segment)) return <span key={sIdx}>{segment}</span>;
                            const cleaned = segment.replace(/^[^\uAC00-\uD7A3a-zA-Z0-9]+|[^\uAC00-\uD7A3a-zA-Z0-9]+$/g, '');
                            const noun = extractNoun(cleaned);
                            const isTapped = tappedWords.some(w => w.word === noun);
                            return (
                              <span
                                key={sIdx}
                                onClick={() => handleWordTap(segment, verse.text)}
                                className={`cursor-pointer transition-all rounded px-0.5 border-b-2 decoration-accent-blue/20 hover:bg-accent-blue/5 ${isTapped ? 'bg-bg-paper text-accent-blue border-accent-blue' : 'border-transparent'}`}
                              >
                                {segment}
                              </span>
                            );
                          })}
                        </p>
                        <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleBookmark(verse.text, `${data.range} ${verse.verseNum}`, `ft-bm-${idx}`)}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black transition-all border ${bookmarkedIds.has(`ft-bm-${idx}`) ? 'bg-accent-black text-white' : 'bg-bg-primary text-text-tertiary border-border-light hover:border-accent-black hover:text-accent-black shadow-subtle'}`}
                          >
                            {bookmarkedIds.has(`ft-bm-${idx}`) ? <BookmarkCheck className="w-3 h-3" /> : <Bookmark className="w-3 h-3" />}
                            <span className="uppercase tracking-widest">{bookmarkedIds.has(`ft-bm-${idx}`) ? 'ARCHIVED' : 'ARCHIVE'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {fullText && !fullText.done && fullText.verses.length > 0 && (
                    <div className="flex items-center justify-center gap-3 py-8">
                      <Loader2 className="w-4 h-4 text-text-tertiary animate-spin" />
                    </div>
                  )}
                </div>
              </div>
              {pendingWord && (
                <div className="shrink-0 border-t border-border-light bg-bg-primary px-8 py-4 flex items-center justify-between animate-in fade-in slide-in-from-bottom duration-300 shadow-[0_-10px_20px_rgba(0,0,0,0.03)]">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-accent-blue bg-bg-paper px-2 py-0.5 rounded border border-border-light">"{pendingWord.word}"</span>
                    <span className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Identify this term?</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setPendingWord(null)} className="px-3 py-1.5 text-[10px] font-black text-text-tertiary hover:text-accent-black transition-colors uppercase tracking-widest">CANCEL</button>
                    <button onClick={confirmWord} className="btn-analogue bg-accent-black text-white px-4 py-2 text-[10px]">ADD TO LIBRARY</button>
                  </div>
                </div>
              )}
              {pendingRemoveWord && (
                <div className="shrink-0 border-t border-border-light bg-bg-primary px-8 py-4 flex items-center justify-between animate-in fade-in slide-in-from-bottom duration-300 shadow-[0_-10px_20px_rgba(0,0,0,0.03)]">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-accent-red bg-bg-paper px-2 py-0.5 rounded border border-border-light">"{pendingRemoveWord}"</span>
                    <span className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Delete from library?</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setPendingRemoveWord(null)} className="px-3 py-1.5 text-[10px] font-black text-text-tertiary hover:text-accent-black transition-colors uppercase tracking-widest">CANCEL</button>
                    <button onClick={() => { setTappedWords(prev => prev.filter(w => w.word !== pendingRemoveWord)); onRemoveWord(pendingRemoveWord!); setPendingRemoveWord(null); }} className="btn-analogue bg-accent-red text-white px-4 py-2 text-[10px] border-accent-red">DELETE</button>
                  </div>
                </div>
              )}
              {tappedWords.length > 0 && (
                <div className="shrink-0 border-t border-border-light bg-bg-primary px-8 py-6 max-h-60 overflow-hidden flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Languages className="w-4 h-4 text-accent-blue" />
                      <span className="text-[10px] font-black text-text-primary uppercase tracking-widest">Active Research Logs</span>
                      <span className="text-[9px] font-black text-white bg-accent-blue px-1.5 py-0.5 rounded-full">{tappedWords.length}</span>
                    </div>
                    <button onClick={() => setTappedWords([])} className="text-[9px] font-black text-text-tertiary hover:text-accent-red transition-colors uppercase tracking-widest">Clear Logs</button>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                    {tappedWords.map((tw, idx) => (
                      <div key={idx} className="flex items-start gap-3 bg-bg-secondary p-3 rounded-lg border border-border-light shadow-subtle group">
                        <span className="text-[10px] font-black text-accent-blue bg-white px-2 py-0.5 rounded border border-border-light shrink-0">{tw.word}</span>
                        {tw.loading ? (
                          <Loader2 className="w-3.5 h-3.5 text-accent-blue animate-spin mt-0.5" />
                        ) : (
                          <span className="text-xs text-text-secondary leading-relaxed serif-text font-medium">{tw.meaning}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {activeTab === 'exegesis' && (
        <>
          {data.items.length === 0 && isStreaming ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-6 paper-texture">
              <Loader2 className="w-10 h-10 text-text-tertiary animate-spin opacity-30" />
              <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Performing verse analysis...</p>
            </div>
          ) : (
            <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto paper-texture">
              <div className="max-w-3xl mx-auto p-8 md:p-12 space-y-12 pb-24">
                {data.items.map((item, idx) => (
                  <div key={idx} className="animate-in fade-in slide-in-from-bottom-2 duration-500 bg-bg-primary rounded-xl border border-border-light overflow-hidden shadow-card sticker-card p-0 after:content-none before:left-1/2 before:-translate-x-1/2 before:w-16 before:top-[-10px]">
                    <div className="p-6 bg-bg-paper border-b border-border-light">
                      <div className="flex items-center justify-between mb-4">
                        <span className="badge-archival bg-accent-blue">{item.verseNum}</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleBookmark(item.text, `${data.range} ${item.verseNum}`, `bm-v-${idx}`)}
                            className={`p-2 rounded-full transition-all border ${bookmarkedIds.has(`bm-v-${idx}`) ? 'bg-accent-black text-white border-accent-black' : 'bg-bg-primary text-text-tertiary border-border-light hover:border-accent-black hover:text-accent-black shadow-subtle'}`}
                          >
                            {bookmarkedIds.has(`bm-v-${idx}`) ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                          </button>
                          <button onClick={() => onAsk(item.text, `${data.range} ${item.verseNum}`)} className="p-2 bg-bg-primary text-text-tertiary border border-border-light hover:border-accent-black hover:text-accent-black rounded-full transition-all shadow-subtle"><MessageSquare className="w-3.5 h-3.5" /></button>
                          <button onClick={() => onCopy(item.text, `ex-v-${idx}`)} className={`p-2 rounded-full transition-all border ${copiedId === `ex-v-${idx}` ? 'bg-accent-green text-white border-accent-green' : 'bg-bg-primary text-text-tertiary border-border-light hover:border-accent-black hover:text-accent-black shadow-subtle'}`}>{copiedId === `ex-v-${idx}` ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}</button>
                        </div>
                      </div>
                      <p className="text-text-primary font-black leading-relaxed serif-text" style={{ fontSize: `${fontSize + 2}px` }}>{item.text}</p>
                    </div>
                    <div className="p-8 pb-10 bg-bg-primary">
                      <div className="flex items-center gap-3 mb-5">
                        <div className="w-1 h-4 bg-accent-black" />
                        <span className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Scholarly Commentary</span>
                      </div>
                      <p className="text-text-secondary leading-[1.8] whitespace-pre-wrap font-medium serif-text italic" style={{ fontSize: `${fontSize}px` }}>{item.explanation}</p>
                      <div className="flex items-center gap-2 mt-8 pt-6 border-t border-border-light/50">
                        <button onClick={() => handleBookmark(item.explanation, `${data.range} ${item.verseNum} Commentary`, `bm-e-${idx}`)} className={`px-3 py-1.5 rounded-full text-[9px] font-black transition-all border ${bookmarkedIds.has(`bm-e-${idx}`) ? 'bg-accent-black text-white' : 'bg-bg-secondary text-text-tertiary border-border-light shadow-subtle'}`}>Commentary Archive</button>
                        <button onClick={() => onCopy(item.explanation, `ex-e-${idx}`)} className={`px-3 py-1.5 rounded-full text-[9px] font-black transition-all border ${copiedId === `ex-e-${idx}` ? 'bg-accent-green text-white' : 'bg-bg-secondary text-text-tertiary border-border-light shadow-subtle'}`}>Copy Reference</button>
                      </div>
                    </div>
                  </div>
                ))}
                {isStreaming && data.items.length > 0 && (
                  <div className="flex items-center justify-center gap-3 py-8">
                    <Loader2 className="w-5 h-5 text-text-tertiary animate-spin" />
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default App;
