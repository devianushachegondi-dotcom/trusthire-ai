export type UserRole = 'Recruiter' | 'Admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  role: UserRole;
  status?: 'Active' | 'Disabled';
}

export type EmploymentType = 'Full Time' | 'Part Time' | 'Contract' | 'Internship';
export type JobStatus = 'Draft' | 'Active' | 'Closed';

export interface Job {
  id: string;
  recruiterId: string;
  title: string;
  department: string;
  location: string;
  employmentType: EmploymentType;
  experienceRequired: string;
  educationRequired: string;
  requiredSkills: string[];
  preferredSkills: string[];
  salaryRange: string;
  description: string;
  responsibilities: string;
  status: JobStatus;
  candidateCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface EducationItem {
  degree: string;
  institution: string;
  graduationYear: string;
}

export interface ExperienceItem {
  company: string;
  role: string;
  duration: string;
  responsibilities: string;
}

export interface ProjectItem {
  name: string;
  technologies: string[];
  description: string;
}

export interface CertificationItem {
  name: string;
  organization: string;
  date: string;
}

export interface CandidateNote {
  id: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface Candidate {
  id: string;
  recruiterId: string;
  name: string;
  email: string;
  phone: string;
  title?: string;
  education: EducationItem[];
  skills: string[];
  experience: ExperienceItem[];
  projects: ProjectItem[];
  certifications: CertificationItem[];
  isShortlisted?: boolean;
  notes?: CandidateNote[];
  createdAt: string;
  updatedAt: string;
  // Enriched fields
  jobTitle?: string;
  jobId?: string | null;
  screeningScore?: number | null;
  certificateStatus?: string;
  resumeId?: string | null;
}

export type ProcessingStatus = 'Uploaded' | 'Processing' | 'Processed' | 'Failed';

export interface Resume {
  id: string;
  candidateId: string;
  jobId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  processingStatus: ProcessingStatus;
  uploadedAt: string;
  candidateName?: string;
  candidateEmail?: string;
  jobTitle?: string;
  rawText?: string;
}

export interface MatchEvaluation {
  match: 'High' | 'Medium' | 'Low' | 'Not found in resume.';
  details: string;
  years?: string;
  degree?: string;
}

export interface ScreeningResult {
  id: string;
  candidateId: string;
  resumeId: string;
  jobId: string;
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  educationMatch: MatchEvaluation;
  experienceMatch: MatchEvaluation;
  certificationMatch: MatchEvaluation;
  strengths: string[];
  missingInformation: string[];
  recruiterNotes?: string;
  createdAt: string;
  candidateName?: string;
  candidateEmail?: string;
  jobTitle?: string;
  resumeFileName?: string;
  isShortlisted?: boolean;
}

export interface CandidateMatch {
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  title?: string;
  matchPercentage: number;
  matchedSkills: string[];
  missingSkills: string[];
  experienceYears: string;
  education: string;
  certificateStatus: string;
  screeningStatus: string;
  isShortlisted: boolean;
  resumeId?: string;
}

export type CertificateStatus = 'Pending' | 'Verified' | 'Needs Manual Review' | 'Unable to Verify' | 'Expired';

export interface Certificate {
  id: string;
  candidateId: string;
  candidateName?: string;
  candidateEmail?: string;
  certificateName: string;
  issuingOrganization: string;
  certificateId: string;
  issueDate: string;
  expiryDate: string;
  course?: string;
  skills?: string[];
  fileUrl: string;
  status: CertificateStatus;
  evidence?: string;
  reviewerNotes?: string;
  verifiedAt?: string;
  createdAt: string;
}

export interface VerificationRecord {
  id: string;
  certificateId: string;
  status: CertificateStatus;
  evidence: string;
  reviewerNotes: string;
  verifiedAt: string;
}

export type ReportType = 'Candidate Report' | 'Job Report' | 'Screening Report' | 'Certificate Verification Report';

export interface Report {
  id: string;
  recruiterId: string;
  candidateId?: string;
  jobId?: string;
  reportType: ReportType;
  reportData: Record<string, any>;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
}

export type TicketStatus = 'Open' | 'In Progress' | 'Resolved';
export type TicketCategory =
  | 'Login Problem'
  | 'Resume Upload'
  | 'AI Screening'
  | 'Candidate Matching'
  | 'Certificate Verification'
  | 'Reports'
  | 'Technical Issue'
  | 'Other';

export interface TicketReply {
  id: string;
  senderName: string;
  senderRole: UserRole;
  message: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  ticketId: string;
  userName: string;
  userEmail: string;
  category: TicketCategory;
  subject: string;
  description: string;
  attachmentName?: string;
  status: TicketStatus;
  replies: TicketReply[];
  internalNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  targetType: string;
  targetName: string;
  timestamp: string;
}
