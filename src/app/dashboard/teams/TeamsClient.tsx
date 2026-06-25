"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface RosterPlayer {
  number: number;
  name: string;
  position: string;
}

interface TeamEntry {
  _id: string;
  name: string;
  shortName: string;
  logoUrl?: string;
  colors: { primary: string; secondary: string };
  roster: RosterPlayer[];
  coach?: string;
}

function TeamLogo({ logoUrl, name, color }: { logoUrl?: string; name: string; color: string }) {
  if (logoUrl) {
    return (
      <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoUrl} alt={name} className="w-full h-full object-contain" />
      </div>
    );
  }
  return (
    <div
      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-lg flex-shrink-0"
      style={{ backgroundColor: color }}
    >
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

function TeamCard({
  team,
  onDelete,
}: {
  team: TeamEntry;
  onDelete: (id: string) => Promise<void>;
}) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    setDeleting(true);
    await onDelete(team._id);
  }

  return (
    <div
      className="glass-panel rounded-xl p-5 flex flex-col gap-4 hover:border-primary/40 transition-colors cursor-pointer"
      onClick={() => router.push(`/dashboard/teams/${team._id}`)}
    >
      <div className="flex items-center gap-3">
        <TeamLogo logoUrl={team.logoUrl} name={team.name} color={team.colors.primary} />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-on-surface truncate">{team.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] font-black tracking-widest text-on-surface-variant digital-font">
              {team.shortName}
            </span>
            <span
              className="h-3 w-3 rounded-full border border-outline-variant"
              style={{ backgroundColor: team.colors.primary }}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-on-surface-variant">
        <span className="material-symbols-outlined text-sm">group</span>
        <span>{team.roster.length} jugador{team.roster.length !== 1 ? "es" : ""}</span>
        {team.coach && (
          <>
            <span className="text-outline">·</span>
            <span className="material-symbols-outlined text-sm">sports</span>
            <span className="truncate">{team.coach}</span>
          </>
        )}
      </div>

      <div className="flex gap-2 pt-1 border-t border-outline-variant" onClick={(e) => e.stopPropagation()}>
        <Link
          href={`/dashboard/teams/${team._id}`}
          className="flex-1 flex items-center justify-center gap-1.5 bg-primary hover:bg-primary-container text-on-primary font-bold py-2 rounded-lg text-xs transition-colors"
        >
          <span className="material-symbols-outlined text-sm">edit</span>
          Editar Equipo
        </Link>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-colors border ${
            confirmDelete
              ? "border-error text-error hover:bg-error/10"
              : "border-outline-variant text-on-surface-variant hover:border-error hover:text-error"
          } disabled:opacity-50`}
        >
          <span className="material-symbols-outlined text-sm">
            {deleting ? "progress_activity" : confirmDelete ? "warning" : "delete"}
          </span>
          {confirmDelete ? "¿Seguro?" : ""}
        </button>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="glass-panel rounded-xl p-5 animate-pulse space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-surface-container-highest rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 bg-surface-container-highest rounded" />
          <div className="h-3 w-16 bg-surface-container-highest rounded" />
        </div>
      </div>
      <div className="h-4 w-24 bg-surface-container-highest rounded" />
      <div className="h-8 bg-surface-container-highest rounded-lg" />
    </div>
  );
}

const NAV_ITEMS = [
  { icon: "dashboard", label: "Dashboard", key: "dashboard" },
  { icon: "sports_score", label: "Match Control", key: "control" },
  { icon: "layers", label: "Overlay Manager", key: "overlay" },
  { icon: "rss_feed", label: "Data Streams", key: "streams" },
  { icon: "groups", label: "Team Database", key: "teams" },
];

export function TeamsClient() {
  const router = useRouter();
  const [teams, setTeams] = useState<TeamEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type?: "error" | "info" } | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/teams");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setTeams(data.teams ?? []);
    } catch {
      setTeams([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function showToast(msg: string, type: "error" | "info" = "info") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/teams/${id}`, { method: "DELETE" });
    if (res.ok) {
      setTeams((prev) => prev.filter((t) => t._id !== id));
      showToast("Equipo eliminado.");
    } else {
      const data = await res.json().catch(() => ({}));
      showToast(data.error ?? "No se pudo eliminar el equipo.", "error");
    }
  }

  function handleNavAction(key: string) {
    setMobileNavOpen(false);
    if (key === "dashboard") { router.push("/dashboard"); return; }
    if (key === "teams") { router.push("/dashboard/teams"); return; }
    if (key === "control" || key === "overlay" || key === "streams") {
      showToast("Navega desde el Dashboard para acceder a esa sección.");
      return;
    }
    showToast("Próximamente — esta sección está en desarrollo.");
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const filtered = search
    ? teams.filter(
        (t) =>
          t.name.toLowerCase().includes(search.toLowerCase()) ||
          t.shortName.toLowerCase().includes(search.toLowerCase())
      )
    : teams;

  const navItems = (
    <nav className="flex-1 space-y-1">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => handleNavAction(item.key)}
          className={
            item.key === "teams"
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
        onClick={() => showToast("System Health — próximamente.")}
        className="w-full flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:bg-surface-container-high transition-all rounded-lg group text-left"
      >
        <span className="material-symbols-outlined text-xl">memory</span>
        <span className="font-body text-sm">System Health</span>
      </button>
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
            {teams.length} equipos registrados
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
              <p className="text-[10px] text-tertiary font-medium uppercase tracking-widest">Team Database</p>
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
              Team Database
            </span>
            <nav className="hidden md:flex gap-6 text-sm tracking-tight">
              <span className="text-on-surface-variant">{teams.length} Equipos</span>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/teams/new"
              className="flex items-center gap-1.5 bg-primary hover:bg-primary-container text-on-primary font-bold px-3 py-1.5 rounded-lg text-sm transition-colors"
            >
              <span className="material-symbols-outlined text-base">add_circle</span>
              <span className="hidden sm:inline">Nuevo Equipo</span>
            </Link>
          </div>
        </header>

        {/* CONTENT */}
        <div className="flex-1 lg:overflow-y-auto p-4 lg:p-6 space-y-5 custom-scrollbar">

          {/* Search + refresh bar */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex-1 relative min-w-[200px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-sm text-on-surface-variant">
                search
              </span>
              <input
                type="search"
                placeholder="Buscar equipo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-surface-container-highest border border-outline-variant rounded-lg pl-9 pr-3 py-2 text-sm text-on-surface placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none"
              />
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

          {/* Teams grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((n) => <SkeletonCard key={n} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
              <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center border border-outline-variant">
                <span className="material-symbols-outlined text-3xl text-on-surface-variant">groups</span>
              </div>
              <div className="space-y-1">
                <p className="text-on-surface font-semibold">
                  {search ? "Sin resultados" : "Sin equipos todavía"}
                </p>
                <p className="text-sm text-on-surface-variant">
                  {search
                    ? `No hay equipos que coincidan con "${search}".`
                    : "Crea tu primer equipo para reutilizarlo en múltiples partidos."}
                </p>
              </div>
              {!search && (
                <Link
                  href="/dashboard/teams/new"
                  className="flex items-center gap-2 bg-primary text-on-primary font-bold px-5 py-2.5 rounded-lg text-sm"
                >
                  <span className="material-symbols-outlined text-base">add_circle</span>
                  Crear Primer Equipo
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((team) => (
                <TeamCard key={team._id} team={team} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <footer className="border-t border-outline-variant bg-surface-container-low px-4 lg:px-6 py-2.5">
          <div className="flex items-center justify-between gap-4 flex-wrap text-[11px] text-on-surface-variant">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-primary">groups</span>
                {teams.length} Equipos
              </span>
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-tertiary">person</span>
                {teams.reduce((acc, t) => acc + t.roster.length, 0)} Jugadores totales
              </span>
            </div>
            <Link href="/dashboard" className="flex items-center gap-1.5 hover:text-on-surface transition-colors">
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Volver al Dashboard
            </Link>
          </div>
        </footer>
      </main>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 border text-sm font-medium px-4 py-3 rounded-xl shadow-xl pointer-events-none ${
            toast.type === "error"
              ? "bg-error-container/20 border-error/30 text-error"
              : "bg-surface-container-highest border-outline-variant text-on-surface"
          }`}
        >
          <span className={`material-symbols-outlined text-base ${toast.type === "error" ? "text-error" : "text-primary"}`}>
            {toast.type === "error" ? "error" : "info"}
          </span>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
