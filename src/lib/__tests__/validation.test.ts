import { describe, it, expect } from "vitest";
import {
  sanitizeInput,
  clampScore,
  validateInterviewCreation,
  validateAnswerPayload,
} from "../validation";

describe("Validation & Security Sanitization Utilities", () => {
  describe("sanitizeInput", () => {
    it("strips ASCII and Unicode control characters", () => {
      const malicious = "Hello\u0000\u0007World\u001B!";
      expect(sanitizeInput(malicious)).toBe("HelloWorld!");
    });

    it("disarms markdown delimiter blocks to prevent prompt injection escapes", () => {
      const injection = "```json\n{ evil: true }\n```";
      const sanitized = sanitizeInput(injection);
      expect(sanitized).not.toContain("```");
      expect(sanitized).toBe("'''json\n{ evil: true }\n'''");
    });

    it("trims surrounding whitespace", () => {
      expect(sanitizeInput("   Next.js 16 Architect   ")).toBe(
        "Next.js 16 Architect"
      );
    });

    it("handles empty or non-string inputs safely", () => {
      expect(sanitizeInput("")).toBe("");
      // @ts-expect-error test non-string runtime safety
      expect(sanitizeInput(null)).toBe("");
      // @ts-expect-error test non-string runtime safety
      expect(sanitizeInput(undefined)).toBe("");
    });
  });

  describe("clampScore", () => {
    it("clamps scores greater than 10 down to 10", () => {
      expect(clampScore(14)).toBe(10);
      expect(clampScore(99)).toBe(10);
    });

    it("clamps scores lower than 1 up to 1", () => {
      expect(clampScore(0)).toBe(1);
      expect(clampScore(-5)).toBe(1);
    });

    it("rounds decimal scores to nearest integer", () => {
      expect(clampScore(8.7)).toBe(9);
      expect(clampScore(7.2)).toBe(7);
    });

    it("falls back to default score on non-numeric or NaN input", () => {
      expect(clampScore(NaN, 5)).toBe(5);
      expect(clampScore("invalid", 6)).toBe(6);
      expect(clampScore(undefined, 7)).toBe(7);
    });
  });

  describe("validateInterviewCreation", () => {
    it("approves valid interview creation payload", () => {
      const result = validateInterviewCreation({
        jobPosition: "Staff Software Engineer",
        jobDesc:
          "Designing high-throughput event-driven microservices with Kafka and MongoDB.",
        jobExperience: "8",
      });
      expect(result.isValid).toBe(true);
    });

    it("rejects jobPosition that is too short", () => {
      const result = validateInterviewCreation({
        jobPosition: "A",
        jobDesc: "Valid long description with plenty of characters.",
        jobExperience: 5,
      });
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Job position");
    });

    it("rejects jobDesc that is too short", () => {
      const result = validateInterviewCreation({
        jobPosition: "Frontend Dev",
        jobDesc: "Too short",
        jobExperience: 3,
      });
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Job description");
    });

    it("rejects unrealistic years of experience", () => {
      const result = validateInterviewCreation({
        jobPosition: "Software Architect",
        jobDesc: "Valid long description with plenty of characters.",
        jobExperience: 99,
      });
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Years of experience");
    });
  });

  describe("validateAnswerPayload", () => {
    it("approves valid answer payload within 10-4000 characters", () => {
      const valid = "We use optimistic locking with predicate guards in MongoDB.";
      const result = validateAnswerPayload(valid);
      expect(result.isValid).toBe(true);
    });

    it("rejects answers shorter than 10 characters", () => {
      const result = validateAnswerPayload("Yes.");
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("too short");
    });

    it("rejects answers exceeding 4000 characters", () => {
      const hugeAnswer = "A".repeat(4001);
      const result = validateAnswerPayload(hugeAnswer);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("maximum allowed length");
    });
  });
});
