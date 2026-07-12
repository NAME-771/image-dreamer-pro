import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { MODELS } from "@/lib/models";

export const Route = createFileRoute("/")({
  component: Studio,
});

type HistoryItem = {
  id: string;
  prompt: string;
  model: string;
  image: string;
  createdAt: number;
  mode: "generate" | "edit";
};

const STORAGE_KEY = "liquid-history-v1";

function Studio() {
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState(MODELS[0].id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState<HistoryItem | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 60)));
    } catch {}
  }, [history]);

  const isEditMode = !!uploadedImage;
  const activeModels = useMemo(
    () => (isEditMode ? MODELS.filter((m) => m.supportsEdit) : MODELS),
    [isEditMode],
  );

  useEffect(() => {
    if (isEditMode && !MODELS.find((m) => m.id === model)?.supportsEdit) {
      const first = MODELS.find((m) => m.supportsEdit);
      if (first) setModel(first.id);
    }
  }, [isEditMode, model]);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setUploadedImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const generate = async () => {
    if (!prompt.trim()) return;
    const selected = MODELS.find((m) => m.id === model);
    if (!selected) return;
    setLoading(true);
    setError(null);
    try {
      let imageBase64: string | undefined;
      let imageMime: string | undefined;
      if (uploadedImage) {
        const [meta, data] = uploadedImage.split(",");
        imageBase64 = data;
        imageMime = meta.match(/data:(.*?);/)?.[1] || "image/png";
      }
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          model,
          provider: selected.provider,
          imageBase64,
          imageMime,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { image } = (await res.json()) as { image: string };
      const item: HistoryItem = {
        id: crypto.randomUUID(),
        prompt,
        model,
        image,
        createdAt: Date.now(),
        mode: isEditMode ? "edit" : "generate",
      };
      setCurrent(item);
      setHistory((h) => [item, ...h]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const activeModelMeta = MODELS.find((m) => m.id === model);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Ambient noise */}
      <div
        aria-hidden
        className="fixed inset-0 pointer-events-none opacity-40"
        style={{ background: "var(--grain)" }}
      />

      {/* Header */}
      <header className="relative z-10 border-b border-border">
        <div className="max-w-[1400px] mx-auto px-8 py-5 flex items-center justify-between">
          <div className="flex items-baseline gap-3">
            <span className="font-serif text-3xl italic tracking-tight">Liquid</span>
            <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              AI · Image Studio
            </span>
          </div>
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <span className="hidden md:inline">{history.length} works archived</span>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              Unlimited via gateway
            </span>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-[1400px] mx-auto px-8 py-10 grid lg:grid-cols-[1fr_340px] gap-8">
        {/* LEFT */}
        <section className="space-y-6 min-w-0">
          {/* Hero title */}
          <div className="flex items-end justify-between pb-2">
            <h1 className="font-serif text-5xl md:text-6xl leading-[0.95] tracking-tight text-balance">
              {isEditMode ? (
                <>
                  Refine what <em>exists</em>.
                </>
              ) : (
                <>
                  Compose an <em>image</em>.
                </>
              )}
            </h1>
            <div className="hidden md:block text-xs text-muted-foreground max-w-[220px] text-right leading-relaxed">
              {isEditMode
                ? "Rasm yuklandi. Prompt yozing va model uni tahrirlaydi."
                : "Prompt yozing. Yoki rasm tashlab tahrir rejimiga o'ting."}
            </div>
          </div>

          {/* Canvas */}
          <div
            className="relative rounded-md border border-border overflow-hidden aspect-[4/3] bg-card"
            style={{ boxShadow: "var(--shadow-panel)" }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
          >
            {loading && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-5 backdrop-blur-sm bg-background/70">
                <div className="flex items-center gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  {isEditMode ? "Refining" : "Rendering"}
                </p>
              </div>
            )}

            {current ? (
              <img
                src={current.image}
                alt={current.prompt}
                className="w-full h-full object-contain"
              />
            ) : uploadedImage ? (
              <img
                src={uploadedImage}
                alt="upload"
                className="w-full h-full object-contain opacity-90"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-10">
                <div className="font-serif text-8xl italic text-muted-foreground/30 select-none">
                  ⌘
                </div>
                <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
                  Empty canvas
                </p>
              </div>
            )}

            {uploadedImage && (
              <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-background/90 backdrop-blur border border-border text-[10px] uppercase tracking-[0.2em]">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                Edit mode
                <button
                  onClick={() => setUploadedImage(null)}
                  className="ml-2 text-muted-foreground hover:text-foreground"
                  aria-label="clear upload"
                >
                  ×
                </button>
              </div>
            )}

            {current && !loading && (
              <a
                href={current.image}
                download={`liquid-${current.id}.png`}
                className="absolute bottom-4 right-4 px-3 py-1.5 bg-background/90 backdrop-blur border border-border text-[10px] uppercase tracking-[0.2em] hover:bg-accent hover:text-accent-foreground transition"
              >
                Download
              </a>
            )}
          </div>

          {error && (
            <div className="border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Composer */}
          <div className="border border-border bg-card" style={{ boxShadow: "var(--shadow-soft)" }}>
            <div className="flex items-stretch">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="shrink-0 px-5 border-r border-border hover:bg-secondary transition text-muted-foreground hover:text-foreground"
                title="Rasm yuklash"
                aria-label="attach image"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 17.98 8.83l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                </svg>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) generate();
                }}
                placeholder={
                  isEditMode
                    ? "Describe the edit — e.g. change the background to a candlelit interior"
                    : "Describe your image — e.g. a portrait in the style of a Dutch old master"
                }
                rows={2}
                className="flex-1 bg-transparent resize-none outline-none text-sm placeholder:text-muted-foreground/70 leading-relaxed py-4 px-5"
              />
              <button
                onClick={generate}
                disabled={loading || !prompt.trim()}
                className="shrink-0 px-8 bg-accent text-accent-foreground font-medium text-sm uppercase tracking-[0.15em] disabled:opacity-30 disabled:cursor-not-allowed hover:brightness-110 transition"
              >
                {loading ? "…" : isEditMode ? "Refine" : "Render"}
              </button>
            </div>
            <div className="border-t border-border px-5 py-2.5 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <span>⌘/Ctrl + Enter</span>
              <span>{prompt.length} chars</span>
            </div>
          </div>

          {/* Models */}
          <div>
            <div className="flex items-baseline justify-between mb-4">
              <h3 className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                Engine
              </h3>
              {isEditMode && (
                <span className="text-[10px] uppercase tracking-[0.2em] text-accent">
                  Edit-capable only
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border">
              {activeModels.map((m) => {
                const active = m.id === model;
                return (
                  <button
                    key={m.id}
                    onClick={() => setModel(m.id)}
                    className={`text-left p-4 transition relative ${
                      active
                        ? "bg-accent/10 text-foreground"
                        : "bg-card hover:bg-secondary text-foreground/90"
                    }`}
                  >
                    {active && <span className="absolute top-0 left-0 right-0 h-px bg-accent" />}
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-serif text-lg">{m.name}</span>
                      {m.badge && (
                        <span className="text-[9px] uppercase tracking-[0.15em] text-accent">
                          {m.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-snug">
                      {m.description}
                    </p>
                    <p className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground/50 mt-2">
                      {m.provider === "lovable" ? "Gateway" : "Hugging Face"}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* RIGHT — Archive */}
        <aside className="border border-border bg-card h-fit lg:sticky lg:top-6" style={{ boxShadow: "var(--shadow-panel)" }}>
          <div className="border-b border-border px-5 py-4 flex items-center justify-between">
            <h3 className="font-serif text-xl">Archive</h3>
            {history.length > 0 && (
              <button
                onClick={() => {
                  if (confirm("Clear all?")) setHistory([]);
                }}
                className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-destructive"
              >
                Clear
              </button>
            )}
          </div>
          {history.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-16 px-6 font-serif italic">
              "Nothing yet. Begin."
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-px bg-border max-h-[75vh] overflow-y-auto">
              {history.map((h) => (
                <button
                  key={h.id}
                  onClick={() => {
                    setCurrent(h);
                    setPrompt(h.prompt);
                    setModel(h.model);
                  }}
                  className={`group relative aspect-square overflow-hidden bg-card transition ${
                    current?.id === h.id ? "ring-1 ring-accent ring-inset z-10" : ""
                  }`}
                >
                  <img
                    src={h.image}
                    alt={h.prompt}
                    className="w-full h-full object-cover transition group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent opacity-0 group-hover:opacity-100 transition flex flex-col justify-end p-2.5">
                    <p className="text-[10px] line-clamp-3 text-left text-foreground/90 leading-tight">
                      {h.prompt}
                    </p>
                  </div>
                  {h.mode === "edit" && (
                    <span className="absolute top-1.5 right-1.5 text-[8px] uppercase tracking-[0.15em] px-1.5 py-0.5 bg-background/80 text-accent backdrop-blur">
                      Edit
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
          {activeModelMeta && (
            <div className="border-t border-border px-5 py-4">
              <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-1">
                Active engine
              </div>
              <div className="font-serif text-lg">{activeModelMeta.name}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {activeModelMeta.description}
              </div>
            </div>
          )}
        </aside>
      </main>

      <footer className="relative z-10 border-t border-border mt-10">
        <div className="max-w-[1400px] mx-auto px-8 py-6 flex items-center justify-between text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          <span>© Liquid AI Studio</span>
          <span className="font-serif italic normal-case tracking-normal text-sm">
            "Details are not details. They make the design."
          </span>
        </div>
      </footer>
    </div>
  );
}
