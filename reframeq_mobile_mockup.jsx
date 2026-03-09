import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
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
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const tabs = [
  { id: "home", label: "Home", icon: Home },
  { id: "chat", label: "Coach", icon: MessageCircle },
  { id: "tools", label: "Tools", icon: Heart },
  { id: "family", label: "Family", icon: Users },
  { id: "profile", label: "Profile", icon: User },
];

const moodOptions = [
  { emoji: "😣", label: "Overwhelmed" },
  { emoji: "😕", label: "Confused" },
  { emoji: "😐", label: "Okay" },
  { emoji: "🙂", label: "Better" },
  { emoji: "😌", label: "Calm" },
];

const toolCards = [
  {
    title: "Thought Reframe",
    desc: "Turn unhelpful thoughts into balanced ones.",
    icon: Brain,
  },
  {
    title: "Breathing Reset",
    desc: "A 2-minute guided calm-down exercise.",
    icon: PlayCircle,
  },
  {
    title: "Mood Journal",
    desc: "Track feelings, triggers, and wins.",
    icon: BookOpen,
  },
  {
    title: "Sleep Wind-down",
    desc: "Gentle night support with audio prompts.",
    icon: Moon,
  },
];

const familyProfiles = [
  { name: "Alisha", type: "Child", rule: "Parent-visible", time: "20 min/day" },
  { name: "Rupali", type: "Adult", rule: "Private", time: "No limit" },
];

const messages = [
  {
    from: "bot",
    text: "Hi, I’m your ReframeQ guide. What’s feeling hardest right now?",
  },
  {
    from: "user",
    text: "I keep thinking I will fail at everything today.",
  },
  {
    from: "bot",
    text: "Let’s slow that thought down. What is one fact that supports it, and one fact that doesn’t?",
  },
];

function PhoneFrame({ children, title, subtitle, onBack, rightIcon }) {
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
          {rightIcon || <Bell className="h-5 w-5 text-neutral-500" />}
        </div>

        <div className="h-[calc(100%-124px)] overflow-auto px-4 pb-28 pt-4 [scrollbar-width:none]">
          {children}
        </div>
      </div>
    </div>
  );
}

