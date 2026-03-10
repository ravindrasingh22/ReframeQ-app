import {buildApiUrl} from '../config/appConfig';

export type DashboardHeader = {
  title: string;
  subtitle: string;
};

export type MoodOption = {
  id: string;
  label: string;
  emoji: string;
};

export type MoodCheckSection = {
  title: string;
  prompt: string;
  description: string;
  icon: string;
  options: MoodOption[];
  selected_mood_id?: string | null;
  selected_mood_label?: string | null;
  selected_at?: string | null;
};

export type DashboardStatCard = {
  id: string;
  label: string;
  accent: string;
  value: string;
  hint: string;
  progress_percent?: number | null;
};

export type DashboardFocusCard = {
  section_title: string;
  title: string;
  hint: string;
  tag: string;
  next_step: string;
};

export type SuggestedToolCard = {
  id: string;
  title: string;
  description: string;
  icon: string;
  tint: string;
  tint_bg: string;
};

export type MoodTrendSummary = {
  label: string;
  direction: string;
  detail: string;
  average_score: number;
  latest_mood_label?: string | null;
};

export type MoodTrendPoint = {
  date: string;
  mood_id: string;
  mood_label: string;
  score: number;
};

export type MoodTrendPreview = {
  title: string;
  summary: MoodTrendSummary;
  points: MoodTrendPoint[];
  cta_label: string;
};

export type HomeDashboard = {
  header: DashboardHeader;
  mood_check: MoodCheckSection;
  stats: DashboardStatCard[];
  mood_trend_preview: MoodTrendPreview;
  focus_card: DashboardFocusCard;
  suggested_tools: SuggestedToolCard[];
};

export type MoodCheckinResponse = {
  checkin: {
    mood_id: string;
    mood_label: string;
    selected_at: string;
  };
  stats: DashboardStatCard[];
};

export type MoodReportEntry = {
  id: number;
  mood_id: string;
  mood_label: string;
  checkin_date: string;
  created_at: string;
  updated_at: string;
  score: number;
};

export type MoodReport = {
  range_days: number;
  summary: {
    average_mood: string;
    average_score: number;
    latest_mood?: string | null;
    streak_days: number;
    total_checkins: number;
  };
  trend: MoodTrendSummary;
  points: MoodTrendPoint[];
  entries: MoodReportEntry[];
};

export async function fetchHomeDashboard(token: string): Promise<HomeDashboard> {
  const response = await fetch(buildApiUrl('/api/app/dashboard/home'), {
    headers: {Authorization: `Bearer ${token}`},
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(typeof data?.detail === 'string' ? data.detail : 'Failed to load dashboard');
  }
  return data as HomeDashboard;
}

export async function saveMoodCheckin(token: string, moodId: string): Promise<MoodCheckinResponse> {
  const response = await fetch(buildApiUrl('/api/app/moods/check-in'), {
    method: 'POST',
    headers: {'Content-Type': 'application/json', Authorization: `Bearer ${token}`},
    body: JSON.stringify({mood_id: moodId}),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(typeof data?.detail === 'string' ? data.detail : 'Failed to save mood check-in');
  }
  return data as MoodCheckinResponse;
}

export async function fetchMoodReport(token: string, rangeDays: 7 | 14 | 30): Promise<MoodReport> {
  const response = await fetch(buildApiUrl(`/api/app/moods/report?range_days=${rangeDays}`), {
    headers: {Authorization: `Bearer ${token}`},
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(typeof data?.detail === 'string' ? data.detail : 'Failed to load mood report');
  }
  return data as MoodReport;
}
