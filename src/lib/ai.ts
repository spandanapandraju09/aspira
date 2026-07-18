import { GoogleGenerativeAI } from '@google/generative-ai'
import type { MasterProfile, JobPosting, SkillGap, Recommendation } from './supabase'

// Fallback logic structure for robust AI calling
const getApiKey = () => {
  const localKey = localStorage.getItem('gemini_api_key')
  if (localKey) return localKey
  return import.meta.env.VITE_GEMINI_API_KEY || ''
}

export async function analyzeJobPosting(jobDescription: string) {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error("Gemini API key is missing. Please set VITE_GEMINI_API_KEY in your .env file.")

  const genAI = new GoogleGenerativeAI(apiKey)
  // Using gemini-1.5-pro for complex reasoning tasks (high model)
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" })

  const prompt = `
You are an expert technical recruiter and AI Job Analyzer.
Analyze the following job description and extract the most important information.
Return the output STRICTLY as a JSON object with the following structure:
{
  "keywords": ["array", "of", "top", "skills", "and", "technologies", "max 20"],
  "requirements": ["array", "of", "key", "requirements", "max 10"],
  "responsibilities": ["array", "of", "key", "responsibilities", "max 10"]
}

Job Description:
${jobDescription}
`
  const result = await model.generateContent(prompt)
  const response = result.response.text()
  
  // Clean up potential markdown formatting from the output
  const cleanedText = response.replace(/```json/g, '').replace(/```/g, '').trim()
  return JSON.parse(cleanedText) as {
    keywords: string[]
    requirements: string[]
    responsibilities: string[]
  }
}

export async function generateGapAnalysis(profile: MasterProfile, job: JobPosting) {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error("Gemini API key is missing. Please set VITE_GEMINI_API_KEY in your .env file.")

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" })

  const prompt = `
You are an expert career coach and technical recruiter.
Compare the candidate's profile with the job posting and generate a comprehensive skill gap analysis.

Candidate Profile:
- Skills: ${profile.skills?.join(', ') || 'None'}
- Experience: ${JSON.stringify(profile.experience || [])}
- Education: ${JSON.stringify(profile.education || [])}
- Certifications: ${JSON.stringify(profile.certifications || [])}

Job Requirements:
- Keywords/Skills: ${job.parsed_keywords?.join(', ')}
- Requirements: ${job.requirements?.join('\n')}

Calculate a realistic match score (0-100) based on how well the candidate meets the requirements.
Identify matching skills and missing skills.
Provide specific, actionable recommendations for how to learn the missing skills or compensate for them.

Return the output STRICTLY as a JSON object with the following structure:
{
  "matched_skills": ["array", "of", "matching", "skills"],
  "missing_skills": ["array", "of", "missing", "skills"],
  "overall_score": 75,
  "recommendations": [
    {
      "skill": "name of missing skill",
      "resource": "specific course, book, or project idea to learn it",
      "priority": "high" | "medium" | "low"
    }
  ]
}
`
  const result = await model.generateContent(prompt)
  const response = result.response.text()
  const cleanedText = response.replace(/```json/g, '').replace(/```/g, '').trim()
  return JSON.parse(cleanedText) as Omit<SkillGap, 'id' | 'user_id' | 'job_posting_id' | 'created_at'>
}

export async function generateTailoredDocuments(profile: MasterProfile, job: JobPosting) {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error("Gemini API key is missing. Please set VITE_GEMINI_API_KEY in your .env file.")

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" })

  const prompt = `
You are an elite executive resume writer and career consultant.
Your task is to generate a highly tailored resume and cover letter for a candidate applying to a specific job.

Candidate Profile:
Name: ${profile.full_name}
Headline: ${profile.headline}
Summary: ${profile.summary}
Skills: ${profile.skills?.join(', ')}
Experience: ${JSON.stringify(profile.experience || [])}
Education: ${JSON.stringify(profile.education || [])}
Certifications: ${JSON.stringify(profile.certifications || [])}

Job Posting:
Title: ${job.title}
Company: ${job.company}
Description: ${job.description}
Keywords: ${job.parsed_keywords?.join(', ')}

Instructions:
1. Tailor the resume content to highlight the experience and skills most relevant to the job posting. Use strong action verbs and quantify achievements where possible (or keep them if already quantified).
2. Write a compelling cover letter that explains why the candidate is a perfect fit for the role and the company. Do not use placeholders like [Company Name], use the actual data.
3. Calculate an ATS Score (0-100) based on keyword optimization and format structure.
4. Provide constructive notes/feedback on the candidate's profile strengths and weaknesses regarding this specific role.

Return the output STRICTLY as a JSON object with the following structure:
{
  "resume": "Full tailored resume text (Markdown format)",
  "coverLetter": "Full tailored cover letter text (Markdown format)",
  "atsScore": 85,
  "notes": "Actionable feedback notes (Markdown format)"
}
`
  const result = await model.generateContent(prompt)
  const response = result.response.text()
  const cleanedText = response.replace(/```json/g, '').replace(/```/g, '').trim()
  return JSON.parse(cleanedText) as {
    resume: string
    coverLetter: string
    atsScore: number
    notes: string
  }
}

