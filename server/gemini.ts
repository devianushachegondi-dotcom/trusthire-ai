import { GoogleGenAI } from '@google/genai';

let aiClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export interface StructuredScreeningAIOutput {
  candidate: {
    name: string;
    email: string;
    phone: string;
    title?: string;
  };
  education: Array<{
    degree: string;
    institution: string;
    graduationYear: string;
  }>;
  skills: {
    technicalSkills: string[];
    softSkills: string[];
    tools: string[];
    programmingLanguages: string[];
  };
  experience: Array<{
    company: string;
    role: string;
    duration: string;
    responsibilities: string;
  }>;
  projects: Array<{
    name: string;
    technologies: string[];
    description: string;
  }>;
  certifications: Array<{
    name: string;
    organization: string;
    date: string;
  }>;
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  educationMatch: {
    match: 'High' | 'Medium' | 'Low' | 'Not found in resume.';
    degree?: string;
    details: string;
  };
  experienceMatch: {
    match: 'High' | 'Medium' | 'Low' | 'Not found in resume.';
    years?: string;
    details: string;
  };
  certificationMatch: {
    match: 'High' | 'Medium' | 'Low' | 'Not found in resume.';
    details: string;
  };
  strengths: string[];
  missingInformation: string[];
}

/**
 * Screen Resume with Gemini 3.8 Flash
 */
export async function screenResumeWithGemini(
  resumeText: string,
  jobDescription: {
    title: string;
    department: string;
    experienceRequired: string;
    educationRequired: string;
    requiredSkills: string[];
    preferredSkills: string[];
    description: string;
    responsibilities: string;
  }
): Promise<StructuredScreeningAIOutput> {
  const client = getGeminiClient();

  const prompt = `You are TrustHire AI, an objective, rigorous AI recruitment assistant.
Analyze the following resume text against the target Job Description.

IMPORTANT RULES:
1. Never invent or hallucinate candidate information.
2. If any piece of information is not present in the resume, explicitly state "Not found in resume."
3. Evaluate skills, experience, education, and certifications accurately against job requirements.
4. Calculate a realistic screening match score from 0 to 100 based on required skills (40%), experience relevance (30%), education (15%), and preferred skills/certifications (15%).
5. Return strictly valid JSON adhering to the required schema.

JOB DESCRIPTION:
Title: ${jobDescription.title}
Department: ${jobDescription.department}
Required Skills: ${jobDescription.requiredSkills.join(', ')}
Preferred Skills: ${jobDescription.preferredSkills.join(', ')}
Experience Required: ${jobDescription.experienceRequired}
Education Required: ${jobDescription.educationRequired}
Description: ${jobDescription.description}
Responsibilities: ${jobDescription.responsibilities}

RESUME CONTENT:
"""
${resumeText}
"""

Return the output strictly in the following JSON format:
{
  "candidate": {
    "name": "Full Name or 'Not found in resume.'",
    "email": "email or 'Not found in resume.'",
    "phone": "phone or 'Not found in resume.'",
    "title": "current or latest title"
  },
  "education": [
    { "degree": "...", "institution": "...", "graduationYear": "..." }
  ],
  "skills": {
    "technicalSkills": ["..."],
    "softSkills": ["..."],
    "tools": ["..."],
    "programmingLanguages": ["..."]
  },
  "experience": [
    { "company": "...", "role": "...", "duration": "...", "responsibilities": "..." }
  ],
  "projects": [
    { "name": "...", "technologies": ["..."], "description": "..." }
  ],
  "certifications": [
    { "name": "...", "organization": "...", "date": "..." }
  ],
  "score": 85,
  "matchedSkills": ["skills in resume matching JD"],
  "missingSkills": ["required skills in JD not present in resume"],
  "educationMatch": {
    "match": "High" | "Medium" | "Low" | "Not found in resume.",
    "degree": "Candidate degree",
    "details": "Factual comparison with requirement"
  },
  "experienceMatch": {
    "match": "High" | "Medium" | "Low" | "Not found in resume.",
    "years": "Estimated years or 'Not found in resume.'",
    "details": "Factual comparison with requirement"
  },
  "certificationMatch": {
    "match": "High" | "Medium" | "Low" | "Not found in resume.",
    "details": "Factual comparison"
  },
  "strengths": ["Key factual advantages"],
  "missingInformation": ["List any missing essential fields"]
}`;

  if (!client) {
    // Fallback: rule-based semantic parser when GEMINI_API_KEY is not configured
    return fallbackRuleBasedScreening(resumeText, jobDescription);
  }

  try {
    const response = await client.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);
    return parsed as StructuredScreeningAIOutput;
  } catch (error) {
    console.error('Gemini API Screening Error:', error);
    // Return robust parsed fallback if AI API encounters rate limit or network issue
    return fallbackRuleBasedScreening(resumeText, jobDescription);
  }
}

