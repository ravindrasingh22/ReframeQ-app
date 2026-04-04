import {apiRequest} from './api';

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
  emergency_support: {
    enabled: boolean;
    eligible: boolean;
    profile_complete: boolean;
    show_profile_prompt: boolean;
    title: string;
    description: string;
    trusted_contacts: TrustedContact[];
    resource: {
      country: string;
      helpline_label: string;
      helpline_numbers: string[];
      emergency_label: string;
      emergency_number: string;
      support_search_url: string;
    };
  };
  onboarding: {
    step: string;
    completed: boolean;
    updated_at?: string | null;
    state: Record<string, unknown>;
  };
};

export type TrustedContact = {
  id?: string;
  name: string;
  relationship: string;
  phone_number: string;
  email: string;
  preferred_language: string;
  city: string;
  state: string;
  is_primary: boolean;
  show_call_shortcut: boolean;
  support_note: string;
  active: boolean;
};

export type UpdateAppProfilePayload = {
  full_name?: string;
  mobile_country_code?: string;
  mobile_number?: string;
  city?: string;
  state?: string;
  country?: string;
  language?: string;
  emergency_support?: {
    trusted_contacts: TrustedContact[];
  };
};

export async function fetchMyProfile(token: string): Promise<AppProfile> {
  return apiRequest<AppProfile>('/api/app/profile/me', {
    headers: {Authorization: `Bearer ${token}`},
  });
}

export async function updateMyProfile(token: string, payload: UpdateAppProfilePayload): Promise<AppProfile> {
  return apiRequest<AppProfile>('/api/app/profile/me', {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

export async function changeMyPassword(token: string, newPassword: string): Promise<void> {
  await apiRequest<unknown>('/api/app/profile/me/password', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({new_password: newPassword}),
  });
}

export async function fetchEmergencySupportConfig(token: string): Promise<AppProfile['emergency_support']> {
  return apiRequest<AppProfile['emergency_support']>('/api/app/profile/support-config', {
    headers: {Authorization: `Bearer ${token}`},
  });
}
