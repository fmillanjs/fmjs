const API_URL = process.env.API_URL || 'http://localhost:3001';

export interface LeadSummary {
  id: string;
  name: string;
  companyName: string;
  icpScore: number | null;
  status: 'pending' | 'processing' | 'complete' | 'failed';
  industry: string | null;
  createdAt: string;
}

export interface QualifyOutput {
  icpScore: number;
  reasoning: string;
  matchedCriteria: string[];
  weakCriteria: string[];
}

export interface EnrichOutput {
  companySize: string | null;
  industry: string | null;
  techStack: string[];
  painPoints: string[];
}

export interface AIOutputRecord {
  step: string;   // 'qualify' | 'enrich' | 'personalize'
  content: unknown;
  createdAt: string;
}

export interface LeadDetail extends LeadSummary {
  companyUrl: string;
  companySize: string | null;
  updatedAt: string;
  aiOutputs: AIOutputRecord[];
}

export async function getLeads(): Promise<LeadSummary[]> {
  const res = await fetch(`${API_URL}/leads`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`GET /leads failed: ${res.status}`);
  return res.json();
}

export async function getLead(id: string): Promise<LeadDetail> {
  const res = await fetch(`${API_URL}/leads/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`GET /leads/${id} failed: ${res.status}`);
  return res.json();
}
