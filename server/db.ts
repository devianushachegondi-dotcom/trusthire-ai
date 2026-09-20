import fs from 'fs';
import path from 'path';
import {
  User,
  Job,
  Candidate,
  Resume,
  ScreeningResult,
  CandidateMatch,
  Certificate,
  VerificationRecord,
  Report,
  Notification,
  SupportTicket,
  AIConversation,
  ActivityLog,
} from './types';
import { hashPassword } from './auth';

export interface DatabaseSchema {
  users: User[];
  jobs: Job[];
  candidates: Candidate[];
  resumes: Resume[];
  screeningResults: ScreeningResult[];
  candidateMatches: CandidateMatch[];
  certificates: Certificate[];
  verificationRecords: VerificationRecord[];
  reports: Report[];
  notifications: Notification[];
  supportTickets: SupportTicket[];
  aiConversations: AIConversation[];
  activityLogs: ActivityLog[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'trusthire_db.json');

// Ensure directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function getInitialData(): DatabaseSchema {
  const recruiterId = 'usr-recruiter-01';
  const adminId = 'usr-admin-01';

  const users: User[] = [
    {
      id: recruiterId,
      name: 'Sarah Jenkins',
      email: 'recruiter@trusthire.ai',
      phone: '+1 (555) 234-5678',
      company: 'Apex Technologies',
      passwordHash: hashPassword('Recruiter123!'),
      role: 'Recruiter',
      status: 'Active',
      createdAt: '2026-08-15T10:00:00.000Z',
      updatedAt: '2026-09-01T10:00:00.000Z',
    },
    {
      id: adminId,
      name: 'Marcus Vance',
      email: 'admin@trusthire.ai',
      phone: '+1 (555) 876-5432',
      company: 'TrustHire Systems Inc.',
      passwordHash: hashPassword('Admin123!'),
      role: 'Admin',
      status: 'Active',
      createdAt: '2026-08-01T09:00:00.000Z',
      updatedAt: '2026-09-10T09:00:00.000Z',
    },
  ];

