export type ReframeItem = {
  id: string;
  title: string;
  body: string;
  tags: string[];
};

export type StatsSummary = {
  averageMood: number;
  checkIns: number;
  journals: number;
  topEmotions: {name: string; emoji: string; percent: number}[];
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
};

export type CognitiveInsight = {
  distortion: string;
  confidence: number;
  note: string;
};

export type RiskForecast = {
  level: 'low' | 'medium' | 'high';
  horizon: string;
  note: string;
};

export type FamilyTip = {
  summary: string;
  action: string;
};

export type CrisisPlan = {
  headline: string;
  steps: string[];
};

export type LearningNote = {
  summary: string;
  lastUpdated: string;
};

export type ParentAlert = {
  id: string;
  title: string;
  detail: string;
  severity: 'low' | 'medium' | 'high';
};

export type ChildBadge = {
  id: string;
  label: string;
  description: string;
};