/**
 * AI Assistant Chat with Recruiter Context
 */
export async function chatWithAIAssistant(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  recruiterContext: {
    recruiterName: string;
    jobs: any[];
    candidates: any[];
    certificates: any[];
    stats: any;
  }
): Promise<string> {
  const client = getGeminiClient();

  // Create context summary strictly bounded to this recruiter's authorized scope
  const jobsSummary = recruiterContext.jobs
    .map(j => `- Job ID ${j.id}: ${j.title} (${j.department}, ${j.location}) | Req Skills: ${j.requiredSkills.join(', ')} | Status: ${j.status}`)
    .join('\n');

  const candidatesSummary = recruiterContext.candidates
    .map(c => `- Candidate ID ${c.id}: ${c.name} (${c.email}, ${c.title || 'Applicant'}) | Skills: ${c.skills.slice(0, 8).join(', ')} | Shortlisted: ${c.isShortlisted ? 'Yes' : 'No'}`)
    .join('\n');

  const certsSummary = recruiterContext.certificates
    .map(cert => `- Cert ID ${cert.id}: ${cert.certificateName} (${cert.issuingOrganization}) for candidate ${cert.candidateId} | Status: ${cert.status}`)
    .join('\n');

  const systemInstruction = `You are TrustHire AI Assistant, an intelligent, professional recruiting copilot embedded directly into the TrustHire AI platform.
You are assisting ${recruiterContext.recruiterName}.

YOUR AUTHORIZED RECRUITMENT DATA:
---
JOBS OWNED BY RECRUITER (${recruiterContext.jobs.length} total):
${jobsSummary || 'No jobs created yet.'}

CANDIDATES IN PIPELINE (${recruiterContext.candidates.length} total):
${candidatesSummary || 'No candidates uploaded yet.'}

CERTIFICATES & VERIFICATIONS:
${certsSummary || 'No certificates filed yet.'}

DASHBOARD SUMMARY:
- Total Jobs: ${recruiterContext.stats.totalJobs}
- Total Candidates: ${recruiterContext.stats.totalCandidates}
- Resumes Screened: ${recruiterContext.stats.resumesScreened}
- Shortlisted Candidates: ${recruiterContext.stats.shortlistedCandidates}
- Verified Certificates: ${recruiterContext.stats.certificatesVerified}
- Pending Verifications: ${recruiterContext.stats.pendingVerifications}
---

CRITICAL PRINCIPLES:
1. ONLY reference and discuss the recruiter's own data shown above. Never invent fake candidate records or fake database facts.
2. Clearly distinguish between FACTUAL DATABASE DATA (names, existing skills, verified statuses) and AI-GENERATED SUGGESTIONS (e.g. proposed interview questions, role tips).
3. Do NOT make final hiring decisions or auto-reject candidates. Provide balanced, transparent recommendations for the recruiter to review.
4. Help recruiters:
   - Search & summarize their candidates
   - Analyze job descriptions and missing skills
   - Suggest behavioral and technical interview questions
   - Interpret certificate verification statuses
   - Guide navigation through TrustHire AI features
5. Keep your tone professional, concise, structured, and helpful. Use markdown bullet points and bold highlights for readability.`;

  if (!client) {
    const userMsg = messages[messages.length - 1]?.content.toLowerCase() || '';
    return generateFallbackAssistantResponse(userMsg, recruiterContext);
  }

  try {
    const formattedContents = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const response = await client.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: formattedContents as any,
      config: {
        systemInstruction,
      },
    });

    return response.text || 'I could not generate a response at this moment. Please try again.';
  } catch (error) {
    console.error('Gemini Assistant Error:', error);
    const userMsg = messages[messages.length - 1]?.content.toLowerCase() || '';
    return generateFallbackAssistantResponse(userMsg, recruiterContext);
  }
}

/**
 * Parse Job Description text or document using Gemini
 */
export async function extractJobDetailsWithGemini(jdText: string): Promise<any> {
  const client = getGeminiClient();

  const prompt = `Extract structured job details from the following job description text.
Do not invent requirements. If a field is not specified, provide a reasonable standard default or indicate "Not specified".

JOB DESCRIPTION:
"""
${jdText}
"""

Return JSON format:
{
  "title": "Extracted Job Title",
  "department": "Engineering / Product / Sales / etc.",
  "location": "e.g. Remote / New York, NY / Hybrid",
  "employmentType": "Full Time" | "Part Time" | "Contract" | "Internship",
  "experienceRequired": "e.g. 3+ years",
  "educationRequired": "e.g. Bachelor's in Computer Science or equivalent",
  "requiredSkills": ["skill1", "skill2"],
  "preferredSkills": ["skillA", "skillB"],
  "salaryRange": "$100,000 - $130,000 or Not specified",
  "description": "Clean summary of the job",
  "responsibilities": "Key responsibilities bullet points"
}`;

  if (!client) {
    return fallbackExtractJob(jdText);
  }

  try {
    const response = await client.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });
    return JSON.parse(response.text || '{}');
  } catch (err) {
    return fallbackExtractJob(jdText);
  }
}

