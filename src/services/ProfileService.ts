import {buildApiUrl} from '../config/appConfig';

export type AppProfile = {
  email: string;
  role: string;
  full_name: string;
  mobile_country_code: string;
  mobile_number: string;
  city: string;
  state: string;
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

export type UpdateAppProfilePayload = {
  full_name?: string;
  mobile_country_code?: string;
  mobile_number?: string;
  city?: string;
  state?: string;
  country?: string;
  language?: string;
};

export async function fetchMyProfile(token: string): Promise<AppProfile> {
  const response = await fetch(buildApiUrl('/api/app/profile/me'), {
    headers: {Authorization: `Bearer ${token}`},
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(typeof data?.detail === 'string' ? data.detail : 'Failed to load profile');
  }
  return data as AppProfile;
}

export async function updateMyProfile(token: string, payload: UpdateAppProfilePayload): Promise<AppProfile> {
  const response = await fetch(buildApiUrl('/api/app/profile/me'), {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(typeof data?.detail === 'string' ? data.detail : 'Failed to update profile');
  }
  return data as AppProfile;
}

export async function changeMyPassword(token: string, newPassword: string): Promise<void> {
  const response = await fetch(buildApiUrl('/api/app/profile/me/password'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({new_password: newPassword}),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof data?.detail === 'string' ? data.detail : 'Failed to change password');
  }
}
