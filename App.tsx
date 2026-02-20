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
  Palette,
  ChevronDown,
  PenLine,
  BarChart3,
  LogOut,
  Share2,
  Heart,
  Underline,
  ScanFace
} from 'lucide-react';
import { DailyReflection, AIState, ReadingHistory, ReadingPlan, Bookmark as BookmarkType, ExegesisItem, BibleVerse } from './types';
import { fetchDailyReflection, streamDetailedExegesis, getDeepReflection, playTTS, fetchWordMeaning, generateSimplifiedVerses } from './services/geminiService';
import { fetchBibleText } from './services/bibleApi';
import { loadPlan, savePlan, loadHistory, markDatesStatus, loadReflectionCache, saveReflection, clearReflectionCache, clearAllData, loadBookmarks, addBookmark, deleteBookmark, loadSimplifiedVerses, saveSimplifiedVerses } from './services/supabase';

const APP_PASSWORD = '0516';

function toLocalDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const KR_FONTS = [
  { name: 'Pretendard', family: "'Pretendard', sans-serif", desc: '깔끔한 고딕' },
  { name: 'Noto Sans KR', family: "'Noto Sans KR', sans-serif", desc: '구글 기본 고딕' },
  { name: 'Noto Serif KR', family: "'Noto Serif KR', serif", desc: '격조 있는 명조' },
  { name: 'Gothic A1', family: "'Gothic A1', sans-serif", desc: '모던 고딕' },
  { name: 'Gowun Batang', family: "'Gowun Batang', serif", desc: '따뜻한 바탕체' },
];

const EN_FONTS = [
  { name: 'IBM Plex Sans', family: "'IBM Plex Sans', sans-serif", desc: 'Clean & Neutral' },
  { name: 'Inter', family: "'Inter', sans-serif", desc: 'Modern Classic' },
  { name: 'DM Sans', family: "'DM Sans', sans-serif", desc: 'Geometric' },
  { name: 'Libre Baskerville', family: "'Libre Baskerville', serif", desc: 'Elegant Serif' },
  { name: 'Space Grotesk', family: "'Space Grotesk', sans-serif", desc: 'Retro Minimal' },
];

const VINTAGE_THEMES = [
  { name: '먹빛', accent: '#1A1A1A', sub: '#4A4A4A', bg: '#FDFDFD', paper: '#F5F2ED', desc: '차분한 흑백' },
  { name: '고서', accent: '#5C4033', sub: '#8B7355', bg: '#FAF6F0', paper: '#F0E8DA', desc: '오래된 책갈피' },
  { name: '잉크', accent: '#2C3E50', sub: '#4A5D74', bg: '#F8FAFB', paper: '#EDF1F4', desc: '깊은 남색 잉크' },
  { name: '이끼', accent: '#3D4F3D', sub: '#5B6D5B', bg: '#F9FAF7', paper: '#EEF2E8', desc: '숲속 빈티지' },
  { name: '벽돌', accent: '#6B3A3A', sub: '#8B4E4E', bg: '#FBF8F7', paper: '#F3ECE8', desc: '따뜻한 적벽돌' },
];

