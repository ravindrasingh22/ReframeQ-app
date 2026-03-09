import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  MessageCircle,
  Heart,
  User,
  ChevronRight,
  Sparkles,
  Smile,
  Moon,
  Sun,
  Shield,
  BookOpen,
  PlayCircle,
  ArrowLeft,
  Bell,
  Lock,
  CheckCircle2,
  Brain,
  Users,
  Settings,
  Clock3,
  BarChart3,
  PlusCircle,
  LogIn,
  Mail,
  Baby,
  AlertTriangle,
  BadgeCheck,
  Wand2,
  Target,
  Compass,
  RefreshCcw,
  Eye,
  TimerReset,
  BookMarked,
  SlidersHorizontal,
  UserRound,
  Phone,
  PanelRightClose,
  Footprints,
  ToggleLeft,
  ShieldCheck,
  CalendarDays,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const appTabs = [
  { id: "home", label: "Home", icon: Home },
  { id: "chat", label: "Coach", icon: MessageCircle },
  { id: "tools", label: "Tools", icon: Heart },
  { id: "family", label: "Family", icon: Users },
  { id: "profile", label: "Profile", icon: User },
];

const onboardingScreens = [
  "welcome",
  "accountMode",
  "inviteCode",
  "userType",
  "goal",
  "clarity",
  "style",
  "tutorial",
  "thought",
  "reframe",
  "signup",
  "familySetup",
  "childProfile",
  "guardianConsent",
  "reminders",
  "complete",
];

const goals = [
  "Overthinking",
  "Confidence",
  "Friendships",
  "Family communication",
  "Focus & procrastination",
  "Better decisions",
  "Emotional balance",
  "Parenting support",
  "Child behavior support",
];

const styles = [
  { id: "gentle", title: "Gentle", desc: "Calm and supportive" },
  { id: "practical", title: "Practical", desc: "Direct and actionable" },
  { id: "encouraging", title: "Encouraging", desc: "Positive and motivating" },
  { id: "strategic", title: "Strategic", desc: "Structured and pattern-focused" },
];

const tools = [
  { title: "Thought Reframe", desc: "Turn one difficult thought into a more balanced view.", icon: Brain },
  { title: "Question Builder", desc: "Use Socratic questions to challenge assumptions.", icon: Compass },
  { title: "Mood Journal", desc: "Track feelings, triggers, and wins.", icon: BookOpen },
  { title: "Behavior Experiment", desc: "Test a belief with one small real-world action.", icon: Footprints },
  { title: "Breathing Reset", desc: "A 2-minute guided calm-down exercise.", icon: PlayCircle },
  { title: "Sleep Wind-down", desc: "Gentle night support and audio prompts.", icon: Moon },
];

const recentThreads = [
  { title: "New society friendships", tag: "Friendships", updated: "2h ago" },
  { title: "I keep delaying work", tag: "Focus", updated: "Yesterday" },
  { title: "Parenting before reacting", tag: "Family", updated: "2 days ago" },
];

const familyProfiles = [
  {
    name: "Alisha",
    type: "Child",
    age: "9–12",
    rule: "Weekly summary",
    time: "20 min/day",
    topics: "Guided topics only",
    status: "Active",
  },
  {
    name: "Rupali",
    type: "Adult",
    age: "18+",
    rule: "Private",
    time: "No limit",
    topics: "Standard",
    status: "Active",
  },
];

const chatMessages = [
  {
    from: "bot",
    text: "Hi, I’m your ReframeQ guide. What feels most difficult right now?",
  },
  {
    from: "user",
    text: "People in this new society seem unfriendly, so making friends feels hard.",
  },
  {
    from: "bot",
    text: "Let’s slow that thought down. Could it be too early to judge everyone from a few interactions? What is one other possible explanation?",
  },
];

