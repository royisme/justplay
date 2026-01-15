export async function chatJSON(opts: {
  apiKey: string;
  baseUrl: string; // e.g. https://openrouter.ai/api/v1
  model: string; // e.g. openai/gpt-4o
  system: string;
  user: string;
}): Promise<any> {
  const res = await fetch(`${opts.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${opts.apiKey}`,
    },
    body: JSON.stringify({
      model: opts.model,
      messages: [
        { role: "system", content: opts.system },
        { role: "user", content: opts.user },
      ],
      temperature: 0.8,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) throw new Error(`LLM error: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as any;
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("LLM empty content");
  return JSON.parse(text);
}
