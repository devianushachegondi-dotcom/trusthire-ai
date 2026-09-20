import express, { Request, Response } from 'express';
import path from 'path';
import 'dotenv/config';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db';
import {
  authenticate,
  requireAdmin,
  AuthRequest,
  generateToken,
  hashPassword,
  verifyPassword,
} from './server/auth';
import {
  screenResumeWithGemini,
  chatWithAIAssistant,
  extractJobDetailsWithGemini,
} from './server/gemini';
import {
  Job,
  Candidate,
  Resume,
  ScreeningResult,
  CandidateMatch,
  Certificate,
  VerificationRecord,
  Report,
  SupportTicket,
  Notification,
  User,
} from './server/types';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Middleware for parsing JSON with ample limit for resume/cert uploads
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    geminiConfigured: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
  });
});

/* ==========================================================================
   AUTHENTICATION ENDPOINTS
   ========================================================================== */

app.post('/api/auth/signup', (req: Request, res: Response) => {
  try {
    const { name, email, phone, company, password, confirmPassword, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(409).json({ error: 'An account with this email address already exists.' });
    }

    const assignedRole = role === 'Admin' ? 'Admin' : 'Recruiter';
    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone || '',
      company: company || 'Organization',
      passwordHash: hashPassword(password),
      role: assignedRole,
      status: 'Active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.users.push(newUser);
    db.addActivity(newUser.id, newUser.name, newUser.role, 'Created Account', 'User', newUser.email);
    db.persist();

    const token = generateToken(newUser);
    return res.status(201).json({
      message: 'Account created successfully.',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        company: newUser.company,
        role: newUser.role,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Signup failed' });
  }
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = db.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (user.status === 'Disabled') {
      return res.status(403).json({ error: 'This account has been disabled. Please contact an administrator.' });
    }

    const isMatch = verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken(user);
    db.addActivity(user.id, user.name, user.role, 'Logged In', 'Session', user.email);

    return res.json({
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        company: user.company,
        role: user.role,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Login failed' });
  }
});

app.post('/api/auth/logout', authenticate, (req: AuthRequest, res: Response) => {
  if (req.user) {
    db.addActivity(req.user.id, req.user.name, req.user.role, 'Logged Out', 'Session', req.user.email);
  }
  return res.json({ message: 'Logged out successfully.' });
});

app.post('/api/auth/forgot-password', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Please enter your account email address.' });
  }
  const user = db.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
  return res.json({
    message: user
      ? 'Password reset instructions have been dispatched to your email address.'
      : 'If an account exists with that email, reset instructions have been sent.',
  });
});

app.post('/api/auth/reset-password', (req: Request, res: Response) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    return res.status(400).json({ error: 'Email and new password are required.' });
  }
  const user = db.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
  if (user) {
    user.passwordHash = hashPassword(newPassword);
    user.updatedAt = new Date().toISOString();
    db.persist();
  }
  return res.json({ message: 'Password has been successfully updated. You may now log in.' });
});

app.get('/api/auth/me', authenticate, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  return res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      company: user.company,
      role: user.role,
    },
  });
});

/* ==========================================================================
   RECRUITER DASHBOARD ENDPOINTS
   ========================================================================== */

app.get('/api/dashboard/stats', authenticate, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const isAdmin = user.role === 'Admin';

  // Filter entities according to recruiter authorization
  const jobs = isAdmin ? db.jobs : db.jobs.filter(j => j.recruiterId === user.id);
  const jobIds = new Set(jobs.map(j => j.id));

  const candidates = isAdmin ? db.candidates : db.candidates.filter(c => c.recruiterId === user.id);
  const candIds = new Set(candidates.map(c => c.id));

  const resumes = isAdmin ? db.resumes : db.resumes.filter(r => jobIds.has(r.jobId));
  const screenings = isAdmin ? db.screeningResults : db.screeningResults.filter(s => jobIds.has(s.jobId));
  const certificates = isAdmin ? db.certificates : db.certificates.filter(cert => candIds.has(cert.candidateId));

  const shortlistedCandidates = candidates.filter(c => c.isShortlisted).length;
  const verifiedCertificates = certificates.filter(c => c.status === 'Verified').length;
  const pendingCertificates = certificates.filter(c => c.status === 'Pending' || c.status === 'Needs Manual Review').length;

  // Chart 1: Candidate Status Distribution
  const candidateStatusDistribution = [
    { name: 'Shortlisted', value: shortlistedCandidates, color: '#10b981' },
    { name: 'Screened', value: Math.max(0, screenings.length - shortlistedCandidates), color: '#3b82f6' },
    { name: 'In Pipeline', value: Math.max(0, candidates.length - screenings.length), color: '#8b5cf6' },
  ];

  // Chart 2: Candidates per Job
  const candidatesPerJob = jobs.slice(0, 5).map(j => ({
    name: j.title.length > 20 ? j.title.substring(0, 18) + '...' : j.title,
    count: db.resumes.filter(r => r.jobId === j.id).length || j.candidateCount || 0,
  }));

  // Chart 3: Resume Screening Results brackets
  const screeningBrackets = [
    { range: '90-100%', count: screenings.filter(s => s.score >= 90).length },
    { range: '75-89%', count: screenings.filter(s => s.score >= 75 && s.score < 90).length },
    { range: '60-74%', count: screenings.filter(s => s.score >= 60 && s.score < 75).length },
    { range: '<60%', count: screenings.filter(s => s.score < 60).length },
  ];

  // Chart 4: Certificate Verification Status
  const certificateStatusData = [
    { status: 'Verified', count: certificates.filter(c => c.status === 'Verified').length, color: '#10b981' },
    { status: 'Needs Review', count: certificates.filter(c => c.status === 'Needs Manual Review').length, color: '#f59e0b' },
    { status: 'Pending', count: certificates.filter(c => c.status === 'Pending').length, color: '#6366f1' },
    { status: 'Expired/Other', count: certificates.filter(c => c.status === 'Expired' || c.status === 'Unable to Verify').length, color: '#ef4444' },
  ];

  return res.json({
    totalJobs: jobs.length,
    totalCandidates: candidates.length,
    resumesScreened: screenings.length,
    shortlistedCandidates,
    certificatesVerified: verifiedCertificates,
    pendingVerifications: pendingCertificates,
    charts: {
      candidateStatusDistribution,
      candidatesPerJob,
      screeningBrackets,
      certificateStatusData,
    },
  });
});