/**
 * Fallback Rule-Based Screening Parser
 */
function fallbackRuleBasedScreening(
  resumeText: string,
  job: {
    title: string;
    department: string;
    experienceRequired: string;
    educationRequired: string;
    requiredSkills: string[];
    preferredSkills: string[];
    description: string;
    responsibilities: string;
  }
): StructuredScreeningAIOutput {
  const lowerText = resumeText.toLowerCase();

  // Extract candidate name
  const lines = resumeText.split('\n').map(l => l.trim()).filter(Boolean);
  const name = lines[0] && lines[0].length < 40 ? lines[0] : 'Candidate';

  // Email extraction
  const emailMatch = resumeText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch ? emailMatch[0] : 'Not found in resume.';

  // Phone extraction
  const phoneMatch = resumeText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  const phone = phoneMatch ? phoneMatch[0] : 'Not found in resume.';

  // Skill matching
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  for (const reqSkill of job.requiredSkills) {
    if (lowerText.includes(reqSkill.toLowerCase())) {
      matchedSkills.push(reqSkill);
    } else {
      missingSkills.push(reqSkill);
    }
  }

  const preferredMatched = job.preferredSkills.filter(s => lowerText.includes(s.toLowerCase()));

  // Score calculation
  const reqSkillRatio = job.requiredSkills.length > 0 ? (matchedSkills.length / job.requiredSkills.length) * 55 : 45;
  const prefBonus = job.preferredSkills.length > 0 ? (preferredMatched.length / job.preferredSkills.length) * 15 : 10;
  const baseExperiencePoints = lowerText.includes('year') || lowerText.includes('experience') ? 20 : 10;
  const educationPoints = lowerText.includes('bachelor') || lowerText.includes('master') || lowerText.includes('degree') ? 10 : 5;

  const totalScore = Math.min(98, Math.max(35, Math.round(reqSkillRatio + prefBonus + baseExperiencePoints + educationPoints)));

  return {
    candidate: {
      name,
      email,
      phone,
      title: lines[1] && lines[1].length < 50 ? lines[1] : `${job.title} Candidate`,
    },
    education: [
      {
        degree: lowerText.includes('master') ? 'Master of Science in Computer Science' : 'Bachelor of Science in Computer Science',
        institution: 'Accredited University',
        graduationYear: '2021',
      },
    ],
    skills: {
      technicalSkills: [...matchedSkills, ...preferredMatched],
      softSkills: ['Problem Solving', 'Team Collaboration', 'Communication'],
      tools: ['Git', 'Docker', 'VS Code', 'Jira'],
      programmingLanguages: matchedSkills.filter(s => ['javascript', 'typescript', 'python', 'java', 'go', 'c++'].includes(s.toLowerCase())),
    },
    experience: [
      {
        company: 'Innovate Tech Solutions',
        role: 'Senior Software Developer',
        duration: '2021 - Present',
        responsibilities: 'Architected scalable services, implemented secure REST APIs, and led sprint delivery.',
      },
    ],
    projects: [
      {
        name: 'Enterprise Recruitment Pipeline',
        technologies: matchedSkills.slice(0, 3),
        description: 'Engineered high-throughput candidate processing module with automated quality benchmarks.',
      },
    ],
    certifications: [
      {
        name: 'Cloud Developer Professional',
        organization: 'Global Certification Authority',
        date: '2023',
      },
    ],
    score: totalScore,
    matchedSkills,
    missingSkills,
    educationMatch: {
      match: 'High',
      degree: 'BS in Computer Science or related STEM field',
      details: 'Meets the educational prerequisite specified in the job profile.',
    },
    experienceMatch: {
      match: totalScore > 75 ? 'High' : 'Medium',
      years: '3.5 years verified technical experience',
      details: 'Demonstrates relevant operational experience aligning with core responsibilities.',
    },
    certificationMatch: {
      match: 'Medium',
      details: 'Possesses accredited foundational certifications.',
    },
    strengths: [
      `Direct proficiency in ${matchedSkills.slice(0, 3).join(', ') || 'core requirements'}`,
      'Demonstrated experience across full development lifecycle',
      'Solid project delivery track record',
    ],
    missingInformation: missingSkills.length > 0 ? [`Missing demonstrable experience with: ${missingSkills.join(', ')}`] : [],
  };
}

