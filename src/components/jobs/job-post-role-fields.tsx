"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { FormField, Input, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export function JobPostRoleFields({
  clientName,
  industry,
  aiEnabled,
}: {
  clientName: string;
  industry: string | null;
  aiEnabled: boolean;
}) {
  const [prompt, setPrompt] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requiredSkills, setRequiredSkills] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    if (!prompt.trim() || generating) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/generate-job-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, clientName, industry }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI generation failed.");
      setTitle(data.title ?? "");
      setDescription(data.description ?? "");
      setRequiredSkills((data.requiredSkills ?? []).join(", "));
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI generation failed.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-4">
      {aiEnabled && (
        <div className="rounded-lg border border-dashed border-neutral-200 bg-neutral-50 p-3">
          <FormField label="Describe the role" htmlFor="ai-prompt">
            <div className="flex gap-2">
              <Input
                id="ai-prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. warehouse picker, 2nd shift, needs forklift experience"
                className="bg-white"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={handleGenerate}
                disabled={generating || !prompt.trim()}
                className="shrink-0"
              >
                <Sparkles className="h-4 w-4" />
                {generating ? "Generating…" : "Generate with AI"}
              </Button>
            </div>
          </FormField>
          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        </div>
      )}

      <FormField label="Job title" htmlFor="title">
        <Input
          id="title"
          name="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </FormField>
      <FormField label="Description" htmlFor="description">
        <Textarea
          id="description"
          name="description"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </FormField>
      <FormField label="Required skills" htmlFor="requiredSkills">
        <Input
          id="requiredSkills"
          name="requiredSkills"
          placeholder="Comma-separated, e.g. Forklift Certified, Inventory Systems"
          value={requiredSkills}
          onChange={(e) => setRequiredSkills(e.target.value)}
        />
      </FormField>
    </div>
  );
}