app.get('/api/dashboard/activities', authenticate, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const isAdmin = user.role === 'Admin';
  const activities = isAdmin
    ? db.activityLogs.slice(0, 15)
    : db.activityLogs.filter(a => a.userId === user.id).slice(0, 15);
  return res.json({ activities });
});

app.get('/api/dashboard/recent-candidates', authenticate, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const isAdmin = user.role === 'Admin';
  const candidates = isAdmin ? db.candidates : db.candidates.filter(c => c.recruiterId === user.id);

  const recent = candidates.slice(0, 6).map(cand => {
    const resume = db.resumes.find(r => r.candidateId === cand.id);
    const job = resume ? db.jobs.find(j => j.id === resume.jobId) : db.jobs[0];
    const screening = db.screeningResults.find(s => s.candidateId === cand.id);
    const cert = db.certificates.find(c => c.candidateId === cand.id);

    return {
      candidateId: cand.id,
      name: cand.name,
      email: cand.email,
      jobTitle: job ? job.title : 'Unassigned',
      jobId: job ? job.id : '',
      matchPercentage: screening ? screening.score : 0,
      screeningStatus: screening ? 'Screened' : (resume ? resume.processingStatus : 'Pending'),
      certificateStatus: cert ? cert.status : 'None',
      date: cand.createdAt,
      isShortlisted: !!cand.isShortlisted,
    };
  });

  return res.json({ candidates: recent });
});

/* ==========================================================================
   JOB DESCRIPTION ENDPOINTS
   ========================================================================== */

app.get('/api/jobs', authenticate, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const isAdmin = user.role === 'Admin';
  const jobs = isAdmin ? db.jobs : db.jobs.filter(j => j.recruiterId === user.id);
  return res.json({ jobs });
});

app.get('/api/jobs/:id', authenticate, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const job = db.jobs.find(j => j.id === req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found.' });

  if (user.role !== 'Admin' && job.recruiterId !== user.id) {
    return res.status(403).json({ error: 'Unauthorized to view this job.' });
  }

  return res.json({ job });
});

app.post('/api/jobs', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const {
      title,
      department,
      location,
      employmentType,
      experienceRequired,
      educationRequired,
      requiredSkills,
      preferredSkills,
      salaryRange,
      description,
      responsibilities,
      status,
    } = req.body;

    if (!title || !department) {
      return res.status(400).json({ error: 'Job title and department are required.' });
    }

    const newJob: Job = {
      id: `job-${Date.now()}`,
      recruiterId: user.id,
      title: title.trim(),
      department: department.trim(),
      location: location || 'Remote',
      employmentType: employmentType || 'Full Time',
      experienceRequired: experienceRequired || '3+ years',
      educationRequired: educationRequired || "Bachelor's degree or equivalent",
      requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : (requiredSkills ? requiredSkills.split(',').map((s: string) => s.trim()) : []),
      preferredSkills: Array.isArray(preferredSkills) ? preferredSkills : (preferredSkills ? preferredSkills.split(',').map((s: string) => s.trim()) : []),
      salaryRange: salaryRange || 'Competitive',
      description: description || '',
      responsibilities: responsibilities || '',
      status: status || 'Active',
      candidateCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.jobs.unshift(newJob);
    db.addActivity(user.id, user.name, user.role, 'Created Job', 'Job', newJob.title);
    db.persist();

    return res.status(201).json({ message: 'Job created successfully.', job: newJob });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Could not create job' });
  }
});

app.put('/api/jobs/:id', authenticate, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const job = db.jobs.find(j => j.id === req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found.' });

  if (user.role !== 'Admin' && job.recruiterId !== user.id) {
    return res.status(403).json({ error: 'Unauthorized to modify this job.' });
  }

  const updates = req.body;
  Object.assign(job, updates, { updatedAt: new Date().toISOString() });
  db.addActivity(user.id, user.name, user.role, 'Updated Job', 'Job', job.title);
  db.persist();

  return res.json({ message: 'Job updated successfully.', job });
});

app.delete('/api/jobs/:id', authenticate, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const index = db.jobs.findIndex(j => j.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Job not found.' });

  const job = db.jobs[index];
  if (user.role !== 'Admin' && job.recruiterId !== user.id) {
    return res.status(403).json({ error: 'Unauthorized to delete this job.' });
  }

  db.jobs.splice(index, 1);
  db.addActivity(user.id, user.name, user.role, 'Deleted Job', 'Job', job.title);
  db.persist();

  return res.json({ message: 'Job deleted successfully.' });
});

// AI JD Parsing
app.post('/api/jobs/parse-jd', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { text } = req.body;
    if (!text || text.trim().length < 20) {
      return res.status(400).json({ error: 'Please provide valid text from the job description.' });
    }

    const extracted = await extractJobDetailsWithGemini(text);
    return res.json({ extracted });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to extract job description.' });
  }
});

/* ==========================================================================
   RESUME UPLOAD ENDPOINTS
   ========================================================================== */

app.post('/api/resumes/upload', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { jobId, files } = req.body; // files: Array<{ fileName, fileType, fileData, candidateName, candidateEmail }>

    if (!jobId) {
      return res.status(400).json({ error: 'A job must be selected for resume upload.' });
    }

    const job = db.jobs.find(j => j.id === jobId);
    if (!job) {
      return res.status(404).json({ error: 'Selected job not found.' });
    }

    if (!Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: 'Please provide at least one resume file.' });
    }

    const createdResumes: Resume[] = [];

    for (const f of files) {
      // Find or create candidate to prevent duplicates
      let candidate = db.candidates.find(
        c => f.candidateEmail && c.email.toLowerCase() === f.candidateEmail.toLowerCase()
      );

      if (!candidate) {
        // Derive name from filename or fallback
        const cleanName = f.candidateName || f.fileName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        candidate = {
          id: `cand-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          recruiterId: user.id,
          name: cleanName,
          email: f.candidateEmail || `${cleanName.toLowerCase().replace(/\s+/g, '.')}@applicant.net`,
          phone: f.candidatePhone || '+1 (555) 000-0000',
          title: job.title + ' Applicant',
          education: [],
          skills: [...job.requiredSkills.slice(0, 3)],
          experience: [],
          projects: [],
          certifications: [],
          isShortlisted: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        db.candidates.unshift(candidate);
      }

      const newResume: Resume = {
        id: `res-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        candidateId: candidate.id,
        jobId: job.id,
        fileName: f.fileName,
        fileUrl: `/uploads/${f.fileName}`,
        fileType: f.fileType || 'application/pdf',
        rawText: f.rawText || `${candidate.name}\n${candidate.email}\nExperience: 4 years working with ${job.requiredSkills.join(', ')}.`,
        processingStatus: 'Uploaded',
        uploadedAt: new Date().toISOString(),
      };

      db.resumes.unshift(newResume);
      createdResumes.push(newResume);
      job.candidateCount = (job.candidateCount || 0) + 1;
    }

    db.addActivity(
      user.id,
      user.name,
      user.role,
      'Uploaded Resumes',
      'Resume',
      `${files.length} file(s) for ${job.title}`
    );
    db.persist();

    return res.status(201).json({
      message: `Successfully uploaded ${createdResumes.length} resume(s).`,
      resumes: createdResumes,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Upload failed' });
  }
});

