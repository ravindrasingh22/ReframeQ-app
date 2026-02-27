import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Pressable, SafeAreaView, ScrollView, Text, TextInput, useWindowDimensions, View} from 'react-native';
import {BottomTabBar} from './src/components/layout/BottomTabBar';
import {MainHeader} from './src/components/layout/MainHeader';
import {SidebarMenu} from './src/components/layout/SidebarMenu';

import {DailyReframeCard} from './src/components/DailyReframeCard';
import {MockStats} from './src/components/MockStats';
import {
  dummyChildBadges,
  dummyParentAlerts,
  dummyReframes,
  dummyStats,
} from './src/utils/DummyData';
import {
  fetchThreadDetail,
  fetchThreads,
  getAssistantReply,
  sendChatMessage,
  type ChatThread,
} from './src/services/AIChatService';
import {loginApp, registerApp} from './src/services/AppAuthService';
import {
  createMyProfile,
  deleteMyProfile,
  fetchMyProfiles,
  recordChildConsent,
  updateChildProfile,
  updateChildStatus,
  type FamilyProfile,
} from './src/services/FamilyService';
import {LinkedinStyleFeed} from './src/screens/LinkedinStyleFeed';
import {ProfilePanel} from './src/screens/ProfilePanel';

type Language = 'en' | 'hinglish';
type Role = 'parent' | 'child' | 'individual';
type AuthRole = 'app_user';
type AppState = 'auth' | 'main';
type AuthStep = 'welcome' | 'signup' | 'login';
type MainTab = 'checkin' | 'reframe' | 'chat' | 'dashboard' | 'settings';

type UserAccount = {
  fullName: string;
  email: string;
  password: string;
  authRole: AuthRole;
  mode: Role;
  inviteCode?: string;
};

type Session = {
  fullName: string;
  authRole: AuthRole;
  mode: Role;
  language: Language;
  accessToken: string;
};

type MoodEntry = {
  emoji: string;
  intensity: number;
  trigger: string;
};

const copy = {
  en: {
    appTitle: 'ReframeQ',
    welcomeTitle: 'Welcome to ReframeQ',
    welcomeSubtitle: 'Choose your account flow to continue.',
    parentFlow: 'I am a Parent / Guardian',
    myselfFlow: 'I am using ReframeQ for myself',
    childFlow: 'I am a Child joining family',
    continue: 'Continue',
    fullName: 'Full name',
    email: 'Email',
    password: 'Password',
    role: 'Role',
    signUp: 'Create account',
    signIn: 'Sign in',
    alreadyHave: 'Already have an account? Sign in',
    needAccount: 'Need an account? Sign up',
    checkinTitle: 'Emotional Check-In',
    checkinPrompt: 'How are you feeling right now?',
    triggerPrompt: 'What triggered this feeling? (optional)',
    saveMood: 'Log Mood',
    reframeTitle: 'Daily Reframe',
    chatTitle: 'AI Support Chat (mock)',
    dashboardTitleChild: 'Your Dashboard',
    dashboardTitleParent: 'Parent Dashboard',
    settingsTitle: 'Settings',
    langLabel: 'Language',
    signOut: 'Sign out',
    inviteCode: 'Parent invite code (optional)',
    roleParent: 'Parent',
    roleChild: 'Child',
    roleIndividual: 'Individual',
  },
  hinglish: {
    appTitle: 'ReframeQ',
    welcomeTitle: 'ReframeQ mein welcome',
    welcomeSubtitle: 'Apna account flow choose karo.',
    parentFlow: 'Main Parent / Guardian hoon',
    myselfFlow: 'Main khud ke liye use kar raha/rahi hoon',
    childFlow: 'Main Child hoon, family join karni hai',
    continue: 'Aage badho',
    fullName: 'Poora naam',
    email: 'Email',
    password: 'Password',
    role: 'Role',
    signUp: 'Account banao',
    signIn: 'Sign in karo',
    alreadyHave: 'Account already hai? Sign in karo',
    needAccount: 'Account nahi hai? Sign up karo',
    checkinTitle: 'Emotional Check-In',
    checkinPrompt: 'Abhi kaisa feel kar rahe ho?',
    triggerPrompt: 'Is feeling ka trigger kya tha? (optional)',
    saveMood: 'Mood log karo',
    reframeTitle: 'Aaj ka Reframe',
    chatTitle: 'AI Support Chat (mock)',
    dashboardTitleChild: 'Tumhara Dashboard',
    dashboardTitleParent: 'Parent Dashboard',
    settingsTitle: 'Settings',
    langLabel: 'Language',
    signOut: 'Sign out',
    inviteCode: 'Parent invite code (optional)',
    roleParent: 'Parent',
    roleChild: 'Child',
    roleIndividual: 'Individual',
  },
} satisfies Record<Language, Record<string, string>>;

