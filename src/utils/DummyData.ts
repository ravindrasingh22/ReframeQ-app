import {
  ChatMessage,
  CognitiveInsight,
  CrisisPlan,
  FamilyTip,
  LearningNote,
  ParentAlert,
  ReframeItem,
  RiskForecast,
  StatsSummary,
} from '../types';

export const dummyReframes: ReframeItem[] = [
  {
    id: 'rf-1',
    title: '5-4-3-2-1 Grounding',
    body: 'Look around and name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, and 1 you can taste.',
    tags: ['anxiety', 'mindfulness', 'calming'],
  },
  {
    id: 'rf-2',
    title: 'Thought Reframe',
    body: 'Pick one tough thought and rewrite it in a kinder, more realistic way.',
    tags: ['cognitive', 'reframe', 'self-talk'],
  },
];

export const dummyStats: StatsSummary = {
  averageMood: 7.4,
  checkIns: 9,
  journals: 3,
  topEmotions: [
    {name: 'Happy', emoji: '😀', percent: 42},
    {name: 'Calm', emoji: '🙂', percent: 25},
    {name: 'Tired', emoji: '😔', percent: 18},
  ],
};

export const dummyChat: ChatMessage[] = [
  {id: 'c1', role: 'user', text: 'Feeling a bit anxious about school.'},
  {
    id: 'c2',
    role: 'assistant',
    text: 'I hear you. Want to try a 5-breath reset together?',
  },
  {id: 'c3', role: 'user', text: 'Yes, please.'},
  {
    id: 'c4',
    role: 'assistant',
    text: 'Great! Inhale for 4, hold for 4, exhale for 6. Repeat 3 times.',
  },
];

export const dummyCognitive: CognitiveInsight[] = [
  {
    distortion: 'Catastrophizing',
    confidence: 0.82,
    note: 'Detected “it will all go wrong” pattern; try thought-challenge prompts.',
  },
  {
    distortion: 'Overgeneralization',
    confidence: 0.67,
    note: 'Phrases like “always/never” spotted; suggest evidence-for/against exercise.',
  },
];

export const dummyForecast: RiskForecast = {
  level: 'medium',
  horizon: 'next 48 hours',
  note: 'Recent downtrend plus school stress tag; suggest proactive coping and check-in reminders.',
};

export const dummyFamilyTip: FamilyTip = {
  summary: 'Share a gentle check-in if mood dips continue.',
  action: 'Offer a short walk or game time; avoid grilling for details.',
};

export const dummyCrisisPlan: CrisisPlan = {
  headline: 'If you feel overwhelmed',
  steps: [
    'Pause and breathe: 4-4-6 pattern x3.',
    'Text your trusted person with the word “support”.',
    'Call the helpline shown on the safety card.',
  ],
};

export const dummyLearning: LearningNote = {
  summary: 'CBT thought-challenge and 5-breath reset were most helpful last week.',
  lastUpdated: 'Today',
};

export const dummyParentAlerts: ParentAlert[] = [
  {
    id: 'pa-1',
    title: 'Low mood streak',
    detail: '3 low check-ins this week; suggest gentle check-in.',
    severity: 'medium',
  },
  {
    id: 'pa-2',
    title: 'Anxiety trigger: school',
    detail: 'School tag appeared twice; prompt a calming routine before class.',
    severity: 'low',
  },
];

export const dummyChildBadges = [
  {id: 'cb-1', label: 'Streak Star', description: '5-day check-in streak!'},
  {id: 'cb-2', label: 'Calm Breather', description: 'Completed 3 breathing resets.'},
];