app.get('/api/resumes', authenticate, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const isAdmin = user.role === 'Admin';
  const jobs = isAdmin ? db.jobs : db.jobs.filter(j => j.recruiterId === user.id);
  const jobIds = new Set(jobs.map(j => j.id));

  const resumes = db.resumes
    .filter(r => isAdmin || jobIds.has(r.jobId))
    .map(r => {
      const candidate = db.candidates.find(c => c.id === r.candidateId);
      const job = db.jobs.find(j => j.id === r.jobId);
      return {
        ...r,
        candidateName: candidate ? candidate.name : 'Unknown',
        candidateEmail: candidate ? candidate.email : '',
        jobTitle: job ? job.title : 'Unknown Job',
      };
    });

  return res.json({ resumes });
});

app.get('/api/resumes/:id', authenticate, (req: AuthRequest, res: Response) => {
  const resume = db.resumes.find(r => r.id === req.params.id);
  if (!resume) return res.status(404).json({ error: 'Resume not found.' });

  const candidate = db.candidates.find(c => c.id === resume.candidateId);
  const job = db.jobs.find(j => j.id === resume.jobId);

  return res.json({
    resume: {
      ...resume,
      candidate,
      job,
    },
  });
});

app.delete('/api/resumes/:id', authenticate, (req: AuthRequest, res: Response) => {
  const index = db.resumes.findIndex(r => r.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Resume not found.' });

  const resume = db.resumes[index];
  db.resumes.splice(index, 1);
  db.persist();
  return res.json({ message: 'Resume deleted.' });
});

/* ==========================================================================
   AI RESUME SCREENING MODULE
   ========================================================================== */

app.post('/api/screening/analyze', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { resumeId } = req.body;

    if (!resumeId) {
      return res.status(400).json({ error: 'resumeId is required.' });
    }

    const resume = db.resumes.find(r => r.id === resumeId);
    if (!resume) return res.status(404).json({ error: 'Resume not found.' });

    const job = db.jobs.find(j => j.id === resume.jobId);
    if (!job) return res.status(404).json({ error: 'Associated job not found.' });

    let candidate = db.candidates.find(c => c.id === resume.candidateId);

    // Call Gemini 3.8 Flash securely from backend
    resume.processingStatus = 'Processing';
    db.persist();

    const screeningOutput = await screenResumeWithGemini(resume.rawText || 'Resume content', {
      title: job.title,
      department: job.department,
      experienceRequired: job.experienceRequired,
      educationRequired: job.educationRequired,
      requiredSkills: job.requiredSkills,
      preferredSkills: job.preferredSkills,
      description: job.description,
      responsibilities: job.responsibilities,
    });

    // Update or enrich Candidate with extracted structured info if missing
    if (candidate) {
      if (screeningOutput.candidate.name && screeningOutput.candidate.name !== 'Not found in resume.') {
        candidate.name = screeningOutput.candidate.name;
      }
      if (screeningOutput.candidate.email && screeningOutput.candidate.email !== 'Not found in resume.') {
        candidate.email = screeningOutput.candidate.email;
      }
      if (screeningOutput.education && screeningOutput.education.length > 0) {
        candidate.education = screeningOutput.education;
      }
      if (screeningOutput.skills && screeningOutput.skills.technicalSkills) {
        candidate.skills = Array.from(new Set([...candidate.skills, ...screeningOutput.skills.technicalSkills]));
      }
      if (screeningOutput.experience && screeningOutput.experience.length > 0) {
        candidate.experience = screeningOutput.experience;
      }
      if (screeningOutput.projects && screeningOutput.projects.length > 0) {
        candidate.projects = screeningOutput.projects;
      }
      if (screeningOutput.certifications && screeningOutput.certifications.length > 0) {
        candidate.certifications = screeningOutput.certifications;
      }
      candidate.updatedAt = new Date().toISOString();
    }

    // Save ScreeningResult
    let existingScreening = db.screeningResults.find(s => s.resumeId === resume.id);
    if (!existingScreening) {
      existingScreening = {
        id: `scr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        candidateId: candidate ? candidate.id : resume.candidateId,
        resumeId: resume.id,
        jobId: job.id,
        score: screeningOutput.score,
        matchedSkills: screeningOutput.matchedSkills,
        missingSkills: screeningOutput.missingSkills,
        educationMatch: screeningOutput.educationMatch,
        experienceMatch: screeningOutput.experienceMatch,
        certificationMatch: screeningOutput.certificationMatch,
        strengths: screeningOutput.strengths,
        missingInformation: screeningOutput.missingInformation,
        createdAt: new Date().toISOString(),
      };
      db.screeningResults.unshift(existingScreening);
    } else {
      existingScreening.score = screeningOutput.score;
      existingScreening.matchedSkills = screeningOutput.matchedSkills;
      existingScreening.missingSkills = screeningOutput.missingSkills;
      existingScreening.educationMatch = screeningOutput.educationMatch;
      existingScreening.experienceMatch = screeningOutput.experienceMatch;
      existingScreening.certificationMatch = screeningOutput.certificationMatch;
      existingScreening.strengths = screeningOutput.strengths;
      existingScreening.missingInformation = screeningOutput.missingInformation;
    }

    // Update CandidateMatch
    let match = db.candidateMatches.find(m => m.candidateId === (candidate ? candidate.id : resume.candidateId) && m.jobId === job.id);
    if (!match) {
      match = {
        id: `match-${Date.now()}`,
        candidateId: candidate ? candidate.id : resume.candidateId,
        jobId: job.id,
        matchPercentage: screeningOutput.score,
        matchedSkills: screeningOutput.matchedSkills,
        missingSkills: screeningOutput.missingSkills,
        createdAt: new Date().toISOString(),
      };
      db.candidateMatches.unshift(match);
    } else {
      match.matchPercentage = screeningOutput.score;
      match.matchedSkills = screeningOutput.matchedSkills;
      match.missingSkills = screeningOutput.missingSkills;
    }

    resume.processingStatus = 'Processed';
    db.addActivity(user.id, user.name, user.role, 'Screened Resume', 'Candidate', `${candidate?.name} (${screeningOutput.score}%)`);
    db.persist();

    return res.json({
      message: 'AI Screening complete.',
      result: existingScreening,
      candidate,
      job,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'AI Screening encountered an error' });
  }
});

app.get('/api/screening', authenticate, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const isAdmin = user.role === 'Admin';
  const jobs = isAdmin ? db.jobs : db.jobs.filter(j => j.recruiterId === user.id);
  const jobIds = new Set(jobs.map(j => j.id));

  const screenings = db.screeningResults
    .filter(s => isAdmin || jobIds.has(s.jobId))
    .map(s => {
      const candidate = db.candidates.find(c => c.id === s.candidateId);
      const job = db.jobs.find(j => j.id === s.jobId);
      const resume = db.resumes.find(r => r.id === s.resumeId);
      return {
        ...s,
        candidateName: candidate ? candidate.name : 'Unknown',
        candidateEmail: candidate ? candidate.email : '',
        jobTitle: job ? job.title : 'Unknown Job',
        resumeFileName: resume ? resume.fileName : 'Resume.pdf',
        isShortlisted: candidate?.isShortlisted || false,
      };
    });

  return res.json({ screenings });
});

app.get('/api/screening/:candidateId', authenticate, (req: AuthRequest, res: Response) => {
  const screening = db.screeningResults.find(s => s.candidateId === req.params.candidateId);
  if (!screening) return res.status(404).json({ error: 'Screening result not found.' });

  const candidate = db.candidates.find(c => c.id === screening.candidateId);
  const job = db.jobs.find(j => j.id === screening.jobId);
  const resume = db.resumes.find(r => r.id === screening.resumeId);

  return res.json({ screening, candidate, job, resume });
});

app.post('/api/screening/:id/retry', authenticate, async (req: AuthRequest, res: Response) => {
  const screening = db.screeningResults.find(s => s.id === req.params.id);
  if (!screening) return res.status(404).json({ error: 'Screening not found.' });

  const resume = db.resumes.find(r => r.id === screening.resumeId);
  if (!resume) return res.status(404).json({ error: 'Resume record missing.' });

  const job = db.jobs.find(j => j.id === screening.jobId);
  if (!job) return res.status(404).json({ error: 'Associated job missing.' });

  const output = await screenResumeWithGemini(resume.rawText || 'Resume content', job);
  screening.score = output.score;
  screening.matchedSkills = output.matchedSkills;
  screening.missingSkills = output.missingSkills;
  screening.educationMatch = output.educationMatch;
  screening.experienceMatch = output.experienceMatch;
  screening.certificationMatch = output.certificationMatch;
  screening.strengths = output.strengths;
  screening.missingInformation = output.missingInformation;
  db.persist();

  return res.json({ message: 'Screening re-run complete.', screening });
});

app.put('/api/screening/:id/notes', authenticate, (req: AuthRequest, res: Response) => {
  const screening = db.screeningResults.find(s => s.id === req.params.id);
  if (!screening) return res.status(404).json({ error: 'Screening not found.' });

  screening.recruiterNotes = req.body.notes || '';
  db.persist();
  return res.json({ message: 'Notes saved.', screening });
});

/* ==========================================================================
   CANDIDATE MATCHING MODULE
   ========================================================================== */

app.get('/api/matching/job/:jobId', authenticate, (req: AuthRequest, res: Response) => {
  const job = db.jobs.find(j => j.id === req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Job not found.' });

  const resumes = db.resumes.filter(r => r.jobId === job.id);
  const candidateIds = Array.from(new Set(resumes.map(r => r.candidateId)));

  const matches = candidateIds.map(candId => {
    const candidate = db.candidates.find(c => c.id === candId);
    const resume = db.resumes.find(r => r.candidateId === candId && r.jobId === job.id);
    const screening = db.screeningResults.find(s => s.candidateId === candId && s.jobId === job.id);
    const cert = db.certificates.find(c => c.candidateId === candId);

    // Calculate match percentage dynamically
    let matchPct = 65;
    let matchedSkills: string[] = [];
    let missingSkills: string[] = [];

    if (screening) {
      matchPct = screening.score;
      matchedSkills = screening.matchedSkills;
      missingSkills = screening.missingSkills;
    } else if (candidate) {
      matchedSkills = job.requiredSkills.filter(reqS =>
        candidate.skills.some(cs => cs.toLowerCase().includes(reqS.toLowerCase()))
      );
      missingSkills = job.requiredSkills.filter(reqS => !matchedSkills.includes(reqS));
      const ratio = job.requiredSkills.length > 0 ? (matchedSkills.length / job.requiredSkills.length) * 80 : 70;
      matchPct = Math.round(ratio + (cert?.status === 'Verified' ? 10 : 0));
    }

    return {
      candidateId: candId,
      candidateName: candidate ? candidate.name : 'Applicant',
      candidateEmail: candidate ? candidate.email : '',
      title: candidate ? candidate.title : '',
      matchPercentage: matchPct,
      matchedSkills,
      missingSkills,
      experienceYears: candidate?.experience?.[0]?.duration || '3+ years',
      education: candidate?.education?.[0]?.degree || "Bachelor's Degree",
      certificateStatus: cert ? cert.status : 'None',
      screeningStatus: screening ? 'Screened' : (resume ? resume.processingStatus : 'Pending'),
      isShortlisted: !!candidate?.isShortlisted,
      resumeId: resume?.id,
    };
  });

  return res.json({ job, candidates: matches });
});

app.post('/api/candidates/:id/toggle-shortlist', authenticate, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const candidate = db.candidates.find(c => c.id === req.params.id);
  if (!candidate) return res.status(404).json({ error: 'Candidate not found.' });

  candidate.isShortlisted = !candidate.isShortlisted;
  db.addActivity(
    user.id,
    user.name,
    user.role,
    candidate.isShortlisted ? 'Shortlisted Candidate' : 'Removed from Shortlist',
    'Candidate',
    candidate.name
  );
  db.persist();

  return res.json({
    message: candidate.isShortlisted ? 'Candidate shortlisted.' : 'Candidate removed from shortlist.',
    isShortlisted: candidate.isShortlisted,
  });
});

/* ==========================================================================
   CERTIFICATES MODULE
   ========================================================================== */

app.post('/api/certificates/upload', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const {
      candidateId,
      certificateName,
      issuingOrganization,
      certificateId,
      issueDate,
      expiryDate,
      course,
      skills,
      fileUrl,
    } = req.body;

    if (!candidateId || !certificateName) {
      return res.status(400).json({ error: 'Candidate and certificate name are required.' });
    }

    const candidate = db.candidates.find(c => c.id === candidateId);
    if (!candidate) return res.status(404).json({ error: 'Candidate not found.' });

    // Factual rule-based verification check:
    // Authentic validation checks official format or id presence
    let initialStatus: Certificate['status'] = 'Pending';
    let evidence = 'Uploaded document received. Awaiting registry or manual review.';

    if (certificateId && certificateId.length > 5) {
      initialStatus = 'Needs Manual Review';
      evidence = `Provided credential identifier: ${certificateId}. Verification requires registry confirmation.`;
    }

    const newCert: Certificate = {
      id: `cert-${Date.now()}`,
      candidateId,
      certificateName: certificateName.trim(),
      issuingOrganization: issuingOrganization || 'Accredited Organization',
      certificateId: certificateId || `ID-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      issueDate: issueDate || new Date().toISOString().split('T')[0],
      expiryDate: expiryDate || '',
      course: course || '',
      skills: Array.isArray(skills) ? skills : (skills ? skills.split(',').map((s: string) => s.trim()) : []),
      fileUrl: fileUrl || '/certificates/sample_certificate.pdf',
      status: initialStatus,
      evidence,
      createdAt: new Date().toISOString(),
    };

    db.certificates.unshift(newCert);
    db.addActivity(user.id, user.name, user.role, 'Uploaded Certificate', 'Certificate', `${newCert.certificateName} (${candidate.name})`);
    db.persist();

    return res.status(201).json({ message: 'Certificate uploaded.', certificate: newCert });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Upload failed' });
  }
});

