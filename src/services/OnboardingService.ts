import {apiRequest} from './api';

export type PersistedOnboardingState = {
  account_mode: string;
  invite_code: string;
  invite_validated: boolean;
  user_type: string;
  primary_goal: string;
  secondary_goals: string[];
  clarity: number;
  control: number;
  noise: number;
  readiness: number;
  coach_style: string;
  first_thought: string;
  safety_flag: string;
  full_name: string;
  email: string;
  reminder_preference: string;
  child_display_name: string;
  child_age_band: string;
  daily_time_limit: string;
  topic_restrictions: string;
  visibility_rule: string;
  guardian_consent: boolean;
  onboarding_complete: boolean;
  language: string;
  country: string;
  first_reframe_snapshot?: Record<string, unknown>;
};

export type OnboardingConfig = {
  policy: {
    onboarding_enabled: boolean;
    allow_resume: boolean;
    allow_family_flows: boolean;
    require_invite_for_family_join: boolean;
    enabled_user_types: Array<{key: string; label: string; enabled: boolean}>;
    enabled_account_modes: Array<{key: string; label: string; enabled: boolean}>;
  };
  text: Array<{
    key: string;
    title: string;
    subtitle: string;
    primary_cta: string;
    secondary_cta: string;
    enabled: boolean;
  }>;
};

export async function validateInviteCode(inviteCode: string) {
  return apiRequest<{valid: boolean; invite_code: string; status: string; account_mode: string; invited_user_email?: string | null}>('/api/app/onboarding/invite/validate', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({invite_code: inviteCode}),
  });
}

export async function fetchOnboardingConfig() {
  return apiRequest<OnboardingConfig>('/api/app/onboarding/config');
}

export async function scanOnboardingSafety(message: string) {
  return apiRequest<{scan_status: 'allow' | 'limit' | 'block' | 'handoff'; policy_code: string; blocked_topics: string[]; needs_handoff: boolean}>('/api/app/onboarding/safety/scan', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({message}),
  });
}

export async function saveOnboardingState(
  token: string,
  payload: {step: string; completed: boolean; state: PersistedOnboardingState},
) {
  return apiRequest<{step: string; completed: boolean; state: PersistedOnboardingState; updated_at?: string | null}>('/api/app/onboarding/state', {
    method: 'PUT',
    headers: {'Content-Type': 'application/json', Authorization: `Bearer ${token}`},
    body: JSON.stringify(payload),
  });
}

export async function fetchOnboardingState(token: string) {
  return apiRequest<{step: string; completed: boolean; state: PersistedOnboardingState; updated_at?: string | null}>('/api/app/onboarding/state', {
    headers: {Authorization: `Bearer ${token}`},
  });
}
