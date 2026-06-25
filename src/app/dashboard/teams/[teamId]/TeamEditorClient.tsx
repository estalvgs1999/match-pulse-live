"use client";

import { useEffect, useState, useCallback, useRef, type ChangeEvent } from "react";
import Link from "next/link";
import { ImageCropModal } from "@/components/shared/ImageCropModal";

interface RosterPlayer {
  number: number;
  name: string;
  position: string;
  portraitUrl: string;
}

interface TeamData {
  _id: string;
  name: string;
  shortName: string;
  logoUrl: string;
  colors: { primary: string; secondary: string; accent: string };
  kit: { style: string; jerseyColor: string; numberColor: string };
  roster: RosterPlayer[];
  coach: string;
}

interface PlayerDraft {
  number: string;
  name: string;
  position: string;
  portraitUrl: string;
}

const EMPTY_PLAYER: PlayerDraft = { number: "", name: "", position: "", portraitUrl: "" };

const POSITIONS = ["Portero", "Cierre", "Ala", "Pivote", "Universal"];

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const inputClass =
  "w-full bg-surface-container-highest border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none";

function PlayerPortrait({ url, name, size = 36 }: { url: string; name: string; size?: number }) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="rounded-full bg-surface-container-highest border border-outline-variant flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size }}
    >
      <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: size * 0.5 }}>
        person
      </span>
    </div>
  );
}