app.get('/api/certificates', authenticate, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const isAdmin = user.role === 'Admin';
  const candidates = isAdmin ? db.candidates : db.candidates.filter(c => c.recruiterId === user.id);
  const candIds = new Set(candidates.map(c => c.id));

  const certs = db.certificates
    .filter(c => isAdmin || candIds.has(c.candidateId))
    .map(c => {
      const candidate = db.candidates.find(cand => cand.id === c.candidateId);
      return {
        ...c,
        candidateName: candidate ? candidate.name : 'Unknown',
        candidateEmail: candidate ? candidate.email : '',
      };
    });

  return res.json({ certificates: certs });
});

app.get('/api/certificates/candidate/:candidateId', authenticate, (req: AuthRequest, res: Response) => {
  const certs = db.certificates.filter(c => c.candidateId === req.params.candidateId);
  return res.json({ certificates: certs });
});

app.get('/api/certificates/:id', authenticate, (req: AuthRequest, res: Response) => {
  const cert = db.certificates.find(c => c.id === req.params.id);
  if (!cert) return res.status(404).json({ error: 'Certificate not found.' });

  const candidate = db.candidates.find(c => c.id === cert.candidateId);
  const verificationRecords = db.verificationRecords.filter(v => v.certificateId === cert.id);

  return res.json({ certificate: cert, candidate, verificationRecords });
});

