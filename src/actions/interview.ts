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

    const { jobPosition, jobDesc, jobExperience } = data;

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

    // Reserve a credit atomically so concurrent requests cannot double-spend
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
      console.error("JSON Parsing Error:", parseError, "Raw Response:", rawText);
      await refundCredit(userId);
      creditReserved = false;
      return {
        success: false,
        error: "Failed to parse AI response. Please try again.",
      };
    }

    const questions = jsonResponse.map((q: { question: string }) => q.question);

    const newInterview = await Interview.create({
      clerkId: userId,
      jobPosition,
      jobDesc,
      jobExperience,
      questions,
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

    await dbConnect();

    // Get interview context for better evaluation
    const interview = await Interview.findOne({
      _id: data.interviewId,
      clerkId: userId,
    });
    if (!interview) {
      return { success: false, error: "Interview not found" };
    }

    if (!interview.questions.includes(data.question)) {
      return { success: false, error: "Question does not belong to this interview" };
    }

    // AI Prompt for Individual Answer Feedback
    const prompt = `
    Job Position: ${interview.jobPosition}
    Job Description: ${interview.jobDesc}
    Question: ${data.question}
    User Answer: ${data.answer}
    
    Evaluate this specific answer professionally. Provide:
    1. "rating": A score from 1-10 based on technical accuracy and completeness.
    2. "feedback": 2-3 sentences of constructive feedback.
    3. "idealAnswer": A high-quality, professional response that demonstrates how this question should have been answered perfectly.
    
    Response must be in JSON format: { "rating": number, "feedback": string, "idealAnswer": string }. Do not include any other text.
    `;

    const chatSession = model.startChat({
      generationConfig: generativeConfig,
      history: [],
    });

    const aiResult = await chatSession.sendMessage(prompt);
    let mockJsonResp = aiResult.response.text();
    const jsonMatch = mockJsonResp.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      mockJsonResp = jsonMatch[0];
    } else {
      mockJsonResp = mockJsonResp
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
    }
    
    const jsonFeedback = JSON.parse(mockJsonResp);

    const entry = {
      question: data.question,
      answer: data.answer,
      feedback: jsonFeedback.feedback,
      rating: jsonFeedback.rating,
      idealAnswer: jsonFeedback.idealAnswer,
    };

    const existingIndex = interview.answers.findIndex(
      (ans: { question: string }) => ans.question === data.question
    );

    if (existingIndex === -1) {
      interview.answers.push(entry);
    } else {
      interview.answers[existingIndex] = entry;
    }

    interview.markModified("answers");
    const result = await interview.save();

    return { success: true, result: JSON.parse(JSON.stringify(result)) };
  } catch (error: unknown) {
    console.error("Error saving answer:", error);
    return { success: false, error: "Failed to save answer" };
  }
}

export async function generateFeedback(interviewId: string) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    await dbConnect();

    const interview = await Interview.findById(interviewId);

    if (!interview || interview.clerkId !== userId) {
      return { success: false, error: "Interview not found" };
    }

    if (!interview.answers || interview.answers.length === 0) {
      return { success: false, error: "No answers found to evaluate" };
    }

    // Check if all answers already have evaluation
    const allEvaluated = interview.answers.every((ans: { rating?: number; feedback?: string; idealAnswer?: string }) => 
      ans.rating && ans.feedback && ans.idealAnswer
    );
    
    if (allEvaluated) {
      interview.status = "completed";
      await interview.save();
      return {
        success: true,
        feedback: JSON.parse(JSON.stringify(interview.answers)),
      };
    }

    // AI Prompt for Feedback (Fallback for older interviews)
    const prompt = `Interview for ${
      interview.jobPosition
    }. Questions and User Answers: ${JSON.stringify(interview.answers)}. 
    Evaluate each answer professionally. For each answer, provide:
    1. "rating": A score from 1-10 based on technical accuracy, clarity, and completeness.
    2. "feedback": 2-3 sentences of constructive feedback. Identify what was good and specifically how to improve the response.
    3. "idealAnswer": A concise, high-quality, professional response (approx 3-5 sentences) that demonstrates deep expertise and clear communication. Use the STAR method where applicable.
    
    All data must be in JSON format as an array of objects. Do not include any other text or markdown formatting except the JSON.`;

    const chatSession = model.startChat({
      generationConfig: generativeConfig,
      history: [],
    });

    const result = await chatSession.sendMessage(prompt);
    let mockJsonResp = result.response.text();
    const jsonMatch = mockJsonResp.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      mockJsonResp = jsonMatch[0];
    } else {
      mockJsonResp = mockJsonResp
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
    }
    const jsonFeedback = JSON.parse(mockJsonResp);

    // Update the interview with the feedback
    interview.answers = interview.answers.map((ans: { question: string, answer: string }, idx: number) => {
      const feedbackItem = jsonFeedback[idx] || {};
      return {
        question: ans.question,
        answer: ans.answer,
        rating: feedbackItem.rating || 0,
        feedback: feedbackItem.feedback || "No feedback provided",
        idealAnswer: feedbackItem.idealAnswer || feedbackItem.ideal_answer || feedbackItem.best_answer || "No ideal answer generated",
      };
    });

    interview.status = "completed";
    interview.markModified("answers");
    await interview.save();

    return {
      success: true,
      feedback: JSON.parse(JSON.stringify(interview.answers)),
    };
  } catch (error: unknown) {
    console.error("Error generating feedback:", error);
    return { success: false, error: "Failed to generate feedback" };
  }
}