const onboardingDefaults = {
  accountMode: "individual",
  inviteCode: "FAM-2026",
  userType: "guardian",
  goal: "Child behavior support",
  clarity: 4,
  control: 5,
  noise: 8,
  readiness: 6,
  style: "gentle",
  thought: "My child loses friends because he teases others and wants things his way.",
  childName: "Alisha",
  childAgeBand: "9–12",
  timeLimit: "20 min/day",
  visibility: "Weekly summary",
  reminders: "A few times a week",
};

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function Shell({ children, title, subtitle, onBack, rightSlot }) {
  return (
    <div className="w-[390px] h-[844px] rounded-[38px] bg-neutral-950 p-3 shadow-2xl ring-1 ring-black/10">
      <div className="relative h-full w-full overflow-hidden rounded-[30px] bg-gradient-to-b from-violet-50 via-white to-fuchsia-50">
        <div className="flex items-center justify-between px-5 pt-3 text-xs text-neutral-600">
          <span>9:41</span>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-neutral-800" />
            <div className="h-2 w-2 rounded-full bg-neutral-800/70" />
            <div className="h-2 w-6 rounded-full bg-neutral-800" />
          </div>
        </div>
        <div className="mx-auto mt-2 h-7 w-36 rounded-full bg-neutral-900" />

        <div className="flex items-center justify-between px-5 pt-5">
          <div className="flex items-center gap-3">
            {onBack ? (
              <button className="rounded-full bg-white p-2 shadow-sm">
                <ArrowLeft className="h-4 w-4 text-neutral-700" />
              </button>
            ) : (
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 p-2 text-white shadow-lg">
                <Sparkles className="h-full w-full" />
              </div>
            )}
            <div>
              <div className="text-lg font-semibold text-neutral-900">{title}</div>
              {subtitle ? <div className="text-sm text-neutral-500">{subtitle}</div> : null}
            </div>
          </div>
          {rightSlot || <Bell className="h-5 w-5 text-neutral-500" />}
        </div>

        <div className="h-[calc(100%-124px)] overflow-auto px-4 pb-28 pt-4 [scrollbar-width:none]">
          {children}
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ title, action }) {
  return (
    <div className="mt-5 flex items-center justify-between">
      <div className="text-base font-semibold text-neutral-900">{title}</div>
      {action ? <button className="text-sm font-medium text-violet-600">{action}</button> : null}
    </div>
  );
}