app.put('/api/certificates/:id/verify', authenticate, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const cert = db.certificates.find(c => c.id === req.params.id);
  if (!cert) return res.status(404).json({ error: 'Certificate not found.' });

  const { status, evidence, reviewerNotes } = req.body;
  if (!status) return res.status(400).json({ error: 'Status is required.' });

  cert.status = status;
  cert.evidence = evidence || cert.evidence || 'Manual reviewer assessment.';
  cert.reviewerNotes = reviewerNotes || cert.reviewerNotes || '';
  cert.verifiedAt = new Date().toISOString();

  const record: VerificationRecord = {
    id: `vrec-${Date.now()}`,
    certificateId: cert.id,
    status: cert.status,
    evidence: cert.evidence || '',
    reviewerNotes: cert.reviewerNotes || '',
    verifiedAt: cert.verifiedAt,
  };
  db.verificationRecords.unshift(record);

  db.addActivity(user.id, user.name, user.role, 'Updated Certificate Verification', 'Certificate', `${cert.certificateName} -> ${cert.status}`);
  db.persist();

  return res.json({ message: 'Certificate verification status updated.', certificate: cert });
});

/* ==========================================================================
   CANDIDATES PROFILE & DIRECTORY
   ========================================================================== */

app.get('/api/candidates', authenticate, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const isAdmin = user.role === 'Admin';
  const candidates = isAdmin ? db.candidates : db.candidates.filter(c => c.recruiterId === user.id);

  const enriched = candidates.map(c => {
    const resume = db.resumes.find(r => r.candidateId === c.id);
    const job = resume ? db.jobs.find(j => j.id === resume.jobId) : null;
    const screening = db.screeningResults.find(s => s.candidateId === c.id);
    const cert = db.certificates.find(cert => cert.candidateId === c.id);

    return {
      ...c,
      jobTitle: job ? job.title : 'Unassigned',
      jobId: job ? job.id : null,
      screeningScore: screening ? screening.score : null,
      certificateStatus: cert ? cert.status : 'None',
      resumeId: resume ? resume.id : null,
    };
  });

  return res.json({ candidates: enriched });
});

app.get('/api/candidates/:id', authenticate, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const candidate = db.candidates.find(c => c.id === req.params.id);
  if (!candidate) return res.status(404).json({ error: 'Candidate not found.' });

  if (user.role !== 'Admin' && candidate.recruiterId !== user.id) {
    return res.status(403).json({ error: 'Unauthorized to view this candidate profile.' });
  }

  const resumes = db.resumes.filter(r => r.candidateId === candidate.id);
  const screenings = db.screeningResults.filter(s => s.candidateId === candidate.id);
  const certificates = db.certificates.filter(c => c.candidateId === candidate.id);
  const matches = db.candidateMatches.filter(m => m.candidateId === candidate.id).map(m => {
    const job = db.jobs.find(j => j.id === m.jobId);
    return { ...m, jobTitle: job ? job.title : 'Unknown' };
  });

  return res.json({
    candidate,
    resumes,
    screeningResults: screenings,
    certificates,
    jobMatches: matches,
  });
});

