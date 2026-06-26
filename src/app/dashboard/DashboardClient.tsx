"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface TeamInfo {
  _id: string;
  name: string;
  shortName: string;
  logoUrl?: string;
  colors: { primary: string; secondary: string };
}

interface MatchEntry {
  _id: string;
  tournament: string;
  matchday: string;
  stadium: string;
  date: string;
  homeTeam: TeamInfo | null;
  awayTeam: TeamInfo | null;
  state: { locked: boolean; matchStatus: string } | null;
}

function matchBroadcastStatus(entry: MatchEntry): "live" | "scheduled" | "ended" {
  const s = entry.state;
  if (!s) return "scheduled";
  if (s.locked || s.matchStatus === "ended") return "ended";
  if (["in_progress", "half_time", "extra_time", "extra_time_2", "timeout"].includes(s.matchStatus))
    return "live";
  return "scheduled";
}

function StatusBadge({ status }: { status: "live" | "scheduled" | "ended" }) {
  if (status === "live") {
    return (
      <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-tertiary">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-tertiary" />
        </span>
        En Vivo
      </span>
    );
  }
  if (status === "ended") {
    return (
      <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
        <span className="h-2 w-2 rounded-full bg-outline inline-block" />
        Finalizado
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
      <span className="h-2 w-2 rounded-full bg-primary inline-block" />
      Programado
    </span>
  );
}

function useObsStatus(matchId: string) {
  const [connected, setConnected] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    async function check() {
      try {
        const res = await fetch(`/api/matches/${matchId}/obs-status`);
        if (!res.ok) return;
        const data = await res.json();
        if (active) setConnected(data.connected);
      } catch { /* ignore */ }
    }
    check();
    const id = setInterval(check, 5_000);
    return () => { active = false; clearInterval(id); };
  }, [matchId]);

  return connected;
}

