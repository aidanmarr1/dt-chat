"use client";

import { useState, useEffect, useRef } from "react";
import { useSwipeToClose } from "@/lib/hooks/useSwipeToClose";
import { useToast } from "./Toast";
import type { TodoItem } from "@/lib/types";

interface TodoPanelProps {
  onClose: () => void;
  onTodoCountChange?: (count: number) => void;
}

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.max(0, Math.floor((now - then) / 1000));

  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 172800) return "yesterday";
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function TodoPanel({ onClose, onTodoCountChange }: TodoPanelProps) {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newText, setNewText] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCompleted, setShowCompleted] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("dt-todos-show-completed") !== "false";
    }
    return true;
  });
  const [animatingIds, setAnimatingIds] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const panelRef = useSwipeToClose(onClose);

  useEffect(() => {
    fetchTodos();
    inputRef.current?.focus();
  }, []);

  // Escape key to close
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Persist show completed preference
  useEffect(() => {
    localStorage.setItem("dt-todos-show-completed", String(showCompleted));
  }, [showCompleted]);

  // Notify parent of uncompleted count
  useEffect(() => {
    const uncompleted = todos.filter((t) => !t.completed).length;
    onTodoCountChange?.(uncompleted);
  }, [todos, onTodoCountChange]);

  async function fetchTodos() {
    try {
      const res = await fetch("/api/todos");
      if (res.ok) {
        const data = await res.json();
        setTodos(data.todos);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    const text = newText.trim();
    if (!text) return;

    const tempId = `temp-${Date.now()}`;
    const optimistic: TodoItem = {
      id: tempId,
      text,
      completed: false,
      completedByName: null,
      createdByName: "You",
      createdAt: new Date().toISOString(),
      completedAt: null,
      position: todos.length,
    };

    setTodos((prev) => [...prev, optimistic]);
    setNewText("");
    inputRef.current?.focus();
    toast("Task added");

    try {
      const res = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        const data = await res.json();
        setTodos((prev) => prev.map((t) => (t.id === tempId ? data.todo : t)));
      } else {
        setTodos((prev) => prev.filter((t) => t.id !== tempId));
      }
    } catch {
      setTodos((prev) => prev.filter((t) => t.id !== tempId));
    }
  }

  async function handleToggle(id: string) {
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;

    const newCompleted = !todo.completed;

    // Trigger checkbox animation
    setAnimatingIds((prev) => new Set(prev).add(id));
    setTimeout(() => setAnimatingIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    }), 300);

    setTodos((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, completed: newCompleted, completedByName: newCompleted ? "You" : null, completedAt: newCompleted ? new Date().toISOString() : null }
          : t
      )
    );

    toast(newCompleted ? "Task completed" : "Task uncompleted");

    try {
      const res = await fetch(`/api/todos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: newCompleted }),
      });
      if (!res.ok) {
        // Rollback
        setTodos((prev) =>
          prev.map((t) => (t.id === id ? todo : t))
        );
      }
    } catch {
      setTodos((prev) =>
        prev.map((t) => (t.id === id ? todo : t))
      );
    }
  }

  async function handleDelete(id: string) {
    const prev = todos;
    setTodos((t) => t.filter((item) => item.id !== id));
    toast("Task deleted");

    try {
      const res = await fetch(`/api/todos/${id}`, { method: "DELETE" });
      if (!res.ok) setTodos(prev);
    } catch {
      setTodos(prev);
    }
  }

  const uncompleted = todos.filter((t) => !t.completed);
  const completed = todos.filter((t) => t.completed);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div ref={panelRef} className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-background border-l border-border shadow-2xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
              <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
            <h2 className="text-base font-semibold font-heading">Shared To-Do List</h2>
            <span className="text-xs text-muted">({uncompleted.length} remaining)</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface text-muted hover:text-foreground transition-all active:scale-95">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Shared label */}
        <div className="px-4 py-2 bg-accent/5 border-b border-border flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent shrink-0">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <p className="text-[11px] text-muted">Visible to everyone -- tasks you add and complete are shared with the whole group.</p>
        </div>

        {/* Add input */}
        <div className="px-4 py-3 border-b border-border">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
              placeholder="Add a task..."
              className="flex-1 text-sm bg-surface border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
              maxLength={500}
            />
            <button
              onClick={handleAdd}
              disabled={!newText.trim()}
              className="px-3 py-2 text-sm font-medium rounded-lg bg-accent text-background disabled:opacity-40 hover:opacity-90 transition-opacity active:scale-95"
            >
              Add
            </button>
          </div>
        </div>

        {/* Todo list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : todos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-muted">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-40">
                <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
              <p className="text-sm">No tasks yet</p>
              <p className="text-xs text-muted/60">Add a shared task above -- everyone in the chat will see it</p>
            </div>
          ) : (
            <div>
              {/* Uncompleted */}
              <div className="divide-y divide-border">
                {uncompleted.map((todo, i) => (
                  <div
                    key={todo.id}
                    className="flex items-start gap-3 px-4 py-3 group hover:bg-surface/50 transition-colors animate-fade-in"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <button
                      onClick={() => handleToggle(todo.id)}
                      className={`mt-0.5 w-5 h-5 rounded-md border-2 border-border hover:border-accent transition-all shrink-0 flex items-center justify-center active:scale-90 ${animatingIds.has(todo.id) ? "animate-pop-in" : ""}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-foreground break-words">{todo.text}</p>
                      <p className="text-[10px] text-muted mt-0.5">
                        Added by {todo.createdByName}
                      </p>
                      <p className="text-[10px] text-muted/60">{relativeTime(todo.createdAt)}</p>
                    </div>
                    <button
                      onClick={() => handleDelete(todo.id)}
                      className="p-1 rounded hover:bg-red-500/10 text-muted hover:text-red-400 transition-all sm:opacity-0 sm:group-hover:opacity-100 shrink-0"
                      title="Delete"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>

              {/* Completed — only show toggle if there are completed items */}
              {completed.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowCompleted(!showCompleted)}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-muted hover:text-foreground transition-colors bg-surface/30"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`transition-transform ${showCompleted ? "rotate-90" : ""}`}
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                    Completed ({completed.length})
                  </button>
                  {showCompleted && (
                    <div className="divide-y divide-border">
                      {completed.map((todo, i) => (
                        <div
                          key={todo.id}
                          className="flex items-start gap-3 px-4 py-3 group hover:bg-surface/50 transition-colors animate-fade-in"
                          style={{ animationDelay: `${i * 50}ms` }}
                        >
                          <button
                            onClick={() => handleToggle(todo.id)}
                            className={`mt-0.5 w-5 h-5 rounded-md border-2 border-accent bg-accent/20 transition-all shrink-0 flex items-center justify-center active:scale-90 ${animatingIds.has(todo.id) ? "animate-pop-in" : ""}`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </button>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-muted line-through break-words">{todo.text}</p>
                            <p className="text-[10px] text-muted/60 mt-0.5">
                              Completed by {todo.completedByName || "someone"}
                            </p>
                            <p className="text-[10px] text-muted/60">{relativeTime(todo.createdAt)}</p>
                          </div>
                          <button
                            onClick={() => handleDelete(todo.id)}
                            className="p-1 rounded hover:bg-red-500/10 text-muted hover:text-red-400 transition-all sm:opacity-0 sm:group-hover:opacity-100 shrink-0"
                            title="Delete"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