export async function generateCareerRoadmap(profile: MasterProfile, targetRole?: string) {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error("Gemini API key is missing.")

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" })

  const prompt = `
You are an expert career strategist. Create a personalized career roadmap for the following candidate.

Candidate Profile:
Name: ${profile.full_name}
Headline: ${profile.headline}
Skills: ${profile.skills?.join(', ')}
Experience: ${JSON.stringify(profile.experience || [])}
Target Role: ${targetRole || profile.headline || 'Senior position in their field'}

Create a realistic timeline and 3-5 major milestones.
Return the output STRICTLY as a JSON object with the following structure:
{
  "target_role": "Specific Job Title",
  "estimated_timeline": "e.g., 6-12 Months",
  "milestones": [
    {
      "title": "Milestone Title",
      "description": "Detailed actionable description",
      "timeframe": "e.g., Months 1-3",
      "status": "pending"
    }
  ]
}
`
  const result = await model.generateContent(prompt)
  const response = result.response.text()
  const cleanedText = response.replace(/```json/g, '').replace(/```/g, '').trim()
  return JSON.parse(cleanedText) as {
    target_role: string
    estimated_timeline: string
    milestones: { title: string; description: string; timeframe: string; status: 'completed' | 'in-progress' | 'pending' }[]
  }
}

export async function generateInterviewQuestions(job: JobPosting | null, profile: MasterProfile | null, role?: string) {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error("Gemini API key is missing.")

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" })

  const targetRole = job?.title || role || profile?.headline || 'Software Engineer'
  const context = job ? `Job Description: ${job.description}` : ''

  const prompt = `
You are an expert technical interviewer. Generate 3 highly relevant interview questions for a candidate applying for the role of ${targetRole}.
${context}

Make them a mix of behavioral and technical questions.
Return the output STRICTLY as a JSON array of strings:
[
  "Question 1",
  "Question 2",
  "Question 3"
]
`
  const result = await model.generateContent(prompt)
  const response = result.response.text()
  const cleanedText = response.replace(/```json/g, '').replace(/```/g, '').trim()
  return JSON.parse(cleanedText) as string[]
}

export async function evaluateInterviewAnswer(question: string, answer: string) {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error("Gemini API key is missing.")

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" })

  const prompt = `
You are an expert technical interviewer. Evaluate the candidate's answer to the following question:
Question: ${question}
Candidate's Answer: ${answer}

Provide constructive feedback, score it out of 10, and provide an example of a "perfect" answer.
Return the output STRICTLY as a JSON object with the following structure:
{
  "score": 8,
  "feedback": "Actionable feedback...",
  "ideal_answer": "An example of a perfect response..."
}
`
  const result = await model.generateContent(prompt)
  const response = result.response.text()
  const cleanedText = response.replace(/```json/g, '').replace(/```/g, '').trim()
  return JSON.parse(cleanedText) as {
    score: number
    feedback: string
    ideal_answer: string
  }
}

export async function chatWithAI(history: { role: 'user' | 'model'; parts: { text: string }[] }[], message: string) {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error("Gemini API key is missing.")

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" })

  const chat = model.startChat({
    history: [
      {
        role: 'user',
        parts: [{ text: 'You are AspiraAI, an expert career assistant. Be concise, helpful, and professional. Help the user clarify doubts about their career, resume, or this platform.' }]
      },
      {
        role: 'model',
        parts: [{ text: 'Understood. I am AspiraAI, your career co-pilot. How can I help you today?' }]
      },
      ...history
    ]
  })

  const result = await chat.sendMessage(message)
  return result.response.text()
}

