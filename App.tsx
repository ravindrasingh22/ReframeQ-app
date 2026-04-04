import React, {useEffect, useMemo, useState} from 'react';
import {
  Keyboard,
  Linking,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Svg, {Circle, Line, Path, Text as SvgText} from 'react-native-svg';
import {loginApp, registerApp} from './src/services/AppAuthService';
import {isUnauthorizedError, readSessionValue, removeSessionValue, setUnauthorizedHandler, writeSessionValue} from './src/services/api';
import {createMyProfile, fetchMyProfiles, recordChildConsent} from './src/services/FamilyService';
import {generateOnboardingAI, type OnboardingAIRequest, type OnboardingAIResult} from './src/services/OnboardingAIService';
import {fetchOnboardingConfig, fetchOnboardingState, saveOnboardingState, scanOnboardingSafety, validateInviteCode, type OnboardingConfig, type PersistedOnboardingState} from './src/services/OnboardingService';
import {changeMyPassword, fetchMyProfile, updateMyProfile, type AppProfile as RemoteAppProfile} from './src/services/ProfileService';
import {fetchThreadDetail, fetchThreads, getAssistantReply, sendChatMessage, type ChatThreadMessage} from './src/services/AIChatService';
import {fetchHomeDashboard, fetchMoodReport, saveMoodCheckin, type DashboardStatCard, type HomeDashboard, type MoodReport, type MoodTrendPoint} from './src/services/DashboardService';
import {indiaLocations, indiaStates} from './src/data/indiaLocations';

type TabId = 'home' | 'reports' | 'chat' | 'tools' | 'family' | 'profile';
type AppMode = 'splash' | 'landing' | 'auth' | 'onboarding' | 'app';
type OnboardingStep =
  | 'welcome'
  | 'accountMode'
  | 'inviteCode'
  | 'userType'
  | 'goal'
  | 'clarity'
  | 'style'
  | 'tutorial'
  | 'thought'
  | 'safety'
  | 'reframe'
  | 'signup'
  | 'familySetup'
  | 'childProfile'
  | 'guardianConsent'
  | 'reminders'
  | 'complete';
type AccountMode = 'individual' | 'family_owner' | 'family_join' | '';
type UserType = 'adult' | 'teen' | 'child_with_guardian' | 'guardian' | '';
type GoalId =
  | 'overthinking'
  | 'confidence'
  | 'friendships_social'
  | 'family_communication'
  | 'focus_procrastination'
  | 'better_decisions'
  | 'emotional_balance'
  | 'parenting_support'
  | 'child_behavior_support'
  | '';
type CoachStyle = 'gentle' | 'practical' | 'encouraging' | 'strategic' | '';
type ReminderPreference = 'daily' | 'few_times_week' | 'only_when_choose' | 'no_reminders' | '';
type AgeBand = '5-8' | '9-12' | '13-17' | '';
type TimeLimit = '10 min' | '15 min' | '20 min' | 'Custom' | '';
type TopicRestriction = 'Guided topics only' | 'Limit sensitive topics' | 'No open chat' | '';
type VisibilityRule = 'Safety-only alerts' | 'Weekly summary' | 'Full guardian visibility' | '';
type IconName =
  | 'home'
  | 'chat'
  | 'heart'
  | 'users'
  | 'user'
  | 'sparkles'
  | 'bell'
  | 'smile'
  | 'check'
  | 'clock'
  | 'brain'
  | 'play'
  | 'book'
  | 'moon'
  | 'sun'
  | 'arrowRight'
  | 'arrowLeft'
  | 'shield'
  | 'chart'
  | 'plus'
  | 'settings'
  | 'lock'
  | 'login'
  | 'mail'
  | 'baby'
  | 'alert'
  | 'badge'
  | 'wand'
  | 'target'
  | 'compass'
  | 'refresh'
  | 'eye'
  | 'timer'
  | 'bookmark'
  | 'phone'
  | 'panel'
  | 'footprints'
  | 'shieldCheck'
  | 'calendar';

type ToolCard = {title: string; desc: string; icon: IconName; tint: string; tintBg: string};
type FamilyProfile = {
  name: string;
  type: string;
  age: string;
  rule: string;
  time: string;
  topics: string;
  status: string;
};
type OnboardingState = {
  accountMode: AccountMode;
  inviteCode: string;
  inviteValidated: boolean;
  userType: UserType;
  primaryGoal: GoalId;
  secondaryGoals: GoalId[];
  clarity: number;
  control: number;
  noise: number;
  readiness: number;
  coachStyle: CoachStyle;
  firstThought: string;
  safetyFlag: 'none' | 'moderate' | 'severe';
  fullName: string;
  email: string;
  password: string;
  reminderPreference: ReminderPreference;
  childDisplayName: string;
  childAgeBand: AgeBand;
  dailyTimeLimit: TimeLimit;
  topicRestrictions: TopicRestriction;
  visibilityRule: VisibilityRule;
  guardianConsent: boolean;
  onboardingComplete: boolean;
  language: 'en' | 'hinglish';
  country: string;
};

type GeneratedReframe = {
  thought: string;
  reframeText: string;
  nextStepText: string;
  questionText: string;
  reframeTitle?: string;
  nextStepTitle?: string;
  questionTitle?: string;
  patternLabel?: string;
  configVersion?: string;
  fallbackUsed?: boolean;
};

type CoachMessage = {
  id: string;
  from: 'user' | 'bot';
  text: string;
  createdAt?: string;
};

type CoachSummary = {
  patternLabel: string;
  sessionGoal: string;
  nextStep: string;
  timeLabel: string;
};

type AIMessages = {
  goal: string;
  clarity: string;
  style: string;
  tutorial: {situation?: string; thought?: string; reframe?: string} | null;
};

type ScreenCopy = {
  key: string;
  title: string;
  subtitle: string;
  primary_cta: string;
  secondary_cta: string;
  enabled: boolean;
};

const defaultOnboardingConfig: OnboardingConfig = {
  policy: {
    onboarding_enabled: true,
    allow_resume: true,
    allow_family_flows: true,
    require_invite_for_family_join: true,
    enabled_user_types: [
      {key: 'adult', label: 'Adult', enabled: true},
      {key: 'teen', label: 'Teen', enabled: true},
      {key: 'guardian', label: 'Guardian', enabled: true},
    ],
    enabled_account_modes: [
      {key: 'individual', label: 'Individual', enabled: true},
      {key: 'family_owner', label: 'Family Owner', enabled: true},
      {key: 'family_join', label: 'Family Join', enabled: true},
    ],
  },
  text: [
    {key: 'welcome', title: 'Onboarding', subtitle: 'Let us set up the right support for you.', primary_cta: 'Get started', secondary_cta: 'I have a family invite', enabled: true},
    {key: 'goal', title: 'What do you want help with?', subtitle: 'Choose the area you want ReframeQ to focus on first.', primary_cta: 'Continue', secondary_cta: '', enabled: true},
    {key: 'clarity', title: 'How are things feeling right now?', subtitle: 'This helps us adjust tone and pace.', primary_cta: 'Continue', secondary_cta: '', enabled: true},
    {key: 'style', title: 'Choose your guidance style', subtitle: 'Pick the tone that will feel most useful right now.', primary_cta: 'Continue', secondary_cta: 'Skip', enabled: true},
    {key: 'reframe', title: 'Your first reframe', subtitle: 'A calmer way to look at this thought.', primary_cta: 'Save and continue', secondary_cta: 'Edit my thought', enabled: true},
  ],
};

const ONBOARDING_DRAFT_KEY = 'reframeq_onboarding_draft_v1';
const APP_SESSION_KEY = 'reframeq_app_session_v1';

const appTabs: Array<{id: TabId; label: string; icon: IconName}> = [
  {id: 'home', label: 'Home', icon: 'home'},
  {id: 'reports', label: 'Reports', icon: 'chart'},
  {id: 'chat', label: 'Coach', icon: 'chat'},
  {id: 'tools', label: 'Tools', icon: 'heart'},
  {id: 'family', label: 'Family', icon: 'users'},
  {id: 'profile', label: 'Profile', icon: 'user'},
];

const goalOptions: Array<{id: GoalId; label: string}> = [
  {id: 'overthinking', label: 'Overthinking'},
  {id: 'confidence', label: 'Confidence'},
  {id: 'friendships_social', label: 'Friendships & social situations'},
  {id: 'family_communication', label: 'Family communication'},
  {id: 'focus_procrastination', label: 'Focus & procrastination'},
  {id: 'better_decisions', label: 'Better decisions'},
  {id: 'emotional_balance', label: 'Emotional balance'},
  {id: 'parenting_support', label: 'Parenting support'},
  {id: 'child_behavior_support', label: 'Child behavior support'},
];

const guidanceStyles = [
  {id: 'gentle' as const, title: 'Gentle', desc: 'Calm and supportive'},
  {id: 'practical' as const, title: 'Practical', desc: 'Clear and direct'},
  {id: 'encouraging' as const, title: 'Encouraging', desc: 'Positive and motivating'},
  {id: 'strategic' as const, title: 'Strategic', desc: 'Structured and pattern-focused'},
];

const tools: ToolCard[] = [
  {title: 'Thought Reframe', desc: 'Turn one difficult thought into a more balanced view.', icon: 'brain', tint: '#7c3aed', tintBg: '#ede9fe'},
  {title: 'Question Builder', desc: 'Use guided questions to challenge assumptions.', icon: 'compass', tint: '#d946ef', tintBg: '#fae8ff'},
  {title: 'Mood Journal', desc: 'Track feelings, triggers, and wins.', icon: 'book', tint: '#0f766e', tintBg: '#ccfbf1'},
  {title: 'Behavior Experiment', desc: 'Test a belief with one small real-world action.', icon: 'footprints', tint: '#2563eb', tintBg: '#dbeafe'},
  {title: 'Breathing Reset', desc: 'A 2-minute guided calm-down exercise.', icon: 'play', tint: '#c026d3', tintBg: '#fae8ff'},
  {title: 'Sleep Wind-down', desc: 'Gentle night support and audio prompts.', icon: 'moon', tint: '#4338ca', tintBg: '#e0e7ff'},
];

const reminderOptions: Array<{id: ReminderPreference; label: string; desc?: string}> = [
  {id: 'daily', label: 'Daily'},
  {id: 'few_times_week', label: 'A few times a week', desc: 'Gentle prompts without overload'},
  {id: 'only_when_choose', label: 'Only when I choose'},
  {id: 'no_reminders', label: 'No reminders'},
];

const phoneCountryCodes = [
  {label: 'India', code: '+91'},
  {label: 'United States', code: '+1'},
  {label: 'United Kingdom', code: '+44'},
  {label: 'Canada', code: '+1'},
  {label: 'Australia', code: '+61'},
  {label: 'Singapore', code: '+65'},
  {label: 'UAE', code: '+971'},
];

const profileCountries = ['India', 'United States', 'United Kingdom', 'Canada', 'Australia', 'Singapore', 'UAE'];

const familyProfiles: FamilyProfile[] = [
  {name: 'Alisha', type: 'Child', age: '9-12', rule: 'Weekly summary', time: '20 min/day', topics: 'Guided topics only', status: 'Active'},
  {name: 'Rupali', type: 'Adult', age: '18+', rule: 'Private', time: 'No limit', topics: 'Standard', status: 'Active'},
];

const dangerKeywords = ['suicide', 'kill myself', 'hurt myself', 'end my life', 'unsafe', 'immediate danger'];
const moderateSafetyKeywords = ['panic', "can't cope", 'can’t cope', 'break down', 'hopeless', 'harm'];

const initialOnboardingState: OnboardingState = {
  accountMode: '',
  inviteCode: '',
  inviteValidated: false,
  userType: '',
  primaryGoal: '',
  secondaryGoals: [],
  clarity: 0,
  control: 0,
  noise: 0,
  readiness: 0,
  coachStyle: '',
  firstThought: '',
  safetyFlag: 'none',
  fullName: '',
  email: '',
  password: '',
  reminderPreference: '',
  childDisplayName: '',
  childAgeBand: '',
  dailyTimeLimit: '',
  topicRestrictions: '',
  visibilityRule: '',
  guardianConsent: false,
  onboardingComplete: false,
  language: 'en',
  country: 'IN',
};

function titleForGoal(goal: GoalId) {
  const found = goalOptions.find(item => item.id === goal);
  return found?.label ?? 'Overthinking';
}

function isToggleEnabled(items: Array<{key: string; enabled: boolean}>, key: string) {
  const match = items.find(item => item.key === key);
  return match ? match.enabled : true;
}

function buildFlow(state: OnboardingState, config: OnboardingConfig, hasAccount: boolean): OnboardingStep[] {
  const prefix: OnboardingStep[] = ['welcome'];
  const middle: OnboardingStep[] = ['userType', 'goal', 'clarity', 'style', 'tutorial', 'thought'];
  const allowFamily = config.policy.allow_family_flows;
  const allowFamilyJoin = allowFamily && isToggleEnabled(config.policy.enabled_account_modes, 'family_join');
  const allowFamilyOwner = allowFamily && isToggleEnabled(config.policy.enabled_account_modes, 'family_owner');
  const accountStep: OnboardingStep[] = hasAccount ? [] : ['signup'];
  if (state.accountMode === 'family_join' && allowFamilyJoin) {
    return [...prefix, 'inviteCode', ...middle, state.safetyFlag === 'severe' ? 'safety' : 'reframe', ...accountStep, 'reminders', 'complete'];
  }
  if (state.accountMode === 'family_owner' && allowFamilyOwner) {
    return [...prefix, 'accountMode', ...middle, state.safetyFlag === 'severe' ? 'safety' : 'reframe', ...accountStep, 'familySetup', 'childProfile', 'guardianConsent', 'reminders', 'complete'];
  }
  return [...prefix, 'accountMode', ...middle, state.safetyFlag === 'severe' ? 'safety' : 'reframe', ...accountStep, 'reminders', 'complete'];
}

function detectSafety(text: string): 'none' | 'moderate' | 'severe' {
  const normalized = text.toLowerCase();
  if (dangerKeywords.some(keyword => normalized.includes(keyword))) return 'severe';
  if (moderateSafetyKeywords.some(keyword => normalized.includes(keyword))) return 'moderate';
  return 'none';
}

function detectPattern(text: string): string {
  const normalized = text.toLowerCase();
  if (/(always|never|ruined|impossible)/.test(normalized)) return 'all-or-nothing';
  if (/(they think|judging me|everyone thinks)/.test(normalized)) return 'mind reading';
  if (/(useless|failure|stupid)/.test(normalized)) return 'labeling';
  if (/(disaster|everything will go wrong)/.test(normalized)) return 'catastrophizing';
  return 'general reflection';
}

function buildReframe(state: OnboardingState) {
  const concise = state.noise >= 8 || state.userType === 'teen';
  const goal = state.primaryGoal;
  const thought = state.firstThought || 'I keep overthinking everything.';
  let perspective = 'A first reaction is not always the full picture. There may be a more balanced explanation available.';
  let nextStep = 'Pause, write one fact that supports the thought, and one fact that does not.';

  if (goal === 'friendships_social') {
    perspective = 'A few distant interactions do not prove everyone feels the same way. Some people take time to warm up or may have been preoccupied.';
    nextStep = 'Notice three social interactions before deciding what the whole situation means.';
  } else if (goal === 'focus_procrastination') {
    perspective = 'The task may feel huge because your mind is holding the whole project at once, not because you cannot do it.';
    nextStep = 'Choose a 10-minute starter task and stop there if needed.';
  } else if (goal === 'parenting_support') {
    perspective = 'A child’s behavior in one moment does not define who they are. Behavior often points to emotion, skill gaps, or unmet needs.';
    nextStep = 'Notice what happened right before the behavior and what your child may have wanted in that moment.';
  } else if (goal === 'child_behavior_support') {
    perspective = 'This may be less about your child being difficult and more about how they are trying to manage discomfort, attention, or frustration.';
    nextStep = 'Watch one interaction today and note the trigger, what your child wanted, and how the other person reacted.';
  } else if (goal === 'confidence') {
    perspective = 'Feeling unsure does not mean you are not capable. Confidence often grows after action, not before it.';
    nextStep = 'Take one small action that a more confident version of you would still be able to do today.';
  }

  if (state.coachStyle === 'practical') {
    perspective = `Most useful view: ${perspective}`;
  } else if (state.coachStyle === 'gentle') {
    perspective = `It makes sense this feels heavy. ${perspective}`;
  } else if (state.coachStyle === 'encouraging') {
    perspective = `You are not stuck with this first interpretation. ${perspective}`;
  } else if (state.coachStyle === 'strategic') {
    perspective = `Pattern check: ${detectPattern(thought)}. ${perspective}`;
  }

  return {
    thought,
    reframeText: concise ? perspective.slice(0, 180) : perspective,
    nextStepText: concise ? nextStep.slice(0, 120) : nextStep,
    questionText: concise ? 'What is one other explanation that could also be true here?' : 'What facts support this thought, and what facts point to a different explanation?',
    reframeTitle: 'A different way to look at it',
    nextStepTitle: 'Try this next',
    questionTitle: 'One question to test it',
    patternLabel: detectPattern(thought),
    configVersion: 'local-fallback',
    fallbackUsed: true,
  };
}

function normalizeGoal(goal: GoalId): string {
  switch (goal) {
    case 'friendships_social':
      return 'friendships';
    case 'focus_procrastination':
      return 'focus';
    case 'family_communication':
      return 'family_conflict';
    case 'parenting_support':
    case 'child_behavior_support':
      return 'parenting';
    case 'better_decisions':
      return 'confidence';
    case 'emotional_balance':
      return 'stress';
    default:
      return goal || 'overthinking';
  }
}

function goalFromNormalized(goal: string): GoalId {
  switch (goal) {
    case 'friendships':
      return 'friendships_social';
    case 'focus':
      return 'focus_procrastination';
    case 'family_conflict':
      return 'family_communication';
    case 'parenting':
      return 'parenting_support';
    case 'stress':
      return 'emotional_balance';
    default:
      return (goal as GoalId) || '';
  }
}

function normalizeUserType(userType: UserType): 'adult' | 'teen' | 'guardian' {
  if (userType === 'teen') return 'teen';
  if (userType === 'guardian' || userType === 'child_with_guardian') return 'guardian';
  return 'adult';
}

function normalizeAgeBand(ageBand: AgeBand): string | null {
  if (!ageBand) return null;
  return ageBand.replace('-', '_');
}

function normalizeVisibilityRule(rule: VisibilityRule): string | null {
  if (rule === 'Safety-only alerts') return 'summary_only';
  if (rule === 'Weekly summary') return 'summary_only';
  if (rule === 'Full guardian visibility') return 'full_visibility';
  return null;
}

function normalizeTopicRestrictions(topicRestriction: TopicRestriction): string[] {
  if (!topicRestriction) return [];
  if (topicRestriction === 'Guided topics only') return ['guided_topics_only'];
  if (topicRestriction === 'Limit sensitive topics') return ['limit_sensitive_topics'];
  if (topicRestriction === 'No open chat') return ['no_open_chat'];
  return [];
}

function mapTimeLimitToMinutes(timeLimit: TimeLimit): number {
  if (timeLimit === '10 min') return 10;
  if (timeLimit === '15 min') return 15;
  if (timeLimit === '20 min') return 20;
  return 20;
}

function toPersistedState(state: OnboardingState): PersistedOnboardingState {
  return {
    account_mode: state.accountMode,
    invite_code: state.inviteCode,
    invite_validated: state.inviteValidated,
    user_type: state.userType,
    primary_goal: normalizeGoal(state.primaryGoal),
    secondary_goals: state.secondaryGoals.map(item => normalizeGoal(item)),
    clarity: state.clarity,
    control: state.control,
    noise: state.noise,
    readiness: state.readiness,
    coach_style: state.coachStyle,
    first_thought: state.firstThought,
    safety_flag: state.safetyFlag,
    full_name: state.fullName,
    email: state.email,
    reminder_preference: state.reminderPreference,
    child_display_name: state.childDisplayName,
    child_age_band: state.childAgeBand,
    daily_time_limit: state.dailyTimeLimit,
    topic_restrictions: state.topicRestrictions,
    visibility_rule: state.visibilityRule,
    guardian_consent: state.guardianConsent,
    onboarding_complete: state.onboardingComplete,
    language: state.language,
    country: state.country,
    first_reframe_snapshot: {},
  };
}

function fromPersistedState(raw?: Partial<PersistedOnboardingState> | null): OnboardingState {
  if (!raw) return initialOnboardingState;
  const primaryGoal = goalFromNormalized(raw.primary_goal || '');
  const normalizedSecondaryGoals = (raw.secondary_goals || [])
    .map(goal => goalFromNormalized(goal))
    .filter((goal): goal is GoalId => Boolean(goal) && goal !== primaryGoal)
    .slice(0, 2);

  return {
    accountMode: (raw.account_mode as AccountMode) || '',
    inviteCode: raw.invite_code || '',
    inviteValidated: !!raw.invite_validated,
    userType: (raw.user_type as UserType) || '',
    primaryGoal,
    secondaryGoals: normalizedSecondaryGoals,
    clarity: raw.clarity || 0,
    control: raw.control || 0,
    noise: raw.noise || 0,
    readiness: raw.readiness || 0,
    coachStyle: (raw.coach_style as CoachStyle) || '',
    firstThought: raw.first_thought || '',
    safetyFlag: (raw.safety_flag as 'none' | 'moderate' | 'severe') || 'none',
    fullName: raw.full_name || '',
    email: raw.email || '',
    password: '',
    reminderPreference: (raw.reminder_preference as ReminderPreference) || '',
    childDisplayName: raw.child_display_name || '',
    childAgeBand: (raw.child_age_band as AgeBand) || '',
    dailyTimeLimit: (raw.daily_time_limit as TimeLimit) || '',
    topicRestrictions: (raw.topic_restrictions as TopicRestriction) || '',
    visibilityRule: (raw.visibility_rule as VisibilityRule) || '',
    guardianConsent: !!raw.guardian_consent,
    onboardingComplete: !!raw.onboarding_complete,
    language: (raw.language as 'en' | 'hinglish') || 'en',
    country: raw.country || 'IN',
  };
}

function fromPersistedFirstReframe(snapshot?: Record<string, unknown> | null): GeneratedReframe | null {
  if (!snapshot) return null;
  const thought = String(snapshot.user_thought ?? snapshot.thought ?? '').trim();
  const reframeText = String(snapshot.reframe_text ?? snapshot.reframeText ?? '').trim();
  const nextStepText = String(snapshot.next_step_text ?? snapshot.nextStepText ?? '').trim();
  const questionText = String(snapshot.question_text ?? snapshot.questionText ?? '').trim();
  if (!thought || !reframeText || !nextStepText || !questionText) return null;

  return {
    thought,
    patternLabel: typeof snapshot.pattern_label === 'string' ? snapshot.pattern_label : typeof snapshot.patternLabel === 'string' ? snapshot.patternLabel : undefined,
    reframeTitle: typeof snapshot.reframe_title === 'string' ? snapshot.reframe_title : typeof snapshot.reframeTitle === 'string' ? snapshot.reframeTitle : 'A different way to look at it',
    reframeText,
    nextStepTitle: typeof snapshot.next_step_title === 'string' ? snapshot.next_step_title : typeof snapshot.nextStepTitle === 'string' ? snapshot.nextStepTitle : 'Try this next',
    nextStepText,
    questionTitle: typeof snapshot.question_title === 'string' ? snapshot.question_title : typeof snapshot.questionTitle === 'string' ? snapshot.questionTitle : 'One question to test it',
    questionText,
    configVersion: typeof snapshot.config_version === 'string' ? snapshot.config_version : typeof snapshot.configVersion === 'string' ? snapshot.configVersion : undefined,
    fallbackUsed: Boolean(snapshot.fallback_used ?? snapshot.fallbackUsed),
  };
}

function loadLocalDraft(): {step: OnboardingStep; state: OnboardingState} | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem(ONBOARDING_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {step: OnboardingStep; state: Partial<PersistedOnboardingState>};
    return {step: parsed.step || 'welcome', state: fromPersistedState(parsed.state)};
  } catch {
    return null;
  }
}

