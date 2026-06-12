"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const DEFAULT_STATE = {
  headline: "Anaesthetics applicant dashboard",
  target: "PGY3 anaesthetics (apply/start)",
  phase: "Now: 5th year student with critical care exposure early next year and elective end of next year.",
  roadmap: `Med school -> internship -> PGY2 critical care/anaes-facing -> PGY3 anaes training/SRMO -> reapply if needed.`,
  weeklyMinimum: `Minimum weekly load (2.5-4 hrs):
1) Anaesthetic/acute care content: 60-90 min
2) Portfolio capture: 20-30 min
3) Research/QI progress: 60-90 min
4) Mentor/referee touchpoint: 10-15 min
5) Interview bank update: 15 min`,
  highYieldOutputs: `High-yield CV outputs:
- Perioperative research/QI output (bariatric/PONV/periop technique)
- Teaching evidence (small session + feedback forms)
- Critical care + elective: logs + reflections + mentor
- Leadership: Luna Education narrative + evidence
- Strong referees`,
  aiPromptSet: `Copy/paste prompt set:

Daily placement debrief:
"Here are my notes from today. Convert into learning points, anaesthetic relevance, reflection, interview STAR, 5 Anki cards, 1 question for tomorrow." 

Weekly review:
"Summarise my week for PGY3 anaesthetics prep. Identify strongest evidence, gaps, and one improvement."`,
  thisWeek: "",
  researchQi: "",
  teaching: "",
  mentors: "",
  interviewStories: "",
  reflections: "",
  backlog: "",
};

export default function Page() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [state, setState] = useState(DEFAULT_STATE);

  const userId = session?.user?.id;

  useEffect(() => {
    let mounted = true;

    async function loadSessionAndData() {
      const {
        data: { session: current },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        setMessage(error.message);
      }

      if (!mounted) return;
      setSession(current);

      if (current?.user) {
        await loadData(current.user.id);
      }

      setLoading(false);
    }

    loadSessionAndData();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        if (newSession?.user) {
          await loadData(newSession.user.id);
        }
      }
    );

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe?.();
    };
  }, []);

  async function loadData(uid) {
    setLoading(true);
    setMessage("");
    const { data, error } = await supabase
      .from("dashboard_state")
      .select("data")
      .eq("user_id", uid)
      .maybeSingle();

    if (error) {
      setMessage(error.message);
    } else if (data?.data) {
      setState({ ...DEFAULT_STATE, ...data.data });
    }

    setLoading(false);
  }

  async function signInMagicLink(e) {
    e?.preventDefault();
    setMessage("");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // You must add this to Supabase Auth "Redirect URLs"
        emailRedirectTo: window?.location?.origin,
      },
    });

    if (error) setMessage(error.message);
    else setMessage("Check your email for a magic link.");
  }

  async function signOut() {
    await supabase.auth.signOut();
    setState(DEFAULT_STATE);
    setMessage("");
  }

  async function save() {
    if (!userId) {
      setMessage("Please sign in first.");
      return;
    }

    setSaving(true);
    setMessage("");

    const { error } = await supabase.from("dashboard_state").upsert({
      user_id: userId,
      data: state,
      updated_at: new Date().toISOString(),
    });

    setSaving(false);
    if (error) setMessage(error.message);
    else setMessage("Saved ✅");
  }

  const onChange = (key) => (e) => {
    setState((prev) => ({ ...prev, [key]: e.target.value }));
  };

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  if (!session) {
    return (
      <main className="container">
        <section className="card">
          <h1>{state.headline}</h1>
          <p>Sign in with a magic link to sync across devices.</p>
          <form onSubmit={signInMagicLink} className="loginForm">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
            <button type="submit">Send magic link</button>
          </form>
          {message ? <p className="message">{message}</p> : null}
          <p className="hint">
            Ensure your Supabase Auth redirect URL includes {" "}
            <code>{typeof window !== "undefined" ? window.location.origin : ""}</code>.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="container">
      <section className="card">
        <div className="topBar">
          <div>
            <h1>{state.headline}</h1>
            <p>
              Signed in as <b>{session.user.email}</b>
            </p>
          </div>
          <div className="buttons">
            <button onClick={save} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
            <button onClick={signOut}>Sign out</button>
          </div>
        </div>

        {message ? <p className="message">{message}</p> : null}

        <div className="grid">
          <div className="panel">
            <h2>Target</h2>
            <textarea value={state.target} onChange={onChange("target")} />
            <h2>Phase</h2>
            <textarea value={state.phase} onChange={onChange("phase")} />
            <h2>Roadmap</h2>
            <textarea value={state.roadmap} onChange={onChange("roadmap")} />
            <h2>Weekly minimum</h2>
            <textarea
              value={state.weeklyMinimum}
              onChange={onChange("weeklyMinimum")}
            />
          </div>

          <div className="panel">
            <h2>High-yield outputs</h2>
            <textarea
              value={state.highYieldOutputs}
              onChange={onChange("highYieldOutputs")}
            />
            <h2>AI prompt set</h2>
            <textarea
              value={state.aiPromptSet}
              onChange={onChange("aiPromptSet")}
            />
          </div>

          <div className="panel">
            <h2>This week</h2>
            <textarea value={state.thisWeek} onChange={onChange("thisWeek")} />
            <h2>Research/QI</h2>
            <textarea value={state.researchQi} onChange={onChange("researchQi")} />
            <h2>Teaching</h2>
            <textarea value={state.teaching} onChange={onChange("teaching")} />
          </div>

          <div className="panel">
            <h2>Mentor/referee pipeline</h2>
            <textarea value={state.mentors} onChange={onChange("mentors")} />
            <h2>Interview stories</h2>
            <textarea
              value={state.interviewStories}
              onChange={onChange("interviewStories")}
            />
            <h2>Reflections / backlog</h2>
            <textarea
              value={state.reflections}
              onChange={onChange("reflections")}
            />
            <textarea value={state.backlog} onChange={onChange("backlog")} />
          </div>
        </div>
      </section>

      <section className="card">
        <h2>Supabase table model (for reference)</h2>
        <p>
          Table: <code>dashboard_state</code> — columns: user_id UUID (PK), data JSONB,
          updated_at timestamptz.
        </p>
      </section>
    </main>
  );
}