function SelectCard({ active, title, desc, icon: Icon }) {
  return (
    <button
      className={cx(
        "w-full rounded-3xl border p-4 text-left shadow-sm transition",
        active
          ? "border-violet-300 bg-violet-50 ring-2 ring-violet-200"
          : "border-white/80 bg-white/90 hover:border-violet-200"
      )}
    >
      <div className="flex items-start gap-3">
        {Icon ? (
          <div className={cx("rounded-2xl p-3", active ? "bg-violet-100 text-violet-700" : "bg-neutral-100 text-neutral-700")}>
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="font-medium text-neutral-900">{title}</div>
          {desc ? <div className="mt-1 text-sm text-neutral-500">{desc}</div> : null}
        </div>
        {active ? <CheckCircle2 className="mt-1 h-5 w-5 text-violet-600" /> : null}
      </div>
    </button>
  );
}

function SliderRow({ label, value }) {
  return (
    <div className="space-y-2 rounded-3xl bg-white/90 p-4 shadow-sm">
      <div className="text-sm font-medium text-neutral-900">{label}</div>
      <div className="flex items-center gap-3">
        <Progress value={value * 10} className="h-2 flex-1" />
        <Badge className="rounded-full bg-violet-100 text-violet-700">{value}/10</Badge>
      </div>
    </div>
  );
}

function OnboardingPreview({ data, activeStep, setActiveStep }) {
  const stepIndex = onboardingScreens.indexOf(activeStep);
  const progress = ((stepIndex + 1) / onboardingScreens.length) * 100;

  const stepContent = useMemo(() => {
    switch (activeStep) {
      case "welcome":
        return (
          <div className="space-y-5 pt-12">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-xl">
              <Sparkles className="h-9 w-9" />
            </div>
            <div className="text-center">
              <div className="text-3xl font-semibold text-neutral-900">Clear your mind.</div>
              <div className="mt-1 text-3xl font-semibold text-neutral-900">Reframe your next step.</div>
              <div className="mx-auto mt-3 max-w-[280px] text-sm leading-6 text-neutral-600">
                Short guided conversations for overthinking, confidence, relationships, parenting, and daily decisions.
              </div>
            </div>
            <Card className="border-0 bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white shadow-xl">
              <CardContent className="p-5">
                <div className="text-sm text-white/80">Value promise</div>
                <div className="mt-1 text-xl font-semibold">From mental clutter to one useful next step</div>
                <div className="mt-2 text-sm text-white/85">Non-clinical CBT-inspired self-help, with family-safe options.</div>
              </CardContent>
            </Card>
          </div>
        );
      case "accountMode":
        return (
          <div className="space-y-3">
            <div className="text-2xl font-semibold text-neutral-900">Who will use ReframeQ?</div>
            <div className="text-sm text-neutral-500">Choose the setup that fits you best.</div>
            <SelectCard active={data.accountMode === "individual"} title="Just me" desc="Personal reflection and daily guidance" icon={UserRound} />
            <SelectCard active={data.accountMode === "family_owner"} title="My family" desc="Create child profiles and guardian controls" icon={Users} />
            <SelectCard active={data.accountMode === "family_join"} title="Joining a family plan" desc="Enter a code shared by a family owner" icon={LogIn} />
          </div>
        );
      case "inviteCode":
        return (
          <div className="space-y-4">
            <div className="text-2xl font-semibold text-neutral-900">Enter your family invite code</div>
            <div className="text-sm text-neutral-500">Use the code shared by your family plan owner.</div>
            <Card className="border-0 bg-white/90 shadow-sm">
              <CardContent className="p-4">
                <div className="text-sm font-medium text-neutral-700">Invite code</div>
                <Input value={data.inviteCode} readOnly className="mt-2 border-violet-200 bg-violet-50" />
                <div className="mt-3 flex items-center gap-2 text-sm text-emerald-700">
                  <BadgeCheck className="h-4 w-4" /> Valid family plan found
                </div>
              </CardContent>
            </Card>
          </div>
        );
      case "userType":
        return (
          <div className="space-y-3">
            <div className="text-2xl font-semibold text-neutral-900">Who are you setting this up for?</div>
            <SelectCard active={data.userType === "adult"} title="Adult" desc="Standard self-help flow" icon={User} />
            <SelectCard active={data.userType === "teen"} title="Teen" desc="Teen-safe content pack" icon={Smile} />
            <SelectCard active={false} title="Child with guardian" desc="Child accounts must be created by a parent or guardian" icon={Baby} />
            <SelectCard active={data.userType === "guardian"} title="I’m a parent or guardian" desc="Set up family space and child-safe rules" icon={Shield} />
          </div>
        );
      case "goal":
        return (
          <div>
            <div className="text-2xl font-semibold text-neutral-900">What would you like help with first?</div>
            <div className="mt-1 text-sm text-neutral-500">Pick the area you’d like to improve right now.</div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {goals.map((goal) => (
                <button key={goal} className={cx("rounded-2xl px-3 py-4 text-left text-sm shadow-sm", goal === data.goal ? "bg-violet-600 text-white" : "bg-white/90 text-neutral-700")}>{goal}</button>
              ))}
            </div>
          </div>
        );
      case "clarity":
        return (
          <div className="space-y-3">
            <div className="text-2xl font-semibold text-neutral-900">Where do things feel right now?</div>
            <div className="text-sm text-neutral-500">A quick check so ReframeQ can adapt to you.</div>
            <SliderRow label="How clear do things feel right now?" value={data.clarity} />
            <SliderRow label="How much control do you feel over the next step?" value={data.control} />
            <SliderRow label="How much mental noise is getting in the way?" value={data.noise} />
            <SliderRow label="How ready are you to try one small step today?" value={data.readiness} />
          </div>
        );
      case "style":
        return (
          <div className="space-y-3">
            <div className="text-2xl font-semibold text-neutral-900">How would you like ReframeQ to guide you?</div>
            {styles.map((style) => (
              <SelectCard key={style.id} active={style.id === data.style} title={style.title} desc={style.desc} icon={Wand2} />
            ))}
          </div>
        );
      case "tutorial":
        return (
          <div className="space-y-4">
            <div className="text-2xl font-semibold text-neutral-900">How ReframeQ helps</div>
            <Card className="border-0 bg-gradient-to-r from-violet-100 to-fuchsia-100 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between text-center">
                  {[
                    [AlertTriangle, "Situation"],
                    [Eye, "Perspective"],
                    [Footprints, "Next step"],
                  ].map(([Icon, label], idx) => (
                    <React.Fragment key={label}>
                      <div className="flex flex-col items-center gap-2">
                        <div className="rounded-2xl bg-white p-3 text-violet-700 shadow-sm"><Icon className="h-5 w-5" /></div>
                        <div className="text-sm font-medium text-neutral-800">{label}</div>
                      </div>
                      {idx < 2 ? <ChevronRight className="h-5 w-5 text-neutral-400" /> : null}
                    </React.Fragment>
                  ))}
                </div>
                <div className="mt-4 text-sm text-neutral-600">One situation can be seen in different ways. A better perspective can lead to a better next step.</div>
              </CardContent>
            </Card>
          </div>
        );
      case "thought":
        return (
          <div className="space-y-4">
            <div className="text-2xl font-semibold text-neutral-900">What’s one thing on your mind right now?</div>
            <Card className="border-0 bg-white/90 shadow-sm">
              <CardContent className="p-4">
                <div className="min-h-[120px] rounded-2xl bg-neutral-50 p-4 text-sm leading-6 text-neutral-700">{data.thought}</div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  {[
                    "I keep overthinking everything",
                    "People seem unfriendly here",
                    "I’m falling behind",
                    "My child keeps losing friends",
                  ].map((item) => (
                    <Badge key={item} className="rounded-full bg-violet-100 text-violet-700">{item}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );
      case "reframe":
        return (
          <div className="space-y-3">
            <div className="text-2xl font-semibold text-neutral-900">Your first reframe</div>
            <Card className="border-0 bg-neutral-900 text-white shadow-sm">
              <CardContent className="p-4">
                <div className="text-xs uppercase tracking-wide text-white/60">Your thought</div>
                <div className="mt-2 text-sm leading-6">{data.thought}</div>
              </CardContent>
            </Card>
            <Card className="border-0 bg-violet-100/80 shadow-sm">
              <CardContent className="p-4">
                <div className="text-xs uppercase tracking-wide text-violet-700">A different perspective</div>
                <div className="mt-2 text-sm leading-6 text-neutral-800">
                  Your child may not be “bad at friendship.” He may be using teasing or control to get attention, feel powerful, or manage discomfort. Behaviors can change when skills change.
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 bg-amber-50 shadow-sm">
              <CardContent className="p-4">
                <div className="text-xs uppercase tracking-wide text-amber-700">Try this next</div>
                <div className="mt-2 text-sm text-neutral-700">Watch one play interaction today and note: what happened before the teasing, what he wanted, and how the other child reacted.</div>
              </CardContent>
            </Card>
          </div>
        );
      case "signup":
        return (
          <div className="space-y-3">
            <div className="text-2xl font-semibold text-neutral-900">Save your first reframe</div>
            <Card className="border-0 bg-white/90 shadow-sm">
              <CardContent className="space-y-3 p-4">
                <Input value="Ravin Singh" readOnly className="bg-neutral-50" />
                <Input value="ravin@example.com" readOnly className="bg-neutral-50" />
                <Input value="••••••••••" readOnly className="bg-neutral-50" />
                <Button className="w-full rounded-2xl bg-violet-600 hover:bg-violet-700">Create account</Button>
                <Button variant="outline" className="w-full rounded-2xl bg-white"><Mail className="mr-2 h-4 w-4" /> Continue with Google</Button>
              </CardContent>
            </Card>
          </div>
        );
      case "familySetup":
        return (
          <div className="space-y-3">
            <div className="text-2xl font-semibold text-neutral-900">Set up your family space</div>
            <Card className="border-0 bg-white/90 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-violet-100 p-3 text-violet-700"><Users className="h-5 w-5" /></div>
                  <div>
                    <div className="font-medium text-neutral-900">Add child profile</div>
                    <div className="text-sm text-neutral-500">Create guided access, time limits, and guardian visibility.</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 bg-amber-50 shadow-sm">
              <CardContent className="p-4 text-sm text-neutral-700">Recommended because your goal is child behavior support.</CardContent>
            </Card>
          </div>
        );
      case "childProfile":
        return (
          <div className="space-y-3">
            <div className="text-2xl font-semibold text-neutral-900">Create child profile</div>
            <Card className="border-0 bg-white/90 shadow-sm">
              <CardContent className="space-y-3 p-4">
                <Input value={data.childName} readOnly className="bg-neutral-50" />
                <Input value={data.childAgeBand} readOnly className="bg-neutral-50" />
                <Input value={data.timeLimit} readOnly className="bg-neutral-50" />
                <Input value="Guided topics only" readOnly className="bg-neutral-50" />
                <Input value={data.visibility} readOnly className="bg-neutral-50" />
              </CardContent>
            </Card>
          </div>
        );
      case "guardianConsent":
        return (
          <div className="space-y-4">
            <div className="text-2xl font-semibold text-neutral-900">Guardian confirmation</div>
            <Card className="border-0 bg-white/90 shadow-sm">
              <CardContent className="space-y-4 p-4">
                <div className="text-sm leading-6 text-neutral-600">I confirm I am the parent or guardian and approve this child profile for guided wellbeing and self-help use within ReframeQ.</div>
                <div className="flex items-center gap-3 rounded-2xl bg-violet-50 p-3 text-sm text-violet-700">
                  <CheckCircle2 className="h-5 w-5" /> I agree
                </div>
              </CardContent>
            </Card>
          </div>
        );
      case "reminders":
        return (
          <div className="space-y-3">
            <div className="text-2xl font-semibold text-neutral-900">How often would you like a reminder?</div>
            {[
              "Daily",
              "A few times a week",
              "Only when I choose",
              "No reminders",
            ].map((item) => (
              <SelectCard key={item} active={item === data.reminders} title={item} desc={item === "A few times a week" ? "Gentle prompts without overload" : undefined} icon={CalendarDays} />
            ))}
          </div>
        );
      case "complete":
        return (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="rounded-[28px] bg-gradient-to-br from-violet-600 to-fuchsia-500 p-5 text-white shadow-xl"><BadgeCheck className="h-10 w-10" /></div>
            <div className="mt-5 text-3xl font-semibold text-neutral-900">You’re all set</div>
            <div className="mt-2 max-w-[280px] text-sm leading-6 text-neutral-600">Your space is ready with guided CBT tools, family-safe controls, and your first saved reframe.</div>
          </div>
        );
      default:
        return null;
    }
  }, [activeStep, data]);

  return (
    <Shell title="Onboarding" subtitle={`Step ${stepIndex + 1} of ${onboardingScreens.length}`} onBack rightSlot={<Badge className="rounded-full bg-white text-violet-700">{Math.round(progress)}%</Badge>}>
      <Progress value={progress} className="mb-4 h-2" />
      {stepContent}
      <div className="mt-6 flex gap-3">
        <Button variant="outline" className="flex-1 rounded-2xl bg-white" onClick={() => setActiveStep(onboardingScreens[Math.max(0, stepIndex - 1)])} disabled={stepIndex === 0}>Back</Button>
        <Button className="flex-1 rounded-2xl bg-violet-600 hover:bg-violet-700" onClick={() => setActiveStep(onboardingScreens[Math.min(onboardingScreens.length - 1, stepIndex + 1)])}>
          {activeStep === "complete" ? "Done" : "Continue"}
        </Button>
      </div>
    </Shell>
  );
}

function HomeScreen() {
  return (
    <Shell title="ReframeQ" subtitle="A calmer day, one thought at a time">
      <Card className="border-0 bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white shadow-xl">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm text-white/85">Today’s check-in</div>
              <div className="mt-1 text-2xl font-semibold">How are you feeling?</div>
              <div className="mt-2 text-sm text-white/85">A quick mood check personalizes your self-help journey.</div>
            </div>
            <div className="rounded-2xl bg-white/15 p-3"><Smile className="h-6 w-6" /></div>
          </div>
          <div className="mt-4 grid grid-cols-5 gap-2">
            {[
              { emoji: "😣", label: "Overwhelmed" },
              { emoji: "😕", label: "Confused" },
              { emoji: "😐", label: "Okay" },
              { emoji: "🙂", label: "Better" },
              { emoji: "😌", label: "Calm" },
            ].map((m) => (
              <button key={m.label} className="rounded-2xl bg-white/15 px-2 py-3 text-center backdrop-blur-sm transition hover:bg-white/25">
                <div className="text-xl">{m.emoji}</div>
                <div className="mt-1 text-[10px] leading-tight text-white/90">{m.label}</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Card className="border-0 bg-white/85 shadow-sm"><CardContent className="p-4"><div className="flex items-center gap-2 text-violet-600"><CheckCircle2 className="h-4 w-4" /><span className="text-sm font-medium">Streak</span></div><div className="mt-2 text-2xl font-semibold text-neutral-900">12 days</div><div className="text-xs text-neutral-500">Consistency builds momentum.</div></CardContent></Card>
        <Card className="border-0 bg-white/85 shadow-sm"><CardContent className="p-4"><div className="flex items-center gap-2 text-fuchsia-600"><Clock3 className="h-4 w-4" /><span className="text-sm font-medium">Daily goal</span></div><div className="mt-2 text-2xl font-semibold text-neutral-900">8 / 10 min</div><Progress value={80} className="mt-3 h-2" /></CardContent></Card>
      </div>

      <SectionTitle title="Resume where you left off" />
      <Card className="mt-3 border-0 bg-white/90 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-medium text-neutral-900">New society friendships</div>
              <div className="mt-1 text-sm text-neutral-500">You saved one reframe and a small observation exercise.</div>
            </div>
            <Badge className="rounded-full bg-violet-100 text-violet-700">Friendships</Badge>
          </div>
          <div className="mt-3 rounded-2xl bg-violet-50 p-3 text-sm text-neutral-700">Try this next: notice 3 interactions before deciding how the whole society feels.</div>
        </CardContent>
      </Card>

      <SectionTitle title="Suggested for you" action="See all" />
      <div className="mt-3 space-y-3">
        {tools.slice(0, 4).map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.title} className="border-0 bg-white/90 shadow-sm">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-2xl bg-violet-100 p-3 text-violet-700"><Icon className="h-5 w-5" /></div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-neutral-900">{item.title}</div>
                  <div className="text-sm text-neutral-500">{item.desc}</div>
                </div>
                <ChevronRight className="h-5 w-5 text-neutral-400" />
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-5 rounded-3xl bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-amber-100 p-2 text-amber-700"><Sun className="h-5 w-5" /></div>
          <div>
            <div className="font-medium text-neutral-900">Gentle reminder</div>
            <div className="mt-1 text-sm text-neutral-600">Thoughts are not facts. Pause, label the feeling, and respond kindly to yourself.</div>
          </div>
        </div>
      </div>
    </Shell>
  );
}

function ChatScreen() {
  return (
    <Shell title="Coach" subtitle="Safe, structured, and supportive" onBack rightSlot={<Badge className="rounded-full bg-white text-emerald-700">Mind reading</Badge>}>
      <div className="space-y-3">
        <Card className="border-0 bg-violet-100/80 shadow-sm">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <div className="font-medium text-neutral-900">Session goal</div>
              <div className="text-sm text-neutral-600">Challenge an assumption and choose a small next step</div>
            </div>
            <Badge className="rounded-full bg-white text-violet-700">7 min</Badge>
          </CardContent>
        </Card>

        {chatMessages.map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
            <div className={cx("max-w-[82%] rounded-3xl px-4 py-3 text-sm shadow-sm", m.from === "user" ? "bg-violet-600 text-white" : "bg-white text-neutral-800")}>
              {m.text}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Button className="rounded-2xl bg-violet-600 hover:bg-violet-700"><BookMarked className="mr-2 h-4 w-4" /> Thought record</Button>
        <Button variant="outline" className="rounded-2xl border-violet-200 bg-white/80"><TimerReset className="mr-2 h-4 w-4" /> Breathing help</Button>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {[
          [Compass, "Question thought"],
          [RefreshCcw, "Try another reframe"],
          [Target, "Small next step"],
          [ShieldCheck, "Safety boundaries"],
        ].map(([Icon, label]) => (
          <Card key={label} className="border-0 bg-white/90 shadow-sm"><CardContent className="flex items-center gap-3 p-4"><div className="rounded-2xl bg-fuchsia-100 p-3 text-fuchsia-700"><Icon className="h-4 w-4" /></div><div className="text-sm font-medium text-neutral-800">{label}</div></CardContent></Card>
        ))}
      </div>

      <div className="mt-5 rounded-[28px] bg-white p-3 shadow-sm">
        <div className="flex items-center gap-2">
          <Input value="I had a stressful conversation and now I feel..." readOnly className="border-0 bg-neutral-50" />
          <button className="rounded-2xl bg-violet-600 p-3 text-white"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>
    </Shell>
  );
}

function ToolsScreen() {
  return (
    <Shell title="Tools" subtitle="CBT exercises and guided support" onBack>
      <div className="grid grid-cols-2 gap-3">
        {tools.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.title} className="border-0 bg-white/90 shadow-sm">
              <CardContent className="p-4">
                <div className="mb-4 inline-flex rounded-2xl bg-fuchsia-100 p-3 text-fuchsia-700"><Icon className="h-5 w-5" /></div>
                <div className="font-medium text-neutral-900">{item.title}</div>
                <div className="mt-1 text-sm text-neutral-500">{item.desc}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <SectionTitle title="Programs" />
      <div className="mt-3 space-y-3">
        {[
          { title: "7-day Calm Mind", desc: "Short reframes, daily check-ins, and reset exercises.", badge: "Popular" },
          { title: "Friendship Reset", desc: "Interpret social situations more fairly and practice one small action.", badge: "Social" },
          { title: "Parent Pause Pack", desc: "Respond to child behavior with more clarity and less reactivity.", badge: "Family" },
        ].map((item) => (
          <Card key={item.title} className="border-0 bg-white/90 shadow-sm"><CardContent className="flex items-center justify-between gap-4 p-4"><div><div className="font-medium text-neutral-900">{item.title}</div><div className="mt-1 text-sm text-neutral-500">{item.desc}</div></div><Badge className="rounded-full bg-violet-100 text-violet-700">{item.badge}</Badge></CardContent></Card>
        ))}
      </div>

      <div className="mt-5 rounded-3xl bg-gradient-to-r from-emerald-100 to-cyan-100 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="font-semibold text-neutral-900">Personalized plan</div>
            <div className="mt-1 text-sm text-neutral-600">Based on your recent check-ins, ReframeQ suggests sleep support, reframing, and one behavior experiment.</div>
          </div>
          <BarChart3 className="h-8 w-8 text-emerald-700" />
        </div>
      </div>
    </Shell>
  );
}

function FamilyScreen() {
  return (
    <Shell title="Family Space" subtitle="Profiles, limits, and visibility" onBack rightSlot={<Settings className="h-5 w-5 text-neutral-500" />}>
      <Card className="border-0 bg-white/90 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-neutral-900">Guardian controls</div>
              <div className="text-sm text-neutral-500">Safe design for children and families</div>
            </div>
            <div className="rounded-2xl bg-violet-100 p-3 text-violet-700"><Shield className="h-5 w-5" /></div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-neutral-50 p-3"><div className="text-xs text-neutral-500">Visibility</div><div className="mt-1 font-medium text-neutral-900">Parent summary</div></div>
            <div className="rounded-2xl bg-neutral-50 p-3"><div className="text-xs text-neutral-500">Content safety</div><div className="mt-1 font-medium text-neutral-900">Restricted topics</div></div>
          </div>
        </CardContent>
      </Card>

      <SectionTitle title="Family profiles" />
      <div className="mt-3 space-y-3">
        {familyProfiles.map((p) => (
          <Card key={p.name} className="border-0 bg-white/90 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-neutral-900">{p.name}</div>
                  <div className="text-sm text-neutral-500">{p.type} • {p.age}</div>
                </div>
                <Badge className="rounded-full bg-violet-100 text-violet-700">{p.time}</Badge>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-neutral-50 px-3 py-2 text-neutral-600">{p.rule}</div>
                <div className="rounded-2xl bg-neutral-50 px-3 py-2 text-neutral-600">{p.topics}</div>
              </div>
              <div className="mt-3 flex items-center justify-between rounded-2xl bg-neutral-50 px-3 py-2 text-sm text-neutral-600"><span>Status: {p.status}</span><ChevronRight className="h-4 w-4" /></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <SectionTitle title="Controls" />
      <div className="mt-3 grid grid-cols-2 gap-3">
        {[
          [Lock, "Conversation visibility"],
          [Clock3, "Daily time limits"],
          [PanelRightClose, "Topic restrictions"],
          [Phone, "Guardian consent"],
        ].map(([Icon, label]) => (
          <Card key={label} className="border-0 bg-white/90 shadow-sm"><CardContent className="p-4"><div className="rounded-2xl bg-violet-100 p-3 text-violet-700 w-fit"><Icon className="h-4 w-4" /></div><div className="mt-3 text-sm font-medium text-neutral-800">{label}</div></CardContent></Card>
        ))}
      </div>

      <Button variant="outline" className="mt-4 w-full rounded-2xl border-dashed bg-white/80 py-6 text-violet-700"><PlusCircle className="mr-2 h-4 w-4" /> Add family profile</Button>
    </Shell>
  );
}

function ProfileScreen() {
  return (
    <Shell title="Profile" subtitle="Preferences, privacy, and account" onBack rightSlot={<Settings className="h-5 w-5 text-neutral-500" />}>
      <Card className="border-0 bg-white/90 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-lg font-semibold text-white">R</div>
            <div>
              <div className="text-lg font-semibold text-neutral-900">Ravin</div>
              <div className="text-sm text-neutral-500">Calm growth plan</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-4 space-y-3">
        {[
          [Lock, "Privacy & data controls", "Manage stored conversations, export, delete, and consent"],
          [Bell, "Reminders", "Daily check-in and evening wind-down settings"],
          [Shield, "Safety center", "Sensitive topic boundaries and trusted support resources"],
          [SlidersHorizontal, "Guidance style", "Gentle, practical, encouraging, or strategic"],
          [Moon, "Sleep support", "Audio and bedtime routine settings"],
          [ToggleLeft, "Language & region", "English, Hindi, and localized resources"],
        ].map(([Icon, title, desc]) => (
          <Card key={title} className="border-0 bg-white/90 shadow-sm"><CardContent className="flex items-center gap-4 p-4"><div className="rounded-2xl bg-violet-100 p-3 text-violet-700"><Icon className="h-5 w-5" /></div><div className="min-w-0 flex-1"><div className="font-medium text-neutral-900">{title}</div><div className="text-sm text-neutral-500">{desc}</div></div><ChevronRight className="h-5 w-5 text-neutral-400" /></CardContent></Card>
        ))}
      </div>
    </Shell>
  );
}

function HomeMetaPanel({ currentMode, setCurrentMode, onboardingStep, setOnboardingStep }) {
  const featureGroups = [
    "17-step onboarding preview",
    "Individual + family owner + family join paths",
    "Guardian consent and child profile rules",
    "First thought → first reframe flow",
    "Home, Coach, Tools, Family, Profile tabs",
    "Conversation storage, reminders, privacy, and safety sections",
  ];

  return (
    <div className="rounded-[32px] bg-white/80 p-6 shadow-xl ring-1 ring-black/5 backdrop-blur">
      <Badge className="rounded-full bg-violet-100 px-3 py-1 text-violet-700">ReframeQ Mobile App</Badge>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-neutral-900 md:text-5xl">Extended mobile app mock</h1>
      <p className="mt-3 max-w-2xl text-base leading-7 text-neutral-600">A fuller prototype with the onboarding system, family-safe controls, CBT tools, chat guidance, reminders, privacy, and app tabs discussed for ReframeQ.</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          [Sparkles, "Onboarding", "Welcome, goals, clarity, style, reframe, signup, family setup"],
          [Brain, "CBT-first", "Thought reframes, Socratic questioning, experiments, journaling"],
          [Shield, "Family-safe", "Guardian consent, visibility rules, child limits, safe content"],
          [MessageCircle, "Conversational", "Coach-like mobile chat with actions, tags, and route states"],
        ].map(([Icon, title, desc]) => (
          <div key={title} className="rounded-3xl bg-neutral-50 p-4">
            <div className="inline-flex rounded-2xl bg-white p-3 shadow-sm"><Icon className="h-5 w-5 text-violet-700" /></div>
            <div className="mt-3 font-medium text-neutral-900">{title}</div>
            <div className="mt-1 text-sm text-neutral-500">{desc}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-3xl bg-neutral-50 p-4">
        <div className="text-sm font-medium text-neutral-900">Preview mode</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            ["onboarding", "Onboarding flow"],
            ["app", "Main app"],
          ].map(([id, label]) => (
            <button key={id} onClick={() => setCurrentMode(id)} className={cx("rounded-full px-4 py-2 text-sm", currentMode === id ? "bg-violet-600 text-white" : "bg-white text-neutral-700 shadow-sm")}>{label}</button>
          ))}
        </div>
      </div>

      {currentMode === "onboarding" ? (
        <div className="mt-6 rounded-3xl bg-gradient-to-r from-violet-600 to-fuchsia-500 p-5 text-white">
          <div className="text-lg font-semibold">Onboarding step navigator</div>
          <div className="mt-3 flex flex-wrap gap-2 text-sm text-white/90">
            {onboardingScreens.map((step) => (
              <button key={step} onClick={() => setOnboardingStep(step)} className={cx("rounded-full px-3 py-2", onboardingStep === step ? "bg-white text-violet-700" : "bg-white/15")}>{step}</button>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-3xl bg-gradient-to-r from-violet-600 to-fuchsia-500 p-5 text-white">
          <div className="text-lg font-semibold">Included app features</div>
          <div className="mt-2 grid gap-2 text-sm text-white/90 sm:grid-cols-2">
            {featureGroups.map((item) => <div key={item}>• {item}</div>)}
          </div>
        </div>
      )}

      <SectionTitle title="Recent conversation threads" />
      <div className="mt-3 space-y-3">
        {recentThreads.map((item) => (
          <div key={item.title} className="rounded-3xl bg-neutral-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-medium text-neutral-900">{item.title}</div>
                <div className="text-sm text-neutral-500">Updated {item.updated}</div>
              </div>
              <Badge className="rounded-full bg-violet-100 text-violet-700">{item.tag}</Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ReframeQMobileAppExtended() {
  const [currentMode, setCurrentMode] = useState("onboarding");
  const [appTab, setAppTab] = useState("home");
  const [onboardingStep, setOnboardingStep] = useState("welcome");

  const rightPreview = useMemo(() => {
    if (currentMode === "onboarding") {
      return <OnboardingPreview data={onboardingDefaults} activeStep={onboardingStep} setActiveStep={setOnboardingStep} />;
    }

    switch (appTab) {
      case "chat":
        return <ChatScreen />;
      case "tools":
        return <ToolsScreen />;
      case "family":
        return <FamilyScreen />;
      case "profile":
        return <ProfileScreen />;
      default:
        return <HomeScreen />;
    }
  }, [currentMode, appTab, onboardingStep]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-100 via-white to-violet-100 p-6 md:p-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 grid gap-6 lg:grid-cols-[1.1fr_420px]">
          <HomeMetaPanel currentMode={currentMode} setCurrentMode={setCurrentMode} onboardingStep={onboardingStep} setOnboardingStep={setOnboardingStep} />
          <div className="flex justify-center">{rightPreview}</div>
        </div>

        {currentMode === "app" ? (
          <div className="mx-auto mt-4 max-w-3xl rounded-[28px] bg-white/80 p-3 shadow-lg ring-1 ring-black/5 backdrop-blur">
            <div className="grid grid-cols-5 gap-2">
              {appTabs.map((tab) => {
                const Icon = tab.icon;
                const active = appTab === tab.id;
                return (
                  <button key={tab.id} onClick={() => setAppTab(tab.id)} className={cx("rounded-2xl px-3 py-3 transition", active ? "bg-violet-600 text-white shadow-md" : "bg-transparent text-neutral-500 hover:bg-neutral-100")}>
                    <div className="flex flex-col items-center gap-1">
                      <Icon className="h-5 w-5" />
                      <span className="text-xs font-medium">{tab.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
