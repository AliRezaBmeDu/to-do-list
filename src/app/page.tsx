"use client";

import React, { useEffect, useState, useMemo, useRef, useCallback, CSSProperties } from "react";
import { useAppStore, ViewMode } from "@/store/useAppStore";
import { format, isToday, isTomorrow, isYesterday, isSameMonth, parseISO, isValid, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, List, CalendarDays, Tags, LogOut, Plus, Search,
  ChevronLeft, ChevronRight, Clock, AlertTriangle, Flag,
  MoreHorizontal, Trash2, Edit3, Loader2,
  Sun, Moon, Menu, Code, Bug, Users, Briefcase, Heart, Activity,
  BookOpen, MessageCircle, Tag, TrendingUp, CheckCircle2, Circle,
  Timer, ArrowUpRight, ArrowDownRight, Sparkles, UserPlus,
  FolderKanban, ArrowLeft, Send, ThumbsUp, MessageSquare,
  Video, Phone, PhoneCall, CalendarPlus, X, Shield, Crown,
  Eye, Settings2, UserMinus, UserCheck, Rss,
  Folder, FolderOpen, FileText, File, Image as ImageIcon,
  ChevronDown, FolderPlus, FilePlus, GripVertical, CornerDownLeft
} from "lucide-react";
import { marked } from "marked";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  DragStartEvent, DragEndEvent, DragOverEvent, DragOverlay,
  useDraggable, useDroppable,
} from "@dnd-kit/core";
import {
  TreeNode, TreeJson,
  readTreeJson, writeTreeJson, ensureTreeJson, moveTreeNode,
  unchildTreeNode, unchildOnlySelf, addTreeNode, deleteTreeNode, renameTreeNode,
  getChildren, getDescendantIds,
  saveDirectoryHandle, loadDirectoryHandle, requestPermission, checkPermission,
} from "@/lib/fileSystem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { ThemeProvider as NextThemesProvider } from "next-themes";

const iconMap: Record<string, React.ElementType> = {
  code: Code, bug: Bug, users: Users, briefcase: Briefcase,
  heart: Heart, activity: Activity, "book-open": BookOpen,
  "message-circle": MessageCircle, tag: Tag,
};

