"use server";

import { auth } from "@clerk/nextjs/server";
import dbConnect from "@/lib/dbConnect";
import Interview from "@/models/Interview";
import { model, generativeConfig } from "@/lib/gemini";
import { revalidatePath } from "next/cache";

export async function getInterviewDetails(interviewId: string) {
  try {
    await dbConnect();
    const interview = await Interview.findById(interviewId);

    if (!interview) {
      return { success: false, error: "Interview not found" };
    }

    return { success: true, interview: JSON.parse(JSON.stringify(interview)) };
  } catch (error: unknown) {
    console.error("Error fetching interview details:", error);
    return { success: false, error: "Failed to fetch interview details" };
  }
}

export async function createInterview(data: {
  jobPosition: string;
  jobDesc: string;
  jobExperience: string;
}) {
  try {
    const { userId } = await auth();

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

    console.log("Gemini Prompt:", prompt);

    const chatSession = model.startChat({
      generationConfig: generativeConfig,
      history: [],
    });

    const result = await chatSession.sendMessage(prompt);
    const rawText = result.response.text();
    console.log("Gemini Raw Response:", rawText);

    const mockJsonResp = rawText
      .replace("```json", "")
      .replace("```", "")
      .trim();

    let jsonResponse;
    try {
      jsonResponse = JSON.parse(mockJsonResp);
    } catch (parseError) {
      console.error("JSON Parsing Error:", parseError);
      return {
        success: false,
        error: "Failed to parse AI response. Please try again.",
      };
    }

    const questions = jsonResponse.map((q: { question: string }) => q.question);

    await dbConnect();

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
    return {
      success: false,
      error: "Failed to create interview. Please try again.",
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
  feedback?: string;
  rating?: number;
}) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    await dbConnect();

    const result = await Interview.findByIdAndUpdate(
      data.interviewId,
      {
        $push: {
          answers: {
            question: data.question,
            answer: data.answer,
            feedback: data.feedback,
            rating: data.rating,
          },
        },
      },
      { new: true }
    );

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

    // AI Prompt for Feedback
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
    const mockJsonResp = result.response
      .text()
      .replace("```json", "")
      .replace("```", "");
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
