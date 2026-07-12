import { createFileRoute } from "@tanstack/react-router";
import { InferenceClient } from "@huggingface/inference";

export const Route = createFileRoute("/api/generate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = process.env.HF_TOKEN;
        if (!token) return new Response("Missing HF_TOKEN", { status: 500 });

        try {
          const { prompt, model, imageBase64, imageMime } = (await request.json()) as {
            prompt: string;
            model: string;
            imageBase64?: string;
            imageMime?: string;
          };
          if (!prompt || !model) return new Response("prompt & model required", { status: 400 });

          const hf = new InferenceClient(token);
          let blob: Blob;

          if (imageBase64) {
            // Image edit path
            const bin = Uint8Array.from(atob(imageBase64), (c) => c.charCodeAt(0));
            const inputBlob = new Blob([bin], { type: imageMime || "image/png" });
            blob = await hf.imageToImage({
              model,
              inputs: inputBlob,
              parameters: { prompt },
            });
          } else {
            blob = await hf.textToImage({
              model,
              inputs: prompt,
              parameters: { num_inference_steps: 30 },
            });
          }

          const buf = new Uint8Array(await blob.arrayBuffer());
          let binary = "";
          for (let i = 0; i < buf.length; i++) binary += String.fromCharCode(buf[i]);
          const b64 = btoa(binary);
          return Response.json({ image: `data:${blob.type || "image/png"};base64,${b64}` });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error("generate error:", msg);
          return new Response(msg, { status: 500 });
        }
      },
    },
  },
});
