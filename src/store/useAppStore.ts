import { create } from "zustand";

export type ViewMode =
  | "dashboard"
  | "tasks"
  | "monthly"
  | "calendar"
  | "categories"
  | "friends"
  | "projects"
  | "project-detail"
  | "feed"
  | "messages"
  | "chat"
  | "videocalls"
  | "video-call-room";

// ──────────────────────────────────────────────
// Shared types
// ──────────────────────────────────────────────
interface User {
  id: string;
  username: string;
  name: string;
  avatar: string | null;
}

interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
  user: User;
}

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
  comments?: TaskComment[];
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  _count?: { tasks: number };
}

interface Friendship {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: string;
  requester?: User;
  addressee?: User;
  createdAt: string;
  updatedAt: string;
}

interface Friend extends User {
  friendshipId: string;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  ownerId: string;
  owner: User;
  myRole: string;
  members: ProjectMemberItem[];
  taskCount: number;
  createdAt: string;
  updatedAt: string;
}

interface ProjectMemberItem {
  id: string;
  projectId: string;
  userId: string;
  role: string;
  joinedAt: string;
  user: User;
}

interface ProjectTask {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  dueTime: string | null;
  tags: string;
  isRecurring: boolean;
  recurRule: string | null;
  completedAt: string | null;
  assigneeId: string | null;
  assignee: User | null;
  projectId: string;
  createdById: string;
  createdBy: User;
  createdAt: string;
  updatedAt: string;
}

interface PostLike {
  id: string;
  postId: string;
  userId: string;
  user: User;
  createdAt: string;
}

interface PostComment {
  id: string;
  postId: string;
  userId: string;
  user: User;
  content: string;
  createdAt: string;
}

interface Post {
  id: string;
  content: string;
  image: string | null;
  authorId: string;
  author: User;
  likes: PostLike[];
  comments: PostComment[];
  createdAt: string;
  updatedAt: string;
}

interface MessageItem {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  read: boolean;
  sender: User;
  createdAt: string;
}

interface Conversation {
  friend: Friend;
  lastMessage: {
    id: string;
    content: string;
    senderId: string;
    createdAt: string;
  } | null;
  unreadCount: number;
}

interface VideoCallParticipant {
  id: string;
  callId: string;
  userId: string;
  user: User;
  status: string; // invited | joined | declined
  joinedAt: string | null;
}

interface VideoCall {
  id: string;
  roomName: string;
  title: string;
  hostId: string;
  host: User;
  status: string; // scheduled | active | ended
  scheduledAt: string | null;
  endedAt: string | null;
  participants: VideoCallParticipant[];
  createdAt: string;
  updatedAt: string;
}

// ──────────────────────────────────────────────
// Store interface
// ──────────────────────────────────────────────
interface AppStore {
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  signup: (
    name: string,
    username: string,
    password: string,
  ) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;

  // Navigation
  currentView: ViewMode;
  setCurrentView: (view: ViewMode) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;

  // Tasks (personal)
  tasks: Task[];
  tasksLoading: boolean;
  fetchTasks: () => Promise<void>;
  addTask: (task: Partial<Task>) => Promise<Task | null>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<Task | null>;
  deleteTask: (id: string) => Promise<boolean>;
  fetchTaskComments: (taskId: string) => Promise<TaskComment[]>;
  addTaskComment: (
    taskId: string,
    content: string,
  ) => Promise<TaskComment | null>;

  // Categories
  categories: Category[];
  categoriesLoading: boolean;
  fetchCategories: () => Promise<void>;
  addCategory: (cat: Partial<Category>) => Promise<Category | null>;
  updateCategory: (
    id: string,
    updates: Partial<Category>,
  ) => Promise<Category | null>;
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