const SettingsPanel: React.FC<{
  fontSize: number;
  titleFontSize: number;
  onFontSizeChange: (size: number) => void;
  onTitleFontSizeChange: (size: number) => void;
  onEditPlan?: () => void;
  onReset: () => void;
  onClose: () => void;
  krFont: number;
  enFont: number;
  themeIdx: number;
  onKrFont: (i: number) => void;
  onEnFont: (i: number) => void;
  onTheme: (i: number) => void;
  onLogout: () => void;
}> = ({ fontSize, titleFontSize, onFontSizeChange, onTitleFontSizeChange, onEditPlan, onReset, onClose, krFont, enFont, themeIdx, onKrFont, onEnFont, onTheme, onLogout }) => {
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [groupOpen, setGroupOpen] = useState(false);
  const toggle = (key: string) => setOpenSection(prev => prev === key ? null : key);

  return (
  <div className="fixed inset-0 z-50 bg-accent-black/40 backdrop-blur-sm flex items-end justify-center animate-in fade-in duration-200" onClick={onClose}>
    <div className="bg-bg-primary w-full max-w-2xl rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
      <div className="w-12 h-1 bg-border-light rounded-full mx-auto mb-6" />
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Settings className="w-5 h-5 text-accent-black" />
          <h3 className="text-lg font-black text-text-primary tracking-tight">설정</h3>
        </div>
        <button onClick={onClose} className="p-1.5 hover:bg-bg-secondary rounded-lg transition-colors"><X className="w-4 h-4 text-text-tertiary" /></button>
      </div>

      <div className="space-y-2 mb-6">
        {/* 폰트 & 테마 그룹 */}
        <button onClick={() => setGroupOpen(prev => !prev)} className="w-full flex items-center justify-between p-3.5 rounded-xl border border-border-light hover:border-border-medium transition-all">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-text-tertiary" />
            <span className="text-xs font-bold text-text-primary">폰트 & 테마</span>
          </div>
          <ChevronDown className={`w-3.5 h-3.5 text-text-tertiary transition-transform ${groupOpen ? 'rotate-180' : ''}`} />
        </button>
        {groupOpen && <div className="space-y-2 pl-2 border-l-2 border-border-light ml-2">
        {/* 제목 크기 */}
        <button onClick={() => toggle('titleSize')} className="w-full flex items-center justify-between p-3.5 rounded-xl border border-border-light hover:border-border-medium transition-all">
          <div className="flex items-center gap-2">
            <TypeIcon className="w-4 h-4 text-text-tertiary" />
            <span className="text-xs font-bold text-text-primary">제목 크기</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-text-tertiary">{titleFontSize}pt</span>
            <ChevronDown className={`w-3.5 h-3.5 text-text-tertiary transition-transform ${openSection === 'titleSize' ? 'rotate-180' : ''}`} />
          </div>
        </button>
        {openSection === 'titleSize' && (
          <div className="flex items-center gap-4 bg-bg-secondary rounded-xl p-3 border border-border-light mx-2">
            <button onClick={() => onTitleFontSizeChange(Math.max(12, titleFontSize - 1))} disabled={titleFontSize <= 12} className="w-8 h-8 flex items-center justify-center bg-bg-primary border border-border-light rounded-lg text-text-secondary hover:border-accent-black transition-all disabled:opacity-30"><Minus className="w-3 h-3" /></button>
            <div className="flex-1 text-center">
              <span className="text-base font-mono font-black text-text-primary tabular-nums">{titleFontSize}pt</span>
            </div>
            <button onClick={() => onTitleFontSizeChange(Math.min(28, titleFontSize + 1))} disabled={titleFontSize >= 28} className="w-8 h-8 flex items-center justify-center bg-bg-primary border border-border-light rounded-lg text-text-secondary hover:border-accent-black transition-all disabled:opacity-30"><Plus className="w-3 h-3" /></button>
          </div>
        )}

        {/* 내용 크기 */}
        <button onClick={() => toggle('size')} className="w-full flex items-center justify-between p-3.5 rounded-xl border border-border-light hover:border-border-medium transition-all">
          <div className="flex items-center gap-2">
            <TypeIcon className="w-4 h-4 text-text-tertiary" />
            <span className="text-xs font-bold text-text-primary">내용 크기</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-text-tertiary">{fontSize}pt</span>
            <ChevronDown className={`w-3.5 h-3.5 text-text-tertiary transition-transform ${openSection === 'size' ? 'rotate-180' : ''}`} />
          </div>
        </button>
        {openSection === 'size' && (
          <div className="flex items-center gap-4 bg-bg-secondary rounded-xl p-3 border border-border-light mx-2">
            <button onClick={() => onFontSizeChange(Math.max(12, fontSize - 1))} disabled={fontSize <= 12} className="w-8 h-8 flex items-center justify-center bg-bg-primary border border-border-light rounded-lg text-text-secondary hover:border-accent-black transition-all disabled:opacity-30"><Minus className="w-3 h-3" /></button>
            <div className="flex-1 text-center">
              <span className="text-base font-mono font-black text-text-primary tabular-nums">{fontSize}pt</span>
            </div>
            <button onClick={() => onFontSizeChange(Math.min(24, fontSize + 1))} disabled={fontSize >= 24} className="w-8 h-8 flex items-center justify-center bg-bg-primary border border-border-light rounded-lg text-text-secondary hover:border-accent-black transition-all disabled:opacity-30"><Plus className="w-3 h-3" /></button>
          </div>
        )}

        {/* 한글 서체 */}
        <button onClick={() => toggle('krFont')} className="w-full flex items-center justify-between p-3.5 rounded-xl border border-border-light hover:border-border-medium transition-all">
          <div className="flex items-center gap-2">
            <TypeIcon className="w-4 h-4 text-text-tertiary" />
            <span className="text-xs font-bold text-text-primary">한글 서체</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-tertiary">{KR_FONTS[krFont].name}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-text-tertiary transition-transform ${openSection === 'krFont' ? 'rotate-180' : ''}`} />
          </div>
        </button>
        {openSection === 'krFont' && (
          <div className="space-y-1.5 mx-2">
            {KR_FONTS.map((f, i) => (
              <button key={i} onClick={() => onKrFont(i)} className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${krFont === i ? 'border-accent-black bg-bg-secondary' : 'border-border-light hover:border-border-medium'}`}>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-text-primary" style={{ fontFamily: f.family }}>{f.name}</span>
                  <span className="text-[10px] text-text-tertiary">{f.desc}</span>
                </div>
                <span className="text-[11px] text-text-secondary" style={{ fontFamily: f.family }}>가나다라 말씀</span>
              </button>
            ))}
          </div>
        )}

        {/* 영문 서체 */}
        <button onClick={() => toggle('enFont')} className="w-full flex items-center justify-between p-3.5 rounded-xl border border-border-light hover:border-border-medium transition-all">
          <div className="flex items-center gap-2">
            <TypeIcon className="w-4 h-4 text-text-tertiary" />
            <span className="text-xs font-bold text-text-primary">영문 서체</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-tertiary">{EN_FONTS[enFont].name}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-text-tertiary transition-transform ${openSection === 'enFont' ? 'rotate-180' : ''}`} />
          </div>
        </button>
        {openSection === 'enFont' && (
          <div className="space-y-1.5 mx-2">
            {EN_FONTS.map((f, i) => (
              <button key={i} onClick={() => onEnFont(i)} className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${enFont === i ? 'border-accent-black bg-bg-secondary' : 'border-border-light hover:border-border-medium'}`}>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-text-primary" style={{ fontFamily: f.family }}>{f.name}</span>
                  <span className="text-[10px] text-text-tertiary">{f.desc}</span>
                </div>
                <span className="text-[11px] text-text-secondary" style={{ fontFamily: f.family }}>Archive Bible</span>
              </button>
            ))}
          </div>
        )}

        {/* 색상 테마 */}
        <button onClick={() => toggle('theme')} className="w-full flex items-center justify-between p-3.5 rounded-xl border border-border-light hover:border-border-medium transition-all">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-text-tertiary" />
            <span className="text-xs font-bold text-text-primary">색상 테마</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: VINTAGE_THEMES[themeIdx].accent }} />
              <div className="w-4 h-4 rounded" style={{ backgroundColor: VINTAGE_THEMES[themeIdx].sub }} />
            </div>
            <span className="text-xs text-text-tertiary">{VINTAGE_THEMES[themeIdx].name}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-text-tertiary transition-transform ${openSection === 'theme' ? 'rotate-180' : ''}`} />
          </div>
        </button>
        {openSection === 'theme' && (
          <div className="space-y-1.5 mx-2">
            {VINTAGE_THEMES.map((t, i) => (
              <button key={i} onClick={() => onTheme(i)} className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${themeIdx === i ? 'border-accent-black bg-bg-secondary' : 'border-border-light hover:border-border-medium'}`}>
                <div className="flex gap-1 shrink-0">
                  <div className="w-5 h-5 rounded" style={{ backgroundColor: t.accent }} />
                  <div className="w-5 h-5 rounded" style={{ backgroundColor: t.sub }} />
                  <div className="w-5 h-5 rounded border border-border-light" style={{ backgroundColor: t.paper }} />
                </div>
                <div className="flex-1 text-left">
                  <span className="text-sm font-bold text-text-primary">{t.name}</span>
                  <span className="text-[10px] text-text-tertiary ml-2">{t.desc}</span>
                </div>
              </button>
            ))}
          </div>
        )}
        </div>}
      </div>

      <div className="space-y-3 pt-4 border-t border-border-light">
        <button
          onClick={() => {
            const url = window.location.href;
            if (navigator.share) {
              navigator.share({ title: "Hare's Bible", url });
            } else {
              navigator.clipboard.writeText(url);
              alert('링크가 복사되었습니다!');
            }
          }}
          className="w-full bg-bg-primary text-text-primary py-3.5 rounded-full font-bold text-[10px] hover:bg-bg-secondary transition-all border border-border-light flex items-center justify-center gap-2 uppercase tracking-widest"
        >
          <Share2 className="w-3.5 h-3.5" /> 앱 주소 공유하기
        </button>
        {onEditPlan && (
          <button onClick={() => { onEditPlan(); onClose(); }} className="w-full py-3.5 rounded-full font-bold text-[10px] flex items-center justify-center gap-2 uppercase tracking-widest transition-all hover:opacity-80" style={{ background: '#EDF1F4', color: '#2C3E50' }}>
            <Edit2 className="w-3.5 h-3.5" /> 통독 계획 수정
          </button>
        )}
        <button
          onClick={() => { onLogout(); onClose(); }}
          className="w-full bg-bg-primary text-text-secondary py-3.5 rounded-full font-bold text-[10px] hover:bg-bg-secondary transition-all border border-border-light flex items-center justify-center gap-2 uppercase tracking-widest"
        >
          <LogOut className="w-3.5 h-3.5" /> 로그아웃
        </button>
        <button
          onClick={() => { if (confirm("모든 데이터를 초기화하시겠습니까?")) onReset(); }}
          className="w-full bg-bg-primary text-accent-red py-3.5 rounded-full font-bold text-[10px] hover:bg-accent-red/5 transition-all border border-accent-red/20 uppercase tracking-widest"
        >
          데이터 초기화
        </button>
      </div>
    </div>
  </div>
  );
};

const PasswordGate: React.FC<{ onAuth: () => void }> = ({ onAuth }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const [success, setSuccess] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const initiated = useRef(false);
  const maxLen = 4;

  const completeAuth = () => {
    setSuccess(true);
    setTimeout(() => { sessionStorage.setItem('yedy_bible_auth', 'true'); onAuth(); }, 600);
  };

  const tryBiometricAuth = async () => {
    const credIdStr = localStorage.getItem('yedy_biometric_cred');
    if (!credIdStr) return false;
    try {
      const credId = Uint8Array.from(atob(credIdStr), c => c.charCodeAt(0));
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          allowCredentials: [{ id: credId, type: 'public-key' as const, transports: ['internal' as AuthenticatorTransport] }],
          userVerification: 'required',
          timeout: 60000
        }
      });
      if (assertion) { completeAuth(); return true; }
    } catch {}
    return false;
  };

  const tryBiometricRegister = async () => {
    try {
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          rp: { name: "Hare's Bible" },
          user: { id: crypto.getRandomValues(new Uint8Array(16)), name: 'user', displayName: 'User' },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' as const },
            { alg: -257, type: 'public-key' as const }
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform' as const,
            userVerification: 'required'
          },
          timeout: 60000
        }
      });
      if (credential) {
        const rawId = new Uint8Array((credential as PublicKeyCredential).rawId);
        localStorage.setItem('yedy_biometric_cred', btoa(String.fromCharCode(...rawId)));
        completeAuth();
        return true;
      }
    } catch {}
    return false;
  };

  useEffect(() => {
    if (initiated.current) return;
    initiated.current = true;
    (async () => {
      if (!window.PublicKeyCredential) return;
      try {
        const ok = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        setBiometricAvailable(ok);
        if (ok && localStorage.getItem('yedy_biometric_cred')) {
          tryBiometricAuth();
        }
      } catch {}
    })();
  }, []);

  const handleBiometricTap = () => {
    if (success) return;
    if (localStorage.getItem('yedy_biometric_cred')) {
      tryBiometricAuth();
    } else {
      tryBiometricRegister();
    }
  };

  const handleKey = (num: string) => {
    if (password.length >= maxLen || success) return;
    const next = password + num;
    setError(false);
    setPassword(next);
    if (next.length === maxLen) {
      if (next === APP_PASSWORD) {
        completeAuth();
      } else {
        setError(true);
        setShake(true);
        setTimeout(() => { setShake(false); setPassword(''); }, 500);
      }
    }
  };

  const handleDelete = () => {
    if (success) return;
    setPassword(prev => prev.slice(0, -1));
    setError(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center relative overflow-hidden" style={{ background: '#2c2f2c' }}>
      {/* Header area */}
      <div className="w-full pt-14 pb-4 px-8">
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] mb-5" style={{ color: 'rgba(255,255,255,0.25)' }}>Established 2026</p>
        <div className="flex items-center gap-3">
          <svg viewBox="0 0 512 512" className="w-5 h-5"><path d="M256,18 C390,4 494,100 498,248 C502,396 405,480 256,488 C107,496 10,396 14,248 C18,100 122,32 256,18Z" fill="rgba(255,255,255,0.08)"/><path d="M258,72 C365,58 445,142 450,250 C455,358 378,432 262,426 C146,420 65,348 62,242 C59,136 151,86 258,72Z" fill="rgba(255,255,255,0.16)"/><path d="M260,140 C330,130 390,180 394,252 C398,324 345,375 264,370 C183,365 125,320 122,250 C119,180 190,150 260,140Z" fill="rgba(255,255,255,0.28)"/><circle cx="261" cy="256" r="72" fill="rgba(255,255,255,0.42)"/></svg>
          <h1 className="text-[18px] font-medium uppercase tracking-[0.35em]" style={{ color: 'rgba(255,255,255,0.45)' }}>Hare's Bible</h1>
        </div>
        <div className="mt-4 w-10 h-[2px]" style={{ background: 'rgba(255,255,255,0.15)' }} />
      </div>

      {/* Center content */}
      <div className={`flex-1 flex flex-col items-center justify-center w-full max-w-[360px] px-6 ${shake ? 'pw-shake' : ''}`}>
        {/* Access code label */}
        <p className="text-[11px] font-medium uppercase tracking-[0.25em] mb-6" style={{ color: error ? '#c47070' : 'rgba(255,255,255,0.35)' }}>
          {error ? '잘못된 암호입니다' : '암호를 입력하세요'}
        </p>

        {/* Dot indicators */}
        <div className="flex justify-center gap-5 mb-14">
          {Array.from({ length: maxLen }).map((_, i) => (
            <div key={i} className={`w-[9px] h-[9px] rounded-full transition-all duration-300`} style={{
              background: error ? '#c47070' :
                success ? 'rgba(160,190,160,0.8)' :
                i < password.length ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.25)',
              transitionDelay: success ? `${i * 80}ms` : '0ms'
            }} />
          ))}
        </div>

        {/* Number pad */}
        <div className="grid grid-cols-3 w-full" style={{ rowGap: '6px' }}>
          {['1','2','3','4','5','6','7','8','9'].map(n => (
            <button key={n} onClick={() => handleKey(n)} className="flex items-center justify-center h-[72px] active:opacity-40 transition-opacity duration-100" style={{ background: 'transparent', border: 'none' }}>
              <span className="text-[36px] font-extralight" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: "'Pretendard', -apple-system, sans-serif" }}>{n}</span>
            </button>
          ))}
          {biometricAvailable ? (
            <button onClick={handleBiometricTap} className="flex items-center justify-center h-[72px] active:opacity-40 transition-opacity duration-100" style={{ background: 'transparent', border: 'none' }}>
              <ScanFace className="w-[26px] h-[26px]" style={{ color: 'rgba(255,255,255,0.35)' }} />
            </button>
          ) : (
            <div className="flex items-center justify-center h-[72px]" />
          )}
          <button onClick={() => handleKey('0')} className="flex items-center justify-center h-[72px] active:opacity-40 transition-opacity duration-100" style={{ background: 'transparent', border: 'none' }}>
            <span className="text-[36px] font-extralight" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: "'Pretendard', -apple-system, sans-serif" }}>0</span>
          </button>
          <button onClick={handleDelete} className="flex items-center justify-center h-[72px] active:opacity-40 transition-opacity duration-100" style={{ background: 'transparent', border: 'none' }}>
            <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'rgba(255,255,255,0.35)' }}>
              <path d="M21 4H8l-7 8 7 8h13a2 2 0 002-2V6a2 2 0 00-2-2z" />
              <line x1="18" y1="9" x2="12" y2="15" />
              <line x1="12" y1="9" x2="18" y2="15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Bottom spacer */}
      <div className="pb-12" />

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15%, 55% { transform: translateX(-10px); }
          35%, 75% { transform: translateX(10px); }
        }
        .pw-shake { animation: shake 0.45s cubic-bezier(0.36, 0.07, 0.19, 0.97); }
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
          <svg viewBox="0 0 512 512" className="w-8 h-8"><path d="M256,18 C390,4 494,100 498,248 C502,396 405,480 256,488 C107,496 10,396 14,248 C18,100 122,32 256,18Z" fill="#DDD0C0"/><path d="M258,72 C365,58 445,142 450,250 C455,358 378,432 262,426 C146,420 65,348 62,242 C59,136 151,86 258,72Z" fill="#B8996E"/><path d="M260,140 C330,130 390,180 394,252 C398,324 345,375 264,370 C183,365 125,320 122,250 C119,180 190,150 260,140Z" fill="#8B6642"/><circle cx="261" cy="256" r="72" fill="#5C3D2E"/></svg>
          <div>
            <h1 className="text-base font-black text-text-primary tracking-tight serif-text">Hare's Bible</h1>
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
        {['일', '월', '화', '수', '목', '금', '토'].map(d => <div key={d}>{d}</div>)}
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
              className={`aspect-square flex flex-col items-center justify-center rounded-lg text-[11px] font-black transition-all relative cursor-pointer select-none
                ${isSelectedDate ? 'ring-1 ring-accent-black ring-offset-2 z-10 scale-110' : ''}
                ${status === 'success' ? 'bg-accent-blue text-white' :
                  status === 'fail' ? 'bg-accent-red text-white' :
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
  const [startDate, setStartDate] = useState(currentPlan?.startDate ? toLocalDateStr(new Date(currentPlan.startDate)) : toLocalDateStr(new Date()));

  return (
    <div className="max-w-sm mx-auto p-4 animate-in fade-in zoom-in-95 duration-500">
      <div className="bg-bg-paper border border-border-light rounded-xl p-5 space-y-5 shadow-card">
        <div className="text-center space-y-1">
          <h2 className="text-sm font-black text-text-primary serif-text tracking-tighter">{currentPlan ? "통독 계획 수정" : "통독 계획 설정"}</h2>
          <p className="text-text-tertiary text-[8px] font-black uppercase tracking-widest">읽기 범위와 시작일을 설정하세요</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <h3 className="font-black text-[8px] text-text-tertiary uppercase tracking-widest px-0.5 flex items-center gap-1.5"><CalendarDays className="w-2.5 h-2.5" /> 시작일</h3>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full bg-bg-primary border border-border-light rounded-lg px-2.5 py-2 text-[11px] font-mono font-bold outline-none focus:border-accent-black transition-all"
            />
          </div>

          <div className="space-y-2">
            <h3 className="font-black text-[8px] text-text-tertiary uppercase tracking-widest px-0.5">구약 설정</h3>
            <div className="grid grid-cols-2 gap-2">
              <select value={otBook} onChange={e => setOtBook(e.target.value)} className="bg-bg-primary border border-border-light rounded-lg px-2.5 py-2 text-[11px] font-bold outline-none focus:border-accent-black transition-all">
                {(BIBLE_METADATA.OT || []).map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
              </select>
              <div className="relative">
                <input type="number" value={otStart} onChange={e => setOtStart(parseInt(e.target.value) || 1)} className="w-full bg-bg-primary border border-border-light rounded-lg px-2.5 py-2 text-[11px] font-mono font-bold outline-none focus:border-accent-black transition-all" />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[7px] font-black text-text-tertiary uppercase">시작 장</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[8px] text-text-tertiary font-black uppercase tracking-widest shrink-0">하루</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} onClick={() => setOtPerDay(n)}
                    className={`w-7 h-7 rounded-md text-[9px] font-black transition-all ${otPerDay === n ? 'bg-accent-black text-white shadow-lg' : 'bg-bg-secondary text-text-secondary hover:bg-border-light'}`}
                  >{n}</button>
                ))}
              </div>
              <span className="text-[8px] text-text-tertiary font-black">장</span>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-black text-[8px] text-text-tertiary uppercase tracking-widest px-0.5">신약 설정</h3>
            <div className="grid grid-cols-2 gap-2">
              <select value={ntBook} onChange={e => setNtBook(e.target.value)} className="bg-bg-primary border border-border-light rounded-lg px-2.5 py-2 text-[11px] font-bold outline-none focus:border-accent-black transition-all">
                {(BIBLE_METADATA.NT || []).map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
              </select>
              <div className="relative">
                <input type="number" value={ntStart} onChange={e => setNtStart(parseInt(e.target.value) || 1)} className="w-full bg-bg-primary border border-border-light rounded-lg px-2.5 py-2 text-[11px] font-mono font-bold outline-none focus:border-accent-black transition-all" />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[7px] font-black text-text-tertiary uppercase">시작 장</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[8px] text-text-tertiary font-black uppercase tracking-widest shrink-0">하루</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} onClick={() => setNtPerDay(n)}
                    className={`w-7 h-7 rounded-md text-[9px] font-black transition-all ${ntPerDay === n ? 'bg-accent-black text-white shadow-lg' : 'bg-bg-secondary text-text-secondary hover:bg-border-light'}`}
                  >{n}</button>
                ))}
              </div>
              <span className="text-[8px] text-text-tertiary font-black">장</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          {onCancel && (
            <button
              onClick={onCancel}
              className="flex-1 bg-bg-secondary text-text-tertiary py-2.5 rounded-lg font-black text-[9px] hover:text-accent-black transition-all uppercase tracking-widest border border-border-light"
            >
              취소
            </button>
          )}
          <button
            onClick={() => onSave({ otBook, otStartChapter: otStart, ntBook, ntStartChapter: ntStart, startDate: new Date(startDate).toISOString(), otChaptersPerDay: otPerDay, ntChaptersPerDay: ntPerDay, isPaused: false, pausedAt: null, totalPausedDays: currentPlan?.totalPausedDays || 0 })}
            className={`${onCancel ? 'flex-1' : 'w-full'} btn-analogue py-2.5 text-[9px] tracking-[0.2em] font-black bg-accent-black text-white`}
          >
            {currentPlan ? "계획 수정" : "시작하기"}
          </button>
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
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'highlights' | 'words'>('bookmarks');

  // Read highlights from localStorage
  type HLItem = { id: string; start: number; end: number; note: string; text?: string };
  const [allHighlights, setAllHighlights] = useState<Record<string, HLItem[]>>(() => {
    try { const s = localStorage.getItem('bible_highlights'); return s ? JSON.parse(s) : {}; } catch { return {}; }
  });

  const deleteHighlight = (cardKey: string, hlId: string) => {
    const next = { ...allHighlights };
    next[cardKey] = (next[cardKey] || []).filter(h => h.id !== hlId);
    if (next[cardKey].length === 0) delete next[cardKey];
    setAllHighlights(next);
    localStorage.setItem('bible_highlights', JSON.stringify(next));
  };

  // Parse cardKey to get Bible reference: "ft-창세기 1-2-1:3" or "레위기 5-6-5:1"
  const parseCardKey = (key: string) => {
    const clean = key.startsWith('ft-') ? key.slice(3) : key;
    const lastDash = clean.lastIndexOf('-');
    if (lastDash > 0) {
      return { range: clean.slice(0, lastDash), verse: clean.slice(lastDash + 1) };
    }
    return { range: clean, verse: '' };
  };

  // Flatten highlights into a list with metadata
  const flatHighlights = (Object.entries(allHighlights) as [string, HLItem[]][]).flatMap(([cardKey, hls]) => {
    const { range, verse } = parseCardKey(cardKey);
    return hls.map(hl => ({
      ...hl,
      cardKey,
      range,
      verse,
      source: `${range} ${verse}`,
      date: toLocalDateStr(new Date(parseInt(hl.id))),
      isFulltext: cardKey.startsWith('ft-'),
    }));
  }).sort((a, b) => parseInt(b.id) - parseInt(a.id));

  // Group by date
  const hlByDate = flatHighlights.reduce((acc: Record<string, typeof flatHighlights>, hl) => {
    if (!acc[hl.date]) acc[hl.date] = [];
    acc[hl.date].push(hl);
    return acc;
  }, {});
  const sortedHlDates = Object.keys(hlByDate).sort((a, b) => b.localeCompare(a));

  const groupedBookmarks = bookmarks.reduce((acc: Record<string, BookmarkType[]>, bm) => {
    const dateKey = bm.created_at ? toLocalDateStr(new Date(bm.created_at)) : 'unknown';
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(bm);
    return acc;
  }, {});
  const sortedBmDates = Object.keys(groupedBookmarks).sort((a, b) => b.localeCompare(a));
  const sortedWordDates = Object.keys(savedWords).filter(k => savedWords[k].length > 0).sort((a, b) => b.localeCompare(a));

  const formatDateHeader = (dateStr: string) => {
    if (dateStr === 'unknown') return 'DATE UNKNOWN';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const totalWords = sortedWordDates.reduce((sum, d) => sum + savedWords[d].length, 0);

  return (
    <div className="fixed inset-0 z-50 bg-bg-secondary overflow-hidden flex flex-col animate-in slide-in-from-right duration-300">
      <header className="bg-bg-primary border-b border-border-light p-6 sticky top-0 z-10 flex items-center justify-between shadow-subtle">
        <div>
          <h3 className="text-xl font-black text-text-primary serif-text uppercase tracking-tighter">내 서재</h3>
          <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">저장한 구절 & 단어 & 밑줄</p>
        </div>
        <button onClick={onClose} className="p-3 hover:bg-bg-secondary rounded-full transition-colors border border-border-light shadow-subtle"><X className="w-5 h-5" /></button>
      </header>

      <div className="flex bg-bg-primary border-b border-border-light shrink-0">
        <button
          onClick={() => setActiveTab('bookmarks')}
          className={`flex-1 py-3.5 text-[9px] font-black text-center transition-all relative uppercase tracking-[0.15em] ${activeTab === 'bookmarks' ? 'text-accent-black' : 'text-text-tertiary opacity-50'}`}
        >
          <span className="inline-flex items-center gap-1.5">
            <BookmarkCheck className="w-3 h-3" /> 북마크
            <span className="text-[8px] font-black text-white bg-accent-black px-1.5 py-0.5 rounded-full">{bookmarks.length}</span>
          </span>
          {activeTab === 'bookmarks' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-accent-black" />}
        </button>
        <button
          onClick={() => setActiveTab('highlights')}
          className={`flex-1 py-3.5 text-[9px] font-black text-center transition-all relative uppercase tracking-[0.15em] ${activeTab === 'highlights' ? 'text-accent-black' : 'text-text-tertiary opacity-50'}`}
        >
          <span className="inline-flex items-center gap-1.5">
            <Underline className="w-3 h-3" /> 밑줄
            <span className="text-[8px] font-black text-white bg-accent-blue px-1.5 py-0.5 rounded-full">{flatHighlights.length}</span>
          </span>
          {activeTab === 'highlights' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-accent-black" />}
        </button>
        <button
          onClick={() => setActiveTab('words')}
          className={`flex-1 py-3.5 text-[9px] font-black text-center transition-all relative uppercase tracking-[0.15em] ${activeTab === 'words' ? 'text-accent-black' : 'text-text-tertiary opacity-50'}`}
        >
          <span className="inline-flex items-center gap-1.5">
            <Languages className="w-3 h-3" /> 단어
            <span className="text-[8px] font-black text-white bg-accent-black px-1.5 py-0.5 rounded-full">{totalWords}</span>
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
              <p className="font-black text-xs text-text-tertiary uppercase tracking-widest leading-loose text-center">아직 저장한 구절이 없습니다.<br />말씀을 읽고 구절을 저장해보세요.</p>
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
        ) : activeTab === 'highlights' ? (
          flatHighlights.length === 0 ? (
            <div className="py-24 text-center">
              <div className="w-16 h-16 bg-bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6 border border-border-light shadow-inner sticker-card">
                <Underline className="w-8 h-8 text-text-tertiary opacity-30" />
              </div>
              <p className="font-black text-xs text-text-tertiary uppercase tracking-widest leading-loose text-center">밑줄 친 내용이 없습니다.<br />본문이나 해설에서 텍스트를 드래그해보세요.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {sortedHlDates.map(dateStr => (
                <div key={dateStr}>
                  <div className="flex items-center gap-3 mb-4">
                    <CalendarDays className="w-3.5 h-3.5 text-text-tertiary" />
                    <h4 className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">{formatDateHeader(dateStr)}</h4>
                  </div>
                  <div className="space-y-4">
                    {hlByDate[dateStr].map(hl => (
                      <div key={hl.id} className="sticker-card py-4 px-6">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <span className="badge-archival text-[8px]">{hl.source}</span>
                              <span className="text-[8px] font-black text-text-tertiary px-1.5 py-0.5 rounded bg-bg-secondary border border-border-light">{hl.isFulltext ? '본문' : '해설'}</span>
                            </div>
                            <p className="text-text-primary font-bold leading-relaxed serif-text mt-1" style={{ fontSize: `${fontSize - 1}px`, borderBottom: '2px solid var(--color-accent-blue)', display: 'inline', paddingBottom: '1px', background: 'rgba(59,130,246,0.08)' }}>
                              {hl.text || '(밑줄 텍스트)'}
                            </p>
                            {hl.note && (
                              <div className="mt-3 p-3 rounded-lg text-[11px] leading-relaxed" style={{ background: 'rgba(74,93,116,0.07)', border: '1px solid rgba(74,93,116,0.15)', color: 'var(--color-accent-blue)' }}>
                                {hl.note}
                              </div>
                            )}
                          </div>
                          <button onClick={() => deleteHighlight(hl.cardKey, hl.id)} className="p-2 text-text-tertiary hover:text-accent-red transition-colors shrink-0">
                            <Trash2 className="w-3.5 h-3.5" />
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
              <p className="font-black text-xs text-text-tertiary uppercase tracking-widest leading-loose text-center">저장한 단어가 없습니다.<br />본문에서 중요한 단어를 추가해보세요.</p>
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
      <div className="absolute top-28 left-1/2 -translate-x-1/2 w-72 bg-white rounded-2xl shadow-2xl border border-border-light p-4 animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setViewDate(new Date(year, month - 1))} className="p-1.5 hover:bg-bg-secondary rounded-lg transition-colors"><ChevronLeft className="w-4 h-4 text-text-tertiary" /></button>
          <span className="text-[11px] font-black text-text-primary uppercase tracking-widest">{year}년 {month + 1}월</span>
          <button onClick={() => setViewDate(new Date(year, month + 1))} className="p-1.5 hover:bg-bg-secondary rounded-lg transition-colors"><ChevronRight className="w-4 h-4 text-text-tertiary" /></button>
        </div>
        <div className="grid grid-cols-7 gap-0.5 text-center text-[9px] font-black text-text-tertiary mb-1 uppercase tracking-wider">
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
                className={`aspect-square flex items-center justify-center rounded-lg text-[11px] font-black transition-all
                  ${isSelected(day) ? 'bg-accent-black text-white' : isToday(day) ? 'bg-bg-paper text-accent-black' : 'text-text-secondary hover:bg-bg-secondary'}
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
    <div className="p-5 space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-1">
        <h2 className="text-lg font-black text-text-primary serif-text uppercase tracking-tighter">Mission Progress</h2>
        <p className="text-[9px] font-black text-text-tertiary uppercase tracking-widest">
          {effectiveDayDiff >= 0 ? `Active Phase: ${String(effectiveDayDiff + 1).padStart(3, '0')}` : 'Mission Pending'}
        </p>
      </div>

      <div className="space-y-4">
        <div className="sticker-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className={`badge-archival bg-accent-blue`}>구약성경</span>
          </div>
          <BookGrid books={otBooks} currentBookName={otPos.bookName} color="accent-blue" />
          <div className="mt-3 pt-3 border-t border-border-light flex justify-between items-center">
            <span className="text-[9px] font-black text-text-tertiary uppercase tracking-widest">현재 위치</span>
            <span className="text-[11px] font-black text-text-primary serif-text">{otPos.text}</span>
          </div>
        </div>

        <div className="sticker-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className={`badge-archival bg-accent-green`}>신약성경</span>
          </div>
          <BookGrid books={ntBooks} currentBookName={ntPos.bookName} color="accent-green" />
          <div className="mt-3 pt-3 border-t border-border-light flex justify-between items-center">
            <span className="text-[9px] font-black text-text-tertiary uppercase tracking-widest">현재 위치</span>
            <span className="text-[11px] font-black text-text-primary serif-text">{ntPos.text}</span>
          </div>
        </div>
      </div>

      <div className="bg-bg-secondary rounded-xl p-4 border border-border-light paper-texture shadow-inner">
        <h3 className="text-[9px] font-black text-text-tertiary uppercase tracking-widest mb-3">오늘의 읽기 범위</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black text-text-tertiary uppercase tracking-tighter">구약</span>
            <span className="text-[11px] font-black text-text-primary serif-text">{todayOtRange}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black text-text-tertiary uppercase tracking-tighter">신약</span>
            <span className="text-[11px] font-black text-text-primary serif-text">{todayNtRange}</span>
          </div>
        </div>
      </div>

      <button
        onClick={onStartReading}
        className="btn-analogue w-full py-3.5 bg-accent-black text-white text-[10px]"
      >
        <BookOpen className="w-4 h-4" /> 오늘의 말씀 읽기
      </button>
    </div>
  );
};

const ChatPanel: React.FC<{
  otRange: string;
  ntRange: string;
  reflection: DailyReflection | null;
  onClose: () => void;
  dateStr: string;
}> = ({ otRange, ntRange, reflection, onClose, dateStr }) => {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>(() => {
    try {
      const stored = localStorage.getItem('bible_chat_history');
      if (stored) {
        const all = JSON.parse(stored);
        return all[dateStr] || [];
      }
    } catch {}
    return [];
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('bible_chat_history');
      const all = stored ? JSON.parse(stored) : {};
      if (messages.length > 0) {
        all[dateStr] = messages;
      } else {
        delete all[dateStr];
      }
      localStorage.setItem('bible_chat_history', JSON.stringify(all));
    } catch {}
  }, [messages, dateStr]);

  const handleClearChat = () => {
    setMessages([]);
  };

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
    <div className="fixed inset-0 z-[70] flex flex-col items-center justify-end animate-in fade-in duration-200" onClick={onClose}>
      <div className="absolute inset-0" style={{ background: 'rgba(26,26,26,0.6)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }} />
      <div className="relative w-full max-w-2xl rounded-t-3xl flex flex-col max-h-[88vh] animate-in slide-in-from-bottom duration-300" style={{ background: '#1e1f1e', boxShadow: '0 -20px 60px rgba(0,0,0,0.4)' }} onClick={e => e.stopPropagation()}>
        <div className="p-6 pb-4">
          <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: 'rgba(255,255,255,0.15)' }} />
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black tracking-tight" style={{ color: 'rgba(255,255,255,0.85)' }}>Hare 챗봇</h3>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{dateStr} — 오늘 읽은 말씀에 대해 질문하세요</p>
            </div>
            <div className="flex items-center gap-2">
              {messages.length > 0 && (
                <button onClick={handleClearChat} className="p-2 rounded-full transition-colors" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button onClick={onClose} className="p-2 rounded-full transition-colors" style={{ color: 'rgba(255,255,255,0.3)' }}>
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 pb-6 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-16">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <MessageSquare className="w-6 h-6" style={{ color: 'rgba(255,255,255,0.2)' }} />
              </div>
              <p className="text-[11px] font-bold mb-8" style={{ color: 'rgba(255,255,255,0.25)', letterSpacing: '0.15em' }}>궁금한 것을 물어보세요</p>
              <div className="space-y-2">
                {['이 본문의 역사적 배경은?', '핵심 신학적 메시지는?', '당시 시대적 상황은?'].map((q, i) => (
                  <button key={i} onClick={() => setInput(q)} className="block w-full text-left text-[11px] font-bold px-5 py-3.5 rounded-xl transition-all" style={{ color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] px-5 py-3.5 rounded-2xl text-[13px] leading-relaxed whitespace-pre-wrap ${msg.role === 'user' ? 'rounded-br-sm' : 'rounded-bl-sm'}`} style={msg.role === 'user' ? {
                background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.9)', fontWeight: 600
              } : {
                background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.06)'
              }}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="px-5 py-3.5 rounded-2xl rounded-bl-sm" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'rgba(255,255,255,0.3)' }} />
              </div>
            </div>
          )}
        </div>

        <div className="p-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="질문을 입력하세요..."
              className="flex-1 rounded-xl px-4 py-3.5 text-[13px] font-medium outline-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)' }}
              autoFocus
            />
            <button onClick={handleSend} disabled={loading || !input.trim()} className="px-5 rounded-xl text-[11px] font-black transition-all" style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)' }}>
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
  const [titleFontSize, setTitleFontSize] = useState<number>(18);
  const [krFont, setKrFont] = useState<number>(() => { try { return parseInt(localStorage.getItem('bible_kr_font') || '0'); } catch { return 0; } });
  const [enFont, setEnFont] = useState<number>(() => { try { return parseInt(localStorage.getItem('bible_en_font') || '0'); } catch { return 0; } });
  const [themeIdx, setThemeIdx] = useState<number>(() => { try { return parseInt(localStorage.getItem('bible_theme_idx') || '0'); } catch { return 0; } });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [askContext, setAskContext] = useState<{ text: string; source: string } | null>(null);
  const [streamingExegesis, setStreamingExegesis] = useState<{ range: string; version: string; items: ExegesisItem[]; done: boolean } | null>(null);
  const [fullBibleText, setFullBibleText] = useState<{ range: string; version: string; verses: BibleVerse[]; done: boolean } | null>(null);
  const [simpleTexts, setSimpleTexts] = useState<Record<string, string> | null>(null);
  const [simpleTextsLoading, setSimpleTextsLoading] = useState(false);
  const [currentView, setCurrentView] = useState<'home' | 'reading'>('home');
  const [showJournal, setShowJournal] = useState(false);
  const [medSaveFlash, setMedSaveFlash] = useState(false);
  const [journalTab, setJournalTab] = useState<'meditation' | 'otNotes' | 'ntNotes' | 'prayers'>('meditation');
  const [journalDeleteConfirm, setJournalDeleteConfirm] = useState<{ type: 'meditation' | 'otNote' | 'ntNote' | 'prayer'; dateStr: string; label: string } | null>(null);
  const [showMiniCalendar, setShowMiniCalendar] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => { window.scrollTo(0, 0); }, [currentView]);

  useEffect(() => {
    const t = VINTAGE_THEMES[themeIdx] || VINTAGE_THEMES[0];
    const root = document.documentElement;
    root.style.setProperty('--color-accent-black', t.accent);
    root.style.setProperty('--color-accent-blue', t.sub);
    root.style.setProperty('--color-bg-primary', t.bg);
    root.style.setProperty('--color-bg-paper', t.paper);
  }, [themeIdx]);

  const [savedWords, setSavedWords] = useState<Record<string, Array<{ word: string; meaning: string }>>>(() => {
    try { const s = localStorage.getItem('bible_saved_words'); return s ? JSON.parse(s) : {}; } catch { return {}; }
  });
  const handleSaveWord = (word: string, meaning: string) => {
    const dateStr = toLocalDateStr(selectedDate);
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

  const [savedNotes, setSavedNotes] = useState<Record<string, { old?: string; new?: string; oldRange?: string; newRange?: string }>>(() => {
    try { const s = localStorage.getItem('bible_saved_notes'); return s ? JSON.parse(s) : {}; } catch { return {}; }
  });
  const handleSaveNote = (type: 'old' | 'new', note: string) => {
    const dateStr = toLocalDateStr(selectedDate);
    const rangeKey = type === 'old' ? 'oldRange' : 'newRange';
    const cached = reflectionCacheRef.current[dateStr];
    const range = type === 'old' ? cached?.old_testament?.range : cached?.new_testament?.range;
    setSavedNotes(prev => {
      const dayNotes = prev[dateStr] || {};
      const next = { ...prev, [dateStr]: { ...dayNotes, [type]: note, [rangeKey]: range || '' } };
      localStorage.setItem('bible_saved_notes', JSON.stringify(next));
      return next;
    });
  };

  const [savedMeditations, setSavedMeditations] = useState<Record<string, string>>(() => {
    try { const s = localStorage.getItem('bible_saved_meditations'); return s ? JSON.parse(s) : {}; } catch { return {}; }
  });
  const handleSaveMeditation = (text: string) => {
    const dateStr = toLocalDateStr(selectedDate);
    setSavedMeditations(prev => {
      const next = { ...prev, [dateStr]: text };
      localStorage.setItem('bible_saved_meditations', JSON.stringify(next));
      return next;
    });
  };

  const [savedPrayers, setSavedPrayers] = useState<Record<string, string>>(() => {
    try { const s = localStorage.getItem('bible_personal_prayers'); return s ? JSON.parse(s) : {}; } catch { return {}; }
  });
  const [prayerSaveFlash, setPrayerSaveFlash] = useState(false);
  const handleSavePrayer = (text: string) => {
    const dateStr = toLocalDateStr(selectedDate);
    setSavedPrayers(prev => {
      const next = { ...prev, [dateStr]: text };
      localStorage.setItem('bible_personal_prayers', JSON.stringify(next));
      return next;
    });
  };

  const reflectionCacheRef = useRef<Record<string, DailyReflection>>({});
  const exegesisCacheRef = useRef<Record<string, ExegesisItem[]>>(
    (() => { try { const s = localStorage.getItem('bible_exegesis_cache'); return s ? JSON.parse(s) : {}; } catch { return {}; } })()
  );
  const fullBibleTextCacheRef = useRef<Record<string, BibleVerse[]>>(
    (() => { try { const s = localStorage.getItem('bible_fulltext_cache_krv'); return s ? JSON.parse(s) : {}; } catch { return {}; } })()
  );
  const simpleTextCacheRef = useRef<Record<string, Record<string, string>>>(
    (() => {
      try {
        const s = localStorage.getItem('bible_simple_cache');
        if (!s) return {};
        const parsed = JSON.parse(s);
        // 빈 객체 엔트리 정리
        const cleaned: Record<string, Record<string, string>> = {};
        for (const [k, v] of Object.entries(parsed)) {
          if (v && typeof v === 'object' && Object.keys(v as object).length > 0) cleaned[k] = v as Record<string, string>;
        }
        return cleaned;
      } catch { return {}; }
    })()
  );
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
      const savedTitleSize = localStorage.getItem('bible_title_font_size');
      if (savedTitleSize) setTitleFontSize(parseInt(savedTitleSize));
      setDataLoaded(true);
    })();
  }, [isAuthed]);

  useEffect(() => {
    localStorage.setItem('bible_reading_font_size', fontSize.toString());
  }, [fontSize]);
  useEffect(() => {
    localStorage.setItem('bible_title_font_size', titleFontSize.toString());
  }, [titleFontSize]);

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
    const dateStr = toLocalDateStr(selectedDate);
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

  const fetchOrGenerateSimple = async (verses: BibleVerse[], range: string, ck: string) => {
    // 1) Supabase 영구 캐시 확인
    const dbResult = await loadSimplifiedVerses(range).catch(() => null);
    if (dbResult && Object.keys(dbResult).length > 0) {
      setSimpleTexts(dbResult);
      simpleTextCacheRef.current[ck] = dbResult;
      try { localStorage.setItem('bible_simple_cache', JSON.stringify(simpleTextCacheRef.current)); } catch {}
      return;
    }
    // 2) AI 생성 (원본 로직 유지)
    const result = await generateSimplifiedVerses(verses, range);
    if (Object.keys(result).length > 0) {
      setSimpleTexts(result);
      simpleTextCacheRef.current[ck] = result;
      try { localStorage.setItem('bible_simple_cache', JSON.stringify(simpleTextCacheRef.current)); } catch {}
      saveSimplifiedVerses(range, result).catch(() => {});
    }
  };

  const handleExegesis = async (type: 'old' | 'new') => {
    if (!reflection) return;
    const data = type === 'old' ? reflection.old_testament : reflection.new_testament;
    if (!data) return;

    const cacheKey = data.range;
    const cachedExegesis = exegesisCacheRef.current[cacheKey];
    const cachedFullText = fullBibleTextCacheRef.current[cacheKey];
    const rawSimple = simpleTextCacheRef.current[cacheKey];
    const cachedSimple = rawSimple && Object.keys(rawSimple).length > 0 ? rawSimple : null;

    // Cache hit: show cached data immediately
    if (cachedExegesis && cachedFullText) {
      setStreamingExegesis({ range: data.range, version: '개역한글', items: cachedExegesis, done: true });
      setFullBibleText({ range: data.range, version: '개역한글', verses: cachedFullText, done: true });
      setSimpleTexts(cachedSimple);
      if (!cachedSimple && cachedFullText.length > 0) {
        setSimpleTextsLoading(true);
        fetchOrGenerateSimple(cachedFullText, data.range, cacheKey).catch((err) => console.error('쉬운 설명 생성 실패:', err)).finally(() => setSimpleTextsLoading(false));
      }
      return;
    }

    setStreamingExegesis({ range: data.range, version: '개역한글', items: [], done: false });
    setFullBibleText({ range: data.range, version: '개역한글', verses: [], done: false });
    setSimpleTexts(cachedSimple);
    if (cachedSimple) setSimpleTextsLoading(false); else setSimpleTextsLoading(true);

    const collectedVerses: BibleVerse[] = [];
    const collectedItems: ExegesisItem[] = [];

    // Stream full text in parallel
    fetchBibleText(
      data.range,
      (verse) => {
        collectedVerses.push(verse);
        setFullBibleText(prev => prev ? { ...prev, verses: [...prev.verses, verse] } : prev);
      },
      (range, version) => {
        setFullBibleText(prev => prev ? { ...prev, range, version } : prev);
      },
    ).then(() => {
      setFullBibleText(prev => prev ? { ...prev, done: true } : prev);
      fullBibleTextCacheRef.current[cacheKey] = collectedVerses;
      try { localStorage.setItem('bible_fulltext_cache_krv', JSON.stringify(fullBibleTextCacheRef.current)); } catch {}
      // Load from Supabase or generate simplified texts
      if (!cachedSimple && collectedVerses.length > 0) {
        fetchOrGenerateSimple(collectedVerses, data.range, cacheKey).catch((err) => console.error('쉬운 설명 생성 실패:', err)).finally(() => setSimpleTextsLoading(false));
      } else if (!cachedSimple) {
        setSimpleTextsLoading(false);
      }
    }).catch(() => {
      setFullBibleText(prev => prev ? { ...prev, done: true } : prev);
      setSimpleTextsLoading(false);
    });

    // Stream exegesis in parallel
    try {
      await streamDetailedExegesis(
        data.range,
        (item) => {
          collectedItems.push(item);
          setStreamingExegesis(prev => prev ? { ...prev, items: [...prev.items, item] } : prev);
        },
        (range, version) => {
          setStreamingExegesis(prev => prev ? { ...prev, range, version } : prev);
        },
      );
      setStreamingExegesis(prev => prev ? { ...prev, done: true } : prev);
      exegesisCacheRef.current[cacheKey] = collectedItems;
      try { localStorage.setItem('bible_exegesis_cache', JSON.stringify(exegesisCacheRef.current)); } catch {}
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
    <div className="min-h-screen bg-bg-primary flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-accent-black animate-spin" />
    </div>
  );

  if (!plan || isEditingPlan) return (
    <div className="min-h-screen bg-bg-primary">
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
    <div className="max-w-2xl mx-auto min-h-screen bg-bg-primary shadow-2xl border-x border-border-light pb-24 selection:bg-accent-black selection:text-white" style={{ fontFamily: `${KR_FONTS[krFont]?.family || KR_FONTS[0].family}, ${EN_FONTS[enFont]?.family || EN_FONTS[0].family}` }}>
      <Header
        onSettings={() => setShowSettings(true)}
        onShowBookmarks={() => setShowBookmarks(true)}
        onShowChat={() => setShowChat(true)}
        onRefresh={() => {
          const dateStr = toLocalDateStr(selectedDate);
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
        <main className="p-4 space-y-6">
          {aiState.loading && !reflection ? (
            <div className="py-24 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-8 h-8 text-text-tertiary/50 animate-spin" />
              <p className="text-text-tertiary/60 font-bold text-xs">말씀을 준비하고 있습니다...</p>
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
                  titleFontSize={titleFontSize}
                  onExegesis={() => handleExegesis('old')}
                  onCopy={handleCopyText}
                  copiedId={copiedId}
                  accentColor="accent-blue"
                  note={(savedNotes[toLocalDateStr(selectedDate)] || {}).old || ''}
                  onSaveNote={(n) => handleSaveNote('old', n)}
                />
              )}
              {reflection.new_testament && (
                <StudySection
                  type="new"
                  section={reflection.new_testament}
                  fontSize={fontSize}
                  titleFontSize={titleFontSize}
                  onExegesis={() => handleExegesis('new')}
                  onCopy={handleCopyText}
                  copiedId={copiedId}
                  accentColor="accent-green"
                  note={(savedNotes[toLocalDateStr(selectedDate)] || {}).new || ''}
                  onSaveNote={(n) => handleSaveNote('new', n)}
                />
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
                <div className="rounded-lg p-5 shadow-card sticker-card">
                  <div className="flex items-center gap-2 mb-3 text-text-tertiary">
                    <MessageCircle className="w-3.5 h-3.5" />
                    <h3 className="font-black uppercase tracking-[0.3em]" style={{ fontSize: `${Math.max(9, titleFontSize - 8)}px` }}>오늘의 묵상</h3>
                  </div>
                  <p className="text-text-primary font-bold leading-relaxed mb-3 serif-text" style={{ fontSize: `${fontSize - 3}px` }}>{reflection.meditation_question}</p>
                  <textarea
                    value={savedMeditations[toLocalDateStr(selectedDate)] || ''}
                    onChange={e => handleSaveMeditation(e.target.value)}
                    placeholder="묵상 질문에 대한 나의 생각을 적어보세요..."
                    className="w-full bg-bg-paper border border-border-light rounded-lg p-3 text-text-secondary leading-relaxed resize-none focus:border-accent-blue focus:outline-none transition-colors serif-text text-xs"
                    rows={3}
                    style={{ fontSize: `${fontSize - 2}px` }}
                  />
                  <button
                    onClick={() => {
                      handleSaveMeditation(savedMeditations[toLocalDateStr(selectedDate)] || '');
                      setMedSaveFlash(true);
                      setTimeout(() => setMedSaveFlash(false), 1500);
                    }}
                    disabled={!savedMeditations[toLocalDateStr(selectedDate)]?.trim()}
                    className={`mt-2 w-full py-2.5 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all ${medSaveFlash ? 'bg-accent-green text-white' : 'bg-accent-black text-white hover:opacity-90'} disabled:opacity-30 disabled:cursor-not-allowed`}
                  >
                    {medSaveFlash ? '저장 완료' : '저장'}
                  </button>
                </div>
                <div className="rounded-lg p-5 shadow-card sticker-card">
                  <div className="flex items-center gap-2 mb-3 text-text-tertiary">
                    <Heart className="w-3.5 h-3.5" />
                    <h3 className="font-black uppercase tracking-[0.3em]" style={{ fontSize: `${Math.max(9, titleFontSize - 8)}px` }}>오늘의 기도제목</h3>
                  </div>
                  <div className="space-y-3">
                    {reflection.prayer_topics && reflection.prayer_topics.length > 0 ? (
                      reflection.prayer_topics.map((topic: string, i: number) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="text-accent-blue font-black text-[11px] mt-0.5 shrink-0">{i + 1}</span>
                          <p className="text-text-secondary leading-relaxed serif-text" style={{ fontSize: `${fontSize - 2}px` }}>{topic}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-text-tertiary text-xs">기도제목을 불러오는 중...</p>
                    )}
                  </div>
                  <div className="mt-4 pt-3 border-t border-border-light">
                    <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-2">나만의 기도제목</p>
                    <textarea
                      value={savedPrayers[toLocalDateStr(selectedDate)] || ''}
                      onChange={e => handleSavePrayer(e.target.value)}
                      placeholder="나만의 기도제목을 적어보세요..."
                      className="w-full bg-bg-paper border border-border-light rounded-lg p-3 text-text-secondary leading-relaxed resize-none focus:border-accent-blue focus:outline-none transition-colors serif-text text-xs"
                      rows={2}
                      style={{ fontSize: `${fontSize - 2}px` }}
                    />
                    <button
                      onClick={() => {
                        handleSavePrayer(savedPrayers[toLocalDateStr(selectedDate)] || '');
                        setPrayerSaveFlash(true);
                        setTimeout(() => setPrayerSaveFlash(false), 1500);
                      }}
                      disabled={!savedPrayers[toLocalDateStr(selectedDate)]?.trim()}
                      className={`mt-2 w-full py-2.5 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all ${prayerSaveFlash ? 'bg-accent-green text-white' : 'bg-accent-black text-white hover:opacity-90'} disabled:opacity-30 disabled:cursor-not-allowed`}
                    >
                      {prayerSaveFlash ? '저장 완료' : '저장'}
                    </button>
                  </div>
                </div>
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

      {showJournal && (
        <div className="fixed inset-0 z-50 bg-bg-secondary overflow-hidden flex flex-col animate-in slide-in-from-right duration-300">
        <header className="bg-bg-primary border-b border-border-light sticky top-0 z-10">
          <div className="flex items-center justify-between px-5 py-3">
            <h2 className="text-sm font-black text-text-primary tracking-tighter serif-text">묵상 일지</h2>
            <button onClick={() => setShowJournal(false)} className="p-1.5 hover:bg-bg-secondary rounded-lg transition-colors"><X className="w-4 h-4 text-text-tertiary" /></button>
          </div>
          <div className="flex gap-2 px-5 pb-3">
            {([['meditation', '묵상'], ['otNotes', '구약 노트'], ['ntNotes', '신약 노트'], ['prayers', '기도제목']] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setJournalTab(key)}
                className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${
                  journalTab === key
                    ? 'bg-accent-black text-white'
                    : 'bg-bg-primary border border-border-light text-text-tertiary hover:border-accent-black hover:text-text-primary'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-5">
          {/* Meditation tab */}
          {journalTab === 'meditation' && (() => {
            const entries = (Object.entries(savedMeditations) as [string, string][])
              .filter(([, text]) => text.trim())
              .sort(([a], [b]) => b.localeCompare(a));
            if (entries.length === 0) return (
              <div className="py-24 text-center">
                <PenLine className="w-10 h-10 text-text-tertiary opacity-20 mx-auto mb-6" />
                <p className="text-xs font-black text-text-tertiary uppercase tracking-widest leading-loose">아직 작성한 묵상이 없습니다.<br/>읽기 탭에서 묵상을 작성해보세요.</p>
              </div>
            );
            return (
              <div className="space-y-4">
                {entries.map(([dateStr, text]) => {
                  const d = new Date(dateStr + 'T00:00:00');
                  const cached = reflectionCacheRef.current[dateStr];
                  return (
                    <div key={dateStr} className="bg-bg-primary border border-border-light rounded-xl p-6 shadow-subtle">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">
                          {d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => { setSelectedDate(d); setCurrentView('reading'); setShowJournal(false); }} className="text-[8px] font-black text-accent-blue px-2 py-1 rounded border border-accent-blue/30 hover:bg-accent-blue/5 transition-colors">이동</button>
                          <button onClick={() => setJournalDeleteConfirm({ type: 'meditation', dateStr, label: d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' }) })} className="text-text-tertiary hover:text-accent-red transition-colors p-1">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      {cached?.meditation_question && (
                        <p className="text-[11px] text-accent-blue font-bold mb-3 leading-relaxed">Q. {cached.meditation_question}</p>
                      )}
                      <p className="text-text-primary leading-relaxed serif-text" style={{ fontSize: `${fontSize - 1}px` }}>{text}</p>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* OT Notes tab */}
          {journalTab === 'otNotes' && (() => {
            type NoteEntry = { old?: string; new?: string; oldRange?: string; newRange?: string };
            const entries = (Object.entries(savedNotes) as [string, NoteEntry][])
              .filter(([, n]) => n.old?.trim())
              .sort(([a], [b]) => b.localeCompare(a));
            if (entries.length === 0) return (
              <div className="py-24 text-center">
                <BookText className="w-10 h-10 text-text-tertiary opacity-20 mx-auto mb-6" />
                <p className="text-xs font-black text-text-tertiary uppercase tracking-widest leading-loose">아직 작성한 구약 노트가 없습니다.<br/>읽기 탭에서 노트를 작성해보세요.</p>
              </div>
            );
            // Group by range (book)
            const grouped: Record<string, Array<{ dateStr: string; note: string; range: string }>> = {};
            entries.forEach(([dateStr, n]) => {
              const range = n.oldRange || '범위 미지정';
              const bookName = range.split(/\d/)[0].trim() || range;
              if (!grouped[bookName]) grouped[bookName] = [];
              grouped[bookName].push({ dateStr, note: n.old!, range });
            });
            return (
              <div className="space-y-6">
                {Object.entries(grouped).map(([bookName, items]) => (
                  <div key={bookName}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="badge-archival bg-accent-blue">{bookName}</span>
                      <span className="text-[10px] text-text-tertiary">{items.length}개 노트</span>
                    </div>
                    <div className="space-y-3">
                      {items.map(({ dateStr, note, range }) => {
                        const d = new Date(dateStr + 'T00:00:00');
                        return (
                          <div key={dateStr} className="bg-bg-primary border border-border-light rounded-xl p-5 shadow-subtle">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">
                                  {d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </span>
                                {range && <span className="text-[10px] text-accent-blue font-bold">{range}</span>}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <button onClick={() => { setSelectedDate(d); setCurrentView('reading'); setShowJournal(false); }} className="text-[8px] font-black text-accent-blue px-2 py-1 rounded border border-accent-blue/30 hover:bg-accent-blue/5 transition-colors">이동</button>
                                <button onClick={() => setJournalDeleteConfirm({ type: 'otNote', dateStr, label: `${range} (${d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })})` })} className="text-text-tertiary hover:text-accent-red transition-colors p-1">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            <p className="text-text-primary leading-relaxed serif-text" style={{ fontSize: `${fontSize - 1}px` }}>{note}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Prayers tab */}
          {journalTab === 'prayers' && (() => {
            const prayerEntries = (Object.entries(savedPrayers) as [string, string][])
              .filter(([, text]) => text.trim())
              .sort(([a], [b]) => b.localeCompare(a));
            if (prayerEntries.length === 0) return (
              <div className="py-24 text-center">
                <Heart className="w-10 h-10 text-text-tertiary opacity-20 mx-auto mb-6" />
                <p className="text-xs font-black text-text-tertiary uppercase tracking-widest leading-loose">아직 작성한 기도제목이 없습니다.<br/>읽기 탭에서 기도제목을 작성해보세요.</p>
              </div>
            );
            return (
              <div className="space-y-4">
                {prayerEntries.map(([dateStr, text]) => {
                  const d = new Date(dateStr + 'T00:00:00');
                  const cached = reflectionCacheRef.current[dateStr];
                  return (
                    <div key={dateStr} className="bg-bg-primary border border-border-light rounded-xl p-6 shadow-subtle">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">
                          {d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => { setSelectedDate(d); setCurrentView('reading'); setShowJournal(false); }} className="text-[8px] font-black text-accent-blue px-2 py-1 rounded border border-accent-blue/30 hover:bg-accent-blue/5 transition-colors">이동</button>
                          <button onClick={() => setJournalDeleteConfirm({ type: 'prayer', dateStr, label: d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' }) })} className="text-text-tertiary hover:text-accent-red transition-colors p-1">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      {cached?.prayer_topics && cached.prayer_topics.length > 0 && (
                        <div className="mb-3 space-y-1">
                          <p className="text-[10px] font-black text-accent-blue uppercase tracking-widest mb-1">AI 기도제목</p>
                          {cached.prayer_topics.map((topic: string, i: number) => (
                            <p key={i} className="text-[11px] text-text-tertiary leading-relaxed">{i + 1}. {topic}</p>
                          ))}
                        </div>
                      )}
                      <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-1">나의 기도제목</p>
                      <p className="text-text-primary leading-relaxed serif-text" style={{ fontSize: `${fontSize - 1}px` }}>{text}</p>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* NT Notes tab */}
          {journalTab === 'ntNotes' && (() => {
            type NoteEntry = { old?: string; new?: string; oldRange?: string; newRange?: string };
            const entries = (Object.entries(savedNotes) as [string, NoteEntry][])
              .filter(([, n]) => n.new?.trim())
              .sort(([a], [b]) => b.localeCompare(a));
            if (entries.length === 0) return (
              <div className="py-24 text-center">
                <BookText className="w-10 h-10 text-text-tertiary opacity-20 mx-auto mb-6" />
                <p className="text-xs font-black text-text-tertiary uppercase tracking-widest leading-loose">아직 작성한 신약 노트가 없습니다.<br/>읽기 탭에서 노트를 작성해보세요.</p>
              </div>
            );
            const grouped: Record<string, Array<{ dateStr: string; note: string; range: string }>> = {};
            entries.forEach(([dateStr, n]) => {
              const range = n.newRange || '범위 미지정';
              const bookName = range.split(/\d/)[0].trim() || range;
              if (!grouped[bookName]) grouped[bookName] = [];
              grouped[bookName].push({ dateStr, note: n.new!, range });
            });
            return (
              <div className="space-y-6">
                {Object.entries(grouped).map(([bookName, items]) => (
                  <div key={bookName}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="badge-archival bg-accent-green">{bookName}</span>
                      <span className="text-[10px] text-text-tertiary">{items.length}개 노트</span>
                    </div>
                    <div className="space-y-3">
                      {items.map(({ dateStr, note, range }) => {
                        const d = new Date(dateStr + 'T00:00:00');
                        return (
                          <div key={dateStr} className="bg-bg-primary border border-border-light rounded-xl p-5 shadow-subtle">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">
                                  {d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </span>
                                {range && <span className="text-[10px] text-accent-green font-bold">{range}</span>}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <button onClick={() => { setSelectedDate(d); setCurrentView('reading'); setShowJournal(false); }} className="text-[8px] font-black text-accent-green px-2 py-1 rounded border border-accent-green/30 hover:bg-accent-green/5 transition-colors">이동</button>
                                <button onClick={() => setJournalDeleteConfirm({ type: 'ntNote', dateStr, label: `${range} (${d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })})` })} className="text-text-tertiary hover:text-accent-red transition-colors p-1">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            <p className="text-text-primary leading-relaxed serif-text" style={{ fontSize: `${fontSize - 1}px` }}>{note}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

        {/* Delete confirmation popup */}
        {journalDeleteConfirm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 animate-in fade-in duration-150" onClick={() => setJournalDeleteConfirm(null)}>
            <div className="bg-bg-primary rounded-xl border border-border-light shadow-xl mx-8 p-6 max-w-xs w-full animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
              <p className="text-sm font-black text-text-primary text-center mb-2">삭제하시겠습니까?</p>
              <p className="text-[11px] text-text-tertiary text-center mb-5 leading-relaxed">{journalDeleteConfirm.label}</p>
              <div className="flex gap-3">
                <button onClick={() => setJournalDeleteConfirm(null)} className="flex-1 py-2.5 rounded-lg text-[10px] font-black text-text-tertiary border border-border-light hover:bg-bg-secondary transition-colors">취소</button>
                <button onClick={() => {
                  const { type, dateStr } = journalDeleteConfirm;
                  if (type === 'meditation') {
                    setSavedMeditations(prev => {
                      const next = { ...prev };
                      delete next[dateStr];
                      localStorage.setItem('bible_saved_meditations', JSON.stringify(next));
                      return next;
                    });
                  } else if (type === 'otNote') {
                    setSavedNotes(prev => {
                      const dayNotes = { ...prev[dateStr] };
                      delete dayNotes.old;
                      delete dayNotes.oldRange;
                      const next = { ...prev, [dateStr]: dayNotes };
                      if (!dayNotes.new) delete next[dateStr];
                      localStorage.setItem('bible_saved_notes', JSON.stringify(next));
                      return next;
                    });
                  } else if (type === 'ntNote') {
                    setSavedNotes(prev => {
                      const dayNotes = { ...prev[dateStr] };
                      delete dayNotes.new;
                      delete dayNotes.newRange;
                      const next = { ...prev, [dateStr]: dayNotes };
                      if (!dayNotes.old) delete next[dateStr];
                      localStorage.setItem('bible_saved_notes', JSON.stringify(next));
                      return next;
                    });
                  } else if (type === 'prayer') {
                    setSavedPrayers(prev => {
                      const next = { ...prev };
                      delete next[dateStr];
                      localStorage.setItem('bible_personal_prayers', JSON.stringify(next));
                      return next;
                    });
                  }
                  setJournalDeleteConfirm(null);
                }} className="flex-1 py-2.5 rounded-lg text-[10px] font-black text-white bg-accent-red hover:opacity-90 transition-all">삭제</button>
              </div>
            </div>
          </div>
        )}
        </div>
      )}

      {/* Bottom navigation */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-2xl bg-bg-primary border-t border-border-light z-40">
        <div className="flex">
          <button
            onClick={() => setCurrentView('home')}
            className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${currentView === 'home' ? 'text-accent-black' : 'text-text-tertiary'}`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-black">홈</span>
          </button>
          <button
            onClick={() => setCurrentView('reading')}
            className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${currentView === 'reading' ? 'text-accent-black' : 'text-text-tertiary'}`}
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-[10px] font-black">읽기</span>
          </button>
          <button
            onClick={() => setShowJournal(true)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${showJournal ? 'text-accent-black' : 'text-text-tertiary'}`}
          >
            <PenLine className="w-5 h-5" />
            <span className="text-[10px] font-black">묵상</span>
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
          onClose={() => { setStreamingExegesis(null); setFullBibleText(null); setSimpleTexts(null); setSimpleTextsLoading(false); }}
          fontSize={fontSize}
          titleFontSize={titleFontSize}
          onCopy={handleCopyText}
          copiedId={copiedId}
          onBookmark={handleToggleBookmark}
          onAsk={(text: string, source: string) => setAskContext({ text, source })}
          fullText={fullBibleText}
          onSaveWord={handleSaveWord}
          onRemoveWord={(word) => handleDeleteWord(toLocalDateStr(selectedDate), word)}
          simpleTexts={simpleTexts}
          simpleTextsLoading={simpleTextsLoading}
          initialWords={savedWords[toLocalDateStr(selectedDate)] || []}
        />
      )}

      {showChat && (
        <ChatPanel
          otRange={todayOtRange}
          ntRange={todayNtRange}
          reflection={reflection}
          onClose={() => setShowChat(false)}
          dateStr={toLocalDateStr(selectedDate)}
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
          titleFontSize={titleFontSize}
          onFontSizeChange={setFontSize}
          onTitleFontSizeChange={setTitleFontSize}
          onEditPlan={plan ? () => setIsEditingPlan(true) : undefined}
          onReset={handleReset}
          onClose={() => setShowSettings(false)}
          krFont={krFont}
          enFont={enFont}
          themeIdx={themeIdx}
          onKrFont={(i) => { setKrFont(i); localStorage.setItem('bible_kr_font', i.toString()); }}
          onEnFont={(i) => { setEnFont(i); localStorage.setItem('bible_en_font', i.toString()); }}
          onTheme={(i) => { setThemeIdx(i); localStorage.setItem('bible_theme_idx', i.toString()); }}
          onLogout={() => { sessionStorage.removeItem('yedy_bible_auth'); setIsAuthed(false); }}
        />
      )}

      {aiState.loading && (
        <div className="fixed inset-0 z-[60] bg-bg-primary/60 backdrop-blur-sm flex flex-col items-center justify-center">
          <div className="w-12 h-12 flex items-center justify-center mb-5 animate-spin">
            <svg viewBox="0 0 512 512" className="w-8 h-8 opacity-70"><path d="M256,18 C390,4 494,100 498,248 C502,396 405,480 256,488 C107,496 10,396 14,248 C18,100 122,32 256,18Z" fill="#DDD0C0"/><path d="M258,72 C365,58 445,142 450,250 C455,358 378,432 262,426 C146,420 65,348 62,242 C59,136 151,86 258,72Z" fill="#B8996E"/><path d="M260,140 C330,130 390,180 394,252 C398,324 345,375 264,370 C183,365 125,320 122,250 C119,180 190,150 260,140Z" fill="#8B6642"/><circle cx="261" cy="256" r="72" fill="#5C3D2E"/></svg>
          </div>
          <p className="text-text-tertiary font-black text-[10px] uppercase tracking-widest">깊이 살피는 중...</p>
        </div>
      )}
    </div>
  );
};

const StudySection: React.FC<{
  type: 'old' | 'new',
  section: any,
  fontSize: number,
  titleFontSize: number,
  onExegesis: () => void,
  onCopy: (text: string, id: string) => void,
  copiedId: string | null,
  accentColor: string,
  note: string,
  onSaveNote: (note: string) => void
}> = ({ type, section, fontSize, titleFontSize, onExegesis, onCopy, copiedId, accentColor, note, onSaveNote }) => {
  const label = type === 'old' ? '구약성경' : '신약성경';
  const [isPlaying, setIsPlaying] = useState(false);
  const [ttsLoading, setTtsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [showBackground, setShowBackground] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
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
    <section className="border-b border-border-light pb-8 mb-8 last:border-0 last:mb-0">
      <div className="flex items-center justify-between mb-4">
        <span className={`badge-archival bg-${accentColor}`}>{label}</span>
        <div className="flex items-center gap-1.5">
          <button onClick={() => onCopy(section.summary, `${type}-summary`)} className={`p-2 rounded-full transition-all border border-border-light hover:bg-bg-secondary shadow-subtle ${copiedId === `${type}-summary` ? 'text-accent-blue' : 'text-text-tertiary'}`}>
            {copiedId === `${type}-summary` ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button onClick={handleTTS} disabled={ttsLoading} className={`p-2 rounded-full transition-all border border-border-light hover:bg-bg-secondary shadow-subtle ${isPlaying ? `text-accent-blue` : `text-text-tertiary`} ${ttsLoading ? 'opacity-50' : ''}`}>
            {ttsLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isPlaying ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <h2 className="font-black text-text-primary mb-4 tracking-tighter serif-text flex items-baseline justify-between" style={{ fontSize: `${titleFontSize}px` }}>
        {section.range}
        <span className="text-[9px] font-black text-text-tertiary uppercase tracking-widest px-2 py-0.5">Easy Bible</span>
      </h2>

      <div className="space-y-3">
        {section.background && (
          <div className="bg-bg-primary rounded-lg border border-border-light overflow-hidden shadow-subtle">
            <button onClick={() => setShowBackground(!showBackground)} className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-bg-secondary">
              <Info className={`w-3.5 h-3.5 text-accent-blue shrink-0`} />
              <h4 className="font-black text-text-secondary uppercase tracking-[0.2em] flex-1" style={{ fontSize: `${Math.max(9, titleFontSize - 8)}px` }}>역사적 배경</h4>
              <ChevronDown className={`w-3.5 h-3.5 text-text-tertiary transition-transform duration-300 ${showBackground ? 'rotate-180' : ''}`} />
            </button>
            {showBackground && (
              <div className="px-4 pb-4 pt-0 animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="text-text-secondary leading-loose serif-text" style={{ fontSize: `${fontSize - 2}px` }}>{section.background}</p>
              </div>
            )}
          </div>
        )}

        <div className={`bg-bg-primary rounded-lg border border-border-light shadow-subtle overflow-hidden`}>
          <button onClick={() => setShowSummary(!showSummary)} className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-bg-secondary">
            <BookText className={`w-3.5 h-3.5 text-accent-blue shrink-0`} />
            <h4 className="font-black text-text-secondary uppercase tracking-[0.2em] flex-1" style={{ fontSize: `${Math.max(9, titleFontSize - 8)}px` }}>핵심 요약</h4>
            <ChevronDown className={`w-3.5 h-3.5 text-text-tertiary transition-transform duration-300 ${showSummary ? 'rotate-180' : ''}`} />
          </button>
          {showSummary && (
            <div className="px-4 pb-4 pt-0 animate-in fade-in duration-300">
              <p className="text-text-primary leading-loose serif-text" style={{ fontSize: `${fontSize - 2}px` }}>{section.summary}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {section.figures && section.figures.length > 0 && (
            <div className="bg-bg-primary border border-border-light rounded-lg overflow-hidden shadow-subtle">
              <button onClick={() => setShowFigures(!showFigures)} className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-bg-secondary">
                <Users className={`w-3.5 h-3.5 text-accent-green shrink-0`} />
                <h4 className="font-black text-text-secondary uppercase tracking-[0.2em] flex-1" style={{ fontSize: `${Math.max(9, titleFontSize - 8)}px` }}>주요 인물</h4>
                <ChevronDown className={`w-3.5 h-3.5 text-text-tertiary transition-transform duration-300 ${showFigures ? 'rotate-180' : ''}`} />
              </button>
              {showFigures && (
                <div className="px-4 pb-4 pt-0 space-y-3 animate-in fade-in duration-300">
                  {section.figures.map((f: any, i: number) => (
                    <div key={i} className="border-l-2 border-border-light pl-3 py-0.5">
                      <span className="font-black text-[11px] text-text-primary uppercase tracking-tight">{f.name}</span>
                      <p className="text-text-tertiary leading-relaxed mt-0.5" style={{ fontSize: `${fontSize - 3}px` }}>{f.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {section.vocabulary && section.vocabulary.length > 0 && (
            <div className="bg-bg-primary border border-border-light rounded-lg overflow-hidden shadow-subtle">
              <button onClick={() => setShowVocabulary(!showVocabulary)} className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-bg-secondary">
                <Languages className={`w-3.5 h-3.5 text-accent-yellow shrink-0`} />
                <h4 className="font-black text-text-secondary uppercase tracking-[0.2em] flex-1" style={{ fontSize: `${Math.max(9, titleFontSize - 8)}px` }}>용어 사전</h4>
                <ChevronDown className={`w-3.5 h-3.5 text-text-tertiary transition-transform duration-300 ${showVocabulary ? 'rotate-180' : ''}`} />
              </button>
              {showVocabulary && (
                <div className="px-4 pb-4 pt-0 space-y-3 animate-in fade-in duration-300">
                  {section.vocabulary.map((v: any, i: number) => (
                    <div key={i} className="border-l-2 border-border-light pl-3 py-0.5">
                      <span className="font-black text-[11px] text-accent-yellow uppercase tracking-tighter">{v.word}</span>
                      <p className="text-text-tertiary leading-relaxed mt-0.5" style={{ fontSize: `${fontSize - 3}px` }}>{v.meaning}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 mt-5">
        <button onClick={onExegesis} className="flex-1 btn-analogue bg-accent-black text-white py-2.5 shadow-card text-[9px]">
          <BookText className="w-3.5 h-3.5" /> 해설 보기
        </button>
        <button onClick={() => setShowNote(true)} className={`flex-1 btn-analogue py-2.5 shadow-card text-[9px] ${note ? 'bg-bg-paper border-accent-blue text-accent-blue' : 'bg-bg-primary border-border-light text-text-tertiary hover:border-accent-black hover:text-accent-black'}`}>
          <PenLine className="w-3.5 h-3.5" /> {note ? '노트 수정' : '노트 작성'}
        </button>
      </div>

      {showNote && (
        <div className="fixed inset-0 z-[70] bg-accent-black/40 backdrop-blur-sm flex items-end justify-center animate-in fade-in duration-200" onClick={() => setShowNote(false)}>
          <div className="bg-bg-primary w-full max-w-2xl rounded-t-3xl p-6 max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-300 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-border-light rounded-full mx-auto mb-5" />
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-black text-text-primary tracking-tight">말씀 노트</h3>
                <p className="text-[9px] font-black text-text-tertiary uppercase tracking-widest mt-0.5">{section.range}</p>
              </div>
              <button onClick={() => setShowNote(false)} className="p-2 hover:bg-bg-secondary rounded-full transition-colors"><X className="w-4 h-4 text-text-tertiary" /></button>
            </div>
            <textarea
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="말씀을 통해 깨달은 점과 적용할 점을 적어보세요..."
              className="flex-1 min-h-[200px] bg-bg-paper border border-border-light rounded-xl p-5 text-text-primary leading-relaxed outline-none focus:border-accent-blue transition-colors"
              style={{ fontSize: `${fontSize - 1}px` }}
              autoFocus
            />
            <button
              onClick={() => { onSaveNote(noteText); setShowNote(false); }}
              className="w-full mt-4 bg-accent-black text-white py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:opacity-90 transition-all"
            >
              저장
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
  titleFontSize: number,
  onCopy: (t: string, id: string) => void,
  copiedId: string | null,
  onBookmark: (text: string, source: string) => Promise<boolean>,
  onAsk: (text: string, source: string) => void,
  fullText: { range: string; version: string; verses: BibleVerse[]; done: boolean } | null,
  onSaveWord: (word: string, meaning: string) => void,
  onRemoveWord: (word: string) => void,
  simpleTexts: Record<string, string> | null,
  simpleTextsLoading: boolean,
  initialWords: Array<{ word: string; meaning: string }>
}> = ({ data, isStreaming, onClose, fontSize, titleFontSize, onCopy, copiedId, onBookmark, onAsk, fullText, onSaveWord, onRemoveWord, simpleTexts, simpleTextsLoading, initialWords }) => {
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'fulltext' | 'exegesis'>('fulltext');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [tappedWords, setTappedWords] = useState<Array<{ word: string; meaning: string | null; loading: boolean }>>(() =>
    initialWords.map(w => ({ word: w.word, meaning: w.meaning, loading: false }))
  );
  const [pendingWord, setPendingWord] = useState<{ word: string; verseText: string } | null>(null);
  const [pendingRemoveWord, setPendingRemoveWord] = useState<string | null>(null);
  const [panelDeleteWord, setPanelDeleteWord] = useState<string | null>(null);
  const [hoveredVerse, setHoveredVerse] = useState<number | null>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Highlight & memo state
  type Highlight = { id: string; start: number; end: number; note: string; text: string };
  const [highlights, setHighlights] = useState<Record<string, Highlight[]>>(() => {
    try { const s = localStorage.getItem('bible_highlights'); return s ? JSON.parse(s) : {}; } catch { return {}; }
  });
  // Pending selection: user dragged text, waiting for action choice
  const [pendingSelect, setPendingSelect] = useState<{ cardKey: string; start: number; end: number; text: string } | null>(null);
  // Action menu on existing highlight
  const [hlAction, setHlAction] = useState<{ cardKey: string; hlId: string } | null>(null);
  // Memo editing on existing highlight
  const [hlEditing, setHlEditing] = useState<{ cardKey: string; hlId: string } | null>(null);
  const [memoText, setMemoText] = useState('');
  const memoInputRef = useRef<HTMLInputElement>(null);

  const saveHighlights = (next: Record<string, Highlight[]>) => {
    setHighlights(next);
    localStorage.setItem('bible_highlights', JSON.stringify(next));
  };

  const dismissAll = () => { setPendingSelect(null); setHlAction(null); setHlEditing(null); setMemoText(''); };

  // Step 1: User selects text → show pending action bar
  const handleTextSelect = (cardKey: string, explanation: string) => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    const container = range.startContainer.parentElement?.closest('[data-highlightable]');
    if (!container) return;
    const selectedText = sel.toString().trim();
    if (!selectedText || selectedText.length < 1) return;
    let startIdx = explanation.indexOf(selectedText);
    if (startIdx === -1) {
      const normalized = selectedText.replace(/\s+/g, ' ');
      startIdx = explanation.indexOf(normalized);
      if (startIdx === -1) return;
    }
    const endIdx = startIdx + selectedText.length;
    const existing = highlights[cardKey] || [];
    const overlaps = existing.some(h => !(endIdx <= h.start || startIdx >= h.end));
    if (overlaps) { sel.removeAllRanges(); return; }
    dismissAll();
    setPendingSelect({ cardKey, start: startIdx, end: endIdx, text: selectedText });
    sel.removeAllRanges();
  };

  // Step 2a: Create underline only
  const confirmUnderline = () => {
    if (!pendingSelect) return;
    const { cardKey, start, end, text: hlText } = pendingSelect;
    const newHl: Highlight = { id: Date.now().toString(), start, end, note: '', text: hlText };
    saveHighlights({ ...highlights, [cardKey]: [...(highlights[cardKey] || []), newHl] });
    setPendingSelect(null);
  };

  // Step 2b: Create underline + open memo
  const confirmUnderlineWithMemo = () => {
    if (!pendingSelect) return;
    const { cardKey, start, end, text: hlText } = pendingSelect;
    const id = Date.now().toString();
    const newHl: Highlight = { id, start, end, note: '', text: hlText };
    saveHighlights({ ...highlights, [cardKey]: [...(highlights[cardKey] || []), newHl] });
    setPendingSelect(null);
    setMemoText('');
    setHlEditing({ cardKey, hlId: id });
    setTimeout(() => memoInputRef.current?.focus(), 100);
  };

  // Existing highlight click → action menu
  const handleHighlightClick = (cardKey: string, hlId: string) => {
    setPendingSelect(null);
    setHlEditing(null);
    setHlAction(prev => prev?.hlId === hlId ? null : { cardKey, hlId });
  };

  const startMemoEdit = (cardKey: string, hlId: string) => {
    const hl = (highlights[cardKey] || []).find(h => h.id === hlId);
    setMemoText(hl?.note || '');
    setHlAction(null);
    setHlEditing({ cardKey, hlId });
    setTimeout(() => memoInputRef.current?.focus(), 100);
  };

  const saveMemo = () => {
    if (!hlEditing) return;
    const { cardKey, hlId } = hlEditing;
    const existing = highlights[cardKey] || [];
    saveHighlights({ ...highlights, [cardKey]: existing.map(h => h.id === hlId ? { ...h, note: memoText } : h) });
    setHlEditing(null);
    setMemoText('');
  };

  const removeHighlight = (cardKey: string, hlId: string) => {
    const existing = highlights[cardKey] || [];
    saveHighlights({ ...highlights, [cardKey]: existing.filter(h => h.id !== hlId) });
    setHlAction(null);
    setHlEditing(null);
  };

  const renderHighlightedText = (text: string, cardKey: string, wordTapVerse?: string) => {
    const hls = (highlights[cardKey] || []).slice().sort((a, b) => a.start - b.start);
    const pending = pendingSelect?.cardKey === cardKey ? pendingSelect : null;

    // Helper: render plain text with optional word-tap feature
    const pushPlainWords = (str: string, keyBase: string, arr: React.ReactNode[]) => {
      if (!wordTapVerse) { arr.push(<span key={keyBase}>{str}</span>); return; }
      str.split(/(\s+)/).forEach((seg, i) => {
        if (/^\s+$/.test(seg)) { arr.push(<span key={`${keyBase}-${i}`}>{seg}</span>); return; }
        const cleaned = seg.replace(/^[^\uAC00-\uD7A3a-zA-Z0-9]+|[^\uAC00-\uD7A3a-zA-Z0-9]+$/g, '');
        const noun = extractNoun(cleaned);
        const isTapped = tappedWords.some(w => w.word === noun);
        arr.push(
          <span key={`${keyBase}-${i}`} onClick={() => handleWordTap(seg, wordTapVerse!)}
            className={`cursor-pointer transition-all rounded px-0.5 border-b-2 decoration-accent-blue/20 hover:bg-accent-blue/5 ${isTapped ? 'bg-bg-paper text-accent-blue border-accent-blue' : 'border-transparent'}`}
          >{seg}</span>
        );
      });
    };

    if (hls.length === 0 && !pending) {
      if (wordTapVerse) { const p: React.ReactNode[] = []; pushPlainWords(text, 'all', p); return <>{p}</>; }
      return <span>{text}</span>;
    }
    const parts: React.ReactNode[] = [];
    let cursor = 0;

    type Segment = { type: 'hl'; hl: Highlight } | { type: 'pending'; start: number; end: number };
    const segments: Segment[] = hls.map(hl => ({ type: 'hl' as const, hl }));
    if (pending) segments.push({ type: 'pending', start: pending.start, end: pending.end });
    segments.sort((a, b) => (a.type === 'hl' ? a.hl.start : a.start) - (b.type === 'hl' ? b.hl.start : b.start));

    segments.forEach(seg => {
      const segStart = seg.type === 'hl' ? seg.hl.start : seg.start;
      const segEnd = seg.type === 'hl' ? seg.hl.end : seg.end;
      if (cursor < segStart) pushPlainWords(text.slice(cursor, segStart), `t-${cursor}`, parts);

      if (seg.type === 'pending') {
        parts.push(
          <span key="pending" className="inline">
            <span style={{ borderBottom: '2px dashed var(--color-accent-blue)', background: 'rgba(59,130,246,0.06)', paddingBottom: '1px' }}>
              {text.slice(segStart, segEnd)}
            </span>
          </span>
        );
      } else {
        const hl = seg.hl;
        const isActionTarget = hlAction?.hlId === hl.id;
        const isEditTarget = hlEditing?.hlId === hl.id;
        const hasSavedMemo = hl.note && !isEditTarget && !isActionTarget;
        parts.push(
          <span key={hl.id} className={`relative ${hasSavedMemo ? 'inline-block align-top' : 'inline'}`}>
            <span
              onClick={(e) => { e.stopPropagation(); handleHighlightClick(cardKey, hl.id); }}
              className="cursor-pointer transition-colors"
              style={{ borderBottom: '2px solid var(--color-accent-blue)', background: 'rgba(59,130,246,0.08)', paddingBottom: '1px' }}
            >
              {text.slice(segStart, segEnd)}
            </span>
            {/* Saved memo bubble — block layout, pushes content down */}
            {hasSavedMemo && (
              <span
                onClick={(e) => { e.stopPropagation(); handleHighlightClick(cardKey, hl.id); }}
                className="block relative mt-1 z-20 cursor-pointer rounded-lg px-3 py-1.5 text-[11px] leading-relaxed whitespace-nowrap animate-in fade-in duration-200"
                style={{ background: 'rgba(74,93,116,0.07)', border: '1px solid rgba(74,93,116,0.15)', color: 'var(--color-accent-blue)' }}
              >
                <span className="absolute -top-[6px] left-3 w-3 h-3 rotate-45" style={{ background: 'rgba(74,93,116,0.07)', borderLeft: '1px solid rgba(74,93,116,0.15)', borderTop: '1px solid rgba(74,93,116,0.15)' }} />
                <span className="relative z-10">{hl.note}</span>
              </span>
            )}
            {/* Action menu — absolute (temporary) */}
            {isActionTarget && (
              <span className="absolute left-0 top-full mt-1 z-30 animate-in fade-in duration-150">
                <span className="inline-flex items-center gap-0 bg-bg-primary border border-border-light shadow-md rounded-md overflow-hidden whitespace-nowrap">
                  <button onClick={(e) => { e.stopPropagation(); startMemoEdit(cardKey, hl.id); }} className="px-3 py-1.5 text-[9px] font-black text-accent-blue hover:bg-bg-secondary transition-colors border-r border-border-light">말풍선 {hl.note ? '수정' : '추가'}</button>
                  <button onClick={(e) => { e.stopPropagation(); removeHighlight(cardKey, hl.id); }} className="px-3 py-1.5 text-[9px] font-black text-accent-red hover:bg-bg-secondary transition-colors">밑줄 취소</button>
                </span>
              </span>
            )}
            {/* Memo input — absolute (temporary) */}
            {isEditTarget && (
              <span className="absolute left-0 top-full mt-1 z-30 w-64 animate-in fade-in duration-150">
                <span className="block bg-bg-primary border border-accent-blue/30 shadow-lg rounded-lg p-2.5">
                  <span className="absolute -top-[6px] left-3 w-3 h-3 rotate-45 bg-bg-primary" style={{ borderLeft: '1px solid rgba(74,93,116,0.3)', borderTop: '1px solid rgba(74,93,116,0.3)' }} />
                  <input
                    ref={memoInputRef}
                    value={memoText}
                    onChange={e => setMemoText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') saveMemo(); if (e.key === 'Escape') { setHlEditing(null); setMemoText(''); } }}
                    placeholder="메모를 입력하세요..."
                    className="relative z-10 w-full bg-bg-paper border border-border-light rounded-md px-2.5 py-2 text-xs text-text-primary outline-none focus:border-accent-blue transition-colors"
                  />
                  <span className="relative z-10 flex gap-1.5 mt-2">
                    <button onClick={() => { setHlEditing(null); setMemoText(''); }} className="flex-1 py-1.5 text-[9px] font-black text-text-tertiary rounded-md border border-border-light hover:bg-bg-secondary transition-colors">취소</button>
                    <button onClick={saveMemo} className="flex-1 py-1.5 text-[9px] font-black text-white bg-accent-black rounded-md hover:opacity-90 transition-all">저장</button>
                  </span>
                </span>
              </span>
            )}
          </span>
        );
      }
      cursor = segEnd;
    });
    if (cursor < text.length) pushPlainWords(text.slice(cursor), `t-${cursor}`, parts);
    return <>{parts}</>;
  };

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
          <h3 className="font-black text-text-primary serif-text uppercase tracking-tighter" style={{ fontSize: `${titleFontSize + 4}px` }}>{data.range}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="badge-archival bg-accent-blue">개역한글</span>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-bg-secondary rounded-full transition-colors"><X className="w-4 h-4 text-text-tertiary" /></button>
      </header>

      <div className="flex bg-bg-primary border-b border-border-light shrink-0">
        <button
          onClick={() => setActiveTab('fulltext')}
          className={`flex-1 py-4 text-[10px] font-black text-center transition-all relative uppercase tracking-[0.2em] ${activeTab === 'fulltext' ? 'text-accent-black' : 'text-text-tertiary opacity-50'}`}
        >
          <span className="inline-flex items-center gap-2">
            본문
            {activeTab !== 'fulltext' && fullText && !fullText.done && <span className="w-1.5 h-1.5 bg-accent-blue rounded-full animate-pulse" />}
          </span>
          {activeTab === 'fulltext' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-accent-black" />}
        </button>
        <button
          onClick={() => setActiveTab('exegesis')}
          className={`flex-1 py-4 text-[10px] font-black text-center transition-all relative uppercase tracking-[0.2em] ${activeTab === 'exegesis' ? 'text-accent-black' : 'text-text-tertiary opacity-50'}`}
        >
          <span className="inline-flex items-center gap-2">
            해설
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
              <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">본문을 불러오는 중...</p>
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
                    <div key={idx} className="flex gap-4 items-start animate-in fade-in duration-500"
                      onMouseEnter={() => { hoverTimerRef.current = setTimeout(() => setHoveredVerse(idx), 2000); }}
                      onMouseLeave={() => { if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current); setHoveredVerse(null); }}
                      onTouchStart={() => { hoverTimerRef.current = setTimeout(() => setHoveredVerse(idx), 1500); }}
                      onTouchEnd={() => { if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current); }}
                    >
                      <span className="text-accent-blue font-black text-[10px] mt-1.5 shrink-0 w-12 text-right tabular-nums tracking-tighter opacity-50">{verse.verseNum}</span>
                      <div className="flex-1 min-w-0">
                        <p
                          data-highlightable
                          className="text-text-primary leading-[2.1] font-medium serif-text select-text"
                          style={{ fontSize: `${fontSize}px` }}
                          onMouseUp={() => handleTextSelect(`ft-${data.range}-${verse.verseNum}`, verse.text)}
                          onTouchEnd={() => setTimeout(() => handleTextSelect(`ft-${data.range}-${verse.verseNum}`, verse.text), 300)}
                        >
                          {renderHighlightedText(verse.text, `ft-${data.range}-${verse.verseNum}`, verse.text)}
                          {(hoveredVerse === idx || bookmarkedIds.has(`ft-bm-${idx}`)) && (
                            <span className="inline-flex items-center gap-1 ml-1.5 align-middle animate-in fade-in duration-200">
                              <button
                                onClick={() => handleBookmark(verse.text, `${data.range} ${verse.verseNum}`, `ft-bm-${idx}`)}
                                className={`text-[8px] font-black px-1.5 py-0.5 rounded border transition-all ${bookmarkedIds.has(`ft-bm-${idx}`) ? 'bg-accent-black text-white border-accent-black' : 'bg-bg-secondary text-text-tertiary border-border-light hover:border-accent-black hover:text-accent-black'}`}
                              >
                                {bookmarkedIds.has(`ft-bm-${idx}`) ? '저장됨' : '저장'}
                              </button>
                              <button
                                onClick={() => onCopy(verse.text, `ft-cp-${idx}`)}
                                className={`text-[8px] font-black px-1.5 py-0.5 rounded border transition-all ${copiedId === `ft-cp-${idx}` ? 'bg-accent-green text-white border-accent-green' : 'bg-bg-secondary text-text-tertiary border-border-light hover:border-accent-black hover:text-accent-black'}`}
                              >
                                {copiedId === `ft-cp-${idx}` ? '복사됨' : '복사'}
                              </button>
                            </span>
                          )}
                        </p>
                        {simpleTexts && simpleTexts[verse.verseNum] ? (
                          <p className="text-text-tertiary text-[12px] leading-relaxed mt-1">{simpleTexts[verse.verseNum]}</p>
                        ) : simpleTextsLoading ? (
                          <p className="text-text-tertiary text-[11px] leading-relaxed mt-1 animate-pulse opacity-40">쉬운 설명 생성 중...</p>
                        ) : null}
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
                    <span className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">이 단어를 저장할까요?</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setPendingWord(null)} className="px-3 py-1.5 text-[10px] font-black text-text-tertiary hover:text-accent-black transition-colors uppercase tracking-widest">취소</button>
                    <button onClick={confirmWord} className="btn-analogue bg-accent-black text-white px-4 py-2 text-[10px]">저장</button>
                  </div>
                </div>
              )}
              {pendingRemoveWord && (
                <div className="shrink-0 border-t border-border-light bg-bg-primary px-8 py-4 flex items-center justify-between animate-in fade-in slide-in-from-bottom duration-300 shadow-[0_-10px_20px_rgba(0,0,0,0.03)]">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-accent-red bg-bg-paper px-2 py-0.5 rounded border border-border-light">"{pendingRemoveWord}"</span>
                    <span className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">이 단어를 삭제할까요?</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setPendingRemoveWord(null)} className="px-3 py-1.5 text-[10px] font-black text-text-tertiary hover:text-accent-black transition-colors uppercase tracking-widest">취소</button>
                    <button onClick={() => { setTappedWords(prev => prev.filter(w => w.word !== pendingRemoveWord)); onRemoveWord(pendingRemoveWord!); setPendingRemoveWord(null); }} className="btn-analogue bg-accent-red text-white px-4 py-2 text-[10px] border-accent-red">삭제</button>
                  </div>
                </div>
              )}
              {tappedWords.length > 0 && (
                <div className="shrink-0 border-t border-border-light bg-bg-primary px-8 py-6 max-h-60 overflow-hidden flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Languages className="w-4 h-4 text-accent-blue" />
                      <span className="text-[10px] font-black text-text-primary uppercase tracking-widest">선택한 단어</span>
                      <span className="text-[9px] font-black text-white bg-accent-blue px-1.5 py-0.5 rounded-full">{tappedWords.length}</span>
                    </div>
                    <button onClick={() => setTappedWords([])} className="text-[9px] font-black text-text-tertiary hover:text-accent-red transition-colors uppercase tracking-widest">전체 삭제</button>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                    {tappedWords.map((tw, idx) => (
                      <div key={idx} className={`rounded-lg border shadow-subtle overflow-hidden transition-all ${panelDeleteWord === tw.word ? 'border-accent-red/30 bg-accent-red/5' : 'border-border-light bg-bg-secondary'}`}>
                        <div className="flex items-start gap-3 p-3 cursor-pointer" onClick={() => !tw.loading && setPanelDeleteWord(prev => prev === tw.word ? null : tw.word)}>
                          <span className="text-[10px] font-black text-accent-blue bg-white px-2 py-0.5 rounded border border-border-light shrink-0">{tw.word}</span>
                          {tw.loading ? (
                            <Loader2 className="w-3.5 h-3.5 text-accent-blue animate-spin mt-0.5" />
                          ) : (
                            <span className="text-xs text-text-secondary leading-relaxed serif-text font-medium flex-1">{tw.meaning}</span>
                          )}
                        </div>
                        {panelDeleteWord === tw.word && (
                          <div className="flex items-center justify-end gap-2 px-3 pb-3 animate-in fade-in duration-150">
                            <button onClick={() => setPanelDeleteWord(null)} className="px-3 py-1.5 text-[10px] font-black text-text-tertiary uppercase tracking-widest">취소</button>
                            <button onClick={() => { setTappedWords(prev => prev.filter(w => w.word !== tw.word)); onRemoveWord(tw.word); setPanelDeleteWord(null); }} className="btn-analogue bg-accent-red text-white px-4 py-1.5 text-[10px] border-accent-red">삭제</button>
                          </div>
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
              <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">구절 해설을 준비하는 중...</p>
            </div>
          ) : (
            <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto paper-texture">
              <div className="max-w-3xl mx-auto p-8 md:p-12 space-y-12 pb-24">
                {data.items.map((item, idx) => (
                  <div key={idx} id={`exegesis-card-${idx}`} className="animate-in fade-in slide-in-from-bottom-2 duration-500 bg-bg-primary rounded-xl border border-border-light overflow-hidden shadow-card">
                    <div className="p-6 bg-bg-paper border-b border-border-light">
                      <span className="badge-archival bg-accent-blue mb-3">{item.verseNum}</span>
                      <p className="text-text-primary font-black leading-relaxed serif-text mt-3" style={{ fontSize: `${fontSize}px` }}>{item.text}</p>
                    </div>
                    <div className="p-6 bg-bg-primary">
                      <p
                        data-highlightable
                        className="text-text-secondary leading-[1.8] whitespace-pre-wrap serif-text select-text"
                        style={{ fontSize: `${fontSize - 1}px` }}
                        onMouseUp={() => handleTextSelect(`${data.range}-${item.verseNum}`, item.explanation)}
                        onTouchEnd={() => setTimeout(() => handleTextSelect(`${data.range}-${item.verseNum}`, item.explanation), 300)}
                      >
                        {renderHighlightedText(item.explanation, `${data.range}-${item.verseNum}`)}
                      </p>
                      <div className="flex items-center gap-2 mt-6 pt-4 border-t border-border-light/50">
                        <button
                          onClick={() => {
                            const fullText = `[${data.range} ${item.verseNum}]\n${item.text}\n\n[해설]\n${item.explanation}`;
                            onCopy(fullText, `ex-all-${idx}`);
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black transition-all border ${copiedId === `ex-all-${idx}` ? 'bg-accent-green text-white border-accent-green' : 'bg-bg-secondary text-text-tertiary border-border-light shadow-subtle hover:border-accent-black hover:text-accent-black'}`}
                        >
                          {copiedId === `ex-all-${idx}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          {copiedId === `ex-all-${idx}` ? '복사됨' : '복사'}
                        </button>
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

      {pendingSelect && (
        <div className="shrink-0 border-t border-border-light bg-bg-primary px-8 py-4 flex items-center justify-between animate-in fade-in slide-in-from-bottom duration-300 shadow-[0_-10px_20px_rgba(0,0,0,0.03)]">
          <div className="flex items-center gap-3">
            <Underline className="w-4 h-4 text-accent-blue" />
            <span className="text-xs font-black text-accent-blue bg-bg-paper px-2 py-0.5 rounded border border-border-light truncate max-w-[120px]">"{pendingSelect.text}"</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setPendingSelect(null)} className="px-3 py-1.5 text-[10px] font-black text-text-tertiary hover:text-accent-black transition-colors uppercase tracking-widest">취소</button>
            <button onClick={confirmUnderline} className="px-4 py-2 text-[10px] font-black text-white bg-accent-black rounded-lg hover:opacity-90 transition-all">밑줄</button>
            <button onClick={confirmUnderlineWithMemo} className="px-4 py-2 text-[10px] font-black text-accent-blue bg-bg-paper border border-accent-blue/30 rounded-lg hover:bg-accent-blue/5 transition-all">밑줄+메모</button>
          </div>
        </div>
      )}

    </div>
  );
};

export default App;
