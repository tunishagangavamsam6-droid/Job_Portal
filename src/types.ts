export type JobType = 'Full-time' | 'Part-time' | 'Remote' | 'Contract' | 'Hybrid';
export type ExperienceLevel = 'Entry-level' | 'Mid-level' | 'Senior' | 'Lead / Executive';
export type ApplicationStatus = 'Applied' | 'Reviewing' | 'Interview' | 'Offer' | 'Rejected';

export interface Job {
  id: string;
  title: string;
  company: string;
  logoUrl?: string;
  location: string;
  type: JobType;
  department: string;
  salaryRange: string;
  experienceLevel: ExperienceLevel;
  description: string;
  requirements: string[];
  benefits: string[];
  postedAt: string;
  applicantsCount: number;
  status: 'active' | 'closed';
  tags: string[];
}

export interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  experienceYears: number;
  resumeText: string;
  coverLetter?: string;
  portfolioUrl?: string;
  githubUrl?: string;
  matchScore?: number;
  matchAnalysis?: {
    strengths: string[];
    missingSkills: string[];
    recommendation: string;
    keyHighlights: string[];
  };
  status: ApplicationStatus;
  appliedAt: string;
  notes?: string;
}

export interface InterviewSlot {
  id: string;
  applicationId: string;
  applicantName: string;
  jobTitle: string;
  company: string;
  date: string;
  startTime: string;
  endTime: string;
  type: 'Screening' | 'Technical Round' | 'Hiring Manager' | 'Culture Fit' | 'Final Round';
  format: 'Google Meet' | 'Phone Call' | 'In-Person' | 'Zoom';
  interviewerName: string;
  meetingLink?: string;
  notes?: string;
  status: 'Proposed' | 'Confirmed' | 'Completed' | 'Cancelled';
  createdAt: string;
}

export interface PreFlightCheckRequest {
  frontendFramework: string;
  backendFramework: string;
  databaseType: string;
  authProvider: string;
  corsOrigin: string;
  hasJwtSecret: boolean;
  hasMongoUri: boolean;
  hasPortVar: boolean;
  sameSiteCookie: 'Strict' | 'Lax' | 'None';
  caseSensitivityVerified: boolean;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  role: 'candidate' | 'employer';
}

export interface CheckItem {
  category: 'CORS & Network' | 'Security & Auth' | 'Database' | 'Build & Runtime';
  test: string;
  status: 'pass' | 'warn' | 'fail';
  message: string;
  fix: string;
}

export interface PreFlightCheckResult {
  overallStatus: 'Ready to Deploy' | 'Warnings Detected' | 'Critical Errors';
  score: number;
  checks: CheckItem[];
  aiAnalysis: string;
  timestamp: string;
}

export interface DeploymentConfigInput {
  appName: string;
  frontendUrl: string;
  backendPort: number;
  dbName: string;
  includeCloudinary: boolean;
  includeStripe: boolean;
  includeRedis: boolean;
}

export interface DeploymentConfigFiles {
  vercelJson: string;
  dockerfile: string;
  dockerCompose: string;
  envExample: string;
  migrateMongoScript: string;
  expressCorsSnippet: string;
}
