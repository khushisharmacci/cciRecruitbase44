import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { prompt } = req.body;
console.log("GEMINI KEY EXISTS:", !!process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash"
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return res.status(200).json({
      result: text,
    });
  } catch (error) {
  console.error("GEMINI ERROR:", error);
  console.log("USING GEMINI API");
console.log("GEMINI KEY EXISTS:", !!process.env.GEMINI_API_KEY);

  return res.status(500).json({
    error: error.message,
    details: String(error),
  });
  }
}