  // ─── Friends ────────────────────────────────
  friends: Friend[];
  pendingRequests: Friendship[];
  sentRequests: Friendship[];
  friendsLoading: boolean;
  fetchFriends: () => Promise<void>;
  fetchPendingRequests: () => Promise<void>;
  fetchSentRequests: () => Promise<void>;
  sendFriendRequest: (
    username: string,
  ) => Promise<{ ok: boolean; error?: string }>;
  acceptFriendRequest: (id: string) => Promise<boolean>;
  rejectFriendRequest: (id: string) => Promise<boolean>;
  removeFriend: (id: string) => Promise<boolean>;
  searchUsers: (
    query: string,
  ) => Promise<
    (User & { friendshipStatus: string; friendshipId: string | null })[]
  >;

  // ─── Projects ───────────────────────────────
  projects: Project[];
  projectsLoading: boolean;
  currentProject: Project | null;
  fetchProjects: () => Promise<void>;
  createProject: (data: {
    name: string;
    description?: string;
    color?: string;
    icon?: string;
  }) => Promise<Project | null>;
  updateProject: (
    id: string,
    updates: Partial<Project>,
  ) => Promise<Project | null>;
  deleteProject: (id: string) => Promise<boolean>;
  setCurrentProject: (project: Project | null) => void;
  fetchProjectDetail: (id: string) => Promise<Project | null>;
  inviteMember: (
    projectId: string,
    username: string,
    role?: string,
  ) => Promise<boolean>;
  removeMember: (projectId: string, memberId: string) => Promise<boolean>;
  updateMemberRole: (
    projectId: string,
    memberId: string,
    role: string,
  ) => Promise<boolean>;
  leaveProject: (projectId: string, memberId: string) => Promise<boolean>;

  // ─── Project Tasks ──────────────────────────
  projectTasks: ProjectTask[];
  projectTasksLoading: boolean;
  fetchProjectTasks: (projectId: string) => Promise<void>;
  addProjectTask: (
    projectId: string,
    data: Partial<ProjectTask>,
  ) => Promise<ProjectTask | null>;
  updateProjectTask: (
    projectId: string,
    taskId: string,
    updates: Partial<ProjectTask>,
  ) => Promise<ProjectTask | null>;
  deleteProjectTask: (projectId: string, taskId: string) => Promise<boolean>;

  // ─── Posts / Feed ───────────────────────────
  posts: Post[];
  postsLoading: boolean;
  fetchPosts: () => Promise<void>;
  createPost: (content: string, image?: string) => Promise<Post | null>;
  toggleLike: (postId: string) => Promise<boolean>;
  addComment: (postId: string, content: string) => Promise<PostComment | null>;

  // ─── Messages ───────────────────────────────
  conversations: Conversation[];
  conversationsLoading: boolean;
  currentChatFriend: User | null;
  chatMessages: MessageItem[];
  chatMessagesLoading: boolean;
  fetchConversations: () => Promise<void>;
  fetchChatMessages: (friendId: string) => Promise<void>;
  sendMessage: (
    friendId: string,
    content: string,
  ) => Promise<MessageItem | null>;
  setCurrentChatFriend: (friend: User | null) => void;

  // ─── Video Calls ────────────────────────────
  videoCalls: VideoCall[];
  videoCallsLoading: boolean;
  activeCall: VideoCall | null;
  fetchVideoCalls: () => Promise<void>;
  createVideoCall: (data: {
    title: string;
    scheduledAt?: string;
    participantIds: string[];
  }) => Promise<VideoCall | null>;
  joinVideoCall: (callId: string) => Promise<boolean>;
  endVideoCall: (callId: string) => Promise<boolean>;
  setActiveCall: (call: VideoCall | null) => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  // ═══════════ AUTH ═══════════
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
    set({
      user: null,
      isAuthenticated: false,
      tasks: [],
      categories: [],
      friends: [],
      projects: [],
      projectTasks: [],
      currentProject: null,
      posts: [],
      conversations: [],
      chatMessages: [],
      currentChatFriend: null,
      pendingRequests: [],
      sentRequests: [],
      videoCalls: [],
      activeCall: null,
    });
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

  // ═══════════ NAVIGATION ═══════════
  currentView: "dashboard",
  setCurrentView: (view) => set({ currentView: view }),
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  // ═══════════ TASKS (personal) ═══════════
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

