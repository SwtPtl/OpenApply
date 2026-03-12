export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  portfolio: string;
  workAuthorization: 'Canadian Citizen' | 'Permanent Resident' | 'Work Permit' | 'Student Visa' | 'Other';
  requireSponsorship: boolean;
  salaryExpectation?: string;
  llmProvider: 'gemini' | 'deepseek' | 'claude' | 'local';
  apiKey?: string;
  companionUrl: string;
}

export interface JobContext {
  title: string;
  company: string;
  location?: string;
  description: string;
  url: string;
  atsType?: string;
}

export interface GenerationResult {
  resume_bullets: ResumeBullets;
  cover_letter?: string;
  latex_resume_experience?: string;
  latex_cover_letter_body?: string;
  resume_pdf_url?: string;
  cover_pdf_url?: string;
  resume_pdf_error?: string;
  cover_pdf_error?: string;
  feedback: FeedbackResult;
  keywords_matched: string[];
  keywords_missing: string[];
  fit_score: number;
}

export interface ResumeBullets {
  education: string;
  coursework: string;
  experience: string[];
  skills: string[];
}

export interface FeedbackResult {
  strengths: string[];
  gaps: string[];
  suggestions: string[];
}

export interface Application {
  id: string;
  company: string;
  title: string;
  url: string;
  date: string;
  status: 'Applied' | 'Interview' | 'Offer' | 'Rejected' | 'Ghosted';
  fitScore?: number;
}

export type MessageType =
  | { type: 'GET_JOB_CONTEXT' }
  | { type: 'JOB_CONTEXT'; payload: JobContext }
  | { type: 'GENERATE'; payload: JobContext }
  | { type: 'GENERATION_COMPLETE'; payload: GenerationResult }
  | { type: 'GENERATION_ERROR'; error: string }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'OPEN_SIDEBAR' }
  | { type: 'START_COMPANION' };