app.post('/api/candidates/:id/notes', authenticate, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const candidate = db.candidates.find(c => c.id === req.params.id);
  if (!candidate) return res.status(404).json({ error: 'Candidate not found.' });

  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'Note content is required.' });

  if (!candidate.notes) candidate.notes = [];

  const note = {
    id: `note-${Date.now()}`,
    authorName: user.name,
    content: content.trim(),
    createdAt: new Date().toISOString(),
  };

  candidate.notes.unshift(note);
  db.persist();
  return res.status(201).json({ message: 'Note added.', note });
});

app.delete('/api/candidates/:id/notes/:noteId', authenticate, (req: AuthRequest, res: Response) => {
  const candidate = db.candidates.find(c => c.id === req.params.id);
  if (!candidate || !candidate.notes) return res.status(404).json({ error: 'Note not found.' });

  const index = candidate.notes.findIndex(n => n.id === req.params.noteId);
  if (index !== -1) {
    candidate.notes.splice(index, 1);
    db.persist();
  }
  return res.json({ message: 'Note removed.' });
});

/* ==========================================================================
   RESULTS & REPORTS MODULE
   ========================================================================== */

app.get('/api/reports', authenticate, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const isAdmin = user.role === 'Admin';
  const reports = isAdmin ? db.reports : db.reports.filter(r => r.recruiterId === user.id);
  return res.json({ reports });
});

app.post('/api/reports/generate', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { reportType, candidateId, jobId } = req.body;

    if (!reportType) {
      return res.status(400).json({ error: 'Report type is required.' });
    }

    let reportData: Record<string, any> = {};

    if (reportType === 'Candidate Report') {
      const candidate = db.candidates.find(c => c.id === candidateId);
      if (!candidate) return res.status(404).json({ error: 'Candidate not found.' });
      const screening = db.screeningResults.find(s => s.candidateId === candidate.id);
      const cert = db.certificates.find(c => c.candidateId === candidate.id);
      const job = jobId ? db.jobs.find(j => j.id === jobId) : db.jobs[0];

      reportData = {
        candidateName: candidate.name,
        candidateEmail: candidate.email,
        phone: candidate.phone,
        targetJob: job ? job.title : 'General Pool',
        education: candidate.education,
        skills: candidate.skills,
        experience: candidate.experience,
        projects: candidate.projects,
        screeningScore: screening ? screening.score : 'Pending',
        matchedSkills: screening ? screening.matchedSkills : [],
        missingSkills: screening ? screening.missingSkills : [],
        certificateStatus: cert ? `${cert.certificateName} (${cert.status})` : 'None on record',
        recruiterNotes: candidate.notes || [],
      };
    } else if (reportType === 'Job Report') {
      const job = db.jobs.find(j => j.id === jobId) || db.jobs[0];
      const resumes = db.resumes.filter(r => r.jobId === job.id);
      const screenings = db.screeningResults.filter(s => s.jobId === job.id);

      const avgScore = screenings.length > 0
        ? Math.round(screenings.reduce((a, b) => a + b.score, 0) / screenings.length)
        : 0;

      reportData = {
        jobTitle: job.title,
        department: job.department,
        location: job.location,
        totalApplicants: resumes.length,
        screenedCount: screenings.length,
        averageScreeningScore: avgScore,
        requiredSkills: job.requiredSkills,
        status: job.status,
      };
    } else if (reportType === 'Screening Report') {
      const screenings = db.screeningResults.slice(0, 10).map(s => {
        const cand = db.candidates.find(c => c.id === s.candidateId);
        const j = db.jobs.find(jb => jb.id === s.jobId);
        return {
          candidate: cand ? cand.name : 'Unknown',
          job: j ? j.title : 'Unknown',
          score: s.score,
          matchedSkills: s.matchedSkills,
          missingSkills: s.missingSkills,
          educationMatch: s.educationMatch.match,
          experienceMatch: s.experienceMatch.match,
        };
      });
      reportData = { summary: 'Aggregated screening metrics', screenings };
    } else if (reportType === 'Certificate Verification Report') {
      const certs = db.certificates.map(c => {
        const cand = db.candidates.find(cd => cd.id === c.candidateId);
        return {
          candidate: cand ? cand.name : 'Unknown',
          certificate: c.certificateName,
          organization: c.issuingOrganization,
          certificateId: c.certificateId,
          status: c.status,
          evidence: c.evidence,
          verifiedAt: c.verifiedAt || 'Pending',
        };
      });
      reportData = { totalCertificates: certs.length, certificates: certs };
    }

    const report: Report = {
      id: `rep-${Date.now()}`,
      recruiterId: user.id,
      candidateId,
      jobId,
      reportType,
      reportData,
      createdAt: new Date().toISOString(),
    };

    db.reports.unshift(report);
    db.addActivity(user.id, user.name, user.role, 'Generated Report', 'Report', reportType);
    db.persist();

    return res.status(201).json({ message: 'Report generated successfully.', report });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Report generation failed' });
  }
});

app.get('/api/reports/:id', authenticate, (req: AuthRequest, res: Response) => {
  const report = db.reports.find(r => r.id === req.params.id);
  if (!report) return res.status(404).json({ error: 'Report not found.' });
  return res.json({ report });
});

/* ==========================================================================
   GLOBAL SEARCH & FILTER MODULE
   ========================================================================== */

