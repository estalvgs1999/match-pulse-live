"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";

  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus("submitting");
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (!res.ok) {
      setStatus("error");
      setError("Invalid security key. Try again.");
      return;
    }

    window.location.href = next;
  }

  return (
    <main className="relative z-10 w-full max-w-[440px] px-6 py-12">
      <header className="text-center mb-10 space-y-2">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center shadow-[0_0_20px_rgba(167,139,250,0.3)]">
            <span
              className="material-symbols-outlined text-on-primary text-3xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              pulse_alert
            </span>
          </div>
        </div>
        <h1 className="text-3xl font-black tracking-tighter text-on-surface">MatchPulse Live</h1>
        <p className="text-on-surface-variant text-sm font-medium">Broadcast Operator Console</p>
      </header>

      <div className="obsidian-card rounded-xl p-8 shadow-2xl">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <label
                className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant"
                htmlFor="password"
              >
                Security Key
              </label>
            </div>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm">
                key
              </span>
              <input
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg py-2.5 pl-10 pr-4 text-on-surface placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200"
                id="password"
                name="password"
                placeholder="••••••••••••"
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
            </div>
            {status === "error" && <p className="text-xs text-error">{error}</p>}
          </div>

          <div className="pt-2">
            <button
              className="w-full bg-primary hover:bg-primary-container text-on-primary font-bold py-3 rounded-lg shadow-[0_4px_12px_rgba(167,139,250,0.2)] active:scale-[0.98] transition-all flex items-center justify-center space-x-2 disabled:opacity-80 disabled:pointer-events-none"
              type="submit"
              disabled={status === "submitting"}
            >
              <span>{status === "submitting" ? "Authenticating..." : "Sign In"}</span>
              <span className="material-symbols-outlined text-lg">login</span>
            </button>
          </div>
        </form>
      </div>

      <footer className="mt-12 w-full">
        <div className="flex items-center justify-center gap-4 px-2">
          <div className="flex items-center space-x-2 bg-surface-container-low border border-outline-variant px-3 py-1.5 rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-tertiary" />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-tighter text-tertiary">
              All systems operational
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}

export default function LoginPage() {
  return (
    <div className="bg-background text-on-background flex flex-1 flex-col min-h-screen items-center justify-center selection:bg-primary/30 font-body">
      <div className="glow-effect" />
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