  const job1: Job = {
    id: 'job-101',
    recruiterId,
    title: 'Senior Full Stack Engineer',
    department: 'Software Engineering',
    location: 'New York, NY (Hybrid)',
    employmentType: 'Full Time',
    experienceRequired: '5+ years',
    educationRequired: "Bachelor's degree in Computer Science, Software Engineering, or related technical discipline",
    requiredSkills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'REST APIs', 'Docker'],
    preferredSkills: ['GraphQL', 'AWS', 'Tailwind CSS', 'Redis', 'CI/CD'],
    salaryRange: '$140,000 - $175,000',
    description:
      'We are seeking a seasoned Full Stack Engineer to lead the architecture and delivery of high-throughput web applications. You will collaborate closely with product management, UX designers, and cloud infrastructure teams.',
    responsibilities:
      'Architect robust backend services with Node.js and TypeScript; build accessible and responsive React user interfaces; optimize database schemas and queries for scale; conduct thoughtful code reviews and mentor junior peers.',
    status: 'Active',
    candidateCount: 3,
    createdAt: '2026-09-01T12:00:00.000Z',
    updatedAt: '2026-09-15T14:30:00.000Z',
  };

  const job2: Job = {
    id: 'job-102',
    recruiterId,
    title: 'AI / Machine Learning Engineer',
    department: 'Applied AI Labs',
    location: 'San Francisco, CA (Remote)',
    employmentType: 'Full Time',
    experienceRequired: '4+ years',
    educationRequired: "Master's or Bachelor's in CS, Machine Learning, Data Science, or Mathematics",
    requiredSkills: ['Python', 'PyTorch', 'LLMs', 'Vector Databases', 'FastAPI', 'Cloud Architecture'],
    preferredSkills: ['LangChain', 'Docker', 'RAG Pipelines', 'MLOps', 'Kubernetes'],
    salaryRange: '$165,000 - $200,000',
    description:
      'Join our frontier AI group building generative models and semantic search applications. You will be responsible for fine-tuning, retrieval-augmented generation (RAG) architecture, and latency optimization in production.',
    responsibilities:
      'Implement enterprise RAG workflows using vector databases; fine-tune LLMs for domain-specific tasks; build low-latency inference microservices; benchmark safety, grounding, and recall.',
    status: 'Active',
    candidateCount: 2,
    createdAt: '2026-09-05T10:00:00.000Z',
    updatedAt: '2026-09-18T11:00:00.000Z',
  };

  const job3: Job = {
    id: 'job-103',
    recruiterId,
    title: 'Senior DevOps & Cloud Engineer',
    department: 'Infrastructure & Security',
    location: 'Austin, TX (Remote)',
    employmentType: 'Full Time',
    experienceRequired: '4+ years',
    educationRequired: "Bachelor's in Computer Science or equivalent practical experience",
    requiredSkills: ['Kubernetes', 'Terraform', 'AWS', 'Linux', 'CI/CD', 'Monitoring'],
    preferredSkills: ['Prometheus', 'Grafana', 'Go', 'Ansible', 'Security Compliance'],
    salaryRange: '$135,000 - $160,000',
    description:
      'Manage multi-region cloud environments, automate infrastructure provisioning via Terraform, and maintain high availability across our Kubernetes clusters.',
    responsibilities:
      'Maintain automated deployment pipelines; configure cloud security policies and IAM roles; scale container orchestration clusters; conduct disaster recovery drills.',
    status: 'Active',
    candidateCount: 1,
    createdAt: '2026-09-10T08:00:00.000Z',
    updatedAt: '2026-09-10T08:00:00.000Z',
  };

  const jobs: Job[] = [job1, job2, job3];

  const cand1: Candidate = {
    id: 'cand-001',
    recruiterId,
    name: 'Elena Rostova',
    email: 'elena.rostova@example.com',
    phone: '+1 (555) 432-1982',
    title: 'Senior Full Stack Developer',
    education: [
      {
        degree: 'Bachelor of Science in Computer Science',
        institution: 'University of Washington',
        graduationYear: '2019',
      },
    ],
    skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker', 'REST APIs', 'AWS', 'Tailwind CSS', 'Redis'],
    experience: [
      {
        company: 'CloudWave Technologies',
        role: 'Lead Full Stack Engineer',
        duration: '2022 - Present (3 years)',
        responsibilities:
          'Led architecture of core B2B analytics platform handling 15M daily requests using TypeScript, React, and Node.js microservices. Reduced page load latency by 42%.',
      },
      {
        company: 'Nexus Digital Systems',
        role: 'Software Engineer',
        duration: '2019 - 2022 (3 years)',
        responsibilities:
          'Developed responsive customer portals using React, built RESTful APIs in Express, and automated CI/CD deployment pipelines using Docker and GitHub Actions.',
      },
    ],
    projects: [
      {
        name: 'Real-Time Workflow Orchestrator',
        technologies: ['TypeScript', 'Node.js', 'PostgreSQL', 'Redis'],
        description: 'Open-source distributed task runner with real-time websocket progress streaming.',
      },
    ],
    certifications: [
      {
        name: 'AWS Certified Solutions Architect - Associate',
        organization: 'Amazon Web Services',
        date: '2023',
      },
    ],
    isShortlisted: true,
    notes: [
      {
        id: 'note-1',
        authorName: 'Sarah Jenkins',
        content: 'Exceptional architectural grasp during initial screening. High technical alignment with Job 101 requirements.',
        createdAt: '2026-09-16T15:20:00.000Z',
      },
    ],
    createdAt: '2026-09-12T11:00:00.000Z',
    updatedAt: '2026-09-16T15:20:00.000Z',
  };

  const cand2: Candidate = {
    id: 'cand-002',
    recruiterId,
    name: 'David Chen',
    email: 'david.chen@example.com',
    phone: '+1 (555) 321-7890',
    title: 'Applied AI / ML Engineer',
    education: [
      {
        degree: 'Master of Science in Artificial Intelligence',
        institution: 'Georgia Institute of Technology',
        graduationYear: '2021',
      },
      {
        degree: 'Bachelor of Science in Computer Science',
        institution: 'University of Illinois Urbana-Champaign',
        graduationYear: '2019',
      },
    ],
    skills: ['Python', 'PyTorch', 'LLMs', 'Vector Databases', 'FastAPI', 'RAG Pipelines', 'Docker', 'MLOps'],
    experience: [
      {
        company: 'Cognitive Data Labs',
        role: 'Senior Machine Learning Engineer',
        duration: '2022 - Present (3 years)',
        responsibilities:
          'Built enterprise RAG search system indexing 8M enterprise documents using vector embeddings and Pinecone. Fine-tuned open-source LLMs resulting in 18% accuracy boost.',
      },
      {
        company: 'Synthetix AI',
        role: 'AI Research Engineer',
        duration: '2020 - 2022 (2 years)',
        responsibilities:
          'Trained deep learning models for natural language understanding and multi-modal semantic classification.',
      },
    ],
    projects: [
      {
        name: 'Semantic RAG Explorer',
        technologies: ['Python', 'PyTorch', 'FastAPI', 'Milvus'],
        description: 'End-to-end vector retrieval framework with automated citation verification.',
      },
    ],
    certifications: [
      {
        name: 'Professional Machine Learning Engineer',
        organization: 'Google Cloud',
        date: '2024',
      },
    ],
    isShortlisted: true,
    notes: [
      {
        id: 'note-2',
        authorName: 'Sarah Jenkins',
        content: 'Strong research and production balance. Deep understanding of RAG architectures and prompt grounding.',
        createdAt: '2026-09-17T09:40:00.000Z',
      },
    ],
    createdAt: '2026-09-14T09:15:00.000Z',
    updatedAt: '2026-09-17T09:40:00.000Z',
  };

  const cand3: Candidate = {
    id: 'cand-003',
    recruiterId,
    name: 'Maya Patel',
    email: 'maya.patel@example.com',
    phone: '+1 (555) 789-6543',
    title: 'Frontend & UI Engineer',
    education: [
      {
        degree: 'Bachelor of Science in Software Engineering',
        institution: 'San Jose State University',
        graduationYear: '2020',
      },
    ],
    skills: ['React', 'TypeScript', 'Tailwind CSS', 'Next.js', 'REST APIs', 'UI/UX Design', 'Jest'],
    experience: [
      {
        company: 'Aura Systems',
        role: 'Frontend Engineer',
        duration: '2021 - Present (3.5 years)',
        responsibilities:
          'Engineered responsive enterprise web dashboards using React and TypeScript. Created modular component libraries complying with WCAG AA accessibility standards.',
      },
    ],
    projects: [
      {
        name: 'Design System Kit',
        technologies: ['React', 'TypeScript', 'Tailwind CSS'],
        description: 'Comprehensive UI component kit with theme switching and keyboard accessibility.',
      },
    ],
    certifications: [
      {
        name: 'Meta Certified Front-End Developer',
        organization: 'Meta / Coursera',
        date: '2022',
      },
    ],
    isShortlisted: false,
    createdAt: '2026-09-15T14:20:00.000Z',
    updatedAt: '2026-09-15T14:20:00.000Z',
  };

  const cand4: Candidate = {
    id: 'cand-004',
    recruiterId,
    name: 'Marcus Bell',
    email: 'marcus.bell@example.com',
    phone: '+1 (555) 654-9871',
    title: 'Cloud DevOps Specialist',
    education: [
      {
        degree: 'Bachelor of Science in Information Technology',
        institution: 'Penn State University',
        graduationYear: '2019',
      },
    ],
    skills: ['Kubernetes', 'AWS', 'Terraform', 'Docker', 'Linux', 'CI/CD', 'Prometheus'],
    experience: [
      {
        company: 'Skyline Infrastructure',
        role: 'Cloud Platform Engineer',
        duration: '2020 - Present (4 years)',
        responsibilities:
          'Managed 30+ production EKS clusters. Automated zero-downtime rolling deployments using Helm and ArgoCD. Reduced cloud provisioning time from days to 15 minutes.',
      },
    ],
    projects: [
      {
        name: 'Terraform Multi-Cloud Boilerplate',
        technologies: ['Terraform', 'AWS', 'Bash'],
        description: 'Infrastructure as Code template for automated VPC and cluster provisioning.',
      },
    ],
    certifications: [
      {
        name: 'Certified Kubernetes Administrator (CKA)',
        organization: 'Cloud Native Computing Foundation (CNCF)',
        date: '2023',
      },
    ],
    isShortlisted: false,
    createdAt: '2026-09-16T10:00:00.000Z',
    updatedAt: '2026-09-16T10:00:00.000Z',
  };

  const candidates: Candidate[] = [cand1, cand2, cand3, cand4];

  const resumes: Resume[] = [
    {
      id: 'res-001',
      candidateId: 'cand-001',
      jobId: 'job-101',
      fileName: 'Elena_Rostova_FullStack_Resume.pdf',
      fileUrl: '/resumes/Elena_Rostova_FullStack_Resume.pdf',
      fileType: 'application/pdf',
      processingStatus: 'Processed',
      rawText: `Elena Rostova
Senior Full Stack Developer | elena.rostova@example.com | +1 (555) 432-1982
Location: New York, NY

Summary:
Full Stack Engineer with 6+ years building distributed cloud applications using TypeScript, React, Node.js, and PostgreSQL. Experienced in Docker containerization and REST API architecture.

Experience:
CloudWave Technologies — Lead Full Stack Engineer (2022 - Present)
- Led team of 6 engineers developing enterprise analytics dashboard using React, Node.js, and PostgreSQL.
- Optimized REST API endpoints and SQL indices, reducing p95 latency by 42%.
- Integrated Docker and CI/CD pipelines for automated multi-stage testing and deployment.

Nexus Digital Systems — Software Engineer (2019 - 2022)
- Built interactive client-facing web portals with React, TypeScript, and Tailwind CSS.
- Developed backend microservices in Express.js communicating via Redis queues.

Education:
B.S. in Computer Science — University of Washington (2019)

Skills:
TypeScript, React, Node.js, PostgreSQL, Docker, REST APIs, AWS, Tailwind CSS, Redis, Git, Unit Testing

Certifications:
AWS Certified Solutions Architect - Associate (2023)`,
      uploadedAt: '2026-09-12T11:00:00.000Z',
    },
    {
      id: 'res-002',
      candidateId: 'cand-002',
      jobId: 'job-102',
      fileName: 'David_Chen_AIML_CV.pdf',
      fileUrl: '/resumes/David_Chen_AIML_CV.pdf',
      fileType: 'application/pdf',
      processingStatus: 'Processed',
      rawText: `David Chen
Applied AI & Machine Learning Engineer | david.chen@example.com | +1 (555) 321-7890
Location: San Francisco, CA

Professional Summary:
Applied Machine Learning Engineer with 5 years experience specializing in LLMs, RAG architectures, Vector Databases, and PyTorch. Demonstrated success scaling production inference microservices.

Experience:
Cognitive Data Labs — Senior Machine Learning Engineer (2022 - Present)
- Engineered RAG pipeline using Python, FastAPI, and Milvus vector database indexing 8M technical documents.
- Evaluated and fine-tuned open-source LLMs using LoRA/PEFT, increasing answer relevance score from 71% to 89%.
- Built containerized MLOps pipelines using Docker and Kubernetes.

Synthetix AI — AI Research Engineer (2020 - 2022)
- Researched transformer architectures for NLP classification and automated semantic extraction.

Education:
M.S. in Artificial Intelligence — Georgia Institute of Technology (2021)
B.S. in Computer Science — University of Illinois Urbana-Champaign (2019)

Skills:
Python, PyTorch, LLMs, Vector Databases, FastAPI, RAG Pipelines, Docker, MLOps, LangChain, Kubernetes

Certifications:
Google Cloud Professional Machine Learning Engineer (2024)`,
      uploadedAt: '2026-09-14T09:15:00.000Z',
    },
    {
      id: 'res-003',
      candidateId: 'cand-003',
      jobId: 'job-101',
      fileName: 'Maya_Patel_Frontend_Resume.docx',
      fileUrl: '/resumes/Maya_Patel_Frontend_Resume.docx',
      fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      processingStatus: 'Processed',
      rawText: `Maya Patel
Frontend & UI Engineer | maya.patel@example.com | +1 (555) 789-6543
Location: San Jose, CA

Summary:
Frontend developer with 3.5 years of experience crafting modern, accessible user interfaces using React, TypeScript, and Tailwind CSS. Basic Node.js knowledge.

Experience:
Aura Systems — Frontend Engineer (2021 - Present)
- Built enterprise web applications using React, TypeScript, and Next.js.
- Developed accessible component library with 100% WCAG AA compliance.

Education:
B.S. in Software Engineering — San Jose State University (2020)

Skills:
React, TypeScript, Tailwind CSS, Next.js, REST APIs, HTML5, CSS3, Jest

Certifications:
Meta Certified Front-End Developer (2022)`,
      uploadedAt: '2026-09-15T14:20:00.000Z',
    },
    {
      id: 'res-004',
      candidateId: 'cand-004',
      jobId: 'job-103',
      fileName: 'Marcus_Bell_DevOps_Resume.pdf',
      fileUrl: '/resumes/Marcus_Bell_DevOps_Resume.pdf',
      fileType: 'application/pdf',
      processingStatus: 'Processed',
      rawText: `Marcus Bell
DevOps & Cloud Engineer | marcus.bell@example.com | +1 (555) 654-9871
Location: Austin, TX

Summary:
DevOps engineer with 4+ years specializing in AWS cloud architecture, Kubernetes cluster administration, and infrastructure automation using Terraform.

Experience:
Skyline Infrastructure — Cloud Platform Engineer (2020 - Present)
- Automated deployment of multi-tier AWS environments using Terraform and CloudFormation.
- Managed 30+ Kubernetes clusters hosting microservices.
- Implemented Prometheus and Grafana dashboards for cluster observability.

Education:
B.S. in Information Technology — Penn State University (2019)

Skills:
Kubernetes, Terraform, AWS, Docker, Linux, CI/CD, Prometheus, Grafana

Certifications:
Certified Kubernetes Administrator - CNCF (2023)`,
      uploadedAt: '2026-09-16T10:00:00.000Z',
    },
  ];

  const screeningResults: ScreeningResult[] = [
    {
      id: 'scr-001',
      candidateId: 'cand-001',
      resumeId: 'res-001',
      jobId: 'job-101',
      score: 94,
      matchedSkills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'REST APIs', 'Docker', 'AWS', 'Tailwind CSS', 'Redis'],
      missingSkills: ['GraphQL'],
      educationMatch: {
        match: 'High',
        degree: 'B.S. in Computer Science',
        details: 'Meets and validates degree requirements in Computer Science.',
      },
      experienceMatch: {
        match: 'High',
        years: '6 years verified full stack engineering experience',
        details: 'Exceeds the 5+ years minimum requirement with proven leadership and scaling accomplishments.',
      },
      certificationMatch: {
        match: 'High',
        details: 'Holds accredited AWS Solutions Architect Associate credential.',
      },
      strengths: [
        'Direct experience with entire target stack (TypeScript, React, Node.js, PostgreSQL)',
        'Quantified latency reduction and architectural leadership accomplishments',
        'Active cloud architecture certification verified on record',
      ],
      missingInformation: ['Preferred skill GraphQL not explicitly mentioned in resume text.'],
      recruiterNotes: 'Top candidate for Job 101. Schedule technical interview with engineering director.',
      createdAt: '2026-09-12T11:05:00.000Z',
    },
    {
      id: 'scr-002',
      candidateId: 'cand-002',
      resumeId: 'res-002',
      jobId: 'job-102',
      score: 96,
      matchedSkills: ['Python', 'PyTorch', 'LLMs', 'Vector Databases', 'FastAPI', 'RAG Pipelines', 'Docker', 'MLOps', 'Kubernetes'],
      missingSkills: ['Cloud Architecture (partial mention)'],
      educationMatch: {
        match: 'High',
        degree: 'M.S. in Artificial Intelligence',
        details: 'Graduate degree in Artificial Intelligence directly aligns with frontier role.',
      },
      experienceMatch: {
        match: 'High',
        years: '5 years specialized AI/ML production experience',
        details: 'Extensive hands-on RAG optimization and fine-tuning at scale.',
      },
      certificationMatch: {
        match: 'High',
        details: 'Google Cloud Professional Machine Learning Engineer credential.',
      },
      strengths: [
        'Demonstrated enterprise RAG pipeline deployment with 8M indexed documents',
        'Graduate degree directly specialized in AI/ML',
        'Proven accuracy benchmark gains (18% boost through fine-tuning)',
      ],
      missingInformation: [],
      recruiterNotes: 'Ideal background for our Applied AI group. Fast-track to interview.',
      createdAt: '2026-09-14T09:20:00.000Z',
    },
    {
      id: 'scr-003',
      candidateId: 'cand-003',
      resumeId: 'res-003',
      jobId: 'job-101',
      score: 72,
      matchedSkills: ['React', 'TypeScript', 'REST APIs', 'Tailwind CSS'],
      missingSkills: ['Node.js (production level)', 'PostgreSQL', 'Docker'],
      educationMatch: {
        match: 'High',
        degree: 'B.S. in Software Engineering',
        details: 'Meets prerequisite educational qualification.',
      },
      experienceMatch: {
        match: 'Medium',
        years: '3.5 years frontend experience',
        details: 'Below the 5+ years requirement and weighted primarily on client-side engineering.',
      },
      certificationMatch: {
        match: 'Medium',
        details: 'Meta Certified Front-End Developer.',
      },
      strengths: [
        'Strong design systems and accessibility expertise',
        'Solid modern React and TypeScript fundamentals',
      ],
      missingInformation: ['No verified production PostgreSQL or deep Node.js backend projects found in resume.'],
      recruiterNotes: 'May be better suited for a dedicated frontend role rather than full stack lead.',
      createdAt: '2026-09-15T14:25:00.000Z',
    },
    {
      id: 'scr-004',
      candidateId: 'cand-004',
      resumeId: 'res-004',
      jobId: 'job-103',
      score: 91,
      matchedSkills: ['Kubernetes', 'Terraform', 'AWS', 'Docker', 'Linux', 'CI/CD', 'Prometheus', 'Grafana'],
      missingSkills: ['Go', 'Ansible'],
      educationMatch: {
        match: 'High',
        degree: 'B.S. in Information Technology',
        details: 'Accredited STEM degree.',
      },
      experienceMatch: {
        match: 'High',
        years: '4 years DevOps & Cloud platform engineering',
        details: 'Solid experience managing 30+ Kubernetes clusters and automated IaC.',
      },
      certificationMatch: {
        match: 'High',
        details: 'Certified Kubernetes Administrator (CKA).',
      },
      strengths: ['Hands-on CKA certification', 'Demonstrated cluster orchestration and monitoring track record'],
      missingInformation: [],
      recruiterNotes: 'Matches all critical infrastructure requirements.',
      createdAt: '2026-09-16T10:08:00.000Z',
    },
  ];

  const candidateMatches: CandidateMatch[] = [
    {
      id: 'match-001',
      candidateId: 'cand-001',
      jobId: 'job-101',
      matchPercentage: 94,
      matchedSkills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'REST APIs', 'Docker', 'AWS'],
      missingSkills: ['GraphQL'],
      createdAt: '2026-09-12T11:05:00.000Z',
    },
    {
      id: 'match-002',
      candidateId: 'cand-002',
      jobId: 'job-102',
      matchPercentage: 96,
      matchedSkills: ['Python', 'PyTorch', 'LLMs', 'Vector Databases', 'FastAPI', 'RAG Pipelines'],
      missingSkills: [],
      createdAt: '2026-09-14T09:20:00.000Z',
    },
    {
      id: 'match-003',
      candidateId: 'cand-003',
      jobId: 'job-101',
      matchPercentage: 72,
      matchedSkills: ['React', 'TypeScript', 'REST APIs', 'Tailwind CSS'],
      missingSkills: ['Node.js', 'PostgreSQL', 'Docker'],
      createdAt: '2026-09-15T14:25:00.000Z',
    },
    {
      id: 'match-004',
      candidateId: 'cand-004',
      jobId: 'job-103',
      matchPercentage: 91,
      matchedSkills: ['Kubernetes', 'Terraform', 'AWS', 'Linux', 'CI/CD'],
      missingSkills: ['Go'],
      createdAt: '2026-09-16T10:08:00.000Z',
    },
  ];

  const certificates: Certificate[] = [
    {
      id: 'cert-001',
      candidateId: 'cand-001',
      certificateName: 'AWS Certified Solutions Architect - Associate',
      issuingOrganization: 'Amazon Web Services (AWS)',
      certificateId: 'AWS-SAA-8492019',
      issueDate: '2023-04-12',
      expiryDate: '2026-04-12',
      course: 'Cloud Architecture & Distributed Systems',
      skills: ['AWS', 'Cloud Architecture', 'Security', 'High Availability'],
      fileUrl: '/certificates/cert_elena_aws.pdf',
      status: 'Verified',
      evidence: 'Validated through AWS Credential Verification Registry (Validation ID: AWS-SAA-8492019).',
      reviewerNotes: 'Official verification registry confirmed credential active through April 2026.',
      verifiedAt: '2026-09-12T11:30:00.000Z',
      createdAt: '2026-09-12T11:10:00.000Z',
    },
    {
      id: 'cert-002',
      candidateId: 'cand-002',
      certificateName: 'Professional Machine Learning Engineer',
      issuingOrganization: 'Google Cloud Platform',
      certificateId: 'GCP-MLE-938201',
      issueDate: '2024-02-18',
      expiryDate: '2026-02-18',
      course: 'End-to-End Machine Learning on GCP',
      skills: ['Machine Learning', 'TensorFlow', 'MLOps', 'Model Serving'],
      fileUrl: '/certificates/cert_david_gcp.pdf',
      status: 'Verified',
      evidence: 'Credential verified through Accredible digital badge validation service.',
      reviewerNotes: 'Badge authenticity confirmed with issuing authority.',
      verifiedAt: '2026-09-14T09:45:00.000Z',
      createdAt: '2026-09-14T09:25:00.000Z',
    },
    {
      id: 'cert-003',
      candidateId: 'cand-003',
      certificateName: 'Meta Certified Front-End Developer',
      issuingOrganization: 'Meta / Coursera Professional Certificates',
      certificateId: 'META-FED-554109',
      issueDate: '2022-08-10',
      expiryDate: '2025-08-10',
      course: 'Advanced Frontend React & UI Systems',
      skills: ['React', 'JavaScript', 'HTML/CSS', 'UI Testing'],
      fileUrl: '/certificates/cert_maya_meta.pdf',
      status: 'Expired',
      evidence: 'Credential expired in August 2025 based on verifiable issuing record.',
      reviewerNotes: 'Candidate completed course in 2022. Recommended candidate re-certify for active status.',
      verifiedAt: '2026-09-15T15:00:00.000Z',
      createdAt: '2026-09-15T14:30:00.000Z',
    },
    {
      id: 'cert-004',
      candidateId: 'cand-004',
      certificateName: 'Certified Kubernetes Administrator (CKA)',
      issuingOrganization: 'Linux Foundation / CNCF',
      certificateId: 'CKA-2300-88194',
      issueDate: '2023-11-05',
      expiryDate: '2026-11-05',
      course: 'Kubernetes Cluster Architecture & Administration',
      skills: ['Kubernetes', 'Cluster Maintenance', 'Networking', 'Storage'],
      fileUrl: '/certificates/cert_marcus_cka.pdf',
      status: 'Needs Manual Review',
      evidence: 'Digital certificate image provided. CNCF verification portal was temporarily undergoing scheduled maintenance during automated ping.',
      reviewerNotes: 'Manual verification recommended using verification portal link with ID CKA-2300-88194.',
      createdAt: '2026-09-16T10:15:00.000Z',
    },
  ];

  const verificationRecords: VerificationRecord[] = [
    {
      id: 'vrec-001',
      certificateId: 'cert-001',
      status: 'Verified',
      evidence: 'Validated through AWS Credential Verification Registry (Validation ID: AWS-SAA-8492019).',
      reviewerNotes: 'Official verification registry confirmed credential active through April 2026.',
      verifiedAt: '2026-09-12T11:30:00.000Z',
    },
    {
      id: 'vrec-002',
      certificateId: 'cert-002',
      status: 'Verified',
      evidence: 'Credential verified through Accredible digital badge validation service.',
      reviewerNotes: 'Badge authenticity confirmed with issuing authority.',
      verifiedAt: '2026-09-14T09:45:00.000Z',
    },
    {
      id: 'vrec-003',
      certificateId: 'cert-003',
      status: 'Expired',
      evidence: 'Credential expired in August 2025 based on verifiable issuing record.',
      reviewerNotes: 'Status marked expired.',
      verifiedAt: '2026-09-15T15:00:00.000Z',
    },
  ];

  const reports: Report[] = [
    {
      id: 'rep-001',
      recruiterId,
      candidateId: 'cand-001',
      jobId: 'job-101',
      reportType: 'Candidate Report',
      reportData: {
        candidateName: 'Elena Rostova',
        jobTitle: 'Senior Full Stack Engineer',
        screeningScore: 94,
        matchPercentage: 94,
        certificateStatus: 'Verified (AWS Certified Solutions Architect)',
        skillsOverview: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker', 'AWS'],
        verdict: 'High Alignment - Shortlisted for Director Technical Round',
      },
      createdAt: '2026-09-16T16:00:00.000Z',
    },
    {
      id: 'rep-002',
      recruiterId,
      jobId: 'job-101',
      reportType: 'Job Report',
      reportData: {
        jobTitle: 'Senior Full Stack Engineer',
        totalCandidates: 2,
        averageScreeningScore: 83,
        shortlistedCount: 1,
        statusBreakdown: {
          'Above 90%': 1,
          '70% - 89%': 1,
          'Below 70%': 0,
        },
      },
      createdAt: '2026-09-17T11:00:00.000Z',
    },
  ];

  const notifications: Notification[] = [
    {
      id: 'notif-001',
      userId: recruiterId,
      title: 'Resume Screening Complete',
      message: 'AI screening finished for Elena Rostova on Senior Full Stack Engineer (Score: 94%).',
      type: 'success',
      read: false,
      createdAt: '2026-09-16T10:00:00.000Z',
    },
    {
      id: 'notif-002',
      userId: recruiterId,
      title: 'Certificate Needs Review',
      message: 'Certificate for Marcus Bell requires manual review (CNCF registry verification).',
      type: 'warning',
      read: false,
      createdAt: '2026-09-16T10:20:00.000Z',
    },
    {
      id: 'notif-003',
      userId: recruiterId,
      title: 'New Candidate Uploaded',
      message: 'David Chen applied for AI / Machine Learning Engineer role.',
      type: 'info',
      read: true,
      createdAt: '2026-09-14T09:16:00.000Z',
    },
  ];

  const supportTickets: SupportTicket[] = [
    {
      id: 'tkt-001',
      userId: recruiterId,
      ticketId: 'TICK-4821',
      userName: 'Sarah Jenkins',
      userEmail: 'recruiter@trusthire.ai',
      category: 'Certificate Verification',
      subject: 'Clarification regarding CNCF certificate API automated checks',
      description:
        'I noticed one certificate returned "Needs Manual Review" during automated verification. Is there an option to force a direct registry ping once the upstream registry maintenance concludes?',
      status: 'In Progress',
      replies: [
        {
          id: 'rep-t1',
          senderName: 'Marcus Vance',
          senderRole: 'Admin',
          message:
            'Hi Sarah, yes! You can open the certificate in the Certificates tab and click "Update Verification Status" or re-verify against the live portal ID.',
          createdAt: '2026-09-16T12:30:00.000Z',
        },
      ],
      createdAt: '2026-09-16T11:00:00.000Z',
      updatedAt: '2026-09-16T12:30:00.000Z',
    },
  ];

  const aiConversations: AIConversation[] = [
    {
      id: 'conv-001',
      userId: recruiterId,
      title: 'Candidate skill breakdown for Job 101',
      messages: [
        {
          role: 'user',
          content: 'Which candidates have strong TypeScript and React experience for my Senior Full Stack Engineer role?',
          timestamp: '2026-09-16T14:00:00.000Z',
        },
        {
          role: 'assistant',
          content: `Based on your authorized database for **Senior Full Stack Engineer**:

- **Elena Rostova** (Score: **94%**) has 6+ years verified experience with **TypeScript**, **React**, Node.js, and PostgreSQL. She has an active AWS Solutions Architect certificate on record.
- **Maya Patel** (Score: **72%**) has 3.5 years with **React** and **TypeScript**, focused heavily on frontend design systems.

Would you like me to generate interview questions tailored to Elena or review missing skills?`,
          timestamp: '2026-09-16T14:00:05.000Z',
        },
      ],
      createdAt: '2026-09-16T14:00:00.000Z',
      updatedAt: '2026-09-16T14:00:05.000Z',
    },
  ];

  const activityLogs: ActivityLog[] = [
    {
      id: 'log-001',
      userId: recruiterId,
      userName: 'Sarah Jenkins',
      userRole: 'Recruiter',
      action: 'Screened Resume',
      targetType: 'ScreeningResult',
      targetName: 'Elena Rostova (Score: 94%)',
      timestamp: '2026-09-12T11:05:00.000Z',
    },
    {
      id: 'log-002',
      userId: recruiterId,
      userName: 'Sarah Jenkins',
      userRole: 'Recruiter',
      action: 'Verified Certificate',
      targetType: 'Certificate',
      targetName: 'AWS-SAA-8492019 (Elena Rostova)',
      timestamp: '2026-09-12T11:30:00.000Z',
    },
    {
      id: 'log-003',
      userId: recruiterId,
      userName: 'Sarah Jenkins',
      userRole: 'Recruiter',
      action: 'Screened Resume',
      targetType: 'ScreeningResult',
      targetName: 'David Chen (Score: 96%)',
      timestamp: '2026-09-14T09:20:00.000Z',
    },
    {
      id: 'log-004',
      userId: recruiterId,
      userName: 'Sarah Jenkins',
      userRole: 'Recruiter',
      action: 'Generated Report',
      targetType: 'Report',
      targetName: 'Candidate Report: Elena Rostova',
      timestamp: '2026-09-16T16:00:00.000Z',
    },
  ];

  return {
    users,
    jobs,
    candidates,
    resumes,
    screeningResults,
    candidateMatches,
    certificates,
    verificationRecords,
    reports,
    notifications,
    supportTickets,
    aiConversations,
    activityLogs,
  };
}

