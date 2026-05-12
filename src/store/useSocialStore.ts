import { create } from "zustand";

export type ViewMode = "dashboard" | "tasks" | "monthly" | "calendar" | "categories" | "friends" | "projects" | "project-detail";

interface FriendUser {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
}

interface FriendRequestType {
  id: string;
  senderId: string;
  receiverId: string;
  status: string;
  sender?: FriendUser;
  receiver?: FriendUser;
  createdAt: string;
}

interface ProjectMember {
  id: string;
  userId: string;
  role: string;
  joinedAt: string;
  user: FriendUser;
}

interface ProjectType {
  id: string;
  name: string;
  description: string | null;
  color: string;
  ownerId: string;
  owner: FriendUser;
  members: ProjectMember[];
  _count?: { tasks: number };
  tasks?: any[];
  createdAt: string;
  updatedAt: string;
}

interface CommentType {
  id: string;
  content: string;
  taskId: string;
  userId: string;
  user: FriendUser;
  createdAt: string;
}

interface NotificationType {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  linkId: string | null;
  createdAt: string;
}

interface SocialStore {
  // Friends
  friends: FriendUser[];
  pendingRequests: FriendRequestType[];
  discoverUsers: FriendUser[];
  friendsLoading: boolean;
  fetchFriendsData: () => Promise<void>;
  sendFriendRequest: (receiverId: string) => Promise<boolean>;
  acceptFriendRequest: (requestId: string) => Promise<boolean>;
  rejectFriendRequest: (requestId: string) => Promise<boolean>;

  // Projects
  projects: ProjectType[];
  currentProject: ProjectType | null;
  projectsLoading: boolean;
  fetchProjects: () => Promise<void>;
  fetchProjectDetail: (id: string) => Promise<void>;
  createProject: (data: { name: string; description?: string; color?: string }) => Promise<ProjectType | null>;
  deleteProject: (id: string) => Promise<boolean>;
  addProjectMember: (projectId: string, userId: string, role?: string) => Promise<boolean>;
  removeProjectMember: (projectId: string, userId: string) => Promise<boolean>;

  // Project Tasks
  addProjectTask: (projectId: string, task: any) => Promise<any>;
  updateProjectTask: (taskId: string, updates: any) => Promise<any>;

  // Comments
  taskComments: CommentType[];
  fetchComments: (taskId: string) => Promise<void>;
  addComment: (taskId: string, content: string) => Promise<CommentType | null>;

  // Notifications
  notifications: NotificationType[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;

  // Navigation helper
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
}

export const useSocialStore = create<SocialStore>((set, get) => ({
  // Friends
  friends: [],
  pendingRequests: [],
  discoverUsers: [],
  friendsLoading: false,

  fetchFriendsData: async () => {
    set({ friendsLoading: true });
    try {
      const [listRes, usersRes] = await Promise.all([fetch("/api/friends/list"), fetch("/api/friends/users")]);
      if (listRes.ok) { const friends = await listRes.json(); set({ friends }); }
      if (usersRes.ok) { const data = await usersRes.json(); set({ discoverUsers: data.users || [], pendingRequests: data.pending || [] }); }
    } catch (e) { console.error(e); }
    set({ friendsLoading: false });
  },

  sendFriendRequest: async (receiverId) => {
    try {
      const res = await fetch("/api/friends/request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ receiverId }) });
      if (!res.ok) return false;
      await get().fetchFriendsData();
      return true;
    } catch { return false; }
  },

  acceptFriendRequest: async (requestId) => {
    try {
      const res = await fetch("/api/friends/accept", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ requestId }) });
      if (!res.ok) return false;
      await get().fetchFriendsData();
      await get().fetchNotifications();
      return true;
    } catch { return false; }
  },

  rejectFriendRequest: async (requestId) => {
    try {
      const res = await fetch("/api/friends/reject", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ requestId }) });
      if (!res.ok) return false;
      await get().fetchFriendsData();
      await get().fetchNotifications();
      return true;
    } catch { return false; }
  },

  // Projects
  projects: [],
  currentProject: null,
  projectsLoading: false,

  fetchProjects: async () => {
    set({ projectsLoading: true });
    try {
      const res = await fetch("/api/projects");
      if (res.ok) { const projects = await res.json(); set({ projects }); }
    } catch (e) { console.error(e); }
    set({ projectsLoading: false });
  },

  fetchProjectDetail: async (id) => {
    try {
      const res = await fetch(`/api/projects/${id}`);
      if (res.ok) { const currentProject = await res.json(); set({ currentProject }); }
    } catch (e) { console.error(e); }
  },

  createProject: async (data) => {
    try {
      const res = await fetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) return null;
      const project = await res.json();
      set((s) => ({ projects: [project, ...s.projects] }));
      return project;
    } catch { return null; }
  },

  deleteProject: async (id) => {
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (!res.ok) return false;
      set((s) => ({ projects: s.projects.filter((p) => p.id !== id), currentProject: s.currentProject?.id === id ? null : s.currentProject }));
      return true;
    } catch { return false; }
  },

  addProjectMember: async (projectId, userId, role) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/members`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ newUserId: userId, role }) });
      if (!res.ok) return false;
      await get().fetchProjectDetail(projectId);
      return true;
    } catch { return false; }
  },

  removeProjectMember: async (projectId, userId) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/members`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ removeUserId: userId }) });
      if (!res.ok) return false;
      await get().fetchProjectDetail(projectId);
      return true;
    } catch { return false; }
  },

  addProjectTask: async (projectId, task) => {
    try {
      const res = await fetch("/api/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...task, projectId }) });
      if (!res.ok) return null;
      await get().fetchProjectDetail(projectId);
      return await res.json();
    } catch { return null; }
  },

  updateProjectTask: async (taskId, updates) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updates) });
      if (!res.ok) return null;
      const updated = await res.json();
      const projectId = get().currentProject?.id;
      if (projectId) await get().fetchProjectDetail(projectId);
      return updated;
    } catch { return null; }
  },

  // Comments
  taskComments: [],

  fetchComments: async (taskId) => {
    try {
      const res = await fetch(`/api/comments?taskId=${taskId}`);
      if (res.ok) { const taskComments = await res.json(); set({ taskComments }); }
    } catch (e) { console.error(e); }
  },

  addComment: async (taskId, content) => {
    try {
      const res = await fetch("/api/comments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ taskId, content }) });
      if (!res.ok) return null;
      const comment = await res.json();
      set((s) => ({ taskComments: [...s.taskComments, comment] }));
      return comment;
    } catch { return null; }
  },

  // Notifications
  notifications: [],
  unreadCount: 0,

  fetchNotifications: async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) { const data = await res.json(); set({ notifications: data.notifications || [], unreadCount: data.unreadCount || 0 }); }
    } catch (e) { console.error(e); }
  },

  markNotificationRead: async (id) => {
    try {
      await fetch("/api/notifications", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      set((s) => ({ notifications: s.notifications.map((n) => n.id === id ? { ...n, read: true } : n), unreadCount: Math.max(0, s.unreadCount - 1) }));
    } catch (e) { console.error(e); }
  },

  markAllNotificationsRead: async () => {
    try {
      await fetch("/api/notifications", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ markAll: true }) });
      set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })), unreadCount: 0 }));
    } catch (e) { console.error(e); }
  },

  selectedProjectId: null,
  setSelectedProjectId: (id) => set({ selectedProjectId: id }),
}));