function HomeScreen() {
  return (
    <PhoneFrame title="ReframeQ" subtitle="A calmer day, one thought at a time">
      <Card className="border-0 bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white shadow-xl">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm text-white/85">Today’s check-in</div>
              <div className="mt-1 text-2xl font-semibold">How are you feeling?</div>
              <div className="mt-2 text-sm text-white/85">
                A quick mood check helps personalize your CBT support.
              </div>
            </div>
            <div className="rounded-2xl bg-white/15 p-3">
              <Smile className="h-6 w-6" />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-5 gap-2">
            {moodOptions.map((m) => (
              <button
                key={m.label}
                className="rounded-2xl bg-white/15 px-2 py-3 text-center backdrop-blur-sm transition hover:bg-white/25"
              >
                <div className="text-xl">{m.emoji}</div>
                <div className="mt-1 text-[10px] leading-tight text-white/90">{m.label}</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Card className="border-0 bg-white/85 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-violet-600">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm font-medium">Streak</span>
            </div>
            <div className="mt-2 text-2xl font-semibold text-neutral-900">12 days</div>
            <div className="text-xs text-neutral-500">Consistency builds emotional resilience.</div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white/85 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-fuchsia-600">
              <Clock3 className="h-4 w-4" />
              <span className="text-sm font-medium">Daily goal</span>
            </div>
            <div className="mt-2 text-2xl font-semibold text-neutral-900">8 / 10 min</div>
            <Progress value={80} className="mt-3 h-2" />
          </CardContent>
        </Card>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <div className="text-base font-semibold text-neutral-900">Suggested for you</div>
        <button className="text-sm font-medium text-violet-600">See all</button>
      </div>

      <div className="mt-3 space-y-3">
        {toolCards.slice(0, 3).map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.title} className="border-0 bg-white/90 shadow-sm">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-2xl bg-violet-100 p-3 text-violet-700">
                  <Icon className="h-5 w-5" />
                </div>
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
          <div className="rounded-2xl bg-amber-100 p-2 text-amber-700">
            <Sun className="h-5 w-5" />
          </div>
          <div>
            <div className="font-medium text-neutral-900">Gentle reminder</div>
            <div className="mt-1 text-sm text-neutral-600">
              Thoughts are not facts. Pause, label the feeling, and respond kindly to yourself.
            </div>
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}

function ChatScreen() {
  return (
    <PhoneFrame title="CBT Coach" subtitle="Safe, structured, and supportive" onBack>
      <div className="space-y-3">
        <Card className="border-0 bg-violet-100/80 shadow-sm">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <div className="font-medium text-neutral-900">Session goal</div>
              <div className="text-sm text-neutral-600">Challenge an anxious thought pattern</div>
            </div>
            <Badge className="rounded-full bg-white text-violet-700">7 min</Badge>
          </CardContent>
        </Card>

        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[82%] rounded-3xl px-4 py-3 text-sm shadow-sm ${
                m.from === "user"
                  ? "bg-violet-600 text-white"
                  : "bg-white text-neutral-800"
              }`}
            >
              {m.text}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Button className="rounded-2xl bg-violet-600 hover:bg-violet-700">Thought Record</Button>
        <Button variant="outline" className="rounded-2xl border-violet-200 bg-white/80">
          Breathing Help
        </Button>
      </div>

      <div className="mt-5 rounded-[28px] bg-white p-3 shadow-sm">
        <div className="flex items-center gap-2">
          <Input
            value="I had a stressful conversation and now I feel..."
            readOnly
            className="border-0 bg-neutral-50"
          />
          <button className="rounded-2xl bg-violet-600 p-3 text-white">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </PhoneFrame>
  );
}

function ToolsScreen() {
  return (
    <PhoneFrame title="Tools" subtitle="CBT exercises and guided support" onBack>
      <div className="grid grid-cols-2 gap-3">
        {toolCards.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.title} className="border-0 bg-white/90 shadow-sm">
              <CardContent className="p-4">
                <div className="mb-4 inline-flex rounded-2xl bg-fuchsia-100 p-3 text-fuchsia-700">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="font-medium text-neutral-900">{item.title}</div>
                <div className="mt-1 text-sm text-neutral-500">{item.desc}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-5 rounded-3xl bg-gradient-to-r from-emerald-100 to-cyan-100 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="font-semibold text-neutral-900">Personalized plan</div>
            <div className="mt-1 text-sm text-neutral-600">
              Based on your recent check-ins, ReframeQ suggests sleep support and reframing.
            </div>
          </div>
          <BarChart3 className="h-8 w-8 text-emerald-700" />
        </div>
      </div>
    </PhoneFrame>
  );
}

function FamilyScreen() {
  return (
    <PhoneFrame title="Family Space" subtitle="Profiles, limits, and visibility" onBack>
      <Card className="border-0 bg-white/90 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-neutral-900">Guardian controls</div>
              <div className="text-sm text-neutral-500">Safe design for children and families</div>
            </div>
            <div className="rounded-2xl bg-violet-100 p-3 text-violet-700">
              <Shield className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-neutral-50 p-3">
              <div className="text-xs text-neutral-500">Visibility</div>
              <div className="mt-1 font-medium text-neutral-900">Parent summary</div>
            </div>
            <div className="rounded-2xl bg-neutral-50 p-3">
              <div className="text-xs text-neutral-500">Content safety</div>
              <div className="mt-1 font-medium text-neutral-900">Restricted topics</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-4 space-y-3">
        {familyProfiles.map((p) => (
          <Card key={p.name} className="border-0 bg-white/90 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-neutral-900">{p.name}</div>
                  <div className="text-sm text-neutral-500">{p.type}</div>
                </div>
                <Badge className="rounded-full bg-violet-100 text-violet-700">{p.time}</Badge>
              </div>
              <div className="mt-3 flex items-center justify-between rounded-2xl bg-neutral-50 px-3 py-2 text-sm text-neutral-600">
                <span>{p.rule}</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button variant="outline" className="mt-4 w-full rounded-2xl border-dashed bg-white/80 py-6 text-violet-700">
        <PlusCircle className="mr-2 h-4 w-4" /> Add family profile
      </Button>
    </PhoneFrame>
  );
}

function ProfileScreen() {
  return (
    <PhoneFrame
      title="Profile"
      subtitle="Preferences, privacy, and account"
      onBack
      rightIcon={<Settings className="h-5 w-5 text-neutral-500" />}
    >
      <Card className="border-0 bg-white/90 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-lg font-semibold text-white">
              R
            </div>
            <div>
              <div className="text-lg font-semibold text-neutral-900">Ravin</div>
              <div className="text-sm text-neutral-500">Calm growth plan</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-4 space-y-3">
        {[
          [Lock, "Privacy & data controls", "Manage consent, visibility, and safety rules"],
          [Bell, "Reminders", "Daily check-in and evening wind-down"],
          [Moon, "Sleep support", "Audio and bedtime routine settings"],
          [Shield, "Safety center", "Crisis guidance and trusted contacts"],
        ].map(([Icon, title, desc]) => (
          <Card key={title} className="border-0 bg-white/90 shadow-sm">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-2xl bg-violet-100 p-3 text-violet-700">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-neutral-900">{title}</div>
                <div className="text-sm text-neutral-500">{desc}</div>
              </div>
              <ChevronRight className="h-5 w-5 text-neutral-400" />
            </CardContent>
          </Card>
        ))}
      </div>
    </PhoneFrame>
  );
}

export default function ReframeQMobileMockup() {
  const [activeTab, setActiveTab] = useState("home");

  const screen = useMemo(() => {
    switch (activeTab) {
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
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-100 via-white to-violet-100 p-6 md:p-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 grid gap-6 lg:grid-cols-[1.1fr_420px]">
          <div className="rounded-[32px] bg-white/80 p-6 shadow-xl ring-1 ring-black/5 backdrop-blur">
            <Badge className="rounded-full bg-violet-100 px-3 py-1 text-violet-700">ReframeQ Mobile App</Badge>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-neutral-900 md:text-5xl">
              Mobile app mockup frontend
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-neutral-600">
              A calming CBT-inspired interface designed for daily emotional check-ins, guided reframing,
              family-safe controls, and structured self-help flows.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                [Sparkles, "Calm UI", "Soft gradients, rounded cards, low-friction interactions"],
                [Brain, "CBT-first", "Thought records, guided prompts, structured exercises"],
                [Shield, "Family-safe", "Guardian controls, visibility rules, content restrictions"],
                [MessageCircle, "Conversational", "Coach-like mobile chat with actions and prompts"],
              ].map(([Icon, title, desc]) => (
                <div key={title} className="rounded-3xl bg-neutral-50 p-4">
                  <div className="inline-flex rounded-2xl bg-white p-3 shadow-sm">
                    <Icon className="h-5 w-5 text-violet-700" />
                  </div>
                  <div className="mt-3 font-medium text-neutral-900">{title}</div>
                  <div className="mt-1 text-sm text-neutral-500">{desc}</div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-3xl bg-gradient-to-r from-violet-600 to-fuchsia-500 p-5 text-white">
              <div className="text-lg font-semibold">Included screens</div>
              <div className="mt-2 grid gap-2 text-sm text-white/90 sm:grid-cols-2">
                <div>• Home dashboard</div>
                <div>• CBT coach chat</div>
                <div>• Tools library</div>
                <div>• Family controls</div>
                <div>• Profile & privacy</div>
              </div>
            </div>
          </div>

          <div className="flex justify-center">{screen}</div>
        </div>

        <div className="mx-auto mt-4 max-w-3xl rounded-[28px] bg-white/80 p-3 shadow-lg ring-1 ring-black/5 backdrop-blur">
          <div className="grid grid-cols-5 gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-2xl px-3 py-3 transition ${
                    active ? "bg-violet-600 text-white shadow-md" : "bg-transparent text-neutral-500 hover:bg-neutral-100"
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <Icon className="h-5 w-5" />
                    <span className="text-xs font-medium">{tab.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
