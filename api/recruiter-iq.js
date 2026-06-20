import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { prompt } = `
Analyze the resume against the job description.

Return ONLY valid JSON.
Do not use markdown.
Do not wrap in \`\`\`json.

{
  "overall_match": 85,
  "skill_match": 90,
  "experience_match": 80,
  "summary": "",
  "matching_skills": [],
  "missing_skills": [],
  "interview_focus_areas": []
}
`;
console.log("GEMINI KEY EXISTS:", !!process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash"
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text();

const cleanText = text
  .replace(/```json/g, "")
  .replace(/```/g, "")
  .trim();

return res.status(200).json(JSON.parse(cleanText));}
 catch (error) {
  console.error("GEMINI ERROR:", error);
  console.log("USING GEMINI API");
console.log("GEMINI KEY EXISTS:", !!process.env.GEMINI_API_KEY);

  return res.status(500).json({
    error: error.message,
    details: String(error),
  });
  }
}