export function TeamEditorClient({ teamId }: { teamId: string }) {
  const [team, setTeam] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const [notFound, setNotFound] = useState(false);

  // Local editable fields
  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [coach, setCoach] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#a78bfa");
  const [secondaryColor, setSecondaryColor] = useState("#ffffff");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoPreview, setLogoPreview] = useState("");
  const [roster, setRoster] = useState<RosterPlayer[]>([]);

  // Crop modal state
  const [logoCropSrc, setLogoCropSrc] = useState("");
  const [portraitCropSrc, setPortraitCropSrc] = useState("");
  const logoInputRef = useRef<HTMLInputElement>(null);
  const portraitInputRef = useRef<HTMLInputElement>(null);

  // Roster editing state
  const [mode, setMode] = useState<"list" | "add" | "edit">("list");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<PlayerDraft>(EMPTY_PLAYER);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/teams/${teamId}`);
      if (res.status === 404) { setNotFound(true); return; }
      if (!res.ok) throw new Error("Failed");
      const data: TeamData = await res.json();
      setTeam(data);
      setName(data.name);
      setShortName(data.shortName);
      setCoach(data.coach ?? "");
      setPrimaryColor(data.colors.primary);
      setSecondaryColor(data.colors.secondary);
      setLogoUrl(data.logoUrl ?? "");
      setLogoPreview(data.logoUrl ?? "");
      setRoster([...(data.roster ?? [])].sort((a, b) => a.number - b.number));
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => { load(); }, [load]);

  async function handleLogoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1_048_576) { setSaveStatus("error"); return; }
    const dataUrl = await fileToDataUrl(file);
    setLogoCropSrc(dataUrl);
  }

  function handleLogoCropConfirm(dataUrl: string) {
    setLogoUrl(dataUrl);
    setLogoPreview(dataUrl);
    setLogoCropSrc("");
    if (logoInputRef.current) logoInputRef.current.value = "";
  }

  function handleLogoCropCancel() {
    setLogoCropSrc("");
    if (logoInputRef.current) logoInputRef.current.value = "";
  }

  async function handlePortraitChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 512_000) { return; }
    const dataUrl = await fileToDataUrl(file);
    setPortraitCropSrc(dataUrl);
  }

  function handlePortraitCropConfirm(dataUrl: string) {
    setDraft((prev) => ({ ...prev, portraitUrl: dataUrl }));
    setPortraitCropSrc("");
    if (portraitInputRef.current) portraitInputRef.current.value = "";
  }

  function handlePortraitCropCancel() {
    setPortraitCropSrc("");
    if (portraitInputRef.current) portraitInputRef.current.value = "";
  }

  async function handleSave() {
    setSaving(true);
    setSaveStatus("idle");
    const res = await fetch(`/api/teams/${teamId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        shortName: shortName || name.toUpperCase().slice(0, 4),
        coach,
        logoUrl,
        colors: { primary: primaryColor, secondary: secondaryColor, accent: primaryColor },
        kit: { style: "solid", jerseyColor: primaryColor, numberColor: secondaryColor === "#ffffff" ? "#000000" : secondaryColor },
        roster,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } else {
      setSaveStatus("error");
    }
  }

  function startAdd() {
    setDraft(EMPTY_PLAYER);
    setMode("add");
    setEditingIndex(null);
  }

  function startEdit(index: number) {
    const p = roster[index];
    setDraft({
      number: String(p.number),
      name: p.name,
      position: p.position,
      portraitUrl: p.portraitUrl ?? "",
    });
    setEditingIndex(index);
    setMode("edit");
  }

  function cancelEdit() {
    setMode("list");
    setEditingIndex(null);
    setDraft(EMPTY_PLAYER);
  }

  function savePlayer() {
    const num = parseInt(draft.number, 10);
    if (isNaN(num) || num < 0 || num > 99) return;
    if (!draft.name.trim()) return;

    const player: RosterPlayer = {
      number: num,
      name: draft.name.trim(),
      position: draft.position.trim(),
      portraitUrl: draft.portraitUrl,
    };

    if (mode === "add") {
      const updated = [...roster, player].sort((a, b) => a.number - b.number);
      setRoster(updated);
    } else if (mode === "edit" && editingIndex !== null) {
      const updated = roster.map((p, i) => (i === editingIndex ? player : p));
      updated.sort((a, b) => a.number - b.number);
      setRoster(updated);
    }
    cancelEdit();
  }

  function removePlayer(index: number) {
    setRoster((prev) => prev.filter((_, i) => i !== index));
    if (mode === "edit" && editingIndex === index) cancelEdit();
  }

  if (loading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <span className="material-symbols-outlined text-4xl text-on-surface-variant animate-spin">
          progress_activity
        </span>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="bg-background min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-on-surface font-bold text-lg">Equipo no encontrado</p>
        <Link href="/dashboard/teams" className="text-primary hover:underline text-sm">
          Volver a equipos
        </Link>
      </div>
    );
  }

  const playerForm = (
    <div className="glass-panel rounded-xl p-4 space-y-4 border border-primary/30">
      <p className="text-xs font-bold uppercase tracking-widest text-primary">
        {mode === "add" ? "Añadir Jugador" : "Editar Jugador"}
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="space-y-1">
          <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
            # Dorsal
          </label>
          <input
            type="number"
            min={0}
            max={99}
            className={inputClass}
            placeholder="7"
            value={draft.number}
            onChange={(e) => setDraft((p) => ({ ...p, number: e.target.value }))}
          />
        </div>
        <div className="col-span-2 sm:col-span-2 space-y-1">
          <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
            Nombre
          </label>
          <input
            className={inputClass}
            placeholder="Nombre del jugador"
            value={draft.name}
            onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
          />
        </div>
        <div className="space-y-1">
          <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
            Posición
          </label>
          <select
            className={inputClass}
            value={draft.position}
            onChange={(e) => setDraft((p) => ({ ...p, position: e.target.value }))}
          >
            <option value="">— Pos —</option>
            {POSITIONS.map((pos) => (
              <option key={pos} value={pos}>{pos}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Portrait upload */}
      <div className="flex items-center gap-4">
        <label className="cursor-pointer group relative flex-shrink-0">
          <div className="w-14 h-14 rounded-full border border-dashed border-outline-variant group-hover:border-primary transition-colors overflow-hidden flex items-center justify-center bg-surface-container-highest">
            {draft.portraitUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={draft.portraitUrl} alt="Portrait" className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-on-surface-variant text-2xl">person_add</span>
            )}
          </div>
          {draft.portraitUrl && (
            <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-lg">edit</span>
            </div>
          )}
          <input
            ref={portraitInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handlePortraitChange}
          />
        </label>
        <div className="flex-1 text-[11px] text-on-surface-variant space-y-0.5">
          <p>Foto del jugador (opcional)</p>
          <p>Se muestra en lineups del overlay. Máx. 500 KB.</p>
          {draft.portraitUrl && (
            <button
              type="button"
              onClick={() => setDraft((p) => ({ ...p, portraitUrl: "" }))}
              className="text-error hover:underline"
            >
              Quitar foto
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={savePlayer}
          disabled={!draft.name.trim() || draft.number === ""}
          className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary-container text-on-primary font-bold py-2 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:pointer-events-none"
        >
          <span className="material-symbols-outlined text-base">check</span>
          {mode === "add" ? "Añadir" : "Guardar"}
        </button>
        <button
          type="button"
          onClick={cancelEdit}
          className="px-4 py-2 border border-outline-variant text-on-surface-variant hover:text-on-surface rounded-lg text-sm transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col font-body">
      {logoCropSrc && (
        <ImageCropModal
          src={logoCropSrc}
          title="Ajustar logo"
          cropShape="round"
          outputSize={400}
          outputFormat="png"
          onConfirm={handleLogoCropConfirm}
          onCancel={handleLogoCropCancel}
        />
      )}
      {portraitCropSrc && (
        <ImageCropModal
          src={portraitCropSrc}
          title="Recortar foto del jugador"
          cropShape="round"
          outputSize={300}
          outputFormat="jpeg"
          onConfirm={handlePortraitCropConfirm}
          onCancel={handlePortraitCropCancel}
        />
      )}

      {/* Header */}
      <header className="sticky top-0 z-30 bg-surface-container-low border-b border-outline-variant px-4 lg:px-6 py-3 flex items-center gap-4">
        <Link
          href="/dashboard/teams"
          className="flex items-center gap-1.5 text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined text-xl">arrow_back</span>
        </Link>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-on-primary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
              pulse_alert
            </span>
          </div>
          <span className="font-black tracking-tighter text-on-surface text-sm truncate">
            {team?.name ?? "Equipo"}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {saveStatus === "saved" && (
            <span className="flex items-center gap-1 text-xs text-tertiary font-medium">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              Guardado
            </span>
          )}
          {saveStatus === "error" && (
            <span className="flex items-center gap-1 text-xs text-error font-medium">
              <span className="material-symbols-outlined text-sm">error</span>
              Error
            </span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 bg-primary hover:bg-primary-container text-on-primary font-bold px-3 py-1.5 rounded-lg text-sm transition-colors disabled:opacity-70"
          >
            {saving ? (
              <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined text-sm">save</span>
            )}
            Guardar
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col items-center py-8 px-4">
        <div className="w-full max-w-2xl space-y-6">

          {/* Identity section */}
          <section className="glass-panel rounded-xl p-5 space-y-5">
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-primary text-lg">shield</span>
              <h2 className="font-bold text-on-surface text-sm uppercase tracking-wider">Identidad del Equipo</h2>
            </div>

            {/* Logo upload */}
            <div className="flex items-center gap-5">
              <label className="cursor-pointer group relative flex-shrink-0">
                <div
                  className="w-20 h-20 rounded-full border-2 border-dashed border-outline-variant group-hover:border-primary transition-colors flex items-center justify-center overflow-hidden"
                  style={{ backgroundColor: logoPreview ? "transparent" : primaryColor + "20" }}
                >
                  {logoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <span className="material-symbols-outlined text-2xl text-on-surface-variant group-hover:text-primary transition-colors">
                      add_photo_alternate
                    </span>
                  )}
                </div>
                {logoPreview && (
                  <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-xl">edit</span>
                  </div>
                )}
                <input ref={logoInputRef} type="file" accept="image/*" className="sr-only" onChange={handleLogoChange} />
              </label>
              <div className="flex-1 space-y-1">
                <p className="text-xs font-medium text-on-surface">Logo del equipo</p>
                <p className="text-[11px] text-on-surface-variant">PNG, SVG o JPG — máx. 1 MB</p>
                {logoPreview && (
                  <button
                    type="button"
                    onClick={() => { setLogoUrl(""); setLogoPreview(""); }}
                    className="text-[11px] text-error hover:underline"
                  >
                    Quitar logo
                  </button>
                )}
              </div>
            </div>

            {/* Name + shortName + coach */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  Nombre
                </label>
                <input
                  className={inputClass}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nombre del equipo"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  Código
                </label>
                <input
                  className={inputClass + " uppercase font-mono"}
                  value={shortName}
                  maxLength={4}
                  onChange={(e) => setShortName(e.target.value.toUpperCase())}
                  placeholder="TIT"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                Entrenador / Coach
              </label>
              <input
                className={inputClass}
                value={coach}
                onChange={(e) => setCoach(e.target.value)}
                placeholder="Nombre del entrenador (opcional)"
              />
            </div>

            {/* Colors */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  Color Principal
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    className="h-9 w-9 rounded-lg border border-outline-variant bg-surface-container-highest cursor-pointer p-0.5 flex-shrink-0"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                  />
                  <input
                    className={inputClass + " uppercase font-mono"}
                    value={primaryColor}
                    maxLength={7}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setPrimaryColor(v);
                    }}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  Color Secundario
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    className="h-9 w-9 rounded-lg border border-outline-variant bg-surface-container-highest cursor-pointer p-0.5 flex-shrink-0"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                  />
                  <input
                    className={inputClass + " uppercase font-mono"}
                    value={secondaryColor}
                    maxLength={7}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setSecondaryColor(v);
                    }}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Roster section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">group</span>
                <h2 className="font-bold text-on-surface text-sm uppercase tracking-wider">
                  Roster
                </h2>
                <span className="text-xs text-on-surface-variant bg-surface-container-highest px-2 py-0.5 rounded-full">
                  {roster.length} jugadores
                </span>
              </div>
              {mode === "list" && (
                <button
                  type="button"
                  onClick={startAdd}
                  className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors"
                >
                  <span className="material-symbols-outlined text-base">add_circle</span>
                  Añadir jugador
                </button>
              )}
            </div>

            {mode !== "list" && mode === "add" && playerForm}

            {roster.length === 0 && mode === "list" ? (
              <div className="glass-panel rounded-xl p-8 flex flex-col items-center gap-3 text-center">
                <span className="material-symbols-outlined text-3xl text-on-surface-variant">group_add</span>
                <p className="text-sm text-on-surface-variant">
                  Aún no hay jugadores en el roster. Añade el primero.
                </p>
                <button
                  type="button"
                  onClick={startAdd}
                  className="flex items-center gap-1.5 bg-primary text-on-primary font-bold px-4 py-2 rounded-lg text-sm"
                >
                  <span className="material-symbols-outlined text-base">add_circle</span>
                  Añadir jugador
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {roster.map((player, index) => (
                  <div key={`${player.number}-${player.name}`}>
                    {mode === "edit" && editingIndex === index ? (
                      playerForm
                    ) : (
                      <div className="glass-panel rounded-xl px-4 py-3 flex items-center gap-3 hover:border-outline transition-colors">
                        {/* Number badge */}
                        <span
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black digital-font flex-shrink-0 border"
                          style={{ backgroundColor: primaryColor + "20", borderColor: primaryColor + "60", color: primaryColor }}
                        >
                          {player.number}
                        </span>

                        {/* Portrait */}
                        <PlayerPortrait url={player.portraitUrl} name={player.name} />

                        {/* Name + position */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-on-surface truncate">{player.name}</p>
                          {player.position && (
                            <p className="text-[11px] text-on-surface-variant">{player.position}</p>
                          )}
                        </div>

                        {/* Actions */}
                        {mode === "list" && (
                          <div className="flex gap-1.5 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => startEdit(index)}
                              className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors"
                            >
                              <span className="material-symbols-outlined text-sm">edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => removePlayer(index)}
                              className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors"
                            >
                              <span className="material-symbols-outlined text-sm">delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Bottom save */}
          <div className="flex flex-col sm:flex-row gap-3 pb-8">
            <Link
              href="/dashboard/teams"
              className="flex-1 flex items-center justify-center gap-2 border border-outline-variant text-on-surface-variant hover:text-on-surface font-medium py-3 rounded-lg text-sm transition-colors"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              Volver a Equipos
            </Link>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary-container text-on-primary font-bold py-3 rounded-lg text-sm transition-colors disabled:opacity-70 shadow-[0_4px_12px_rgba(167,139,250,0.2)]"
            >
              {saving ? (
                <>
                  <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                  Guardando...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">save</span>
                  Guardar Cambios
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
