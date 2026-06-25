"use client";

import { useState, useRef, type FormEvent, type ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ImageCropModal } from "@/components/shared/ImageCropModal";

function autoShortName(name: string): string {
  const words = name.trim().toUpperCase().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 4);
  return words.slice(0, 3).map((w) => w[0]).join("").slice(0, 4);
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const inputClass =

  "w-full bg-surface-container-highest border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none";

export function NewTeamClient() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#a78bfa");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoPreview, setLogoPreview] = useState("");
  const [cropSrc, setCropSrc] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [error, setError] = useState("");
  const logoInputRef = useRef<HTMLInputElement>(null);

  function handleNameChange(v: string) {
    setName(v);
    if (!shortName || shortName === autoShortName(name)) {
      setShortName(autoShortName(v));
    }
  }

  async function handleLogoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1_048_576) {
      setError("El logo no puede superar 1 MB.");
      return;
    }
    const dataUrl = await fileToDataUrl(file);
    setCropSrc(dataUrl);
    setError("");
  }

  function handleCropConfirm(dataUrl: string) {
    setLogoUrl(dataUrl);
    setLogoPreview(dataUrl);
    setCropSrc("");
    if (logoInputRef.current) logoInputRef.current.value = "";
  }

  function handleCropCancel() {
    setCropSrc("");
    if (logoInputRef.current) logoInputRef.current.value = "";
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setStatus("submitting");
    setError("");

    const res = await fetch("/api/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        shortName: shortName || autoShortName(name),
        primaryColor,
        logoUrl,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setStatus("error");
      setError(data.error ?? "Error al crear el equipo. Inténtalo de nuevo.");
      return;
    }

    const { _id } = await res.json();
    router.push(`/dashboard/teams/${_id}`);
  }

  const displayShort = shortName || autoShortName(name) || "EQP";

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col font-body">
      {cropSrc && (
        <ImageCropModal
          src={cropSrc}
          title="Ajustar logo"
          cropShape="round"
          outputSize={400}
          outputFormat="png"
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
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
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-on-primary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
              pulse_alert
            </span>
          </div>
          <span className="font-black tracking-tighter text-on-surface text-sm">MatchPulse</span>
        </div>
        <div className="h-4 w-px bg-outline-variant mx-1" />
        <span className="text-sm font-semibold text-on-surface">Nuevo Equipo</span>
      </header>

      {/* Form */}
      <main className="flex-1 flex flex-col items-center py-8 px-4">
        <div className="w-full max-w-lg space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-black tracking-tighter text-on-surface">Crear Equipo</h1>
            <p className="text-sm text-on-surface-variant">
              Datos básicos del equipo. Podrás añadir el roster completo después.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Logo + identity */}
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
                      <div className="flex flex-col items-center gap-1">
                        <span className="material-symbols-outlined text-2xl text-on-surface-variant group-hover:text-primary transition-colors">
                          add_photo_alternate
                        </span>
                      </div>
                    )}
                  </div>
                  {logoPreview && (
                    <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="material-symbols-outlined text-white text-xl">edit</span>
                    </div>
                  )}
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={handleLogoChange}
                  />
                </label>
                <div className="flex-1 space-y-1">
                  <p className="text-xs font-medium text-on-surface">Logo del equipo</p>
                  <p className="text-[11px] text-on-surface-variant">
                    PNG, SVG o JPG — máx. 1 MB. Se mostrará en el overlay.
                  </p>
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

              {/* Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  Nombre del Equipo
                </label>
                <input
                  className={inputClass}
                  placeholder="Ej. Titan FC"
                  required
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                />
              </div>

              {/* Short name + color */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                    Código (3–4 letras)
                  </label>
                  <input
                    className={inputClass + " uppercase font-mono"}
                    placeholder="TIT"
                    maxLength={4}
                    value={shortName}
                    onChange={(e) => setShortName(e.target.value.toUpperCase())}
                  />
                  <p className="text-[11px] text-outline">Aparece en el marcador del overlay</p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                    Color Principal
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      className="h-10 w-10 rounded-lg border border-outline-variant bg-surface-container-highest cursor-pointer p-0.5 flex-shrink-0"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                    />
                    <input
                      className={inputClass + " uppercase font-mono"}
                      placeholder="#a78bfa"
                      value={primaryColor}
                      maxLength={7}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setPrimaryColor(v);
                      }}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Preview */}
            <section className="glass-panel rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-primary text-lg">preview</span>
                <h2 className="font-bold text-on-surface text-sm uppercase tracking-wider">Vista Previa</h2>
              </div>
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center border-2 overflow-hidden flex-shrink-0"
                  style={{ borderColor: primaryColor, backgroundColor: logoPreview ? "transparent" : primaryColor + "20" }}
                >
                  {logoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-xl font-black" style={{ color: primaryColor }}>
                      {displayShort.slice(0, 2)}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-black text-lg tracking-tight text-on-surface">{name || "Nombre del Equipo"}</p>
                  <p className="text-xs digital-font font-black tracking-widest text-on-surface-variant">{displayShort}</p>
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                  <span className="h-4 w-4 rounded-full border border-outline-variant" style={{ backgroundColor: primaryColor }} />
                  <span className="text-xs font-mono text-on-surface-variant">{primaryColor}</span>
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
                href="/dashboard/teams"
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
                    <span className="material-symbols-outlined text-base">check_circle</span>
                    Crear y editar roster
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
