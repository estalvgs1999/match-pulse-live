"use client";

import { useState, useEffect, type FormEvent, type ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface TeamListItem {
  _id: string;
  name: string;
  shortName: string;
  logoUrl?: string;
  colors: { primary: string };
}

interface TeamSlotNew {
  mode: "new";
  name: string;
  shortName: string;
  primaryColor: string;
}

interface TeamSlotExisting {
  mode: "existing";
  teamId: string;
  team: TeamListItem | null;
}

type TeamSlot = TeamSlotNew | TeamSlotExisting;

type OverlayTemplate = "classic" | "redesigned";

interface MatchForm {
  tournament: string;
  matchday: string;
  stadium: string;
  date: string;
  kickoff: string;
}

const INITIAL_FORM: MatchForm = {
  tournament: "",
  matchday: "",
  stadium: "",
  date: "",
  kickoff: "20:00",
};

function autoShortName(name: string): string {
  const words = name.trim().toUpperCase().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 4);
  return words.slice(0, 3).map((w) => w[0]).join("").slice(0, 4);
}

function FormField({
  label,
  id,
  children,
  hint,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant">
        {label}
      </label>
      {children}
      {hint && <p className="text-[11px] text-outline">{hint}</p>}
    </div>
  );
}

const inputClass =
  "w-full bg-surface-container-highest border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none";

