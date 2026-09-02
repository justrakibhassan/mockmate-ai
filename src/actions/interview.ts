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
    const prompt = `Job Position: ${jobPosition}, Job Description: ${jobDesc}, Years of Experience: ${jobExperience}.
    Create 5 highly specific and randomized technical interview questions. 
    Seed: ${randomSalt}
    
    Guidelines:
    1. EXTREME VARIETY: Do not use common or generic questions like "Tell me about yourself", "What is React?", "Hooks vs Classes", "Props vs State", or "Virtual DOM".
    2. SITUATIONAL FOCUS: Use "What if" scenarios or "Tell me about a time" related to the specific job description and experience level.
    3. NO REPETITION: Every question must be radically different from the others.
    4. Provide the result strictly in JSON format as an array of objects, each with "question" and "answer" fields. Do not include any other text.`;

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

    const interviews = await Interview.find({ clerkId: userId }).sort({
      createdAt: -1,
    });

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
     * PATTERN 3: COST & QUOTA ABUSE HARDENING (Decoupled Answering)
     * Saving candidate responses is a fast, bounded O(1) MongoDB write (<50ms).
     * By decoupling answer persistence from AI evaluation, we eliminate the vulnerability
     * where malicious users or automated scripts could loop saveUserAnswer to burn
     * unlimited Gemini quota without spending any credits.
     */
    const existingIndex = interview.answers.findIndex(
      (ans: { question: string }) => ans.question === data.question
    );

    if (existingIndex === -1) {
      interview.answers.push({
        question: data.question,
        answer: trimmedAnswer,
      });
    } else {
      interview.answers[existingIndex].answer = trimmedAnswer;
    }

    interview.markModified("answers");
    await interview.save();

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
      };
    }

    /**
     * PATTERN 4: ZERO WASTED AI TOKENS (Reference Answer Alignment)
     * Instead of asking Gemini to re-invent ideal answers from scratch (which consumes ~50%
     * of output tokens), we pass the pre-generated reference answers. Gemini only needs to
     * output quantitative rating (1-10) and targeted feedback, cutting token costs and latency in half.
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

    const prompt = `You are an expert technical interviewer evaluating candidate answers for the position: ${interview.jobPosition}.
Job Description: ${interview.jobDesc}
Questions and Candidate Answers: ${JSON.stringify(questionsAndAnswers)}.

Evaluate each answer professionally against the technical requirements.
Provide your response strictly in JSON format as an array of objects matching the answers:
[
  {
    "question": "exact question text",
    "rating": 1-10 (integer score based on technical accuracy, clarity, and completeness),
    "feedback": "2-3 constructive sentences detailing strengths and specific areas to improve"
  }
]
Do not include any other text or markdown formatting outside the JSON array.`;

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

    let jsonFeedback: Array<{
      question?: string;
      rating?: number;
      feedback?: string;
      idealAnswer?: string;
    }>;

    try {
      jsonFeedback = JSON.parse(mockJsonResp);
    } catch (parseError) {
      console.error("JSON Parsing Error in feedback:", parseError, "Raw:", rawText);
      return {
        success: false,
        error: "Failed to parse AI evaluation. Please try again.",
      };
    }

    // Map feedback reliably by question match or index fallback
    let totalRating = 0;
    let ratedCount = 0;

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

        const rating =
          typeof feedbackItem.rating === "number"
            ? Math.min(Math.max(Math.round(feedbackItem.rating), 1), 10)
            : 5;
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
          feedback:
            feedbackItem.feedback ||
            "Good effort. Focus on adding more specific technical details and architecture choices.",
          idealAnswer:
            storedIdeal ||
            feedbackItem.idealAnswer ||
            "A comprehensive answer would detail concrete architecture, trade-offs, and metrics.",
        };
      }
    );

    interview.overallRating =
      ratedCount > 0 ? Math.round(totalRating / ratedCount) : 0;
    interview.status = "completed";
    interview.markModified("answers");
    await interview.save();

    revalidatePath("/dashboard");
    revalidatePath(`/interview/${interviewId}/feedback`);

    return {
      success: true,
      feedback: JSON.parse(JSON.stringify(interview.answers)),
      overallRating: interview.overallRating,
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
