import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { MODELS } from "@/lib/models";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lumen AI — Rasm generatsiya va tahrirlash studiyasi" },
      {
        name: "description",
        content:
          "8 ta kuchli AI model bilan matndan rasm yarating yoki mavjud rasmni prompt orqali tahrirlang. Yuzlar mukammal, tarix saqlanadi.",
      },
    ],
  }),
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

const STORAGE_KEY = "lumen-history-v1";

function Studio() {
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState(MODELS[0].id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState<HistoryItem | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null); // data URL
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 50)));
    } catch {}
  }, [history]);

  const isEditMode = !!uploadedImage;
  const activeModels = useMemo(
    () => (isEditMode ? MODELS.filter((m) => m.supportsEdit) : MODELS),
    [isEditMode],
  );

  // Auto-switch to edit-capable model when user uploads an image
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
        body: JSON.stringify({ prompt, model, imageBase64, imageMime }),
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
    <div className="min-h-screen relative overflow-hidden" style={{ background: "var(--gradient-mesh), var(--color-background)" }}>
      {/* Header */}
      <header className="relative z-10 border-b border-border/40 backdrop-blur-xl bg-background/40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl font-black text-primary-foreground shadow-lg"
              style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
            >
              ✦
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Lumen AI</h1>
              <p className="text-xs text-muted-foreground">Rasm studiyasi · 8 model</p>
            </div>
          </div>
          <div className="text-xs text-muted-foreground hidden sm:block">
            {history.length} ta rasm tarixda
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8 grid lg:grid-cols-[1fr_320px] gap-6">
        {/* Left: canvas + composer */}
        <section className="space-y-6">
          {/* Canvas */}
          <div
            className="relative rounded-3xl border border-border/60 overflow-hidden aspect-square lg:aspect-[4/3] bg-card"
            style={{ boxShadow: "var(--shadow-card)" }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
          >
            {loading && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 backdrop-blur-md bg-background/60">
                <div
                  className="w-16 h-16 rounded-full animate-spin"
                  style={{
                    background: "conic-gradient(from 0deg, transparent, var(--color-primary))",
                    mask: "radial-gradient(circle, transparent 55%, black 56%)",
                  }}
                />
                <p className="text-sm text-muted-foreground">
                  {isEditMode ? "Rasm tahrirlanmoqda…" : "Yaratilmoqda…"}
                </p>
              </div>
            )}

            {current ? (
              <img src={current.image} alt={current.prompt} className="w-full h-full object-contain" />
            ) : uploadedImage ? (
              <img src={uploadedImage} alt="upload" className="w-full h-full object-contain opacity-90" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 gap-3">
                <div
                  className="w-20 h-20 rounded-3xl flex items-center justify-center text-3xl"
                  style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
                >
                  🎨
                </div>
                <h2 className="text-2xl font-bold">Nima chizamiz?</h2>
                <p className="text-sm text-muted-foreground max-w-md">
                  Prompt yozing yoki rasmni tashlang — biz uni tahrir qilamiz. Yuzlar mukammal, natija zo'r.
                </p>
              </div>
            )}

            {uploadedImage && (
              <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/80 backdrop-blur border border-border text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                Tahrir rejimi
                <button
                  onClick={() => setUploadedImage(null)}
                  className="ml-1 text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="rounded-xl border border-destructive/50 bg-destructive/10 text-destructive-foreground px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {/* Composer */}
          <div
            className="rounded-3xl border border-border/60 bg-card p-4 space-y-3"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="flex items-start gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="shrink-0 w-12 h-12 rounded-2xl border border-border bg-secondary hover:bg-accent hover:text-accent-foreground transition flex items-center justify-center text-xl"
                title="Rasm yuklash"
              >
                📎
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
                    ? "Rasmni qanday tahrir qilay? (masalan: fonni tunga o'zgartir)"
                    : "Rasmingizni tasvirlab bering… (Cmd/Ctrl + Enter)"
                }
                rows={2}
                className="flex-1 bg-transparent resize-none outline-none text-sm placeholder:text-muted-foreground leading-relaxed py-3"
              />
              <button
                onClick={generate}
                disabled={loading || !prompt.trim()}
                className="shrink-0 h-12 px-6 rounded-2xl font-semibold text-primary-foreground disabled:opacity-40 disabled:cursor-not-allowed transition hover:brightness-110"
                style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
              >
                {loading ? "…" : isEditMode ? "Tahrirlash" : "Yaratish"}
              </button>
            </div>
          </div>

          {/* Models */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Model tanlang
              </h3>
              {isEditMode && (
                <span className="text-xs text-accent">Faqat tahrirlaydiganlari ko'rsatilmoqda</span>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {activeModels.map((m) => {
                const active = m.id === model;
                return (
                  <button
                    key={m.id}
                    onClick={() => setModel(m.id)}
                    className={`text-left p-3 rounded-2xl border transition relative overflow-hidden ${
                      active
                        ? "border-primary bg-primary/10"
                        : "border-border/60 bg-card hover:border-border"
                    }`}
                  >
                    {active && (
                      <div
                        className="absolute inset-0 opacity-20 pointer-events-none"
                        style={{ background: "var(--gradient-primary)" }}
                      />
                    )}
                    <div className="relative flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm">{m.name}</span>
                      {m.badge && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/20 text-accent font-medium">
                          {m.badge}
                        </span>
                      )}
                    </div>
                    <p className="relative text-xs text-muted-foreground leading-snug">
                      {m.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Right: history */}
        <aside
          className="rounded-3xl border border-border/60 bg-card p-4 h-fit lg:sticky lg:top-6"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Tarix</h3>
            {history.length > 0 && (
              <button
                onClick={() => {
                  if (confirm("Tarixni tozalaysizmi?")) setHistory([]);
                }}
                className="text-xs text-muted-foreground hover:text-destructive"
              >
                Tozalash
              </button>
            )}
          </div>
          {history.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              Hali rasmlar yo'q. Birinchisini yarating ✨
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2 max-h-[70vh] overflow-y-auto pr-1">
              {history.map((h) => (
                <button
                  key={h.id}
                  onClick={() => {
                    setCurrent(h);
                    setPrompt(h.prompt);
                    setModel(h.model);
                  }}
                  className={`group relative aspect-square rounded-xl overflow-hidden border transition ${
                    current?.id === h.id ? "border-primary" : "border-border/60 hover:border-border"
                  }`}
                >
                  <img src={h.image} alt={h.prompt} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/0 to-transparent opacity-0 group-hover:opacity-100 transition flex flex-col justify-end p-2">
                    <p className="text-[10px] line-clamp-2 text-left">{h.prompt}</p>
                  </div>
                  {h.mode === "edit" && (
                    <span className="absolute top-1 right-1 text-[9px] px-1.5 py-0.5 rounded-full bg-accent text-accent-foreground font-semibold">
                      Edit
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
          {activeModelMeta && (
            <div className="mt-4 pt-4 border-t border-border/60 text-xs">
              <div className="text-muted-foreground mb-1">Faol model</div>
              <div className="font-semibold">{activeModelMeta.name}</div>
              <div className="text-muted-foreground mt-0.5">{activeModelMeta.description}</div>
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}