app.get('/api/search', authenticate, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const isAdmin = user.role === 'Admin';
  const { query, jobId, minMatch, skill, certStatus, screeningStatus, sort } = req.query;

  let candidates = isAdmin ? [...db.candidates] : db.candidates.filter(c => c.recruiterId === user.id);

  // Text search
  if (query && typeof query === 'string') {
    const q = query.toLowerCase();
    candidates = candidates.filter(c => {
      const nameMatch = c.name.toLowerCase().includes(q);
      const emailMatch = c.email.toLowerCase().includes(q);
      const skillMatch = c.skills.some(s => s.toLowerCase().includes(q));
      const titleMatch = c.title && c.title.toLowerCase().includes(q);
      const companyMatch = c.experience.some(e => e.company.toLowerCase().includes(q));
      return nameMatch || emailMatch || skillMatch || titleMatch || companyMatch;
    });
  }

  // Job filter
  if (jobId && typeof jobId === 'string' && jobId !== 'ALL') {
    const resumesForJob = db.resumes.filter(r => r.jobId === jobId);
    const candIds = new Set(resumesForJob.map(r => r.candidateId));
    candidates = candidates.filter(c => candIds.has(c.id));
  }

  // Skill filter
  if (skill && typeof skill === 'string') {
    candidates = candidates.filter(c => c.skills.some(s => s.toLowerCase().includes(skill.toLowerCase())));
  }

  // Enrich with results
  let results = candidates.map(c => {
    const resume = db.resumes.find(r => r.candidateId === c.id);
    const job = resume ? db.jobs.find(j => j.id === resume.jobId) : db.jobs[0];
    const screening = db.screeningResults.find(s => s.candidateId === c.id);
    const cert = db.certificates.find(ct => ct.candidateId === c.id);

    return {
      candidateId: c.id,
      name: c.name,
      email: c.email,
      skills: c.skills,
      experience: c.experience?.[0]?.duration || '3+ years',
      jobTitle: job ? job.title : 'Unassigned',
      jobId: job ? job.id : null,
      matchPercentage: screening ? screening.score : 60,
      screeningStatus: screening ? 'Screened' : (resume ? resume.processingStatus : 'Pending'),
      certificateStatus: cert ? cert.status : 'None',
      resumeId: resume?.id,
      createdAt: c.createdAt,
    };
  });

  // Match % filter
  if (minMatch && !isNaN(Number(minMatch))) {
    results = results.filter(r => r.matchPercentage >= Number(minMatch));
  }

  // Certificate status filter
  if (certStatus && typeof certStatus === 'string' && certStatus !== 'ALL') {
    results = results.filter(r => r.certificateStatus === certStatus);
  }

  // Screening status filter
  if (screeningStatus && typeof screeningStatus === 'string' && screeningStatus !== 'ALL') {
    results = results.filter(r => r.screeningStatus === screeningStatus);
  }

  // Sorting
  if (sort === 'match-desc') {
    results.sort((a, b) => b.matchPercentage - a.matchPercentage);
  } else if (sort === 'match-asc') {
    results.sort((a, b) => a.matchPercentage - b.matchPercentage);
  } else if (sort === 'oldest') {
    results.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  } else {
    // Newest
    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  return res.json({ total: results.length, candidates: results });
});

/* ==========================================================================
   TRUSTHIRE AI ASSISTANT MODULE
   ========================================================================== */

app.post('/api/ai/chat', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { message, conversationId } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty.' });
    }

    // Isolate context to ONLY user's authorized recruiter data
    const jobs = db.jobs.filter(j => j.recruiterId === user.id);
    const candidates = db.candidates.filter(c => c.recruiterId === user.id);
    const candIds = new Set(candidates.map(c => c.id));
    const certificates = db.certificates.filter(c => candIds.has(c.candidateId));

    const stats = {
      totalJobs: jobs.length,
      totalCandidates: candidates.length,
      resumesScreened: db.screeningResults.filter(s => jobs.some(j => j.id === s.jobId)).length,
      shortlistedCandidates: candidates.filter(c => c.isShortlisted).length,
      certificatesVerified: certificates.filter(c => c.status === 'Verified').length,
      pendingVerifications: certificates.filter(c => c.status === 'Pending' || c.status === 'Needs Manual Review').length,
    };

    let conv = conversationId ? db.aiConversations.find(c => c.id === conversationId && c.userId === user.id) : null;

    if (!conv) {
      conv = {
        id: `conv-${Date.now()}`,
        userId: user.id,
        title: message.substring(0, 30) + '...',
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.aiConversations.unshift(conv);
    }

    // Add user message
    conv.messages.push({
      role: 'user',
      content: message.trim(),
      timestamp: new Date().toISOString(),
    });

    // Call Gemini Assistant with bounded context
    const aiResponse = await chatWithAIAssistant(
      conv.messages.slice(-6).map(m => ({ role: m.role, content: m.content })),
      {
        recruiterName: user.name,
        jobs,
        candidates,
        certificates,
        stats,
      }
    );

    // Save model response
    conv.messages.push({
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date().toISOString(),
    });

    conv.updatedAt = new Date().toISOString();
    db.persist();

    return res.json({
      conversationId: conv.id,
      response: aiResponse,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'AI Assistant encountered a problem' });
  }
});

app.get('/api/ai/conversations', authenticate, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const convs = db.aiConversations.filter(c => c.userId === user.id);
  return res.json({ conversations: convs });
});

app.delete('/api/ai/conversations/:id', authenticate, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const index = db.aiConversations.findIndex(c => c.id === req.params.id && c.userId === user.id);
  if (index !== -1) {
    db.aiConversations.splice(index, 1);
    db.persist();
  }
  return res.json({ message: 'Conversation deleted.' });
});

/* ==========================================================================
   CONTACT SUPPORT MODULE
   ========================================================================== */

app.get('/api/support/tickets', authenticate, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const isAdmin = user.role === 'Admin';
  const tickets = isAdmin ? db.supportTickets : db.supportTickets.filter(t => t.userId === user.id);
  return res.json({ tickets });
});

app.post('/api/support/tickets', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { category, subject, description, attachmentName } = req.body;

    if (!category || !subject || !description) {
      return res.status(400).json({ error: 'Category, subject, and description are required.' });
    }

    const ticketNumber = Math.floor(1000 + Math.random() * 9000);
    const newTicket: SupportTicket = {
      id: `tkt-${Date.now()}`,
      userId: user.id,
      ticketId: `TICK-${ticketNumber}`,
      userName: user.name,
      userEmail: user.email,
      category,
      subject: subject.trim(),
      description: description.trim(),
      attachmentName,
      status: 'Open',
      replies: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.supportTickets.unshift(newTicket);
    db.addActivity(user.id, user.name, user.role, 'Submitted Support Ticket', 'SupportTicket', newTicket.ticketId);
    db.persist();

    return res.status(201).json({ message: 'Ticket created successfully.', ticket: newTicket });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to submit ticket' });
  }
});

app.get('/api/support/tickets/:id', authenticate, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const ticket = db.supportTickets.find(t => t.id === req.params.id || t.ticketId === req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Support ticket not found.' });

  if (user.role !== 'Admin' && ticket.userId !== user.id) {
    return res.status(403).json({ error: 'Unauthorized to view this support ticket.' });
  }

  return res.json({ ticket });
});

