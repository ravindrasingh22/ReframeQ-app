const API_BASE_URL = 'http://localhost:8001';

export type OnboardingAIStep =
  | 'goal_microcopy'
  | 'clarity_interpretation'
  | 'style_confirmation'
  | 'tutorial_example'
  | 'first_reframe';

export type OnboardingAIResult = {
  message?: string | null;
  situation?: string | null;
  thought?: string | null;
  reframe?: string | null;
  socratic_question?: string | null;
  next_step?: string | null;
  detected_pattern_label?: string | null;
  reframe_title?: string | null;
  reframe_text?: string | null;
  next_step_title?: string | null;
  next_step_text?: string | null;
  question_title?: string | null;
  question_text?: string | null;
  pattern_label?: string | null;
  config_version?: string | null;
  tone: string;
  fallback_used: boolean;
};

export type OnboardingAIRequest = {
  contract_version: string;
  surface: 'onboarding';
  step: OnboardingAIStep;
  context: {
    entry_context: {
      app_source: string;
      signup_path: string;
      language: string;
      country: string;
      is_new_user: boolean;
      is_resuming: boolean;
    };
    account_context: {
      account_mode: string;
      user_type: string;
    };
    goal_context: {
      goal: string;
      secondary_goals: string[];
    };
    state_context: {
      clarity_score?: number | null;
      control_score?: number | null;
      mental_noise_score?: number | null;
      readiness_score?: number | null;
    };
    style_context: {
      coach_style: string;
    };
    family_context: {
      is_family_flow: boolean;
      family_role: string | null;
      child_age_band: string | null;
      visibility_mode: string | null;
      topic_restrictions: string[];
    };
    input_context: {
      user_message?: string | null;
      detected_pattern: string;
      emotion_intensity_hint?: string | null;
    };
    safety_context: {
      scan_status: 'allow' | 'limit' | 'block' | 'handoff';
      policy_code: string;
      blocked_topics: string[];
      needs_handoff: boolean;
    };
  };
};

export async function generateOnboardingAI(
  payload: OnboardingAIRequest,
  token?: string,
): Promise<{step: OnboardingAIStep; result: OnboardingAIResult; model: string}> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(`${API_BASE_URL}/api/app/onboarding/ai/generate`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(typeof data?.detail === 'string' ? data.detail : 'Onboarding AI request failed');
  }
  return {
    step: data.step as OnboardingAIStep,
    result: data.result as OnboardingAIResult,
    model: String(data.model ?? ''),
  };
}
