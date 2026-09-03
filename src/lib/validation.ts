/**
 * Pure validation and sanitization utilities for candidate and interviewer inputs.
 */

export function sanitizeInput(text: string): string {
  if (typeof text !== "string") return "";
  return text
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, "")
    .replace(/```/g, "'''")
    .trim();
}

export function clampScore(score: unknown, fallback = 5): number {
  if (typeof score !== "number" || isNaN(score)) {
    return fallback;
  }
  return Math.min(Math.max(Math.round(score), 1), 10);
}

export function validateInterviewCreation(data: {
  jobPosition?: string;
  jobDesc?: string;
  jobExperience?: string | number;
}): { isValid: boolean; error?: string } {
  const position = typeof data.jobPosition === "string" ? data.jobPosition.trim() : "";
  const desc = typeof data.jobDesc === "string" ? data.jobDesc.trim() : "";
  const exp = parseInt(String(data.jobExperience).trim(), 10);

  if (!position || position.length < 2 || position.length > 100) {
    return {
      isValid: false,
      error: "Job position must be between 2 and 100 characters.",
    };
  }

  if (!desc || desc.length < 10 || desc.length > 2000) {
    return {
      isValid: false,
      error: "Job description must be between 10 and 2000 characters.",
    };
  }

  if (isNaN(exp) || exp < 0 || exp > 50) {
    return {
      isValid: false,
      error: "Years of experience must be a valid number between 0 and 50.",
    };
  }

  return { isValid: true };
}

export function validateAnswerPayload(answer: string): { isValid: boolean; error?: string } {
  if (typeof answer !== "string") {
    return { isValid: false, error: "Invalid answer payload" };
  }

  const sanitized = sanitizeInput(answer);

  if (sanitized.length < 10) {
    return {
      isValid: false,
      error: "Answer is too short. Please provide at least 10 characters.",
    };
  }

  if (sanitized.length > 4000) {
    return {
      isValid: false,
      error: "Answer exceeds maximum allowed length of 4000 characters.",
    };
  }

  return { isValid: true };
}
