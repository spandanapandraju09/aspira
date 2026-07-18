import type { MasterProfile, JobPosting, SkillGap, Recommendation, TailoredDocument } from './supabase'

// ── Keyword Extraction ─────────────────────────────────────────────────────

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has',
  'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
  'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it',
  'we', 'they', 'what', 'which', 'who', 'when', 'where', 'why', 'how', 'all', 'each',
  'every', 'some', 'any', 'few', 'more', 'most', 'other', 'into', 'through', 'during',
  'before', 'after', 'above', 'below', 'up', 'down', 'out', 'off', 'over', 'under',
  'again', 'further', 'then', 'once', 'here', 'there', 'as', 'also', 'not', 'no',
  'nor', 'just', 'so', 'than', 'too', 'very', 's', 't', 'if', 'about', 'against',
  'between', 'own', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'me', 'him',
  'them', 'am', 'having', 'across', 'per', 'upon', 'within', 'without',
])

const SKILL_DB = [
  // Languages
  'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'go', 'rust', 'ruby',
  'swift', 'kotlin', 'scala', 'php', 'sql', 'r', 'matlab', 'perl', 'dart',
  // Frontend
  'react', 'vue', 'angular', 'svelte', 'next.js', 'nuxt', 'redux', 'graphql',
  'html5', 'css3', 'tailwind', 'sass', 'bootstrap', 'jquery', 'web components',
  // Backend
  'node.js', 'express', 'django', 'flask', 'fastapi', 'spring', 'rails',
  'laravel', 'asp.net', 'nestjs', 'microservices', 'rest api', 'grpc',
  // Cloud / DevOps
  'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'ansible',
  'jenkins', 'ci/cd', 'github actions', 'helm', 'serverless', 'lambda',
  // Databases
  'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'dynamodb',
  'cassandra', 'snowflake', 'bigquery', 'supabase', 'firebase',
  // Data / ML
  'pandas', 'numpy', 'scikit-learn', 'tensorflow', 'pytorch', 'keras',
  'nlp', 'machine learning', 'deep learning', 'data science', 'data analysis',
  'tableau', 'power bi', 'spark', 'hadoop', 'airflow', 'dbt',
  // Mobile
  'ios', 'android', 'react native', 'flutter', 'xamarin',
  // Tools / Practices
  'git', 'agile', 'scrum', 'tdd', 'jira', 'confluence', 'figma',
  'leadership', 'communication', 'project management', 'stakeholder management',
  'system design', 'architecture', 'code review', 'mentoring',
  // Security
  'security', 'oauth', 'jwt', 'penetration testing', 'compliance', 'gdpr',
  // Marketing / Business
  'seo', 'sem', 'google analytics', 'content marketing', 'email marketing',
  'crm', 'salesforce', 'hubspot', 'market research', 'a/b testing',
  // Design
  'ux design', 'ui design', 'wireframing', 'prototyping', 'design systems',
  // Finance / Ops
  'excel', 'financial modeling', 'quickbooks', 'sap', 'erp',
]

