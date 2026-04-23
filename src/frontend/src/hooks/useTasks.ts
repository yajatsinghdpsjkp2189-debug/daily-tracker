import { useCallback, useEffect, useState } from "react";

export interface Task {
  id: string;
  title: string;
  deadline: string; // YYYY-MM-DD
  note: string;
  completed: boolean;
  createdAt: number;
}

const STORAGE_KEY = "daily-tracker-tasks";

function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTasks(tasks: Task[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(loadTasks);

  useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);

  const addTask = useCallback(
    (data: { title: string; deadline: string; note: string }) => {
      const task: Task = {
        id: crypto.randomUUID(),
        title: data.title,
        deadline: data.deadline,
        note: data.note,
        completed: false,
        createdAt: Date.now(),
      };
      setTasks((prev) => [...prev, task]);
    },
    [],
  );

  const toggleTask = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    );
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { tasks, addTask, toggleTask, deleteTask };
}
