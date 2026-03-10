import {buildApiUrl} from '../config/appConfig';

export type FamilyProfile = {
  profile_id: number;
  primary_user_id: number;
  profile_type: 'child' | 'adult' | string;
  display_name: string;
  age_band: string;
  profile_active: boolean;
  consent_granted: boolean | null;
  consent_text_version: string | null;
  daily_time_limit_minutes: number | null;
  topic_restrictions: string[];
  conversation_visibility_rule: string | null;
};

export async function fetchMyProfiles(token: string): Promise<FamilyProfile[]> {
  const response = await fetch(buildApiUrl('/api/app/family/profiles'), {
    headers: {Authorization: `Bearer ${token}`},
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(typeof data?.detail === 'string' ? data.detail : 'Failed to fetch profiles');
  }
  return (data?.items ?? []) as FamilyProfile[];
}

export async function createMyProfile(
  token: string,
  payload: {
    profile_type: 'child' | 'adult';
    display_name: string;
    age_band: string;
    daily_time_limit_minutes: number;
    topic_restrictions: string[];
    conversation_visibility_rule: string;
  },
): Promise<FamilyProfile> {
  const response = await fetch(buildApiUrl('/api/app/family/profiles'), {
    method: 'POST',
    headers: {'Content-Type': 'application/json', Authorization: `Bearer ${token}`},
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(typeof data?.detail === 'string' ? data.detail : 'Failed to create profile');
  }
  return data as FamilyProfile;
}

export async function updateChildProfile(
  token: string,
  profileId: number,
  payload: {
    display_name?: string;
    age_band?: string;
    daily_time_limit_minutes?: number;
    topic_restrictions?: string[];
    conversation_visibility_rule?: string;
  },
): Promise<FamilyProfile> {
  const response = await fetch(buildApiUrl(`/api/app/family/profiles/${profileId}`), {
    method: 'PATCH',
    headers: {'Content-Type': 'application/json', Authorization: `Bearer ${token}`},
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(typeof data?.detail === 'string' ? data.detail : 'Failed to update child profile');
  }
  return data as FamilyProfile;
}

export async function updateChildStatus(token: string, profileId: number, profileActive: boolean): Promise<FamilyProfile> {
  const response = await fetch(buildApiUrl(`/api/app/family/profiles/${profileId}/status`), {
    method: 'PATCH',
    headers: {'Content-Type': 'application/json', Authorization: `Bearer ${token}`},
    body: JSON.stringify({profile_active: profileActive}),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(typeof data?.detail === 'string' ? data.detail : 'Failed to update child status');
  }
  return data as FamilyProfile;
}

export async function recordChildConsent(
  token: string,
  profileId: number,
  guardianUserId: number,
  consentTextVersion = 'v1',
): Promise<FamilyProfile> {
  const response = await fetch(buildApiUrl(`/api/app/family/profiles/${profileId}/consent`), {
    method: 'POST',
    headers: {'Content-Type': 'application/json', Authorization: `Bearer ${token}`},
    body: JSON.stringify({guardian_user_id: guardianUserId, consent_text_version: consentTextVersion}),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(typeof data?.detail === 'string' ? data.detail : 'Failed to record consent');
  }
  return data as FamilyProfile;
}

export async function deleteMyProfile(token: string, profileId: number): Promise<void> {
  const response = await fetch(buildApiUrl(`/api/app/family/profiles/${profileId}`), {
    method: 'DELETE',
    headers: {Authorization: `Bearer ${token}`},
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(typeof data?.detail === 'string' ? data.detail : 'Failed to delete profile');
  }
}
