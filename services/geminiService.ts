import OpenAI from "openai";
import { DailyReflection, DetailedExegesisResult } from "../types";

const getClient = () =>
  new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "",
    dangerouslyAllowBrowser: true,
  });

/**
 * Helper to retry failed API calls with exponential backoff
 */
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const isQuotaError =
        error?.message?.includes("429") || error?.message?.includes("quota");
      const isRetryable = isQuotaError || error?.status >= 500;

      if (!isRetryable || i === maxRetries - 1) throw error;

      const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
      console.warn(
        `Retrying API call (${i + 1}/${maxRetries}) after ${Math.round(delay)}ms...`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

export async function fetchDailyReflection(
  otRange: string,
  ntRange: string
): Promise<DailyReflection | null> {
  const client = getClient();
  return withRetry(async () => {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "당신은 성경 학자이자 목회자입니다. 반드시 한국어로 작성하고 객관적이며 따뜻한 어조를 사용하세요.",
        },
        {
          role: "user",
          content: `성경 읽기 범위 - 구약: ${otRange}, 신약: ${ntRange}.
이 범위에 대한 정보를 다음 JSON 형식으로 제공해주세요.
{
  "old_testament": { "range": "범위", "background": "배경설명", "vocabulary": [{"word":"단어","meaning":"뜻"}], "figures": [{"name":"이름","description":"설명"}], "summary": "핵심요약" },
  "new_testament": { "range": "범위", "background": "배경설명", "vocabulary": [{"word":"단어","meaning":"뜻"}], "figures": [{"name":"이름","description":"설명"}], "summary": "핵심요약" },
  "meditation_question": "묵상 질문"
}`,
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
                      properties: {
                        word: { type: "string" },
                        meaning: { type: "string" },
                      },
                      required: ["word", "meaning"],
                      additionalProperties: false,
                    },
                  },
                  figures: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        description: { type: "string" },
                      },
                      required: ["name", "description"],
                      additionalProperties: false,
                    },
                  },
                  summary: { type: "string" },
                },
                required: [
                  "range",
                  "background",
                  "vocabulary",
                  "figures",
                  "summary",
                ],
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
                      properties: {
                        word: { type: "string" },
                        meaning: { type: "string" },
                      },
                      required: ["word", "meaning"],
                      additionalProperties: false,
                    },
                  },
                  figures: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        description: { type: "string" },
                      },
                      required: ["name", "description"],
                      additionalProperties: false,
                    },
                  },
                  summary: { type: "string" },
                },
                required: [
                  "range",
                  "background",
                  "vocabulary",
                  "figures",
                  "summary",
                ],
                additionalProperties: false,
              },
              meditation_question: { type: "string" },
            },
            required: [
              "old_testament",
              "new_testament",
              "meditation_question",
            ],
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

export async function getDetailedExegesis(
  range: string,
  version: string
): Promise<DetailedExegesisResult | null> {
  const client = getClient();
  return withRetry(async () => {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "당신은 성경 학자입니다. 요청된 성경 본문의 각 구절별 해설을 한국어로 작성하세요.",
        },
        {
          role: "user",
          content: `성경 본문 범위: ${range}\n번역본(버전): ${version}\n\n위 본문 각 구절별 해설을 JSON으로 제공하세요.`,
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
    const content = response.choices[0]?.message?.content;
    if (!content) return null;
    return JSON.parse(content);
  });
}

export async function getDeepReflection(
  question: string,
  context: string
): Promise<string | null> {
  const client = getClient();
  return withRetry(async () => {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
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

export async function playTTS(text: string): Promise<void> {
  const client = getClient();
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
  } catch (error) {
    console.error("TTS failed", error);
  }
}
