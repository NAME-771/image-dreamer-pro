export type AIModel = {
  id: string;
  name: string;
  description: string;
  supportsEdit: boolean;
  badge?: string;
};

export const MODELS: AIModel[] = [
  {
    id: "black-forest-labs/FLUX.1-schnell",
    name: "FLUX.1 Schnell",
    description: "Ultra tez, yuqori sifat",
    supportsEdit: false,
    badge: "Tez",
  },
  {
    id: "black-forest-labs/FLUX.1-dev",
    name: "FLUX.1 Dev",
    description: "Fotorealistik, mukammal yuzlar",
    supportsEdit: false,
    badge: "Pro",
  },
  {
    id: "black-forest-labs/FLUX.1-Kontext-dev",
    name: "FLUX Kontext",
    description: "Rasm tahrirlash uchun eng zo'r",
    supportsEdit: true,
    badge: "Edit",
  },
  {
    id: "Qwen/Qwen-Image",
    name: "Qwen Image",
    description: "Matn va yuzlarni aniq chizadi",
    supportsEdit: false,
  },
  {
    id: "Qwen/Qwen-Image-Edit",
    name: "Qwen Edit",
    description: "Aqlli rasm tahrirlash",
    supportsEdit: true,
    badge: "Edit",
  },
  {
    id: "stabilityai/stable-diffusion-3.5-large",
    name: "SD 3.5 Large",
    description: "Boy kompozitsiya, badiiy",
    supportsEdit: false,
  },
  {
    id: "stabilityai/stable-diffusion-xl-base-1.0",
    name: "SDXL",
    description: "Klassik yuqori sifat",
    supportsEdit: false,
  },
  {
    id: "HiDream-ai/HiDream-I1-Full",
    name: "HiDream I1",
    description: "Kinolarcha realistik",
    supportsEdit: false,
  },
];
