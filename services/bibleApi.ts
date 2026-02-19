import { BibleVerse } from "../types";

const BOOK_TO_NR: Record<string, number> = {
  "창세기": 1, "출애굽기": 2, "레위기": 3, "민수기": 4, "신명기": 5,
  "여호수아": 6, "사사기": 7, "룻기": 8, "사무엘상": 9, "사무엘하": 10,
  "열왕기상": 11, "열왕기하": 12, "역대상": 13, "역대하": 14, "에스라": 15,
  "느헤미야": 16, "에스더": 17, "욥기": 18, "시편": 19, "잠언": 20,
  "전도서": 21, "아가": 22, "이사야": 23, "예레미야": 24, "예레미야애가": 25,
  "에스겔": 26, "다니엘": 27, "호세아": 28, "요엘": 29, "아모스": 30,
  "오바댜": 31, "요나": 32, "미가": 33, "나훔": 34, "하박국": 35,
  "스바냐": 36, "학개": 37, "스가랴": 38, "말라기": 39,
  "마태복음": 40, "마가복음": 41, "누가복음": 42, "요한복음": 43,
  "사도행전": 44, "로마서": 45, "고린도전서": 46, "고린도후서": 47,
  "갈라디아서": 48, "에베소서": 49, "빌립보서": 50, "골로새서": 51,
  "데살로니가전서": 52, "데살로니가후서": 53, "디모데전서": 54, "디모데후서": 55,
  "디도서": 56, "빌레몬서": 57, "히브리서": 58, "야고보서": 59,
  "베드로전서": 60, "베드로후서": 61, "요한일서": 62, "요한이서": 63,
  "요한삼서": 64, "유다서": 65, "요한계시록": 66,
};

const ORDERED_BOOKS = Object.keys(BOOK_TO_NR);

interface ChapterRef {
  bookNr: number;
  chapter: number;
}

/**
 * Parse a Korean Bible range string into a list of (bookNr, chapter) pairs.
 *
 * Supported formats (produced by getReadingPortion):
 *   "창세기 5장"                       → single chapter
 *   "창세기 5-7장"                     → same book, chapters 5–7
 *   "창세기 50장 - 출애굽기 2장"       → cross-book range
 */
function parseRange(range: string): ChapterRef[] {
  const refs: ChapterRef[] = [];

  // Format 3: cross-book  "BookA N장 - BookB M장"
  const crossMatch = range.match(
    /^(.+?)\s+(\d+)장\s*-\s*(.+?)\s+(\d+)장$/
  );
  if (crossMatch) {
    const startBook = crossMatch[1].trim();
    const startCh = parseInt(crossMatch[2]);
    const endBook = crossMatch[3].trim();
    const endCh = parseInt(crossMatch[4]);
    const startNr = BOOK_TO_NR[startBook];
    const endNr = BOOK_TO_NR[endBook];
    if (!startNr || !endNr) throw new Error(`알 수 없는 책 이름: ${startBook} 또는 ${endBook}`);

    // Enumerate all chapters from startBook:startCh → endBook:endCh
    const startIdx = ORDERED_BOOKS.indexOf(startBook);
    const endIdx = ORDERED_BOOKS.indexOf(endBook);
    for (let bi = startIdx; bi <= endIdx; bi++) {
      const bookName = ORDERED_BOOKS[bi];
      const bookNr = BOOK_TO_NR[bookName];
      const firstCh = bi === startIdx ? startCh : 1;
      // We don't know total chapters here, so use a large upper bound;
      // the API will 404 if the chapter doesn't exist, which we handle below.
      const lastCh = bi === endIdx ? endCh : 200;
      for (let ch = firstCh; ch <= lastCh; ch++) {
        refs.push({ bookNr, chapter: ch });
      }
    }
    return refs;
  }

  // Format 2: same book multi-chapter  "BookA N-M장"
  const multiMatch = range.match(/^(.+?)\s+(\d+)-(\d+)장$/);
  if (multiMatch) {
    const bookName = multiMatch[1].trim();
    const startCh = parseInt(multiMatch[2]);
    const endCh = parseInt(multiMatch[3]);
    const bookNr = BOOK_TO_NR[bookName];
    if (!bookNr) throw new Error(`알 수 없는 책 이름: ${bookName}`);
    for (let ch = startCh; ch <= endCh; ch++) {
      refs.push({ bookNr, chapter: ch });
    }
    return refs;
  }

  // Format 1: single chapter  "BookA N장"
  const singleMatch = range.match(/^(.+?)\s+(\d+)장$/);
  if (singleMatch) {
    const bookName = singleMatch[1].trim();
    const ch = parseInt(singleMatch[2]);
    const bookNr = BOOK_TO_NR[bookName];
    if (!bookNr) throw new Error(`알 수 없는 책 이름: ${bookName}`);
    refs.push({ bookNr, chapter: ch });
    return refs;
  }

  throw new Error(`범위를 파싱할 수 없습니다: ${range}`);
}

const API_BASE = "https://api.getbible.net/v2/korean";

async function fetchChapter(
  bookNr: number,
  chapter: number,
  retries = 2
): Promise<{ verses: { chapter: number; verse: number; text: string }[] } | null> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(`${API_BASE}/${bookNr}/${chapter}.json`);
      if (res.status === 404) return null; // chapter doesn't exist
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
  }
  return null;
}

/**
 * Fetch Bible text from getBible API v2 (개역한글 / KRV).
 * Uses the same callback signature as the old streamFullBibleText so
 * the caller (App.tsx) needs minimal changes.
 */
export async function fetchBibleText(
  range: string,
  onVerse: (verse: BibleVerse) => void,
  onMeta: (range: string, version: string) => void,
): Promise<void> {
  const chapters = parseRange(range);
  onMeta(range, "개역한글");

  for (const { bookNr, chapter } of chapters) {
    const data = await fetchChapter(bookNr, chapter);
    if (!data) continue; // skip non-existent chapters (cross-book upper bound)
    for (const v of data.verses) {
      onVerse({ verseNum: `${v.chapter}:${v.verse}`, text: v.text });
    }
  }
}
