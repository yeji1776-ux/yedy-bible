import OpenAI from "openai";
import { DailyReflection, DetailedExegesisResult, ExegesisItem } from "../types";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
  dangerouslyAllowBrowser: true,
});

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const isRetryable =
        error?.message?.includes("429") || error?.message?.includes("quota") || error?.status >= 500;
      if (!isRetryable || i === maxRetries - 1) throw error;
      const delay = Math.pow(2, i) * 1000 + Math.random() * 500;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

export async function fetchDailyReflection(
  otRange: string,
  ntRange: string
): Promise<DailyReflection | null> {
  return withRetry(async () => {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 2000,
      messages: [
        {
          role: "system",
          content:
            "당신은 성경 학자이자 목회자입니다. 반드시 한국어로 작성하고 객관적이며 따뜻한 어조를 사용하세요. 간결하되 핵심을 담아주세요.",
        },
        {
          role: "user",
          content: `성경 읽기 범위 - 구약: ${otRange}, 신약: ${ntRange}.
이 범위에 대한 정보를 JSON으로 제공해주세요. vocabulary는 2-3개, figures도 2-3개로 간결하게.`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "daily_reflection",
          strict: true,
          schema: {
            type: "object",
            properties: {
              old_testament: {
                type: "object",
                properties: {
                  range: { type: "string" },
                  background: { type: "string" },
                  vocabulary: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: { word: { type: "string" }, meaning: { type: "string" } },
                      required: ["word", "meaning"],
                      additionalProperties: false,
                    },
                  },
                  figures: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: { name: { type: "string" }, description: { type: "string" } },
                      required: ["name", "description"],
                      additionalProperties: false,
                    },
                  },
                  summary: { type: "string" },
                },
                required: ["range", "background", "vocabulary", "figures", "summary"],
                additionalProperties: false,
              },
              new_testament: {
                type: "object",
                properties: {
                  range: { type: "string" },
                  background: { type: "string" },
                  vocabulary: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: { word: { type: "string" }, meaning: { type: "string" } },
                      required: ["word", "meaning"],
                      additionalProperties: false,
                    },
                  },
                  figures: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: { name: { type: "string" }, description: { type: "string" } },
                      required: ["name", "description"],
                      additionalProperties: false,
                    },
                  },
                  summary: { type: "string" },
                },
                required: ["range", "background", "vocabulary", "figures", "summary"],
                additionalProperties: false,
              },
              meditation_question: { type: "string" },
            },
            required: ["old_testament", "new_testament", "meditation_question"],
            additionalProperties: false,
          },
        },
      },
    });
    const content = response.choices[0]?.message?.content;
    if (!content) return null;
    return JSON.parse(content);
  });
}

export async function streamDetailedExegesis(
  range: string,
  onItem: (item: ExegesisItem) => void,
  onMeta: (range: string, version: string) => void,
): Promise<void> {
  const stream = await client.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 3000,
    stream: true,
    messages: [
      {
        role: "system",
        content:
          "당신은 성경 학자이자 목회자입니다. 요청된 성경 본문에서 가장 중요하고 핵심적인 구절들만 선별(장당 4-6절)하여 해설하세요. 해설에는 반드시 다음을 포함하세요: 1) 하나님이나 예수님이 왜 그렇게 하셨는지/말씀하셨는지에 대한 자세한 이유, 2) 현대 사회에 비유한 쉬운 설명, 3) 삶의 교훈이나 반성적 내용. 따뜻하고 이해하기 쉬운 어조로 작성하세요.",
      },
      {
        role: "user",
        content: `성경 본문 범위: ${range}\n번역본: 쉬운성경\n\n위 본문에서 핵심 구절들만 선별하여 본문 텍스트와 상세 해설을 JSON으로 제공하세요.`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "detailed_exegesis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            range: { type: "string" },
            version: { type: "string" },
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  verseNum: { type: "string" },
                  text: { type: "string" },
                  explanation: { type: "string" },
                },
                required: ["verseNum", "text", "explanation"],
                additionalProperties: false,
              },
            },
          },
          required: ["range", "version", "items"],
          additionalProperties: false,
        },
      },
    },
  });

  let accumulated = "";
  let emittedCount = 0;
  let metaEmitted = false;

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content || "";
    accumulated += delta;

    // Extract range/version meta once available
    if (!metaEmitted) {
      const rangeMatch = accumulated.match(/"range"\s*:\s*"([^"]+)"/);
      const versionMatch = accumulated.match(/"version"\s*:\s*"([^"]+)"/);
      if (rangeMatch && versionMatch) {
        onMeta(rangeMatch[1], versionMatch[1]);
        metaEmitted = true;
      }
    }

    // Extract completed item objects from the items array
    const itemsStart = accumulated.indexOf('"items"');
    if (itemsStart === -1) continue;
    const arrayStart = accumulated.indexOf("[", itemsStart);
    if (arrayStart === -1) continue;

    let depth = 0;
    let objStart = -1;
    let found = 0;

    for (let i = arrayStart + 1; i < accumulated.length; i++) {
      const ch = accumulated[i];
      if (ch === "{") {
        if (depth === 0) objStart = i;
        depth++;
      } else if (ch === "}") {
        depth--;
        if (depth === 0 && objStart !== -1) {
          found++;
          if (found > emittedCount) {
            try {
              const item = JSON.parse(accumulated.slice(objStart, i + 1));
              onItem(item);
              emittedCount = found;
            } catch { /* incomplete JSON, skip */ }
          }
          objStart = -1;
        }
      }
    }
  }
}

export async function getDeepReflection(
  question: string,
  context: string
): Promise<string | null> {
  return withRetry(async () => {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 1500,
      messages: [
        {
          role: "system",
          content:
            "당신은 성경 학자이자 목회자입니다. 깊은 신학적이고 실천적인 묵상을 한국어로 제공하세요.",
        },
        {
          role: "user",
          content: `Context: ${context}\n\nQuestion: ${question}\n\n깊은 신학적이고 실천적인 묵상을 한국어로 작성해주세요.`,
        },
      ],
    });
    return response.choices[0]?.message?.content || null;
  });
}

export async function playTTS(text: string): Promise<HTMLAudioElement | null> {
  try {
    const response = await client.audio.speech.create({
      model: "tts-1",
      voice: "nova",
      input: text,
      response_format: "mp3",
    });

    const arrayBuffer = await response.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: "audio/mpeg" });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.onended = () => URL.revokeObjectURL(url);
    audio.play();
    return audio;
  } catch (error) {
    console.error("TTS failed", error);
    return null;
  }
}
