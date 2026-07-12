import { createFileRoute } from "@tanstack/react-router";
import { InferenceClient } from "@huggingface/inference";

type Body = {
  prompt: string;
  model: string;
  provider: "lovable" | "hf";
  imageBase64?: string;
  imageMime?: string;
};

async function callLovable(body: Body): Promise<string> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY missing");

  const isOpenAI = body.model.startsWith("openai/");
  let requestBody: Record<string, unknown>;

  if (isOpenAI) {
    // OpenAI image body shape
    requestBody = { model: body.model, prompt: body.prompt, n: 1 };
    // gpt-image models don't accept reference images via images.generations directly here;
    // pass through as prompt-only. Editing best via Gemini path.
  } else {
    // Gemini chat-shape (image_url block for edits)
    const content: unknown[] = [{ type: "text", text: body.prompt }];
    if (body.imageBase64) {
      content.push({
        type: "image_url",
        image_url: { url: `data:${body.imageMime || "image/png"};base64,${body.imageBase64}` },
      });
    }
    requestBody = {
      model: body.model,
      messages: [{ role: "user", content }],
      modalities: ["image", "text"],
    };
  }

  const res = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!res.ok) {
    const t = await res.text();
    if (res.status === 429) throw new Error("Juda ko'p so'rov. Biroz kuting.");
    if (res.status === 402) throw new Error("Kreditlar tugagan. Workspace billing sozlamalarini tekshiring.");
    throw new Error(`Gateway error: ${t.slice(0, 300)}`);
  }

  const data = (await res.json()) as { data?: Array<{ b64_json?: string }> };
  const b64 = data.data?.[0]?.b64_json;
  if (!b64) throw new Error("Rasm qaytmadi");
  return `data:image/png;base64,${b64}`;
}

async function callHF(body: Body): Promise<string> {
  const token = process.env.HF_TOKEN;
  if (!token) throw new Error("HF_TOKEN missing");
  const hf = new InferenceClient(token);

  let result: Blob | string;
  if (body.imageBase64) {
    const bin = Uint8Array.from(atob(body.imageBase64), (c) => c.charCodeAt(0));
    const inputBlob = new Blob([bin as BlobPart], { type: body.imageMime || "image/png" });
    result = await hf.imageToImage({
      model: body.model,
      inputs: inputBlob,
      parameters: { prompt: body.prompt },
    });
  } else {
    result = await hf.textToImage({
      model: body.model,
      inputs: body.prompt,
      parameters: { num_inference_steps: 30 },
    });
  }
  const blob = result as Blob;
  const buf = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  for (let i = 0; i < buf.length; i++) binary += String.fromCharCode(buf[i]);
  return `data:${blob.type || "image/png"};base64,${btoa(binary)}`;
}

export const Route = createFileRoute("/api/generate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as Body;
          if (!body.prompt || !body.model) return new Response("prompt & model required", { status: 400 });
          const image = body.provider === "lovable" ? await callLovable(body) : await callHF(body);
          return Response.json({ image });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error("generate error:", msg);
          return new Response(msg, { status: 500 });
        }
      },
    },
  },
});