function TeamLogo({ logoUrl, name, color, size = 28 }: { logoUrl?: string; name: string; color: string; size?: number }) {
  if (logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={logoUrl} alt={name} className="rounded-full object-contain flex-shrink-0" style={{ width: size, height: size }} />;
  }
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-black text-xs flex-shrink-0"
      style={{ width: size, height: size, backgroundColor: color }}
    >
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

function TeamSelector({
  slot,
  onChange,
  side,
  teams,
  loadingTeams,
}: {
  slot: TeamSlot;
  onChange: (slot: TeamSlot) => void;
  side: "homeTeam" | "awayTeam";
  teams: TeamListItem[];
  loadingTeams: boolean;
}) {
  const [search, setSearch] = useState("");
  const label = side === "homeTeam" ? "Equipo Local" : "Equipo Visitante";
  const icon = side === "homeTeam" ? "home" : "flight_land";
  const defaultColor = side === "homeTeam" ? "#a78bfa" : "#34d399";

  const filtered = search
    ? teams.filter(
        (t) =>
          t.name.toLowerCase().includes(search.toLowerCase()) ||
          t.shortName.toLowerCase().includes(search.toLowerCase())
      )
    : teams;

  function switchToNew() {
    onChange({ mode: "new", name: "", shortName: "", primaryColor: defaultColor });
    setSearch("");
  }

  function switchToExisting() {
    onChange({ mode: "existing", teamId: "", team: null });
  }

  function selectTeam(team: TeamListItem) {
    onChange({ mode: "existing", teamId: team._id, team });
  }

  function setNewField(key: "name" | "shortName" | "primaryColor", value: string) {
    if (slot.mode !== "new") return;
    const updated = { ...slot, [key]: value };
    if (key === "name" && slot.shortName === autoShortName(slot.name)) {
      updated.shortName = autoShortName(value);
    }
    onChange(updated as TeamSlotNew);
  }

  const accentColor = slot.mode === "existing" && slot.team
    ? slot.team.colors.primary
    : slot.mode === "new"
    ? slot.primaryColor
    : defaultColor;

  return (
    <section className="glass-panel rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-primary text-lg">{icon}</span>
        <h2 className="font-bold text-on-surface text-sm uppercase tracking-wider">{label}</h2>
        <span className="ml-auto h-4 w-4 rounded-full border border-outline-variant" style={{ backgroundColor: accentColor }} />
      </div>

      {/* Mode toggle */}
      <div className="flex rounded-lg border border-outline-variant overflow-hidden text-xs font-bold">
        <button
          type="button"
          onClick={switchToNew}
          className={`flex-1 py-2 transition-colors ${
            slot.mode === "new"
              ? "bg-primary text-on-primary"
              : "text-on-surface-variant hover:bg-surface-container-highest"
          }`}
        >
          <span className="material-symbols-outlined text-sm align-middle mr-1">add</span>
          Crear nuevo
        </button>
        <button
          type="button"
          onClick={switchToExisting}
          className={`flex-1 py-2 transition-colors border-l border-outline-variant ${
            slot.mode === "existing"
              ? "bg-primary text-on-primary"
              : "text-on-surface-variant hover:bg-surface-container-highest"
          }`}
        >
          <span className="material-symbols-outlined text-sm align-middle mr-1">database</span>
          Seleccionar
        </button>
      </div>

      {/* Create new inline form */}
      {slot.mode === "new" && (
        <div className="space-y-3">
          <FormField label="Nombre del Equipo" id={`${side}-name`}>
            <input
              id={`${side}-name`}
              className={inputClass}
              placeholder={side === "homeTeam" ? "Ej. Titan FC" : "Ej. Shadow United"}
              required
              value={slot.name}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setNewField("name", e.target.value)}
            />
          </FormField>

          <FormField label="Código (3–4 letras)" id={`${side}-short`} hint="Aparece en el marcador del overlay">
            <input
              id={`${side}-short`}
              className={inputClass}
              placeholder={side === "homeTeam" ? "TIT" : "SHU"}
              maxLength={4}
              value={slot.shortName}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setNewField("shortName", e.target.value.toUpperCase())}
            />
          </FormField>

          <FormField label="Color Principal" id={`${side}-color`} hint="Color del kit para el overlay">
            <div className="flex items-center gap-3">
              <input
                id={`${side}-color`}
                type="color"
                className="h-10 w-14 rounded-lg border border-outline-variant bg-surface-container-highest cursor-pointer p-0.5"
                value={slot.primaryColor}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setNewField("primaryColor", e.target.value)}
              />
              <input
                className={`${inputClass} uppercase font-mono`}
                placeholder={defaultColor}
                value={slot.primaryColor}
                maxLength={7}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  const v = e.target.value;
                  if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setNewField("primaryColor", v);
                }}
              />
            </div>
          </FormField>

          {teams.length > 0 && (
            <p className="text-[11px] text-on-surface-variant">
              También puedes{" "}
              <button type="button" onClick={switchToExisting} className="text-primary hover:underline">
                seleccionar un equipo existente
              </button>
              {" "}({teams.length} disponibles).
            </p>
          )}
        </div>
      )}

      {/* Select existing */}
      {slot.mode === "existing" && (
        <div className="space-y-3">
          {slot.team ? (
            <div className="flex items-center gap-3 p-3 rounded-lg border border-primary/50 bg-primary/5">
              <TeamLogo logoUrl={slot.team.logoUrl} name={slot.team.name} color={slot.team.colors.primary} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-on-surface truncate">{slot.team.name}</p>
                <p className="text-[11px] digital-font text-on-surface-variant">{slot.team.shortName}</p>
              </div>
              <button
                type="button"
                onClick={() => onChange({ mode: "existing", teamId: "", team: null })}
                className="text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>
          ) : (
            <>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-sm text-on-surface-variant">
                  search
                </span>
                <input
                  type="search"
                  placeholder="Buscar equipo..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-surface-container-highest border border-outline-variant rounded-lg pl-9 pr-3 py-2.5 text-sm text-on-surface placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none"
                />
              </div>

              {loadingTeams ? (
                <div className="flex items-center justify-center py-6">
                  <span className="material-symbols-outlined animate-spin text-on-surface-variant">progress_activity</span>
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-6 space-y-2">
                  <p className="text-sm text-on-surface-variant">
                    {search ? "Sin resultados." : "No hay equipos creados aún."}
                  </p>
                  <button type="button" onClick={switchToNew} className="text-xs text-primary hover:underline">
                    Crear equipo nuevo
                  </button>
                </div>
              ) : (
                <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                  {filtered.map((team) => (
                    <button
                      key={team._id}
                      type="button"
                      onClick={() => selectTeam(team)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-container-highest transition-colors text-left"
                    >
                      <TeamLogo logoUrl={team.logoUrl} name={team.name} color={team.colors.primary} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-on-surface truncate">{team.name}</p>
                      </div>
                      <span className="text-[11px] digital-font font-black text-on-surface-variant">{team.shortName}</span>
                      <span
                        className="h-3 w-3 rounded-full border border-outline-variant flex-shrink-0"
                        style={{ backgroundColor: team.colors.primary }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}

export function NewProjectClient() {
  const router = useRouter();
  const [form, setForm] = useState<MatchForm>(INITIAL_FORM);
  const [homeSlot, setHomeSlot] = useState<TeamSlot>({ mode: "new", name: "", shortName: "", primaryColor: "#a78bfa" });
  const [awaySlot, setAwaySlot] = useState<TeamSlot>({ mode: "new", name: "", shortName: "", primaryColor: "#34d399" });
  const [teams, setTeams] = useState<TeamListItem[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [overlayTemplate, setOverlayTemplate] = useState<OverlayTemplate>("redesigned");
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/teams")
      .then((r) => r.json())
      .then((d) => setTeams(d.teams ?? []))
      .catch(() => {})
      .finally(() => setLoadingTeams(false));
  }, []);

  function setField<K extends keyof MatchForm>(key: K, value: MatchForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function previewHome(): { shortName: string; name: string; color: string } {
    if (homeSlot.mode === "existing" && homeSlot.team) {
      return {
        shortName: homeSlot.team.shortName,
        name: homeSlot.team.name,
        color: homeSlot.team.colors.primary,
      };
    }
    if (homeSlot.mode === "new") {
      return {
        shortName: homeSlot.shortName || autoShortName(homeSlot.name) || "LOC",
        name: homeSlot.name || "Local",
        color: homeSlot.primaryColor,
      };
    }
    return { shortName: "LOC", name: "Local", color: "#a78bfa" };
  }

  function previewAway(): { shortName: string; name: string; color: string } {
    if (awaySlot.mode === "existing" && awaySlot.team) {
      return {
        shortName: awaySlot.team.shortName,
        name: awaySlot.team.name,
        color: awaySlot.team.colors.primary,
      };
    }
    if (awaySlot.mode === "new") {
      return {
        shortName: awaySlot.shortName || autoShortName(awaySlot.name) || "VIS",
        name: awaySlot.name || "Visitante",
        color: awaySlot.primaryColor,
      };
    }
    return { shortName: "VIS", name: "Visitante", color: "#34d399" };
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setError("");

    // Validate slot selections
    if (homeSlot.mode === "existing" && !homeSlot.teamId) {
      setStatus("error");
      setError("Selecciona o crea el equipo local.");
      return;
    }
    if (awaySlot.mode === "existing" && !awaySlot.teamId) {
      setStatus("error");
      setError("Selecciona o crea el equipo visitante.");
      return;
    }

    const dateStr = form.kickoff
      ? `${form.date}T${form.kickoff}:00`
      : `${form.date}T20:00:00`;

    const body: Record<string, unknown> = {
      tournament: form.tournament,
      matchday: form.matchday,
      stadium: form.stadium,
      date: dateStr,
      overlayTemplate,
    };

    if (homeSlot.mode === "existing") {
      body.homeTeamId = homeSlot.teamId;
    } else {
      body.homeTeam = {
        name: homeSlot.name,
        shortName: homeSlot.shortName || autoShortName(homeSlot.name),
        primaryColor: homeSlot.primaryColor,
      };
    }

    if (awaySlot.mode === "existing") {
      body.awayTeamId = awaySlot.teamId;
    } else {
      body.awayTeam = {
        name: awaySlot.name,
        shortName: awaySlot.shortName || autoShortName(awaySlot.name),
        primaryColor: awaySlot.primaryColor,
      };
    }

    const res = await fetch("/api/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setStatus("error");
      setError(data.error ?? "Error al crear el partido. Inténtalo de nuevo.");
      return;
    }

    const { _id } = await res.json();
    router.push(`/control/${_id}`);
  }

  const home = previewHome();
  const away = previewAway();

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col font-body">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-surface-container-low border-b border-outline-variant px-4 lg:px-6 py-3 flex items-center gap-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined text-xl">arrow_back</span>
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-on-primary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
              pulse_alert
            </span>
          </div>
          <span className="font-black tracking-tighter text-on-surface text-sm">MatchPulse</span>
        </div>
        <div className="h-4 w-px bg-outline-variant mx-1" />
        <span className="text-sm font-semibold text-on-surface">Nuevo Partido</span>
        {teams.length > 0 && (
          <Link
            href="/dashboard/teams"
            className="ml-auto text-xs text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">groups</span>
            <span className="hidden sm:inline">Gestionar equipos</span>
          </Link>
        )}
      </header>

      {/* Form */}
      <main className="flex-1 flex flex-col items-center py-8 px-4">
        <div className="w-full max-w-2xl space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-black tracking-tighter text-on-surface">Crear Nuevo Partido</h1>
            <p className="text-sm text-on-surface-variant">
              Configura los datos del partido y selecciona o crea los equipos.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Match details */}
            <section className="glass-panel rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-primary text-lg">info</span>
                <h2 className="font-bold text-on-surface text-sm uppercase tracking-wider">Datos del Partido</h2>
              </div>

              <FormField label="Torneo / Competición" id="tournament">
                <input
                  id="tournament"
                  className={inputClass}
                  placeholder="Ej. Liga Nacional Futsal 2026"
                  required
                  value={form.tournament}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setField("tournament", e.target.value)}
                />
              </FormField>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Jornada / Fase" id="matchday">
                  <input
                    id="matchday"
                    className={inputClass}
                    placeholder="Ej. Jornada 5 / Semifinal"
                    required
                    value={form.matchday}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setField("matchday", e.target.value)}
                  />
                </FormField>
                <FormField label="Estadio / Recinto" id="stadium">
                  <input
                    id="stadium"
                    className={inputClass}
                    placeholder="Ej. Polideportivo Norte"
                    required
                    value={form.stadium}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setField("stadium", e.target.value)}
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Fecha" id="date">
                  <input
                    id="date"
                    type="date"
                    className={inputClass}
                    required
                    value={form.date}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setField("date", e.target.value)}
                  />
                </FormField>
                <FormField label="Hora de Inicio" id="kickoff">
                  <input
                    id="kickoff"
                    type="time"
                    className={inputClass}
                    value={form.kickoff}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setField("kickoff", e.target.value)}
                  />
                </FormField>
              </div>
            </section>

            {/* Teams */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TeamSelector
                slot={homeSlot}
                onChange={setHomeSlot}
                side="homeTeam"
                teams={teams}
                loadingTeams={loadingTeams}
              />
              <TeamSelector
                slot={awaySlot}
                onChange={setAwaySlot}
                side="awayTeam"
                teams={teams}
                loadingTeams={loadingTeams}
              />
            </div>

            {/* Overlay template */}
            <section className="glass-panel rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">palette</span>
                <h2 className="font-bold text-on-surface text-sm uppercase tracking-wider">Plantilla de Overlay</h2>
              </div>
              <p className="text-xs text-on-surface-variant">
                Diseño visual que se usará en el overlay de transmisión para este partido.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(["redesigned", "classic"] as const).map((t) => {
                  const isSelected = overlayTemplate === t;
                  const meta = t === "redesigned"
                    ? {
                        label: "Rediseñado",
                        desc: "Paleta oscura unificada, anillos de color por equipo, tints adaptativos.",
                        icon: "auto_awesome",
                        preview: (
                          <div className="flex items-center justify-between mt-3 px-3 py-2 rounded-lg bg-[#0c120e] border border-white/10">
                            <div className="flex items-center gap-1.5">
                              <div className="w-5 h-5 rounded-full border-2" style={{ borderColor: home.color }} />
                              <span className="text-[10px] font-black text-white digital-font">{home.shortName}</span>
                            </div>
                            <div className="flex items-center gap-1 px-2 py-0.5 bg-white/10 rounded text-[11px] font-black text-white digital-font">
                              <span>0</span>
                              <span className="text-white/40 mx-0.5">–</span>
                              <span>0</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-black text-white digital-font">{away.shortName}</span>
                              <div className="w-5 h-5 rounded-full border-2" style={{ borderColor: away.color }} />
                            </div>
                          </div>
                        ),
                      }
                    : {
                        label: "Clásico",
                        desc: "Diseño original tipo broadcast, fondo verde oscuro, sin tints de color.",
                        icon: "tv",
                        preview: (
                          <div className="flex items-center justify-between mt-3 px-3 py-2 rounded-lg bg-[#1a2e1a] border border-white/10">
                            <div className="flex items-center gap-1.5">
                              <div className="w-5 h-5 rounded-full bg-white/20" />
                              <span className="text-[10px] font-black text-white digital-font">{home.shortName}</span>
                            </div>
                            <div className="flex items-center gap-1 px-2 py-0.5 bg-white/10 rounded text-[11px] font-black text-white digital-font">
                              <span>0</span>
                              <span className="text-white/40 mx-0.5">–</span>
                              <span>0</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-black text-white digital-font">{away.shortName}</span>
                              <div className="w-5 h-5 rounded-full bg-white/20" />
                            </div>
                          </div>
                        ),
                      };
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setOverlayTemplate(t)}
                      className={`text-left rounded-xl p-4 border-2 transition-all ${
                        isSelected
                          ? "border-primary bg-primary/10"
                          : "border-outline-variant hover:border-outline bg-surface-container"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="material-symbols-outlined text-base"
                          style={{ color: isSelected ? "var(--color-primary)" : "var(--color-on-surface-variant)" }}
                        >
                          {meta.icon}
                        </span>
                        <span className={`text-sm font-bold ${isSelected ? "text-primary" : "text-on-surface"}`}>
                          {meta.label}
                        </span>
                        {isSelected && (
                          <span className="ml-auto material-symbols-outlined text-primary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                            check_circle
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-on-surface-variant leading-relaxed">{meta.desc}</p>
                      {meta.preview}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Preview */}
            <section className="glass-panel rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-primary text-lg">preview</span>
                <h2 className="font-bold text-on-surface text-sm uppercase tracking-wider">Vista Previa</h2>
              </div>
              <div className="flex items-center justify-center gap-6">
                <div className="flex flex-col items-center gap-2">
                  <span className="h-8 w-8 rounded-full border-2 border-outline-variant" style={{ backgroundColor: home.color }} />
                  <span className="text-2xl font-black tracking-tighter text-on-surface digital-font">
                    {home.shortName.slice(0, 4)}
                  </span>
                  <span className="text-xs text-on-surface-variant truncate max-w-[100px] text-center">{home.name}</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-lg font-black text-outline digital-font">VS</span>
                  {form.tournament && (
                    <span className="text-[10px] text-on-surface-variant text-center max-w-[80px] line-clamp-2">
                      {form.tournament}
                    </span>
                  )}
                </div>
                <div className="flex flex-col items-center gap-2">
                  <span className="h-8 w-8 rounded-full border-2 border-outline-variant" style={{ backgroundColor: away.color }} />
                  <span className="text-2xl font-black tracking-tighter text-on-surface digital-font">
                    {away.shortName.slice(0, 4)}
                  </span>
                  <span className="text-xs text-on-surface-variant truncate max-w-[100px] text-center">{away.name}</span>
                </div>
              </div>
            </section>

            {error && (
              <div className="flex items-center gap-2 text-sm text-error bg-error-container/20 border border-error/30 rounded-lg px-4 py-3">
                <span className="material-symbols-outlined text-base">error</span>
                {error}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pb-8">
              <Link
                href="/dashboard"
                className="flex-1 flex items-center justify-center gap-2 border border-outline-variant text-on-surface-variant hover:text-on-surface font-medium py-3 rounded-lg text-sm transition-colors"
              >
                <span className="material-symbols-outlined text-base">arrow_back</span>
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={status === "submitting"}
                className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary-container text-on-primary font-bold py-3 rounded-lg text-sm transition-colors disabled:opacity-70 disabled:pointer-events-none shadow-[0_4px_12px_rgba(167,139,250,0.2)]"
              >
                {status === "submitting" ? (
                  <>
                    <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                    Creando...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">rocket_launch</span>
                    Crear Partido
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