const SKILL_MAP: Record<string, string> = {}
for (const s of SKILL_DB) {
  SKILL_MAP[s.toLowerCase()] = s
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s+#.\-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

function extractNGrams(text: string, maxN: number): string[] {
  const tokens = tokenize(text)
  const grams: string[] = []
  for (let n = 1; n <= maxN; n++) {
    for (let i = 0; i <= tokens.length - n; i++) {
      const gram = tokens.slice(i, i + n).join(' ')
      if (!gram.split(' ').every((w) => STOP_WORDS.has(w))) {
        grams.push(gram)
      }
    }
  }
  return grams
}

export function extractKeywords(text: string): string[] {
  const ngrams = extractNGrams(text, 3)
  const found = new Set<string>()

  for (const gram of ngrams) {
    if (SKILL_MAP[gram]) {
      found.add(SKILL_MAP[gram])
    }
  }

  // Also extract capitalized terms from original text (likely proper nouns / tech)
  const capMatches = text.match(/\b([A-Z][a-z]+(?:[A-Z][a-z]+)+)\b/g) || []
  for (const m of capMatches) {
    found.add(m)
  }

  // Extract terms after "experience with" / "knowledge of" / "proficiency in"
  const patterns = [
    /experience\s+(?:with|in)\s+([A-Za-z0-9+#.\-\s,]+)/gi,
    /knowledge\s+of\s+([A-Za-z0-9+#.\-\s,]+)/gi,
    /proficiency\s+in\s+([A-Za-z0-9+#.\-\s,]+)/gi,
    /skilled?\s+in\s+([A-Za-z0-9+#.\-\s,]+)/gi,
    /familiar(?:ity)?\s+with\s+([A-Za-z0-9+#.\-\s,]+)/gi,
  ]
  for (const p of patterns) {
    let m: RegExpExecArray | null
    while ((m = p.exec(text)) !== null) {
      const terms = m[1].split(/[,;]|and/).map((t) => t.trim())
      for (const t of terms) {
        if (t.length > 2 && t.length < 40) found.add(t)
      }
    }
  }

  return Array.from(found).slice(0, 30)
}

export function extractRequirements(description: string): string[] {
  const lines = description.split('\n').map((l) => l.trim())
  const reqs: string[] = []
  let inReqSection = false

  for (const line of lines) {
    const lower = line.toLowerCase()
    if (lower.match(/requirements?|qualifications?|what you.*need|must have|you have/i)) {
      inReqSection = true
      continue
    }
    if (lower.match(/responsibilities|what you.*do|you will|nice to have|preferred|benefits/i)) {
      inReqSection = false
      continue
    }
    if (inReqSection && line.match(/^[-*•]|\d+\./) && line.length > 5) {
      reqs.push(line.replace(/^[-*•]\s*|\d+\.\s*/, ''))
    }
  }

  return reqs.slice(0, 15)
}

export function extractResponsibilities(description: string): string[] {
  const lines = description.split('\n').map((l) => l.trim())
  const resps: string[] = []
  let inRespSection = false

  for (const line of lines) {
    const lower = line.toLowerCase()
    if (lower.match(/responsibilities|what you.*do|you will|your role|the role/i)) {
      inRespSection = true
      continue
    }
    if (lower.match(/requirements?|qualifications?|what you.*need|must have|nice to have|benefits|about us/i)) {
      inRespSection = false
      continue
    }
    if (inRespSection && line.match(/^[-*•]|\d+\./) && line.length > 5) {
      resps.push(line.replace(/^[-*•]\s*|\d+\.\s*/, ''))
    }
  }

  return resps.slice(0, 15)
}

// ── Matching Engine ────────────────────────────────────────────────────────

export function computeMatchScore(profileSkills: string[], jobKeywords: string[]): number {
  if (jobKeywords.length === 0) return 0
  const profileSet = new Set(profileSkills.map((s) => s.toLowerCase()))
  const matched = jobKeywords.filter((k) => profileSet.has(k.toLowerCase()))
  return Math.round((matched.length / jobKeywords.length) * 100)
}

export function analyzeSkillGap(
  profile: MasterProfile,
  job: JobPosting,
): Omit<SkillGap, 'id' | 'user_id' | 'job_posting_id' | 'created_at'> {
  const profileSkills = profile.skills || []
  const jobSkills = job.parsed_keywords || []
  const profileSet = new Set(profileSkills.map((s) => s.toLowerCase()))

  const matched = jobSkills.filter((k) => profileSet.has(k.toLowerCase()))
  const missing = jobSkills.filter((k) => !profileSet.has(k.toLowerCase()))
  const overall = jobSkills.length > 0
    ? Math.round((matched.length / jobSkills.length) * 100)
    : 0

  const recommendations: Recommendation[] = missing.slice(0, 8).map((skill, i) => ({
    skill,
    resource: recommendResource(skill),
    priority: i < 3 ? 'high' : i < 6 ? 'medium' : 'low',
  }))

  return {
    matched_skills: Array.from(matched),
    missing_skills: Array.from(missing),
    recommendations,
    overall_score: overall,
  }
}

export function generateRoadmapFallback(profile: MasterProfile) {
  return {
    target_role: profile.headline || 'Senior Professional',
    estimated_timeline: '12-18 Months',
    milestones: [
      {
        title: 'Master Core Competencies',
        description: 'Focus on advancing your current skill set to a senior level.',
        timeframe: 'Months 1-3',
        status: 'in-progress' as const,
      },
      {
        title: 'Build Portfolio & Brand',
        description: 'Create high-impact projects that demonstrate your new skills.',
        timeframe: 'Months 4-6',
        status: 'pending' as const,
      },
      {
        title: 'Target Strategic Roles',
        description: 'Apply to specialized roles with tailored documents and interview prep.',
        timeframe: 'Months 7-12',
        status: 'pending' as const,
      },
    ]
  }
}

function recommendResource(skill: string): string {
  const lower = skill.toLowerCase()
  const resourceMap: Record<string, string> = {
    'react': 'React Official Docs + build 2 small projects',
    'typescript': 'TypeScript Handbook on typescriptlang.org',
    'python': 'Python.org tutorial + automate a small task',
    'aws': 'AWS Cloud Practitioner free training + hands-on lab',
    'docker': 'Docker Get Started guide + containerize an app',
    'kubernetes': 'Kubernetes Basics on kubernetes.io',
    'node.js': 'Node.js docs + build a REST API',
    'graphql': 'GraphQL.org tutorial + Apollo client guide',
    'machine learning': 'Andrew Ng ML course on Coursera',
    'sql': 'SQLBolt interactive tutorial',
    'postgresql': 'PostgreSQL Tutorial on postgresqltutorial.com',
    'redis': 'Redis.io interactive tutorial',
    'terraform': 'HashiCorp Learn Terraform',
    'go': 'A Tour of Go on go.dev',
  }
  return resourceMap[lower] || `Search "${skill}" tutorials on YouTube + official docs`
}

// ── Document Generation ───────────────────────────────────────────────────

export function generateResume(profile: MasterProfile, job: JobPosting): { resume: string; coverLetter: string; atsScore: number; notes: string } {
  const jobSkills = job.parsed_keywords || []
  const profileSkills = profile.skills || []
  const profileSet = new Set(profileSkills.map((s) => s.toLowerCase()))
  const matchedSkills = jobSkills.filter((k) => profileSet.has(k.toLowerCase()))

  // ATS score: keyword coverage + structure
  const keywordCoverage = jobSkills.length > 0
    ? Math.round((matchedSkills.length / jobSkills.length) * 70)
    : 35
  const structureScore = profile.experience.length > 0 ? 15 : 0
  const educationScore = profile.education.length > 0 ? 15 : 0
  const atsScore = Math.min(100, keywordCoverage + structureScore + educationScore)

  const resume = generateResumeText(profile, job, matchedSkills)
  const coverLetter = generateCoverLetterText(profile, job, matchedSkills)

  const notes: string[] = []
  if (atsScore < 50) notes.push('Low keyword match — add more relevant skills to your profile.')
  if (profile.experience.length === 0) notes.push('No experience entries — add work history to improve ATS score.')
  if (profile.summary.length < 50) notes.push('Profile summary is short — expand it for better personalization.')
  if (matchedSkills.length < jobSkills.length) {
    notes.push(`Missing ${jobSkills.length - matchedSkills.length} job keywords. Consider adding: ${jobSkills.filter(k => !profileSet.has(k.toLowerCase())).slice(0, 5).join(', ')}`)
  }
  if (notes.length === 0) notes.push('Strong match! Resume is well-optimized for this job posting.')

  return { resume, coverLetter, atsScore, notes: notes.join('\n') }
}

function generateResumeText(profile: MasterProfile, job: JobPosting, matchedSkills: string[]): string {
  const lines: string[] = []

  // Header
  lines.push(profile.full_name || 'Your Name')
  lines.push([profile.headline, profile.email, profile.phone, profile.location].filter(Boolean).join(' | '))
  lines.push('')

  // Professional Summary
  lines.push('PROFESSIONAL SUMMARY')
  lines.push('─'.repeat(40))
  if (profile.summary) {
    lines.push(profile.summary)
  } else {
    lines.push(`Experienced professional seeking the ${job.title} position at ${job.company}. Proven track record of delivering results and driving impact.`)
  }
  lines.push('')

  // Core Competencies
  if (matchedSkills.length > 0 || profile.skills.length > 0) {
    lines.push('CORE COMPETENCIES')
    lines.push('─'.repeat(40))
    const skills = matchedSkills.length > 0 ? matchedSkills : profile.skills
    lines.push(skills.join(' • '))
    lines.push('')
  }

  // Experience
  if (profile.experience.length > 0) {
    lines.push('PROFESSIONAL EXPERIENCE')
    lines.push('─'.repeat(40))
    for (const exp of profile.experience) {
      lines.push(`${exp.role} | ${exp.company} | ${exp.duration}`)
      if (exp.description) lines.push(`  ${exp.description}`)
      lines.push('')
    }
  }

  // Education
  if (profile.education.length > 0) {
    lines.push('EDUCATION')
    lines.push('─'.repeat(40))
    for (const edu of profile.education) {
      lines.push(`${edu.degree} | ${edu.institution} | ${edu.year}`)
      if (edu.details) lines.push(`  ${edu.details}`)
    }
    lines.push('')
  }

  // Certifications
  if (profile.certifications.length > 0) {
    lines.push('CERTIFICATIONS')
    lines.push('─'.repeat(40))
    for (const cert of profile.certifications) {
      lines.push(`${cert.name} — ${cert.issuer} (${cert.year})`)
    }
    lines.push('')
  }

  return lines.join('\n')
}

function generateCoverLetterText(profile: MasterProfile, job: JobPosting, matchedSkills: string[]): string {
  const name = profile.full_name || 'Your Name'
  const company = job.company || 'your company'
  const title = job.title || 'the position'

  const paragraphs: string[] = []

  paragraphs.push(`Dear Hiring Manager,`)

  paragraphs.push(
    `I am writing to express my strong interest in the ${title} position at ${company}. ` +
    `With ${profile.experience.length > 0 ? `over ${profile.experience.length} years of professional experience` : 'a solid foundation'} ` +
    `in ${profile.headline || 'my field'}${matchedSkills.length > 0 ? ` and expertise in ${matchedSkills.slice(0, 5).join(', ')}` : ''}, ` +
    `I am confident that my skills and passion make me an excellent fit for this role.`
  )

  if (profile.experience.length > 0) {
    const topExp = profile.experience[0]
    paragraphs.push(
      `In my current role as ${topExp.role} at ${topExp.company}, ${topExp.description || `I have developed strong capabilities in ${matchedSkills.slice(0, 3).join(', ') || 'my field'}, consistently delivering high-quality results and collaborating effectively with cross-functional teams.`} ` +
      `This experience has equipped me with the practical knowledge and problem-solving abilities that ${company} is seeking.`
    )
  }

  paragraphs.push(
    `What excites me most about this opportunity at ${company} is the chance to contribute my skills in ` +
    `${matchedSkills.slice(0, 4).join(', ') || 'my area of expertise'} ` +
    `while continuing to grow and take on new challenges. I am particularly drawn to your team's work and believe my background aligns well with your needs.`
  )

  paragraphs.push(
    `I would welcome the opportunity to discuss how my experience and skills can contribute to ${company}'s success. ` +
    `Thank you for considering my application. I look forward to the possibility of speaking with you.`
  )

  paragraphs.push(`Sincerely,\n${name}`)

  return paragraphs.join('\n\n')
}
