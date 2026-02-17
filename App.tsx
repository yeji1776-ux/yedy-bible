import React, { useState, useEffect, useCallback } from 'react';
import {
  BookOpen,
  Volume2,
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
  Lock
} from 'lucide-react';
import { DailyReflection, AIState, ReadingHistory, ReadingPlan } from './types';
import { fetchDailyReflection, getDetailedExegesis, getDeepReflection, playTTS } from './services/geminiService';
import { loadPlan, savePlan, loadHistory, markDateComplete, loadReflectionCache, saveReflection, clearReflectionCache, clearAllData } from './services/supabase';

const APP_PASSWORD = '0516';

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
          <div className="bg-blue-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5 rotate-3 shadow-inner">
            <BookOpen className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">yedy's bible</h1>
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
    { name: "사사기", chapters: 21 }, { name: "루기", chapters: 4 }, { name: "사무엘상", chapters: 31 },
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

const BIBLE_VERSIONS = ["개역개정", "개역한글", "새번역", "공동번역", "쉬운성경", "NIV", "KJV"];

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
  onReset?: () => void,
  onEditPlan?: () => void,
  fontSize: number, 
  onFontSizeChange: (size: number) => void 
}> = ({ onReset, onEditPlan, fontSize, onFontSizeChange }) => {
  const [showFontControls, setShowFontControls] = useState(false);
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <BookOpen className="w-5 h-5 text-blue-600 cursor-pointer" />
          <h1 className="text-lg font-bold text-gray-900 tracking-tight cursor-pointer">yedy's bible</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button 
              onClick={() => setShowFontControls(!showFontControls)}
              className={`p-2 rounded-lg transition-all ${showFontControls ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-900'}`}
              title="글자 크기 조절"
            >
              <TypeIcon className="w-4 h-4" />
            </button>
            {showFontControls && (
              <div className="absolute right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl p-3 flex items-center gap-4 animate-in fade-in zoom-in duration-150 z-50">
                <button 
                  onClick={() => onFontSizeChange(Math.max(14, fontSize - 1))}
                  className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
                  disabled={fontSize <= 14}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-sm font-bold w-12 text-center text-gray-900 tabular-nums">{fontSize}px</span>
                <button 
                  onClick={() => onFontSizeChange(Math.min(24, fontSize + 1))}
                  className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
                  disabled={fontSize >= 24}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          {onEditPlan && (
            <button onClick={onEditPlan} className="p-2 text-gray-400 hover:text-gray-900 transition-colors" title="통독 계획 수정">
              <Edit2 className="w-4 h-4" />
            </button>
          )}
          {onReset && (
            <button onClick={() => { if(confirm("초기화하시겠습니까?")) onReset(); }} className="p-2 text-gray-400 hover:text-gray-900 transition-colors" title="설정 초기화">
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

const Calendar: React.FC<{ history: ReadingHistory; selectedDate: Date; onDateSelect: (d: Date) => void }> = ({ history, selectedDate, onDateSelect }) => {
  const [viewDate, setViewDate] = useState(new Date(selectedDate));
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);
  const isToday = (d: number) => {
    const today = new Date();
    return today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
  };
  const isSelected = (d: number) => {
    return selectedDate.getFullYear() === year && selectedDate.getMonth() === month && selectedDate.getDate() === d;
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 mt-8 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2 text-gray-800">
          <CalendarIcon className="w-4 h-4 text-blue-500" />
          <h3 className="font-bold text-sm">{year}년 {month + 1}월 읽기 기록</h3>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setViewDate(new Date(year, month - 1))} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><ChevronLeft className="w-4 h-4 text-gray-500" /></button>
          <button onClick={() => setViewDate(new Date(year, month + 1))} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><ChevronRight className="w-4 h-4 text-gray-500" /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-gray-400 mb-3 uppercase tracking-tighter">
        {['일', '월', '화', '수', '목', '금', '토'].map(d => <div key={d}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day, idx) => {
          if (day === null) return <div key={idx} />;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isDone = history[dateStr];
          return (
            <button 
              key={idx} 
              onClick={() => onDateSelect(new Date(year, month, day))}
              className={`aspect-square flex flex-col items-center justify-center rounded-xl text-xs transition-all relative
                ${isSelected(day) ? 'ring-2 ring-blue-500 ring-offset-2 z-10 scale-110 shadow-lg' : ''}
                ${isDone ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-100' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}
              `}
            >
              {day}
              {isToday(day) && !isDone && <div className="absolute bottom-1 w-1 h-1 bg-blue-400 rounded-full" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const SetupView: React.FC<{ currentPlan?: ReadingPlan | null, onSave: (p: ReadingPlan) => void, onCancel?: () => void }> = ({ currentPlan, onSave, onCancel }) => {
  const [otBook, setOtBook] = useState(currentPlan?.otBook || "창세기");
  const [otStart, setOtStart] = useState(currentPlan?.otStartChapter || 1);
  const [ntBook, setNtBook] = useState(currentPlan?.ntBook || "마태복음");
  const [ntStart, setNtStart] = useState(currentPlan?.ntStartChapter || 1);
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
          <h3 className="font-bold text-xs text-gray-400 uppercase tracking-widest px-1">구약 성경 (하루 2장)</h3>
          <div className="grid grid-cols-2 gap-3">
            <select value={otBook} onChange={e => setOtBook(e.target.value)} className="bg-white border border-gray-200 rounded-2xl px-4 py-3.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm">
              {(BIBLE_METADATA.OT || []).map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
            </select>
            <div className="relative">
              <input type="number" value={otStart} onChange={e => setOtStart(parseInt(e.target.value) || 1)} className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm" />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold pointer-events-none">장 부터</span>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <h3 className="font-bold text-xs text-gray-400 uppercase tracking-widest px-1">신약 성경 (하루 1장)</h3>
          <div className="grid grid-cols-2 gap-3">
            <select value={ntBook} onChange={e => setNtBook(e.target.value)} className="bg-white border border-gray-200 rounded-2xl px-4 py-3.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm">
              {(BIBLE_METADATA.NT || []).map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
            </select>
            <div className="relative">
              <input type="number" value={ntStart} onChange={e => setNtStart(parseInt(e.target.value) || 1)} className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm" />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold pointer-events-none">장 부터</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3 pt-2">
          <button 
            onClick={() => onSave({ otBook, otStartChapter: otStart, ntBook, ntStartChapter: ntStart, startDate: new Date(startDate).toISOString() })}
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

const App: React.FC = () => {
  const [isAuthed, setIsAuthed] = useState(() => sessionStorage.getItem('yedy_bible_auth') === 'true');
  const [plan, setPlan] = useState<ReadingPlan | null>(null);
  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const [history, setHistory] = useState<ReadingHistory>({});
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [reflection, setReflection] = useState<DailyReflection | null>(null);
  const [aiState, setAiState] = useState<AIState>({ loading: false, error: null, detailedExegesis: null, reflectionResponse: null });
  const [fontSize, setFontSize] = useState<number>(16);
  const [selectedVersion, setSelectedVersion] = useState<string>("개역개정");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const [reflectionCache, setReflectionCache] = useState<Record<string, DailyReflection>>({});
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    if (!isAuthed) return;
    (async () => {
      const [savedPlan, savedHistory, savedCache] = await Promise.all([
        loadPlan(),
        loadHistory(),
        loadReflectionCache(),
      ]);
      if (savedPlan) setPlan(savedPlan);
      setHistory(savedHistory);
      setReflectionCache(savedCache);
      const savedFontSize = localStorage.getItem('bible_reading_font_size');
      const savedVersion = localStorage.getItem('bible_reading_version');
      if (savedFontSize) setFontSize(parseInt(savedFontSize));
      if (savedVersion) setSelectedVersion(savedVersion);
      setDataLoaded(true);
    })();
  }, [isAuthed]);

  useEffect(() => {
    localStorage.setItem('bible_reading_font_size', fontSize.toString());
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('bible_reading_version', selectedVersion);
  }, [selectedVersion]);

  const fetchContent = useCallback(async () => {
    if (!plan || isEditingPlan) return;
    const dateStr = selectedDate.toISOString().split('T')[0];
    if (reflectionCache[dateStr]) {
      setReflection(reflectionCache[dateStr]);
      setAiState(prev => ({ ...prev, loading: false, error: null }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setAiState(prev => ({ ...prev, loading: true, error: null, reflectionResponse: null, detailedExegesis: null }));
    const start = new Date(plan.startDate);
    start.setHours(0,0,0,0);
    const target = new Date(selectedDate);
    target.setHours(0,0,0,0);
    const dayDiff = Math.round((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (dayDiff < 0) {
      setReflection(null);
      setAiState(prev => ({ ...prev, loading: false, error: "시작일 이전의 기록은 확인할 수 없습니다." }));
      return;
    }
    const otRange = getReadingPortion(BIBLE_METADATA.OT, plan.otBook, plan.otStartChapter, dayDiff, 2);
    const ntRange = getReadingPortion(BIBLE_METADATA.NT, plan.ntBook, plan.ntStartChapter, dayDiff, 1);
    try {
      const result = await fetchDailyReflection(otRange, ntRange);
      if (result) {
        setReflection(result);
        setReflectionCache(prev => ({ ...prev, [dateStr]: result }));
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
  }, [plan, selectedDate, isEditingPlan, reflectionCache]);

  useEffect(() => {
    fetchContent();
  }, [selectedDate, plan, isEditingPlan, fetchContent]);

  const handleSavePlan = async (p: ReadingPlan) => {
    await savePlan(p);
    setPlan(p);
    setReflectionCache({});
    await clearReflectionCache();
    setIsEditingPlan(false);
  };

  const handleReset = async () => {
    await clearAllData();
    localStorage.clear();
    window.location.reload();
  };

  const handleComplete = async () => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    const newHistory = { ...history, [dateStr]: true };
    setHistory(newHistory);
    await markDateComplete(dateStr);
    alert("오늘의 여정을 완료했습니다!");
  };

  const handleExegesis = async (type: 'old' | 'new', version?: string) => {
    if (!reflection) return;
    const data = type === 'old' ? reflection.old_testament : reflection.new_testament;
    if (!data) return;
    setAiState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const targetVersion = version || selectedVersion;
      const result = await getDetailedExegesis(data.range, targetVersion);
      if (result) {
        setAiState(prev => ({ ...prev, detailedExegesis: result }));
      }
    } catch (e: any) {
      setAiState(prev => ({ ...prev, error: "해설을 불러오지 못했습니다." }));
    } finally {
      setAiState(prev => ({ ...prev, loading: false }));
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
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
      <Header fontSize={fontSize} onFontSizeChange={setFontSize} />
      <SetupView 
        currentPlan={plan} 
        onSave={handleSavePlan} 
        onCancel={plan ? () => setIsEditingPlan(false) : undefined} 
      />
    </div>
  );

  const start = new Date(plan.startDate);
  start.setHours(0,0,0,0);
  const targetDate = new Date(selectedDate);
  targetDate.setHours(0,0,0,0);
  const dayNum = Math.round((targetDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const dateLabel = selectedDate.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });

  return (
    <div className="max-w-2xl mx-auto min-h-screen bg-white shadow-xl border-x border-gray-100 pb-24 font-pretendard">
      <Header 
        onReset={handleReset} 
        onEditPlan={() => setIsEditingPlan(true)}
        fontSize={fontSize} 
        onFontSizeChange={setFontSize} 
      />
      <div className="bg-gray-50/80 backdrop-blur-md border-b border-gray-100 sticky top-14 z-30 px-4 py-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button onClick={() => changeDay(-1)} className="p-2.5 hover:bg-white hover:shadow-sm rounded-xl transition-all"><ArrowLeft className="w-5 h-5 text-gray-500" /></button>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{dayNum}일차</span>
              <span className="text-sm font-bold text-gray-900">{dateLabel}</span>
            </div>
            <button onClick={goToToday} className="text-[10px] text-blue-600 font-bold hover:underline mt-0.5 uppercase tracking-wider">Today</button>
          </div>
          <button onClick={() => changeDay(1)} className="p-2.5 hover:bg-white hover:shadow-sm rounded-xl transition-all"><ArrowRight className="w-5 h-5 text-gray-500" /></button>
        </div>
      </div>
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
            {/* Old Testament Section */}
            {reflection.old_testament && (
              <StudySection 
                type="old" 
                section={reflection.old_testament} 
                fontSize={fontSize} 
                onExegesis={() => handleExegesis('old')} 
                onCopy={handleCopyText} 
                copiedId={copiedId} 
              />
            )}
            {/* New Testament Section */}
            {reflection.new_testament && (
              <StudySection 
                type="new" 
                section={reflection.new_testament} 
                fontSize={fontSize} 
                onExegesis={() => handleExegesis('new')} 
                onCopy={handleCopyText} 
                copiedId={copiedId} 
              />
            )}
            {/* Reflection Section */}
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
                <div className="mt-6 bg-blue-700/30 backdrop-blur-sm p-6 rounded-2xl text-sm text-white/90 leading-relaxed whitespace-pre-wrap font-medium border border-white/10">
                  {aiState.reflectionResponse}
                </div>
              )}
            </div>
            <button onClick={handleComplete} className="w-full bg-gray-100 text-gray-900 py-5 rounded-3xl font-black text-lg flex items-center justify-center gap-3 hover:bg-blue-600 hover:text-white transition-all shadow-sm group">
              <CheckCircle2 className="w-7 h-7 text-blue-500 group-hover:text-white" /> 이 날의 여정 완료
            </button>
          </div>
        ) : null}
        <Calendar history={history} selectedDate={selectedDate} onDateSelect={setSelectedDate} />
      </main>

      {/* Detailed Exegesis Overlay */}
      {aiState.detailedExegesis && (
        <ExegesisOverlay 
          data={aiState.detailedExegesis} 
          onClose={() => setAiState(prev => ({ ...prev, detailedExegesis: null }))}
          onVersionChange={async (v) => {
            setSelectedVersion(v);
            if (aiState.detailedExegesis) {
              setAiState(prev => ({ ...prev, loading: true }));
              const res = await getDetailedExegesis(aiState.detailedExegesis!.range, v);
              setAiState(prev => ({ ...prev, detailedExegesis: res, loading: false }));
            }
          }}
          selectedVersion={selectedVersion}
          fontSize={fontSize}
          onCopy={handleCopyText}
          copiedId={copiedId}
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
  copiedId: string | null
}> = ({ type, section, fontSize, onExegesis, onCopy, copiedId }) => {
  const accentColor = type === 'old' ? 'blue' : 'green';
  const label = type === 'old' ? 'Old Testament' : 'New Testament';
  return (
    <section className="border-b border-gray-100 pb-12 mb-12">
      <div className="flex items-center justify-between mb-5">
        <span className={`text-[10px] font-black text-${accentColor}-500 tracking-[0.2em] uppercase bg-${accentColor}-50 px-2 py-0.5 rounded`}>{label}</span>
        <div className="flex items-center gap-1">
          <button onClick={() => onCopy(section.summary, `${type}-summary`)} className={`p-2 text-gray-300 hover:text-${accentColor}-500 transition-colors`}>
            {copiedId === `${type}-summary` ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </button>
          <button onClick={() => playTTS(`${section.range}. ${section.summary}`)} className={`p-2 text-gray-300 hover:text-${accentColor}-500 transition-colors`}><Volume2 className="w-4 h-4" /></button>
        </div>
      </div>
      <h2 className="text-3xl font-black text-gray-900 mb-6 tracking-tight">{section.range}</h2>
      
      <div className="space-y-6">
        {/* Background Information */}
        {section.background && (
          <div className="flex gap-4 items-start bg-gray-50 rounded-2xl p-5 border border-gray-100">
            <Info className={`w-5 h-5 text-${accentColor}-500 mt-1 shrink-0`} />
            <div>
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">성경적 배경</h4>
              <p className="text-gray-700 leading-relaxed font-medium text-sm">{section.background}</p>
            </div>
          </div>
        )}
        
        {/* Summary */}
        <div className={`bg-gradient-to-br from-${accentColor}-50 to-white rounded-2xl p-6 border border-${accentColor}-100 shadow-sm`}>
          <h4 className={`text-[10px] font-black text-${accentColor}-400 uppercase tracking-widest mb-2`}>오늘의 핵심 요약</h4>
          <p className="text-gray-900 leading-relaxed font-bold" style={{ fontSize: `${fontSize}px` }}>{section.summary}</p>
        </div>

        {/* Figures & Vocabulary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {section.figures && section.figures.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Users className={`w-4 h-4 text-${accentColor}-500`} />
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">등장 인물</h4>
              </div>
              <div className="space-y-3">
                {section.figures.map((f: any, i: number) => (
                  <div key={i}>
                    <span className="font-bold text-xs text-gray-900">{f.name}</span>
                    <p className="text-[11px] text-gray-500 leading-normal">{f.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {section.vocabulary && section.vocabulary.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Languages className={`w-4 h-4 text-${accentColor}-500`} />
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">주요 단어</h4>
              </div>
              <div className="space-y-3">
                {section.vocabulary.map((v: any, i: number) => (
                  <div key={i}>
                    <span className="font-bold text-xs text-gray-900">{v.word}</span>
                    <p className="text-[11px] text-gray-500 leading-normal">{v.meaning}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <button onClick={onExegesis} className="w-full mt-8 bg-gray-900 text-white py-4.5 rounded-2xl font-bold text-sm hover:bg-black flex items-center justify-center gap-2 shadow-lg shadow-gray-200 transition-all active:scale-[0.98]">
        <BookText className="w-4 h-4" /> 구절별 자세히 보기
      </button>
    </section>
  );
};

const ExegesisOverlay: React.FC<{
  data: any,
  onClose: () => void,
  onVersionChange: (v: string) => void,
  selectedVersion: string,
  fontSize: number,
  onCopy: (t: string, id: string) => void,
  copiedId: string | null
}> = ({ data, onClose, onVersionChange, selectedVersion, fontSize, onCopy, copiedId }) => {
  return (
    <div className="fixed inset-0 z-50 bg-white overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300">
      <header className="bg-white border-b border-gray-100 p-5 sticky top-0 z-10 flex items-center justify-between">
        <div className="flex flex-col">
          <h3 className="text-2xl font-black text-gray-900 tracking-tight">{data.range}</h3>
          <span className="text-[10px] font-black text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded tracking-wider w-fit mt-1">{selectedVersion}</span>
        </div>
        <button onClick={onClose} className="p-3 hover:bg-gray-100 rounded-full transition-colors"><X className="w-6 h-6" /></button>
      </header>
      
      <div className="flex-1 overflow-hidden h-full grid grid-cols-1 lg:grid-cols-2">
        {/* Scripture View */}
        <div className="border-r border-gray-100 overflow-y-auto p-6 md:p-10 bg-[#FAFAFA]">
          <div className="sticky top-0 bg-transparent pb-8 flex items-center justify-between z-10">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">말씀 본문</span>
            <select 
              value={selectedVersion} 
              onChange={(e) => onVersionChange(e.target.value)}
              className="bg-white border border-gray-200 rounded-xl text-xs font-bold px-3 py-2 outline-none"
            >
              {BIBLE_VERSIONS.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="space-y-12">
            {data.items.map((item: any, idx: number) => (
              <div key={idx} className="group relative">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-blue-500 font-black text-[12px] tracking-widest uppercase">{item.verseNum}</span>
                  <button 
                    onClick={() => onCopy(item.text, `ex-v-${idx}`)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black transition-all shadow-sm ${
                      copiedId === `ex-v-${idx}` ? 'bg-green-500 text-white' : 'bg-white text-gray-400 border border-gray-100 hover:text-gray-900'
                    }`}
                  >
                    {copiedId === `ex-v-${idx}` ? <><ClipboardCheck className="w-3.5 h-3.5" /> 복사됨</> : <><Copy className="w-3.5 h-3.5" /> 구절 복사</>}
                  </button>
                </div>
                <p className="text-gray-900 font-bold leading-[1.8]" style={{ fontSize: `${fontSize + 2}px` }}>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
        
        {/* Explanation View */}
        <div className="overflow-y-auto p-6 md:p-10 bg-white">
          <div className="sticky top-0 bg-white pb-8 z-10">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">구절별 상세 해설</span>
          </div>
          <div className="space-y-12">
            {data.items.map((item: any, idx: number) => (
              <div key={idx} className="group">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="bg-gray-900 text-white font-black text-[10px] px-2.5 py-1 rounded tracking-tighter uppercase">{item.verseNum} 해설</span>
                    <div className="h-px bg-gray-100 flex-1" />
                  </div>
                  <button 
                    onClick={() => onCopy(item.explanation, `ex-e-${idx}`)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black transition-all shadow-sm ml-3 shrink-0 ${
                      copiedId === `ex-e-${idx}` ? 'bg-green-500 text-white' : 'bg-gray-50 text-gray-400 border border-gray-100 hover:text-gray-900'
                    }`}
                  >
                    {copiedId === `ex-e-${idx}` ? <><ClipboardCheck className="w-3.5 h-3.5" /> 복사됨</> : <><Copy className="w-3.5 h-3.5" /> 해설 복사</>}
                  </button>
                </div>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap font-medium" style={{ fontSize: `${fontSize}px` }}>{item.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
