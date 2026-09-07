import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

let genAIInstance: GoogleGenerativeAI | null = null;
let modelInstance: GenerativeModel | null = null;

export function getGeminiModel(): GenerativeModel {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined in environment variables");
  }

  const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  if (!genAIInstance) {
    genAIInstance = new GoogleGenerativeAI(apiKey);
  }

  // Cache model instance for the specified model name
  if (!modelInstance) {
    modelInstance = genAIInstance.getGenerativeModel({
      model: modelName,
    });
  }

  return modelInstance;
}

// Transparent proxy for backward compatibility with `import { model } from "@/lib/gemini"`
export const model = new Proxy({} as GenerativeModel, {
  get(_target, prop) {
    const actualModel = getGeminiModel();
    const value = actualModel[prop as keyof GenerativeModel];
    if (typeof value === "function") {
      return value.bind(actualModel);
    }
    return value;
  },
});

export const generativeConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: "application/json",
};