function OBSModal({ matchId, onClose }: { matchId: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const obsConnected = useObsStatus(matchId);
  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/overlay/${matchId}`
      : `/overlay/${matchId}`;

  function copy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={onClose}>
      <div className="obsidian-card rounded-xl w-full max-w-md p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-bold text-on-surface text-lg">Conexión OBS</h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Agrega esta URL como Browser Source en OBS
            </p>
          </div>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Connection status indicator */}
        <div className={`flex items-center gap-3 rounded-lg px-4 py-3 border ${
          obsConnected === null
            ? "border-outline-variant bg-surface-container"
            : obsConnected
              ? "border-tertiary/40 bg-tertiary/5"
              : "border-error/40 bg-error/5"
        }`}>
          {obsConnected === null ? (
            <span className="h-2.5 w-2.5 rounded-full bg-outline animate-pulse flex-shrink-0" />
          ) : obsConnected ? (
            <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-tertiary" />
            </span>
          ) : (
            <span className="h-2.5 w-2.5 rounded-full bg-error flex-shrink-0" />
          )}
          <div>
            <p className={`text-xs font-bold uppercase tracking-wider ${
              obsConnected === null ? "text-on-surface-variant" : obsConnected ? "text-tertiary" : "text-error"
            }`}>
              {obsConnected === null ? "Verificando..." : obsConnected ? "OBS Conectado" : "OBS Desconectado"}
            </p>
            <p className="text-[10px] text-on-surface-variant mt-0.5">
              {obsConnected === null
                ? "Comprobando estado del overlay"
                : obsConnected
                  ? "El overlay está activo y recibiendo datos"
                  : "El overlay no está abierto en OBS"}
            </p>
          </div>
        </div>

        <div className="bg-surface-container-highest rounded-lg p-3 font-mono text-xs text-on-surface break-all">
          {url}
        </div>
        <div className="space-y-2 text-xs text-on-surface-variant">
          <p className="flex items-start gap-2">
            <span className="material-symbols-outlined text-base text-primary flex-shrink-0">monitor</span>
            Resolución recomendada: <strong className="text-on-surface">1920 × 1080</strong>
          </p>
          <p className="flex items-start gap-2">
            <span className="material-symbols-outlined text-base text-primary flex-shrink-0">layers</span>
            Activa <strong className="text-on-surface">"Control audio via OBS"</strong> y desactiva el fondo
            personalizado para transparencia total.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={copy}
            className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary-container text-on-primary font-bold py-2.5 rounded-lg text-sm transition-colors"
          >
            <span className="material-symbols-outlined text-base">{copied ? "check" : "content_copy"}</span>
            {copied ? "¡Copiado!" : "Copiar URL"}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 border border-outline-variant text-on-surface-variant hover:text-on-surface rounded-lg text-sm transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

function MatchCard({
  entry,
  onOBS,
  onDelete,
}: {
  entry: MatchEntry;
  onOBS: (id: string) => void;
  onDelete: (id: string) => Promise<void>;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const status = matchBroadcastStatus(entry);
  const dateLabel = (() => {
    if (!entry.date) return "";
    const d = new Date(entry.date);
    if (isNaN(d.getTime())) return entry.date;
    return d.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" });
  })();

  return (
    <div className="glass-panel rounded-xl p-5 flex flex-col gap-4 hover:border-primary/40 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <StatusBadge status={status} />
        <span className="text-[10px] font-medium text-on-surface-variant bg-surface-container-highest px-2 py-0.5 rounded-full truncate max-w-[140px]">
          {entry.tournament}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col items-center gap-1 min-w-0 flex-1">
          <span
            className="h-3 w-3 rounded-full border border-outline-variant"
            style={{ backgroundColor: entry.homeTeam?.colors.primary ?? "#71717a" }}
          />
          <span className="text-xl font-black tracking-tighter text-on-surface digital-font">
            {entry.homeTeam?.shortName ?? "---"}
          </span>
          <span className="text-[11px] text-on-surface-variant text-center truncate w-full px-1">
            {entry.homeTeam?.name ?? "Local"}
          </span>
        </div>
        <div className="flex flex-col items-center gap-0.5 px-2">
          <span className="text-xs font-bold text-outline">VS</span>
          {status === "live" && (
            <span className="text-[10px] text-tertiary font-medium">{entry.matchday}</span>
          )}
        </div>
        <div className="flex flex-col items-center gap-1 min-w-0 flex-1">
          <span
            className="h-3 w-3 rounded-full border border-outline-variant"
            style={{ backgroundColor: entry.awayTeam?.colors.primary ?? "#71717a" }}
          />
          <span className="text-xl font-black tracking-tighter text-on-surface digital-font">
            {entry.awayTeam?.shortName ?? "---"}
          </span>
          <span className="text-[11px] text-on-surface-variant text-center truncate w-full px-1">
            {entry.awayTeam?.name ?? "Visitante"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-[11px] text-on-surface-variant">
        <span className="material-symbols-outlined text-sm">calendar_today</span>
        <span>{dateLabel}</span>
        {entry.stadium && (
          <>
            <span className="text-outline">·</span>
            <span className="material-symbols-outlined text-sm">stadium</span>
            <span className="truncate">{entry.stadium}</span>
          </>
        )}
      </div>

      <div className="flex gap-2 pt-1 border-t border-outline-variant">
        {status !== "ended" ? (
          <Link
            href={`/control/${entry._id}`}
            className="flex-1 flex items-center justify-center gap-1.5 bg-primary hover:bg-primary-container text-on-primary font-bold py-2 rounded-lg text-xs transition-colors"
          >
            <span className="material-symbols-outlined text-sm">sports_score</span>
            {status === "live" ? "Consola Live" : "Abrir Consola"}
          </Link>
        ) : (
          <Link
            href={`/control/${entry._id}`}
            className="flex-1 flex items-center justify-center gap-1.5 border border-outline-variant text-on-surface-variant hover:text-on-surface font-medium py-2 rounded-lg text-xs transition-colors"
          >
            <span className="material-symbols-outlined text-sm">history</span>
            Ver Registro
          </Link>
        )}
        <button
          onClick={() => onOBS(entry._id)}
          title="Conexión OBS"
          className="flex items-center justify-center gap-1.5 border border-outline-variant text-on-surface-variant hover:text-primary hover:border-primary px-3 py-2 rounded-lg text-xs transition-colors"
        >
          <span className="material-symbols-outlined text-sm">monitor</span>
          <span className="hidden sm:inline">OBS</span>
        </button>
        <button
          onClick={async (e) => {
            e.preventDefault();
            if (!confirmDelete) {
              setConfirmDelete(true);
              setTimeout(() => setConfirmDelete(false), 3000);
              return;
            }
            setDeleting(true);
            await onDelete(entry._id);
          }}
          disabled={deleting}
          title="Eliminar partido"
          className={`flex items-center justify-center gap-1 border px-3 py-2 rounded-lg text-xs transition-colors ${
            confirmDelete
              ? "border-error bg-error/10 text-error"
              : "border-outline-variant text-on-surface-variant hover:text-error hover:border-error"
          } disabled:opacity-40`}
        >
          <span className="material-symbols-outlined text-sm">
            {deleting ? "progress_activity" : confirmDelete ? "warning" : "delete"}
          </span>
          {confirmDelete && <span>¿Eliminar?</span>}
        </button>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="glass-panel rounded-xl p-5 animate-pulse space-y-4">
      <div className="flex justify-between">
        <div className="h-4 w-16 bg-surface-container-highest rounded" />
        <div className="h-4 w-24 bg-surface-container-highest rounded-full" />
      </div>
      <div className="flex justify-between items-center">
        <div className="flex flex-col items-center gap-2 flex-1">
          <div className="h-3 w-3 bg-surface-container-highest rounded-full" />
          <div className="h-7 w-12 bg-surface-container-highest rounded" />
          <div className="h-3 w-20 bg-surface-container-highest rounded" />
        </div>
        <div className="h-5 w-6 bg-surface-container-highest rounded" />
        <div className="flex flex-col items-center gap-2 flex-1">
          <div className="h-3 w-3 bg-surface-container-highest rounded-full" />
          <div className="h-7 w-12 bg-surface-container-highest rounded" />
          <div className="h-3 w-20 bg-surface-container-highest rounded" />
        </div>
      </div>
      <div className="h-4 w-32 bg-surface-container-highest rounded" />
      <div className="h-8 bg-surface-container-highest rounded-lg" />
    </div>
  );
}

const NAV_ITEMS = [
  { icon: "dashboard", label: "Dashboard", key: "dashboard" },
  { icon: "groups", label: "Teams", key: "teams" },
];

export function DashboardClient() {
  const router = useRouter();
  const [matches, setMatches] = useState<MatchEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [obsMatchId, setObsMatchId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/matches");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setMatches(data.matches ?? []);
    } catch {
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDeleteMatch(id: string) {
    await fetch(`/api/matches/${id}`, { method: "DELETE" });
    setMatches((prev) => prev.filter((m) => m._id !== id));
  }

  function handleNavAction(key: string) {
    setMobileNavOpen(false);
    if (key === "dashboard") {
      router.push("/dashboard");
      return;
    }
    if (key === "teams") {
      router.push("/dashboard/teams");
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const liveCount = matches.filter((m) => matchBroadcastStatus(m) === "live").length;

  const navItems = (
    <nav className="flex-1 space-y-1">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => handleNavAction(item.key)}
          className={
            item.key === "dashboard"
              ? "w-full flex items-center gap-3 px-3 py-2 bg-tertiary-container text-tertiary-fixed-dim font-bold rounded-lg transition-all active:scale-95 duration-150 text-left"
              : "w-full flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:bg-surface-container-high transition-all active:scale-95 duration-150 rounded-lg group text-left"
          }
        >
          <span className="material-symbols-outlined text-xl group-hover:text-primary">{item.icon}</span>
          <span className="font-body text-sm">{item.label}</span>
        </button>
      ))}
    </nav>
  );

  const sidebarFooter = (
    <div className="mt-auto pt-4 space-y-1 border-t border-outline-variant">
      <button
        type="button"
        onClick={handleLogout}
        className="w-full flex items-center gap-3 px-3 py-4 mt-2 text-left hover:bg-surface-container-high rounded-lg transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-surface-container-highest border border-outline-variant flex items-center justify-center">
          <span className="material-symbols-outlined text-base">person</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-bold text-on-surface">Operator</span>
          <span className="text-[10px] text-on-surface-variant uppercase">Sign out</span>
        </div>
      </button>
    </div>
  );

  return (
    <div className="bg-background text-on-background font-body selection:bg-primary/30 min-h-screen flex overflow-x-hidden">

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex flex-col h-screen w-64 fixed left-0 top-0 bg-surface-container-low border-r border-outline-variant p-4 space-y-2 z-50">
        <div className="mb-8 px-2">
          <h1 className="text-lg font-headline font-bold text-on-surface">MatchPulse Live</h1>
          <p className="text-[10px] text-tertiary font-medium uppercase tracking-widest">
            {liveCount > 0 ? `${liveCount} partido(s) en vivo` : "Signal: Optimal"}
          </p>
        </div>
        {navItems}
        {sidebarFooter}
      </aside>

      {/* MOBILE NAV OVERLAY */}
      {mobileNavOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileNavOpen(false)} />
          <aside className="relative w-64 bg-surface-container-low border-r border-outline-variant flex flex-col p-4 space-y-2 overflow-y-auto">
            <div className="mb-8 px-2">
              <h1 className="text-lg font-headline font-bold text-on-surface">MatchPulse Live</h1>
              <p className="text-[10px] text-tertiary font-medium uppercase tracking-widest">
                {liveCount > 0 ? `${liveCount} partido(s) en vivo` : "Signal: Optimal"}
              </p>
            </div>
            {navItems}
            {sidebarFooter}
          </aside>
        </div>
      )}

      {/* MAIN */}
      <main className="flex-1 lg:ml-64 lg:h-screen lg:overflow-hidden flex flex-col bg-background">

        {/* HEADER */}
        <header className="w-full top-0 sticky bg-background flex justify-between items-center px-4 md:px-6 py-2.5 border-b border-outline-variant z-40">
          <div className="flex items-center gap-3 md:gap-8">
            <button
              type="button"
              className="lg:hidden w-9 h-9 flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
              onClick={() => setMobileNavOpen(true)}
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <span className="text-xl font-headline font-black tracking-tighter text-on-background">
              MatchPulse Live
            </span>
            <nav className="hidden md:flex gap-6 text-sm tracking-tight">
              <span className="text-on-surface-variant">Dashboard</span>
              <span className="text-on-surface-variant">{matches.length} Proyectos</span>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {liveCount > 0 && (
              <div className="flex items-center gap-1.5 bg-tertiary-container/30 border border-tertiary/30 px-3 py-1.5 rounded-full">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-tertiary" />
                </span>
                <span className="text-[11px] font-bold text-tertiary uppercase tracking-wider">
                  {liveCount} En Vivo
                </span>
              </div>
            )}
            <Link
              href="/dashboard/new"
              className="flex items-center gap-1.5 bg-primary hover:bg-primary-container text-on-primary font-bold px-3 py-1.5 rounded-lg text-sm transition-colors"
            >
              <span className="material-symbols-outlined text-base">add_circle</span>
              <span className="hidden sm:inline">Nuevo Partido</span>
            </Link>
          </div>
        </header>

        {/* CONTENT */}
        <div className="flex-1 lg:overflow-y-auto p-4 lg:p-6 space-y-5 custom-scrollbar">

          {/* Status bar */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-4 text-xs text-on-surface-variant flex-wrap">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-tertiary">database</span>
                <span className="text-tertiary font-semibold">Conectado</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">signal_cellular_alt</span>
                {matches.length} partidos cargados
              </span>
            </div>
            <button
              onClick={load}
              disabled={loading}
              className="flex items-center gap-1.5 text-on-surface-variant hover:text-on-surface text-xs transition-colors disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-base ${loading ? "animate-spin" : ""}`}>
                refresh
              </span>
              Actualizar
            </button>
          </div>

          {/* Match grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((n) => <SkeletonCard key={n} />)}
            </div>
          ) : matches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
              <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center border border-outline-variant">
                <span className="material-symbols-outlined text-3xl text-on-surface-variant">sports_soccer</span>
              </div>
              <div className="space-y-1">
                <p className="text-on-surface font-semibold">Sin partidos todavía</p>
                <p className="text-sm text-on-surface-variant">
                  Crea tu primer partido para comenzar a retransmitir.
                </p>
              </div>
              <Link
                href="/dashboard/new"
                className="flex items-center gap-2 bg-primary text-on-primary font-bold px-5 py-2.5 rounded-lg text-sm"
              >
                <span className="material-symbols-outlined text-base">add_circle</span>
                Crear Primer Partido
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {matches.map((entry) => (
                <MatchCard key={entry._id} entry={entry} onOBS={setObsMatchId} onDelete={handleDeleteMatch} />
              ))}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <footer className="border-t border-outline-variant bg-surface-container-low px-4 lg:px-6 py-2.5">
          <div className="flex items-center justify-between gap-4 flex-wrap text-[11px] text-on-surface-variant">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-primary">sports_score</span>
                {matches.length} Partidos
              </span>
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-tertiary">sensors</span>
                {liveCount} En Vivo
              </span>
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">lock</span>
                {matches.filter((m) => matchBroadcastStatus(m) === "ended").length} Finalizados
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-tertiary" />
              </span>
              <span className="text-tertiary font-semibold uppercase tracking-wider">Sistema Operativo</span>
            </div>
          </div>
        </footer>
      </main>

      {/* OBS Modal */}
      {obsMatchId && <OBSModal matchId={obsMatchId} onClose={() => setObsMatchId(null)} />}

    </div>
  );
}
