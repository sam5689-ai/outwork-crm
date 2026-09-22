type GeneratedJobPost = {
  title: string;
  description: string;
  requiredSkills: string[];
};

export function isGeminiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY);
}

export async function generateJobPost(input: {
  prompt: string;
  clientName?: string;
  industry?: string;
}): Promise<GeneratedJobPost> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini is not configured");

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const context = [
    input.clientName ? `Client: ${input.clientName}` : null,
    input.industry ? `Industry: ${input.industry}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `You are helping a staffing recruiter write a job posting.\n${context}\nRecruiter's rough description of the role: ${input.prompt}\n\nWrite a concise professional job title, a 2-4 sentence job description, and 4-8 required skills as short keywords.`,
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              title: { type: "STRING" },
              description: { type: "STRING" },
              requiredSkills: { type: "ARRAY", items: { type: "STRING" } },
            },
            required: ["title", "description", "requiredSkills"],
          },
        },
      }),
    }
  );

  if (!res.ok) {
    throw new Error(`Gemini request failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned no content");

  return JSON.parse(text) as GeneratedJobPost;
}
