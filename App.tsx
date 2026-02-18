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

const COLOR_THEMES = [
  { name: '클래식', ot: 'blue', nt: 'emerald', desc: '차분한 파랑과 초록' },
  { name: '대지', ot: 'amber', nt: 'teal', desc: '따뜻한 호박색과 청록' },
  { name: '노을', ot: 'rose', nt: 'violet', desc: '은은한 장미와 보라' },
  { name: '바다', ot: 'indigo', nt: 'cyan', desc: '깊은 남색과 바다' },
  { name: '숲', ot: 'emerald', nt: 'amber', desc: '자연의 초록과 가을빛' },
];

const SettingsPanel: React.FC<{
  currentTheme: number;
  onChangeTheme: (idx: number) => void;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  onEditPlan?: () => void;
  onReset: () => void;
  onClose: () => void;
}> = ({ currentTheme, onChangeTheme, fontSize, onFontSizeChange, onEditPlan, onReset, onClose }) => (
  <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center animate-in fade-in duration-200" onClick={onClose}>
    <div className="bg-white w-full max-w-2xl rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
      <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
      <div className="flex items-center gap-2 mb-6">
        <Settings className="w-5 h-5 text-gray-700" />
        <h3 className="text-lg font-black text-gray-900">설정</h3>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <TypeIcon className="w-4 h-4 text-gray-400" />
          <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">글자 크기</h4>
        </div>
        <div className="flex items-center gap-4 bg-gray-50 rounded-2xl p-4 border border-gray-100">
          <button onClick={() => onFontSizeChange(Math.max(14, fontSize - 1))} disabled={fontSize <= 14} className="p-2 hover:bg-white rounded-xl text-gray-600 transition-colors disabled:opacity-30"><Minus className="w-4 h-4" /></button>
          <div className="flex-1 text-center">
            <span className="text-lg font-black text-gray-900 tabular-nums">{fontSize}px</span>
          </div>
          <button onClick={() => onFontSizeChange(Math.min(24, fontSize + 1))} disabled={fontSize >= 24} className="p-2 hover:bg-white rounded-xl text-gray-600 transition-colors disabled:opacity-30"><Plus className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Palette className="w-4 h-4 text-gray-400" />
          <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">색상 테마</h4>
        </div>
        <div className="space-y-2">
          {COLOR_THEMES.map((theme, idx) => (
            <button
              key={idx}
              onClick={() => onChangeTheme(idx)}
              className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all ${
                currentTheme === idx ? 'border-gray-900 bg-gray-50' : 'border-gray-100 hover:bg-gray-50'
              }`}
            >
              <div className="flex gap-1.5">
                <div className={`w-7 h-7 rounded-full bg-${theme.ot}-500 shadow-sm`} />
                <div className={`w-7 h-7 rounded-full bg-${theme.nt}-500 shadow-sm`} />
              </div>
              <div className="text-left flex-1">
                <span className="text-sm font-bold text-gray-900">{theme.name}</span>
                <span className="text-xs text-gray-400 ml-2">{theme.desc}</span>
              </div>
              {currentTheme === idx && <Check className="w-4 h-4 text-gray-900" />}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {onEditPlan && (
          <button onClick={() => { onEditPlan(); onClose(); }} className="w-full bg-gray-100 text-gray-700 py-3.5 rounded-2xl font-bold text-sm hover:bg-gray-200 transition-all flex items-center justify-center gap-2">
            <Edit2 className="w-4 h-4" /> 통독 계획 수정
          </button>
        )}
        <button
          onClick={() => { if(confirm("모든 데이터를 초기화하시겠습니까?")) onReset(); }}
          className="w-full bg-red-50 text-red-500 py-3.5 rounded-2xl font-bold text-sm hover:bg-red-100 transition-all border border-red-100"
        >
          앱 데이터 초기화
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
    <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-6">
      <div className={`w-full max-w-sm ${shake ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
        <div className="text-center mb-10">
          <div className="bg-blue-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-inner">
            <Hexagon className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Yedy's Bible</h1>
          <p className="text-gray-400 text-sm mt-2">매일의 말씀 여정</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(false); }}
              placeholder="비밀번호를 입력하세요"
              className={`w-full pl-11 pr-4 py-4 bg-white border rounded-2xl text-sm font-semibold outline-none transition-all shadow-sm ${
                error ? 'border-red-300 focus:ring-2 focus:ring-red-200' : 'border-gray-200 focus:ring-2 focus:ring-blue-500'
              }`}
              autoFocus
            />
          </div>
          {error && <p className="text-red-500 text-xs font-bold text-center">비밀번호가 올바르지 않습니다.</p>}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-[0.98]"
          >
            입장하기
          </button>
        </form>
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
}> = ({ onSettings, onShowBookmarks, onShowChat }) => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2" onClick={() => window.location.reload()}>
          <Hexagon className="w-5 h-5 text-blue-600 cursor-pointer" />
          <h1 className="text-lg font-bold text-gray-900 tracking-tight cursor-pointer">Yedy's Bible</h1>
        </div>
        <div className="flex items-center gap-1">
          {onShowChat && (
            <button onClick={onShowChat} className="p-2 text-gray-400 hover:text-gray-900 transition-colors" title="궁금증">
              <MessageSquare className="w-4 h-4" />
            </button>
          )}
          {onShowBookmarks && (
            <button onClick={onShowBookmarks} className="p-2 text-gray-400 hover:text-gray-900 transition-colors" title="북마크">
              <Bookmark className="w-4 h-4" />
            </button>
          )}
          {onSettings && (
            <button onClick={onSettings} className="p-2 text-gray-400 hover:text-gray-900 transition-colors" title="설정">
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
    <div className="bg-white rounded-2xl border border-gray-200 p-5 mt-8 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2 text-gray-800">
          <CalendarIcon className="w-4 h-4 text-blue-500" />
          <h3 className="font-bold text-sm">{year}년 {month + 1}월 읽기 기록</h3>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setShowStats(s => !s)} className={`p-1.5 rounded-lg transition-colors ${showStats ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-500'}`} title="월별 성취율"><BarChart3 className="w-4 h-4" /></button>
          <button onClick={() => setViewDate(new Date(year, month - 1))} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><ChevronLeft className="w-4 h-4 text-gray-500" /></button>
          <button onClick={() => setViewDate(new Date(year, month + 1))} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><ChevronRight className="w-4 h-4 text-gray-500" /></button>
        </div>
      </div>
      <div className="flex items-center gap-3 mb-4 text-[10px] font-bold text-gray-400">
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-600 rounded" /> 성공</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-400 rounded" /> 실패</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-gray-100 rounded border border-gray-200" /> 미기록</span>
      </div>
      {showStats && (
        <div className="mb-5 bg-gray-50 rounded-2xl p-4 border border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-blue-500" />
            <h4 className="text-xs font-black text-gray-600 uppercase tracking-widest">월별 성취율</h4>
          </div>
          <div className="space-y-2.5 max-h-48 overflow-y-auto">
            {getMonthlyStats().map(s => (
              <div key={`${s.year}-${s.month}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-gray-700">{s.year}년 {s.month}월</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400 font-medium">{s.success}성공 · {s.fail}실패</span>
                    <span className={`text-xs font-black ${s.rate >= 80 ? 'text-blue-600' : s.rate >= 50 ? 'text-amber-500' : 'text-red-400'}`}>{s.rate}%</span>
                  </div>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${s.rate >= 80 ? 'bg-blue-500' : s.rate >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
                    style={{ width: `${s.rate}%` }}
                  />
                </div>
              </div>
            ))}
            {getMonthlyStats().length === 0 && (
              <p className="text-xs text-gray-400 text-center py-2">아직 기록이 없습니다</p>
            )}
          </div>
        </div>
      )}
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-gray-400 mb-3 uppercase tracking-tighter">
        {['일', '월', '화', '수', '목', '금', '토'].map(d => <div key={d}>{d}</div>)}
      </div>
      <div
        className="grid grid-cols-7 gap-1.5 touch-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {days.map((day, idx) => {
          if (day === null) return <div key={idx} />;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const status = history[dateStr]; // 'success' | 'fail' | undefined
          const isSelectedDate = selectedDates.has(dateStr);
          return (
            <div
              key={idx}
              data-date={dateStr}
              onPointerUp={(e) => { if (e.pointerType === 'mouse') onToggleDate(dateStr); }}
              className={`aspect-square flex flex-col items-center justify-center rounded-xl text-xs transition-all relative cursor-pointer select-none
                ${isSelectedDate ? 'ring-2 ring-purple-500 ring-offset-1 z-10 scale-105' : ''}
                ${status === 'success' ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-100' :
                  status === 'fail' ? 'bg-red-400 text-white font-bold shadow-md shadow-red-100' :
                  'bg-gray-50 text-gray-600 hover:bg-gray-100'}
              `}
            >
              {day}
              {isToday(day) && !status && <div className="absolute bottom-1 w-1 h-1 bg-blue-400 rounded-full" />}
            </div>
          );
        })}
      </div>
      {selectedDates.size > 0 && (
        <div className="mt-5 bg-gray-50 rounded-2xl p-4 border border-gray-200 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black text-gray-600">{selectedDates.size}일 선택됨</span>
            <button onClick={onClearSelection} className="text-[10px] font-bold text-gray-400 hover:text-gray-600 transition-colors">선택 초기화</button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onMarkStatus('success')}
              className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-700 transition-all active:scale-[0.98] shadow-md shadow-blue-100"
            >
              <CheckCircle2 className="w-4 h-4" /> 읽기 성공
            </button>
            <button
              onClick={() => onMarkStatus('fail')}
              className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-600 transition-all active:scale-[0.98] shadow-md shadow-red-100"
            >
              <X className="w-4 h-4" /> 읽기 실패
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
    <div className="max-w-md mx-auto p-6 space-y-8 animate-in fade-in zoom-in duration-300">
      <div className="text-center space-y-3">
        <div className="bg-blue-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 rotate-3 shadow-inner">
          <BookOpen className="w-10 h-10 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">{currentPlan ? "통독 계획 수정" : "성경 읽기 시작하기"}</h2>
        <p className="text-gray-500 text-sm leading-relaxed px-4">읽기 시작할 말씀 구절과 기준 날짜를 설정해 주세요.</p>
      </div>
      <div className="space-y-6">
        <div className="space-y-3">
          <h3 className="font-bold text-xs text-gray-400 uppercase tracking-widest px-1 flex items-center gap-2"><CalendarDays className="w-3 h-3" /> 여정 시작 날짜</h3>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
          />
        </div>
        <div className="space-y-3">
          <h3 className="font-bold text-xs text-gray-400 uppercase tracking-widest px-1">구약 성경</h3>
          <div className="grid grid-cols-2 gap-3">
            <select value={otBook} onChange={e => setOtBook(e.target.value)} className="bg-white border border-gray-200 rounded-2xl px-4 py-3.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm">
              {(BIBLE_METADATA.OT || []).map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
            </select>
            <div className="relative">
              <input type="number" value={otStart} onChange={e => setOtStart(parseInt(e.target.value) || 1)} className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm" />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold pointer-events-none">장 부터</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 font-semibold whitespace-nowrap">하루</span>
            <div className="flex items-center gap-2">
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => setOtPerDay(n)}
                  className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${otPerDay === n ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >{n}</button>
              ))}
            </div>
            <span className="text-xs text-gray-500 font-semibold whitespace-nowrap">장</span>
          </div>
        </div>
        <div className="space-y-3">
          <h3 className="font-bold text-xs text-gray-400 uppercase tracking-widest px-1">신약 성경</h3>
          <div className="grid grid-cols-2 gap-3">
            <select value={ntBook} onChange={e => setNtBook(e.target.value)} className="bg-white border border-gray-200 rounded-2xl px-4 py-3.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm">
              {(BIBLE_METADATA.NT || []).map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
            </select>
            <div className="relative">
              <input type="number" value={ntStart} onChange={e => setNtStart(parseInt(e.target.value) || 1)} className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm" />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold pointer-events-none">장 부터</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 font-semibold whitespace-nowrap">하루</span>
            <div className="flex items-center gap-2">
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => setNtPerDay(n)}
                  className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${ntPerDay === n ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >{n}</button>
              ))}
            </div>
            <span className="text-xs text-gray-500 font-semibold whitespace-nowrap">장</span>
          </div>
        </div>
        <div className="flex flex-col gap-3 pt-2">
          <button
            onClick={() => onSave({ otBook, otStartChapter: otStart, ntBook, ntStartChapter: ntStart, startDate: new Date(startDate).toISOString(), otChaptersPerDay: otPerDay, ntChaptersPerDay: ntPerDay, isPaused: false, pausedAt: null, totalPausedDays: currentPlan?.totalPausedDays || 0 })}
            className="w-full bg-blue-600 text-white py-4.5 rounded-2xl font-bold hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-[0.98]"
          >
            {currentPlan ? "수정 완료" : "말씀 여정 시작하기"}
          </button>
          {onCancel && (
            <button
              onClick={onCancel}
              className="w-full bg-gray-100 text-gray-600 py-3.5 rounded-2xl font-bold hover:bg-gray-200 transition-all"
            >
              취소
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
    if (dateStr === 'unknown') return '날짜 미상';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
  };

  const totalWords = sortedWordDates.reduce((sum, d) => sum + savedWords[d].length, 0);

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-hidden flex flex-col animate-in slide-in-from-right duration-300">
      <header className="bg-white border-b border-gray-100 p-5 sticky top-0 z-10 flex items-center justify-between">
        <h3 className="text-lg font-black text-gray-900">내 저장소</h3>
        <button onClick={onClose} className="p-3 hover:bg-gray-100 rounded-full transition-colors"><X className="w-5 h-5" /></button>
      </header>

      <div className="flex border-b border-gray-200 bg-white shrink-0">
        <button
          onClick={() => setActiveTab('bookmarks')}
          className={`flex-1 py-3 text-sm font-bold text-center transition-all relative ${activeTab === 'bookmarks' ? 'text-blue-600' : 'text-gray-400'}`}
        >
          <span className="inline-flex items-center gap-1.5">
            <BookmarkCheck className="w-4 h-4" /> 북마크
            <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{bookmarks.length}</span>
          </span>
          {activeTab === 'bookmarks' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
        </button>
        <button
          onClick={() => setActiveTab('words')}
          className={`flex-1 py-3 text-sm font-bold text-center transition-all relative ${activeTab === 'words' ? 'text-blue-600' : 'text-gray-400'}`}
        >
          <span className="inline-flex items-center gap-1.5">
            <Languages className="w-4 h-4" /> 주요 단어
            <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{totalWords}</span>
          </span>
          {activeTab === 'words' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {activeTab === 'bookmarks' ? (
          bookmarks.length === 0 ? (
            <div className="py-20 text-center text-gray-400">
              <Bookmark className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-bold text-sm">아직 북마크가 없습니다</p>
              <p className="text-xs mt-1">구절별 보기에서 문장을 북마크해보세요</p>
            </div>
          ) : (
            <div className="space-y-6">
              {sortedBmDates.map(dateStr => (
                <div key={dateStr}>
                  <div className="flex items-center gap-2 mb-3">
                    <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">{formatDateHeader(dateStr)}</h4>
                  </div>
                  <div className="space-y-3">
                    {groupedBookmarks[dateStr].map((bm) => (
                      <div key={bm.id} className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{bm.source}</span>
                            <p className="font-bold text-gray-900 mt-1 leading-relaxed" style={{ fontSize: `${fontSize}px` }}>{bm.text}</p>
                            {bm.note && <p className="text-gray-500 mt-2 italic" style={{ fontSize: `${fontSize - 2}px` }}>{bm.note}</p>}
                          </div>
                          <button onClick={() => bm.id && onDelete(bm.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors shrink-0">
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
            <div className="py-20 text-center text-gray-400">
              <Languages className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-bold text-sm">아직 저장된 단어가 없습니다</p>
              <p className="text-xs mt-1">성경 본문에서 단어를 탭하여 추가해보세요</p>
            </div>
          ) : (
            <div className="space-y-6">
              {sortedWordDates.map(dateStr => (
                <div key={dateStr}>
                  <div className="flex items-center gap-2 mb-3">
                    <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">{formatDateHeader(dateStr)}</h4>
                  </div>
                  <div className="space-y-2">
                    {savedWords[dateStr].map((w, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{w.word}</span>
                          <p className="text-gray-600 text-sm leading-relaxed mt-1.5">{w.meaning}</p>
                        </div>
                        <button onClick={() => onDeleteWord(dateStr, w.word)} className="p-2 text-gray-300 hover:text-red-500 transition-colors shrink-0">
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
          {['일','월','화','수','목','금','토'].map(d => <div key={d}>{d}</div>)}
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
    if (currentBookIndex >= books.length) return { text: "통독 완료", bookName: "" };
    return { text: `${books[currentBookIndex].name} ${currentChapter}장`, bookName: books[currentBookIndex].name };
  };

  const otBooks = getBookProgresses('OT');
  const ntBooks = getBookProgresses('NT');
  const otPos = getCurrentPosition('OT');
  const ntPos = getCurrentPosition('NT');

  const BookGrid: React.FC<{ books: { name: string; firstChar: string; progress: number }[]; currentBookName: string; color: string }> = ({ books, currentBookName, color }) => (
    <div className="flex flex-wrap gap-1.5">
      {books.map((book, i) => {
        const isCurrent = book.name === currentBookName;
        let bg, text;
        if (book.progress >= 1) {
          bg = `bg-${color}-600`;
          text = 'text-white';
        } else if (book.progress > 0) {
          bg = `bg-${color}-100`;
          text = `text-${color}-700`;
        } else {
          bg = 'bg-gray-100';
          text = 'text-gray-400';
        }
        return (
          <div
            key={i}
            title={`${book.name} (${Math.round(book.progress * 100)}%)`}
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${bg} ${text} ${isCurrent ? `ring-2 ring-offset-1 ring-${color}-400` : ''}`}
          >
            {book.firstChar}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="p-5 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center pt-4 pb-2">
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">읽기 현황</h2>
        <p className="text-sm text-gray-400 font-semibold mt-1">
          {effectiveDayDiff >= 0 ? `${effectiveDayDiff + 1}일차 진행 중` : '시작 전'}
        </p>
      </div>

      <div className="space-y-5">
        <div className="bg-white rounded-2xl p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-[10px] font-black text-${otColor}-500 uppercase tracking-widest bg-${otColor}-50 px-2 py-0.5 rounded`}>구약</span>
          </div>
          <BookGrid books={otBooks} currentBookName={otPos.bookName} color={otColor} />
          <p className="text-xs font-bold text-gray-500 mt-3">현재: {otPos.text}</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-[10px] font-black text-${ntColor}-500 uppercase tracking-widest bg-${ntColor}-50 px-2 py-0.5 rounded`}>신약</span>
          </div>
          <BookGrid books={ntBooks} currentBookName={ntPos.bookName} color={ntColor} />
          <p className="text-xs font-bold text-gray-500 mt-3">현재: {ntPos.text}</p>
        </div>
      </div>

      <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">오늘의 읽기 분량</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-black text-${otColor}-500 bg-${otColor}-50 px-2 py-0.5 rounded`}>구약</span>
            <span className="text-sm font-bold text-gray-900">{todayOtRange}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-black text-${ntColor}-500 bg-${ntColor}-50 px-2 py-0.5 rounded`}>신약</span>
            <span className="text-sm font-bold text-gray-900">{todayNtRange}</span>
          </div>
        </div>
      </div>

      <button
        onClick={onStartReading}
        className="w-full bg-blue-600 text-white py-4.5 rounded-2xl font-bold text-base hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
      >
        <BookOpen className="w-5 h-5" /> 오늘의 말씀 읽기
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
      `오늘의 성경 읽기 범위 - 구약: ${otRange}, 신약: ${ntRange}`,
      reflection?.old_testament?.summary ? `구약 요약: ${reflection.old_testament.summary}` : '',
      reflection?.new_testament?.summary ? `신약 요약: ${reflection.new_testament.summary}` : '',
    ].filter(Boolean).join('\n');
    const result = await getDeepReflection(userMsg, context);
    setMessages(prev => [...prev, { role: 'assistant', content: result || '답변을 가져올 수 없습니다.' }]);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/50 flex flex-col items-center justify-end animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white w-full max-w-2xl rounded-t-3xl flex flex-col max-h-[85vh] animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
        <div className="p-5 pb-3 border-b border-gray-100">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-black text-gray-900">궁금한 점 물어보기</h3>
          </div>
          <p className="text-xs text-gray-400 font-medium mt-1">오늘 읽은 말씀에 대해 자유롭게 질문하세요</p>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-10">
              <MessageSquare className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400 font-medium">궁금한 것을 물어보세요!</p>
              <div className="mt-4 space-y-2">
                {['이 본문의 역사적 배경은?', '오늘 말씀의 핵심 메시지는?', '실생활에 어떻게 적용할 수 있을까?'].map((q, i) => (
                  <button key={i} onClick={() => setInput(q)} className="block w-full text-left text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2.5 rounded-xl font-semibold transition-colors">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white font-semibold rounded-br-md'
                  : 'bg-gray-100 text-gray-800 font-medium rounded-bl-md'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-md">
                <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="질문을 입력하세요..."
              className="flex-1 bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <button onClick={handleSend} disabled={loading || !input.trim()} className="bg-blue-600 text-white px-5 py-3 rounded-2xl font-bold text-sm hover:bg-blue-700 transition-all disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : '전송'}
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
    const result = await getDeepReflection(question, `본문: ${source} - "${text}"`);
    setAnswer(result);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/50 flex items-end justify-center animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white w-full max-w-2xl rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
        <div className="bg-blue-50 rounded-2xl p-4 mb-5 border border-blue-100">
          <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{source}</span>
          <p className="text-sm font-bold text-gray-900 mt-1">{text}</p>
        </div>
        <div className="flex gap-2">
          <input
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAsk()}
            placeholder="이 구절에 대해 궁금한 것을 물어보세요..."
            className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <button onClick={handleAsk} disabled={loading} className="bg-blue-600 text-white px-5 py-3 rounded-2xl font-bold text-sm hover:bg-blue-700 transition-all disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : '질문'}
          </button>
        </div>
        {answer && (
          <div className="mt-5 bg-gray-50 rounded-2xl p-5 border border-gray-100 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-medium">
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
  const [colorTheme, setColorTheme] = useState<number>(() => {
    const saved = localStorage.getItem('bible_color_theme');
    return saved ? parseInt(saved) : 0;
  });
  const [showSettings, setShowSettings] = useState(false);
  const theme = COLOR_THEMES[colorTheme] || COLOR_THEMES[0];
  const handleChangeTheme = (idx: number) => {
    setColorTheme(idx);
    localStorage.setItem('bible_color_theme', idx.toString());
  };
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
    start.setHours(0,0,0,0);
    const end = new Date(endDate);
    end.setHours(0,0,0,0);
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
    start.setHours(0,0,0,0);
    const target = new Date(selectedDate);
    target.setHours(0,0,0,0);
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

  const handleAddBookmark = async (text: string, source: string) => {
    if (bookmarks.some(b => b.text === text && b.source === source)) return;
    const bm: BookmarkType = { text, source };
    const saved = await addBookmark(bm);
    setBookmarks(prev => [saved, ...prev]);
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
    start.setHours(0,0,0,0);
    const today = new Date();
    today.setHours(0,0,0,0);
    const calendarDays = Math.round((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const failDays = countFailDays(plan.startDate, today);
    return calendarDays - (plan.totalPausedDays || 0) - failDays;
  })();
  const todayOtRange = getReadingPortion(BIBLE_METADATA.OT, plan.otBook, plan.otStartChapter, todayDayDiff, plan.otChaptersPerDay);
  const todayNtRange = getReadingPortion(BIBLE_METADATA.NT, plan.ntBook, plan.ntStartChapter, todayDayDiff, plan.ntChaptersPerDay);

  return (
    <div className="max-w-2xl mx-auto min-h-screen bg-white shadow-xl border-x border-gray-100 pb-24 font-pretendard">
      <Header
        onSettings={() => setShowSettings(true)}
        onShowBookmarks={() => setShowBookmarks(true)}
        onShowChat={() => setShowChat(true)}
      />
      <div className="bg-gray-50/80 backdrop-blur-md border-b border-gray-100 sticky top-14 z-30 px-4 py-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button onClick={() => changeDay(-1)} className="p-2.5 hover:bg-white hover:shadow-sm rounded-xl transition-all"><ArrowLeft className="w-5 h-5 text-gray-500" /></button>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2">
              <span
                className="text-sm font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                onClick={() => setShowMiniCalendar(true)}
              >
                {dateLabel}
              </span>
              <button onClick={goToToday} className="text-[10px] text-blue-600 font-black bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-wider hover:bg-blue-100 transition-colors">Today</button>
            </div>
            <span className="text-xs font-black text-gray-400 mt-0.5">{dayNum > 0 ? `통독 ${dayNum}일째` : '-'}</span>
          </div>
          <button onClick={() => changeDay(1)} className="p-2.5 hover:bg-white hover:shadow-sm rounded-xl transition-all"><ArrowRight className="w-5 h-5 text-gray-500" /></button>
        </div>
      </div>

      {currentView === 'home' ? (
        <Dashboard
          plan={plan}
          onStartReading={() => setCurrentView('reading')}
          todayOtRange={todayOtRange}
          todayNtRange={todayNtRange}
          effectiveDayDiff={todayDayDiff}
          otColor={theme.ot}
          ntColor={theme.nt}
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
                  accentColor={theme.ot}
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
                  accentColor={theme.nt}
                  note={(savedNotes[selectedDate.toISOString().split('T')[0]] || {}).new || ''}
                  onSaveNote={(n) => handleSaveNote('new', n)}
                />
              )}
              <div className="bg-blue-600 rounded-3xl p-8 shadow-2xl shadow-blue-200 mb-12">
                <div className="flex items-center gap-2 mb-4 text-white/80">
                  <MessageCircle className="w-5 h-5" />
                  <h3 className="font-bold text-xs uppercase tracking-widest">Today's Reflection</h3>
                </div>
                <p className="text-white font-bold text-lg mb-8 leading-relaxed" style={{ fontSize: `${fontSize}px` }}>{reflection.meditation_question}</p>
                <button
                  onClick={async () => {
                    setAiState(prev => ({ ...prev, loading: true }));
                    const context = `구약: ${reflection.old_testament?.summary}, 신약: ${reflection.new_testament?.summary}`;
                    const result = await getDeepReflection(reflection.meditation_question, context);
                    setAiState(prev => ({ ...prev, loading: false, reflectionResponse: result }));
                  }}
                  className="w-full bg-white text-blue-600 py-4.5 rounded-2xl font-bold text-sm hover:bg-blue-50 transition-all shadow-xl"
                >
                  깊은 묵상 열어보기
                </button>
                {aiState.reflectionResponse && (
                  <div className="mt-6 bg-blue-700/30 backdrop-blur-sm p-6 rounded-2xl text-white/90 leading-relaxed whitespace-pre-wrap font-medium border border-white/10" style={{ fontSize: `${fontSize}px` }}>
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
          onBookmark={handleAddBookmark}
          onAsk={(text: string, source: string) => setAskContext({ text, source })}
          fullText={fullBibleText}
          onSaveWord={handleSaveWord}
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
          currentTheme={colorTheme}
          onChangeTheme={handleChangeTheme}
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
    <section className="border-b border-gray-100 pb-12 mb-12">
      <div className="flex items-center justify-between mb-5">
        <span className={`text-[10px] font-black text-${accentColor}-500 tracking-[0.2em] uppercase bg-${accentColor}-50 px-2 py-0.5 rounded`}>{label}</span>
        <div className="flex items-center gap-1">
          <button onClick={() => onCopy(section.summary, `${type}-summary`)} className={`p-2 text-gray-300 hover:text-${accentColor}-500 transition-colors`}>
            {copiedId === `${type}-summary` ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </button>
          <button onClick={handleTTS} disabled={ttsLoading} className={`p-2 transition-colors ${isPlaying ? `text-${accentColor}-500` : `text-gray-300 hover:text-${accentColor}-500`} ${ttsLoading ? 'opacity-50' : ''}`}>
            {ttsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : isPlaying ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
      <h2 className="text-3xl font-black text-gray-900 mb-6 tracking-tight">{section.range}</h2>

      <div className="space-y-4">
        {section.background && (
          <div className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
            <button onClick={() => setShowBackground(!showBackground)} className="w-full flex items-center gap-3 p-4 text-left">
              <Info className={`w-4 h-4 text-${accentColor}-500 shrink-0`} />
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex-1">성경적 배경</h4>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showBackground ? 'rotate-180' : ''}`} />
            </button>
            {showBackground && (
              <div className="px-5 pb-5 pt-0 animate-in fade-in duration-200">
                <p className="text-gray-700 leading-relaxed font-medium" style={{ fontSize: `${fontSize}px` }}>{section.background}</p>
              </div>
            )}
          </div>
        )}

        <div className={`bg-gradient-to-br from-${accentColor}-50 to-white rounded-2xl p-6 border border-${accentColor}-100 shadow-sm`}>
          <h4 className={`text-[10px] font-black text-${accentColor}-400 uppercase tracking-widest mb-2`}>오늘의 핵심 요약</h4>
          <p className="text-gray-900 leading-relaxed font-bold" style={{ fontSize: `${fontSize}px` }}>{section.summary}</p>
        </div>

        {section.figures && section.figures.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            <button onClick={() => setShowFigures(!showFigures)} className="w-full flex items-center gap-3 p-4 text-left">
              <Users className={`w-4 h-4 text-${accentColor}-500 shrink-0`} />
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex-1">등장 인물</h4>
              <span className="text-[10px] font-bold text-gray-300">{section.figures.length}</span>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showFigures ? 'rotate-180' : ''}`} />
            </button>
            {showFigures && (
              <div className="px-5 pb-5 pt-0 space-y-3 animate-in fade-in duration-200">
                {section.figures.map((f: any, i: number) => (
                  <div key={i}>
                    <span className="font-bold text-xs text-gray-900">{f.name}</span>
                    <p className="text-gray-500 leading-normal" style={{ fontSize: `${fontSize - 2}px` }}>{f.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {section.vocabulary && section.vocabulary.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            <button onClick={() => setShowVocabulary(!showVocabulary)} className="w-full flex items-center gap-3 p-4 text-left">
              <Languages className={`w-4 h-4 text-${accentColor}-500 shrink-0`} />
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex-1">주요 단어</h4>
              <span className="text-[10px] font-bold text-gray-300">{section.vocabulary.length}</span>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showVocabulary ? 'rotate-180' : ''}`} />
            </button>
            {showVocabulary && (
              <div className="px-5 pb-5 pt-0 space-y-3 animate-in fade-in duration-200">
                {section.vocabulary.map((v: any, i: number) => (
                  <div key={i}>
                    <span className="font-bold text-xs text-gray-900">{v.word}</span>
                    <p className="text-gray-500 leading-normal" style={{ fontSize: `${fontSize - 2}px` }}>{v.meaning}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-3 mt-8">
        <button onClick={onExegesis} className="flex-1 bg-gray-900 text-white py-4.5 rounded-2xl font-bold text-sm hover:bg-black flex items-center justify-center gap-2 shadow-lg shadow-gray-200 transition-all active:scale-[0.98]">
          <BookText className="w-4 h-4" /> 구절별 자세히 보기
        </button>
        <button onClick={() => setShowNote(true)} className={`px-5 py-4.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${note ? `bg-${accentColor}-100 text-${accentColor}-700 border border-${accentColor}-200` : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          <PenLine className="w-4 h-4" />
        </button>
      </div>

      {showNote && (
        <div className="fixed inset-0 z-[70] bg-black/50 flex items-end justify-center animate-in fade-in duration-200" onClick={() => setShowNote(false)}>
          <div className="bg-white w-full max-w-2xl rounded-t-3xl p-6 max-h-[70vh] flex flex-col animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <PenLine className={`w-5 h-5 text-${accentColor}-500`} />
                <h3 className="font-black text-gray-900">내 생각</h3>
                <span className={`text-[10px] font-black text-${accentColor}-500 bg-${accentColor}-50 px-2 py-0.5 rounded`}>{section.range}</span>
              </div>
              <button onClick={() => setShowNote(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <textarea
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="이 말씀을 읽고 느낀 점, 적용할 점을 자유롭게 적어보세요..."
              className="flex-1 min-h-[200px] bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-medium text-gray-900 leading-relaxed outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              style={{ fontSize: `${fontSize}px` }}
              autoFocus
            />
            <button
              onClick={() => { onSaveNote(noteText); setShowNote(false); }}
              className={`w-full mt-4 bg-${accentColor}-600 text-white py-3.5 rounded-2xl font-bold text-sm hover:opacity-90 transition-all active:scale-[0.98]`}
            >
              저장하기
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
  onBookmark: (text: string, source: string) => void,
  onAsk: (text: string, source: string) => void,
  fullText: { range: string; version: string; verses: BibleVerse[]; done: boolean } | null,
  onSaveWord: (word: string, meaning: string) => void
}> = ({ data, isStreaming, onClose, fontSize, onCopy, copiedId, onBookmark, onAsk, fullText, onSaveWord }) => {
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'fulltext' | 'exegesis'>('fulltext');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [tappedWords, setTappedWords] = useState<Array<{ word: string; meaning: string | null; loading: boolean }>>([]);
  const [pendingWord, setPendingWord] = useState<{ word: string; verseText: string } | null>(null);
  const [pendingRemoveWord, setPendingRemoveWord] = useState<string | null>(null);

  const extractNoun = (w: string): string => {
    const particles = [
      '에게서', '으로서', '으로써', '로부터', '에서는', '에게는', '한테서',
      '까지는', '부터는', '이라고', '이라는', '에서', '에게', '한테', '으로',
      '까지', '부터', '마저', '조차', '밖에', '처럼', '만큼', '대로', '께서',
      '로서', '로써', '과는', '와는', '이는', '에는', '들을', '들이', '들은',
      '은', '는', '이', '가', '을', '를', '의', '에', '도', '만', '와', '과',
      '로', '께', '서', '들',
    ];
    for (const p of particles) {
      if (w.endsWith(p) && w.length > p.length + 1) {
        return w.slice(0, -p.length);
      }
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
      setTappedWords(prev => prev.map(w => w.word === word ? { ...w, meaning: '설명을 가져올 수 없습니다.', loading: false } : w));
    }
  };

  const handleBookmark = (text: string, source: string, id: string) => {
    if (bookmarkedIds.has(id)) return;
    onBookmark(text, source);
    setBookmarkedIds(prev => new Set(prev).add(id));
  };

  // Auto-scroll to bottom as new items stream in (only on exegesis tab)
  useEffect(() => {
    if (isStreaming && activeTab === 'exegesis' && scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [data.items.length, isStreaming, activeTab]);

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
      <header className="bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between shrink-0">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h3 className="text-2xl font-black text-gray-900 tracking-tight">{data.range}</h3>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] font-black text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded tracking-wider">쉬운성경</span>
          </div>
        </div>
        <button onClick={onClose} className="p-3 hover:bg-gray-100 rounded-full transition-colors"><X className="w-6 h-6" /></button>
      </header>

      {/* Tab navigation */}
      <div className="flex border-b border-gray-200 bg-white shrink-0">
        <button
          onClick={() => setActiveTab('fulltext')}
          className={`flex-1 py-3 text-sm font-bold text-center transition-all relative ${
            activeTab === 'fulltext' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <span className="inline-flex items-center gap-1.5">
            성경 본문
            {activeTab !== 'fulltext' && fullText && !fullText.done && (
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            )}
          </span>
          {activeTab === 'fulltext' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
        </button>
        <button
          onClick={() => setActiveTab('exegesis')}
          className={`flex-1 py-3 text-sm font-bold text-center transition-all relative ${
            activeTab === 'exegesis' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <span className="inline-flex items-center gap-1.5">
            핵심 해설
            {activeTab !== 'exegesis' && isStreaming && (
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            )}
          </span>
          {activeTab === 'exegesis' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
        </button>
      </div>

      {/* Tab 1: Full Bible Text (streaming) with tappable words */}
      {activeTab === 'fulltext' && (
        <>
          {fullText && fullText.verses.length === 0 && !fullText.done ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
              <p className="text-gray-400 font-bold text-sm">성경 본문을 불러오고 있습니다...</p>
            </div>
          ) : (
            <div className="flex-1 min-h-0 flex flex-col">
              <div className="flex-1 overflow-y-auto">
                <div className="max-w-3xl mx-auto p-6 md:p-10 space-y-4 pb-12">
                  {fullText?.verses.map((verse, idx) => (
                    <div key={idx} className="flex gap-3 items-start animate-in fade-in duration-300 group">
                      <span className="text-blue-500 font-black text-xs mt-1 shrink-0 w-10 text-right tabular-nums">{verse.verseNum}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-900 leading-[1.9] font-medium flex flex-wrap" style={{ fontSize: `${fontSize}px` }}>
                          {verse.text.split(/(\s+)/).map((segment, sIdx) => {
                            if (/^\s+$/.test(segment)) return <span key={sIdx}>{segment}</span>;
                            const cleaned = segment.replace(/^[^\uAC00-\uD7A3a-zA-Z0-9]+|[^\uAC00-\uD7A3a-zA-Z0-9]+$/g, '');
                            const noun = extractNoun(cleaned);
                            const isTapped = tappedWords.some(w => w.word === noun);
                            return (
                              <span
                                key={sIdx}
                                onClick={() => handleWordTap(segment, verse.text)}
                                className={`cursor-pointer transition-colors rounded px-0.5 ${
                                  isTapped ? 'bg-blue-100 text-blue-700' : 'active:bg-yellow-100'
                                }`}
                              >
                                {segment}
                              </span>
                            );
                          })}
                        </p>
                        <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleBookmark(verse.text, `${data.range} ${verse.verseNum}`, `ft-bm-${idx}`)}
                            className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-black transition-all ${
                              bookmarkedIds.has(`ft-bm-${idx}`) ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-400 hover:text-amber-500'
                            }`}
                          >
                            {bookmarkedIds.has(`ft-bm-${idx}`) ? <BookmarkCheck className="w-3 h-3" /> : <Bookmark className="w-3 h-3" />}
                            <span>{bookmarkedIds.has(`ft-bm-${idx}`) ? '저장됨' : '북마크'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {fullText && !fullText.done && fullText.verses.length > 0 && (
                    <div className="flex items-center justify-center gap-3 py-4">
                      <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                      <span className="text-sm font-bold text-gray-400">본문 로딩 중...</span>
                    </div>
                  )}
                </div>
              </div>
              {pendingWord && (
                <div className="shrink-0 border-t border-blue-100 bg-blue-50 px-5 py-3 flex items-center justify-between animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-blue-700">"{pendingWord.word}"</span>
                    <span className="text-xs text-gray-500">의 뜻을 검색할까요?</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setPendingWord(null)} className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-700 transition-colors">취소</button>
                    <button onClick={confirmWord} className="px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-all active:scale-95">추가</button>
                  </div>
                </div>
              )}
              {pendingRemoveWord && (
                <div className="shrink-0 border-t border-red-100 bg-red-50 px-5 py-3 flex items-center justify-between animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-red-600">"{pendingRemoveWord}"</span>
                    <span className="text-xs text-gray-500">을(를) 목록에서 제거할까요?</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setPendingRemoveWord(null)} className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-700 transition-colors">취소</button>
                    <button onClick={() => { setTappedWords(prev => prev.filter(w => w.word !== pendingRemoveWord)); setPendingRemoveWord(null); }} className="px-4 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 transition-all active:scale-95">제거</button>
                  </div>
                </div>
              )}
              {tappedWords.length > 0 && (
                <div className="shrink-0 border-t border-gray-200 bg-white px-5 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Languages className="w-4 h-4 text-blue-500" />
                      <span className="text-xs font-black text-gray-700">주요 단어</span>
                      <span className="text-[10px] font-bold text-white bg-blue-500 px-1.5 py-0.5 rounded-full">{tappedWords.length}</span>
                    </div>
                    <button onClick={() => setTappedWords([])} className="text-[10px] font-bold text-gray-400 hover:text-gray-600 transition-colors">초기화</button>
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {tappedWords.map((tw, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded shrink-0">{tw.word}</span>
                        {tw.loading ? (
                          <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin mt-0.5" />
                        ) : (
                          <span className="text-xs text-gray-600 leading-relaxed">{tw.meaning}</span>
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

      {/* Tab 2: Exegesis (existing) */}
      {activeTab === 'exegesis' && (
        <>
          {data.items.length === 0 && isStreaming ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
              <p className="text-gray-400 font-bold text-sm">핵심 구절을 선별하고 있습니다...</p>
            </div>
          ) : (
            <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto">
              <div className="max-w-3xl mx-auto p-6 md:p-10 space-y-10 pb-12">
                {data.items.map((item, idx) => (
                  <div key={idx} className="animate-in fade-in slide-in-from-bottom-2 duration-500 bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
                    {/* Verse */}
                    <div className="p-5 bg-[#FAFAFA]">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-blue-500 font-black text-[12px] tracking-widest uppercase">{item.verseNum}</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleBookmark(item.text, `${data.range} ${item.verseNum}`, `bm-v-${idx}`)}
                            className={`flex items-center gap-1 px-2 py-1.5 rounded-full text-[10px] font-black transition-all shadow-sm ${
                              bookmarkedIds.has(`bm-v-${idx}`) ? 'bg-amber-500 text-white' : 'bg-white text-gray-400 border border-gray-100 hover:text-amber-500'
                            }`}
                          >
                            {bookmarkedIds.has(`bm-v-${idx}`) ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => onAsk(item.text, `${data.range} ${item.verseNum}`)}
                            className="flex items-center gap-1 px-2 py-1.5 rounded-full text-[10px] font-black bg-white text-gray-400 border border-gray-100 hover:text-blue-500 transition-all shadow-sm"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onCopy(item.text, `ex-v-${idx}`)}
                            className={`flex items-center gap-1 px-2 py-1.5 rounded-full text-[10px] font-black transition-all shadow-sm ${
                              copiedId === `ex-v-${idx}` ? 'bg-green-500 text-white' : 'bg-white text-gray-400 border border-gray-100 hover:text-gray-900'
                            }`}
                          >
                            {copiedId === `ex-v-${idx}` ? <ClipboardCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                      <p className="text-gray-900 font-bold leading-[1.8]" style={{ fontSize: `${fontSize + 2}px` }}>{item.text}</p>
                    </div>
                    {/* Explanation */}
                    <div className="p-5 bg-white border-t border-gray-100">
                      <div className="flex items-center justify-between mb-3">
                        <span className="bg-gray-900 text-white font-black text-[10px] px-2.5 py-1 rounded tracking-tighter uppercase">{item.verseNum} 해설</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleBookmark(item.explanation, `${data.range} ${item.verseNum} 해설`, `bm-e-${idx}`)}
                            className={`flex items-center gap-1 px-2 py-1.5 rounded-full text-[10px] font-black transition-all shadow-sm ${
                              bookmarkedIds.has(`bm-e-${idx}`) ? 'bg-amber-500 text-white' : 'bg-gray-50 text-gray-400 border border-gray-100 hover:text-amber-500'
                            }`}
                          >
                            {bookmarkedIds.has(`bm-e-${idx}`) ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => onAsk(item.explanation, `${data.range} ${item.verseNum} 해설`)}
                            className="flex items-center gap-1 px-2 py-1.5 rounded-full text-[10px] font-black bg-gray-50 text-gray-400 border border-gray-100 hover:text-blue-500 transition-all shadow-sm"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onCopy(item.explanation, `ex-e-${idx}`)}
                            className={`flex items-center gap-1 px-2 py-1.5 rounded-full text-[10px] font-black transition-all shadow-sm ${
                              copiedId === `ex-e-${idx}` ? 'bg-green-500 text-white' : 'bg-gray-50 text-gray-400 border border-gray-100 hover:text-gray-900'
                            }`}
                          >
                            {copiedId === `ex-e-${idx}` ? <ClipboardCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap font-medium" style={{ fontSize: `${fontSize}px` }}>{item.explanation}</p>
                    </div>
                  </div>
                ))}
                {isStreaming && data.items.length > 0 && (
                  <div className="flex items-center justify-center gap-3 py-6">
                    <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                    <span className="text-sm font-bold text-gray-400">다음 구절 해설 중...</span>
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