class DatabaseManager {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('Error reading database file, loading initial seed data:', err);
    }
    const initial = getInitialData();
    this.saveData(initial);
    return initial;
  }

  private saveData(data: DatabaseSchema) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
      console.error('Error saving database file:', err);
    }
  }

  public persist() {
    this.saveData(this.data);
  }

  public get users() {
    return this.data.users;
  }
  public get jobs() {
    return this.data.jobs;
  }
  public get candidates() {
    return this.data.candidates;
  }
  public get resumes() {
    return this.data.resumes;
  }
  public get screeningResults() {
    return this.data.screeningResults;
  }
  public get candidateMatches() {
    return this.data.candidateMatches;
  }
  public get certificates() {
    return this.data.certificates;
  }
  public get verificationRecords() {
    return this.data.verificationRecords;
  }
  public get reports() {
    return this.data.reports;
  }
  public get notifications() {
    return this.data.notifications;
  }
  public get supportTickets() {
    return this.data.supportTickets;
  }
  public get aiConversations() {
    return this.data.aiConversations;
  }
  public get activityLogs() {
    return this.data.activityLogs;
  }

  public addActivity(userId: string, userName: string, userRole: 'Recruiter' | 'Admin', action: string, targetType: string, targetName: string) {
    const log: ActivityLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      userId,
      userName,
      userRole,
      action,
      targetType,
      targetName,
      timestamp: new Date().toISOString(),
    };
    this.data.activityLogs.unshift(log);
    if (this.data.activityLogs.length > 200) {
      this.data.activityLogs.pop();
    }
    this.persist();
  }
}

export const db = new DatabaseManager();
