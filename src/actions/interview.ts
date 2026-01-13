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

    // AI Prompt
    const prompt = `Job Position: ${jobPosition}, Job Description: ${jobDesc}, Years of Experience: ${jobExperience}. Based on this, provide 5 technical interview questions with answers in JSON format. The JSON should be an array of objects, each with "question" and "answer" fields. Do not include any other text.`;

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
    Evaluate each answer. For each answer, provide:
    1. "rating": A score from 1-10.
    2. "feedback": A brief explanation of why that score was given and how to improve.
    3. "idealAnswer": A perfect version of the answer.
    All data must be in JSON format as an array of objects. Do not include any other text.`;

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
    interview.answers = interview.answers.map(
      (ans: { question: string; answer: string }, idx: number) => ({
        ...ans,
        rating: jsonFeedback[idx]?.rating,
        feedback: jsonFeedback[idx]?.feedback,
        idealAnswer: jsonFeedback[idx]?.idealAnswer,
      })
    );

    interview.status = "completed";
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