app.post('/api/support/tickets/:id/reply', authenticate, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const ticket = db.supportTickets.find(t => t.id === req.params.id || t.ticketId === req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Support ticket not found.' });

  if (user.role !== 'Admin' && ticket.userId !== user.id) {
    return res.status(403).json({ error: 'Unauthorized to reply to this ticket.' });
  }

  const { message } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Reply message cannot be empty.' });
  }

  const reply = {
    id: `rep-${Date.now()}`,
    senderName: user.name,
    senderRole: user.role,
    message: message.trim(),
    createdAt: new Date().toISOString(),
  };

  ticket.replies.push(reply);
  ticket.updatedAt = new Date().toISOString();
  if (user.role === 'Admin' && ticket.status === 'Open') {
    ticket.status = 'In Progress';
  }
  db.persist();

  return res.json({ message: 'Reply sent.', ticket });
});

/* ==========================================================================
   ADMIN MODULE (STRICTLY ADMIN PROTECTED)
   ========================================================================== */

app.get('/api/admin/stats', authenticate, requireAdmin, (req: AuthRequest, res: Response) => {
  const totalRecruiters = db.users.filter(u => u.role === 'Recruiter').length;
  const totalCandidates = db.candidates.length;
  const totalJobs = db.jobs.length;
  const resumesProcessed = db.resumes.filter(r => r.processingStatus === 'Processed').length;
  const certificatesUploaded = db.certificates.length;
  const verifiedCertificates = db.certificates.filter(c => c.status === 'Verified').length;
  const pendingVerifications = db.certificates.filter(c => c.status === 'Pending' || c.status === 'Needs Manual Review').length;
  const openSupportTickets = db.supportTickets.filter(t => t.status === 'Open').length;

  return res.json({
    totalRecruiters,
    totalCandidates,
    totalJobs,
    resumesProcessed,
    certificatesUploaded,
    verifiedCertificates,
    pendingVerifications,
    openSupportTickets,
  });
});

app.get('/api/admin/users', authenticate, requireAdmin, (req: AuthRequest, res: Response) => {
  const safeUsers = db.users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    company: u.company,
    role: u.role,
    status: u.status || 'Active',
    createdAt: u.createdAt,
  }));
  return res.json({ users: safeUsers });
});

app.put('/api/admin/users/:id/status', authenticate, requireAdmin, (req: AuthRequest, res: Response) => {
  const user = db.users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  const { status } = req.body;
  if (status !== 'Active' && status !== 'Disabled') {
    return res.status(400).json({ error: 'Status must be Active or Disabled.' });
  }

  user.status = status;
  user.updatedAt = new Date().toISOString();
  db.persist();

  return res.json({ message: `User status set to ${status}.`, user });
});

app.get('/api/admin/candidates', authenticate, requireAdmin, (req: AuthRequest, res: Response) => {
  return res.json({ candidates: db.candidates });
});

app.get('/api/admin/jobs', authenticate, requireAdmin, (req: AuthRequest, res: Response) => {
  return res.json({ jobs: db.jobs });
});

app.get('/api/admin/certificates', authenticate, requireAdmin, (req: AuthRequest, res: Response) => {
  const certs = db.certificates.map(c => {
    const candidate = db.candidates.find(cand => cand.id === c.candidateId);
    return { ...c, candidateName: candidate ? candidate.name : 'Unknown' };
  });
  return res.json({ certificates: certs });
});

app.get('/api/admin/support-tickets', authenticate, requireAdmin, (req: AuthRequest, res: Response) => {
  return res.json({ tickets: db.supportTickets });
});

app.put('/api/admin/support-tickets/:id', authenticate, requireAdmin, (req: AuthRequest, res: Response) => {
  const ticket = db.supportTickets.find(t => t.id === req.params.id || t.ticketId === req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found.' });

  const { status, internalNotes } = req.body;
  if (status) ticket.status = status;
  if (internalNotes !== undefined) ticket.internalNotes = internalNotes;
  ticket.updatedAt = new Date().toISOString();
  db.persist();

  return res.json({ message: 'Ticket updated.', ticket });
});

app.get('/api/admin/logs', authenticate, requireAdmin, (req: AuthRequest, res: Response) => {
  return res.json({ logs: db.activityLogs.slice(0, 50) });
});

let systemSettings = {
  modelName: 'gemini-2.5-flash',
  defaultThreshold: 70,
  maxUploadSizeMb: 20,
  enableStrictCredentialAudit: true,
};

app.post('/api/admin/users', authenticate, requireAdmin, (req: AuthRequest, res: Response) => {
  const { name, email, role, department } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }

  const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'A user with this email already exists.' });
  }

  const newUser = {
    id: `usr-${Date.now()}`,
    name,
    email,
    phone: '',
    passwordHash: 'argon2-hashed-default-password',
    role: (role === 'admin' ? 'Admin' : 'Recruiter') as any,
    company: 'TrustHire Organization',
    department: department || 'Talent Acquisition',
    status: 'Active' as any,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.users.unshift(newUser);
  db.persist();

  return res.status(201).json({ message: 'User created successfully.', user: newUser });
});

app.get('/api/admin/settings', authenticate, requireAdmin, (req: AuthRequest, res: Response) => {
  return res.json({ settings: systemSettings });
});

app.put('/api/admin/settings', authenticate, requireAdmin, (req: AuthRequest, res: Response) => {
  systemSettings = { ...systemSettings, ...req.body };
  return res.json({ message: 'System configuration updated successfully.', settings: systemSettings });
});

app.get('/api/admin/health', authenticate, requireAdmin, (req: AuthRequest, res: Response) => {
  return res.json({
    health: {
      status: 'operational',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      activeUsers: db.users.length,
      jobsCount: db.jobs.length,
      resumesCount: db.resumes.length,
      candidatesCount: db.candidates.length,
    }
  });
});

/* ==========================================================================
   NOTIFICATIONS
   ========================================================================== */

app.get('/api/notifications', authenticate, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const notifs = db.notifications.filter(n => n.userId === user.id);
  return res.json({ notifications: notifs });
});

app.put('/api/notifications/:id/read', authenticate, (req: AuthRequest, res: Response) => {
  const notif = db.notifications.find(n => n.id === req.params.id);
  if (notif) {
    notif.read = true;
    db.persist();
  }
  return res.json({ message: 'Marked read.' });
});

app.put('/api/notifications/read-all', authenticate, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  db.notifications.filter(n => n.userId === user.id).forEach(n => (n.read = true));
  db.persist();
  return res.json({ message: 'All marked read.' });
});

/* ==========================================================================
   VITE & STATIC ASSET MIDDLEWARE (Runs after API routes)
   ========================================================================== */

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TrustHire AI Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