function saveLocalDraft(step: OnboardingStep, state: OnboardingState) {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.localStorage) return;
  window.localStorage.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify({step, state: toPersistedState(state)}));
}

function clearLocalDraft() {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.localStorage) return;
  window.localStorage.removeItem(ONBOARDING_DRAFT_KEY);
}

async function loadAppSession(): Promise<{token: string; activeTab: TabId} | null> {
  try {
    const raw = await readSessionValue(APP_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {token?: string; activeTab?: TabId};
    if (!parsed.token) return null;
    return {
      token: parsed.token,
      activeTab: parsed.activeTab || 'home',
    };
  } catch {
    return null;
  }
}

async function saveAppSession(token: string, activeTab: TabId) {
  await writeSessionValue(APP_SESSION_KEY, JSON.stringify({token, activeTab}));
}

async function clearAppSession() {
  await removeSessionValue(APP_SESSION_KEY);
}

function validateEmail(email: string) {
  return /\S+@\S+\.\S+/.test(email);
}

function suggestedReminder(state: OnboardingState): ReminderPreference {
  if (state.primaryGoal === 'focus_procrastination') return 'daily';
  if (state.noise >= 8) return 'few_times_week';
  return 'few_times_week';
}

function defaultCoachStyle(state: OnboardingState): CoachStyle {
  if (state.noise >= 8) return 'gentle';
  if (state.primaryGoal === 'parenting_support' || state.primaryGoal === 'focus_procrastination') return 'practical';
  if (state.primaryGoal === 'better_decisions') return 'strategic';
  if (state.primaryGoal === 'confidence') return 'encouraging';
  return 'gentle';
}

function getScreenCopy(config: OnboardingConfig, key: string): ScreenCopy | null {
  return config.text.find(item => item.key === key) ?? null;
}

function Icon({name, size = 18, color = '#4b5563', stroke = 1.8}: {name: IconName; size?: number; color?: string; stroke?: number}) {
  const quarter = size / 4;
  const circle = {width: size * 0.28, height: size * 0.28, borderRadius: 999, borderWidth: stroke, borderColor: color} as const;
  switch (name) {
    case 'sparkles':
    case 'plus':
      return (
        <View style={{width: size, height: size, alignItems: 'center', justifyContent: 'center'}}>
          <View style={[styles.absCenter, {width: stroke, height: size, backgroundColor: color, borderRadius: 999}]} />
          <View style={[styles.absCenter, {width: size, height: stroke, backgroundColor: color, borderRadius: 999}]} />
          {name === 'sparkles' ? (
            <>
              <View style={[styles.absCenter, {width: stroke, height: size * 0.72, backgroundColor: color, transform: [{rotate: '45deg'}]}]} />
              <View style={[styles.absCenter, {width: stroke, height: size * 0.72, backgroundColor: color, transform: [{rotate: '-45deg'}]}]} />
            </>
          ) : null}
        </View>
      );
    case 'arrowRight':
    case 'arrowLeft':
      return (
        <View style={{width: size, height: size, alignItems: 'center', justifyContent: 'center'}}>
          <View style={{width: size * 0.55, height: stroke, backgroundColor: color, borderRadius: 999}} />
          <View
            style={{
              position: 'absolute',
              right: name === 'arrowRight' ? size * 0.16 : undefined,
              left: name === 'arrowLeft' ? size * 0.16 : undefined,
              width: size * 0.24,
              height: size * 0.24,
              borderTopWidth: name === 'arrowRight' ? stroke : 0,
              borderRightWidth: name === 'arrowRight' ? stroke : 0,
              borderLeftWidth: name === 'arrowLeft' ? stroke : 0,
              borderBottomWidth: name === 'arrowLeft' ? stroke : 0,
              borderColor: color,
              transform: [{rotate: '45deg'}],
            }}
          />
        </View>
      );
    case 'check':
      return <View style={{width: size * 0.55, height: size * 0.28, borderLeftWidth: stroke, borderBottomWidth: stroke, borderColor: color, transform: [{rotate: '-45deg'}]}} />;
    case 'badge':
      return (
        <View style={{width: size, height: size, alignItems: 'center', justifyContent: 'center'}}>
          <View style={{width: size * 0.74, height: size * 0.74, borderRadius: 16, borderWidth: stroke, borderColor: color}} />
          <View style={[styles.absCenter, {width: size * 0.28, height: size * 0.16, borderLeftWidth: stroke, borderBottomWidth: stroke, borderColor: color, transform: [{rotate: '-45deg'}]}]} />
        </View>
      );
    case 'bell':
      return (
        <View style={{width: size, height: size, alignItems: 'center'}}>
          <View style={{width: size * 0.7, height: size * 0.58, borderWidth: stroke, borderColor: color, borderTopLeftRadius: size, borderTopRightRadius: size, marginTop: size * 0.12}} />
          <View style={{width: size * 0.9, height: stroke, backgroundColor: color, borderRadius: 999, marginTop: size * 0.06}} />
          <View style={{width: size * 0.15, height: size * 0.15, borderRadius: 999, backgroundColor: color, marginTop: size * 0.04}} />
        </View>
      );
    case 'home':
      return (
        <View style={{width: size, height: size}}>
          <View style={{position: 'absolute', top: size * 0.04, left: size * 0.18, width: size * 0.64, height: size * 0.64, borderLeftWidth: stroke, borderTopWidth: stroke, borderColor: color, transform: [{rotate: '45deg'}]}} />
          <View style={{position: 'absolute', bottom: size * 0.08, left: size * 0.18, width: size * 0.64, height: size * 0.42, borderWidth: stroke, borderColor: color, borderRadius: size * 0.1}} />
        </View>
      );
    case 'chat':
      return (
        <View style={{width: size, height: size * 0.78, borderWidth: stroke, borderColor: color, borderRadius: size * 0.28, justifyContent: 'center', paddingHorizontal: size * 0.18}}>
          <View style={{width: size * 0.45, height: stroke, backgroundColor: color, borderRadius: 999, marginBottom: size * 0.08}} />
          <View style={{width: size * 0.32, height: stroke, backgroundColor: color, borderRadius: 999}} />
          <View style={{position: 'absolute', bottom: -size * 0.08, left: size * 0.18, width: size * 0.22, height: size * 0.22, borderLeftWidth: stroke, borderBottomWidth: stroke, borderColor: color, backgroundColor: '#fff', transform: [{rotate: '-45deg'}]}} />
        </View>
      );
    case 'heart':
      return <Text style={{fontSize: size, color, lineHeight: size}}>{'\u2661'}</Text>;
    case 'users':
      return (
        <View style={{width: size, height: size, justifyContent: 'center'}}>
          <View style={{flexDirection: 'row', justifyContent: 'center', gap: size * 0.08}}>
            <View style={circle} />
            <View style={circle} />
          </View>
          <View style={{flexDirection: 'row', justifyContent: 'center', gap: size * 0.06, marginTop: size * 0.08}}>
            <View style={{width: size * 0.34, height: size * 0.18, borderRadius: 999, borderWidth: stroke, borderColor: color}} />
            <View style={{width: size * 0.34, height: size * 0.18, borderRadius: 999, borderWidth: stroke, borderColor: color}} />
          </View>
        </View>
      );
    case 'user':
    case 'login':
    case 'baby':
      return (
        <View style={{width: size, height: size, alignItems: 'center', justifyContent: 'center'}}>
          <View style={{width: size * 0.34, height: size * 0.34, borderRadius: 999, borderWidth: stroke, borderColor: color}} />
          <View style={{width: size * 0.62, height: size * 0.26, borderRadius: 999, borderWidth: stroke, borderColor: color, marginTop: size * 0.12}} />
          {name === 'baby' ? <View style={[styles.absCenter, {top: size * 0.12, width: size * 0.12, height: size * 0.12, borderRadius: 999, backgroundColor: color}]} /> : null}
          {name === 'login' ? <View style={{position: 'absolute', right: 0, width: size * 0.2, height: stroke, backgroundColor: color}} /> : null}
        </View>
      );
    case 'smile':
      return <Text style={{fontSize: size, color, lineHeight: size}}>{'\u263A'}</Text>;
    case 'clock':
    case 'timer':
      return (
        <View style={{width: size, height: size, borderRadius: 999, borderWidth: stroke, borderColor: color, alignItems: 'center', justifyContent: 'center'}}>
          <View style={[styles.absCenter, {width: stroke, height: size * 0.24, backgroundColor: color, top: size * 0.22}]} />
          <View style={[styles.absCenter, {width: size * 0.22, height: stroke, backgroundColor: color, top: size * 0.48, left: size * 0.5, transform: [{rotate: '35deg'}]}]} />
        </View>
      );
    case 'brain':
      return (
        <View style={{width: size, height: size, alignItems: 'center', justifyContent: 'center'}}>
          <View style={{width: size * 0.78, height: size * 0.62, borderRadius: size * 0.26, borderWidth: stroke, borderColor: color}} />
          <View style={[styles.absCenter, {width: stroke, height: size * 0.5, backgroundColor: color}]} />
          <View style={[styles.absCenter, {width: size * 0.5, height: stroke, backgroundColor: color, top: size * 0.38}]} />
        </View>
      );
    case 'play':
      return (
        <View style={{width: size, height: size, borderRadius: 999, borderWidth: stroke, borderColor: color, alignItems: 'center', justifyContent: 'center'}}>
          <View style={{width: 0, height: 0, borderTopWidth: quarter, borderBottomWidth: quarter, borderLeftWidth: size * 0.32, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: color, marginLeft: size * 0.1}} />
        </View>
      );
    case 'book':
    case 'bookmark':
      return (
        <View style={{width: size, height: size, alignItems: 'center', justifyContent: 'center'}}>
          <View style={{width: size * 0.62, height: size * 0.76, borderWidth: stroke, borderColor: color, borderRadius: size * 0.08}} />
          {name === 'bookmark' ? <View style={{position: 'absolute', top: size * 0.18, width: size * 0.18, height: size * 0.24, backgroundColor: color}} /> : null}
        </View>
      );
    case 'moon':
      return (
        <View style={{width: size, height: size}}>
          <View style={{width: size * 0.72, height: size * 0.72, borderRadius: 999, borderWidth: stroke, borderColor: color, marginTop: size * 0.08, marginLeft: size * 0.16}} />
          <View style={[styles.absCenter, {width: size * 0.6, height: size * 0.6, borderRadius: 999, backgroundColor: '#fff3f8', top: size * 0.08, left: size * 0.62}]} />
        </View>
      );
    case 'sun':
      return (
        <View style={{width: size, height: size, alignItems: 'center', justifyContent: 'center'}}>
          <View style={{width: size * 0.38, height: size * 0.38, borderRadius: 999, borderWidth: stroke, borderColor: color}} />
          {['0deg', '45deg', '90deg', '135deg'].map(rotation => (
            <View key={rotation} style={[styles.absCenter, {width: stroke, height: size, backgroundColor: color, transform: [{rotate: rotation}]}]} />
          ))}
        </View>
      );
    case 'shield':
    case 'shieldCheck':
      return (
        <View style={{width: size * 0.74, height: size * 0.86, borderWidth: stroke, borderColor: color, borderTopLeftRadius: size * 0.3, borderTopRightRadius: size * 0.3, borderBottomLeftRadius: size * 0.42, borderBottomRightRadius: size * 0.42, alignItems: 'center', justifyContent: 'center'}}>
          {name === 'shieldCheck' ? <Icon name="check" size={size * 0.38} color={color} stroke={stroke} /> : null}
        </View>
      );
    case 'chart':
      return (
        <View style={{width: size, height: size, flexDirection: 'row', alignItems: 'flex-end', gap: size * 0.08}}>
          <View style={{width: size * 0.18, height: size * 0.34, backgroundColor: color, borderRadius: 999}} />
          <View style={{width: size * 0.18, height: size * 0.52, backgroundColor: color, borderRadius: 999}} />
          <View style={{width: size * 0.18, height: size * 0.72, backgroundColor: color, borderRadius: 999}} />
        </View>
      );
    case 'settings':
      return <Text style={{fontSize: size, color, lineHeight: size}}>{'\u2699'}</Text>;
    case 'lock':
      return (
        <View style={{width: size, height: size}}>
          <View style={{width: size * 0.44, height: size * 0.28, borderWidth: stroke, borderColor: color, borderBottomWidth: 0, borderTopLeftRadius: size * 0.2, borderTopRightRadius: size * 0.2, alignSelf: 'center', marginTop: size * 0.02}} />
          <View style={{width: size * 0.64, height: size * 0.44, borderWidth: stroke, borderColor: color, borderRadius: size * 0.14, alignSelf: 'center', marginTop: -stroke}} />
        </View>
      );
    case 'mail':
      return (
        <View style={{width: size, height: size * 0.72, borderWidth: stroke, borderColor: color, borderRadius: size * 0.1}}>
          <View style={{position: 'absolute', top: size * 0.1, left: size * 0.12, width: size * 0.5, height: size * 0.5, borderLeftWidth: stroke, borderBottomWidth: stroke, borderColor: color, transform: [{rotate: '-45deg'}]}} />
          <View style={{position: 'absolute', top: size * 0.1, right: size * 0.12, width: size * 0.5, height: size * 0.5, borderRightWidth: stroke, borderBottomWidth: stroke, borderColor: color, transform: [{rotate: '45deg'}]}} />
        </View>
      );
    case 'alert':
      return (
        <View style={{width: size, height: size, alignItems: 'center', justifyContent: 'center'}}>
          <View style={{width: 0, height: 0, borderLeftWidth: size * 0.36, borderRightWidth: size * 0.36, borderBottomWidth: size * 0.68, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: color}} />
          <View style={[styles.absCenter, {width: stroke, height: size * 0.18, backgroundColor: '#fff', top: size * 0.44}]} />
        </View>
      );
    case 'wand':
      return (
        <View style={{width: size, height: size}}>
          <View style={{position: 'absolute', top: size * 0.18, left: size * 0.22, width: stroke, height: size * 0.62, backgroundColor: color, transform: [{rotate: '45deg'}]}} />
          <View style={{position: 'absolute', top: 0, right: size * 0.04}}><Icon name="sparkles" size={size * 0.44} color={color} stroke={stroke} /></View>
        </View>
      );
    case 'target':
      return (
        <View style={{width: size, height: size, alignItems: 'center', justifyContent: 'center'}}>
          <View style={{width: size * 0.82, height: size * 0.82, borderRadius: 999, borderWidth: stroke, borderColor: color}} />
          <View style={[styles.absCenter, {width: size * 0.42, height: size * 0.42, borderRadius: 999, borderWidth: stroke, borderColor: color}]} />
          <View style={[styles.absCenter, {width: size * 0.12, height: size * 0.12, borderRadius: 999, backgroundColor: color}]} />
        </View>
      );
    case 'compass':
      return (
        <View style={{width: size, height: size, borderRadius: 999, borderWidth: stroke, borderColor: color, alignItems: 'center', justifyContent: 'center'}}>
          <View style={{width: 0, height: 0, borderLeftWidth: size * 0.12, borderRightWidth: size * 0.12, borderBottomWidth: size * 0.3, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: color, transform: [{rotate: '20deg'}]}} />
        </View>
      );
    case 'refresh':
      return <Text style={{fontSize: size, color, lineHeight: size}}>{'\u21BB'}</Text>;
    case 'eye':
      return (
        <View style={{width: size, height: size * 0.62, borderWidth: stroke, borderColor: color, borderRadius: size}}>
          <View style={[styles.absCenter, {width: size * 0.18, height: size * 0.18, borderRadius: 999, backgroundColor: color}]} />
        </View>
      );
    case 'phone':
      return (
        <View style={{width: size * 0.56, height: size * 0.82, borderWidth: stroke, borderColor: color, borderRadius: size * 0.12, alignItems: 'center'}}>
          <View style={{width: size * 0.14, height: stroke, backgroundColor: color, marginTop: size * 0.08}} />
        </View>
      );
    case 'panel':
      return (
        <View style={{width: size, height: size, flexDirection: 'row', gap: stroke}}>
          <View style={{flex: 1, borderWidth: stroke, borderColor: color, borderRadius: size * 0.08}} />
          <View style={{width: size * 0.22, borderWidth: stroke, borderColor: color, borderRadius: size * 0.08}} />
        </View>
      );
    case 'footprints':
      return (
        <View style={{width: size, height: size, flexDirection: 'row', justifyContent: 'center', gap: size * 0.12, alignItems: 'center'}}>
          <View style={{width: size * 0.22, height: size * 0.4, borderRadius: 999, borderWidth: stroke, borderColor: color}} />
          <View style={{width: size * 0.22, height: size * 0.4, borderRadius: 999, borderWidth: stroke, borderColor: color, marginTop: size * 0.18}} />
        </View>
      );
    case 'calendar':
      return (
        <View style={{width: size, height: size * 0.82, borderWidth: stroke, borderColor: color, borderRadius: size * 0.1}}>
          <View style={{width: '100%', height: stroke, backgroundColor: color, marginTop: size * 0.22}} />
          <View style={{position: 'absolute', top: -size * 0.06, left: size * 0.18, width: stroke, height: size * 0.18, backgroundColor: color}} />
          <View style={{position: 'absolute', top: -size * 0.06, right: size * 0.18, width: stroke, height: size * 0.18, backgroundColor: color}} />
        </View>
      );
  }
}

function Shell({
  title,
  subtitle,
  showBack = false,
  onBack,
  rightSlot,
  children,
}: {
  title: string;
  subtitle: string;
  showBack?: boolean;
  onBack?: () => void;
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.appShell}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            {showBack ? (
              <View style={styles.headerLeadGroup}>
                <Pressable style={styles.backButton} onPress={onBack}>
                  <Icon name="arrowLeft" size={16} color="#374151" />
                </Pressable>
                <View style={styles.logoBadgeSmall}>
                  <Icon name="sparkles" size={16} color="#ffffff" />
                </View>
              </View>
            ) : (
              <View style={styles.logoBadge}>
                <Icon name="sparkles" size={18} color="#ffffff" />
              </View>
            )}
            <View style={styles.headerTextWrap}>
              <Text style={styles.headerTitle}>{title}</Text>
              <Text style={styles.headerSubtitle}>{subtitle}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>{rightSlot ?? <Icon name="bell" size={18} color="#6b7280" />}</View>
        </View>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function Badge({label, tone = 'violet'}: {label: string; tone?: 'violet' | 'emerald' | 'white'}) {
  const bg = tone === 'emerald' ? '#dcfce7' : tone === 'white' ? '#ffffff' : '#ede9fe';
  const fg = tone === 'emerald' ? '#047857' : '#7c3aed';
  return (
    <View style={[styles.badge, {backgroundColor: bg}]}>
      <Text style={[styles.badgeText, {color: fg}]}>{label}</Text>
    </View>
  );
}

function createCoachSummary(state: OnboardingState, messages: CoachMessage[]): CoachSummary {
  const firstUserMessage = messages.find(message => message.from === 'user')?.text || state.firstThought;
  const patternLabel = detectPattern(firstUserMessage || '');
  const sessionGoal =
    patternLabel === 'mind reading'
      ? 'Test the story you are telling yourself and look for another explanation'
      : patternLabel === 'all-or-nothing'
        ? 'Loosen the extreme conclusion and find a more balanced view'
        : patternLabel === 'catastrophizing'
          ? 'Separate what feels scary from what is actually most likely'
          : 'Slow the thought down and choose one grounded next step';
  const fallbackReframe = buildReframe(state);
  const nextStep = fallbackReframe.nextStepText;
  const userTurns = messages.filter(message => message.from === 'user').length;
  const timeLabel = userTurns >= 3 ? '8 min left' : userTurns >= 1 ? '6 min left' : '7 min';
  return {patternLabel, sessionGoal, nextStep, timeLabel};
}

function mapThreadMessage(message: ChatThreadMessage): CoachMessage {
  return {
    id: String(message.id),
    from: message.role === 'assistant' ? 'bot' : 'user',
    text: message.content,
    createdAt: message.created_at,
  };
}

function buildCoachStarter(state: OnboardingState, reframe: GeneratedReframe | null): CoachMessage[] {
  const starter = reframe?.thought || state.firstThought || '';
  const messages: CoachMessage[] = [
    {
      id: 'starter-bot',
      from: 'bot',
      text: `Hi, I’m your ReframeQ guide. What feels most difficult right now?`,
    },
  ];

  if (starter.trim()) {
    messages.push({
      id: 'starter-user',
      from: 'user',
      text: starter.trim(),
    });
    messages.push({
      id: 'starter-reframe',
      from: 'bot',
      text: reframe?.reframeText || buildReframe(state).reframeText,
    });
    messages.push({
      id: 'starter-question',
      from: 'bot',
      text: reframe?.questionText || buildReframe(state).questionText,
    });
  }

  return messages;
}

function buildReflectionDraft(patternLabel: string, prompt: string): string {
  if (prompt === 'What evidence do I actually have for this?') {
    return 'The thought I want to test is: \nEvidence that supports it: \nEvidence that does not support it: ';
  }
  if (prompt === 'What is one other explanation?') {
    return 'My first interpretation is: \nAnother possible explanation could be: ';
  }
  return `Pattern I am noticing: ${patternLabel}\nNext step I can try: `;
}

function SectionTitle({title, action}: {title: string; action?: string}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? <Text style={styles.sectionLink}>{action}</Text> : null}
    </View>
  );
}

