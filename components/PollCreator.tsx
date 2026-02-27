"use client";

import { useState } from "react";

interface PollCreatorProps {
  onClose: () => void;
  onCreate: (question: string, options: string[]) => void;
}

export default function PollCreator({ onClose, onCreate }: PollCreatorProps) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [submitting, setSubmitting] = useState(false);

  function addOption() {
    if (options.length < 4) {
      setOptions([...options, ""]);
    }
  }

  function removeOption(index: number) {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  }

  function updateOption(index: number, value: string) {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  }

  async function handleSubmit() {
    const trimmedQ = question.trim();
    const trimmedOpts = options.map((o) => o.trim()).filter(Boolean);
    if (!trimmedQ || trimmedOpts.length < 2) return;

    setSubmitting(true);
    try {
      onCreate(trimmedQ, trimmedOpts);
    } catch {
      setSubmitting(false);
    }
  }

  const canSubmit = question.trim() && options.filter((o) => o.trim()).length >= 2;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-sm animate-fade-scale">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                <path d="M3 3h18" /><path d="M3 9h18" /><path d="M3 15h12" /><path d="M3 21h6" />
              </svg>
              <h2 className="text-base font-semibold font-heading">Create Poll</h2>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface text-muted hover:text-foreground transition-all active:scale-95">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <div className="p-4 space-y-4">
            {/* Question */}
            <div>
              <label className="text-xs font-medium text-muted mb-1 block">Question</label>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask a question..."
                maxLength={200}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
                autoFocus
              />
            </div>

            {/* Options */}
            <div>
              <label className="text-xs font-medium text-muted mb-1 block">Options</label>
              <div className="space-y-2">
                {options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full border-2 border-border shrink-0" />
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => updateOption(i, e.target.value)}
                      placeholder={`Option ${i + 1}`}
                      maxLength={100}
                      className="flex-1 px-3 py-1.5 bg-surface border border-border rounded-lg text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
                    />
                    {options.length > 2 && (
                      <button onClick={() => removeOption(i)} className="p-1 rounded text-muted hover:text-red-400 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {options.length < 4 && (
                <button onClick={addOption} className="flex items-center gap-1.5 mt-2 text-xs text-accent hover:text-accent/80 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Add option
                </button>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border">
            <button onClick={onClose} className="px-4 py-2 text-sm text-muted hover:text-foreground transition-colors rounded-lg">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              className="px-4 py-2 text-sm font-medium bg-accent text-background rounded-lg hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
            >
              {submitting ? "Creating..." : "Create Poll"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
