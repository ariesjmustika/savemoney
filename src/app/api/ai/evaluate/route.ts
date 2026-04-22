import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || "");

export async function POST(req: Request) {
  if (!process.env.GOOGLE_GEMINI_API_KEY) {
    return NextResponse.json({ error: "Missing Gemini API Key" }, { status: 500 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1. Fetch transactions for current month
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  
  const { data: transactions } = await supabase
    .from("transactions")
    .select(`
      amount,
      description,
      type,
      transaction_date,
      categories (name)
    `)
    .gte("transaction_date", firstDay);

  if (!transactions || transactions.length === 0) {
    return NextResponse.json({ message: "No transactions found for this month yet." });
  }

  // 2. Prepare data for AI
  const summary = transactions.map(t => ({
    amount: t.amount,
    category: t.categories?.name || 'Uncategorized',
    type: t.type,
    description: t.description
  }));

  const prompt = `
    You are a professional financial advisor for a family. 
    Analyze the following transactions for this month and provide a helpful, encouraging, yet honest evaluation in Indonesian.
    
    Transactions: ${JSON.stringify(summary)}
    
    Please provide:
    1. A summary of spending habits.
    2. Areas where they can save money (be specific based on categories like Wifi, Netflix, Food, etc.).
    3. A score from 1-10 on their financial health this month.
    4. Top 3 actionable recommendations.
    
    Format the response in JSON with these keys: "summary", "score", "recommendations" (array of strings).
  `;

  try {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(JSON.stringify(result));
    }

    const text = result.candidates[0].content.parts[0].text;
    
    // Improved JSON extraction: find the first { and last }
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    
    if (firstBrace === -1 || lastBrace === -1) {
      console.error("AI returned non-JSON text:", text);
      throw new Error("AI response was not in JSON format");
    }

    const jsonStr = text.substring(firstBrace, lastBrace + 1);
    const evaluation = JSON.parse(jsonStr);

    // 3. Store in DB
    const monthYear = `${now.getFullYear()}-${now.getMonth() + 1}`;
    
    const { error: dbError } = await supabase.from("ai_evaluations").insert([
      {
        profile_id: user.id,
        month_year: monthYear,
        content: evaluation.summary,
        recommendations: evaluation.recommendations,
        score: parseInt(evaluation.score) || 0
      }
    ]);

    if (dbError) {
      console.error("DB Error storing evaluation:", dbError);
      // We don't throw here, just return the evaluation to the user even if DB storage failed
    }

    return NextResponse.json(evaluation);
  } catch (error: any) {
    console.error("AI Evaluation Error:", error);
    
    // Diagnostic: Try to list available models to see what's wrong
    let availableModels: string[] = [];
    try {
      const result = await genAI.listModels();
      availableModels = result.models.map(m => m.name);
    } catch (listError) {
      availableModels = ["Could not fetch model list"];
    }

    return NextResponse.json({ 
      error: "Failed to generate AI evaluation",
      details: error.message,
      available_models_for_your_key: availableModels
    }, { status: 500 });
  }
}
