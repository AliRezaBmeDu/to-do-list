import { create } from "zustand";

export type ViewMode = "dashboard" | "tasks" | "monthly" | "calendar" | "categories";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  dueTime: string | null;
  categoryId: string | null;
  category: { id: string; name: string; icon: string; color: string } | null;
  tags: string;
  isRecurring: boolean;
  recurRule: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  _count?: { tasks: number };
}

interface User {
  id: string;
  username: string;
  name: string;
  avatar: string | null;
}

interface AppStore {
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  signup: (name: string, username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;

  // Navigation
  currentView: ViewMode;
  setCurrentView: (view: ViewMode) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;

  // Tasks
  tasks: Task[];
  tasksLoading: boolean;
  fetchTasks: () => Promise<void>;
  addTask: (task: Partial<Task>) => Promise<Task | null>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<Task | null>;
  deleteTask: (id: string) => Promise<boolean>;

  // Categories
  categories: Category[];
  categoriesLoading: boolean;
  fetchCategories: () => Promise<void>;
  addCategory: (cat: Partial<Category>) => Promise<Category | null>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<Category | null>;
  deleteCategory: (id: string) => Promise<boolean>;

  // Filters
  filterStatus: string;
  filterPriority: string;
  filterCategoryId: string;
  searchQuery: string;
  setFilterStatus: (s: string) => void;
  setFilterPriority: (p: string) => void;
  setFilterCategoryId: (c: string) => void;
  setSearchQuery: (q: string) => void;

  // Selected date for calendar
  selectedDate: string | null;
  setSelectedDate: (d: string | null) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  // Auth
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (username, password) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) return false;
      const user = await res.json();
      set({ user, isAuthenticated: true });
      return true;
    } catch {
      return false;
    }
  },

  signup: async (name, username, password) => {
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, username, password }),
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, error: data.error ?? "Sign up failed" };
      set({ user: data, isAuthenticated: true });
      return { ok: true };
    } catch {
      return { ok: false, error: "Network error. Please try again." };
    }
  },

  logout: async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    set({ user: null, isAuthenticated: false, tasks: [], categories: [] });
  },

  checkAuth: async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) {
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }
      const user = await res.json();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  // Navigation
  currentView: "dashboard",
  setCurrentView: (view) => set({ currentView: view }),
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  // Tasks
  tasks: [],
  tasksLoading: false,

  fetchTasks: async () => {
    set({ tasksLoading: true });
    try {
      const res = await fetch("/api/tasks");
      if (res.ok) {
        const tasks = await res.json();
        set({ tasks, tasksLoading: false });
      } else {
        set({ tasksLoading: false });
      }
    } catch {
      set({ tasksLoading: false });
    }
  },

  addTask: async (task) => {
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(task),
      });
      if (!res.ok) return null;
      const newTask = await res.json();
      set((s) => ({ tasks: [newTask, ...s.tasks] }));
      return newTask;
    } catch {
      return null;
    }
  },

  updateTask: async (id, updates) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) return null;
      const updated = await res.json();
      set((s) => ({
        tasks: s.tasks.map((t) => (t.id === id ? updated : t)),
      }));
      return updated;
    } catch {
      return null;
    }
  },

  deleteTask: async (id) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (!res.ok) return false;
      set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
      return true;
    } catch {
      return false;
    }
  },

  // Categories
  categories: [],
  categoriesLoading: false,

  fetchCategories: async () => {
    set({ categoriesLoading: true });
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const categories = await res.json();
        set({ categories, categoriesLoading: false });
      } else {
        set({ categoriesLoading: false });
      }
    } catch {
      set({ categoriesLoading: false });
    }
  },

  addCategory: async (cat) => {
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cat),
      });
      if (!res.ok) return null;
      const newCat = await res.json();
      set((s) => ({ categories: [...s.categories, newCat] }));
      return newCat;
    } catch {
      return null;
    }
  },

  updateCategory: async (id, updates) => {
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) return null;
      const updated = await res.json();
      set((s) => ({
        categories: s.categories.map((c) => (c.id === id ? updated : c)),
      }));
      return updated;
    } catch {
      return null;
    }
  },

  deleteCategory: async (id) => {
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      if (!res.ok) return false;
      set((s) => ({ categories: s.categories.filter((c) => c.id !== id) }));
      return true;
    } catch {
      return false;
    }
  },

  // Filters
  filterStatus: "all",
  filterPriority: "all",
  filterCategoryId: "all",
  searchQuery: "",
  setFilterStatus: (s) => set({ filterStatus: s }),
  setFilterPriority: (p) => set({ filterPriority: p }),
  setFilterCategoryId: (c) => set({ filterCategoryId: c }),
  setSearchQuery: (q) => set({ searchQuery: q }),

  selectedDate: null,
  setSelectedDate: (d) => set({ selectedDate: d }),
}));
