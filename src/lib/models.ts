export type AIModel = {
  id: string;
  name: string;
  description: string;
  supportsEdit: boolean;
  provider: "lovable" | "hf";
  badge?: string;
};

// Lovable AI Gateway models: no per-model limits, billed via workspace credits.
// HF models: use HF_TOKEN, subject to HF rate limits.
export const MODELS: AIModel[] = [
  {
    id: "google/gemini-3-pro-image",
    name: "Gemini 3 Pro",
    description: "Yuqori sifat, mukammal yuzlar",
    supportsEdit: true,
    provider: "lovable",
    badge: "Limitsiz",
  },
  {
    id: "google/gemini-3.1-flash-image",
    name: "Nano Banana 2",
    description: "Tez, pro darajadagi sifat",
    supportsEdit: true,
    provider: "lovable",
    badge: "Limitsiz",
  },
  {
    id: "google/gemini-2.5-flash-image",
    name: "Nano Banana",
    description: "Tez tahrirlash uchun ideal",
    supportsEdit: true,
    provider: "lovable",
    badge: "Limitsiz",
  },
  {
    id: "openai/gpt-image-2",
    name: "GPT Image 2",
    description: "OpenAI eng kuchli image modeli",
    supportsEdit: true,
    provider: "lovable",
    badge: "Limitsiz",
  },
  {
    id: "openai/gpt-image-1-mini",
    name: "GPT Image Mini",
    description: "Tejamkor, tez OpenAI",
    supportsEdit: true,
    provider: "lovable",
    badge: "Limitsiz",
  },
  {
    id: "black-forest-labs/FLUX.1-schnell",
    name: "FLUX Schnell",
    description: "Ultra tez badiiy rasm",
    supportsEdit: false,
    provider: "hf",
  },
  {
    id: "black-forest-labs/FLUX.1-dev",
    name: "FLUX Dev",
    description: "Fotorealistik detallar",
    supportsEdit: false,
    provider: "hf",
  },
  {
    id: "stabilityai/stable-diffusion-3.5-large",
    name: "SD 3.5 Large",
    description: "Boy kompozitsiya, art",
    supportsEdit: false,
    provider: "hf",
  },
];