const emojis = ['😀', '🙂', '😐', '😔', '😢', '😡', '😰'];
const SESSION_KEY = 'reframeq_app_session_v1';

function saveSession(session: Session | null) {
  try {
    if (typeof localStorage === 'undefined') return;
    if (!session) {
      localStorage.removeItem(SESSION_KEY);
      return;
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // Ignore storage failures.
  }
}

function loadSession(): Session | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export default function App() {
  const [appState, setAppState] = useState<AppState>('auth');
  const [authStep, setAuthStep] = useState<AuthStep>('welcome');
  const [desiredRole, setDesiredRole] = useState<Role>('individual');
  const [language, setLanguage] = useState<Language>('en');
  const [session, setSession] = useState<Session | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarPage, setSidebarPage] = useState<'none' | 'profile' | 'family' | 'language'>('none');
  const [mainTab, setMainTab] = useState<MainTab>('checkin');
  const t = copy[language];

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    inviteCode: '',
  });

  const [mood, setMood] = useState<MoodEntry>({emoji: '🙂', intensity: 3, trigger: ''});
  const [moodLog, setMoodLog] = useState<MoodEntry[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [thread, setThread] = useState<{id: string; role: 'user' | 'assistant'; text: string}[]>([]);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<number | null>(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState('');
  const [animateAssistantReply, setAnimateAssistantReply] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    const stored = loadSession();
    if (stored?.accessToken) {
      setSession(stored);
      setLanguage(stored.language);
      setAppState('main');
      setMainTab(stored.mode === 'parent' ? 'dashboard' : 'checkin');
    }
  }, []);

  useEffect(() => {
    saveSession(session);
  }, [session]);

  const loadThreadDetailById = async (threadId: number) => {
    const detail = await fetchThreadDetail(session!.accessToken, threadId);
    setAnimateAssistantReply(false);
    setThread(
      detail.messages.map(m => ({
        id: `m-${m.id}`,
        role: m.role,
        text: m.content,
      })),
    );
  };

  if (appState === 'auth') {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.container}>
          <Title title={t.welcomeTitle} subtitle={t.welcomeSubtitle} />
          {authStep === 'welcome' ? (
            <View style={{gap: 10}}>
              <ChoiceCard
                title={t.parentFlow}
                onPress={() => {
                  setDesiredRole('parent');
                  setAuthStep('signup');
                }}
              />
              <ChoiceCard
                title={t.myselfFlow}
                onPress={() => {
                  setDesiredRole('individual');
                  setAuthStep('signup');
                }}
              />
              <ChoiceCard
                title={t.childFlow}
                onPress={() => {
                  setDesiredRole('child');
                  setAuthStep('signup');
                }}
              />
            </View>
          ) : null}

          {authStep === 'signup' ? (
            <AuthForm
              title={t.signUp}
              t={t}
              role={desiredRole}
              form={form}
              onChange={setForm}
              onSubmit={async () => {
                setAuthError('');
                const next: UserAccount = {
                  fullName: form.fullName.trim(),
                  email: form.email.trim().toLowerCase(),
                  password: form.password,
                  authRole: 'app_user',
                  mode: desiredRole,
                  inviteCode: form.inviteCode.trim() || undefined,
                };
                if (!next.fullName || !next.email || !next.password) {
                  setAuthError('Please fill all required fields.');
                  return;
                }
                try {
                  setAuthLoading(true);
                  const auth = await registerApp({
                    full_name: next.fullName,
                    email: next.email,
                    password: next.password,
                    language,
                  });
                  setSession({
                    fullName: auth.full_name || next.fullName,
                    authRole: 'app_user',
                    mode: next.mode,
                    language,
                    accessToken: auth.access_token,
                  });
                  setAppState('main');
                  setMainTab(next.mode === 'parent' ? 'dashboard' : 'checkin');
                } catch (error) {
                  setAuthError(error instanceof Error ? error.message : 'Registration failed');
                } finally {
                  setAuthLoading(false);
                }
              }}
            />
          ) : null}

          {authStep === 'login' ? (
            <AuthForm
              title={t.signIn}
              t={t}
              role={desiredRole}
              form={form}
              onChange={setForm}
              showName={false}
              showInvite={false}
              onSubmit={async () => {
                setAuthError('');
                const email = form.email.trim().toLowerCase();
                const password = form.password;
                if (!email || !password) {
                  setAuthError('Please enter email and password.');
                  return;
                }
                try {
                  setAuthLoading(true);
                  const auth = await loginApp(email, password);
                  if (auth.role !== 'app_user') {
                    setAuthError('This account is not an app_user. Use app user credentials.');
                    return;
                  }
                  setSession({
                    fullName: auth.full_name || email.split('@')[0],
                    authRole: 'app_user',
                    mode: desiredRole,
                    language,
                    accessToken: auth.access_token,
                  });
                  setAppState('main');
                  setMainTab(desiredRole === 'parent' ? 'dashboard' : 'checkin');
                } catch (error) {
                  setAuthError(error instanceof Error ? error.message : 'Login failed');
                } finally {
                  setAuthLoading(false);
                }
              }}
            />
          ) : null}

          {authError ? <Text style={styles.errorText}>{authError}</Text> : null}
          {authStep === 'login' ? (
            <Text style={styles.hintText}>
              Backend auth active. Any non-admin email currently maps to app_user in seed logic.
            </Text>
          ) : null}
          {authLoading ? <Text style={styles.hintText}>Signing in...</Text> : null}

          {authStep !== 'welcome' ? (
            <Pressable onPress={() => setAuthStep(authStep === 'signup' ? 'login' : 'signup')}>
              <Text style={styles.linkText}>
                {authStep === 'signup' ? t.alreadyHave : t.needAccount}
              </Text>
            </Pressable>
          ) : null}
          <LanguageSwitcher language={language} setLanguage={setLanguage} label={t.langLabel} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!session) return null;

  const title =
    mainTab === 'checkin'
      ? t.checkinTitle
      : mainTab === 'reframe'
        ? t.reframeTitle
        : mainTab === 'chat'
          ? t.chatTitle
          : mainTab === 'dashboard'
            ? session.mode === 'parent'
              ? t.dashboardTitleParent
              : t.dashboardTitleChild
            : t.settingsTitle;

  const headerBlock = (
    <>
      <MainHeader
        title={copy[session.language].appTitle}
        subtitle={`${session.fullName} • ${roleLabel(session.mode, copy[session.language])} • ${session.authRole}`}
        onOpenMenu={() => setSidebarOpen(true)}
      />
      {mainTab === 'chat' ? (
        <Text style={{fontSize: 12, color: '#5a6475', marginTop: 2}}>{t.chatTitle}</Text>
      ) : (
        <Title title={title} subtitle="" />
      )}
    </>
  );

  const handleMainTabChange = (tab: MainTab) => {
    setMainTab(tab);
    setSidebarPage('none');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={{flex: 1}}>
        {mainTab === 'chat' ? (
          <View style={{flex: 1, padding: 16, gap: 10}}>
          {headerBlock}
          <View style={{flex: 1}}>
            <ChatScreen
                token={session.accessToken}
                language={session.language}
                threads={threads}
                selectedThreadId={selectedThreadId}
                onSelectThread={async (threadId) => {
                  setSelectedThreadId(threadId);
                  try {
                    await loadThreadDetailById(threadId);
                  } catch (error) {
                    setChatError(error instanceof Error ? error.message : 'Failed to load thread');
                  }
                }}
                thread={thread}
                input={chatInput}
                onInput={setChatInput}
            onSend={async () => {
              const text = chatInput.trim();
              if (!text) return;
              const userMsg = {id: `u-${Date.now()}`, role: 'user' as const, text};
              setAnimateAssistantReply(false);
              setThread(prev => [...prev, userMsg]);
                  setChatInput('');
                  setChatError('');
                  setChatLoading(true);
                  try {
                    const result = await sendChatMessage(session.accessToken, text, session.language, selectedThreadId ?? undefined);
                    if (!selectedThreadId) setSelectedThreadId(result.thread_id);
                    const refreshedThreads = await fetchThreads(session.accessToken);
                    setThreads(refreshedThreads);
                  const assistantMsg = {
                    id: `a-${Date.now()}`,
                    role: 'assistant' as const,
                    text: result.reply || getAssistantReply(text, session.language),
                  };
                  setAnimateAssistantReply(true);
                  setThread(prev => [...prev, assistantMsg]);
                  } catch (error) {
                    const fallback = getAssistantReply(text, session.language);
                  const assistantMsg = {
                    id: `a-${Date.now()}`,
                    role: 'assistant' as const,
                    text: fallback,
                  };
                  setAnimateAssistantReply(true);
                  setThread(prev => [...prev, assistantMsg]);
                    setChatError(error instanceof Error ? error.message : 'LLM unavailable. Using local fallback.');
                  } finally {
                    setChatLoading(false);
                  }
                }}
            loading={chatLoading}
            error={chatError}
            animateAssistantReply={animateAssistantReply}
            onRefreshThreads={async () => {
                  try {
                    const items = await fetchThreads(session.accessToken);
                    setThreads(items);
                    const today = new Date().toISOString().slice(0, 10);
                    const todaysThread = items.find(item => item.thread_date === today);

                    if (todaysThread) {
                      if (selectedThreadId !== todaysThread.id) {
                        setSelectedThreadId(todaysThread.id);
                        await loadThreadDetailById(todaysThread.id);
                      }
                    } else {
                      setSelectedThreadId(null);
                      setThread([]);
                    }
                  } catch (error) {
                    setChatError(error instanceof Error ? error.message : 'Failed to load threads');
                  }
                }}
              />
            </View>
          </View>
        ) : (
          <ScrollView contentContainerStyle={[styles.container, {paddingBottom: 20}]}>
            {headerBlock}

            {sidebarPage === 'profile' ? (
              <ProfilePanel
                fullName={session.fullName}
                authRole={session.authRole}
                mode={session.mode}
                onSignOut={() => {
                  setSession(null);
                  setAppState('auth');
                  setAuthStep('login');
                  setSidebarOpen(false);
                  setSidebarPage('none');
                }}
              />
            ) : null}

            {sidebarPage === 'family' ? (
              <FamilyProfilesPanel session={session} />
            ) : null}

            {sidebarPage === 'language' ? (
              <SettingsScreen
                session={session}
                language={session.language}
                onLanguage={next => {
                  setLanguage(next);
                  setSession(prev => (prev ? {...prev, language: next} : prev));
                }}
                label={copy[session.language].langLabel}
              />
            ) : null}

            {sidebarPage === 'none' && mainTab === 'checkin' && session.mode !== 'parent' ? (
              <CheckInScreen
                t={copy[session.language]}
                mood={mood}
                setMood={setMood}
                onLog={() => setMoodLog(prev => [mood, ...prev].slice(0, 10))}
                moodLog={moodLog}
              />
            ) : null}

            {sidebarPage === 'none' && mainTab === 'reframe' && session.mode !== 'parent' ? (
              <DailyReframeCard item={dummyReframes[mood.intensity % dummyReframes.length]} />
            ) : null}

            {sidebarPage === 'none' && mainTab === 'dashboard' ? (
              session.mode === 'parent' ? (
                <ParentDashboard />
              ) : (
                <LinkedinStyleFeed moodLogCount={moodLog.length} fullName={session.fullName} />
              )
            ) : null}
          </ScrollView>
        )}
      </View>
      <BottomTabBar
        current={mainTab}
        onChange={handleMainTabChange}
        parentMode={session.mode === 'parent'}
      />
      {sidebarOpen ? (
        <SidebarMenu
          onClose={() => setSidebarOpen(false)}
          onProfile={() => {
            setSidebarPage('profile');
            setSidebarOpen(false);
          }}
          onFamily={() => {
            setSidebarPage('family');
            setSidebarOpen(false);
          }}
          onLanguage={() => {
            setSidebarPage('language');
            setSidebarOpen(false);
          }}
          onMain={() => {
            setSidebarPage('none');
            setSidebarOpen(false);
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}

function AuthForm({
  title,
  t,
  role,
  form,
  onChange,
  onSubmit,
  showName = true,
  showInvite = true,
}: {
  title: string;
  t: Record<string, string>;
  role: Role;
  form: {fullName: string; email: string; password: string; inviteCode: string};
  onChange: (next: {fullName: string; email: string; password: string; inviteCode: string}) => void;
  onSubmit: () => void;
  showName?: boolean;
  showInvite?: boolean;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.subtitle}>
        {t.role}: {roleLabel(role, t)}
      </Text>
      {showName ? (
        <Field label={t.fullName} value={form.fullName} onChangeText={v => onChange({...form, fullName: v})} />
      ) : null}
      <Field label={t.email} value={form.email} onChangeText={v => onChange({...form, email: v})} />
      <Field
        label={t.password}
        value={form.password}
        secure
        onChangeText={v => onChange({...form, password: v})}
      />
      {role === 'child' && showInvite ? (
        <Field
          label={t.inviteCode}
          value={form.inviteCode}
          onChangeText={v => onChange({...form, inviteCode: v})}
        />
      ) : null}
      <PrimaryButton label={title} onPress={onSubmit} />
    </View>
  );
}

function CheckInScreen({
  t,
  mood,
  setMood,
  onLog,
  moodLog,
}: {
  t: Record<string, string>;
  mood: MoodEntry;
  setMood: (next: MoodEntry) => void;
  onLog: () => void;
  moodLog: MoodEntry[];
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>{t.checkinPrompt}</Text>
      <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8}}>
        {emojis.map(e => (
          <Pressable
            key={e}
            onPress={() => setMood({...mood, emoji: e})}
            style={[styles.emojiBtn, mood.emoji === e ? styles.emojiSelected : null]}>
            <Text style={{fontSize: 22}}>{e}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.subtitle}>Intensity: {mood.intensity}/5</Text>
      <View style={{flexDirection: 'row', gap: 6}}>
        {[1, 2, 3, 4, 5].map(level => (
          <Pressable
            key={level}
            onPress={() => setMood({...mood, intensity: level})}
            style={[styles.levelBtn, mood.intensity === level ? styles.levelBtnActive : null]}>
            <Text>{level}</Text>
          </Pressable>
        ))}
      </View>
      <Field
        label={t.triggerPrompt}
        value={mood.trigger}
        onChangeText={value => setMood({...mood, trigger: value})}
      />
      <PrimaryButton label={t.saveMood} onPress={onLog} />

      {moodLog.length ? (
        <View style={{gap: 6}}>
          <Text style={styles.sectionTitle}>Recent logs</Text>
          {moodLog.map((entry, index) => (
            <Text key={`${entry.emoji}-${index}`} style={styles.subtitle}>
              {entry.emoji} intensity {entry.intensity} {entry.trigger ? `• ${entry.trigger}` : ''}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function ChatScreen({
  token,
  language,
  threads,
  selectedThreadId,
  onSelectThread,
  onRefreshThreads,
  thread,
  input,
  onInput,
  onSend,
  loading,
  error,
  animateAssistantReply,
}: {
  token: string;
  language: Language;
  threads: ChatThread[];
  selectedThreadId: number | null;
  onSelectThread: (threadId: number) => Promise<void>;
  onRefreshThreads: () => Promise<void>;
  thread: {id: string; role: 'user' | 'assistant'; text: string}[];
  input: string;
  onInput: (text: string) => void;
  onSend: () => Promise<void>;
  loading: boolean;
  error: string;
  animateAssistantReply: boolean;
}) {
  const {width} = useWindowDimensions();
  const chatScrollRef = useRef<ScrollView | null>(null);
  const [displayThread, setDisplayThread] = useState<{id: string; role: 'user' | 'assistant'; text: string}[]>([]);
  const compact = width < 420;
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [threadSearch, setThreadSearch] = useState('');
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    onRefreshThreads();
  }, [token]);

  useEffect(() => {
    if (!thread.length) {
      setDisplayThread([]);
      return;
    }
    const last = thread[thread.length - 1];
    const isFreshAssistantMessage = last.id.startsWith('a-');
    if (last.role !== 'assistant' || !animateAssistantReply || !isFreshAssistantMessage) {
      setDisplayThread(thread);
      return;
    }

    setDisplayThread(thread.slice(0, -1));
    let index = 0;
    const interval = setInterval(() => {
      index += 1;
      const partial = last.text.slice(0, index);
      setDisplayThread([...thread.slice(0, -1), {...last, text: partial}]);
      if (index >= last.text.length) clearInterval(interval);
    }, 20);
    return () => clearInterval(interval);
  }, [thread]);

  useEffect(() => {
    chatScrollRef.current?.scrollToEnd({animated: true});
  }, [displayThread, loading]);

  return (
    <View style={{flex: 1, minHeight: 280}}>
      <Text style={styles.subtitle}>
        Placeholder LLM chat service. Language: {language === 'en' ? 'English' : 'Hinglish'}
      </Text>
      <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
        <Text style={styles.hintText}>Thread history</Text>
        <Pressable onPress={() => setHistoryExpanded(v => !v)}>
          <Text style={styles.linkText}>{historyExpanded ? 'Hide' : 'Show'}</Text>
        </Pressable>
      </View>
      {historyExpanded ? (
        <>
          <Field label="Search threads" value={threadSearch} onChangeText={setThreadSearch} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{maxHeight: compact ? 40 : 46}}>
            <View style={{flexDirection: 'row', gap: 8, alignItems: 'center'}}>
              <Pressable onPress={onRefreshThreads} style={styles.tab}>
                <Text style={styles.tabText}>Refresh</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  const todays = threads.find(t => t.thread_date === today);
                  if (todays) {
                    void onSelectThread(todays.id);
                  }
                }}
                style={styles.tab}>
                <Text style={styles.tabText}>Today</Text>
              </Pressable>
              {threads
                .slice()
                .sort((a, b) => b.thread_date.localeCompare(a.thread_date))
                .filter(item =>
                  !threadSearch.trim()
                    ? true
                    : `${item.thread_date} ${item.title} ${item.preview ?? ''}`
                        .toLowerCase()
                        .includes(threadSearch.trim().toLowerCase()),
                )
                .map(item => (
                  <Pressable
                    key={item.id}
                    onPress={() => onSelectThread(item.id)}
                    style={[styles.tab, selectedThreadId === item.id ? styles.tabActive : null]}>
                    <Text style={styles.tabText}>{item.thread_date} • {item.title}</Text>
                  </Pressable>
                ))}
            </View>
          </ScrollView>
        </>
      ) : null}
      <ScrollView
        ref={chatScrollRef}
        style={{flex: 1}}
        contentContainerStyle={{gap: 8, paddingVertical: 8}}
        keyboardShouldPersistTaps="handled">
        {displayThread.map(msg => (
          <View key={msg.id} style={[styles.bubble, msg.role === 'user' ? styles.userBubble : styles.aiBubble]}>
            <Text style={{color: '#1d2538'}}>{msg.text}</Text>
            <Text style={{fontSize: 11, color: '#6b7280'}}>{msg.role === 'user' ? 'You' : 'ReframeQ AI'}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={{borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 8}}>
        <View style={{position: 'relative'}}>
          <TextInput
            value={input}
            onChangeText={onInput}
            placeholder="Type your message..."
            style={[
              styles.input,
              {
                height: compact ? 44 : 48,
                borderRadius: 24,
                width: '100%',
                paddingRight: 48,
              },
            ]}
            multiline={false}
            returnKeyType="send"
            onSubmitEditing={() => {
              if (!loading && input.trim()) {
                void onSend();
              }
            }}
          />
          <Pressable
            onPress={onSend}
            disabled={loading || !input.trim()}
            style={{
              position: 'absolute',
              right: 6,
              top: 6,
              width: compact ? 32 : 36,
              height: compact ? 32 : 36,
              borderRadius: 18,
              backgroundColor: '#2f5fd0',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: loading || !input.trim() ? 0.6 : 1,
            }}>
            <Text style={{color: '#fff', fontSize: 14, fontWeight: '700'}}>{loading ? '…' : '➤'}</Text>
          </Pressable>
        </View>
      </View>
      {error ? <Text style={styles.hintText}>Chat notice: {error}</Text> : null}
    </View>
  );
}

function ChildDashboard({moodLogCount}: {moodLogCount: number}) {
  return (
    <View style={{gap: 10}}>
      <MockStats stats={dummyStats} />
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Check-in activity</Text>
        <Text style={styles.subtitle}>Mood logs this session: {moodLogCount}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Achievements</Text>
        {dummyChildBadges.map(badge => (
          <Text key={badge.id} style={styles.subtitle}>
            • {badge.label}: {badge.description}
          </Text>
        ))}
      </View>
    </View>
  );
}

function ParentDashboard() {
  return (
    <View style={{gap: 10}}>
      <MockStats stats={dummyStats} />
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Alerts / Flags</Text>
        {dummyParentAlerts.map(alert => (
          <Text key={alert.id} style={styles.subtitle}>
            • [{alert.severity.toUpperCase()}] {alert.title}: {alert.detail}
          </Text>
        ))}
      </View>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>AI Suggestions for Parents</Text>
        <Text style={styles.subtitle}>
          • Conversation starter: Ask about one high point and one low point of the week.
        </Text>
        <Text style={styles.subtitle}>
          • Weekend idea: 20-minute parent-child walk with open conversation.
        </Text>
      </View>
    </View>
  );
}


function SettingsScreen({
  session,
  language,
  onLanguage,
  label,
}: {
  session: Session;
  language: Language;
  onLanguage: (lang: Language) => void;
  label: string;
}) {
  return (
    <View style={{gap: 10}}>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{label}</Text>
        <LanguageSwitcher language={language} setLanguage={onLanguage} label={label} />
        <Text style={styles.subtitle}>
          i18n scaffold is in place with English + Hinglish dictionaries and runtime switching.
        </Text>
      </View>
      <FamilyProfilesPanel session={session} />
    </View>
  );
}

function FamilyProfilesPanel({session}: {session: Session}) {
  const [items, setItems] = useState<FamilyProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [newType, setNewType] = useState<'child' | 'adult'>('child');
  const [newName, setNewName] = useState('');
  const [newAgeBand, setNewAgeBand] = useState('13_15');

  async function loadProfiles() {
    try {
      setLoading(true);
      const data = await fetchMyProfiles(session.accessToken);
      setItems(data);
      setMessage('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to load profiles');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfiles();
  }, [session.accessToken]);

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Family Profiles</Text>
      <Text style={styles.subtitle}>Add and manage child/adult profiles for your app_user account.</Text>
      <View style={{flexDirection: 'row', gap: 8}}>
        <Pressable onPress={() => setNewType('child')} style={[styles.tab, newType === 'child' ? styles.tabActive : null]}>
          <Text style={styles.tabText}>Child</Text>
        </Pressable>
        <Pressable onPress={() => setNewType('adult')} style={[styles.tab, newType === 'adult' ? styles.tabActive : null]}>
          <Text style={styles.tabText}>Adult</Text>
        </Pressable>
      </View>
      <Field label="Profile name" value={newName} onChangeText={setNewName} />
      <Field label="Age band" value={newAgeBand} onChangeText={setNewAgeBand} />
      <PrimaryButton
        label="Add Profile"
        onPress={async () => {
          if (!newName.trim()) {
            setMessage('Profile name is required');
            return;
          }
          try {
            setLoading(true);
            await createMyProfile(session.accessToken, {
              profile_type: newType,
              display_name: newName.trim(),
              age_band: newAgeBand.trim() || '13_15',
              daily_time_limit_minutes: 60,
              topic_restrictions: [],
              conversation_visibility_rule: 'summary_only',
            });
            setNewName('');
            setNewAgeBand('13_15');
            await loadProfiles();
            setMessage('Profile added');
          } catch (error) {
            setMessage(error instanceof Error ? error.message : 'Failed to add profile');
          } finally {
            setLoading(false);
          }
        }}
      />
      {loading ? <Text style={styles.hintText}>Loading...</Text> : null}
      {message ? <Text style={styles.hintText}>{message}</Text> : null}

      <View style={{gap: 8}}>
        {items.map(profile => (
          <FamilyProfileRow
            key={profile.profile_id}
            profile={profile}
            token={session.accessToken}
            currentUserPrimaryId={profile.primary_user_id}
            onDone={loadProfiles}
            setMessage={setMessage}
          />
        ))}
      </View>
    </View>
  );
}

function FamilyProfileRow({
  profile,
  token,
  currentUserPrimaryId,
  onDone,
  setMessage,
}: {
  profile: FamilyProfile;
  token: string;
  currentUserPrimaryId: number;
  onDone: () => Promise<void>;
  setMessage: (msg: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile.display_name);
  const [ageBand, setAgeBand] = useState(profile.age_band);

  return (
    <View style={{borderWidth: 1, borderColor: '#e0e7f1', borderRadius: 10, padding: 10, gap: 6}}>
      <Text style={styles.sectionTitle}>
        {profile.display_name} ({profile.profile_type})
      </Text>
      <Text style={styles.subtitle}>
        Age: {profile.age_band} • Status: {profile.profile_active ? 'Active' : 'Inactive'} • Consent:{' '}
        {profile.consent_granted ? 'Granted' : profile.profile_type === 'child' ? 'Pending' : 'N/A'}
      </Text>

      {editing ? (
        <>
          <Field label="Name" value={name} onChangeText={setName} />
          <Field label="Age band" value={ageBand} onChangeText={setAgeBand} />
          <View style={{flexDirection: 'row', gap: 8}}>
            <Pressable
              onPress={async () => {
                try {
                  await updateChildProfile(token, profile.profile_id, {
                    display_name: name.trim(),
                    age_band: ageBand.trim(),
                  });
                  setEditing(false);
                  await onDone();
                  setMessage('Profile updated');
                } catch (error) {
                  setMessage(error instanceof Error ? error.message : 'Update failed');
                }
              }}
              style={styles.primaryBtn}>
              <Text style={{color: '#fff'}}>Save</Text>
            </Pressable>
            <Pressable onPress={() => setEditing(false)} style={styles.tab}>
              <Text style={styles.tabText}>Cancel</Text>
            </Pressable>
          </View>
        </>
      ) : (
        <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8}}>
          {profile.profile_type === 'child' ? (
            <Pressable onPress={() => setEditing(true)} style={styles.tab}>
              <Text style={styles.tabText}>Edit Child</Text>
            </Pressable>
          ) : null}
          {profile.profile_type === 'child' ? (
            <Pressable
              onPress={async () => {
                try {
                  await updateChildStatus(token, profile.profile_id, !profile.profile_active);
                  await onDone();
                  setMessage('Child status updated');
                } catch (error) {
                  setMessage(error instanceof Error ? error.message : 'Status update failed');
                }
              }}
              style={styles.tab}>
              <Text style={styles.tabText}>{profile.profile_active ? 'Deactivate' : 'Activate'}</Text>
            </Pressable>
          ) : null}
          {profile.profile_type === 'child' && !profile.consent_granted ? (
            <Pressable
              onPress={async () => {
                try {
                  await recordChildConsent(token, profile.profile_id, currentUserPrimaryId, 'v1');
                  await onDone();
                  setMessage('Consent recorded');
                } catch (error) {
                  setMessage(error instanceof Error ? error.message : 'Consent failed');
                }
              }}
              style={styles.tab}>
              <Text style={styles.tabText}>Record Consent</Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={async () => {
              try {
                await deleteMyProfile(token, profile.profile_id);
                await onDone();
                setMessage('Profile deleted');
              } catch (error) {
                setMessage(error instanceof Error ? error.message : 'Delete failed');
              }
            }}
            style={styles.tab}>
            <Text style={styles.tabText}>Delete</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function LanguageSwitcher({
  language,
  setLanguage,
  label,
}: {
  language: Language;
  setLanguage: (lang: Language) => void;
  label: string;
}) {
  return (
    <View style={{gap: 6}}>
      <Text style={styles.subtitle}>{label}</Text>
      <View style={{flexDirection: 'row', gap: 8}}>
        <Pressable onPress={() => setLanguage('en')} style={[styles.tab, language === 'en' ? styles.tabActive : null]}>
          <Text style={styles.tabText}>English</Text>
        </Pressable>
        <Pressable
          onPress={() => setLanguage('hinglish')}
          style={[styles.tab, language === 'hinglish' ? styles.tabActive : null]}>
          <Text style={styles.tabText}>Hinglish</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  secure = false,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  secure?: boolean;
}) {
  return (
    <View style={{gap: 4}}>
      <Text style={styles.subtitle}>{label}</Text>
      <TextInput
        value={value}
        secureTextEntry={secure}
        onChangeText={onChangeText}
        style={styles.input}
        autoCapitalize="none"
      />
    </View>
  );
}

function ChoiceCard({title, onPress}: {title: string; onPress: () => void}) {
  return (
    <Pressable onPress={onPress} style={styles.choiceCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.linkText}>Continue →</Text>
    </Pressable>
  );
}

function Title({title, subtitle}: {title: string; subtitle: string}) {
  return (
    <View style={{gap: 4}}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

function PrimaryButton({label, onPress}: {label: string; onPress: () => void}) {
  return (
    <Pressable onPress={onPress} style={styles.primaryBtn}>
      <Text style={{color: '#fff', textAlign: 'center', fontWeight: '700'}}>{label}</Text>
    </Pressable>
  );
}

function roleLabel(role: Role, t: Record<string, string>) {
  if (role === 'parent') return t.roleParent;
  if (role === 'child') return t.roleChild;
  return t.roleIndividual;
}

const styles = {
  safe: {flex: 1, backgroundColor: '#f4f7fc'} as const,
  container: {padding: 16, gap: 12} as const,
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e7f1',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  } as const,
  title: {fontSize: 22, fontWeight: '800', color: '#14213d'} as const,
  subtitle: {fontSize: 13, color: '#5a6475'} as const,
  sectionTitle: {fontSize: 15, fontWeight: '700', color: '#1d2840'} as const,
  linkText: {fontSize: 13, color: '#2f5fd0', fontWeight: '600'} as const,
  errorText: {fontSize: 13, color: '#b42318', fontWeight: '600'} as const,
  hintText: {fontSize: 12, color: '#5a6475'} as const,
  input: {
    borderWidth: 1,
    borderColor: '#d8deea',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#fff',
  } as const,
  primaryBtn: {
    backgroundColor: '#2f5fd0',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  } as const,
  choiceCard: {
    backgroundColor: '#fff',
    borderColor: '#d8deea',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 6,
  } as const,
  tab: {
    borderWidth: 1,
    borderColor: '#d3dbeb',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#fff',
  } as const,
  tabActive: {backgroundColor: '#e8efff', borderColor: '#2f5fd0'} as const,
  tabText: {fontSize: 12, color: '#32425f', textTransform: 'capitalize'} as const,
  tabTextActive: {color: '#2f5fd0'} as const,
  emojiBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#d3dbeb',
    borderRadius: 10,
  } as const,
  emojiSelected: {borderColor: '#2f5fd0', backgroundColor: '#e8efff'} as const,
  levelBtn: {
    borderWidth: 1,
    borderColor: '#d3dbeb',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  } as const,
  levelBtnActive: {borderColor: '#2f5fd0', backgroundColor: '#e8efff'} as const,
  bubble: {
    maxWidth: '85%',
    borderRadius: 12,
    padding: 10,
    gap: 4,
  } as const,
  userBubble: {alignSelf: 'flex-end', backgroundColor: '#dcecff'} as const,
  aiBubble: {alignSelf: 'flex-start', backgroundColor: '#f0f3f7'} as const,
  bottomNav: {
    backgroundColor: '#eef3fb',
    borderTopWidth: 1,
    borderTopColor: '#d8e2f0',
    paddingHorizontal: 12,
    paddingVertical: 10,
  } as const,
  userIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#cfd9e8',
    backgroundColor: '#f8fbff',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  } as const,
  sidebarOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: 'rgba(15,23,42,0.35)',
  } as const,
  sidebarPanel: {
    width: 260,
    backgroundColor: '#ffffff',
    borderRightWidth: 1,
    borderRightColor: '#d8e2f0',
    padding: 14,
    gap: 10,
  } as const,
  sidebarItem: {
    borderWidth: 1,
    borderColor: '#d3dbeb',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    backgroundColor: '#f8fbff',
  } as const,
};
