"use server";

import { auth } from "@clerk/nextjs/server";
import dbConnect from "@/lib/dbConnect";
import Interview from "@/models/Interview";
import User from "@/models/User";
import { model, generativeConfig } from "@/lib/gemini";
import { revalidatePath } from "next/cache";

export async function getInterviewDetails(interviewId: string) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    await dbConnect();
    const interview = await Interview.findOne({
      _id: interviewId,
      clerkId: userId,
    });

    if (!interview) {
      return { success: false, error: "Interview not found" };
    }

    return { success: true, interview: JSON.parse(JSON.stringify(interview)) };
  } catch (error: unknown) {
    console.error("Error fetching interview details:", error);
    return { success: false, error: "Failed to fetch interview details" };
  }
}

async function refundCredit(clerkId: string) {
  try {
    await User.findOneAndUpdate({ clerkId }, { $inc: { credits: 1 } });
  } catch (error) {
    console.error("Failed to refund credit:", error);
  }
}

function sanitizeInput(text: string): string {
  return text
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, "")
    .replace(/```/g, "'''")
    .trim();
}

export async function createInterview(data: {
  jobPosition: string;
  jobDesc: string;
  jobExperience: string;
}) {
  let userId: string | null = null;
  let creditReserved = false;

  try {
    ({ userId } = await auth());

    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const rawPosition = typeof data.jobPosition === "string" ? data.jobPosition.trim() : "";
    const rawDesc = typeof data.jobDesc === "string" ? data.jobDesc.trim() : "";
    const rawExp = parseInt(String(data.jobExperience).trim(), 10);

    if (!rawPosition || rawPosition.length < 2 || rawPosition.length > 100) {
      return {
        success: false,
        error: "Job position must be between 2 and 100 characters.",
      };
    }

    if (!rawDesc || rawDesc.length < 10 || rawDesc.length > 2000) {
      return {
        success: false,
        error: "Job description must be between 10 and 2000 characters.",
      };
    }

    if (isNaN(rawExp) || rawExp < 0 || rawExp > 50) {
      return {
        success: false,
        error: "Years of experience must be a valid number between 0 and 50.",
      };
    }

    const jobPosition = sanitizeInput(rawPosition);
    const jobDesc = sanitizeInput(rawDesc);
    const jobExperience = String(rawExp);

    const randomSalt = Math.random().toString(36).substring(7);
    const prompt = `You are a Principal Technical Interviewer designing an authentic, high-signal technical interview for:
Job Position: ${jobPosition}
Job Description / Tech Stack: ${jobDesc}
Candidate Experience: ${jobExperience} year(s)
Randomization Seed: ${randomSalt}

Create exactly 5 structured, realistic interview questions mapped to the following 5 evaluation stages:
Stage 1: Architecture & System Thinking (high-level system design, modularity, or patterns relevant to this role)
Stage 2: Technical Deep-Dive (in-depth language/framework mechanics, internals, concurrency, or data structures)
Stage 3: Scalability, Caching & Performance (handling high throughput, query optimization, indexing, or memory limits)
Stage 4: Edge Cases, Failure Modes & Debugging (dealing with network partitions, race conditions, or production incident triage)
Stage 5: Trade-offs & Engineering Decision Making (analyzing architectural trade-offs, technology choices, or team velocity vs tech debt)

CRITICAL GUIDELINES:
1. STRICTLY NO GENERIC QUESTIONS: Avoid textbook trivia like "What is React?", "Hooks vs Classes", "What is an index?", or "Tell me about yourself".
2. PRACTICAL & SCENARIO-DRIVEN: Frame questions around realistic production challenges, real-world systems, and situational scenarios.
3. FOR EACH QUESTION: Provide a comprehensive, technical reference answer detailing expected architecture, best practices, and key concepts.

Output strictly in JSON format as an array of 5 objects:
[
  {
    "question": "Question text...",
    "answer": "Comprehensive reference answer covering expected design, mechanics, and trade-offs..."
  }
]
Do not include any explanation or text outside the JSON array.`;

    await dbConnect();

    /**
     * PATTERN 1: ATOMIC CREDIT RESERVATION (Optimistic Concurrency Control)
     * Decrements credits with a predicate check ({ credits: { $gt: 0 } }).
     * If multiple concurrent requests hit this endpoint, MongoDB's atomic document-level
     * write lock guarantees only one succeeds if balance is low, completely preventing double-spends
     * without needing slow distributed Redis locks.
     */
    const dbUser = await User.findOneAndUpdate(
      { clerkId: userId, credits: { $gt: 0 } },
      { $inc: { credits: -1 } }
    );

    if (!dbUser) {
      return {
        success: false,
        error: "Insufficient credits. Please purchase more.",
      };
    }

    creditReserved = true;

    const chatSession = model.startChat({
      generationConfig: generativeConfig,
      history: [],
    });

    const result = await chatSession.sendMessage(prompt);
    const rawText = result.response.text();

    let mockJsonResp = rawText;
    const jsonMatch = rawText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      mockJsonResp = jsonMatch[0];
    } else {
      mockJsonResp = rawText
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
    }

    let jsonResponse;
    try {
      jsonResponse = JSON.parse(mockJsonResp);
    } catch (parseError) {
      /**
       * PATTERN 2: COMPENSATING TRANSACTION ON AI FAILURE
       * If downstream LLM call returns malformed JSON or times out, immediately
       * refund the reserved credit so the user is never penalized for upstream AI failures.
       */
      console.error("JSON Parsing Error:", parseError, "Raw Response:", rawText);
      await refundCredit(userId);
      creditReserved = false;
      return {
        success: false,
        error: "Failed to parse AI response. Please try again.",
      };
    }

    const questions = jsonResponse.map((q: { question: string }) => sanitizeInput(q.question));
    const idealAnswers = jsonResponse.map((q: { answer?: string }) => sanitizeInput(q.answer || ""));

    const newInterview = await Interview.create({
      clerkId: userId,
      jobPosition,
      jobDesc,
      jobExperience,
      questions,
      idealAnswers,
    });

    revalidatePath("/dashboard");

    return {
      success: true,
      interview: JSON.parse(JSON.stringify(newInterview)),
    };
  } catch (error: unknown) {
    console.error("Error creating interview:", error);
    if (creditReserved && userId) {
      await refundCredit(userId);
    }
    const errorMessage = error instanceof Error ? error.message : "Failed to create interview. Please try again.";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

export async function getUserInterviews() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    await dbConnect();

    const interviews = await Interview.find({ clerkId: userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return {
      success: true,
      interviews: JSON.parse(JSON.stringify(interviews)),
    };
  } catch (error: unknown) {
    console.error("Error fetching user interviews:", error);
    return { success: false, error: "Failed to fetch interviews" };
  }
}

export async function saveUserAnswer(data: {
  interviewId: string;
  question: string;
  answer: string;
}) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    if (!data.interviewId || !data.question || typeof data.answer !== "string") {
      return { success: false, error: "Invalid input data" };
    }

    const trimmedAnswer = sanitizeInput(data.answer);
    if (trimmedAnswer.length < 10) {
      return {
        success: false,
        error: "Answer is too short. Please provide at least 10 characters.",
      };
    }
    if (trimmedAnswer.length > 4000) {
      return {
        success: false,
        error: "Answer exceeds maximum allowed length of 4000 characters.",
      };
    }

    await dbConnect();

    const interview = await Interview.findOne({
      _id: data.interviewId,
      clerkId: userId,
    });
    if (!interview) {
      return { success: false, error: "Interview not found" };
    }

    if (interview.status === "completed") {
      return {
        success: false,
        error: "Interview is already completed. Answers cannot be modified.",
      };
    }

    if (!interview.questions.includes(data.question)) {
      return {
        success: false,
        error: "Question does not belong to this interview",
      };
    }

    /**
     * PATTERN 3: ATOMIC POSITIONAL UPDATES (Prevents Read-Modify-Write Race)
     * If multiple answers are saved concurrently, atomic positional operators
     * update only the specific array element without full document overwriting.
     * Also enforces status !== 'completed' at the database query level.
     */
    const updateResult = await Interview.updateOne(
      {
        _id: data.interviewId,
        clerkId: userId,
        status: { $ne: "completed" },
        "answers.question": data.question,
      },
      {
        $set: { "answers.$.answer": trimmedAnswer },
      }
    );

    if (updateResult.matchedCount === 0) {
      await Interview.updateOne(
        {
          _id: data.interviewId,
          clerkId: userId,
          status: { $ne: "completed" },
          "answers.question": { $ne: data.question },
        },
        {
          $push: {
            answers: {
              question: data.question,
              answer: trimmedAnswer,
            },
          },
        }
      );
    }

    return { success: true };
  } catch (error: unknown) {
    console.error("Error saving answer:", error);
    return { success: false, error: "Failed to save answer" };
  }
}

export async function completeAndEvaluateInterview(interviewId: string) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    if (!interviewId) {
      return { success: false, error: "Interview ID is required" };
    }

    await dbConnect();

    const interview = await Interview.findOne({
      _id: interviewId,
      clerkId: userId,
    });

    if (!interview) {
      return { success: false, error: "Interview not found" };
    }

    if (!interview.answers || interview.answers.length === 0) {
      return { success: false, error: "No answers found to evaluate" };
    }

    // Idempotent cache check: If already completed with evaluations, serve from DB (0 Gemini calls)
    const allEvaluated = interview.answers.every(
      (ans: { rating?: number; feedback?: string; idealAnswer?: string }) =>
        typeof ans.rating === "number" && ans.feedback && ans.idealAnswer
    );

    if (interview.status === "completed" && allEvaluated) {
      return {
        success: true,
        feedback: JSON.parse(JSON.stringify(interview.answers)),
        overallRating: interview.overallRating,
        executiveSummary: interview.executiveSummary,
        hiringVerdict: interview.hiringVerdict,
        keyStrengths: interview.keyStrengths,
        keyImprovements: interview.keyImprovements,
      };
    }

    /**
     * PATTERN 4: ZERO WASTED AI TOKENS (Reference Answer Alignment)
     * Instead of asking Gemini to re-invent ideal answers from scratch (which consumes ~50%
     * of output tokens), we pass the pre-generated reference answers. Gemini only needs to
     * output quantitative rating (1-10), targeted feedback, and executive hiring recommendation.
     */
    const questionsAndAnswers = interview.answers.map(
      (a: { question: string; answer: string }) => {
        const qIndex = interview.questions.indexOf(a.question);
        const reference =
          qIndex !== -1 && interview.idealAnswers?.[qIndex]
            ? interview.idealAnswers[qIndex]
            : undefined;

        return {
          question: a.question,
          candidateAnswer: a.answer,
          ...(reference ? { referenceIdealAnswer: reference } : {}),
        };
      }
    );

    const prompt = `You are a Principal Software Engineering hiring manager conducting an executive evaluation for the role: ${interview.jobPosition}.
Job Description / Tech Context: ${interview.jobDesc}
Candidate Experience: ${interview.jobExperience} year(s)
Questions and Candidate Answers: ${JSON.stringify(questionsAndAnswers)}.

Evaluate each answer thoroughly across 3 industry-standard evaluation dimensions:
1. technicalAccuracy (1-10): Correctness of concepts, terminology, algorithms, and practical domain knowledge.
2. communication (1-10): Structure, STAR methodology, clarity, and conciseness.
3. architectureTradeoffs (1-10): Awareness of trade-offs, scaling considerations, edge cases, and failure modes.

Also deliver an executive hiring committee assessment:
- executiveSummary: 2-3 sentences delivering a high-level executive assessment of the candidate's engineering depth and interview performance.
- hiringVerdict: Must be strictly one of: "STRONG HIRE", "HIRE", "LEAN HIRE", "NEEDS PRACTICE".
- keyStrengths: Array of exactly 2-3 concise bullet points highlighting the candidate's biggest technical strengths.
- keyImprovements: Array of exactly 2-3 targeted technical areas the candidate must study or refine.

Provide your response strictly in JSON format as an object with this exact structure:
{
  "evaluations": [
    {
      "question": "exact question text",
      "technicalAccuracy": 1-10,
      "communication": 1-10,
      "architectureTradeoffs": 1-10,
      "rating": 1-10,
      "feedback": "2-3 targeted, actionable sentences detailing candidate strengths and specific engineering improvements"
    }
  ],
  "executiveSummary": "2-3 sentences summary...",
  "hiringVerdict": "STRONG HIRE" | "HIRE" | "LEAN HIRE" | "NEEDS PRACTICE",
  "keyStrengths": ["Strength 1", "Strength 2"],
  "keyImprovements": ["Area 1", "Area 2"]
}
Do not include any explanation or markdown text outside the JSON object.`;

    const chatSession = model.startChat({
      generationConfig: generativeConfig,
      history: [],
    });

    const result = await chatSession.sendMessage(prompt);
    const rawText = result.response.text();

    let mockJsonResp = rawText;
    const objMatch = rawText.match(/\{[\s\S]*\}/);
    const arrMatch = rawText.match(/\[[\s\S]*\]/);

    if (objMatch) {
      mockJsonResp = objMatch[0];
    } else if (arrMatch) {
      mockJsonResp = arrMatch[0];
    } else {
      mockJsonResp = rawText
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
    }

    let parsedResponse: Record<string, unknown> | Array<unknown>;

    try {
      parsedResponse = JSON.parse(mockJsonResp);
    } catch (parseError) {
      console.error("JSON Parsing Error in feedback:", parseError, "Raw:", rawText);
      return {
        success: false,
        error: "Failed to parse AI evaluation. Please try again.",
      };
    }

    interface EvaluationItem {
      question?: string;
      rating?: number;
      technicalAccuracy?: number;
      communication?: number;
      architectureTradeoffs?: number;
      feedback?: string;
      idealAnswer?: string;
    }

    let jsonFeedback: EvaluationItem[] = [];
    let executiveSummary: string | undefined;
    let hiringVerdict: "STRONG HIRE" | "HIRE" | "LEAN HIRE" | "NEEDS PRACTICE" | undefined;
    let keyStrengths: string[] = [];
    let keyImprovements: string[] = [];

    if (Array.isArray(parsedResponse)) {
      jsonFeedback = parsedResponse as EvaluationItem[];
    } else if (parsedResponse && typeof parsedResponse === "object") {
      const obj = parsedResponse as {
        evaluations?: EvaluationItem[];
        executiveSummary?: string;
        hiringVerdict?: "STRONG HIRE" | "HIRE" | "LEAN HIRE" | "NEEDS PRACTICE";
        keyStrengths?: string[];
        keyImprovements?: string[];
      };
      jsonFeedback = Array.isArray(obj.evaluations) ? obj.evaluations : [];
      if (typeof obj.executiveSummary === "string") executiveSummary = obj.executiveSummary;
      if (typeof obj.hiringVerdict === "string") hiringVerdict = obj.hiringVerdict;
      if (Array.isArray(obj.keyStrengths)) keyStrengths = obj.keyStrengths;
      if (Array.isArray(obj.keyImprovements)) keyImprovements = obj.keyImprovements;
    }

    // Map feedback reliably by question match or index fallback
    let totalRating = 0;
    let ratedCount = 0;

    const clampScore = (score: unknown, fallback: number) =>
      typeof score === "number" && !isNaN(score)
        ? Math.min(Math.max(Math.round(score), 1), 10)
        : fallback;

    interview.answers = interview.answers.map(
      (ans: { question: string; answer: string }, idx: number) => {
        const feedbackItem =
          jsonFeedback.find(
            (item) =>
              item.question &&
              item.question.trim().toLowerCase() ===
                ans.question.trim().toLowerCase()
          ) ||
          jsonFeedback[idx] ||
          {};

        const rating = clampScore(feedbackItem.rating, 6);
        const technicalAccuracy = clampScore(feedbackItem.technicalAccuracy, rating);
        const communication = clampScore(feedbackItem.communication, rating);
        const architectureTradeoffs = clampScore(feedbackItem.architectureTradeoffs, rating);

        totalRating += rating;
        ratedCount++;

        const qIndex = interview.questions.findIndex(
          (q: string) => q.trim().toLowerCase() === ans.question.trim().toLowerCase()
        );
        const storedIdeal =
          qIndex !== -1 && interview.idealAnswers?.[qIndex]
            ? interview.idealAnswers[qIndex]
            : null;

        return {
          question: ans.question,
          answer: ans.answer,
          rating,
          technicalAccuracy,
          communication,
          architectureTradeoffs,
          feedback:
            feedbackItem.feedback ||
            "Good effort. Focus on adding more specific technical details, architecture trade-offs, and metrics.",
          idealAnswer:
            storedIdeal ||
            feedbackItem.idealAnswer ||
            "A comprehensive answer would detail concrete architecture, trade-offs, and metrics.",
        };
      }
    );

    interview.overallRating =
      ratedCount > 0 ? Math.round(totalRating / ratedCount) : 0;

    const fallbackVerdict =
      interview.overallRating >= 8
        ? "STRONG HIRE"
        : interview.overallRating >= 7
          ? "HIRE"
          : interview.overallRating >= 5
            ? "LEAN HIRE"
            : "NEEDS PRACTICE";

    interview.hiringVerdict = hiringVerdict || fallbackVerdict;

    interview.executiveSummary =
      executiveSummary ||
      `Candidate completed the ${interview.jobPosition} session with an overall score of ${interview.overallRating}/10. Demonstrated ${
        interview.overallRating >= 7 ? "solid" : "emerging"
      } competence in core technical problem-solving with actionable avenues for architectural depth.`;

    interview.keyStrengths =
      keyStrengths.length > 0
        ? keyStrengths
        : [
            "Demonstrated logical structure in formulating technical answers",
            "Clear familiarity with primary framework and language patterns",
          ];

    interview.keyImprovements =
      keyImprovements.length > 0
        ? keyImprovements
        : [
            "Provide deeper analysis of scalability limits, concurrency, and trade-offs",
            "Incorporate concrete metrics, SLAs, and production recovery strategies",
          ];

    interview.status = "completed";
    interview.markModified("answers");
    await interview.save();

    revalidatePath("/dashboard");
    revalidatePath(`/interview/${interviewId}/feedback`);

    return {
      success: true,
      feedback: JSON.parse(JSON.stringify(interview.answers)),
      overallRating: interview.overallRating,
      executiveSummary: interview.executiveSummary,
      hiringVerdict: interview.hiringVerdict,
      keyStrengths: interview.keyStrengths,
      keyImprovements: interview.keyImprovements,
    };
  } catch (error: unknown) {
    console.error("Error evaluating interview:", error);
    return { success: false, error: "Failed to evaluate interview" };
  }
}

export async function generateFeedback(interviewId: string) {
  return completeAndEvaluateInterview(interviewId);
}

export async function getInterviewFeedback(interviewId: string) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    if (!interviewId) {
      return { success: false, error: "Interview ID is required" };
    }

    await dbConnect();

    const interview = await Interview.findOne({
      _id: interviewId,
      clerkId: userId,
    }).lean();

    if (!interview) {
      return { success: false, error: "Interview not found" };
    }

    return {
      success: true,
      interview: JSON.parse(JSON.stringify(interview)),
    };
  } catch (error) {
    console.error("Error getting interview feedback:", error);
    return { success: false, error: "Failed to fetch interview feedback" };
  }
}

export async function deleteInterview(interviewId: string) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    if (!interviewId) {
      return { success: false, error: "Interview ID is required" };
    }

    await dbConnect();

    const deleted = await Interview.findOneAndDelete({
      _id: interviewId,
      clerkId: userId,
    });

    if (!deleted) {
      return { success: false, error: "Interview not found or unauthorized" };
    }

    revalidatePath("/dashboard");

    return { success: true };
  } catch (error: unknown) {
    console.error("Error deleting interview:", error);
    return { success: false, error: "Failed to delete interview" };
  }
}