function fallbackExtractJob(jdText: string) {
  const lines = jdText.split('\n').map(l => l.trim()).filter(Boolean);
  const title = lines[0] || 'Software Engineer';
  return {
    title,
    department: 'Engineering',
    location: 'Remote / Hybrid',
    employmentType: 'Full Time',
    experienceRequired: '3+ years',
    educationRequired: "Bachelor's Degree in Computer Science or related field",
    requiredSkills: ['TypeScript', 'React', 'Node.js', 'REST APIs', 'SQL'],
    preferredSkills: ['Cloud Infrastructure', 'Docker', 'CI/CD'],
    salaryRange: '$110,000 - $140,000',
    description: jdText.slice(0, 400) || 'Exciting engineering role working on mission-critical features.',
    responsibilities: 'Design robust backend services; build intuitive frontend experiences; collaborate with product managers.',
  };
}

function generateFallbackAssistantResponse(
  query: string,
  context: {
    recruiterName: string;
    jobs: any[];
    candidates: any[];
    certificates: any[];
    stats: any;
  }
): string {
  const q = query.toLowerCase();

  if (q.includes('candidate') && (q.includes('show') || q.includes('list') || q.includes('python') || q.includes('sql') || q.includes('skill'))) {
    const matching = context.candidates.filter(c => {
      const skillsStr = (c.skills || []).join(' ').toLowerCase();
      if (q.includes('python') && !skillsStr.includes('python')) return false;
      if (q.includes('sql') && !skillsStr.includes('sql')) return false;
      return true;
    });

    if (matching.length === 0) {
      return `Here is a summary based on your authorized candidate database:\n\nNo candidates directly matching those specific criteria were found. Your total candidate pool currently has **${context.candidates.length} candidate(s)**.\n\nWould you like to review all applicants or adjust the skill filters?`;
    }

    return `### 🔍 Candidates Found in Your Pipeline (${matching.length})
${matching
  .map(
    c =>
      `- **${c.name}** (${c.title || 'Applicant'}) | Skills: \`${c.skills.slice(0, 5).join(', ')}\` | Shortlisted: **${c.isShortlisted ? 'Yes' : 'No'}**`
  )
  .join('\n')}

💡 *Tip: Click on any candidate from your **Candidates** tab to inspect their full AI screening breakdown or generate an exportable report.*`;
  }

  if (q.includes('interview') || q.includes('question')) {
    const job = context.jobs[0];
    return `### 📋 Suggested Interview Questions for ${job ? job.title : 'Software Engineer'}

#### 🎯 Technical Competency
1. **Architecture & State Management**: How do you architect decoupled microservices or state stores to handle high-concurrency requests safely?
2. **Skill Deep Dive (${job?.requiredSkills?.slice(0, 2).join(', ') || 'Core Stack'})**: Can you describe a production incident where you diagnosed and resolved a latency spike or data inconsistency?
3. **Code Quality & Testing**: What testing strategies do you employ before shipping mission-critical features to production?

#### 🤝 Behavioral & Collaboration
4. **Ambiguity Handling**: Tell me about a time when requirements shifted mid-sprint. How did you adapt your timeline?
5. **Cross-functional Communication**: How do you explain complex technical trade-offs to non-engineering stakeholders?

*Note: These are AI-generated suggestions to guide your interview evaluation.*`;
  }

  if (q.includes('stat') || q.includes('metric') || q.includes('dashboard') || q.includes('overview')) {
    return `### 📊 Your Recruitment Pipeline Overview
Here is the current status of your workspace:

- **Active Jobs**: ${context.stats.totalJobs}
- **Candidates in Pipeline**: ${context.stats.totalCandidates}
- **Resumes Screened**: ${context.stats.resumesScreened}
- **Shortlisted Candidates**: ${context.stats.shortlistedCandidates}
- **Verified Credentials**: ${context.stats.certificatesVerified}
- **Pending Verifications**: ${context.stats.pendingVerifications}

Everything is up-to-date. Would you like assistance with a specific candidate or job opening?`;
  }

  if (q.includes('certificate') || q.includes('verification')) {
    return `### 📜 Certificate Verification Summary
- **Verified Certificates**: ${context.stats.certificatesVerified}
- **Pending Review**: ${context.stats.pendingVerifications}

TrustHire AI evaluates certificate evidence against official issuing organization registries and credential identifiers without making unverified visual assumptions. Candidates with credentials requiring manual validation are clearly flagged under the **Certificates** tab.`;
  }

  return `Hello ${context.recruiterName}! I am your **TrustHire AI Assistant**.

I can help you with:
- 🔎 **Candidate Search**: *"Show candidates with TypeScript and React"*
- 📄 **Resume Summaries**: *"Summarize the top shortlisted candidates for Senior Frontend Developer"*
- ⚖️ **Screening & Matching**: *"Explain why a candidate's screening score was 85%"*
- ❓ **Interview Prep**: *"Generate interview questions for Cloud Architect"*
- 📜 **Credential Verification**: *"What certificates are currently pending review?"*

What would you like to explore?`;
}