function ChoiceCard({
  active,
  title,
  desc,
  icon,
  onPress,
}: {
  active: boolean;
  title: string;
  desc?: string;
  icon?: IconName;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.selectCard, active && styles.selectCardActive]}>
      {icon ? (
        <View style={[styles.selectIconWrap, active && styles.selectIconWrapActive]}>
          <Icon name={icon} size={18} color={active ? '#7c3aed' : '#4b5563'} />
        </View>
      ) : null}
      <View style={{flex: 1}}>
        <Text style={styles.listCardTitle}>{title}</Text>
        {desc ? <Text style={styles.listCardBody}>{desc}</Text> : null}
      </View>
      {active ? <Icon name="badge" size={18} color="#7c3aed" /> : null}
    </Pressable>
  );
}

function SliderInput({label, value, onChange, required = true}: {label: string; value: number; onChange: (value: number) => void; required?: boolean}) {
  return (
    <View style={styles.sliderCard}>
      <Text style={styles.goalTitle}>
        {label}
        {!required ? ' (optional)' : ''}
      </Text>
      <View style={styles.numberRow}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(item => (
          <Pressable key={item} onPress={() => onChange(item)} style={[styles.numberDot, value === item && styles.numberDotActive]}>
            <Text style={[styles.numberDotText, value === item && styles.numberDotTextActive]}>{item}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  secure = false,
  multiline = false,
  editable = true,
  autoCapitalize = 'sentences',
  onSubmitEditing,
  returnKeyType,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  secure?: boolean;
  multiline?: boolean;
  editable?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  onSubmitEditing?: () => void;
  returnKeyType?: 'done' | 'next' | 'go' | 'send';
}) {
  return (
    <View style={styles.inputBlock}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        secureTextEntry={secure}
        multiline={multiline}
        editable={editable}
        autoCapitalize={autoCapitalize}
        onSubmitEditing={onSubmitEditing}
        returnKeyType={returnKeyType}
        blurOnSubmit={!multiline}
        placeholderTextColor="#9ca3af"
        style={[styles.input, multiline && styles.textarea, !editable && styles.inputDisabled]}
      />
    </View>
  );
}

function InlineSelect({
  label,
  value,
  placeholder,
  onToggle,
}: {
  label: string;
  value: string;
  placeholder: string;
  onToggle: () => void;
}) {
  return (
    <View style={styles.inputBlock}>
      <Text style={styles.inputLabel}>{label}</Text>
      <Pressable style={styles.inlineSelectButton} onPress={onToggle}>
        <Text numberOfLines={1} style={[styles.inlineSelectValue, !value && styles.inlineSelectPlaceholder]}>
          {value || placeholder}
        </Text>
        <Icon name="arrowRight" size={12} color="#6d28d9" />
      </Pressable>
    </View>
  );
}

function SelectionSheet({
  visible,
  title,
  value,
  options,
  onClose,
  onSelect,
}: {
  visible: boolean;
  title: string;
  value: string;
  options: string[];
  onClose: () => void;
  onSelect: (value: string) => void;
}) {
  useEffect(() => {
    if (visible) {
      Keyboard.dismiss();
    }
  }, [visible]);

  function handleClose() {
    Keyboard.dismiss();
    onClose();
  }

  function handleSelect(nextValue: string) {
    Keyboard.dismiss();
    onSelect(nextValue);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.sheetBackdrop}>
        <Pressable style={styles.sheetScrim} onPress={handleClose} />
        <View style={styles.sheetCard}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{title}</Text>
            <Pressable onPress={handleClose} style={styles.sheetCloseButton}>
              <Text style={styles.sheetCloseText}>Close</Text>
            </Pressable>
          </View>
          <ScrollView
            style={styles.sheetList}
            contentContainerStyle={styles.sheetListContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            {options.map(option => (
              <Pressable
                key={option}
                style={[styles.sheetOption, value === option && styles.sheetOptionActive]}
                onPress={() => handleSelect(option)}>
                <Text style={[styles.sheetOptionText, value === option && styles.sheetOptionTextActive]}>{option}</Text>
                {value === option ? <Icon name="check" size={14} color="#6d28d9" /> : null}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function SplashScreen() {
  return (
    <SafeAreaView style={styles.splashSafe}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.splashWrap}>
        <View style={styles.splashLogo}>
          <Icon name="sparkles" size={34} color="#ffffff" />
        </View>
        <Text style={styles.splashTitle}>ReframeQ</Text>
        <Text style={styles.splashSubtitle}>
          Guided self-help for clearer thinking, calmer reactions, and better next steps
        </Text>
      </View>
    </SafeAreaView>
  );
}

function LandingScreen({
  onStart,
  onInvite,
  onLogin,
}: {
  onStart: () => void;
  onInvite: () => void;
  onLogin: () => void;
}) {
  const [activeCard, setActiveCard] = useState(0);
  const carouselCards = [
    {
      icon: 'brain' as const,
      title: 'Reframe difficult thoughts',
      body: 'Turn overwhelming thoughts into calmer, more balanced next steps.',
    },
    {
      icon: 'book' as const,
      title: 'Build calmer habits',
      body: 'Use short guided check-ins, reflection tools, and simple daily practices.',
    },
    {
      icon: 'shieldCheck' as const,
      title: 'Get family-safe support',
      body: 'Create child profiles, guardian controls, and guided support for everyday wellbeing.',
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.landingScrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.landingShell}>
          <View style={styles.landingTop}>
            <View style={styles.landingBrand}>
              <View style={styles.logoBadgeLarge}>
                <Icon name="sparkles" size={28} color="#ffffff" />
              </View>
              <Text style={styles.landingBrandText}>ReframeQ</Text>
            </View>
          </View>

          <View style={styles.landingCenter}>
            <View style={styles.landingArt}>
              <View style={styles.landingOrbPrimary} />
              <View style={styles.landingOrbSecondary} />
              <View style={styles.landingCardFloat}>
                <Icon name="brain" size={18} color="#7c3aed" />
                <Text style={styles.landingFloatText}>Calmer perspective</Text>
              </View>
            </View>

            <Text style={styles.landingHeadline}>When your thoughts feel heavy,{'\n'}start with one calmer perspective.</Text>

            <View style={styles.carouselCard}>
              <View style={styles.carouselHeaderRow}>
                <Pressable
                  onPress={() => setActiveCard(current => (current === 0 ? carouselCards.length - 1 : current - 1))}
                  style={styles.carouselArrow}>
                  <Icon name="arrowLeft" size={14} color="#7c3aed" />
                </Pressable>
                <View style={styles.carouselMain}>
                  <Text style={styles.carouselTitle}>{carouselCards[activeCard].title}</Text>
                  <Text style={styles.carouselBody}>{carouselCards[activeCard].body}</Text>
                </View>
                <Pressable
                  onPress={() => setActiveCard(current => (current === carouselCards.length - 1 ? 0 : current + 1))}
                  style={styles.carouselArrow}>
                  <Icon name="arrowRight" size={14} color="#7c3aed" />
                </Pressable>
              </View>
              <View style={styles.carouselDots}>
                {carouselCards.map((card, index) => (
                  <Pressable
                    key={card.title}
                    onPress={() => setActiveCard(index)}
                    style={[styles.carouselDot, activeCard === index && styles.carouselDotActive]}
                  />
                ))}
              </View>
            </View>

            <Text style={styles.landingTrustText}>Private, guided, and built for everyday wellbeing.</Text>
          </View>

          <View style={styles.landingBottom}>
            <Pressable style={styles.primaryButton} onPress={onStart}>
              <Text style={styles.primaryButtonText}>Get Started</Text>
            </Pressable>
            <Pressable style={styles.secondaryButton} onPress={onInvite}>
              <Text style={styles.secondaryButtonText}>I have a family invite</Text>
            </Pressable>
            <Pressable onPress={onLogin}>
              <Text style={styles.loginLink}>Already have an account? Log in</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function AuthScreen({
  email,
  password,
  error,
  onEmailChange,
  onPasswordChange,
  onLogin,
  onBack,
}: {
  email: string;
  password: string;
  error: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onLogin: () => void;
  onBack: () => void;
}) {
  return (
    <Shell title="Log in" subtitle="Continue where you left off" showBack onBack={onBack} rightSlot={null}>
      <View style={styles.cardList}>
        <Text style={styles.screenTitle}>Welcome back</Text>
        <Text style={styles.screenSubtitle}>Log in to open your saved space or resume onboarding.</Text>
        <TextField label="Email" value={email} onChange={onEmailChange} placeholder="you@example.com" autoCapitalize="none" returnKeyType="next" />
        <TextField label="Password" value={password} onChange={onPasswordChange} placeholder="Your password" secure autoCapitalize="none" onSubmitEditing={onLogin} returnKeyType="go" />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <Pressable style={styles.primaryButton} onPress={onLogin}>
          <Text style={styles.primaryButtonText}>Log in</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={onBack}>
          <Text style={styles.secondaryButtonText}>Back to home</Text>
        </Pressable>
      </View>
    </Shell>
  );
}

function HomeScreen({profile, authToken, onOpenReports}: {profile: RemoteAppProfile | null; authToken: string; onOpenReports: () => void}) {
  const [dashboard, setDashboard] = useState<HomeDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [selectedMoodId, setSelectedMoodId] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStatCard[]>([]);
  const [isSavingMood, setIsSavingMood] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      if (!authToken) {
        if (!active) return;
        setDashboard(null);
        setStats([]);
        setSelectedMoodId(null);
        return;
      }

      try {
        if (active) {
          setIsLoading(true);
          setLoadError('');
        }
        const next = await fetchHomeDashboard(authToken);
        if (!active) return;
        setDashboard(next);
        setStats(next.stats);
        setSelectedMoodId(next.mood_check.selected_mood_id ?? null);
      } catch (err) {
        if (!active) return;
        setLoadError(err instanceof Error ? err.message : 'Unable to load your home dashboard right now.');
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadDashboard();
    return () => {
      active = false;
    };
  }, [authToken]);

  async function handleMoodSelect(moodId: string) {
    if (!authToken || isSavingMood) return;
    const previousMoodId = selectedMoodId;
    setSelectedMoodId(moodId);
    setIsSavingMood(true);
    setLoadError('');

    try {
      const result = await saveMoodCheckin(authToken, moodId);
      setStats(result.stats);
      setDashboard(current =>
        current
          ? {
              ...current,
              mood_check: {
                ...current.mood_check,
                selected_mood_id: result.checkin.mood_id,
                selected_mood_label: result.checkin.mood_label,
                selected_at: result.checkin.selected_at,
              },
            }
          : current,
      );
    } catch (err) {
      setSelectedMoodId(previousMoodId);
      setLoadError(err instanceof Error ? err.message : 'Unable to save your check-in right now.');
    } finally {
      setIsSavingMood(false);
    }
  }

  const streakStat = stats.find(item => item.id === 'streak');
  const dailyGoalStat = stats.find(item => item.id === 'daily_goal');
  const moodCheck = dashboard?.mood_check;

  return (
    <Shell title={dashboard?.header.title || profile?.dashboard_title || 'ReframeQ'} subtitle={dashboard?.header.subtitle || profile?.dashboard_subtitle || 'A calmer day, one thought at a time'}>
      {isLoading && !dashboard ? <Text style={styles.screenSubtitle}>Loading your dashboard...</Text> : null}
      {loadError ? <Text style={styles.errorText}>{loadError}</Text> : null}
      <View style={styles.heroCard}>
        <View style={styles.rowSpace}>
          <View style={{flex: 1, paddingRight: 12}}>
            <Text style={styles.heroEyebrow}>{moodCheck?.title || "Today's check-in"}</Text>
            <Text style={styles.heroTitle}>{moodCheck?.prompt || 'How are you feeling?'}</Text>
            <Text style={styles.heroBody}>{moodCheck?.description || 'A quick mood check personalizes your self-help journey.'}</Text>
          </View>
          <View style={styles.heroIconBubble}>
            <Icon name="smile" size={24} color="#ffffff" />
          </View>
        </View>
        <View style={styles.moodGrid}>
          {(moodCheck?.options ?? []).map(option => (
            <Pressable
              key={option.id}
              style={[styles.moodButton, selectedMoodId === option.id && styles.moodButtonActive]}
              onPress={() => handleMoodSelect(option.id)}
            >
              <Text style={styles.moodEmoji}>{option.emoji}</Text>
              <Text style={styles.moodLabel}>{option.label}</Text>
            </Pressable>
          ))}
        </View>
        {isSavingMood ? <Text style={styles.heroMeta}>Saving your check-in...</Text> : null}
        {moodCheck?.selected_mood_label ? <Text style={styles.heroMeta}>Selected: {moodCheck.selected_mood_label}</Text> : null}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.softCardHalf}>
          <View style={styles.inlineIconRow}>
            <Icon name="check" size={14} color="#7c3aed" />
            <Text style={styles.statLabel}>Streak</Text>
          </View>
          <Text style={styles.statValue}>{streakStat?.value || '--'}</Text>
          <Text style={styles.statHint}>{streakStat?.hint || 'Consistency builds momentum.'}</Text>
        </View>
        <View style={styles.softCardHalf}>
          <View style={styles.inlineIconRow}>
            <Icon name="clock" size={14} color="#d946ef" />
            <Text style={[styles.statLabel, {color: '#d946ef'}]}>Daily goal</Text>
          </View>
          <Text style={styles.statValue}>{dailyGoalStat?.value || '--'}</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, {width: `${dailyGoalStat?.progress_percent || 0}%`}]} />
          </View>
          <Text style={styles.statHint}>{dailyGoalStat?.hint || 'Small sessions count.'}</Text>
        </View>
      </View>

      {dashboard?.mood_trend_preview ? (
        <View style={styles.softCard}>
          <View style={styles.rowSpace}>
            <View style={{flex: 1, paddingRight: 12}}>
              <Text style={styles.listCardTitle}>{dashboard.mood_trend_preview.title}</Text>
              <Text style={styles.listCardBody}>
                {dashboard.mood_trend_preview.summary.label} • {dashboard.mood_trend_preview.summary.detail}
              </Text>
            </View>
            <Pressable onPress={onOpenReports}>
              <Text style={styles.sectionLink}>{dashboard.mood_trend_preview.cta_label}</Text>
            </Pressable>
          </View>
          <MoodMiniChart points={dashboard.mood_trend_preview.points} />
        </View>
      ) : null}

      <SectionTitle title={dashboard?.focus_card.section_title || 'Resume where you left off'} />
      {dashboard?.focus_card ? (
        <View style={styles.softCard}>
          <View style={styles.rowSpace}>
            <View style={{flex: 1, paddingRight: 12}}>
              <Text style={styles.listCardTitle}>{dashboard.focus_card.title}</Text>
              <Text style={styles.listCardBody}>{dashboard.focus_card.hint}</Text>
            </View>
            <Badge label={dashboard.focus_card.tag} />
          </View>
          <View style={styles.resumeHintBox}>
            <Text style={styles.resumeHintText}>{dashboard.focus_card.next_step}</Text>
          </View>
        </View>
      ) : null}

      <SectionTitle title="Suggested for you" action="See all" />
      <View style={styles.cardList}>
        {(dashboard?.suggested_tools ?? []).map(item => (
          <View key={item.id} style={styles.listCard}>
            <View style={[styles.toolIconTile, {backgroundColor: item.tint_bg}]}>
              <Icon name={item.icon as IconName} size={18} color={item.tint} />
            </View>
            <View style={{flex: 1}}>
              <Text style={styles.listCardTitle}>{item.title}</Text>
              <Text style={styles.listCardBody}>{item.description}</Text>
            </View>
            <Icon name="arrowRight" size={16} color="#9ca3af" />
          </View>
        ))}
      </View>
    </Shell>
  );
}

function ReportsScreen({authToken, onBack}: {authToken: string; onBack: () => void}) {
  const [rangeDays, setRangeDays] = useState<7 | 14 | 30>(7);
  const [report, setReport] = useState<MoodReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function loadReport() {
      if (!authToken) return;
      try {
        if (active) {
          setLoading(true);
          setError('');
        }
        const next = await fetchMoodReport(authToken, rangeDays);
        if (!active) return;
        setReport(next);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Unable to load your report right now.');
      } finally {
        if (active) setLoading(false);
      }
    }
    loadReport();
    return () => {
      active = false;
    };
  }, [authToken, rangeDays]);

  return (
    <Shell title="Reports" subtitle="Track your mood patterns over time" showBack onBack={onBack}>
      <View style={styles.filterRow}>
        {[7, 14, 30].map(value => (
          <Pressable key={value} style={[styles.filterChip, rangeDays === value && styles.filterChipActive]} onPress={() => setRangeDays(value as 7 | 14 | 30)}>
            <Text style={[styles.filterChipText, rangeDays === value && styles.filterChipTextActive]}>{value === 14 ? '2 weeks' : `${value} days`}</Text>
          </Pressable>
        ))}
      </View>
      {loading && !report ? <Text style={styles.screenSubtitle}>Loading report...</Text> : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {report ? (
        <>
          <View style={styles.statsRow}>
            <View style={styles.softCardHalf}>
              <Text style={styles.statLabel}>Trend</Text>
              <Text style={styles.statValue}>{report.trend.label}</Text>
              <Text style={styles.statHint}>{report.trend.detail}</Text>
            </View>
            <View style={styles.softCardHalf}>
              <Text style={styles.statLabel}>Average mood</Text>
              <Text style={styles.statValue}>{report.summary.average_score.toFixed(1)} / 5</Text>
              <Text style={styles.statHint}>Latest: {report.summary.latest_mood || 'No data'}</Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.softCardHalf}>
              <Text style={styles.statLabel}>Streak</Text>
              <Text style={styles.statValue}>{report.summary.streak_days} days</Text>
              <Text style={styles.statHint}>Total check-ins: {report.summary.total_checkins}</Text>
            </View>
            <View style={styles.softCardHalf}>
              <Text style={styles.statLabel}>Pattern</Text>
              <Text style={styles.statValue}>{report.summary.average_mood}</Text>
              <Text style={styles.statHint}>Range: last {report.range_days} days</Text>
            </View>
          </View>
          <View style={styles.softCard}>
            <Text style={styles.listCardTitle}>Mood pattern</Text>
            <Text style={styles.listCardBody}>Higher points mean calmer / better days.</Text>
            <MoodReportChart points={report.points} />
          </View>
          <View style={styles.cardList}>
            {report.entries
              .slice()
              .reverse()
              .map(item => (
                <View key={item.id} style={styles.listCard}>
                  <View style={[styles.toolIconTile, {backgroundColor: '#ede9fe'}]}>
                    <Text style={styles.moodEmoji}>{moodEmojiFor(item.mood_id)}</Text>
                  </View>
                  <View style={{flex: 1}}>
                    <Text style={styles.listCardTitle}>{item.mood_label}</Text>
                    <Text style={styles.listCardBody}>{item.checkin_date} • Score {item.score}/5</Text>
                  </View>
                </View>
              ))}
          </View>
        </>
      ) : null}
    </Shell>
  );
}

function moodEmojiFor(moodId: string): string {
  switch (moodId) {
    case 'overwhelmed':
      return '😣';
    case 'confused':
      return '😕';
    case 'okay':
      return '😐';
    case 'better':
      return '🙂';
    case 'calm':
      return '😌';
    default:
      return '😐';
  }
}

function MoodMiniChart({points}: {points: MoodTrendPoint[]}) {
  return (
    <View style={styles.miniChartWrap}>
      <MoodLineChart points={points} height={74} showLabels={false} />
    </View>
  );
}

function MoodReportChart({points}: {points: MoodTrendPoint[]}) {
  return (
    <View style={styles.reportChartWrap}>
      <MoodLineChart points={points} height={180} showLabels />
    </View>
  );
}

function MoodLineChart({points, height, showLabels}: {points: MoodTrendPoint[]; height: number; showLabels: boolean}) {
  if (!points.length) {
    return (
      <View style={[styles.chartArea, {height}]}>
        <Text style={styles.screenSubtitle}>No mood data for this range yet.</Text>
      </View>
    );
  }

  const width = showLabels ? 320 : 300;
  const svgHeight = showLabels ? height : height - 8;
  const leftPad = showLabels ? 24 : 10;
  const rightPad = 10;
  const topPad = 10;
  const bottomPad = showLabels ? 26 : 10;
  const innerWidth = width - leftPad - rightPad;
  const innerHeight = svgHeight - topPad - bottomPad;
  const normalized = points.map((point, index) => {
    const x = points.length === 1 ? leftPad + innerWidth / 2 : leftPad + (index / (points.length - 1)) * innerWidth;
    const y = topPad + ((5 - point.score) / 4) * innerHeight;
    return {...point, x, y};
  });

  function buildSmoothPath(values: typeof normalized) {
    if (values.length === 1) {
      return `M ${values[0].x} ${values[0].y}`;
    }
    let path = `M ${values[0].x} ${values[0].y}`;
    for (let index = 0; index < values.length - 1; index += 1) {
      const current = values[index];
      const next = values[index + 1];
      const midX = (current.x + next.x) / 2;
      path += ` Q ${midX} ${current.y}, ${midX} ${((current.y + next.y) / 2)}`;
      path += ` Q ${midX} ${next.y}, ${next.x} ${next.y}`;
    }
    return path;
  }

  const primaryPath = buildSmoothPath(normalized);
  const baseline = normalized.map((point, index) => {
    const offset = Math.sin(index * 1.3) * 0.35;
    const baselineScore = Math.max(1, Math.min(5, point.score - offset - 0.7));
    return {
      ...point,
      y: topPad + ((5 - baselineScore) / 4) * innerHeight,
    };
  });
  const baselinePath = buildSmoothPath(baseline);

  return (
    <View style={[styles.chartArea, {height}]}>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        {[1, 2, 3, 4, 5].map(score => {
          const y = topPad + ((5 - score) / 4) * innerHeight;
          return (
            <React.Fragment key={score}>
              <Line x1={leftPad} x2={width - rightPad} y1={y} y2={y} stroke="#ddd6fe" strokeDasharray="3 4" strokeWidth="1" />
              {showLabels ? (
                <SvgText x={4} y={y + 4} fontSize="10" fill="#94a3b8">
                  {score}
                </SvgText>
              ) : null}
            </React.Fragment>
          );
        })}
        <Path d={baselinePath} fill="none" stroke="#cbd5e1" strokeWidth="2" />
        <Path d={primaryPath} fill="none" stroke="#06b6d4" strokeWidth={showLabels ? 3 : 2.5} strokeLinecap="round" strokeLinejoin="round" />
        {normalized.map(point => (
          <React.Fragment key={point.date}>
            <Circle cx={point.x} cy={point.y} r={showLabels ? 4 : 3} fill="#ffffff" stroke="#06b6d4" strokeWidth="2" />
            {showLabels ? (
              <SvgText x={point.x} y={height - 6} fontSize="10" fill="#94a3b8" textAnchor="middle">
                {point.date.slice(5)}
              </SvgText>
            ) : null}
          </React.Fragment>
        ))}
      </Svg>
    </View>
  );
}

function ChatScreen({
  profile,
  state,
  authToken,
  generatedReframe,
  onBack,
}: {
  profile: RemoteAppProfile | null;
  state: OnboardingState;
  authToken: string;
  generatedReframe: GeneratedReframe | null;
  onBack: () => void;
}) {
  const [messages, setMessages] = useState<CoachMessage[]>(() => buildCoachStarter(state, generatedReframe));
  const [threadId, setThreadId] = useState<number | null>(null);
  const [draft, setDraft] = useState('');
  const [loadingThread, setLoadingThread] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [chatError, setChatError] = useState('');
  const [supportCard, setSupportCard] = useState<{
    title: string;
    body: string;
    actions: Array<{kind: string; label: string; value: string}>;
  } | null>(null);

  useEffect(() => {
    let active = true;

    async function loadCoachThread() {
      if (!authToken) {
        setMessages(buildCoachStarter(state, generatedReframe));
        setThreadId(null);
        return;
      }

      try {
        setLoadingThread(true);
        const threads = await fetchThreads(authToken);
        if (!threads.length) {
          if (!active) return;
          setMessages(buildCoachStarter(state, generatedReframe));
          setThreadId(null);
          return;
        }

        const latest = threads[0];
        const detail = await fetchThreadDetail(authToken, latest.id);
        if (!active) return;
        setThreadId(detail.thread.id);
        if (detail.messages.length) setMessages(detail.messages.map(mapThreadMessage));
        else setMessages(buildCoachStarter(state, generatedReframe));
      } catch {
        if (!active) return;
        setMessages(buildCoachStarter(state, generatedReframe));
      } finally {
        if (active) setLoadingThread(false);
      }
    }

    loadCoachThread();
    return () => {
      active = false;
    };
  }, [authToken, state.firstThought, generatedReframe]);

  const summary = useMemo(() => createCoachSummary(state, messages), [state, messages]);
  const showSafety = useMemo(
    () => messages.some(message => message.from === 'user' && detectSafety(message.text) !== 'none'),
    [messages],
  );

  async function handleSend(prefill?: string) {
    const nextText = (prefill ?? draft).trim();
    if (!nextText || sendingMessage) return;

    const optimistic: CoachMessage = {
      id: `local-user-${Date.now()}`,
      from: 'user',
      text: nextText,
      createdAt: new Date().toISOString(),
    };

    setChatError('');
    setMessages(current => [...current, optimistic]);
    setDraft('');

    if (!authToken) {
      const localReply = {
        id: `local-bot-${Date.now()}`,
        from: 'bot' as const,
        text: getAssistantReply(nextText, state.language),
        createdAt: new Date().toISOString(),
      };
      setMessages(current => [...current, localReply]);
      return;
    }

    try {
      setSendingMessage(true);
      const result = await sendChatMessage(authToken, nextText, state.language, threadId ?? undefined);
      setThreadId(result.thread_id);
      setSupportCard(result.safety_decision.feature_applied ? (result.support_card ?? null) : null);
      setMessages(current => [
        ...current,
        {
          id: `server-bot-${Date.now()}`,
          from: 'bot',
          text: result.reply,
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      setChatError(err instanceof Error ? err.message : 'Unable to send right now.');
      setMessages(current => current.filter(message => message.id !== optimistic.id));
    } finally {
      setSendingMessage(false);
    }
  }

  const quickReplies = [
    'What evidence do I actually have for this?',
    'What is one other explanation?',
    summary.nextStep,
  ];

  return (
    <Shell title="Coach" subtitle="Safe, structured, and supportive" showBack onBack={onBack} rightSlot={<Badge label={summary.patternLabel} tone="emerald" />}>
      <View style={styles.goalCard}>
        <View>
          <Text style={styles.goalTitle}>Session goal</Text>
          <Text style={styles.goalBody}>{summary.sessionGoal}</Text>
        </View>
        <Badge label={summary.timeLabel} tone="white" />
      </View>
      <View style={styles.coachMetaCard}>
        <View style={styles.inlineIconRow}>
          <Icon name="target" size={14} color="#7c3aed" />
          <Text style={styles.statLabel}>Next step</Text>
        </View>
        <Text style={styles.listCardBody}>{summary.nextStep}</Text>
      </View>
      {showSafety ? (
        <View style={styles.coachSafetyCard}>
          <Icon name="shieldCheck" size={18} color="#b45309" />
          <Text style={styles.coachSafetyText}>
            If this starts feeling unsafe or overwhelming, pause here and reach out to a trusted person or local support right away.
          </Text>
        </View>
      ) : null}
      {supportCard ? (
        <View style={styles.supportScreenCard}>
          <Text style={styles.listCardTitle}>{supportCard.title}</Text>
          <Text style={styles.listCardBody}>{supportCard.body}</Text>
          <View style={styles.supportActionsWrap}>
            {supportCard.actions.map(action => (
              <Pressable
                key={`${action.kind}-${action.label}-${action.value}`}
                style={action.kind === 'acknowledge' ? styles.secondaryWideButton : styles.primaryWideButton}
                onPress={() => {
                  if (action.kind === 'acknowledge') {
                    setSupportCard(null);
                    return;
                  }
                  if (action.kind === 'link' && action.value) {
                    Linking.openURL(action.value).catch(() => undefined);
                    return;
                  }
                  if ((action.kind === 'call' || action.kind === 'contact') && action.value) {
                    Linking.openURL(`tel:${action.value}`).catch(() => undefined);
                  }
                }}>
                <Text style={action.kind === 'acknowledge' ? styles.secondaryButtonText : styles.primaryButtonText}>{action.label}</Text>
              </Pressable>
            ))}
          </View>
          {!profile?.emergency_support?.profile_complete && profile?.emergency_support?.enabled ? (
            <Text style={styles.coachSafetyText}>
              Add a trusted contact in Profile so ReframeQ can show faster support options here.
            </Text>
          ) : null}
        </View>
      ) : null}
      <View style={styles.chatStack}>
        {loadingThread ? <Text style={styles.screenSubtitle}>Loading your latest session...</Text> : null}
        {messages.map(message => (
          <View key={message.id} style={[styles.chatBubbleWrap, message.from === 'user' ? styles.chatRight : styles.chatLeft]}>
            <View style={[styles.chatBubble, message.from === 'user' ? styles.chatUserBubble : styles.chatBotBubble]}>
              <Text style={[styles.chatText, message.from === 'user' && {color: '#ffffff'}]}>{message.text}</Text>
            </View>
          </View>
        ))}
        {sendingMessage ? (
          <View style={[styles.chatBubbleWrap, styles.chatLeft]}>
            <View style={[styles.chatBubble, styles.chatBotBubble]}>
              <Text style={styles.chatLoadingText}>ReframeQ is thinking...</Text>
            </View>
          </View>
        ) : null}
      </View>
      {!supportCard ? (
        <>
          <View style={styles.quickReplyGuide}>
            <Text style={styles.quickReplyGuideTitle}>Coach prompts</Text>
            <Text style={styles.quickReplyGuideBody}>These are reflection helpers. They should shape your response, not replace it.</Text>
          </View>
          <View style={styles.quickReplyWrap}>
            {quickReplies.map(reply => (
              <Pressable key={reply} onPress={() => setDraft(buildReflectionDraft(summary.patternLabel, reply))} style={styles.quickReplyChip}>
                <Text style={styles.quickReplyText}>{reply}</Text>
              </Pressable>
            ))}
          </View>
        </>
      ) : null}
      <View style={styles.chatComposer}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder={supportCard ? 'If you are safe for now, you can add a short update here...' : 'Share the thought you want to test...'}
          placeholderTextColor="#9ca3af"
          multiline
          style={styles.chatComposerInput}
        />
        <Pressable onPress={() => handleSend()} style={[styles.chatSendButton, (!draft.trim() || sendingMessage) && styles.chatSendButtonDisabled]}>
          <Text style={styles.primaryButtonText}>Send</Text>
        </Pressable>
      </View>
      {chatError ? <Text style={styles.errorText}>{chatError}</Text> : null}
    </Shell>
  );
}

function ToolsScreen({onBack}: {onBack: () => void}) {
  return (
    <Shell title="Tools" subtitle="Guided reflection and daily support" showBack onBack={onBack}>
      <View style={styles.grid}>
        {tools.map(item => (
          <View key={item.title} style={styles.gridCard}>
            <View style={[styles.gridIconTile, {backgroundColor: item.tintBg}]}>
              <Icon name={item.icon} size={18} color={item.tint} />
            </View>
            <Text style={styles.gridCardTitle}>{item.title}</Text>
            <Text style={styles.gridCardBody}>{item.desc}</Text>
          </View>
        ))}
      </View>
    </Shell>
  );
}

function FamilyScreen({profiles, onBack}: {profiles: FamilyProfile[]; onBack: () => void}) {
  return (
    <Shell title="Family Space" subtitle="Profiles, limits, and visibility" showBack onBack={onBack} rightSlot={<Icon name="settings" size={18} color="#6b7280" />}>
      <View style={styles.cardList}>
        {(profiles.length ? profiles : familyProfiles).map(profile => (
          <View key={profile.name} style={styles.familyCard}>
            <View style={styles.rowSpace}>
              <View>
                <Text style={styles.listCardTitle}>{profile.name}</Text>
                <Text style={styles.listCardBody}>{profile.type} • {profile.age}</Text>
              </View>
              <Badge label={profile.time} />
            </View>
            <View style={styles.familyMiniGrid}>
              <View style={styles.familyMiniCell}><Text style={styles.familyRuleText}>{profile.rule}</Text></View>
              <View style={styles.familyMiniCell}><Text style={styles.familyRuleText}>{profile.topics}</Text></View>
            </View>
          </View>
        ))}
      </View>
    </Shell>
  );
}

function ProfileScreen({
  profile,
  authToken,
  onProfileUpdated,
  onLogout,
  onBack,
}: {
  profile: RemoteAppProfile | null;
  authToken: string;
  onProfileUpdated: (profile: RemoteAppProfile) => void;
  onLogout: () => void;
  onBack: () => void;
}) {
  const displayName = profile?.full_name || 'Profile';
  const initial = displayName.charAt(0).toUpperCase() || 'R';
  const [isEditing, setIsEditing] = useState(false);
  const [editSection, setEditSection] = useState<'account' | 'trustedContacts'>('account');
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [mobileCountryCode, setMobileCountryCode] = useState(profile?.mobile_country_code || '');
  const [mobileNumber, setMobileNumber] = useState(profile?.mobile_number || '');
  const [city, setCity] = useState(profile?.city || '');
  const [stateName, setStateName] = useState(profile?.state || '');
  const [country, setCountry] = useState(profile?.country || '');
  const [language, setLanguage] = useState(profile?.language || 'en');
  const [newPassword, setNewPassword] = useState('');
  const [showCodePicker, setShowCodePicker] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [showStatePicker, setShowStatePicker] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingTrustedContacts, setIsSavingTrustedContacts] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [trustedContacts, setTrustedContacts] = useState<RemoteAppProfile['emergency_support']['trusted_contacts']>([]);

  useEffect(() => {
    setFullName(profile?.full_name || '');
    setEmail(profile?.email || '');
    setMobileCountryCode(profile?.mobile_country_code || '');
    setMobileNumber(profile?.mobile_number || '');
    setCity(profile?.city || '');
    setStateName(profile?.state || '');
    setCountry(profile?.country || '');
    setLanguage(profile?.language || 'en');
    setTrustedContacts(profile?.emergency_support?.trusted_contacts || []);
    setEditSection('account');
  }, [profile]);

  async function handleSaveProfile() {
    if (!authToken) return;
    setFormError('');
    setSuccessMessage('');
    if (!fullName.trim()) {
      setFormError('Name is required.');
      return;
    }
    if (newPassword && newPassword.trim().length < 8) {
      setFormError('Password must be at least 8 characters.');
      return;
    }

    setIsSaving(true);
    try {
      const updatedProfile = await updateMyProfile(authToken, {
        full_name: fullName.trim(),
        mobile_country_code: mobileCountryCode.trim(),
        mobile_number: mobileNumber.trim(),
        city: city.trim(),
        state: stateName.trim(),
        country: country.trim(),
        language: language.trim() || 'en',
        emergency_support: profile?.emergency_support?.enabled
          ? {
              trusted_contacts: trustedContacts
                .filter(item => item.name.trim())
                .slice(0, 3)
                .map((item, index) => ({
                  ...item,
                  is_primary: trustedContacts.some(entry => entry.is_primary)
                    ? Boolean(item.is_primary)
                    : index === 0,
                })),
            }
          : undefined,
      });
      if (newPassword.trim()) {
        await changeMyPassword(authToken, newPassword.trim());
      }
      onProfileUpdated(updatedProfile);
      setNewPassword('');
      setIsEditing(false);
      setSuccessMessage(newPassword.trim() ? 'Profile and password updated.' : 'Profile updated.');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveTrustedContacts() {
    if (!authToken || !profile?.emergency_support?.enabled) return;
    setFormError('');
    setSuccessMessage('');
    const cleanedContacts = trustedContacts.filter(item => item.name.trim()).slice(0, 3);
    if (!cleanedContacts.length) {
      setFormError('Add at least one trusted contact name before saving.');
      return;
    }

    setIsSavingTrustedContacts(true);
    try {
      const updatedProfile = await updateMyProfile(authToken, {
        emergency_support: {
          trusted_contacts: cleanedContacts.map((item, index) => ({
            ...item,
            is_primary: cleanedContacts.some(entry => entry.is_primary)
              ? Boolean(item.is_primary)
              : index === 0,
          })),
        },
      });
      onProfileUpdated(updatedProfile);
      setTrustedContacts(updatedProfile.emergency_support?.trusted_contacts || []);
      setIsEditing(false);
      setSuccessMessage('Trusted contacts saved.');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save trusted contacts');
    } finally {
      setIsSavingTrustedContacts(false);
    }
  }

  const selectedPhoneCode = phoneCountryCodes.find(item => item.code === mobileCountryCode);
  const isIndiaSelected = country.trim().toLowerCase() === 'india';
  const cityOptions = stateName ? (indiaLocations[stateName] ?? []) : [];
  const supportEnabled = Boolean(profile?.emergency_support?.enabled && profile?.emergency_support?.eligible);
  const supportResource = profile?.emergency_support?.resource;
  const canAddTrustedContact = trustedContacts.length < 3;

  return (
    <Shell title="Profile" subtitle="Preferences, privacy, and account" showBack onBack={onBack} rightSlot={<Icon name="settings" size={18} color="#6b7280" />}>
      <View style={styles.profileHero}>
        <View style={styles.profileAvatar}>
          <Text style={styles.profileAvatarText}>{initial}</Text>
        </View>
        <View>
          <Text style={styles.profileName}>{displayName}</Text>
          <Text style={styles.profilePlan}>{profile?.primary_goal ? profile.primary_goal.replace('_', ' ') : 'Calm growth plan'}</Text>
        </View>
      </View>
      <View style={styles.cardList}>
        <View style={styles.softCard}>
          <Text style={styles.listCardTitle}>{profile?.email || 'No email available'}</Text>
          <Text style={styles.listCardBody}>
            {(profile?.mobile_country_code || profile?.mobile_number)
              ? `Mobile: ${profile?.mobile_country_code || ''} ${profile?.mobile_number || ''}`
              : 'Mobile not added'}
          </Text>
          <Text style={styles.listCardBody}>
            {[profile?.city, profile?.state, profile?.country].filter(Boolean).join(' • ') || 'Location not added'}
          </Text>
          <Text style={styles.listCardBody}>Language: {profile?.language || 'en'}</Text>
        </View>
        <View style={styles.softCard}>
          <SectionTitle title="Profile" action={isEditing ? 'Editing' : 'Account details'} />
          {!isEditing ? (
            <>
              <Text style={styles.listCardBody}>Update your name, mobile number, city, state, country, language, and password here. Email stays read-only.</Text>
              <Pressable style={styles.secondaryWideButton} onPress={() => {
                setFormError('');
                setSuccessMessage('');
                setIsEditing(true);
                setEditSection('account');
              }}>
                <Icon name="settings" size={16} color="#6d28d9" />
                <Text style={styles.secondaryButtonText}>Edit profile</Text>
              </Pressable>
            </>
          ) : (
            <>
              <View style={styles.editSectionTabs}>
                <Pressable
                  style={[styles.editSectionTab, editSection === 'account' && styles.editSectionTabActive]}
                  onPress={() => setEditSection('account')}>
                  <Text style={[styles.editSectionTabText, editSection === 'account' && styles.editSectionTabTextActive]}>Account</Text>
                </Pressable>
                {supportEnabled ? (
                  <Pressable
                    style={[styles.editSectionTab, editSection === 'trustedContacts' && styles.editSectionTabActive]}
                    onPress={() => setEditSection('trustedContacts')}>
                    <Text style={[styles.editSectionTabText, editSection === 'trustedContacts' && styles.editSectionTabTextActive]}>Trusted Contacts</Text>
                  </Pressable>
                ) : null}
              </View>
              {editSection === 'account' ? (
                <>
                  <TextField label="Full name" value={fullName} onChange={setFullName} placeholder="Your name" />
                  <TextField label="Email" value={email} onChange={setEmail} placeholder="Email" autoCapitalize="none" editable={false} />
                  <View style={styles.inputBlock}>
                    <Text style={styles.inputLabel}>Mobile number</Text>
                    <View style={styles.phoneRow}>
                      <View style={styles.phoneCodeWrap}>
                        <Pressable
                          style={styles.phoneCodeButton}
                          onPress={() => {
                            Keyboard.dismiss();
                            setShowCodePicker(current => !current);
                          }}>
                          <Text style={styles.phoneCodeButtonText}>{selectedPhoneCode?.code || mobileCountryCode || '+91'}</Text>
                          <Icon name="arrowRight" size={12} color="#6d28d9" />
                        </Pressable>
                        {showCodePicker ? (
                          <View style={styles.phoneCodeDropdown}>
                            {phoneCountryCodes.map(item => (
                              <Pressable
                                key={`${item.label}-${item.code}`}
                                style={[styles.phoneCodeOption, mobileCountryCode === item.code && styles.phoneCodeOptionActive]}
                                onPress={() => {
                                  setMobileCountryCode(item.code);
                                  setShowCodePicker(false);
                                }}>
                                <Text style={styles.phoneCodeOptionLabel}>{item.label}</Text>
                                <Text style={styles.phoneCodeOptionCode}>{item.code}</Text>
                              </Pressable>
                            ))}
                          </View>
                        ) : null}
                      </View>
                      <View style={styles.phoneNumberWrap}>
                        <TextInput
                          value={mobileNumber}
                          onChangeText={setMobileNumber}
                          placeholder="9876543210"
                          autoCapitalize="none"
                          keyboardType="phone-pad"
                          placeholderTextColor="#9ca3af"
                          style={styles.input}
                        />
                      </View>
                    </View>
                  </View>
                  <InlineSelect
                    label="Country"
                    value={country}
                    placeholder="Select country"
                    onToggle={() => {
                      Keyboard.dismiss();
                      setShowStatePicker(false);
                      setShowCityPicker(false);
                      setShowCountryPicker(current => !current);
                    }}
                  />
                  <InlineSelect
                    label="State"
                    value={stateName}
                    placeholder={isIndiaSelected ? 'Select state' : 'Select country first'}
                    onToggle={() => {
                      Keyboard.dismiss();
                      if (!isIndiaSelected) return;
                      setShowCountryPicker(false);
                      setShowCityPicker(false);
                      setShowStatePicker(current => !current);
                    }}
                  />
                  <InlineSelect
                    label="City"
                    value={city}
                    placeholder={isIndiaSelected ? (stateName ? 'Select city' : 'Choose state first') : 'Select state first'}
                    onToggle={() => {
                      Keyboard.dismiss();
                      if (!isIndiaSelected || !stateName) return;
                      setShowCountryPicker(false);
                      setShowStatePicker(false);
                      setShowCityPicker(current => !current);
                    }}
                  />
                  <TextField label="Language" value={language} onChange={setLanguage} placeholder="en" autoCapitalize="none" />
                  <TextField label="New password" value={newPassword} onChange={setNewPassword} placeholder="Leave blank to keep current password" secure autoCapitalize="none" />
                </>
              ) : (
                <View style={styles.contactStack}>
                  <Text style={styles.listCardBody}>Add up to 3 trusted contacts that can be shown quickly if you need support.</Text>
                  {trustedContacts.map((contact, index) => (
                    <View key={contact.id || `trusted-contact-${index}`} style={styles.contactCard}>
                      <TextField
                        label={`Trusted contact ${index + 1} name`}
                        value={contact.name}
                        onChange={value => setTrustedContacts(current => current.map((item, itemIndex) => itemIndex === index ? {...item, name: value} : item))}
                        placeholder="Full name"
                      />
                      <TextField
                        label="Relationship"
                        value={contact.relationship}
                        onChange={value => setTrustedContacts(current => current.map((item, itemIndex) => itemIndex === index ? {...item, relationship: value} : item))}
                        placeholder="Friend, sibling, spouse"
                      />
                      <TextField
                        label="Phone"
                        value={contact.phone_number}
                        onChange={value => setTrustedContacts(current => current.map((item, itemIndex) => itemIndex === index ? {...item, phone_number: value} : item))}
                        placeholder="9876543210"
                        autoCapitalize="none"
                      />
                      <TextField
                        label="Email"
                        value={contact.email}
                        onChange={value => setTrustedContacts(current => current.map((item, itemIndex) => itemIndex === index ? {...item, email: value} : item))}
                        placeholder="Optional"
                        autoCapitalize="none"
                      />
                      <TextField
                        label="Support note"
                        value={contact.support_note}
                        onChange={value => setTrustedContacts(current => current.map((item, itemIndex) => itemIndex === index ? {...item, support_note: value} : item))}
                        placeholder="Example: Please call and stay on the line with me."
                      />
                      <View style={styles.actionRow}>
                        <Pressable
                          style={[styles.secondaryButton, contact.is_primary && styles.loadingCard]}
                          onPress={() => setTrustedContacts(current => current.map((item, itemIndex) => ({...item, is_primary: itemIndex === index})))}>
                          <Text style={styles.secondaryButtonText}>{contact.is_primary ? 'Primary contact' : 'Make primary'}</Text>
                        </Pressable>
                        <Pressable
                          style={styles.secondaryButton}
                          onPress={() => setTrustedContacts(current => current.filter((_, itemIndex) => itemIndex !== index))}>
                          <Text style={styles.secondaryButtonText}>Remove</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))}
                  {canAddTrustedContact ? (
                    <Pressable
                      style={styles.secondaryWideButton}
                      onPress={() =>
                        setTrustedContacts(current => [
                          ...current,
                          {
                            id: `contact-${Date.now()}`,
                            name: '',
                            relationship: '',
                            phone_number: '',
                            email: '',
                            preferred_language: language || 'en',
                            city: city || '',
                            state: stateName || '',
                            is_primary: current.length === 0,
                            show_call_shortcut: true,
                            support_note: '',
                            active: true,
                          },
                        ])
                      }>
                      <Icon name="plus" size={16} color="#6d28d9" />
                      <Text style={styles.secondaryButtonText}>Add trusted contact</Text>
                    </Pressable>
                  ) : null}
                </View>
              )}
              {formError ? <Text style={styles.errorText}>{formError}</Text> : null}
              {successMessage ? (
                <View style={styles.inlineInfoSuccess}>
                  <Icon name="check" size={16} color="#047857" />
                  <Text style={styles.inlineInfoText}>{successMessage}</Text>
                </View>
              ) : null}
              <View style={styles.actionRow}>
                <Pressable
                  style={styles.secondaryButton}
                  onPress={() => {
                    setIsEditing(false);
                    setFormError('');
                    setNewPassword('');
                    setTrustedContacts(profile?.emergency_support?.trusted_contacts || []);
                    setEditSection('account');
                    setShowCodePicker(false);
                    setShowCountryPicker(false);
                    setShowStatePicker(false);
                    setShowCityPicker(false);
                  }}>
                  <Text style={styles.secondaryButtonText}>Cancel</Text>
                </Pressable>
                {editSection === 'account' ? (
                  <Pressable style={[styles.primaryButton, isSaving && styles.loadingCard]} onPress={handleSaveProfile} disabled={isSaving}>
                    <Text style={styles.primaryButtonText}>{isSaving ? 'Saving...' : 'Save changes'}</Text>
                  </Pressable>
                ) : (
                  <Pressable style={[styles.primaryButton, isSavingTrustedContacts && styles.loadingCard]} onPress={handleSaveTrustedContacts} disabled={isSavingTrustedContacts}>
                    <Text style={styles.primaryButtonText}>{isSavingTrustedContacts ? 'Saving...' : 'Save trusted contacts'}</Text>
                  </Pressable>
                )}
              </View>
            </>
          )}
        </View>
        <View style={styles.softCard}>
          <Text style={styles.listCardTitle}>Onboarding</Text>
          <Text style={styles.listCardBody}>
            {profile?.onboarding?.completed ? 'Completed' : `Saved at step ${profile?.onboarding?.step || 'welcome'}`}
          </Text>
        </View>
        {supportEnabled ? (
          <View style={styles.softCard}>
            <SectionTitle
              title={profile?.emergency_support?.title || 'Emergency Support Path'}
              action={profile?.emergency_support?.profile_complete ? 'Ready' : 'Setup recommended'}
            />
            <Text style={styles.listCardBody}>
              {profile?.emergency_support?.description || 'Add trusted people and support options so help is easier to reach in a hard moment.'}
            </Text>
            {!isEditing ? (
              <>
                <Text style={styles.listCardBody}>
                  {profile?.emergency_support?.trusted_contacts?.length
                    ? `${profile.emergency_support.trusted_contacts.length} trusted contact${profile.emergency_support.trusted_contacts.length > 1 ? 's' : ''} saved`
                    : 'No trusted contacts saved yet'}
                </Text>
                {profile?.emergency_support?.trusted_contacts?.length ? (
                  <View style={styles.contactStack}>
                    {profile.emergency_support.trusted_contacts.map((contact, index) => (
                      <View key={contact.id || `saved-contact-${index}`} style={styles.contactCard}>
                        <Text style={styles.listCardTitle}>{contact.name}</Text>
                        <Text style={styles.listCardBody}>
                          {[contact.relationship, contact.phone_number].filter(Boolean).join(' • ') || 'Trusted contact'}
                        </Text>
                        {contact.support_note ? <Text style={styles.listCardBody}>{contact.support_note}</Text> : null}
                      </View>
                    ))}
                  </View>
                ) : null}
                {supportResource?.helpline_numbers?.length || supportResource?.emergency_number ? (
                  <View style={styles.contactStack}>
                    {supportResource?.helpline_numbers?.map(number => (
                      <Pressable
                        key={`helpline-${number}`}
                        style={styles.secondaryWideButton}
                        onPress={() => Linking.openURL(`tel:${number}`).catch(() => undefined)}>
                        <Icon name="phone" size={16} color="#6d28d9" />
                        <Text style={styles.secondaryButtonText}>{`${supportResource.helpline_label}: ${number}`}</Text>
                      </Pressable>
                    ))}
                    {supportResource?.emergency_number ? (
                      <Pressable
                        style={styles.secondaryWideButton}
                        onPress={() => Linking.openURL(`tel:${supportResource.emergency_number}`).catch(() => undefined)}>
                        <Icon name="phone" size={16} color="#6d28d9" />
                        <Text style={styles.secondaryButtonText}>{`${supportResource.emergency_label}: ${supportResource.emergency_number}`}</Text>
                      </Pressable>
                    ) : null}
                  </View>
                ) : null}
                <Pressable
                  style={styles.secondaryWideButton}
                  onPress={() => {
                    setFormError('');
                    setSuccessMessage('');
                    setIsEditing(true);
                    setEditSection('trustedContacts');
                  }}>
                  <Icon name="plus" size={16} color="#6d28d9" />
                  <Text style={styles.secondaryButtonText}>
                    {profile?.emergency_support?.trusted_contacts?.length ? 'Manage trusted contacts' : 'Add trusted contact'}
                  </Text>
                </Pressable>
              </>
            ) : null}
          </View>
        ) : null}
        {!isEditing && successMessage ? (
          <View style={styles.inlineInfoSuccess}>
            <Icon name="check" size={16} color="#047857" />
            <Text style={styles.inlineInfoText}>{successMessage}</Text>
          </View>
        ) : null}
        <Pressable style={styles.secondaryButton} onPress={onLogout}>
          <Text style={styles.secondaryButtonText}>Log out</Text>
        </Pressable>
      </View>
      <SelectionSheet
        visible={showCountryPicker}
        title="Select Country"
        value={country}
        options={profileCountries}
        onClose={() => setShowCountryPicker(false)}
        onSelect={value => {
          setCountry(value);
          setShowCountryPicker(false);
          if (value !== 'India') {
            setStateName('');
            setCity('');
          }
        }}
      />
      <SelectionSheet
        visible={showStatePicker && isIndiaSelected}
        title="Select State"
        value={stateName}
        options={indiaStates}
        onClose={() => setShowStatePicker(false)}
        onSelect={value => {
          setStateName(value);
          setCity('');
          setShowStatePicker(false);
        }}
      />
      <SelectionSheet
        visible={showCityPicker && isIndiaSelected && cityOptions.length > 0}
        title="Select City"
        value={city}
        options={cityOptions}
        onClose={() => setShowCityPicker(false)}
        onSelect={value => {
          setCity(value);
          setShowCityPicker(false);
        }}
      />
    </Shell>
  );
}

function BottomNav({activeTab, onChange}: {activeTab: TabId; onChange: (tab: TabId) => void}) {
  return (
    <View style={styles.bottomNavWrap}>
      <View style={styles.bottomNav}>
        {appTabs.map(tab => {
          const active = tab.id === activeTab;
          return (
            <Pressable key={tab.id} onPress={() => onChange(tab.id)} style={[styles.bottomTab, active && styles.bottomTabActive]}>
              <Icon name={tab.icon} size={18} color={active ? '#ffffff' : '#6b7280'} />
              <Text style={[styles.bottomTabText, active && styles.bottomTabTextActive]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function OnboardingScreen({
  state,
  step,
  path,
  config,
  error,
  childBlocking,
  isReframeLoading,
  generatedReframe,
  aiMessages,
  onFieldChange,
  onToggleSecondaryGoal,
  onPrimaryAction,
  onSecondaryAction,
  onBack,
  onChildPathFix,
}: {
  state: OnboardingState;
  step: OnboardingStep;
  path: OnboardingStep[];
  config: OnboardingConfig;
  error: string;
  childBlocking: boolean;
  isReframeLoading: boolean;
  generatedReframe: GeneratedReframe | null;
  aiMessages: AIMessages;
  onFieldChange: <K extends keyof OnboardingState>(key: K, value: OnboardingState[K]) => void;
  onToggleSecondaryGoal: (goal: GoalId) => void;
  onPrimaryAction: () => void;
  onSecondaryAction?: () => void;
  onBack: () => void;
  onChildPathFix: () => void;
}) {
  const stepIndex = path.indexOf(step);
  const progress = ((stepIndex + 1) / path.length) * 100;
  const hasBack = true;
  const showSkip = step === 'style' || step === 'tutorial' || step === 'familySetup';
  const recommendedReminder = suggestedReminder(state);
  const reframe = generatedReframe;
  const welcomeCopy = getScreenCopy(config, 'welcome');
  const goalCopy = getScreenCopy(config, 'goal');
  const clarityCopy = getScreenCopy(config, 'clarity');
  const styleCopy = getScreenCopy(config, 'style');
  const reframeCopy = getScreenCopy(config, 'reframe');
  const enabledAccountModes = config.policy.enabled_account_modes.filter(item => item.enabled).map(item => item.key);
  const enabledUserTypes = config.policy.enabled_user_types.filter(item => item.enabled).map(item => item.key);
  const tutorialExample =
    aiMessages.tutorial
      ? `${aiMessages.tutorial.situation || ''}\n${aiMessages.tutorial.thought || ''}\n${aiMessages.tutorial.reframe || ''}`.trim()
      : state.primaryGoal === 'friendships_social'
        ? 'People seemed distant. Is that the only explanation?'
        : state.primaryGoal === 'parenting_support' || state.primaryGoal === 'child_behavior_support'
          ? 'My child acted out. What happened before that?'
          : state.primaryGoal === 'focus_procrastination'
            ? 'This task feels huge. What is the smallest start?'
            : 'They didn’t reply. Does that mean something bad?';

  let content: React.ReactNode = null;
  let primaryLabel = 'Continue';
  let secondaryLabel: string | undefined;

  switch (step) {
    case 'welcome':
      primaryLabel = welcomeCopy?.primary_cta || 'Get started';
      secondaryLabel = config.policy.allow_family_flows && isToggleEnabled(config.policy.enabled_account_modes, 'family_join')
        ? (welcomeCopy?.secondary_cta || 'I have a family invite')
        : undefined;
      content = (
        <View style={styles.centerStack}>
          <View style={styles.welcomeIcon}>
            <Icon name="sparkles" size={30} color="#ffffff" />
          </View>
          <View>
            <Text style={styles.welcomeTitle}>Let’s set up your space.</Text>
            <Text style={styles.welcomeTitle}>This takes about a minute.</Text>
            <Text style={styles.welcomeBody}>Short guided conversations for overthinking, confidence, relationships, parenting, and daily decisions.</Text>
          </View>
        </View>
      );
      break;
    case 'accountMode':
      content = (
        <View style={styles.cardList}>
          <Text style={styles.screenTitle}>Who will use ReframeQ?</Text>
          <Text style={styles.screenSubtitle}>Choose the setup that fits you best.</Text>
          {enabledAccountModes.includes('individual') ? <ChoiceCard active={state.accountMode === 'individual'} title="Just me" desc="For personal self-help and daily reflection" icon="user" onPress={() => onFieldChange('accountMode', 'individual')} /> : null}
          {config.policy.allow_family_flows && enabledAccountModes.includes('family_owner') ? <ChoiceCard active={state.accountMode === 'family_owner'} title="My family" desc="Set up guided support for your household" icon="users" onPress={() => onFieldChange('accountMode', 'family_owner')} /> : null}
          {config.policy.allow_family_flows && enabledAccountModes.includes('family_join') ? <ChoiceCard active={state.accountMode === 'family_join'} title="I’m joining a family plan" desc="Use a code shared by a family owner" icon="login" onPress={() => onFieldChange('accountMode', 'family_join')} /> : null}
        </View>
      );
      break;
    case 'inviteCode':
      primaryLabel = state.inviteValidated ? 'Continue' : 'Validate code';
      content = (
        <View style={styles.cardList}>
          <Text style={styles.screenTitle}>Enter your family invite code</Text>
          <Text style={styles.screenSubtitle}>Use the code shared by your family plan owner.</Text>
          <TextField label="Invite code" value={state.inviteCode} onChange={value => onFieldChange('inviteCode', value.toUpperCase())} placeholder="Enter code" autoCapitalize="characters" />
          {state.inviteValidated ? (
            <View style={styles.inlineInfoSuccess}>
              <Icon name="badge" size={16} color="#047857" />
              <Text style={styles.inlineInfoText}>Valid family plan found</Text>
            </View>
          ) : null}
        </View>
      );
      break;
    case 'userType':
      content = (
        <View style={styles.cardList}>
          <Text style={styles.screenTitle}>Who are you setting this up for?</Text>
          <Text style={styles.screenSubtitle}>This helps us show the right kind of guidance.</Text>
          {enabledUserTypes.includes('adult') ? <ChoiceCard active={state.userType === 'adult'} title="Adult" icon="user" onPress={() => onFieldChange('userType', 'adult')} /> : null}
          {enabledUserTypes.includes('teen') ? <ChoiceCard active={state.userType === 'teen'} title="Teen" icon="smile" onPress={() => onFieldChange('userType', 'teen')} /> : null}
          {enabledUserTypes.includes('guardian') ? <ChoiceCard active={state.userType === 'child_with_guardian'} title="Child with guardian" icon="baby" onPress={() => onFieldChange('userType', 'child_with_guardian')} /> : null}
          {enabledUserTypes.includes('guardian') ? <ChoiceCard active={state.userType === 'guardian'} title="I’m a parent or guardian" icon="shield" onPress={() => onFieldChange('userType', 'guardian')} /> : null}
          {childBlocking ? (
            <View style={styles.blockCard}>
              <Text style={styles.blockTitle}>A parent or guardian needs to continue setup</Text>
              <Text style={styles.blockBody}>Child accounts need to be created under a family setup by a parent or guardian.</Text>
              <View style={styles.blockActions}>
                <Pressable style={styles.secondaryButton} onPress={() => onFieldChange('userType', '')}>
                  <Text style={styles.secondaryButtonText}>Go back</Text>
                </Pressable>
                <Pressable style={styles.primaryButton} onPress={onChildPathFix}>
                  <Text style={styles.primaryButtonText}>I’m a parent or guardian</Text>
                </Pressable>
              </View>
            </View>
          ) : null}
        </View>
      );
      break;
    case 'goal':
      primaryLabel = goalCopy?.primary_cta || primaryLabel;
      content = (
        <View style={styles.cardList}>
          <Text style={styles.screenTitle}>{goalCopy?.title || 'What would you like help with first?'}</Text>
          <Text style={styles.screenSubtitle}>{goalCopy?.subtitle || 'Pick the area you’d like to improve right now.'}</Text>
          <View style={styles.goalGrid}>
            {goalOptions.map(goal => (
              <Pressable key={goal.id} onPress={() => onFieldChange('primaryGoal', goal.id)} style={[styles.goalPill, state.primaryGoal === goal.id && styles.goalPillActive]}>
                <Text style={[styles.goalPillText, state.primaryGoal === goal.id && styles.goalPillTextActive]}>{goal.label}</Text>
              </Pressable>
            ))}
          </View>
          {state.primaryGoal ? (
            <>
              <Text style={styles.screenSubtitle}>Optional: add up to 2 more</Text>
              <View style={styles.goalGrid}>
                {goalOptions
                  .filter(goal => goal.id !== state.primaryGoal)
                  .map(goal => (
                    <Pressable
                      key={goal.id}
                      onPress={() => onToggleSecondaryGoal(goal.id)}
                      style={[styles.secondaryGoalPill, state.secondaryGoals.includes(goal.id) && styles.secondaryGoalPillActive]}>
                      <Text style={[styles.secondaryGoalText, state.secondaryGoals.includes(goal.id) && styles.secondaryGoalTextActive]}>{goal.label}</Text>
                    </Pressable>
                  ))}
              </View>
            </>
          ) : null}
          {aiMessages.goal ? <Text style={styles.screenSubtitle}>{aiMessages.goal}</Text> : null}
        </View>
      );
      break;
    case 'clarity':
      primaryLabel = clarityCopy?.primary_cta || primaryLabel;
      content = (
        <View style={styles.cardList}>
          <Text style={styles.screenTitle}>{clarityCopy?.title || 'Where do things feel right now?'}</Text>
          <Text style={styles.screenSubtitle}>{clarityCopy?.subtitle || 'A quick check so ReframeQ can adapt to you.'}</Text>
          <SliderInput label="How clear do things feel right now?" value={state.clarity} onChange={value => onFieldChange('clarity', value)} />
          <SliderInput label="How much control do you feel over your next step?" value={state.control} onChange={value => onFieldChange('control', value)} />
          <SliderInput label="How much mental noise is getting in the way?" value={state.noise} onChange={value => onFieldChange('noise', value)} />
          <SliderInput label="How ready are you to try one small step today?" value={state.readiness} onChange={value => onFieldChange('readiness', value)} required={false} />
          {aiMessages.clarity ? <Text style={styles.screenSubtitle}>{aiMessages.clarity}</Text> : null}
        </View>
      );
      break;
    case 'style':
      primaryLabel = styleCopy?.primary_cta || primaryLabel;
      secondaryLabel = styleCopy?.secondary_cta || 'Skip';
      content = (
        <View style={styles.cardList}>
          <Text style={styles.screenTitle}>{styleCopy?.title || 'How would you like ReframeQ to guide you?'}</Text>
          <Text style={styles.screenSubtitle}>{styleCopy?.subtitle || 'Choose the tone that feels most helpful.'}</Text>
          {guidanceStyles.map(item => (
            <ChoiceCard key={item.id} active={state.coachStyle === item.id} title={item.title} desc={item.desc} icon="wand" onPress={() => onFieldChange('coachStyle', item.id)} />
          ))}
          {aiMessages.style ? <Text style={styles.screenSubtitle}>{aiMessages.style}</Text> : null}
        </View>
      );
      break;
    case 'tutorial':
      secondaryLabel = state.readiness >= 7 ? 'Skip' : showSkip ? 'Skip' : undefined;
      content = (
        <View style={styles.cardList}>
          <Text style={styles.screenTitle}>How ReframeQ helps</Text>
          <View style={styles.tutorialCard}>
            <View style={styles.tutorialRow}>
              {[
                {icon: 'alert' as const, label: 'Notice the situation'},
                {icon: 'eye' as const, label: 'Look at the perspective'},
                {icon: 'footprints' as const, label: 'Choose the next step'},
              ].map((item, index) => (
                <React.Fragment key={item.label}>
                  <View style={styles.tutorialStep}>
                    <View style={styles.tutorialIconWrap}>
                      <Icon name={item.icon} size={18} color="#7c3aed" />
                    </View>
                    <Text style={styles.tutorialLabel}>{item.label}</Text>
                  </View>
                  {index < 2 ? <Icon name="arrowRight" size={14} color="#9ca3af" /> : null}
                </React.Fragment>
              ))}
            </View>
            <Text style={styles.goalBody}>{tutorialExample}</Text>
          </View>
        </View>
      );
      break;
    case 'thought':
      primaryLabel = 'See my reframe';
      content = (
        <View style={styles.cardList}>
          <Text style={styles.screenTitle}>What’s one thing on your mind right now?</Text>
          <Text style={styles.screenSubtitle}>Write one thought, situation, or worry. ReframeQ will help you look at it differently.</Text>
          <TextField label="Your thought" value={state.firstThought} onChange={value => onFieldChange('firstThought', value)} placeholder="Type here..." multiline />
          <View style={styles.chipWrap}>
            {[
              'I keep overthinking everything',
              'People in my new place don’t seem friendly',
              'I’m falling behind',
              'My child keeps losing friends because of his behavior',
            ].map(item => (
              <Pressable key={item} onPress={() => onFieldChange('firstThought', item)} style={styles.exampleChip}>
                <Text style={styles.exampleChipText}>{item}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      );
      break;
    case 'safety':
      primaryLabel = 'View support resources';
      secondaryLabel = 'Continue with a different topic';
      content = (
        <View style={styles.cardList}>
          <View style={styles.safetyHero}>
            <Icon name="alert" size={28} color="#b45309" />
          </View>
          <Text style={styles.screenTitle}>This may need more support than ReframeQ can provide right now</Text>
          <Text style={styles.screenSubtitle}>
            Please reach out to a trusted person, local emergency services, or a qualified professional in your area if you may be in immediate danger or feel unsafe.
          </Text>
        </View>
      );
      break;
    case 'reframe':
      primaryLabel = reframeCopy?.primary_cta || 'Save this and continue';
      secondaryLabel = reframeCopy?.secondary_cta || 'Edit my thought';
      content = (
        <View style={styles.cardList}>
          <Text style={styles.screenTitle}>{reframeCopy?.title || 'Your first reframe'}</Text>
          {reframeCopy?.subtitle ? <Text style={styles.screenSubtitle}>{reframeCopy.subtitle}</Text> : null}
          {isReframeLoading ? (
            <View style={styles.reframeLoadingBanner}>
              <Icon name="sparkles" size={16} color="#7c3aed" />
              <Text style={styles.reframeLoadingText}>Reframing your thoughts...</Text>
            </View>
          ) : null}
          <View style={styles.darkCard}>
            <Text style={styles.eyebrowDark}>Your thought</Text>
            <Text style={styles.darkCardText}>{state.firstThought.trim()}</Text>
          </View>
          <View style={[styles.goalCardColumn, isReframeLoading && !reframe ? styles.loadingCard : null]}>
            <Text style={styles.eyebrowViolet}>{reframe?.reframeTitle || 'A different way to look at it'}</Text>
            <Text style={[styles.chatText, isReframeLoading && !reframe ? styles.loadingText : null]}>
              {reframe?.reframeText || 'Generating a calmer perspective tailored to this thought.'}
            </Text>
          </View>
          <View style={[styles.reminderCard, isReframeLoading && !reframe ? styles.loadingCard : null]}>
            <View style={styles.reminderIcon}>
              <Icon name="target" size={18} color="#b45309" />
            </View>
            <View style={{flex: 1}}>
              <Text style={styles.reminderTitle}>{reframe?.nextStepTitle || 'Try this next'}</Text>
              <Text style={[styles.reminderBody, isReframeLoading && !reframe ? styles.loadingText : null]}>
                {reframe?.nextStepText || 'Preparing one useful next step.'}
              </Text>
            </View>
          </View>
          <View style={[styles.goalCardColumn, isReframeLoading && !reframe ? styles.loadingCard : null]}>
            <Text style={styles.eyebrowViolet}>{reframe?.questionTitle || 'One question to test it'}</Text>
            <Text style={[styles.chatText, isReframeLoading && !reframe ? styles.loadingText : null]}>
              {reframe?.questionText || 'Building one grounded question to test the thought.'}
            </Text>
          </View>
          {reframe?.patternLabel ? <Badge label={reframe.patternLabel} tone="emerald" /> : null}
        </View>
      );
      break;
    case 'signup':
      primaryLabel = state.accountMode === 'family_join' ? 'Create account and join' : 'Create account';
      secondaryLabel = 'Already have an account? Log in';
      content = (
        <View style={styles.cardList}>
          <Text style={styles.screenTitle}>Save your first reframe</Text>
          <Text style={styles.screenSubtitle}>Create your account to keep your conversations, reflections, and next steps in one place.</Text>
          <TextField label="Full name" value={state.fullName} onChange={value => onFieldChange('fullName', value)} placeholder="Your name" autoCapitalize="words" returnKeyType="next" />
          <TextField label="Email" value={state.email} onChange={value => onFieldChange('email', value)} placeholder="you@example.com" autoCapitalize="none" returnKeyType="next" />
          <TextField label="Password" value={state.password} onChange={value => onFieldChange('password', value)} placeholder="At least 8 characters" secure autoCapitalize="none" onSubmitEditing={onPrimaryAction} returnKeyType="done" />
          <View style={styles.secondaryWideButton}>
            <Icon name="mail" size={16} color="#4b5563" />
            <Text style={styles.secondaryButtonText}>Continue with Google</Text>
          </View>
        </View>
      );
      break;
    case 'familySetup':
      secondaryLabel = 'Skip for now';
      primaryLabel = 'Add child profile';
      content = (
        <View style={styles.cardList}>
          <Text style={styles.screenTitle}>Set up your family space</Text>
          <Text style={styles.screenSubtitle}>You can create child profiles now or come back later.</Text>
          <Pressable style={[styles.listCard, (state.primaryGoal === 'parenting_support' || state.primaryGoal === 'child_behavior_support') && styles.selectCardActive]}>
            <View style={styles.toolIconTile}>
              <Icon name="users" size={18} color="#7c3aed" />
            </View>
            <View style={{flex: 1}}>
              <Text style={styles.listCardTitle}>Add child profile</Text>
              <Text style={styles.listCardBody}>Create guided access, time limits, and guardian visibility.</Text>
            </View>
          </Pressable>
        </View>
      );
      break;
    case 'childProfile':
      primaryLabel = 'Create profile';
      content = (
        <View style={styles.cardList}>
          <Text style={styles.screenTitle}>Create a child profile</Text>
          <TextField label="Display name" value={state.childDisplayName} onChange={value => onFieldChange('childDisplayName', value)} placeholder="Child name" autoCapitalize="words" />
          <Text style={styles.inputLabel}>Age band</Text>
          <View style={styles.choiceGrid}>
            {(['5-8', '9-12', '13-17'] as AgeBand[]).map(item => (
              <ChoiceCard key={item} active={state.childAgeBand === item} title={item} onPress={() => onFieldChange('childAgeBand', item)} />
            ))}
          </View>
          <Text style={styles.inputLabel}>Daily time limit</Text>
          <View style={styles.choiceGrid}>
            {(['10 min', '15 min', '20 min', 'Custom'] as TimeLimit[]).map(item => (
              <ChoiceCard key={item} active={state.dailyTimeLimit === item} title={item} onPress={() => onFieldChange('dailyTimeLimit', item)} />
            ))}
          </View>
          <Text style={styles.inputLabel}>Topic restrictions</Text>
          <View style={styles.choiceGrid}>
            {(['Guided topics only', 'Limit sensitive topics', 'No open chat'] as TopicRestriction[]).map(item => (
              <ChoiceCard key={item} active={state.topicRestrictions === item} title={item} onPress={() => onFieldChange('topicRestrictions', item)} />
            ))}
          </View>
          <Text style={styles.inputLabel}>Conversation visibility</Text>
          <View style={styles.choiceGrid}>
            {(['Safety-only alerts', 'Weekly summary', 'Full guardian visibility'] as VisibilityRule[]).map(item => (
              <ChoiceCard key={item} active={state.visibilityRule === item} title={item} onPress={() => onFieldChange('visibilityRule', item)} />
            ))}
          </View>
        </View>
      );
      break;
    case 'guardianConsent':
      primaryLabel = 'Confirm and activate';
      content = (
        <View style={styles.cardList}>
          <Text style={styles.screenTitle}>Guardian confirmation</Text>
          <Text style={styles.screenSubtitle}>I confirm that I am the parent or guardian and approve this child profile for guided wellbeing and self-help use within ReframeQ.</Text>
          <Pressable onPress={() => onFieldChange('guardianConsent', !state.guardianConsent)} style={[styles.checkboxRow, state.guardianConsent && styles.checkboxRowActive]}>
            <View style={[styles.checkbox, state.guardianConsent && styles.checkboxActive]}>{state.guardianConsent ? <Icon name="check" size={12} color="#ffffff" /> : null}</View>
            <Text style={styles.checkboxLabel}>I agree</Text>
          </Pressable>
        </View>
      );
      break;
    case 'reminders':
      content = (
        <View style={styles.cardList}>
          <Text style={styles.screenTitle}>How often would you like a reminder?</Text>
          <Text style={styles.screenSubtitle}>A gentle prompt can help you return when it’s useful.</Text>
          {reminderOptions.map(item => (
            <ChoiceCard key={item.id} active={state.reminderPreference === item.id} title={item.label} desc={item.desc ?? (item.id === recommendedReminder ? 'Recommended for your setup' : undefined)} icon="calendar" onPress={() => onFieldChange('reminderPreference', item.id)} />
          ))}
        </View>
      );
      break;
    case 'complete':
      primaryLabel = 'Go to my space';
      content = (
        <View style={styles.completeWrap}>
          <View style={styles.completeIcon}>
            <Icon name="badge" size={34} color="#ffffff" />
          </View>
          <Text style={styles.welcomeTitle}>You’re all set</Text>
          <Text style={styles.welcomeBody}>
            {state.userType === 'guardian'
              ? 'Your family space is ready, and you can add more profiles anytime.'
              : state.userType === 'teen'
                ? 'Let’s start with one small step and keep things clear.'
                : 'Start with your saved reframe or check in for two minutes.'}
          </Text>
        </View>
      );
      break;
  }

  return (
    <Shell title="Onboarding" subtitle={`Step ${stepIndex + 1} of ${path.length}`} showBack={hasBack} onBack={onBack} rightSlot={<Badge label={`${Math.round(progress)}%`} tone="white" />}>
      <View style={styles.progressTrackTop}>
        <View style={[styles.progressFillTop, {width: `${progress}%`}]} />
      </View>
      {content}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <View style={styles.actionRow}>
        {hasBack ? (
          <Pressable style={styles.secondaryButton} onPress={onBack}>
            <Text style={styles.secondaryButtonText}>Back</Text>
          </Pressable>
        ) : null}
        {secondaryLabel ? (
          <Pressable style={[styles.secondaryButton, !hasBack && styles.fullWidthButton]} onPress={onSecondaryAction}>
            <Text style={styles.secondaryButtonText}>{secondaryLabel}</Text>
          </Pressable>
        ) : null}
        <Pressable style={[styles.primaryButton, (!hasBack && !secondaryLabel) && styles.fullWidthButton]} onPress={onPrimaryAction}>
          <Text style={styles.primaryButtonText}>{primaryLabel}</Text>
        </Pressable>
      </View>
    </Shell>
  );
}

export default function App() {
  const [mode, setMode] = useState<AppMode>('splash');
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [state, setState] = useState<OnboardingState>(initialOnboardingState);
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [error, setError] = useState('');
  const [childBlocking, setChildBlocking] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedReframe, setGeneratedReframe] = useState<GeneratedReframe | null>(null);
  const [isReframeLoading, setIsReframeLoading] = useState(false);
  const [createdChildProfileId, setCreatedChildProfileId] = useState<number | null>(null);
  const [guardianUserId, setGuardianUserId] = useState<number | null>(null);
  const [appProfile, setAppProfile] = useState<RemoteAppProfile | null>(null);
  const [familyCards, setFamilyCards] = useState<FamilyProfile[]>([]);
  const [onboardingConfig, setOnboardingConfig] = useState<OnboardingConfig>(defaultOnboardingConfig);
  const [aiMessages, setAiMessages] = useState<AIMessages>({
    goal: '',
    clarity: '',
    style: '',
    tutorial: null,
  });

  function resetToHomeAfterSessionExpiry() {
    setAuthToken('');
    setAppProfile(null);
    setFamilyCards([]);
    setGeneratedReframe(null);
    setIsReframeLoading(false);
    setIsSubmitting(false);
    setError('');
    setState(initialOnboardingState);
    setStep('welcome');
    clearLocalDraft();
    void clearAppSession();
    setMode('landing');
    setActiveTab('home');
  }

  const path = useMemo(() => buildFlow(state, onboardingConfig, Boolean(authToken)), [state, onboardingConfig, authToken]);

  const appScreen = useMemo(() => {
    switch (activeTab) {
      case 'chat':
        return <ChatScreen profile={appProfile} state={state} authToken={authToken} generatedReframe={generatedReframe} onBack={() => setActiveTab('home')} />;
      case 'reports':
        return <ReportsScreen authToken={authToken} onBack={() => setActiveTab('home')} />;
      case 'tools':
        return <ToolsScreen onBack={() => setActiveTab('home')} />;
      case 'family':
        return <FamilyScreen profiles={familyCards} onBack={() => setActiveTab('home')} />;
      case 'profile':
        return <ProfileScreen profile={appProfile} authToken={authToken} onProfileUpdated={setAppProfile} onLogout={handleLogout} onBack={() => setActiveTab('home')} />;
      default:
        return <HomeScreen profile={appProfile} authToken={authToken} onOpenReports={() => setActiveTab('reports')} />;
    }
  }, [activeTab, appProfile, familyCards, state, authToken, generatedReframe]);

  useEffect(() => {
    let active = true;

    async function bootstrapApp() {
      const session = await loadAppSession();
      if (!session) {
        if (active) setIsBootstrapping(false);
        return;
      }

      try {
        const [profile, onboarding] = await Promise.all([
          fetchMyProfile(session.token).catch(() => null),
          fetchOnboardingState(session.token).catch(() => null),
        ]);

        if (!active || !profile) {
          await clearAppSession();
          if (active) setIsBootstrapping(false);
          return;
        }

        setAuthToken(session.token);
        setAppProfile(profile);
        setActiveTab(session.activeTab || (profile.user_type === 'guardian' ? 'family' : 'home'));

        if (onboarding && !onboarding.completed && onboardingConfig.policy.allow_resume) {
          const restoredState = fromPersistedState(onboarding.state);
          setGeneratedReframe(fromPersistedFirstReframe(onboarding.state.first_reframe_snapshot));
          setState(current => ({...current, ...restoredState, password: ''}));
          setStep((onboarding.step as OnboardingStep) || 'welcome');
          setMode('onboarding');
        } else {
          if (profile.onboarding?.state) {
            setGeneratedReframe(fromPersistedFirstReframe((profile.onboarding.state as PersistedOnboardingState).first_reframe_snapshot));
            setState(current => ({...current, ...fromPersistedState(profile.onboarding.state as Partial<PersistedOnboardingState>), password: ''}));
          }
          setMode('app');
        }
      } finally {
        if (active) setIsBootstrapping(false);
      }
    }

    bootstrapApp();
    return () => {
      active = false;
    };
  }, [onboardingConfig.policy.allow_resume]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      resetToHomeAfterSessionExpiry();
    });

    return () => {
      setUnauthorizedHandler(null);
    };
  }, []);

  useEffect(() => {
    if (mode !== 'splash' || isBootstrapping) return;
    const timeout = setTimeout(() => setMode('landing'), 900);
    return () => clearTimeout(timeout);
  }, [mode, isBootstrapping]);

  useEffect(() => {
    if (!onboardingConfig.policy.allow_resume) {
      clearLocalDraft();
      return;
    }
    const draft = loadLocalDraft();
    if (!draft) return;
    setState(current => ({...current, ...draft.state}));
    setStep(draft.step);
  }, [onboardingConfig.policy.allow_resume]);

  useEffect(() => {
    fetchOnboardingConfig()
      .then(config => setOnboardingConfig(config))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    setState(current => {
      let next = current;
      const enabledAccountModes = onboardingConfig.policy.enabled_account_modes.filter(item => item.enabled).map(item => item.key);
      const enabledUserTypes = onboardingConfig.policy.enabled_user_types.filter(item => item.enabled).map(item => item.key);

      if (!onboardingConfig.policy.onboarding_enabled) {
        return {...current, accountMode: 'individual', userType: 'adult'};
      }
      if ((current.accountMode === 'family_owner' || current.accountMode === 'family_join') && (!onboardingConfig.policy.allow_family_flows || !enabledAccountModes.includes(current.accountMode))) {
        next = {...next, accountMode: enabledAccountModes.includes('individual') ? 'individual' : ''};
      }
      if (current.userType === 'teen' && !enabledUserTypes.includes('teen')) {
        next = {...next, userType: enabledUserTypes.includes('adult') ? 'adult' : enabledUserTypes.includes('guardian') ? 'guardian' : ''};
      }
      if ((current.userType === 'guardian' || current.userType === 'child_with_guardian') && !enabledUserTypes.includes('guardian')) {
        next = {...next, userType: enabledUserTypes.includes('adult') ? 'adult' : enabledUserTypes.includes('teen') ? 'teen' : ''};
      }
      if (current.userType === 'adult' && !enabledUserTypes.includes('adult')) {
        next = {...next, userType: enabledUserTypes.includes('teen') ? 'teen' : enabledUserTypes.includes('guardian') ? 'guardian' : ''};
      }
      return next;
    });
  }, [onboardingConfig]);

  useEffect(() => {
    saveLocalDraft(step, state);
  }, [step, state]);

  useEffect(() => {
    if (!authToken) {
      void clearAppSession();
      return;
    }
    void saveAppSession(authToken, activeTab);
  }, [authToken, activeTab]);

  useEffect(() => {
    if (!authToken) return;
    const timeout = setTimeout(() => {
      const persisted = toPersistedState(state);
      if (generatedReframe) {
        persisted.first_reframe_snapshot = {
          user_thought: generatedReframe.thought,
          pattern_label: generatedReframe.patternLabel ?? null,
          reframe_title: generatedReframe.reframeTitle ?? 'A different way to look at it',
          reframe_text: generatedReframe.reframeText,
          next_step_title: generatedReframe.nextStepTitle ?? 'Try this next',
          next_step_text: generatedReframe.nextStepText,
          question_title: generatedReframe.questionTitle ?? 'One question to test it',
          question_text: generatedReframe.questionText,
          config_version: generatedReframe.configVersion ?? null,
          fallback_used: generatedReframe.fallbackUsed ?? false,
        };
      }
      saveOnboardingState(authToken, {
        step,
        completed: state.onboardingComplete,
        state: persisted,
      }).catch(error => {
        if (!isUnauthorizedError(error)) {
          return undefined;
        }
        return undefined;
      });
    }, 300);
    return () => clearTimeout(timeout);
  }, [authToken, step, state, generatedReframe]);

  useEffect(() => {
    if (!authToken) return;
    fetchMyProfile(authToken)
      .then(profile => {
        setAppProfile(profile);
      })
      .catch(() => undefined);
    fetchMyProfiles(authToken)
      .then(items => {
        setFamilyCards(
          items.map(item => ({
            name: item.display_name,
            type: item.profile_type,
            age: item.age_band,
            rule: item.conversation_visibility_rule || 'Private',
            time: item.daily_time_limit_minutes ? `${item.daily_time_limit_minutes} min/day` : 'No limit',
            topics: item.topic_restrictions.join(', ') || 'Standard',
            status: item.profile_active ? 'Active' : 'Inactive',
          })),
        );
      })
      .catch(() => setFamilyCards([]));
  }, [authToken, state.onboardingComplete]);

  function buildAIRequest(aiStep: 'goal_microcopy' | 'clarity_interpretation' | 'style_confirmation' | 'tutorial_example' | 'first_reframe', userMessage?: string): OnboardingAIRequest {
    const scanStatus: 'allow' | 'limit' | 'block' | 'handoff' =
      state.safetyFlag === 'severe' ? 'handoff' : state.safetyFlag === 'moderate' ? 'limit' : 'allow';
    return {
      contract_version: '2026-03-07',
      surface: 'onboarding' as const,
      step: aiStep,
      context: {
        entry_context: {
          app_source: state.accountMode === 'family_join' ? 'family_invite' : 'organic',
          signup_path: state.accountMode === 'family_join' ? 'family_invite' : 'direct_signup',
          language: state.language,
          country: state.country,
          is_new_user: true,
          is_resuming: false,
        },
        account_context: {
          account_mode: state.accountMode || 'individual',
          user_type: normalizeUserType(state.userType),
        },
        goal_context: {
          goal: normalizeGoal(state.primaryGoal),
          secondary_goals: state.secondaryGoals.map(item => normalizeGoal(item)),
        },
        state_context: {
          clarity_score: state.clarity ? state.clarity * 10 : null,
          control_score: state.control ? state.control * 10 : null,
          mental_noise_score: state.noise ? state.noise * 10 : null,
          readiness_score: state.readiness ? state.readiness * 10 : null,
        },
        style_context: {
          coach_style: state.coachStyle || defaultCoachStyle(state),
        },
        family_context: {
          is_family_flow: state.accountMode !== 'individual',
          family_role: state.accountMode === 'family_owner' ? 'owner' : state.accountMode === 'family_join' ? 'member' : null,
          child_age_band: normalizeAgeBand(state.childAgeBand),
          visibility_mode: normalizeVisibilityRule(state.visibilityRule),
          topic_restrictions: normalizeTopicRestrictions(state.topicRestrictions),
        },
        input_context: {
          user_message: userMessage || state.firstThought || null,
          detected_pattern: detectPattern(userMessage || state.firstThought).replace('all-or-nothing', 'all_or_nothing').replace('mind reading', 'mind_reading'),
          emotion_intensity_hint: state.noise >= 8 ? 'high' : state.noise >= 5 ? 'medium' : 'low',
        },
        safety_context: {
          scan_status: scanStatus,
          policy_code: state.safetyFlag === 'none' ? 'ok' : state.safetyFlag,
          blocked_topics: [],
          needs_handoff: state.safetyFlag === 'severe',
        },
      },
    };
  }

  useEffect(() => {
    if (!state.primaryGoal) return;
    generateOnboardingAI(buildAIRequest('goal_microcopy'))
      .then(response => setAiMessages(current => ({...current, goal: response.result.message || ''})))
      .catch(() => undefined);
    generateOnboardingAI(buildAIRequest('tutorial_example'))
      .then(response =>
        setAiMessages(current => ({
          ...current,
          tutorial: {
            situation: response.result.situation || undefined,
            thought: response.result.thought || undefined,
            reframe: response.result.reframe || undefined,
          },
        })),
      )
      .catch(() => undefined);
  }, [state.primaryGoal, state.secondaryGoals, state.userType, state.accountMode, state.language, state.country]);

  useEffect(() => {
    if (!state.clarity || !state.control || !state.noise) return;
    generateOnboardingAI(buildAIRequest('clarity_interpretation'))
      .then(response => setAiMessages(current => ({...current, clarity: response.result.message || ''})))
      .catch(() => undefined);
  }, [state.clarity, state.control, state.noise, state.readiness, state.coachStyle]);

  useEffect(() => {
    if (!state.coachStyle) return;
    generateOnboardingAI(buildAIRequest('style_confirmation'))
      .then(response => setAiMessages(current => ({...current, style: response.result.message || ''})))
      .catch(() => undefined);
  }, [state.coachStyle, state.language]);

  function handleLogout() {
    resetToHomeAfterSessionExpiry();
  }

  function setField<K extends keyof OnboardingState>(key: K, value: OnboardingState[K]) {
    setError('');
    if (key === 'userType') setChildBlocking(value === 'child_with_guardian');
    setState(current => {
      if (key === 'primaryGoal') {
        const nextPrimaryGoal = value as GoalId;
        const nextSecondaryGoals = current.secondaryGoals.filter(item => item !== nextPrimaryGoal).slice(0, 2);
        return {
          ...current,
          primaryGoal: nextPrimaryGoal,
          secondaryGoals: nextSecondaryGoals,
        };
      }

      return {...current, [key]: value};
    });
  }

  function toggleSecondaryGoal(goal: GoalId) {
    setState(current => {
      const exists = current.secondaryGoals.includes(goal);
      if (exists) {
        return {...current, secondaryGoals: current.secondaryGoals.filter(item => item !== goal)};
      }
      if (current.secondaryGoals.length >= 2) return current;
      return {...current, secondaryGoals: [...current.secondaryGoals, goal]};
    });
  }

  function moveTo(next: OnboardingStep) {
    setError('');
    setStep(next);
  }

  function nextFrom(currentStep: OnboardingStep): OnboardingStep {
    const index = path.indexOf(currentStep);
    return path[Math.min(index + 1, path.length - 1)];
  }

  function previousFrom(currentStep: OnboardingStep): OnboardingStep {
    const index = path.indexOf(currentStep);
    return path[Math.max(index - 1, 0)];
  }

  async function requestFirstReframe(token: string, thought: string): Promise<GeneratedReframe> {
    try {
      const response = await generateOnboardingAI(buildAIRequest('first_reframe', thought), token);

      const result: OnboardingAIResult = response.result;
      return {
        thought,
        reframeText: result.reframe_text || result.reframe || buildReframe(state).reframeText,
        nextStepText: result.next_step_text || result.next_step || buildReframe(state).nextStepText,
        questionText: result.question_text || result.socratic_question || buildReframe(state).questionText,
        reframeTitle: result.reframe_title || 'A different way to look at it',
        nextStepTitle: result.next_step_title || 'Try this next',
        questionTitle: result.question_title || 'One question to test it',
        patternLabel: result.pattern_label || result.detected_pattern_label || undefined,
        configVersion: result.config_version || undefined,
        fallbackUsed: result.fallback_used,
      };
    } catch {
      return buildReframe(state);
    }
  }

  async function handlePrimary() {
    setError('');
    if (isSubmitting) return;
    switch (step) {
      case 'welcome':
        if (!onboardingConfig.policy.onboarding_enabled) return setError('Onboarding is temporarily unavailable.');
        if (!onboardingConfig.policy.allow_family_flows && isToggleEnabled(onboardingConfig.policy.enabled_account_modes, 'individual')) {
          setState(current => ({...current, accountMode: 'individual'}));
          moveTo('userType');
          return;
        }
        moveTo('accountMode');
        return;
      case 'accountMode':
        if (!state.accountMode) return setError('Select an account mode to continue.');
        if (!onboardingConfig.policy.allow_family_flows && state.accountMode !== 'individual') return setError('Family onboarding is currently disabled.');
        moveTo(state.accountMode === 'family_join' ? 'inviteCode' : 'userType');
        return;
      case 'inviteCode': {
        const code = state.inviteCode.trim().toUpperCase();
        if (!code) return setError('Enter an invite code.');
        if (!state.inviteValidated) {
          try {
            setIsSubmitting(true);
            const result = await validateInviteCode(code);
            if (!result.valid) {
              setError('Invalid or expired code. Try again.');
              return;
            }
            setState(current => ({...current, inviteCode: result.invite_code, inviteValidated: true, accountMode: 'family_join'}));
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Invite validation failed');
          } finally {
            setIsSubmitting(false);
          }
          return;
        }
        moveTo('userType');
        return;
      }
      case 'userType':
        if (!state.userType) return setError('Select who you are setting this up for.');
        if (state.userType === 'teen' && !isToggleEnabled(onboardingConfig.policy.enabled_user_types, 'teen')) return setError('Teen onboarding is currently disabled.');
        if ((state.userType === 'guardian' || state.userType === 'child_with_guardian') && !isToggleEnabled(onboardingConfig.policy.enabled_user_types, 'guardian')) return setError('Guardian onboarding is currently disabled.');
        if (state.userType === 'adult' && !isToggleEnabled(onboardingConfig.policy.enabled_user_types, 'adult')) return setError('Adult onboarding is currently disabled.');
        if (state.userType === 'child_with_guardian') {
          setChildBlocking(true);
          return setError('A parent or guardian needs to continue setup.');
        }
        moveTo('goal');
        return;
      case 'goal':
        if (!state.primaryGoal) return setError('Select a primary goal to continue.');
        moveTo('clarity');
        return;
      case 'clarity':
        if (!state.clarity || !state.control || !state.noise) return setError('Complete the first three check-in questions.');
        moveTo('style');
        return;
      case 'style': {
        const resolvedStyle = state.coachStyle || defaultCoachStyle(state);
        setState(current => ({...current, coachStyle: resolvedStyle}));
        moveTo('tutorial');
        return;
      }
      case 'tutorial':
        moveTo('thought');
        return;
      case 'thought': {
        const thought = state.firstThought.trim();
        if (thought.length < 5) return setError('Write at least a short thought or situation.');
        const fallbackSafety = detectSafety(thought);
        try {
          setIsSubmitting(true);
          const safetyResult = await scanOnboardingSafety(thought);
          const safety =
            safetyResult.scan_status === 'handoff' || safetyResult.needs_handoff
              ? 'severe'
              : safetyResult.scan_status === 'limit'
                ? 'moderate'
                : 'none';
          const nextState: OnboardingState = {...state, firstThought: thought, safetyFlag: safety};
          setState(current => ({...current, firstThought: thought, safetyFlag: safety}));
          if (safety === 'severe') {
            setGeneratedReframe(null);
            setIsReframeLoading(false);
            moveTo('safety');
            return;
          }
          setGeneratedReframe(null);
          setIsReframeLoading(true);
          moveTo('reframe');
          requestFirstReframe(authToken, thought)
            .then(aiReframe => setGeneratedReframe(aiReframe))
            .catch(() => setGeneratedReframe(buildReframe(nextState)))
            .finally(() => {
              setIsReframeLoading(false);
              setIsSubmitting(false);
            });
          return;
        } catch {
          const nextState: OnboardingState = {...state, firstThought: thought, safetyFlag: fallbackSafety};
          setState(current => ({...current, firstThought: thought, safetyFlag: fallbackSafety}));
          if (fallbackSafety === 'severe') {
            setGeneratedReframe(null);
            setIsReframeLoading(false);
            setIsSubmitting(false);
            moveTo('safety');
            return;
          }
          setGeneratedReframe(null);
          setIsReframeLoading(Boolean(authToken));
          moveTo('reframe');
          if (authToken) {
            requestFirstReframe(authToken, thought)
              .then(aiReframe => setGeneratedReframe(aiReframe))
              .catch(() => setGeneratedReframe(buildReframe(nextState)))
              .finally(() => {
                setIsReframeLoading(false);
                setIsSubmitting(false);
              });
            return;
          }
          setGeneratedReframe(buildReframe(nextState));
          setIsReframeLoading(false);
          setIsSubmitting(false);
          return;
        }
      }
      case 'safety':
        return setError('Support resources are not wired yet in this prototype. Use "Continue with a different topic" to return.');
      case 'reframe':
        if (authToken) {
          moveTo(state.accountMode === 'family_owner' ? 'familySetup' : 'reminders');
          return;
        }
        moveTo('signup');
        return;
      case 'signup':
        if (!state.fullName.trim()) return setError('Full name is required.');
        if (!validateEmail(state.email.trim())) return setError('Enter a valid email address.');
        if (state.password.trim().length < 8) return setError('Password must be at least 8 characters.');
        try {
          setIsSubmitting(true);
          const payload = await registerApp({
            full_name: state.fullName.trim(),
            email: state.email.trim(),
            password: state.password,
            country: state.country,
            language: state.language,
          });
          setAuthToken(payload.access_token);
          if (state.accountMode === 'family_owner') moveTo('familySetup');
          else moveTo('reminders');
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Registration failed');
        } finally {
          setIsSubmitting(false);
        }
        return;
      case 'familySetup':
        moveTo('childProfile');
        return;
      case 'childProfile':
        if (!state.childDisplayName.trim()) return setError('Display name is required.');
        if (!state.childAgeBand || !state.dailyTimeLimit || !state.topicRestrictions || !state.visibilityRule) {
          return setError('Complete all child profile settings.');
        }
        if (!authToken) return setError('Create your account first.');
        try {
          setIsSubmitting(true);
          const profile = await createMyProfile(authToken, {
            profile_type: 'child',
            display_name: state.childDisplayName.trim(),
            age_band: normalizeAgeBand(state.childAgeBand) ?? '13_15',
            daily_time_limit_minutes: mapTimeLimitToMinutes(state.dailyTimeLimit),
            topic_restrictions: normalizeTopicRestrictions(state.topicRestrictions),
            conversation_visibility_rule: normalizeVisibilityRule(state.visibilityRule) ?? 'summary_only',
          });
          setCreatedChildProfileId(profile.profile_id);
          setGuardianUserId(profile.primary_user_id);
          moveTo('guardianConsent');
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to create child profile');
        } finally {
          setIsSubmitting(false);
        }
        return;
      case 'guardianConsent':
        if (!state.guardianConsent) return setError('Guardian confirmation is required before activation.');
        if (!authToken || !createdChildProfileId || !guardianUserId) return setError('Child profile setup is incomplete.');
        try {
          setIsSubmitting(true);
          await recordChildConsent(authToken, createdChildProfileId, guardianUserId);
          moveTo('reminders');
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to record consent');
        } finally {
          setIsSubmitting(false);
        }
        return;
      case 'reminders':
        if (!state.reminderPreference) return setError('Choose a reminder preference.');
        moveTo('complete');
        return;
      case 'complete':
        setState(current => ({...current, onboardingComplete: true}));
        setMode('app');
        if (state.userType === 'guardian') setActiveTab('family');
        else if (state.primaryGoal === 'overthinking' || state.primaryGoal === 'friendships_social') setActiveTab('chat');
        else setActiveTab('home');
        return;
    }
  }

  function handleSecondary() {
    setError('');
    switch (step) {
      case 'welcome':
        if (!onboardingConfig.policy.allow_family_flows || !isToggleEnabled(onboardingConfig.policy.enabled_account_modes, 'family_join')) {
          return setError('Family invite onboarding is currently disabled.');
        }
        setState(current => ({...current, accountMode: 'family_join'}));
        moveTo('inviteCode');
        return;
      case 'style':
        setState(current => ({...current, coachStyle: defaultCoachStyle(current)}));
        moveTo('tutorial');
        return;
      case 'tutorial':
        moveTo('thought');
        return;
      case 'safety':
        setState(current => ({...current, firstThought: '', safetyFlag: 'none'}));
        moveTo('thought');
        return;
      case 'reframe':
        moveTo('thought');
        return;
      case 'signup':
        return setError('Login resume is not wired in this prototype yet.');
      case 'familySetup':
        moveTo('reminders');
        return;
      default:
        return;
    }
  }

  if (mode === 'splash') {
    return <SplashScreen />;
  }

  if (mode === 'landing') {
    return (
      <LandingScreen
        onStart={() => {
          setError('');
          setStep('welcome');
          setMode('onboarding');
        }}
        onInvite={() => {
          setError('');
          setState(current => ({...current, accountMode: 'family_join'}));
          setStep('inviteCode');
          setMode('onboarding');
        }}
        onLogin={() => {
          setError('');
          setMode('auth');
        }}
      />
    );
  }

  if (mode === 'auth') {
    return (
      <AuthScreen
        email={loginEmail}
        password={loginPassword}
        error={error}
        onEmailChange={value => {
          setError('');
          setLoginEmail(value);
        }}
        onPasswordChange={value => {
          setError('');
          setLoginPassword(value);
        }}
        onBack={() => {
          setError('');
          setMode('landing');
        }}
        onLogin={() => {
          setError('');
          if (!validateEmail(loginEmail.trim())) {
            setError('Enter a valid email address.');
            return;
          }
          if (loginPassword.trim().length < 8) {
            setError('Enter your password to continue.');
            return;
          }
          setIsSubmitting(true);
          loginApp(loginEmail.trim(), loginPassword)
            .then(async payload => {
              setAuthToken(payload.access_token);
              const onboarding = await fetchOnboardingState(payload.access_token).catch(() => null);
              const profile = await fetchMyProfile(payload.access_token).catch(() => null);
              if (profile) setAppProfile(profile);
              if (onboarding && !onboarding.completed && onboardingConfig.policy.allow_resume) {
                const restoredState = fromPersistedState(onboarding.state);
                setGeneratedReframe(fromPersistedFirstReframe(onboarding.state.first_reframe_snapshot));
                setState(current => ({...current, ...restoredState, password: ''}));
                setStep((onboarding.step as OnboardingStep) || 'welcome');
                setMode('onboarding');
                return;
              }
              if (profile?.onboarding?.state) {
                setGeneratedReframe(fromPersistedFirstReframe((profile.onboarding.state as PersistedOnboardingState).first_reframe_snapshot));
                setState(current => ({...current, ...fromPersistedState(profile.onboarding.state as Partial<PersistedOnboardingState>), password: ''}));
              }
              setMode('app');
              setActiveTab(profile?.user_type === 'guardian' ? 'family' : 'home');
            })
            .catch(err => {
              setError(err instanceof Error ? err.message : 'Login failed');
            })
            .finally(() => {
              setIsSubmitting(false);
            });
        }}
      />
    );
  }

  if (mode === 'onboarding') {
    return (
      <OnboardingScreen
        state={state}
        step={step}
        path={path}
        config={onboardingConfig}
        error={error}
        childBlocking={childBlocking}
        isReframeLoading={isReframeLoading}
        generatedReframe={generatedReframe}
        aiMessages={aiMessages}
        onFieldChange={setField}
        onToggleSecondaryGoal={toggleSecondaryGoal}
        onPrimaryAction={handlePrimary}
        onSecondaryAction={handleSecondary}
        onBack={() => {
          if (step === 'welcome') {
            setError('');
            setMode('landing');
            return;
          }
          moveTo(previousFrom(step));
        }}
        onChildPathFix={() => {
          setChildBlocking(false);
          setState(current => ({...current, userType: 'guardian'}));
        }}
      />
    );
  }

  return (
    <View style={styles.root}>
      {appScreen}
      <BottomNav activeTab={activeTab} onChange={setActiveTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  absCenter: {position: 'absolute', top: '50%', left: '50%'},
  root: {flex: 1, backgroundColor: '#f7ebff'},
  safeArea: {flex: 1, backgroundColor: '#f7ebff'},
  splashSafe: {flex: 1, backgroundColor: '#f7ebff'},
  splashWrap: {flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18, backgroundColor: '#f7ebff'},
  splashLogo: {width: 88, height: 88, borderRadius: 30, backgroundColor: '#8b5cf6', alignItems: 'center', justifyContent: 'center'},
  splashTitle: {fontSize: 30, fontWeight: '700', color: '#111827'},
  splashSubtitle: {fontSize: 15, lineHeight: 22, color: '#6b7280', textAlign: 'center', paddingHorizontal: 36, maxWidth: 340},
  landingScrollContent: {flexGrow: 1},
  landingShell: {flex: 1, minHeight: '100%', paddingHorizontal: 24, paddingTop: 18, paddingBottom: 28, backgroundColor: '#f7ebff'},
  landingTop: {alignItems: 'center'},
  landingBrand: {flexDirection: 'row', alignItems: 'center', gap: 12},
  logoBadgeLarge: {width: 52, height: 52, borderRadius: 18, backgroundColor: '#8b5cf6', alignItems: 'center', justifyContent: 'center'},
  landingBrandText: {fontSize: 24, fontWeight: '700', color: '#111827'},
  landingCenter: {flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 24},
  landingArt: {width: '100%', height: 200, alignItems: 'center', justifyContent: 'center', marginBottom: 20},
  landingOrbPrimary: {position: 'absolute', width: 180, height: 180, borderRadius: 999, backgroundColor: '#ddd6fe'},
  landingOrbSecondary: {position: 'absolute', width: 120, height: 120, borderRadius: 999, backgroundColor: '#fae8ff', right: 40, top: 30},
  landingCardFloat: {paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.92)', flexDirection: 'row', alignItems: 'center', gap: 10},
  landingFloatText: {fontSize: 14, fontWeight: '600', color: '#4b5563'},
  landingHeadline: {fontSize: 32, lineHeight: 39, fontWeight: '700', color: '#111827', textAlign: 'center', paddingHorizontal: 6},
  landingSubtitle: {fontSize: 16, lineHeight: 24, color: '#6b7280', textAlign: 'center', marginTop: 14, paddingHorizontal: 8, marginBottom: 8},
  carouselCard: {width: '100%', backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 26, padding: 18, marginTop: 20, alignItems: 'center'},
  carouselHeaderRow: {width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10},
  carouselMain: {flex: 1, alignItems: 'center'},
  carouselArrow: {width: 34, height: 34, borderRadius: 17, backgroundColor: '#f5f3ff', alignItems: 'center', justifyContent: 'center'},
  carouselTitle: {fontSize: 18, fontWeight: '700', color: '#111827', textAlign: 'center'},
  carouselBody: {fontSize: 14, lineHeight: 20, color: '#6b7280', textAlign: 'center', marginTop: 6},
  carouselDots: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12},
  carouselDot: {width: 8, height: 8, borderRadius: 999, backgroundColor: '#d8b4fe'},
  carouselDotActive: {width: 22, backgroundColor: '#7c3aed'},
  landingBottom: {gap: 12, marginTop: 28},
  loginLink: {fontSize: 14, color: '#6d28d9', fontWeight: '600', textAlign: 'center'},
  landingTrustText: {fontSize: 13, lineHeight: 18, color: '#6b7280', textAlign: 'center', marginTop: 16, paddingHorizontal: 12},
  appShell: {flex: 1, backgroundColor: '#fff4fb', paddingHorizontal: 16, paddingTop: 8},
  headerRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 20},
  headerLeft: {flexDirection: 'row', alignItems: 'center', flex: 1},
  headerLeadGroup: {flexDirection: 'row', alignItems: 'center', gap: 10},
  backButton: {width: 40, height: 40, borderRadius: 20, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: {width: 0, height: 4}, elevation: 2},
  logoBadge: {width: 40, height: 40, borderRadius: 16, backgroundColor: '#8b5cf6', alignItems: 'center', justifyContent: 'center', shadowColor: '#7c3aed', shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: {width: 0, height: 6}, elevation: 4},
  logoBadgeSmall: {width: 34, height: 34, borderRadius: 14, backgroundColor: '#8b5cf6', alignItems: 'center', justifyContent: 'center', shadowColor: '#7c3aed', shadowOpacity: 0.28, shadowRadius: 10, shadowOffset: {width: 0, height: 4}, elevation: 3},
  headerTextWrap: {marginLeft: 12, flex: 1},
  headerTitle: {fontSize: 24, fontWeight: '700', color: '#111827'},
  headerSubtitle: {fontSize: 13, color: '#6b7280', marginTop: 2},
  headerRight: {minWidth: 32, alignItems: 'center'},
  scrollContent: {paddingTop: 18, paddingBottom: 120, gap: 16},
  badge: {borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6},
  badgeText: {fontSize: 12, fontWeight: '600'},
  sectionHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4},
  sectionTitle: {fontSize: 18, fontWeight: '700', color: '#111827'},
  sectionLink: {fontSize: 14, fontWeight: '600', color: '#7c3aed'},
  heroCard: {backgroundColor: '#8b5cf6', borderRadius: 28, padding: 20},
  heroEyebrow: {color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '500'},
  heroTitle: {color: '#ffffff', fontSize: 28, fontWeight: '700', marginTop: 4},
  heroBody: {color: 'rgba(255,255,255,0.85)', fontSize: 13, lineHeight: 19, marginTop: 8},
  heroIconBubble: {width: 52, height: 52, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center'},
  rowSpace: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start'},
  moodGrid: {flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8, marginTop: 18},
  moodButton: {width: '18%', minWidth: 58, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 18, paddingHorizontal: 6, paddingVertical: 12, alignItems: 'center'},
  moodButtonActive: {backgroundColor: 'rgba(255,255,255,0.3)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.65)'},
  moodEmoji: {fontSize: 22},
  moodLabel: {color: 'rgba(255,255,255,0.92)', fontSize: 10, textAlign: 'center', marginTop: 4, lineHeight: 12},
  heroMeta: {color: 'rgba(255,255,255,0.88)', fontSize: 12, marginTop: 10},
  statsRow: {flexDirection: 'row', gap: 12},
  softCardHalf: {flex: 1, backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 24, padding: 16},
  inlineIconRow: {flexDirection: 'row', alignItems: 'center', gap: 8},
  statLabel: {fontSize: 13, color: '#7c3aed', fontWeight: '600'},
  statValue: {fontSize: 26, color: '#111827', fontWeight: '700', marginTop: 10},
  statHint: {fontSize: 12, color: '#6b7280', marginTop: 4, lineHeight: 17},
  progressTrack: {flex: 1, height: 8, borderRadius: 999, backgroundColor: '#f3e8ff', overflow: 'hidden'},
  progressFill: {height: '100%', backgroundColor: '#d946ef', borderRadius: 999},
  filterRow: {flexDirection: 'row', gap: 10, flexWrap: 'wrap'},
  filterChip: {paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5e7eb'},
  filterChipActive: {backgroundColor: '#7c3aed', borderColor: '#7c3aed'},
  filterChipText: {fontSize: 12, fontWeight: '600', color: '#6b7280'},
  filterChipTextActive: {color: '#ffffff'},
  progressTrackTop: {height: 8, borderRadius: 999, backgroundColor: '#ede9fe', overflow: 'hidden', marginBottom: 16},
  progressFillTop: {height: '100%', backgroundColor: '#7c3aed', borderRadius: 999},
  miniChartWrap: {marginTop: 8, backgroundColor: '#f8f4ff', borderRadius: 18, padding: 12},
  reportChartWrap: {marginTop: 12, backgroundColor: '#f8f4ff', borderRadius: 18, padding: 12},
  chartArea: {width: '100%', overflow: 'hidden', justifyContent: 'center'},
  cardList: {gap: 12},
  listCard: {flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: 'rgba(255,255,255,0.94)', borderRadius: 24, padding: 16},
  toolIconTile: {width: 44, height: 44, borderRadius: 16, backgroundColor: '#ede9fe', alignItems: 'center', justifyContent: 'center'},
  listCardTitle: {fontSize: 16, fontWeight: '600', color: '#111827'},
  listCardBody: {fontSize: 13, color: '#6b7280', marginTop: 4, lineHeight: 18},
  screenTitle: {fontSize: 28, fontWeight: '700', color: '#111827'},
  screenSubtitle: {fontSize: 14, color: '#6b7280', lineHeight: 20, marginTop: 4},
  selectCard: {flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: 'rgba(255,255,255,0.94)', borderRadius: 24, padding: 16, borderWidth: 1, borderColor: '#f5f3ff'},
  selectCardActive: {borderColor: '#c4b5fd', backgroundColor: '#f5f3ff'},
  selectIconWrap: {width: 44, height: 44, borderRadius: 16, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center'},
  selectIconWrapActive: {backgroundColor: '#ede9fe'},
  centerStack: {gap: 20, paddingTop: 36},
  welcomeIcon: {alignSelf: 'center', width: 80, height: 80, borderRadius: 28, backgroundColor: '#8b5cf6', alignItems: 'center', justifyContent: 'center'},
  welcomeTitle: {fontSize: 32, fontWeight: '700', color: '#111827', textAlign: 'center'},
  welcomeBody: {fontSize: 14, color: '#6b7280', lineHeight: 22, textAlign: 'center', marginTop: 12, paddingHorizontal: 16},
  inputBlock: {gap: 8},
  inputLabel: {fontSize: 14, fontWeight: '600', color: '#374151'},
  input: {backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 12, color: '#111827', fontSize: 14},
  inputDisabled: {backgroundColor: '#f3f4f6', color: '#6b7280'},
  phoneRow: {flexDirection: 'row', gap: 10, alignItems: 'flex-start'},
  phoneCodeWrap: {width: 116, position: 'relative', zIndex: 5},
  phoneCodeButton: {backgroundColor: '#f5f3ff', borderWidth: 1, borderColor: '#ddd6fe', borderRadius: 18, paddingHorizontal: 12, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  phoneCodeButtonText: {fontSize: 14, fontWeight: '600', color: '#6d28d9'},
  phoneCodeDropdown: {position: 'absolute', top: 54, left: 0, right: 0, backgroundColor: '#ffffff', borderRadius: 18, borderWidth: 1, borderColor: '#e5e7eb', paddingVertical: 6, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: {width: 0, height: 4}, elevation: 4},
  phoneCodeOption: {paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8},
  phoneCodeOptionActive: {backgroundColor: '#f5f3ff'},
  phoneCodeOptionLabel: {flex: 1, fontSize: 12, color: '#4b5563'},
  phoneCodeOptionCode: {fontSize: 13, fontWeight: '700', color: '#6d28d9'},
  phoneNumberWrap: {flex: 1},
  inlineSelectButton: {backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8},
  inlineSelectValue: {flex: 1, fontSize: 14, color: '#111827'},
  inlineSelectPlaceholder: {color: '#9ca3af'},
  sheetBackdrop: {flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(17,24,39,0.28)'},
  sheetScrim: {flex: 1},
  sheetCard: {maxHeight: '72%', backgroundColor: '#ffffff', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 14, paddingHorizontal: 16, paddingBottom: Platform.OS === 'ios' ? 28 : 16},
  sheetHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8},
  sheetTitle: {fontSize: 18, fontWeight: '700', color: '#111827'},
  sheetCloseButton: {paddingVertical: 8, paddingHorizontal: 10},
  sheetCloseText: {fontSize: 14, fontWeight: '600', color: '#6d28d9'},
  sheetList: {flexGrow: 0},
  sheetListContent: {paddingBottom: 12},
  sheetOption: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 14, borderRadius: 16},
  sheetOptionActive: {backgroundColor: '#f5f3ff'},
  sheetOptionText: {flex: 1, fontSize: 15, color: '#374151'},
  sheetOptionTextActive: {color: '#6d28d9', fontWeight: '600'},
  textarea: {minHeight: 140, textAlignVertical: 'top'},
  goalGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8},
  goalPill: {width: '48%', backgroundColor: 'rgba(255,255,255,0.94)', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 14},
  goalPillActive: {backgroundColor: '#7c3aed'},
  goalPillText: {fontSize: 13, color: '#4b5563', fontWeight: '600'},
  goalPillTextActive: {color: '#ffffff'},
  secondaryGoalPill: {width: '48%', backgroundColor: '#ffffff', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: '#ddd6fe'},
  secondaryGoalPillActive: {backgroundColor: '#ede9fe', borderColor: '#c4b5fd'},
  secondaryGoalText: {fontSize: 12, color: '#6b7280', fontWeight: '600'},
  secondaryGoalTextActive: {color: '#7c3aed'},
  sliderCard: {backgroundColor: 'rgba(255,255,255,0.94)', borderRadius: 24, padding: 16},
  numberRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12},
  numberDot: {width: 30, height: 30, borderRadius: 15, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#ddd6fe', alignItems: 'center', justifyContent: 'center'},
  numberDotActive: {backgroundColor: '#7c3aed', borderColor: '#7c3aed'},
  numberDotText: {fontSize: 12, color: '#6b7280', fontWeight: '600'},
  numberDotTextActive: {color: '#ffffff'},
  inlineInfoSuccess: {flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#ecfdf5', borderRadius: 16, padding: 12},
  inlineInfoText: {fontSize: 13, color: '#047857', fontWeight: '600'},
  tutorialCard: {backgroundColor: '#f5f3ff', borderRadius: 24, padding: 18, gap: 16},
  tutorialRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  tutorialStep: {alignItems: 'center', gap: 8, flex: 1},
  tutorialIconWrap: {width: 42, height: 42, borderRadius: 16, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center'},
  tutorialLabel: {fontSize: 12, fontWeight: '600', color: '#1f2937', textAlign: 'center'},
  chipWrap: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  exampleChip: {backgroundColor: '#ede9fe', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8},
  exampleChipText: {fontSize: 12, color: '#7c3aed', fontWeight: '600'},
  darkCard: {backgroundColor: '#111827', borderRadius: 24, padding: 16},
  eyebrowDark: {fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6, color: 'rgba(255,255,255,0.65)', fontWeight: '700'},
  darkCardText: {color: '#ffffff', fontSize: 14, lineHeight: 20, marginTop: 8},
  goalCard: {backgroundColor: 'rgba(221,214,254,0.65)', borderRadius: 24, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  goalCardColumn: {backgroundColor: 'rgba(221,214,254,0.65)', borderRadius: 24, padding: 16},
  loadingCard: {opacity: 0.58},
  loadingText: {color: '#7b7b9f'},
  eyebrowViolet: {fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6, color: '#7c3aed', fontWeight: '700', marginBottom: 8},
  goalTitle: {fontSize: 16, fontWeight: '600', color: '#111827'},
  goalBody: {fontSize: 13, color: '#6b7280', marginTop: 4, lineHeight: 19},
  reminderCard: {flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: '#fef3c7', borderRadius: 24, padding: 16},
  reframeLoadingBanner: {flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.86)', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10},
  reframeLoadingText: {fontSize: 13, fontWeight: '600', color: '#6d28d9'},
  reminderIcon: {width: 40, height: 40, borderRadius: 14, backgroundColor: '#fde68a', alignItems: 'center', justifyContent: 'center'},
  reminderTitle: {fontSize: 16, fontWeight: '600', color: '#111827'},
  reminderBody: {fontSize: 13, color: '#4b5563', lineHeight: 18, marginTop: 4},
  coachMetaCard: {backgroundColor: 'rgba(255,255,255,0.88)', borderRadius: 24, padding: 16, gap: 8},
  coachSafetyCard: {backgroundColor: '#fef3c7', borderRadius: 20, padding: 14, flexDirection: 'row', gap: 10, alignItems: 'flex-start'},
  coachSafetyText: {flex: 1, fontSize: 13, lineHeight: 18, color: '#92400e'},
  supportScreenCard: {backgroundColor: '#fff7ed', borderRadius: 24, padding: 16, gap: 10},
  supportActionsWrap: {gap: 10, marginTop: 4},
  editSectionTabs: {flexDirection: 'row', gap: 10, flexWrap: 'wrap'},
  editSectionTab: {paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb'},
  editSectionTabActive: {backgroundColor: '#ede9fe', borderColor: '#c4b5fd'},
  editSectionTabText: {fontSize: 13, fontWeight: '600', color: '#6b7280'},
  editSectionTabTextActive: {color: '#6d28d9'},
  actionRow: {flexDirection: 'row', gap: 12, marginTop: 24},
  primaryButton: {flex: 1, backgroundColor: '#7c3aed', borderRadius: 18, paddingVertical: 14, alignItems: 'center', justifyContent: 'center'},
  primaryWideButton: {backgroundColor: '#7c3aed', borderRadius: 18, paddingVertical: 14, alignItems: 'center', justifyContent: 'center'},
  fullWidthButton: {flex: 1.5},
  primaryButtonText: {color: '#ffffff', fontWeight: '600', fontSize: 14},
  secondaryButton: {flex: 1, backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 18, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#ddd6fe'},
  secondaryWideButton: {backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 18, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e5e7eb', flexDirection: 'row', gap: 8},
  secondaryButtonText: {color: '#6d28d9', fontWeight: '600', fontSize: 14},
  errorText: {fontSize: 13, color: '#b91c1c', marginTop: 12, lineHeight: 18},
  blockCard: {backgroundColor: '#fff7ed', borderRadius: 24, padding: 16, gap: 10},
  blockTitle: {fontSize: 16, fontWeight: '700', color: '#111827'},
  blockBody: {fontSize: 13, color: '#6b7280', lineHeight: 18},
  blockActions: {flexDirection: 'row', gap: 12, marginTop: 4},
  choiceGrid: {gap: 8},
  checkboxRow: {flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#ffffff', borderRadius: 18, padding: 14, borderWidth: 1, borderColor: '#e5e7eb'},
  checkboxRowActive: {borderColor: '#c4b5fd', backgroundColor: '#f5f3ff'},
  checkbox: {width: 22, height: 22, borderRadius: 6, borderWidth: 1, borderColor: '#c4b5fd', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff'},
  checkboxActive: {backgroundColor: '#7c3aed', borderColor: '#7c3aed'},
  checkboxLabel: {fontSize: 14, color: '#111827', fontWeight: '600'},
  safetyHero: {width: 64, height: 64, borderRadius: 24, backgroundColor: '#fef3c7', alignItems: 'center', justifyContent: 'center', alignSelf: 'center'},
  completeWrap: {flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100, gap: 14},
  completeIcon: {width: 86, height: 86, borderRadius: 28, backgroundColor: '#8b5cf6', alignItems: 'center', justifyContent: 'center'},
  chatStack: {gap: 12, marginTop: 16},
  chatBubbleWrap: {flexDirection: 'row'},
  chatLeft: {justifyContent: 'flex-start'},
  chatRight: {justifyContent: 'flex-end'},
  chatBubble: {maxWidth: '84%', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 14},
  chatBotBubble: {backgroundColor: '#ffffff'},
  chatUserBubble: {backgroundColor: '#7c3aed'},
  chatText: {color: '#1f2937', fontSize: 14, lineHeight: 20},
  chatLoadingText: {color: '#6b7280', fontSize: 14, lineHeight: 20, fontStyle: 'italic'},
  quickReplyGuide: {backgroundColor: 'rgba(255,255,255,0.82)', borderRadius: 20, padding: 14, gap: 4},
  quickReplyGuideTitle: {fontSize: 13, fontWeight: '700', color: '#374151'},
  quickReplyGuideBody: {fontSize: 12, lineHeight: 17, color: '#6b7280'},
  quickReplyWrap: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  quickReplyChip: {backgroundColor: '#ede9fe', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 9},
  quickReplyText: {fontSize: 12, color: '#6d28d9', fontWeight: '600'},
  chatComposer: {backgroundColor: 'rgba(255,255,255,0.94)', borderRadius: 24, padding: 14, gap: 12},
  chatComposerInput: {minHeight: 86, maxHeight: 160, textAlignVertical: 'top', color: '#111827', fontSize: 14, lineHeight: 20},
  chatSendButton: {alignSelf: 'flex-end', backgroundColor: '#7c3aed', borderRadius: 16, paddingHorizontal: 18, paddingVertical: 10},
  chatSendButtonDisabled: {opacity: 0.45},
  grid: {flexDirection: 'row', flexWrap: 'wrap', gap: 12},
  gridCard: {width: '48%', backgroundColor: 'rgba(255,255,255,0.94)', borderRadius: 24, padding: 16, minHeight: 156},
  gridIconTile: {width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 12, backgroundColor: '#fae8ff'},
  gridCardTitle: {fontSize: 16, fontWeight: '600', color: '#111827'},
  gridCardBody: {fontSize: 13, color: '#6b7280', lineHeight: 18, marginTop: 6},
  familyCard: {backgroundColor: 'rgba(255,255,255,0.94)', borderRadius: 24, padding: 16},
  familyMiniGrid: {flexDirection: 'row', gap: 12, marginTop: 14},
  familyMiniCell: {flex: 1, backgroundColor: '#f9fafb', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12},
  familyRuleText: {fontSize: 14, color: '#4b5563'},
  profileHero: {backgroundColor: 'rgba(255,255,255,0.94)', borderRadius: 24, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14},
  contactStack: {gap: 12},
  contactCard: {backgroundColor: '#faf5ff', borderRadius: 18, padding: 14, gap: 10},
  profileAvatar: {width: 56, height: 56, borderRadius: 22, backgroundColor: '#8b5cf6', alignItems: 'center', justifyContent: 'center'},
  profileAvatarText: {color: '#ffffff', fontSize: 24, fontWeight: '700'},
  profileName: {color: '#111827', fontSize: 20, fontWeight: '700'},
  profilePlan: {color: '#6b7280', fontSize: 14, marginTop: 4},
  bottomNavWrap: {position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 14, paddingBottom: Platform.OS === 'ios' ? 26 : 16, backgroundColor: 'transparent'},
  bottomNav: {backgroundColor: 'rgba(255,255,255,0.96)', borderRadius: 28, padding: 8, flexDirection: 'row', justifyContent: 'space-between'},
  bottomTab: {flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 18, paddingVertical: 10, gap: 6},
  bottomTabActive: {backgroundColor: '#7c3aed'},
  bottomTabText: {color: '#6b7280', fontSize: 11, fontWeight: '600'},
  bottomTabTextActive: {color: '#ffffff'},
  resumeHintBox: {marginTop: 14, backgroundColor: '#f5f3ff', borderRadius: 18, padding: 14},
  resumeHintText: {fontSize: 13, color: '#4b5563', lineHeight: 18},
  softCard: {backgroundColor: 'rgba(255,255,255,0.94)', borderRadius: 24, padding: 16, gap: 12},
});
