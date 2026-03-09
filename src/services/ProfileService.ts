const API_BASE_URL = 'http://localhost:8001';

export type AppProfile = {
  email: string;
  role: string;
  full_name: string;
  country: string;
  language: string;
  account_mode: string;
  user_type: string;
  primary_goal: string;
  coach_style: string;
  dashboard_title: string;
  dashboard_subtitle: string;
  onboarding: {
    step: string;
    completed: boolean;
    updated_at?: string | null;
    state: Record<string, unknown>;
  };
};

export async function fetchMyProfile(token: string): Promise<AppProfile> {
  const response = await fetch(`${API_BASE_URL}/api/app/profile/me`, {
    headers: {Authorization: `Bearer ${token}`},
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(typeof data?.detail === 'string' ? data.detail : 'Failed to load profile');
  }
  return data as AppProfile;
}