  fetchTaskComments: async (taskId) => {
    try {
      const res = await fetch(`/api/comments?taskId=${taskId}`);
      if (!res.ok) return [];
      const comments = await res.json();

      set((s) => ({
        tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, comments } : t)),
      }));

      return comments;
    } catch {
      return [];
    }
  },

  addTaskComment: async (taskId, content) => {
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, content }),
      });
      if (!res.ok) return null;
      const newComment = await res.json();

      set((s) => ({
        tasks: s.tasks.map((t) => {
          if (t.id !== taskId) return t;
          const existingComments = t.comments || [];
          return { ...t, comments: [...existingComments, newComment] };
        }),
      }));

      return newComment;
    } catch {
      return null;
    }
  },

  // ═══════════ CATEGORIES ═══════════
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

  // ═══════════ FILTERS ═══════════
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

  // ═══════════ FRIENDS ═══════════
  friends: [],
  pendingRequests: [],
  sentRequests: [],
  friendsLoading: false,

  fetchFriends: async () => {
    try {
      const res = await fetch("/api/friends");
      if (res.ok) {
        const friends = await res.json();
        set({ friends });
      }
    } catch {}
  },

  fetchPendingRequests: async () => {
    try {
      const res = await fetch("/api/friends/requests");
      if (res.ok) {
        const pendingRequests = await res.json();
        set({ pendingRequests });
      }
    } catch {}
  },

  fetchSentRequests: async () => {
    try {
      const res = await fetch("/api/friends/requests/sent");
      if (res.ok) {
        const sentRequests = await res.json();
        set({ sentRequests });
      }
    } catch {}
  },

  sendFriendRequest: async (username) => {
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      if (!res.ok)
        return { ok: false, error: data.error ?? "Failed to send request" };
      get().fetchSentRequests();
      return { ok: true };
    } catch {
      return { ok: false, error: "Network error" };
    }
  },

  acceptFriendRequest: async (id) => {
    try {
      const res = await fetch(`/api/friends/${id}/accept`, { method: "PUT" });
      if (!res.ok) return false;
      get().fetchFriends();
      get().fetchPendingRequests();
      return true;
    } catch {
      return false;
    }
  },

  rejectFriendRequest: async (id) => {
    try {
      const res = await fetch(`/api/friends/${id}/reject`, { method: "PUT" });
      if (!res.ok) return false;
      get().fetchPendingRequests();
      return true;
    } catch {
      return false;
    }
  },

  removeFriend: async (id) => {
    try {
      const res = await fetch(`/api/friends/${id}`, { method: "DELETE" });
      if (!res.ok) return false;
      get().fetchFriends();
      return true;
    } catch {
      return false;
    }
  },

  searchUsers: async (query) => {
    try {
      const res = await fetch(
        `/api/users/search?q=${encodeURIComponent(query)}`,
      );
      if (res.ok) return await res.json();
      return [];
    } catch {
      return [];
    }
  },

  // ═══════════ PROJECTS ═══════════
  projects: [],
  projectsLoading: false,
  currentProject: null,

  fetchProjects: async () => {
    set({ projectsLoading: true });
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const projects = await res.json();
        set({ projects, projectsLoading: false });
      } else {
        set({ projectsLoading: false });
      }
    } catch {
      set({ projectsLoading: false });
    }
  },

  createProject: async (data) => {
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) return null;
      const project = await res.json();
      set((s) => ({ projects: [project, ...s.projects] }));
      return project;
    } catch {
      return null;
    }
  },

  updateProject: async (id, updates) => {
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) return null;
      const updated = await res.json();
      set((s) => ({
        projects: s.projects.map((p) => (p.id === id ? updated : p)),
        currentProject:
          s.currentProject?.id === id
            ? { ...updated, myRole: s.currentProject.myRole }
            : s.currentProject,
      }));
      return updated;
    } catch {
      return null;
    }
  },

  deleteProject: async (id) => {
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (!res.ok) return false;
      set((s) => ({
        projects: s.projects.filter((p) => p.id !== id),
        currentProject: s.currentProject?.id === id ? null : s.currentProject,
        projectTasks: s.currentProject?.id === id ? [] : s.projectTasks,
      }));
      return true;
    } catch {
      return false;
    }
  },

  setCurrentProject: (project) => set({ currentProject: project }),

  fetchProjectDetail: async (id) => {
    try {
      const res = await fetch(`/api/projects/${id}`);
      if (!res.ok) return null;
      const project = await res.json();
      set({ currentProject: project });
      return project;
    } catch {
      return null;
    }
  },

  inviteMember: async (projectId, username, role) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, role: role || "member" }),
      });
      if (!res.ok) return false;
      get().fetchProjectDetail(projectId);
      get().fetchProjects();
      return true;
    } catch {
      return false;
    }
  },

  removeMember: async (projectId, memberId) => {
    try {
      const res = await fetch(
        `/api/projects/${projectId}/members/${memberId}`,
        {
          method: "DELETE",
        },
      );
      if (!res.ok) return false;
      get().fetchProjectDetail(projectId);
      get().fetchProjects();
      return true;
    } catch {
      return false;
    }
  },

  updateMemberRole: async (projectId, memberId, role) => {
    try {
      const res = await fetch(
        `/api/projects/${projectId}/members/${memberId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role }),
        },
      );
      if (!res.ok) return false;
      get().fetchProjectDetail(projectId);
      return true;
    } catch {
      return false;
    }
  },

  leaveProject: async (projectId, memberId) => {
    try {
      const res = await fetch(
        `/api/projects/${projectId}/members/${memberId}`,
        {
          method: "DELETE",
        },
      );
      if (!res.ok) return false;
      set((s) => ({
        projects: s.projects.filter((p) => p.id !== projectId),
        currentProject:
          s.currentProject?.id === projectId ? null : s.currentProject,
        projectTasks: s.currentProject?.id === projectId ? [] : s.projectTasks,
      }));
      return true;
    } catch {
      return false;
    }
  },

  // ═══════════ PROJECT TASKS ═══════════
  projectTasks: [],
  projectTasksLoading: false,

  fetchProjectTasks: async (projectId) => {
    set({ projectTasksLoading: true });
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks`);
      if (res.ok) {
        const projectTasks = await res.json();
        set({ projectTasks, projectTasksLoading: false });
      } else {
        set({ projectTasksLoading: false });
      }
    } catch {
      set({ projectTasksLoading: false });
    }
  },

  addProjectTask: async (projectId, data) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) return null;
      const newTask = await res.json();
      set((s) => ({ projectTasks: [newTask, ...s.projectTasks] }));
      return newTask;
    } catch {
      return null;
    }
  },

  updateProjectTask: async (projectId, taskId, updates) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) return null;
      const updated = await res.json();
      set((s) => ({
        projectTasks: s.projectTasks.map((t) =>
          t.id === taskId ? updated : t,
        ),
      }));
      return updated;
    } catch {
      return null;
    }
  },

  deleteProjectTask: async (projectId, taskId) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
        method: "DELETE",
      });
      if (!res.ok) return false;
      set((s) => ({
        projectTasks: s.projectTasks.filter((t) => t.id !== taskId),
      }));
      return true;
    } catch {
      return false;
    }
  },

  // ═══════════ POSTS / FEED ═══════════
  posts: [],
  postsLoading: false,

  fetchPosts: async () => {
    set({ postsLoading: true });
    try {
      const res = await fetch("/api/posts");
      if (res.ok) {
        const posts = await res.json();
        set({ posts, postsLoading: false });
      } else {
        set({ postsLoading: false });
      }
    } catch {
      set({ postsLoading: false });
    }
  },

  createPost: async (content, image) => {
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, image }),
      });
      if (!res.ok) return null;
      const post = await res.json();
      set((s) => ({ posts: [post, ...s.posts] }));
      return post;
    } catch {
      return null;
    }
  },

  toggleLike: async (postId) => {
    try {
      const userId = get().user?.id;
      const res = await fetch(`/api/posts/${postId}/like`, { method: "POST" });
      if (!res.ok) return false;
      const data = await res.json();
      set((s) => ({
        posts: s.posts.map((p) => {
          if (p.id !== postId) return p;
          if (data.liked) {
            const alreadyLiked = p.likes.some((l) => l.userId === userId);
            if (alreadyLiked) return p;
            return {
              ...p,
              likes: [
                ...p.likes,
                {
                  id: `temp-${Date.now()}`,
                  postId,
                  userId: userId!,
                  user: get().user!,
                  createdAt: new Date().toISOString(),
                },
              ],
            };
          } else {
            return { ...p, likes: p.likes.filter((l) => l.userId !== userId) };
          }
        }),
      }));
      return true;
    } catch {
      return false;
    }
  },

  addComment: async (postId, content) => {
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) return null;
      const comment = await res.json();
      set((s) => ({
        posts: s.posts.map((p) => {
          if (p.id !== postId) return p;
          return { ...p, comments: [...p.comments, comment] };
        }),
      }));
      return comment;
    } catch {
      return null;
    }
  },

  // ═══════════ MESSAGES ═══════════
  conversations: [],
  conversationsLoading: false,
  currentChatFriend: null,
  chatMessages: [],
  chatMessagesLoading: false,

  fetchConversations: async () => {
    set({ conversationsLoading: true });
    try {
      const res = await fetch("/api/messages");
      if (res.ok) {
        const conversations = await res.json();
        set({ conversations, conversationsLoading: false });
      } else {
        set({ conversationsLoading: false });
      }
    } catch {
      set({ conversationsLoading: false });
    }
  },

  fetchChatMessages: async (friendId) => {
    set({ chatMessagesLoading: true });
    try {
      const res = await fetch(`/api/messages/${friendId}`);
      if (res.ok) {
        const chatMessages = await res.json();
        set({ chatMessages, chatMessagesLoading: false });
        get().fetchConversations();
      } else {
        set({ chatMessagesLoading: false });
      }
    } catch {
      set({ chatMessagesLoading: false });
    }
  },

  sendMessage: async (friendId, content) => {
    try {
      const res = await fetch(`/api/messages/${friendId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) return null;
      const message = await res.json();
      set((s) => ({ chatMessages: [...s.chatMessages, message] }));
      get().fetchConversations();
      return message;
    } catch {
      return null;
    }
  },

  setCurrentChatFriend: (friend) => set({ currentChatFriend: friend }),

  // ═══════════ VIDEO CALLS ═══════════
  videoCalls: [],
  videoCallsLoading: false,
  activeCall: null,

  fetchVideoCalls: async () => {
    set({ videoCallsLoading: true });
    try {
      const res = await fetch("/api/videocalls");
      if (res.ok) {
        const videoCalls = await res.json();
        set({ videoCalls, videoCallsLoading: false });
      } else {
        set({ videoCallsLoading: false });
      }
    } catch {
      set({ videoCallsLoading: false });
    }
  },

  createVideoCall: async (data) => {
    try {
      const res = await fetch("/api/videocalls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) return null;
      const call = await res.json();
      set((s) => ({ videoCalls: [call, ...s.videoCalls] }));
      return call;
    } catch {
      return null;
    }
  },

  joinVideoCall: async (callId) => {
    try {
      const res = await fetch(`/api/videocalls/${callId}/join`, {
        method: "PUT",
      });
      if (!res.ok) return false;
      get().fetchVideoCalls();
      return true;
    } catch {
      return false;
    }
  },

  endVideoCall: async (callId) => {
    try {
      const res = await fetch(`/api/videocalls/${callId}/end`, {
        method: "PUT",
      });
      if (!res.ok) return false;
      set({ activeCall: null });
      get().fetchVideoCalls();
      return true;
    } catch {
      return false;
    }
  },

  setActiveCall: (call) => set({ activeCall: call }),
}));