const priorityConfig: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  urgent: { label: "Urgent", color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950/50", icon: AlertTriangle },
  high: { label: "High", color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-950/50", icon: ArrowUpRight },
  medium: { label: "Medium", color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-50 dark:bg-yellow-950/50", icon: Flag },
  low: { label: "Low", color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-950/50", icon: ArrowDownRight },
};

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  todo: { label: "To Do", color: "bg-slate-500", icon: Circle },
  "in-progress": { label: "In Progress", color: "bg-blue-500", icon: Timer },
  done: { label: "Done", color: "bg-emerald-500", icon: CheckCircle2 },
};

const roleBadge: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  owner: { label: "Owner", color: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300", icon: Crown },
  admin: { label: "Admin", color: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300", icon: Shield },
  member: { label: "Member", color: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300", icon: Users },
  viewer: { label: "Viewer", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300", icon: Eye },
};

/* ═══════════ SIGNUP PAGE ═══════════ */
function SignupPage({ onBack }: { onBack: () => void }) {
  const signup = useAppStore((s) => s.signup);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    if (password !== confirm) { setError("Passwords do not match"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (username.length < 3) { setError("Username must be at least 3 characters"); return; }
    setLoading(true);
    const result = await signup(name.trim(), username.trim(), password);
    if (!result.ok) setError(result.error ?? "Sign up failed");
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Card className="border-0 shadow-2xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg"><Sparkles className="w-8 h-8 text-white" /></div>
            <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
            <p className="text-muted-foreground text-sm mt-1">Join TaskFlow Pro</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2"><Label htmlFor="su-name">Full Name</Label><Input id="su-name" placeholder="Your display name" value={name} onChange={(e) => setName(e.target.value)} className="h-11" required /></div>
              <div className="space-y-2"><Label htmlFor="su-username">Username</Label><Input id="su-username" placeholder="At least 3 characters" value={username} onChange={(e) => setUsername(e.target.value)} className="h-11" required /></div>
              <div className="space-y-2"><Label htmlFor="su-password">Password</Label><Input id="su-password" type="password" placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11" required /></div>
              <div className="space-y-2"><Label htmlFor="su-confirm">Confirm Password</Label><Input id="su-confirm" type="password" placeholder="Repeat your password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="h-11" required /></div>
              {error && <p className="text-sm text-red-500 dark:text-red-400 text-center">{error}</p>}
              <Button type="submit" className="w-full h-11 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700" disabled={loading}>{loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Create Account</Button>
            </form>
            <div className="mt-4 text-center"><button type="button" onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground transition-colors">← Back to Sign In</button></div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

/* ═══════════ LOGIN PAGE ═══════════ */
function LoginPage() {
  const login = useAppStore((s) => s.login);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  if (showSignup) return <SignupPage onBack={() => setShowSignup(false)} />;

  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); setLoading(true); setError(""); const ok = await login(username, password); if (!ok) setError("Invalid username or password"); setLoading(false); };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Card className="border-0 shadow-2xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg"><Sparkles className="w-8 h-8 text-white" /></div>
            <CardTitle className="text-2xl font-bold">TaskFlow Pro</CardTitle>
            <p className="text-muted-foreground text-sm mt-1">Smart Todo for the Modern Professional</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2"><Label htmlFor="username">Username</Label><Input id="username" placeholder="Enter username" value={username} onChange={(e) => setUsername(e.target.value)} className="h-11" /></div>
              <div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" type="password" placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11" /></div>
              {error && <p className="text-sm text-red-500 dark:text-red-400 text-center">{error}</p>}
              <Button type="submit" className="w-full h-11 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700" disabled={loading}>{loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Sign In</Button>
              <Button type="button" variant="outline" className="w-full h-11" onClick={() => setShowSignup(true)}>Create an Account</Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

/* ═══════════ SIDEBAR NAV ═══════════ */
function SidebarNav({ onNavClose }: { onNavClose?: () => void }) {
  const { currentView, setCurrentView, user, logout, tasks, categories, pendingRequests, conversations, friends } = useAppStore();
  const { theme, setTheme } = useTheme();
  const navItems: { id: ViewMode; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "tasks", label: "Task List", icon: List },
    { id: "monthly", label: "Monthly View", icon: TrendingUp },
    { id: "calendar", label: "Calendar", icon: CalendarDays },
    { id: "categories", label: "Categories", icon: Tags },
    { id: "feed", label: "Feed", icon: Rss },
    { id: "friends", label: "Friends", icon: UserPlus, badge: pendingRequests.length || undefined },
    { id: "messages", label: "Messages", icon: MessageCircle, badge: conversations.reduce((a, c) => a + c.unreadCount, 0) || undefined },
    { id: "projects", label: "Projects", icon: FolderKanban },
    { id: "videocalls", label: "Video Calls", icon: Video },
  ];
  const pendingTasks = tasks.filter((t) => t.status !== "done").length;

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 pb-2">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-md"><Sparkles className="w-5 h-5 text-white" /></div>
          <div><h2 className="font-bold text-base">TaskFlow Pro</h2><p className="text-[10px] text-muted-foreground">{pendingTasks} tasks pending</p></div>
        </div>
      </div>
      <Separator />
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          const Icon = item.icon;
          return (
            <button key={item.id} onClick={() => { setCurrentView(item.id); onNavClose?.(); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${isActive ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md" : "hover:bg-accent text-muted-foreground hover:text-foreground"}`}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 text-left truncate">{item.label}</span>
              {item.badge && item.badge > 0 && <span className="bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{item.badge > 9 ? "9+" : item.badge}</span>}
            </button>
          );
        })}
      </nav>
      <Separator />
      <div className="p-2">
        <p className="px-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Categories</p>
        <ScrollArea className="max-h-32">
          <div className="space-y-0.5">
            {categories.map((cat) => {
              const count = tasks.filter((t) => t.categoryId === cat.id && t.status !== "done").length;
              return (
                <button key={cat.id} onClick={() => { useAppStore.getState().setFilterCategoryId(cat.id); setCurrentView("tasks"); onNavClose?.(); }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs hover:bg-accent transition-colors">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="truncate flex-1 text-left">{cat.name}</span>
                  {count > 0 && <span className="text-[10px] text-muted-foreground">{count}</span>}
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </div>
      <Separator />
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-bold">{user?.avatar || "?"}</div>
          <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{user?.name}</p><p className="text-[10px] text-muted-foreground">@{user?.username}</p></div>
        </div>
        <div className="flex items-center justify-between">
          <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
            {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />} {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>
          <button onClick={() => { logout(); }} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 transition-colors">
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════ TASK CARD ═══════════ */
function TaskCard({ task, onEdit, onToggleDone, onDelete }: { task: any; onEdit: () => void; onToggleDone: () => void; onDelete: () => void }) {
  const { setSelectedTask, setCurrentView } = useAppStore();
  const pCfg = priorityConfig[task.priority] || priorityConfig.medium;
  const sCfg = statusConfig[task.status] || statusConfig.todo;
  const PriorityIcon = pCfg.icon;
  const dueDateLabel = (() => { if (!task.dueDate) return null; const d = parseISO(task.dueDate); if (!isValid(d)) return task.dueDate; if (isToday(d)) return "Today"; if (isTomorrow(d)) return "Tomorrow"; if (isYesterday(d)) return "Yesterday"; return format(d, "MMM d, yyyy"); })();
  const isOverdue = task.dueDate && task.status !== "done" && parseISO(task.dueDate) < new Date(new Date().toDateString());

  const handleClick = () => {
    setSelectedTask(task);
    setCurrentView("task-detail");
  };

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
      onClick={handleClick}
      className={`group relative flex gap-3 p-3 rounded-xl border transition-all hover:shadow-md cursor-pointer ${task.status === "done" ? "opacity-60" : ""} ${isOverdue ? "border-red-200 dark:border-red-900" : "border-border"}`}>
      <button onClick={(e) => { e.stopPropagation(); onToggleDone(); }} className="mt-0.5 flex-shrink-0">{task.status === "done" ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Circle className="w-5 h-5 text-muted-foreground hover:text-emerald-500 transition-colors" />}</button>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4 className={`text-sm font-medium leading-snug ${task.status === "done" ? "line-through text-muted-foreground" : ""}`}>{task.title}</h4>
          <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" onClick={(e) => e.stopPropagation()}><MoreHorizontal className="w-3.5 h-3.5" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end"><DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}><Edit3 className="w-3.5 h-3.5 mr-2" /> Edit</DropdownMenuItem><DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-red-500"><Trash2 className="w-3.5 h-3.5 mr-2" /> Delete</DropdownMenuItem></DropdownMenuContent>
          </DropdownMenu>
        </div>
        {task.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{task.description}</p>}
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 h-5 ${pCfg.bg} ${pCfg.color} border-0`}><PriorityIcon className="w-2.5 h-2.5 mr-0.5" />{pCfg.label}</Badge>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 border-0"><div className={`w-1.5 h-1.5 rounded-full ${sCfg.color} mr-1`} />{sCfg.label}</Badge>
          {task.category && <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5" style={{ borderColor: task.category.color, color: task.category.color }}>{task.category.name}</Badge>}
          {task.source === "project" && task.projectName && <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 border-0 bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300"><FolderKanban className="w-2.5 h-2.5 mr-0.5" />{task.projectName}</Badge>}
          {task.folderName && <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 border-0 bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300"><Folder className="w-2.5 h-2.5 mr-0.5" />{task.folderName}</Badge>}
          {dueDateLabel && (<span className={`text-[10px] flex items-center gap-0.5 ${isOverdue ? "text-red-500 font-medium" : "text-muted-foreground"}`}><Clock className="w-2.5 h-2.5" />{dueDateLabel}{task.dueTime && ` ${task.dueTime}`}</span>)}
          {task.tags && task.tags.split(",").filter(Boolean).map((tag: string) => (<span key={tag} className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0 rounded">#{tag.trim()}</span>))}
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════ TASK FORM INNER ═══════════ */
function TaskFormInner({ editTask, categories, onSave, onCancel }: { editTask?: any; categories: any[]; onSave: (data: any) => Promise<void>; onCancel: () => void }) {
  const [title, setTitle] = useState(editTask?.title || "");
  const [description, setDescription] = useState(editTask?.description || "");
  const [status, setStatus] = useState(editTask?.status || "todo");
  const [priority, setPriority] = useState(editTask?.priority || "medium");
  const [dueDate, setDueDate] = useState(editTask?.dueDate || "");
  const [dueTime, setDueTime] = useState(editTask?.dueTime || "");
  const [categoryId, setCategoryId] = useState(editTask?.categoryId || "none");
  const [tags, setTags] = useState(editTask?.tags || "");
  const [isRecurring, setIsRecurring] = useState(editTask?.isRecurring || false);
  const [recurRule, setRecurRule] = useState(editTask?.recurRule || "");
  const [folderName, setFolderName] = useState(editTask?.folderName || "");
  const [saving, setSaving] = useState(false);
  const handleSave = async () => { if (!title.trim()) return; setSaving(true); await onSave({ title, description, status, priority, dueDate: dueDate || null, dueTime: dueTime || null, categoryId: categoryId === "none" ? null : categoryId || null, tags, isRecurring, recurRule: recurRule || null, folderName: folderName.trim() || null }); setSaving(false); };
  return (
    <div className="space-y-4 py-2">
      <div className="space-y-2"><Label>Title *</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs to be done?" className="h-10" /></div>
      <div className="space-y-2"><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add details..." rows={3} /></div>
      <div className="grid grid-cols-2 gap-3"><div className="space-y-2"><Label>Priority</Label><Select value={priority} onValueChange={setPriority}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="urgent">Urgent</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>Status</Label><Select value={status} onValueChange={setStatus}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todo">To Do</SelectItem><SelectItem value="in-progress">In Progress</SelectItem><SelectItem value="done">Done</SelectItem></SelectContent></Select></div></div>
      <div className="grid grid-cols-2 gap-3"><div className="space-y-2"><Label>Due Date</Label><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="h-10" /></div><div className="space-y-2"><Label>Time</Label><Input type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} className="h-10" /></div></div>
      <div className="space-y-2"><Label>Category</Label><Select value={categoryId} onValueChange={setCategoryId}><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger><SelectContent><SelectItem value="none">No Category</SelectItem>{categories.map((c) => (<SelectItem key={c.id} value={c.id}><div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />{c.name}</div></SelectItem>))}</SelectContent></Select></div>
      <div className="space-y-2"><Label>Tags (comma-separated)</Label><Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="e.g. backend, urgent, meeting" className="h-10" /></div>
      <div className="space-y-2"><Label>Local Folder Name</Label><Input value={folderName} onChange={(e) => setFolderName(e.target.value)} placeholder="e.g. my-project-src (for reference only)" className="h-10" /></div>
      <div className="flex items-center gap-3"><Switch checked={isRecurring} onCheckedChange={setIsRecurring} /><Label>Recurring Task</Label></div>
      {isRecurring && (<div className="space-y-2"><Label>Repeat</Label><Select value={recurRule} onValueChange={setRecurRule}><SelectTrigger><SelectValue placeholder="Select frequency" /></SelectTrigger><SelectContent><SelectItem value="daily">Daily</SelectItem><SelectItem value="weekly">Weekly</SelectItem><SelectItem value="monthly">Monthly</SelectItem></SelectContent></Select></div>)}
      <DialogFooter><Button variant="outline" onClick={onCancel}>Cancel</Button><Button onClick={handleSave} disabled={saving || !title.trim()} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">{saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null} {editTask ? "Update" : "Create"}</Button></DialogFooter>
    </div>
  );
}

/* ═══════════ TASK FORM DIALOG ═══════════ */
function TaskFormDialog({ open, onOpenChange, editTask }: { open: boolean; onOpenChange: (o: boolean) => void; editTask?: any }) {
  const { addTask, updateTask, categories } = useAppStore();
  const dialogKey = `${editTask?.id || "new"}-${open ? "open" : "closed"}`;
  const handleSave = async (data: any) => { if (editTask) { await updateTask(editTask.id, data); toast.success("Task updated"); } else { await addTask(data); toast.success("Task created"); } onOpenChange(false); };
  return (<Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{editTask ? "Edit Task" : "Create New Task"}</DialogTitle></DialogHeader>{open && <TaskFormInner key={dialogKey} editTask={editTask} categories={categories} onSave={handleSave} onCancel={() => onOpenChange(false)} />}</DialogContent></Dialog>);
}

/* ═══════════ CATEGORY FORM INNER ═══════════ */
function CategoryFormInner({ editCat, onSave, onCancel, onDelete }: { editCat?: any; onSave: (data: any) => Promise<void>; onCancel: () => void; onDelete: () => void }) {
  const [name, setName] = useState(editCat?.name || "");
  const [icon, setIcon] = useState(editCat?.icon || "tag");
  const [color, setColor] = useState(editCat?.color || "#6366f1");
  const [saving, setSaving] = useState(false);
  const iconOptions = ["tag", "code", "bug", "users", "briefcase", "heart", "activity", "book-open", "message-circle"];
  const colorOptions = ["#10b981", "#ef4444", "#8b5cf6", "#f59e0b", "#ec4899", "#06b6d4", "#3b82f6", "#f97316", "#6366f1"];
  const handleSave = async () => { if (!name.trim()) return; setSaving(true); await onSave({ name, icon, color }); setSaving(false); };
  return (
    <div className="space-y-4 py-2">
      <div className="space-y-2"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Category name" /></div>
      <div className="space-y-2"><Label>Icon</Label><div className="flex flex-wrap gap-2">{iconOptions.map((ic) => { const Ic = iconMap[ic] || Tag; return (<button key={ic} onClick={() => setIcon(ic)} className={`w-9 h-9 rounded-lg flex items-center justify-center border-2 transition-all ${icon === ic ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950" : "border-border hover:border-muted-foreground"}`}><Ic className="w-4 h-4" /></button>); })}</div></div>
      <div className="space-y-2"><Label>Color</Label><div className="flex flex-wrap gap-2">{colorOptions.map((c) => (<button key={c} onClick={() => setColor(c)} className={`w-8 h-8 rounded-full border-2 transition-all ${color === c ? "border-foreground scale-110" : "border-transparent hover:scale-105"}`} style={{ backgroundColor: c }} />))}</div></div>
      <DialogFooter className="flex justify-between">{editCat && <Button variant="destructive" size="sm" onClick={onDelete}><Trash2 className="w-3.5 h-3.5 mr-1" /> Delete</Button>}<div className="flex gap-2 ml-auto"><Button variant="outline" onClick={onCancel}>Cancel</Button><Button onClick={handleSave} disabled={saving || !name.trim()} className="bg-gradient-to-r from-emerald-600 to-teal-600">{saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null} {editCat ? "Update" : "Create"}</Button></div></DialogFooter>
    </div>
  );
}

/* ═══════════ CATEGORY FORM DIALOG ═══════════ */
function CategoryFormDialog({ open, onOpenChange, editCat }: { open: boolean; onOpenChange: (o: boolean) => void; editCat?: any }) {
  const { addCategory, updateCategory, deleteCategory } = useAppStore();
  const dialogKey = `${editCat?.id || "new"}-${open ? "open" : "closed"}`;
  const handleSave = async (data: any) => { if (editCat) { await updateCategory(editCat.id, data); toast.success("Category updated"); } else { await addCategory(data); toast.success("Category created"); } onOpenChange(false); };
  const handleDelete = async () => { if (!editCat) return; await deleteCategory(editCat.id); toast.success("Category deleted"); onOpenChange(false); };
  return (<Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>{editCat ? "Edit Category" : "New Category"}</DialogTitle></DialogHeader>{open && <CategoryFormInner key={dialogKey} editCat={editCat} onSave={handleSave} onCancel={() => onOpenChange(false)} onDelete={handleDelete} />}</DialogContent></Dialog>);
}

/* ═══════════ DASHBOARD VIEW ═══════════ */
function DashboardView() {
  const { tasks, categories, setCurrentView } = useAppStore();
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === "done").length;
  const inProgressTasks = tasks.filter((t) => t.status === "in-progress").length;
  const overdueTasks = tasks.filter((t) => t.dueDate && t.status !== "done" && parseISO(t.dueDate) < new Date(new Date().toDateString())).length;
  const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const todayTasks = tasks.filter((t) => t.dueDate && isToday(parseISO(t.dueDate)));
  const categoryStats = categories.map((cat) => ({ ...cat, count: tasks.filter((t) => t.categoryId === cat.id && t.status !== "done").length })).sort((a, b) => b.count - a.count);
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Good {new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 17 ? "Afternoon" : "Evening"}!</h1><p className="text-muted-foreground text-sm">Here&apos;s your productivity overview for today.</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[{ label: "Total Tasks", value: totalTasks, icon: List, color: "from-slate-500 to-slate-600" }, { label: "Completed", value: doneTasks, icon: CheckCircle2, color: "from-emerald-500 to-teal-600" }, { label: "In Progress", value: inProgressTasks, icon: Timer, color: "from-blue-500 to-cyan-600" }, { label: "Overdue", value: overdueTasks, icon: AlertTriangle, color: "from-red-500 to-rose-600" }].map((stat) => (
          <Card key={stat.label} className="border-0 shadow-sm hover:shadow-md transition-shadow"><CardContent className="p-4"><div className="flex items-center justify-between mb-2"><div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}><stat.icon className="w-4 h-4 text-white" /></div><span className="text-2xl font-bold">{stat.value}</span></div><p className="text-xs text-muted-foreground">{stat.label}</p></CardContent></Card>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card className="border-0 shadow-sm"><CardContent className="p-4"><div className="flex items-center justify-between mb-3"><h3 className="font-semibold text-sm">Completion Rate</h3><span className="text-lg font-bold text-emerald-600">{completionRate}%</span></div><Progress value={completionRate} className="h-2" /><div className="flex justify-between mt-2 text-[10px] text-muted-foreground"><span>{doneTasks} done</span><span>{totalTasks - doneTasks} remaining</span></div></CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-4"><h3 className="font-semibold text-sm mb-3">Priority Breakdown</h3><div className="space-y-2">{(["urgent", "high", "medium", "low"] as const).map((p) => { const cfg = priorityConfig[p]; const count = tasks.filter((t) => t.priority === p && t.status !== "done").length; const pct = totalTasks > 0 ? (count / totalTasks) * 100 : 0; return (<div key={p} className="flex items-center gap-2"><span className={`text-xs w-14 ${cfg.color} font-medium`}>{cfg.label}</span><div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden"><div className={`h-full rounded-full ${cfg.bg}`} style={{ width: `${pct}%` }} /></div><span className="text-[10px] text-muted-foreground w-6 text-right">{count}</span></div>); })}</div></CardContent></Card>
      </div>
      <Card className="border-0 shadow-sm"><CardHeader className="pb-2"><div className="flex items-center justify-between"><CardTitle className="text-sm">Today&apos;s Tasks ({todayTasks.length})</CardTitle><Button variant="ghost" size="sm" className="text-xs" onClick={() => setCurrentView("tasks")}>View All <ChevronRight className="w-3 h-3 ml-0.5" /></Button></div></CardHeader><CardContent>{todayTasks.length === 0 ? (<p className="text-sm text-muted-foreground text-center py-4">No tasks for today. Enjoy your free time!</p>) : (<div className="space-y-2">{todayTasks.slice(0, 5).map((task) => { const pCfg = priorityConfig[task.priority]; return (<div key={task.id} className="flex items-center gap-2 py-1.5"><div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: task.category?.color || task.source === "project" && task.projectColor || "#94a3b8" }} /><span className={`text-sm flex-1 ${task.status === "done" ? "line-through text-muted-foreground" : ""}`}>{task.title}</span>{task.source === "project" && task.projectName && <Badge variant="secondary" className="text-[8px] px-1 py-0 h-4 border-0 bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300"><FolderKanban className="w-2 h-2 mr-0.5" />{task.projectName}</Badge>}<Badge variant="secondary" className={`text-[9px] px-1.5 py-0 h-4 ${pCfg.bg} ${pCfg.color} border-0`}>{pCfg.label}</Badge></div>); })}</div>)}</CardContent></Card>
      <Card className="border-0 shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-sm">Categories</CardTitle></CardHeader><CardContent><div className="grid grid-cols-2 md:grid-cols-4 gap-2">{categoryStats.map((cat) => { const Icon = iconMap[cat.icon] || Tag; return (<button key={cat.id} onClick={() => { useAppStore.getState().setFilterCategoryId(cat.id); setCurrentView("tasks"); }} className="flex items-center gap-2 p-2.5 rounded-xl border hover:shadow-md transition-all text-left"><div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: cat.color + "20" }}><Icon className="w-4 h-4" style={{ color: cat.color }} /></div><div><p className="text-xs font-medium">{cat.name}</p><p className="text-[10px] text-muted-foreground">{cat.count} tasks</p></div></button>); })}</div></CardContent></Card>
    </div>
  );
}

/* ═══════════ TASK LIST VIEW ═══════════ */
function TaskListView() {
  const { tasks, filterStatus, filterPriority, filterCategoryId, searchQuery, setFilterStatus, setFilterPriority, setFilterCategoryId, setSearchQuery, updateTask, deleteTask, categories } = useAppStore();
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [filterSource, setFilterSource] = useState<string>("all");
  const filtered = useMemo(() => tasks.filter((t) => { if (filterSource === "personal" && t.source === "project") return false; if (filterSource === "project" && t.source !== "project") return false; if (filterStatus !== "all" && t.status !== filterStatus) return false; if (filterPriority !== "all" && t.priority !== filterPriority) return false; if (filterCategoryId !== "all" && t.categoryId !== filterCategoryId) return false; if (searchQuery) { const q = searchQuery.toLowerCase(); return t.title.toLowerCase().includes(q) || (t.description || "").toLowerCase().includes(q) || t.tags.toLowerCase().includes(q); } return true; }), [tasks, filterSource, filterStatus, filterPriority, filterCategoryId, searchQuery]);
  const grouped = useMemo(() => { const groups: Record<string, any[]> = {}; const noDate = "No Date"; filtered.forEach((t) => { const key = t.dueDate || noDate; if (!groups[key]) groups[key] = []; groups[key].push(t); }); return Object.entries(groups).sort(([a], [b]) => { if (a === noDate) return 1; if (b === noDate) return -1; return a.localeCompare(b); }); }, [filtered]);
  const formatDateLabel = (dateStr: string) => { if (dateStr === "No Date") return "No Due Date"; const d = parseISO(dateStr); if (!isValid(d)) return dateStr; if (isToday(d)) return "Today"; if (isTomorrow(d)) return "Tomorrow"; if (isYesterday(d)) return "Yesterday"; return format(d, "EEEE, MMM d, yyyy"); };
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"><div><h1 className="text-xl font-bold">Task List</h1><p className="text-sm text-muted-foreground">{filtered.length} tasks</p></div><Button onClick={() => { setEditingTask(undefined); setTaskDialogOpen(true); }} className="bg-gradient-to-r from-emerald-600 to-teal-600 gap-1.5"><Plus className="w-4 h-4" /> New Task</Button></div>
      <div className="flex flex-col sm:flex-row gap-2"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search tasks..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-9" /></div><div className="flex gap-2 flex-wrap"><Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger className="w-[120px] h-9 text-xs"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="todo">To Do</SelectItem><SelectItem value="in-progress">In Progress</SelectItem><SelectItem value="done">Done</SelectItem></SelectContent></Select><Select value={filterPriority} onValueChange={setFilterPriority}><SelectTrigger className="w-[120px] h-9 text-xs"><SelectValue placeholder="Priority" /></SelectTrigger><SelectContent><SelectItem value="all">All Priority</SelectItem><SelectItem value="urgent">Urgent</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="low">Low</SelectItem></SelectContent></Select><Select value={filterCategoryId} onValueChange={setFilterCategoryId}><SelectTrigger className="w-[130px] h-9 text-xs"><SelectValue placeholder="Category" /></SelectTrigger><SelectContent><SelectItem value="all">All Categories</SelectItem>{categories.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}</SelectContent></Select><Select value={filterSource} onValueChange={setFilterSource}><SelectTrigger className="w-[120px] h-9 text-xs"><SelectValue placeholder="Source" /></SelectTrigger><SelectContent><SelectItem value="all">All Tasks</SelectItem><SelectItem value="personal">Personal</SelectItem><SelectItem value="project">Project</SelectItem></SelectContent></Select></div></div>
      <ScrollArea className="h-[calc(100vh-320px)]"><AnimatePresence mode="popLayout">{grouped.length === 0 ? (<div className="text-center py-12"><p className="text-muted-foreground">No tasks found</p></div>) : (grouped.map(([dateStr, groupTasks]) => (<div key={dateStr} className="mb-5"><h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 sticky top-0 bg-background py-1 z-10">{formatDateLabel(dateStr)} <span className="text-muted-foreground/50">({groupTasks.length})</span></h3><div className="space-y-2">{groupTasks.map((task) => (<TaskCard key={task.id} task={task} onEdit={() => { setEditingTask(task); setTaskDialogOpen(true); }} onToggleDone={() => updateTask(task.id, { status: task.status === "done" ? "todo" : "done" })} onDelete={() => { deleteTask(task.id); toast.success("Task deleted"); }} />))}</div></div>)))}</AnimatePresence></ScrollArea>
      <TaskFormDialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen} editTask={editingTask} />
    </div>
  );
}

/* ═══════════ MONTHLY VIEW ═══════════ */
function MonthlyView() {
  const { tasks } = useAppStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const monthLabel = format(currentMonth, "MMMM yyyy");
  const filtered = useMemo(() => tasks.filter((t) => { if (!t.dueDate) return false; const d = parseISO(t.dueDate); return isValid(d) && isSameMonth(d, currentMonth); }), [tasks, currentMonth]);
  const grouped = useMemo(() => { const map: Record<string, any[]> = {}; filtered.forEach((t) => { const key = t.dueDate!; if (!map[key]) map[key] = []; map[key].push(t); }); return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)); }, [filtered]);
  const totalMonth = filtered.length; const doneMonth = filtered.filter((t) => t.status === "done").length; const overdueMonth = filtered.filter((t) => t.status !== "done" && parseISO(t.dueDate!) < new Date(new Date().toDateString())).length;
  return (
    <div className="space-y-4">
      <div><h1 className="text-xl font-bold">Monthly View</h1><p className="text-sm text-muted-foreground">{monthLabel}</p></div>
      <div className="grid grid-cols-3 gap-3"><Card className="border-0 shadow-sm"><CardContent className="p-3 text-center"><p className="text-xl font-bold">{totalMonth}</p><p className="text-[10px] text-muted-foreground">Total</p></CardContent></Card><Card className="border-0 shadow-sm"><CardContent className="p-3 text-center"><p className="text-xl font-bold text-emerald-600">{doneMonth}</p><p className="text-[10px] text-muted-foreground">Completed</p></CardContent></Card><Card className="border-0 shadow-sm"><CardContent className="p-3 text-center"><p className="text-xl font-bold text-red-500">{overdueMonth}</p><p className="text-[10px] text-muted-foreground">Overdue</p></CardContent></Card></div>
      <div className="flex items-center justify-between"><Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeft className="w-4 h-4" /></Button><h2 className="font-semibold">{monthLabel}</h2><Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRight className="w-4 h-4" /></Button></div>
      <ScrollArea className="h-[calc(100vh-380px)]">{grouped.length === 0 ? (<div className="text-center py-12 text-muted-foreground"><p>No tasks this month</p></div>) : (grouped.map(([dateStr, dayTasks]) => { const d = parseISO(dateStr); const label = isToday(d) ? "Today" : isTomorrow(d) ? "Tomorrow" : format(d, "EEE, MMM d"); return (<div key={dateStr} className="mb-4"><div className="flex items-center gap-2 mb-2"><h3 className="text-xs font-semibold text-muted-foreground">{label}</h3><Separator className="flex-1" /></div><div className="space-y-1.5">{dayTasks.map((task) => (<div key={task.id} className="flex items-center gap-2 py-1 px-2 rounded-lg hover:bg-accent/50"><div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: task.category?.color || "#94a3b8" }} /><span className={`text-sm flex-1 ${task.status === "done" ? "line-through text-muted-foreground" : ""}`}>{task.title}</span><Badge variant="secondary" className={`text-[9px] px-1 py-0 h-4 ${priorityConfig[task.priority]?.bg} ${priorityConfig[task.priority]?.color} border-0`}>{task.priority}</Badge><Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 border-0">{statusConfig[task.status]?.label}</Badge></div>))}</div></div>); }))}</ScrollArea>
    </div>
  );
}

/* ═══════════ CALENDAR VIEW ═══════════ */
function CalendarView() {
  const { tasks, setSelectedDate, selectedDate, setCurrentView } = useAppStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const monthStart = startOfMonth(currentMonth); const monthEnd = endOfMonth(currentMonth); const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd }); const startDay = getDay(monthStart);
  const taskCountMap = useMemo(() => { const map: Record<string, number> = {}; tasks.forEach((t) => { if (!t.dueDate) return; map[t.dueDate] = (map[t.dueDate] || 0) + 1; }); return map; }, [tasks]);
  const monthLabel = format(currentMonth, "MMMM yyyy");
  const selectedDayTasks = useMemo(() => { if (!selectedDate) return []; return tasks.filter((t) => t.dueDate === selectedDate); }, [tasks, selectedDate]);
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><div><h1 className="text-xl font-bold">Calendar</h1><p className="text-sm text-muted-foreground">{monthLabel}</p></div><div className="flex items-center gap-2"><Button variant="outline" size="sm" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeft className="w-4 h-4" /></Button><Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>Today</Button><Button variant="outline" size="sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRight className="w-4 h-4" /></Button></div></div>
      <Card className="border-0 shadow-sm"><CardContent className="p-3"><div className="grid grid-cols-7 gap-1 mb-1">{dayNames.map((d) => (<div key={d} className="text-center text-[10px] font-semibold text-muted-foreground py-1">{d}</div>))}</div><div className="grid grid-cols-7 gap-1">{Array.from({ length: startDay }).map((_, i) => (<div key={`empty-${i}`} className="aspect-square" />))}{daysInMonth.map((day) => { const dateStr = format(day, "yyyy-MM-dd"); const count = taskCountMap[dateStr] || 0; const isSelected = selectedDate === dateStr; const isCurrentDay = isToday(day); return (<button key={dateStr} onClick={() => setSelectedDate(dateStr)} className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs relative transition-all ${isSelected ? "bg-emerald-500 text-white shadow-md" : isCurrentDay ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold" : "hover:bg-accent"}`}><span>{format(day, "d")}</span>{count > 0 && !isSelected && (<div className="absolute bottom-0.5 flex gap-0.5">{Array.from({ length: Math.min(count, 3) }).map((_, i) => (<div key={i} className="w-1 h-1 rounded-full bg-emerald-500" />))}</div>)}{count > 0 && isSelected && (<span className="text-[8px] opacity-80">{count}</span>)}</button>); })}</div></CardContent></Card>
      {selectedDate && (<Card className="border-0 shadow-sm"><CardHeader className="pb-2"><div className="flex items-center justify-between"><CardTitle className="text-sm">{isToday(parseISO(selectedDate)) ? "Today" : format(parseISO(selectedDate), "EEE, MMM d")} — {selectedDayTasks.length} tasks</CardTitle><Button variant="ghost" size="sm" className="text-xs" onClick={() => setCurrentView("tasks")}>View in List <ChevronRight className="w-3 h-3 ml-0.5" /></Button></div></CardHeader><CardContent>{selectedDayTasks.length === 0 ? (<p className="text-sm text-muted-foreground text-center py-3">No tasks on this day</p>) : (<div className="space-y-1.5">{selectedDayTasks.map((task) => (<div key={task.id} className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-accent/50"><div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: task.category?.color || "#94a3b8" }} /><span className={`text-sm flex-1 ${task.status === "done" ? "line-through text-muted-foreground" : ""}`}>{task.title}</span><Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 border-0">{statusConfig[task.status]?.label}</Badge></div>))}</div>)}</CardContent></Card>)}
    </div>
  );
}

/* ═══════════ CATEGORIES VIEW ═══════════ */
function CategoriesView() {
  const { categories, tasks } = useAppStore();
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<any>(null);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><div><h1 className="text-xl font-bold">Categories</h1><p className="text-sm text-muted-foreground">Organize your tasks by category</p></div><Button onClick={() => { setEditingCat(undefined); setCatDialogOpen(true); }} className="bg-gradient-to-r from-emerald-600 to-teal-600 gap-1.5"><Plus className="w-4 h-4" /> New Category</Button></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">{categories.map((cat) => { const Icon = iconMap[cat.icon] || Tag; const catTasks = tasks.filter((t) => t.categoryId === cat.id); const doneCount = catTasks.filter((t) => t.status === "done").length; const pendingCount = catTasks.filter((t) => t.status !== "done").length; const pct = catTasks.length > 0 ? Math.round((doneCount / catTasks.length) * 100) : 0; return (<Card key={cat.id} className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer group" onClick={() => { setEditingCat(cat); setCatDialogOpen(true); }}><CardContent className="p-4"><div className="flex items-start justify-between mb-3"><div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: cat.color + "20" }}><Icon className="w-5 h-5" style={{ color: cat.color }} /></div><Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100"><Edit3 className="w-3.5 h-3.5" /></Button></div><h3 className="font-semibold text-sm">{cat.name}</h3><p className="text-[10px] text-muted-foreground mt-0.5">{catTasks.length} tasks</p><div className="mt-3"><div className="flex items-center justify-between text-[10px] mb-1"><span className="text-muted-foreground">{doneCount} done / {pendingCount} pending</span><span className="font-medium">{pct}%</span></div><Progress value={pct} className="h-1.5" /></div></CardContent></Card>); })}</div>
      <CategoryFormDialog open={catDialogOpen} onOpenChange={setCatDialogOpen} editCat={editingCat} />
    </div>
  );
}

/* ═══════════ FRIENDS VIEW ═══════════ */
function FriendsView() {
  const { friends, pendingRequests, sentRequests, removeFriend, acceptFriendRequest, rejectFriendRequest, sendFriendRequest } = useAppStore();
  const [tab, setTab] = useState<"friends" | "requests" | "add">("friends");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [sendingTo, setSendingTo] = useState<string | null>(null);

  const handleSearch = async () => {
    if (searchQuery.length < 2) return;
    setSearching(true);
    const results = await useAppStore.getState().searchUsers(searchQuery);
    setSearchResults(results);
    setSearching(false);
  };

  const handleSendRequest = async (username: string) => {
    setSendingTo(username);
    const result = await sendFriendRequest(username);
    if (result.ok) toast.success("Friend request sent!");
    else toast.error(result.error || "Failed");
    setSendingTo(null);
    handleSearch();
  };

  return (
    <div className="space-y-4">
      <div><h1 className="text-xl font-bold">Friends</h1><p className="text-sm text-muted-foreground">Manage your friends and requests</p></div>
      <div className="flex gap-2">
        {(["friends", "requests", "add"] as const).map((t) => (
          <Button key={t} variant={tab === t ? "default" : "outline"} size="sm" className={tab === t ? "bg-gradient-to-r from-emerald-600 to-teal-600" : ""} onClick={() => setTab(t)}>
            {t === "friends" ? `Friends (${friends.length})` : t === "requests" ? `Requests (${pendingRequests.length})` : "Add Friend"}
          </Button>
        ))}
      </div>

      {tab === "friends" && (
        <ScrollArea className="h-[calc(100vh-280px)]">
          {friends.length === 0 ? <p className="text-center py-8 text-muted-foreground">No friends yet. Add some!</p> : (
            <div className="space-y-2">
              {friends.map((f) => (
                <div key={f.id} className="flex items-center gap-3 p-3 rounded-xl border hover:shadow-sm transition-all">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold">{f.avatar || f.name.charAt(0)}</div>
                  <div className="flex-1 min-w-0"><p className="text-sm font-medium">{f.name}</p><p className="text-xs text-muted-foreground">@{f.username}</p></div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { useAppStore.getState().setCurrentChatFriend(f); useAppStore.getState().setCurrentView("chat"); }}><MessageCircle className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { useAppStore.getState().setActiveCall(null); useAppStore.getState().setCurrentView("videocalls"); }}><Video className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => { removeFriend(f.friendshipId); toast.success("Friend removed"); }}><UserMinus className="w-4 h-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      )}

      {tab === "requests" && (
        <ScrollArea className="h-[calc(100vh-280px)]">
          {pendingRequests.length === 0 && sentRequests.length === 0 ? <p className="text-center py-8 text-muted-foreground">No pending requests</p> : (
            <div className="space-y-4">
              {pendingRequests.length > 0 && <><h3 className="text-sm font-semibold text-muted-foreground">Incoming ({pendingRequests.length})</h3><div className="space-y-2">{pendingRequests.map((r) => (<div key={r.id} className="flex items-center gap-3 p-3 rounded-xl border"><div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold">{r.requester?.avatar || "?"}</div><div className="flex-1"><p className="text-sm font-medium">{r.requester?.name}</p><p className="text-xs text-muted-foreground">@{r.requester?.username}</p></div><div className="flex gap-1"><Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-8" onClick={() => { acceptFriendRequest(r.id); toast.success("Request accepted!"); }}><UserCheck className="w-3.5 h-3.5 mr-1" /> Accept</Button><Button variant="outline" size="sm" className="h-8" onClick={() => { rejectFriendRequest(r.id); toast.success("Request rejected"); }}>Reject</Button></div></div>))}</div></>}
              {sentRequests.length > 0 && <><h3 className="text-sm font-semibold text-muted-foreground">Outgoing ({sentRequests.length})</h3><div className="space-y-2">{sentRequests.map((r) => (<div key={r.id} className="flex items-center gap-3 p-3 rounded-xl border opacity-60"><div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white font-bold">{r.addressee?.avatar || "?"}</div><div className="flex-1"><p className="text-sm font-medium">{r.addressee?.name}</p><p className="text-xs text-muted-foreground">@{r.addressee?.username} — pending</p></div></div>))}</div></>}
            </div>
          )}
        </ScrollArea>
      )}

      {tab === "add" && (
        <div className="space-y-4">
          <div className="flex gap-2"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search by username..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-10" onKeyDown={(e) => e.key === "Enter" && handleSearch()} /></div><Button onClick={handleSearch} disabled={searching} className="bg-gradient-to-r from-emerald-600 to-teal-600">{searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}</Button></div>
          {searchResults.length > 0 && (<div className="space-y-2">{searchResults.map((u) => (<div key={u.id} className="flex items-center gap-3 p-3 rounded-xl border"><div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold">{u.avatar || u.name.charAt(0)}</div><div className="flex-1"><p className="text-sm font-medium">{u.name}</p><p className="text-xs text-muted-foreground">@{u.username}</p></div>
            {u.friendshipStatus === "accepted" && <Badge variant="secondary" className="text-xs">Friends</Badge>}
            {u.friendshipStatus === "pending" && <Badge variant="outline" className="text-xs">Pending</Badge>}
            {u.friendshipStatus === "none" && <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-8" disabled={sendingTo === u.username} onClick={() => handleSendRequest(u.username)}>{sendingTo === u.username ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5 mr-1" />} Add</Button>}
          </div>))}</div>)}
        </div>
      )}
    </div>
  );
}

/* ═══════════ FEED VIEW ═══════════ */
function FeedView() {
  const { posts, fetchPosts, createPost, toggleLike, addComment, user } = useAppStore();
  const [newPostContent, setNewPostContent] = useState("");
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [posting, setPosting] = useState(false);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;
    setPosting(true);
    const result = await createPost(newPostContent.trim());
    if (result) toast.success("Post shared!");
    else toast.error("Failed to post");
    setNewPostContent("");
    setPosting(false);
  };

  const handleComment = async (postId: string) => {
    const content = commentInputs[postId]?.trim();
    if (!content) return;
    await addComment(postId, content);
    setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
  };

  return (
    <div className="space-y-4">
      <div><h1 className="text-xl font-bold">Feed</h1><p className="text-sm text-muted-foreground">Posts from you and your friends</p></div>
      <Card className="border-0 shadow-sm"><CardContent className="p-4"><Textarea placeholder="Share something with your friends..." value={newPostContent} onChange={(e) => setNewPostContent(e.target.value)} rows={3} className="resize-none" /><div className="flex justify-end mt-2"><Button onClick={handleCreatePost} disabled={posting || !newPostContent.trim()} className="bg-gradient-to-r from-emerald-600 to-teal-600">{posting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null} Post</Button></div></CardContent></Card>
      <ScrollArea className="h-[calc(100vh-340px)]">
        {posts.length === 0 ? (<p className="text-center py-8 text-muted-foreground">No posts yet. Be the first to share!</p>) : (
          <div className="space-y-4">
            {posts.map((post) => {
              const isLiked = post.likes.some((l) => l.userId === user?.id);
              return (
                <Card key={post.id} className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-bold">{post.author.avatar || post.author.name.charAt(0)}</div>
                      <div><p className="text-sm font-medium">{post.author.name}</p><p className="text-[10px] text-muted-foreground">@{post.author.username} · {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</p></div>
                    </div>
                    <p className="text-sm whitespace-pre-wrap mb-3">{post.content}</p>
                    <div className="flex items-center gap-4 mb-3">
                      <button onClick={() => toggleLike(post.id)} className={`flex items-center gap-1.5 text-xs transition-colors ${isLiked ? "text-red-500" : "text-muted-foreground hover:text-red-500"}`}><ThumbsUp className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} /> {post.likes.length}</button>
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><MessageSquare className="w-4 h-4" /> {post.comments.length}</span>
                    </div>
                    {post.comments.length > 0 && (<div className="space-y-2 mb-3 pl-3 border-l-2 border-muted">{post.comments.map((c) => (<div key={c.id} className="flex gap-2"><div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">{c.user.avatar || c.user.name.charAt(0)}</div><div><p className="text-xs"><span className="font-medium">{c.user.name}</span> <span className="text-muted-foreground">{c.content}</span></p></div></div>))}</div>)}
                    <div className="flex gap-2"><Input placeholder="Write a comment..." value={commentInputs[post.id] || ""} onChange={(e) => setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))} className="h-8 text-xs" onKeyDown={(e) => e.key === "Enter" && handleComment(post.id)} /><Button size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-700" onClick={() => handleComment(post.id)}><Send className="w-3 h-3" /></Button></div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

/* ═══════════ MESSAGES VIEW ═══════════ */
function MessagesView() {
  const { conversations, fetchConversations, setCurrentChatFriend, friends } = useAppStore();
  useEffect(() => { fetchConversations(); }, [fetchConversations]);
  return (
    <div className="space-y-4">
      <div><h1 className="text-xl font-bold">Messages</h1><p className="text-sm text-muted-foreground">Chat with your friends</p></div>
      <ScrollArea className="h-[calc(100vh-240px)]">
        {friends.length === 0 ? (<p className="text-center py-8 text-muted-foreground">Add friends first to start messaging</p>) : conversations.length === 0 ? (<p className="text-center py-8 text-muted-foreground">Select a friend to start chatting</p>) : (
          <div className="space-y-1">
            {conversations.map((conv) => (
              <button key={conv.friend.id} onClick={() => { setCurrentChatFriend(conv.friend); useAppStore.getState().setCurrentView("chat"); }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-accent transition-colors text-left">
                <div className="relative"><div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold">{conv.friend.avatar || conv.friend.name.charAt(0)}</div>{conv.unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{conv.unreadCount > 9 ? "9+" : conv.unreadCount}</span>}</div>
                <div className="flex-1 min-w-0"><p className="text-sm font-medium">{conv.friend.name}</p><p className="text-xs text-muted-foreground truncate">{conv.lastMessage ? conv.lastMessage.content : "No messages yet"}</p></div>
                {conv.lastMessage && <span className="text-[9px] text-muted-foreground flex-shrink-0">{formatDistanceToNow(new Date(conv.lastMessage.createdAt), { addSuffix: false })}</span>}
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

/* ═══════════ CHAT VIEW ═══════════ */
function ChatView() {
  const { currentChatFriend, chatMessages, fetchChatMessages, sendMessage, setCurrentView } = useAppStore();
  const [messageInput, setMessageInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (currentChatFriend) fetchChatMessages(currentChatFriend.id); }, [currentChatFriend, fetchChatMessages]);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [chatMessages]);

  const handleSend = async () => {
    if (!messageInput.trim() || !currentChatFriend) return;
    setSending(true);
    await sendMessage(currentChatFriend.id, messageInput.trim());
    setMessageInput("");
    setSending(false);
  };

  if (!currentChatFriend) return <p className="text-center py-8 text-muted-foreground">No conversation selected</p>;

  return (
    <div className="space-y-4 h-[calc(100vh-160px)] flex flex-col">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setCurrentView("messages")}><ArrowLeft className="w-4 h-4" /></Button>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold">{currentChatFriend.avatar || currentChatFriend.name.charAt(0)}</div>
        <div><p className="text-sm font-medium">{currentChatFriend.name}</p><p className="text-[10px] text-muted-foreground">@{currentChatFriend.username}</p></div>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 px-1">
        {chatMessages.map((msg) => {
          const isMine = msg.senderId === useAppStore.getState().user?.id;
          return (
            <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${isMine ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white" : "bg-muted"}`}>
                <p className="text-sm">{msg.content}</p>
                <p className={`text-[9px] mt-1 ${isMine ? "text-white/70" : "text-muted-foreground"}`}>{formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-2 pt-2 border-t">
        <Input placeholder="Type a message..." value={messageInput} onChange={(e) => setMessageInput(e.target.value)} className="h-10" onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()} />
        <Button onClick={handleSend} disabled={sending || !messageInput.trim()} className="bg-gradient-to-r from-emerald-600 to-teal-600 h-10"><Send className="w-4 h-4" /></Button>
      </div>
    </div>
  );
}

/* ═══════════ PROJECTS VIEW ═══════════ */
function ProjectsView() {
  const { projects, fetchProjects, createProject, setCurrentProject, setCurrentView } = useAppStore();
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [color, setColor] = useState("#6366f1");
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    const p = await createProject({ name: name.trim(), description: desc.trim() || undefined, color });
    if (p) { toast.success("Project created!"); setCreateOpen(false); setName(""); setDesc(""); }
    else toast.error("Failed to create project");
    setSaving(false);
  };

  const colorOptions = ["#10b981", "#ef4444", "#8b5cf6", "#f59e0b", "#ec4899", "#06b6d4", "#3b82f6", "#f97316", "#6366f1"];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><div><h1 className="text-xl font-bold">Projects</h1><p className="text-sm text-muted-foreground">Collaborate with your team</p></div><Button onClick={() => setCreateOpen(true)} className="bg-gradient-to-r from-emerald-600 to-teal-600 gap-1.5"><Plus className="w-4 h-4" /> New Project</Button></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {projects.map((p) => (
          <Card key={p.id} className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={async () => { setCurrentProject(p); await useAppStore.getState().fetchProjectDetail(p.id); await useAppStore.getState().fetchProjectTasks(p.id); setCurrentView("project-detail"); }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: p.color + "20" }}><FolderKanban className="w-5 h-5" style={{ color: p.color }} /></div><div className="flex-1 min-w-0"><h3 className="font-semibold text-sm truncate">{p.name}</h3><p className="text-[10px] text-muted-foreground">{p.members.length} members · {p.taskCount} tasks</p></div></div>
              {p.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{p.description}</p>}
              <div className="flex items-center gap-2"><Badge className={`text-[9px] ${roleBadge[p.myRole]?.color || ""}`}>{roleBadge[p.myRole]?.label || p.myRole}</Badge><div className="flex -space-x-1">{p.members.slice(0, 4).map((m) => (<div key={m.id} className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-[8px] font-bold border border-background">{m.user.avatar || m.user.name.charAt(0)}</div>))}</div></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Create New Project</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2"><Label>Project Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="My Awesome Project" /></div>
          <div className="space-y-2"><Label>Description</Label><Textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="What's this project about?" rows={2} /></div>
          <div className="space-y-2"><Label>Color</Label><div className="flex flex-wrap gap-2">{colorOptions.map((c) => (<button key={c} onClick={() => setColor(c)} className={`w-8 h-8 rounded-full border-2 transition-all ${color === c ? "border-foreground scale-110" : "border-transparent"}`} style={{ backgroundColor: c }} />))}</div></div>
          <DialogFooter><Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button><Button onClick={handleCreate} disabled={saving || !name.trim()} className="bg-gradient-to-r from-emerald-600 to-teal-600">{saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null} Create</Button></DialogFooter>
        </div>
      </DialogContent></Dialog>
    </div>
  );
}

/* ═══════════ PROJECT DETAIL VIEW ═══════════ */
function ProjectDetailView() {
  const { currentProject, projectTasks, fetchProjectTasks, addProjectTask, updateProjectTask, deleteProjectTask, inviteMember, removeMember, leaveProject, updateMemberRole, deleteProject, user, setCurrentView, fetchProjects } = useAppStore();
  const [tab, setTab] = useState<"tasks" | "members" | "settings">("tasks");
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteUsername, setInviteUsername] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [taskForm, setTaskForm] = useState({ title: "", description: "", priority: "medium", status: "todo", dueDate: "", assigneeId: "none" });
  const [saving, setSaving] = useState(false);

  if (!currentProject) return <p className="text-center py-8 text-muted-foreground">No project selected</p>;
  const isAdmin = ["owner", "admin"].includes(currentProject.myRole);
  const isOwner = currentProject.myRole === "owner";

  const handleCreateTask = async () => {
    if (!taskForm.title.trim()) return;
    setSaving(true);
    await addProjectTask(currentProject.id, { ...taskForm, assigneeId: taskForm.assigneeId === "none" ? null : taskForm.assigneeId, dueDate: taskForm.dueDate || null });
    setTaskForm({ title: "", description: "", priority: "medium", status: "todo", dueDate: "", assigneeId: "none" });
    setTaskDialogOpen(false);
    setSaving(false);
    toast.success("Task created!");
  };

  const handleInvite = async () => {
    if (!inviteUsername.trim()) return;
    const ok = await inviteMember(currentProject.id, inviteUsername.trim(), inviteRole);
    if (ok) { toast.success("Member invited!"); setInviteOpen(false); setInviteUsername(""); }
    else toast.error("Failed to invite");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setCurrentView("projects")}><ArrowLeft className="w-4 h-4" /></Button>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: currentProject.color + "20" }}><FolderKanban className="w-5 h-5" style={{ color: currentProject.color }} /></div>
        <div className="flex-1 min-w-0"><h1 className="text-xl font-bold truncate">{currentProject.name}</h1><p className="text-xs text-muted-foreground">{currentProject.members.length} members · <Badge className={`text-[9px] ${roleBadge[currentProject.myRole]?.color || ""}`}>{roleBadge[currentProject.myRole]?.label}</Badge></p></div>
      </div>
      <div className="flex gap-2">
        {(["tasks", "members", "settings"] as const).map((t) => (<Button key={t} variant={tab === t ? "default" : "outline"} size="sm" className={tab === t ? "bg-gradient-to-r from-emerald-600 to-teal-600" : ""} onClick={() => setTab(t)}>{t.charAt(0).toUpperCase() + t.slice(1)}</Button>))}
      </div>

      {tab === "tasks" && (
        <div className="space-y-3">
          <div className="flex justify-between"><h2 className="font-semibold text-sm">{projectTasks.length} Tasks</h2><Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setTaskDialogOpen(true)}><Plus className="w-3.5 h-3.5 mr-1" /> New Task</Button></div>
          <ScrollArea className="h-[calc(100vh-360px)]">
            {projectTasks.length === 0 ? <p className="text-center py-8 text-muted-foreground">No tasks yet</p> : (
              <div className="space-y-2">{projectTasks.map((task) => {
                const pCfg = priorityConfig[task.priority] || priorityConfig.medium;
                const sCfg = statusConfig[task.status] || statusConfig.todo;
                return (
                  <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl border hover:shadow-sm transition-all">
                    <button onClick={() => updateProjectTask(currentProject.id, task.id, { status: task.status === "done" ? "todo" : "done" })}>{task.status === "done" ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Circle className="w-5 h-5 text-muted-foreground" />}</button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${task.status === "done" ? "line-through text-muted-foreground" : ""}`}>{task.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className={`text-[9px] px-1 py-0 h-4 ${pCfg.bg} ${pCfg.color} border-0`}>{pCfg.label}</Badge>
                        <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 border-0">{sCfg.label}</Badge>
                        {task.assignee && <span className="text-[10px] text-muted-foreground flex items-center gap-1"><div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-[7px] font-bold">{task.assignee.avatar || task.assignee.name.charAt(0)}</div>{task.assignee.name}</span>}
                      </div>
                    </div>
                    {isAdmin && <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => { deleteProjectTask(currentProject.id, task.id); toast.success("Task deleted"); }}><Trash2 className="w-3.5 h-3.5" /></Button>}
                  </div>
                );
              })}</div>
            )}
          </ScrollArea>

          <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>New Project Task</DialogTitle></DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-2"><Label>Title *</Label><Input value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} placeholder="Task title" /></div>
              <div className="space-y-2"><Label>Description</Label><Textarea value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} placeholder="Details..." rows={2} /></div>
              <div className="grid grid-cols-2 gap-3"><div className="space-y-2"><Label>Priority</Label><Select value={taskForm.priority} onValueChange={(v) => setTaskForm({ ...taskForm, priority: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="urgent">Urgent</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>Due Date</Label><Input type="date" value={taskForm.dueDate} onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })} /></div></div>
              <div className="space-y-2"><Label>Assign to</Label><Select value={taskForm.assigneeId} onValueChange={(v) => setTaskForm({ ...taskForm, assigneeId: v })}><SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger><SelectContent><SelectItem value="none">Unassigned</SelectItem>{currentProject.members.map((m) => (<SelectItem key={m.userId} value={m.userId}>{m.user.name} ({roleBadge[m.role]?.label || m.role})</SelectItem>))}</SelectContent></Select></div>
              <DialogFooter><Button variant="outline" onClick={() => setTaskDialogOpen(false)}>Cancel</Button><Button onClick={handleCreateTask} disabled={saving || !taskForm.title.trim()} className="bg-gradient-to-r from-emerald-600 to-teal-600">{saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null} Create</Button></DialogFooter>
            </div>
          </DialogContent></Dialog>
        </div>
      )}

      {tab === "members" && (
        <div className="space-y-3">
          <div className="flex justify-between"><h2 className="font-semibold text-sm">{currentProject.members.length} Members</h2>{isAdmin && <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setInviteOpen(true)}><UserPlus className="w-3.5 h-3.5 mr-1" /> Invite</Button>}</div>
          <div className="space-y-2">
            {currentProject.members.map((m) => {
              const isMe = m.userId === user?.id;
              const rb = roleBadge[m.role] || roleBadge.member;
              return (
                <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl border">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-bold">{m.user.avatar || m.user.name.charAt(0)}</div>
                  <div className="flex-1 min-w-0"><p className="text-sm font-medium">{m.user.name} {isMe && <span className="text-[10px] text-muted-foreground">(you)</span>}</p><p className="text-[10px] text-muted-foreground">@{m.user.username}</p></div>
                  <Badge className={`text-[9px] ${rb.color}`}>{rb.label}</Badge>
                  {isAdmin && !isMe && m.role !== "owner" && (<div className="flex gap-1"><Select value={m.role} onValueChange={(role) => { updateMemberRole(currentProject.id, m.id, role); toast.success("Role updated"); }}><SelectTrigger className="h-7 w-[90px] text-[10px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="admin">Admin</SelectItem><SelectItem value="member">Member</SelectItem><SelectItem value="viewer">Viewer</SelectItem></SelectContent></Select><Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => { removeMember(currentProject.id, m.id); toast.success("Member removed"); }}><UserMinus className="w-3.5 h-3.5" /></Button></div>)}
                  {isMe && m.role !== "owner" && (<Button variant="outline" size="sm" className="h-7 text-xs text-red-500 border-red-200" onClick={() => { leaveProject(currentProject.id, m.id); setCurrentView("projects"); toast.success("Left project"); }}>Leave</Button>)}
                </div>
              );
            })}
          </div>

          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Invite Member</DialogTitle></DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-2"><Label>Username</Label><Input value={inviteUsername} onChange={(e) => setInviteUsername(e.target.value)} placeholder="Enter username" /></div>
              <div className="space-y-2"><Label>Role</Label><Select value={inviteRole} onValueChange={setInviteRole}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="admin">Admin</SelectItem><SelectItem value="member">Member</SelectItem><SelectItem value="viewer">Viewer</SelectItem></SelectContent></Select></div>
              <DialogFooter><Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button><Button onClick={handleInvite} className="bg-gradient-to-r from-emerald-600 to-teal-600">Invite</Button></DialogFooter>
            </div>
          </DialogContent></Dialog>
        </div>
      )}

      {tab === "settings" && (
        <div className="space-y-4">
          <Card className="border-0 shadow-sm"><CardContent className="p-4"><h3 className="font-semibold text-sm mb-3">Project Info</h3><div className="space-y-2 text-sm"><p><span className="text-muted-foreground">Owner:</span> {currentProject.owner.name}</p><p><span className="text-muted-foreground">Created:</span> {formatDistanceToNow(new Date(currentProject.createdAt), { addSuffix: true })}</p></div></CardContent></Card>
          {isOwner && (<Card className="border-0 shadow-sm border-red-200 dark:border-red-900"><CardContent className="p-4"><h3 className="font-semibold text-sm mb-3 text-red-500">Danger Zone</h3><p className="text-xs text-muted-foreground mb-3">Once deleted, this project and all its tasks cannot be recovered.</p><Button variant="destructive" size="sm" onClick={async () => { await deleteProject(currentProject.id); setCurrentView("projects"); toast.success("Project deleted"); }}>Delete Project</Button></CardContent></Card>)}
        </div>
      )}
    </div>
  );
}

/* ═══════════ VIDEO CALLS VIEW ═══════════ */
function VideoCallsView() {
  const { videoCalls, fetchVideoCalls, createVideoCall, joinVideoCall, setActiveCall, setCurrentView, friends, user } = useAppStore();
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchVideoCalls(); }, [fetchVideoCalls]);

  const handleCreate = async () => {
    if (!title.trim()) return;
    setSaving(true);
    const call = await createVideoCall({ title: title.trim(), scheduledAt: scheduledAt || undefined, participantIds: selectedFriends });
    if (call) { toast.success("Meeting created!"); setCreateOpen(false); setTitle(""); setScheduledAt(""); setSelectedFriends([]); }
    else toast.error("Failed to create meeting");
    setSaving(false);
  };

  const handleJoin = async (call: any) => {
    await joinVideoCall(call.id);
    setActiveCall(call);
    setCurrentView("video-call-room");
  };

  const toggleFriend = (id: string) => {
    setSelectedFriends((prev) => prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><div><h1 className="text-xl font-bold">Video Calls</h1><p className="text-sm text-muted-foreground">Meet with friends via Jitsi</p></div><Button onClick={() => setCreateOpen(true)} className="bg-gradient-to-r from-emerald-600 to-teal-600 gap-1.5"><Video className="w-4 h-4" /> New Meeting</Button></div>
      <ScrollArea className="h-[calc(100vh-240px)]">
        {videoCalls.length === 0 ? (<p className="text-center py-8 text-muted-foreground">No meetings yet. Create one!</p>) : (
          <div className="space-y-3">
            {videoCalls.map((call) => {
              const isActive = call.status === "active";
              const isScheduled = call.status === "scheduled";
              const isEnded = call.status === "ended";
              const amParticipant = call.participants.some((p) => p.userId === user?.id);
              return (
                <Card key={call.id} className={`border-0 shadow-sm ${isActive ? "ring-2 ring-emerald-500" : ""}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-2"><Video className={`w-5 h-5 ${isActive ? "text-emerald-500" : isEnded ? "text-muted-foreground" : "text-blue-500"}`} /><div className="flex-1 min-w-0"><h3 className="font-semibold text-sm truncate">{call.title}</h3><p className="text-[10px] text-muted-foreground">Host: {call.host.name} · {call.participants.length} participants</p></div>
                      <Badge className={`text-[9px] ${isActive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : isScheduled ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" : "bg-gray-100 text-gray-500"}`}>{call.status}</Badge>
                    </div>
                    {call.scheduledAt && <p className="text-xs text-muted-foreground mb-2"><CalendarPlus className="w-3 h-3 inline mr-1" />Scheduled: {format(new Date(call.scheduledAt), "MMM d, yyyy h:mm a")}</p>}
                    <div className="flex items-center justify-between">
                      <div className="flex -space-x-1">{call.participants.slice(0, 5).map((p) => (<div key={p.id} className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-[8px] font-bold border border-background">{p.user.avatar || p.user.name.charAt(0)}</div>))}</div>
                      {!isEnded && amParticipant && <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleJoin(call)}><PhoneCall className="w-3.5 h-3.5 mr-1" /> Join</Button>}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </ScrollArea>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Schedule a Meeting</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2"><Label>Meeting Title *</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Sprint Planning" /></div>
          <div className="space-y-2"><Label>Schedule (optional — leave empty for instant)</Label><Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} /></div>
          <div className="space-y-2"><Label>Invite Friends</Label><ScrollArea className="max-h-40"><div className="space-y-1">{friends.map((f) => (<button key={f.id} onClick={() => toggleFriend(f.id)} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${selectedFriends.includes(f.id) ? "bg-emerald-50 dark:bg-emerald-950 border border-emerald-200" : "hover:bg-accent"}`}><div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-[9px] font-bold">{f.avatar || f.name.charAt(0)}</div><span className="flex-1 text-left">{f.name}</span>{selectedFriends.includes(f.id) && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}</button>))}</div></ScrollArea></div>
          <DialogFooter><Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button><Button onClick={handleCreate} disabled={saving || !title.trim()} className="bg-gradient-to-r from-emerald-600 to-teal-600">{saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Video className="w-4 h-4 mr-1" />} Create Meeting</Button></DialogFooter>
        </div>
      </DialogContent></Dialog>
    </div>
  );
}

/* ═══════════ VIDEO CALL ROOM VIEW ═══════════ */
function VideoCallRoomView() {
  const { activeCall, endVideoCall, setCurrentView, user } = useAppStore();

  if (!activeCall) return <p className="text-center py-8 text-muted-foreground">No active call</p>;

  const jitsiUrl = `https://meet.jit.si/${activeCall.roomName}`;

  return (
    <div className="space-y-4 h-[calc(100vh-160px)] flex flex-col">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setCurrentView("videocalls")}><ArrowLeft className="w-4 h-4" /></Button>
        <div className="flex-1"><h1 className="text-lg font-bold">{activeCall.title}</h1><p className="text-xs text-muted-foreground">Room: {activeCall.roomName}</p></div>
        {activeCall.hostId === user?.id && <Button variant="destructive" size="sm" onClick={async () => { await endVideoCall(activeCall.id); setCurrentView("videocalls"); toast.success("Meeting ended"); }}><Phone className="w-3.5 h-3.5 mr-1" /> End Meeting</Button>}
      </div>
      <div className="flex-1 rounded-xl overflow-hidden border bg-muted">
        <iframe src={`${jitsiUrl}#config.prejoinPageEnabled=false&config.startWithAudioMuted=false&config.startWithVideoMuted=false&config.subject=${encodeURIComponent(activeCall.title)}&userInfo.displayName=${encodeURIComponent(user?.name || "Guest")}`} className="w-full h-full border-0" allow="camera; microphone; fullscreen; display-capture; autoplay" title="Video Call" />
      </div>
    </div>
  );
}

/* ═══════════ TASK DETAIL VIEW ═══════════ */
// File icon helper based on extension
function getFileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (["md", "markdown"].includes(ext)) return <FileText className="w-4 h-4 text-blue-500" />;
  if (["txt", "log", "csv"].includes(ext)) return <FileText className="w-4 h-4 text-gray-500" />;
  if (["json", "js", "ts", "tsx", "jsx", "py", "rb", "go", "rs", "java", "c", "cpp", "h"].includes(ext)) return <Code className="w-4 h-4 text-emerald-500" />;
  if (["html", "css", "scss", "xml", "yaml", "yml", "toml"].includes(ext)) return <Code className="w-4 h-4 text-orange-500" />;
  if (["png", "jpg", "jpeg", "gif", "svg", "webp", "bmp", "ico"].includes(ext)) return <ImageIcon className="w-4 h-4 text-purple-500" />;
  if (["pdf"].includes(ext)) return <FileText className="w-4 h-4 text-red-500" />;
  return <File className="w-4 h-4 text-muted-foreground" />;
}

function isTextFile(name: string): boolean {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  return [
    "txt", "md", "markdown", "json", "js", "ts", "tsx", "jsx", "py", "rb",
    "go", "rs", "java", "c", "cpp", "h", "html", "css", "scss", "xml",
    "yaml", "yml", "toml", "csv", "log", "sh", "bash", "zsh", "env",
    "gitignore", "dockerignore", "editorconfig", "prettierrc", "eslintrc",
    "ini", "cfg", "conf", "properties", "sql", "graphql", "vue", "svelte",
  ].includes(ext);
}

function isMarkdownFile(name: string): boolean {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  return ["md", "markdown"].includes(ext);
}

function isImageFile(name: string): boolean {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  return ["png", "jpg", "jpeg", "gif", "svg", "webp", "bmp", "ico"].includes(ext);
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface LocalFile {
  name: string;
  kind: "file" | "directory";
  size?: number;
  lastModified?: number;
  handle?: FileSystemFileHandle;
  dirHandle?: FileSystemDirectoryHandle;
  children?: LocalFile[];
  content?: string;
}

/* ═══════════ DRAGGABLE TREE NODE ITEM ═══════════ */
function DraggableTreeNodeItem({
  node,
  depth,
  tree,
  dirHandle,
  onSelectFile,
  selectedFileTitle,
  onTreeUpdate,
  dragOverId,
}: {
  node: TreeNode;
  depth: number;
  tree: TreeJson;
  dirHandle: FileSystemDirectoryHandle;
  onSelectFile: (title: string, handle: FileSystemFileHandle | null) => void;
  selectedFileTitle: string | null;
  onTreeUpdate: (updated: TreeJson) => void;
  dragOverId: string | null;
}) {
  const [expanded, setExpanded] = useState(true);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(node.title);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  // Draggable: this node can be dragged to another node to become its child
  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    isDragging,
  } = useDraggable({
    id: node.id,
    data: { node, depth },
  });

  // Droppable: other nodes can be dropped ON this node, making them children
  const {
    setNodeRef: setDropRef,
    isOver,
  } = useDroppable({
    id: `drop-${node.id}`,
    data: { node },
  });

  // Combine refs: the same element is both a drag source and a drop target
  const combinedRef = useCallback((el: HTMLDivElement | null) => {
    setDragRef(el);
    setDropRef(el);
  }, [setDragRef, setDropRef]);

  const children = getChildren(tree.nodes, node.id);
  const isSelected = selectedFileTitle === node.title;
  const hasChildren = children.length > 0;
  const isDragOver = dragOverId === node.id || isOver;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      setExpanded(!expanded);
    } else if (!node.isFolder) {
      onSelectFile(node.title, null);
    }
  };

  const handleSelect = () => {
    if (!hasChildren && !node.isFolder) {
      onSelectFile(node.title, null);
    }
  };

  const handleRename = async () => {
    if (renameValue.trim() && renameValue !== node.title) {
      const updated = await renameTreeNode(dirHandle, tree, node.id, renameValue.trim());
      onTreeUpdate(updated);
    }
    setRenaming(false);
  };

  const handleDelete = async () => {
    const updated = await deleteTreeNode(dirHandle, tree, node.id);
    onTreeUpdate(updated);
  };

  // Unchild only this node — detach from parent but keep children attached
  const handleUnchild = async () => {
    const updated = await unchildOnlySelf(dirHandle, tree, node.id);
    onTreeUpdate(updated);
  };

  // Go to Root — detach this node AND all its descendants, move everything to root
  const handleGoToRoot = async () => {
    const updated = await unchildTreeNode(dirHandle, tree, node.id);
    onTreeUpdate(updated);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  // Close context menu on any click
  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [contextMenu]);

  // Any node can visually become a parent when it has children
  const isVirtualParent = hasChildren;

  return (
    <div ref={combinedRef} style={{ opacity: isDragging ? 0.3 : 1 }}>
      <div
        className={`group flex items-center gap-1 py-1 px-1 rounded-md text-xs cursor-pointer transition-colors
          ${isSelected ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300" : "hover:bg-accent"}
          ${isDragOver && !isDragging ? "bg-blue-50 dark:bg-blue-950/30 ring-2 ring-blue-400 ring-offset-1" : ""}`}
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
        onClick={handleToggle}
        onContextMenu={handleContextMenu}
        {...listeners}
        {...attributes}
      >
        {/* Expand/collapse chevron — show for any node that is a virtual parent */}
        {isVirtualParent ? (
          <button onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }} className="p-0">
            {expanded ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
          </button>
        ) : (
          <span className="w-3" />
        )}

        {/* Icon — folder-like if it has children, otherwise file icon */}
        {isVirtualParent ? (
          expanded ? <FolderOpen className="w-4 h-4 text-amber-500 flex-shrink-0" /> : <Folder className="w-4 h-4 text-amber-500 flex-shrink-0" />
        ) : node.isFolder ? (
          <Folder className="w-4 h-4 text-amber-500 flex-shrink-0" />
        ) : (
          getFileIcon(node.title)
        )}

        {/* Title (or rename input) */}
        {renaming ? (
          <input
            autoFocus
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => { if (e.key === "Enter") handleRename(); if (e.key === "Escape") setRenaming(false); }}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 bg-transparent border-b border-emerald-400 outline-none text-xs min-w-0 px-0.5"
          />
        ) : (
          <span className="flex-1 truncate select-none" onClick={handleSelect}>{node.title}</span>
        )}

        {/* Child count */}
        {isVirtualParent && (
          <span className="text-[9px] text-muted-foreground flex-shrink-0">{children.length}</span>
        )}

        {/* Drag indicator hint */}
        <GripVertical className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-40 flex-shrink-0" />
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-popover border rounded-lg shadow-lg py-1 min-w-[180px] text-xs"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button className="w-full text-left px-3 py-1.5 hover:bg-accent flex items-center gap-2" onClick={() => { setRenaming(true); setContextMenu(null); }}>
            <Edit3 className="w-3 h-3" /> Rename
          </button>
          {node.parentId !== null && (
            <>
              <button className="w-full text-left px-3 py-1.5 hover:bg-accent flex items-center gap-2" onClick={() => { handleUnchild(); setContextMenu(null); }}>
                <CornerDownLeft className="w-3 h-3" /> Unchild from Parent
              </button>
              <button className="w-full text-left px-3 py-1.5 hover:bg-accent flex items-center gap-2" onClick={() => { handleGoToRoot(); setContextMenu(null); }}>
                <ArrowUpRight className="w-3 h-3" /> Go to Root
              </button>
            </>
          )}
          <button className="w-full text-left px-3 py-1.5 hover:bg-accent text-red-500 flex items-center gap-2" onClick={() => { handleDelete(); setContextMenu(null); }}>
            <Trash2 className="w-3 h-3" /> Remove from Tree
          </button>
        </div>
      )}

      {/* Children — recursively render child nodes */}
      {expanded && hasChildren && (
        children.map((child) => (
          <DraggableTreeNodeItem
            key={child.id}
            node={child}
            depth={depth + 1}
            tree={tree}
            dirHandle={dirHandle}
            onSelectFile={onSelectFile}
            selectedFileTitle={selectedFileTitle}
            onTreeUpdate={onTreeUpdate}
            dragOverId={dragOverId}
          />
        ))
      )}
    </div>
  );
}

/* ═══════════ TREE PANEL (VS Code sidebar style) ═══════════ */
function TreePanel({
  tree,
  dirHandle,
  onSelectFile,
  selectedFileTitle,
  onTreeUpdate,
}: {
  tree: TreeJson;
  dirHandle: FileSystemDirectoryHandle;
  onSelectFile: (title: string, handle: FileSystemFileHandle | null) => void;
  selectedFileTitle: string | null;
  onTreeUpdate: (updated: TreeJson) => void;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const rootNodes = getChildren(tree.nodes, null);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const over = event.over;
    if (over) {
      // Extract node ID from droppable ID (format: "drop-{nodeId}")
      const overIdStr = over.id.toString();
      if (overIdStr.startsWith("drop-")) {
        setOverId(overIdStr.replace("drop-", ""));
      } else {
        setOverId(null);
      }
    } else {
      setOverId(null);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const currentOverId = overId;
    setActiveId(null);
    setOverId(null);

    const { active, over } = event;
    if (!over) return;

    const activeNodeId = active.id as string;

    // Extract target node ID from droppable ID (format: "drop-{nodeId}")
    let overNodeId: string | null = null;
    const overIdStr = over.id.toString();
    if (overIdStr.startsWith("drop-")) {
      overNodeId = overIdStr.replace("drop-", "");
    } else {
      return; // Unknown drop target — ignore
    }

    // Don't drop on self
    if (activeNodeId === overNodeId) return;

    const activeNode = tree.nodes.find(n => n.id === activeNodeId);
    const overNode = tree.nodes.find(n => n.id === overNodeId);
    if (!activeNode || !overNode) return;

    // Don't allow dropping a parent into its own descendant (prevents circular references)
    const descendantIds = getDescendantIds(tree.nodes, activeNodeId);
    if (descendantIds.includes(overNodeId!)) return;

    // If already a direct child of the target, do nothing
    if (activeNode.parentId === overNodeId) return;

    // REPARENT: Make the dragged node a child of the drop target.
    // This is the core DnD operation — any node can become a child of any other node,
    // creating a virtual parent-child hierarchy that is independent of physical file structure.
    const existingChildren = getChildren(tree.nodes, overNodeId);
    const newOrder = existingChildren.length; // Append at end of target's children

    const updated = await moveTreeNode(dirHandle, tree, activeNodeId, overNodeId, newOrder);
    onTreeUpdate(updated);
  };

  const handleAddNode = async (isFolder: boolean) => {
    const title = isFolder ? "New Folder" : "new-file.txt";
    const { tree: updated } = await addTreeNode(dirHandle, tree, title, null, isFolder);
    onTreeUpdate(updated);
  };

  const handleRefresh = async () => {
    const updated = await ensureTreeJson(dirHandle);
    onTreeUpdate(updated);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-2 py-1.5 border-b">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Explorer</span>
        <div className="flex items-center gap-1">
          <button onClick={() => handleAddNode(false)} className="p-1 rounded hover:bg-accent transition-colors" title="New File">
            <FilePlus className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          <button onClick={() => handleAddNode(true)} className="p-1 rounded hover:bg-accent transition-colors" title="New Folder">
            <FolderPlus className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          <button onClick={handleRefresh} className="p-1 rounded hover:bg-accent transition-colors" title="Refresh Tree">
            <svg className="w-3.5 h-3.5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </button>
        </div>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-y-auto p-1">
          {rootNodes.map((node) => (
            <DraggableTreeNodeItem
              key={node.id}
              node={node}
              depth={0}
              tree={tree}
              dirHandle={dirHandle}
              onSelectFile={onSelectFile}
              selectedFileTitle={selectedFileTitle}
              onTreeUpdate={onTreeUpdate}
              dragOverId={overId}
            />
          ))}
          {rootNodes.length === 0 && (
            <p className="text-[10px] text-muted-foreground text-center py-4">No items in tree</p>
          )}
        </div>
        <DragOverlay>
          {activeId ? (
            <div className="bg-accent/80 rounded-md px-2 py-1 text-xs flex items-center gap-2 shadow-lg border">
              <GripVertical className="w-3 h-3" />
              {tree.nodes.find(n => n.id === activeId)?.title}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

/* ═══════════ TASK DETAIL VIEW ═══════════ */
function TaskDetailView() {
  const { selectedTask, setSelectedTask, setCurrentView, updateTask, categories } = useAppStore();
  const [dirHandle, setDirHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [tree, setTree] = useState<TreeJson | null>(null);
  const [treeLoading, setTreeLoading] = useState(false);
  const [selectedFileTitle, setSelectedFileTitle] = useState<string | null>(null);
  const [selectedFileHandle, setSelectedFileHandle] = useState<FileSystemFileHandle | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [renderedMarkdown, setRenderedMarkdown] = useState<string>("");
  const [imageDataUrl, setImageDataUrl] = useState<string>("");
  const [folderSaving, setFolderSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [creatingFile, setCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState("");

  if (!selectedTask) return <p className="text-center py-8 text-muted-foreground">No task selected</p>;

  const pCfg = priorityConfig[selectedTask.priority] || priorityConfig.medium;
  const sCfg = statusConfig[selectedTask.status] || statusConfig.todo;
  const isOverdue = selectedTask.dueDate && selectedTask.status !== "done" && parseISO(selectedTask.dueDate) < new Date(new Date().toDateString());
  const dueDateLabel = (() => {
    if (!selectedTask.dueDate) return null;
    const d = parseISO(selectedTask.dueDate);
    if (!isValid(d)) return selectedTask.dueDate;
    if (isToday(d)) return "Today";
    if (isTomorrow(d)) return "Tomorrow";
    if (isYesterday(d)) return "Yesterday";
    return format(d, "EEEE, MMM d, yyyy");
  })();

  // Try to restore directory handle from IndexedDB on mount
  useEffect(() => {
    if (!selectedTask) return;
    (async () => {
      const saved = await loadDirectoryHandle(selectedTask.id);
      if (saved) {
        const granted = await checkPermission(saved, "read");
        if (granted) {
          setDirHandle(saved);
          setTreeLoading(true);
          try {
            const t = await ensureTreeJson(saved);
            setTree(t);
          } catch (err) {
            console.error("Failed to load tree:", err);
          }
          setTreeLoading(false);
        }
      }
    })();
  }, [selectedTask?.id]);

  // Open folder picker using File System Access API
  const openFolderPicker = async () => {
    try {
      if (!("showDirectoryPicker" in window)) {
        toast.error("Your browser doesn't support local folder access. Please use Chrome or Edge.");
        return;
      }
      const handle = await (window as any).showDirectoryPicker({ mode: "readwrite" });
      setDirHandle(handle);
      // Persist handle in IndexedDB
      await saveDirectoryHandle(selectedTask.id, handle);

      setTreeLoading(true);
      const t = await ensureTreeJson(handle);
      setTree(t);
      setTreeLoading(false);

      // Save folder name to task
      const folderName = handle.name;
      if (folderName !== selectedTask.folderName) {
        setFolderSaving(true);
        await updateTask(selectedTask.id, { folderName });
        setFolderSaving(false);
        toast.success(`Folder "${folderName}" linked to task`);
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        toast.error("Failed to open folder: " + err.message);
      }
    }
  };

  // Request permission if lost
  const reRequestPermission = async () => {
    if (!dirHandle) return;
    const granted = await requestPermission(dirHandle, "readwrite");
    if (granted) {
      toast.success("Permission granted");
      setTreeLoading(true);
      const t = await ensureTreeJson(dirHandle);
      setTree(t);
      setTreeLoading(false);
    } else {
      toast.error("Permission denied by browser");
    }
  };

  // Open a file by title — find its handle in the directory
  const handleSelectFile = async (title: string, _handle: FileSystemFileHandle | null) => {
    if (!dirHandle) return;
    try {
      const fileHandle = await dirHandle.getFileHandle(title);
      setSelectedFileTitle(title);
      setSelectedFileHandle(fileHandle);
      setEditing(false);
      setEditContent("");
      setLoading(true);
      setRenderedMarkdown("");
      setImageDataUrl("");

      const f = await fileHandle.getFile();

      if (isImageFile(title)) {
        const reader = new FileReader();
        reader.onload = () => {
          setImageDataUrl(reader.result as string);
          setLoading(false);
        };
        reader.readAsDataURL(f);
      } else if (isTextFile(title)) {
        const text = await f.text();
        setFileContent(text);
        if (isMarkdownFile(title)) {
          const html = marked.parse(text) as string;
          setRenderedMarkdown(html);
        }
        setLoading(false);
      } else {
        setFileContent(`[Binary file: ${title}]\nSize: ${formatFileSize(f.size)}\n\nThis file type cannot be displayed as text.`);
        setLoading(false);
      }
    } catch (err: any) {
      toast.error("Cannot open file: " + err.message);
      setLoading(false);
    }
  };

  // Save edited content back to disk
  const saveFile = async () => {
    if (!dirHandle || !selectedFileTitle || !editing) return;
    try {
      const fileHandle = await dirHandle.getFileHandle(selectedFileTitle);
      const writable = await fileHandle.createWritable();
      await writable.write(editContent);
      await writable.close();
      setFileContent(editContent);
      if (isMarkdownFile(selectedFileTitle)) {
        const html = marked.parse(editContent) as string;
        setRenderedMarkdown(html);
      }
      setEditing(false);
      setEditContent("");
      toast.success("File saved");
    } catch (err: any) {
      toast.error("Failed to save: " + err.message);
    }
  };

  // Create new file in the folder
  const handleCreateFile = async () => {
    if (!dirHandle || !newFileName.trim()) return;
    try {
      const name = newFileName.trim();
      const fileHandle = await dirHandle.getFileHandle(name, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write("");
      await writable.close();

      // Add to tree
      if (tree) {
        const isFolder = !name.includes(".");
        const { tree: updated } = await addTreeNode(dirHandle, tree, name, null, isFolder);
        setTree(updated);
      }

      setNewFileName("");
      setCreatingFile(false);
      toast.success(`Created ${name}`);
    } catch (err: any) {
      toast.error("Failed to create file: " + err.message);
    }
  };

  // Handle tree update from DnD or other mutations
  const handleTreeUpdate = (updated: TreeJson) => {
    setTree(updated);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" onClick={() => setCurrentView("tasks")}><ArrowLeft className="w-4 h-4" /></Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <button onClick={() => updateTask(selectedTask.id, { status: selectedTask.status === "done" ? "todo" : "done" })}>
              {selectedTask.status === "done" ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Circle className="w-5 h-5 text-muted-foreground hover:text-emerald-500 transition-colors" />}
            </button>
            <h1 className={`text-xl font-bold ${selectedTask.status === "done" ? "line-through text-muted-foreground" : ""}`}>{selectedTask.title}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge variant="secondary" className={`text-[10px] px-2 py-0.5 h-5 ${pCfg.bg} ${pCfg.color} border-0`}>{pCfg.label} Priority</Badge>
            <Badge variant="secondary" className="text-[10px] px-2 py-0.5 h-5 border-0"><div className={`w-1.5 h-1.5 rounded-full ${sCfg.color} mr-1`} />{sCfg.label}</Badge>
            {selectedTask.category && <Badge variant="outline" className="text-[10px] px-2 py-0.5 h-5" style={{ borderColor: selectedTask.category.color, color: selectedTask.category.color }}>{selectedTask.category.name}</Badge>}
            {selectedTask.source === "project" && selectedTask.projectName && <Badge variant="secondary" className="text-[10px] px-2 py-0.5 h-5 border-0 bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300"><FolderKanban className="w-2.5 h-2.5 mr-0.5" />{selectedTask.projectName}</Badge>}
            {dueDateLabel && <span className={`text-[10px] flex items-center gap-0.5 ${isOverdue ? "text-red-500 font-medium" : "text-muted-foreground"}`}><Clock className="w-3 h-3" />{dueDateLabel}{selectedTask.dueTime && ` ${selectedTask.dueTime}`}</span>}
          </div>
          {selectedTask.description && <p className="text-sm text-muted-foreground mt-2">{selectedTask.description}</p>}
        </div>
      </div>

      {/* Local Folder Section */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2"><Folder className="w-4 h-4 text-amber-500" /> Local Folder</CardTitle>
            <div className="flex items-center gap-2">
              {dirHandle && (
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={reRequestPermission}>
                  <Shield className="w-3 h-3" /> Re-authorize
                </Button>
              )}
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-7 text-xs gap-1" onClick={openFolderPicker} disabled={folderSaving}>
                <FolderPlus className="w-3.5 h-3.5" /> {dirHandle ? "Change Folder" : "Attach Folder"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!dirHandle ? (
            <div className="text-center py-6 border-2 border-dashed rounded-xl">
              <Folder className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-xs text-muted-foreground">No folder attached</p>
              <p className="text-[10px] text-muted-foreground mt-1">Click "Attach Folder" to link a local directory</p>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">Files stay local — nothing is uploaded to the internet</p>
            </div>
          ) : treeLoading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-emerald-500" /></div>
          ) : tree ? (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <FolderOpen className="w-3.5 h-3.5 text-amber-500" />
                <span className="font-medium text-foreground">{dirHandle.name}</span>
                <span>— {tree.nodes.length} items</span>
                {folderSaving && <Loader2 className="w-3 h-3 animate-spin ml-1" />}
              </div>

              {/* 2-panel layout: Tree + File Viewer */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                {/* Tree Panel (VS Code sidebar style) */}
                <div className="lg:col-span-1 border rounded-xl h-[calc(100vh-420px)] overflow-hidden flex flex-col">
                  <TreePanel
                    tree={tree}
                    dirHandle={dirHandle}
                    onSelectFile={handleSelectFile}
                    selectedFileTitle={selectedFileTitle}
                    onTreeUpdate={handleTreeUpdate}
                  />
                </div>

                {/* File Viewer */}
                <div className="lg:col-span-2 border rounded-xl overflow-hidden">
                  {loading ? (
                    <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-emerald-500" /></div>
                  ) : selectedFileTitle ? (
                    <div className="h-[calc(100vh-420px)] flex flex-col">
                      {/* File header */}
                      <div className="shrink-0 bg-background/95 backdrop-blur-sm border-b px-3 py-2 flex items-center gap-2">
                        {getFileIcon(selectedFileTitle)}
                        <span className="text-xs font-medium truncate flex-1">{selectedFileTitle}</span>
                        {isTextFile(selectedFileTitle) && !editing && (
                          <Button size="sm" variant="ghost" className="h-6 text-[10px] gap-1" onClick={() => { setEditing(true); setEditContent(fileContent); }}>
                            <Edit3 className="w-3 h-3" /> Edit
                          </Button>
                        )}
                        {editing && (
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" className="h-6 text-[10px] gap-1 text-emerald-600" onClick={saveFile}>
                              <CheckCircle2 className="w-3 h-3" /> Save
                            </Button>
                            <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => { setEditing(false); setEditContent(""); }}>
                              <X className="w-3 h-3" /> Cancel
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* File content */}
                      <div className="flex-1 overflow-auto">
                        {editing ? (
                          <div className="h-full flex flex-col">
                            {isMarkdownFile(selectedFileTitle) ? (
                              <div className="flex-1 grid grid-cols-2 divide-x h-full">
                                <textarea
                                  value={editContent}
                                  onChange={(e) => setEditContent(e.target.value)}
                                  className="flex-1 p-3 text-xs font-mono resize-none outline-none bg-muted/20 border-none"
                                  placeholder="Write markdown..."
                                />
                                <div className="p-3 prose prose-sm dark:prose-invert max-w-none overflow-auto" dangerouslySetInnerHTML={{ __html: marked.parse(editContent) as string }} />
                              </div>
                            ) : (
                              <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="flex-1 p-3 text-xs font-mono resize-none outline-none bg-muted/20 min-h-full"
                              />
                            )}
                          </div>
                        ) : imageDataUrl ? (
                          <div className="p-4 flex items-center justify-center min-h-48">
                            <img src={imageDataUrl} alt={selectedFileTitle} className="max-w-full max-h-[calc(100vh-500px)] object-contain rounded-lg" />
                          </div>
                        ) : renderedMarkdown ? (
                          <div className="p-4 prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: renderedMarkdown }} />
                        ) : (
                          <pre className="p-3 text-xs font-mono whitespace-pre-wrap break-words text-foreground/90 bg-muted/30 min-h-48">
                            {fileContent}
                          </pre>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-64 text-muted-foreground">
                      <div className="text-center">
                        <FileText className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
                        <p className="text-xs">Select a file to preview</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-xs text-muted-foreground">No tree data available</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ═══════════ THEME TOGGLE ═══════════ */
function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (<Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}><Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" /><Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" /></Button>);
}

/* ═══════════ MAIN APP ═══════════ */
function AppContent() {
  const { isAuthenticated, isLoading, checkAuth, fetchTasks, fetchCategories, fetchFriends, fetchPendingRequests, fetchSentRequests, fetchProjects, fetchPosts, fetchConversations, fetchVideoCalls, currentView, sidebarOpen, setSidebarOpen } = useAppStore();
  const seededRef = useRef(false);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTasks(); fetchCategories(); fetchFriends(); fetchPendingRequests(); fetchSentRequests();
      fetchProjects(); fetchPosts(); fetchConversations(); fetchVideoCalls();
    }
  }, [isAuthenticated, fetchTasks, fetchCategories, fetchFriends, fetchPendingRequests, fetchSentRequests, fetchProjects, fetchPosts, fetchConversations, fetchVideoCalls]);

  useEffect(() => {
    if (isAuthenticated && !seededRef.current) { seededRef.current = true; fetch("/api/seed", { method: "POST" }).catch(() => {}); }
  }, [isAuthenticated]);

  if (isLoading) return (<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>);
  if (!isAuthenticated) return <LoginPage />;

  const views: Record<ViewMode, React.ReactNode> = {
    dashboard: <DashboardView />, tasks: <TaskListView />, monthly: <MonthlyView />, calendar: <CalendarView />, categories: <CategoriesView />,
    friends: <FriendsView />, feed: <FeedView />, messages: <MessagesView />, chat: <ChatView />,
    projects: <ProjectsView />, "project-detail": <ProjectDetailView />,
    videocalls: <VideoCallsView />, "video-call-room": <VideoCallRoomView />,
    "task-detail": <TaskDetailView />,
  };

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="hidden md:flex w-64 flex-col border-r bg-card h-screen sticky top-0"><SidebarNav /></aside>
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}><SheetContent side="left" className="p-0 w-64"><SidebarNav onNavClose={() => setSidebarOpen(false)} /></SheetContent></Sheet>
      <main className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b px-4 py-3 flex md:hidden items-center gap-3"><Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}><Menu className="w-5 h-5" /></Button><h1 className="font-semibold text-sm">TaskFlow Pro</h1></header>
        <header className="hidden md:flex sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b px-6 py-3 items-center justify-between"><div /><ThemeToggle /></header>
        <div className="p-4 md:p-6 max-w-5xl mx-auto"><AnimatePresence mode="wait"><motion.div key={currentView} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>{views[currentView]}</motion.div></AnimatePresence></div>
      </main>
    </div>
  );
}

/* ═══════════ PAGE ═══════════ */
export default function HomePage() {
  return (<NextThemesProvider attribute="class" defaultTheme="system" enableSystem><TooltipProvider><AppContent /></TooltipProvider></NextThemesProvider>);
}
