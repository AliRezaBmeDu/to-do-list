"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { useAppStore, ViewMode } from "@/store/useAppStore";
import { format, isToday, isTomorrow, isYesterday, isSameMonth, parseISO, isValid, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, List, CalendarDays, Tags, LogOut, Plus, Search,
  ChevronLeft, ChevronRight, Clock, AlertTriangle, Flag,
  MoreHorizontal, Trash2, Edit3, Loader2,
  Sun, Moon, Menu, Code, Bug, Users, Briefcase, Heart, Activity,
  BookOpen, MessageCircle, Tag, TrendingUp, CheckCircle2, Circle,
  Timer, ArrowUpRight, ArrowDownRight, Sparkles
} from "lucide-react";
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

/* ═══════════ LOGIN PAGE ═══════════ */
/* ═══════════ SIGN UP PAGE ═══════════ */
function SignupPage({ onBack }: { onBack: () => void }) {
  const signup = useAppStore((s) => s.signup);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
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
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
            <p className="text-muted-foreground text-sm mt-1">Join TaskFlow Pro — limited to 10 users</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="su-name">Full Name</Label>
                <Input id="su-name" placeholder="Your display name" value={name} onChange={(e) => setName(e.target.value)} className="h-11" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="su-username">Username</Label>
                <Input id="su-username" placeholder="At least 3 characters" value={username} onChange={(e) => setUsername(e.target.value)} className="h-11" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="su-password">Password</Label>
                <Input id="su-password" type="password" placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="su-confirm">Confirm Password</Label>
                <Input id="su-confirm" type="password" placeholder="Repeat your password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="h-11" required />
              </div>
              {error && <p className="text-sm text-red-500 dark:text-red-400 text-center">{error}</p>}
              <Button type="submit" className="w-full h-11 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Create Account
              </Button>
            </form>
            <div className="mt-4 text-center">
              <button type="button" onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                ← Back to Sign In
              </button>
            </div>
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const ok = await login(username, password);
    if (!ok) setError("Invalid username or password");
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Card className="border-0 shadow-2xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold">TaskFlow Pro</CardTitle>
            <p className="text-muted-foreground text-sm mt-1">Smart Todo for the Modern Professional</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" placeholder="Enter username" value={username} onChange={(e) => setUsername(e.target.value)} className="h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11" />
              </div>
              {error && <p className="text-sm text-red-500 dark:text-red-400 text-center">{error}</p>}
              <Button type="submit" className="w-full h-11 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Sign In
              </Button>
              <Button type="button" variant="outline" className="w-full h-11" onClick={() => setShowSignup(true)}>
                Create an Account
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

/* ═══════════ SIDEBAR NAV ═══════════ */
function SidebarNav({ onNavClose }: { onNavClose?: () => void }) {
  const { currentView, setCurrentView, user, logout, tasks, categories } = useAppStore();
  const { theme, setTheme } = useTheme();
  const navItems: { id: ViewMode; label: string; icon: React.ElementType }[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "tasks", label: "Task List", icon: List },
    { id: "monthly", label: "Monthly View", icon: TrendingUp },
    { id: "calendar", label: "Calendar", icon: CalendarDays },
    { id: "categories", label: "Categories", icon: Tags },
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
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button key={item.id} onClick={() => { setCurrentView(item.id); onNavClose?.(); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md" : "hover:bg-accent text-muted-foreground hover:text-foreground"}`}>
              <item.icon className="w-4 h-4" /> {item.label}
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
  const pCfg = priorityConfig[task.priority] || priorityConfig.medium;
  const sCfg = statusConfig[task.status] || statusConfig.todo;
  const PriorityIcon = pCfg.icon;
  const dueDateLabel = (() => {
    if (!task.dueDate) return null;
    const d = parseISO(task.dueDate);
    if (!isValid(d)) return task.dueDate;
    if (isToday(d)) return "Today";
    if (isTomorrow(d)) return "Tomorrow";
    if (isYesterday(d)) return "Yesterday";
    return format(d, "MMM d, yyyy");
  })();
  const isOverdue = task.dueDate && task.status !== "done" && parseISO(task.dueDate) < new Date(new Date().toDateString());

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
      className={`group relative flex gap-3 p-3 rounded-xl border transition-all hover:shadow-md ${task.status === "done" ? "opacity-60" : ""} ${isOverdue ? "border-red-200 dark:border-red-900" : "border-border"}`}>
      <button onClick={onToggleDone} className="mt-0.5 flex-shrink-0">
        {task.status === "done" ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Circle className="w-5 h-5 text-muted-foreground hover:text-emerald-500 transition-colors" />}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4 className={`text-sm font-medium leading-snug ${task.status === "done" ? "line-through text-muted-foreground" : ""}`}>{task.title}</h4>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"><MoreHorizontal className="w-3.5 h-3.5" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}><Edit3 className="w-3.5 h-3.5 mr-2" /> Edit</DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-red-500"><Trash2 className="w-3.5 h-3.5 mr-2" /> Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {task.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{task.description}</p>}
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 h-5 ${pCfg.bg} ${pCfg.color} border-0`}><PriorityIcon className="w-2.5 h-2.5 mr-0.5" />{pCfg.label}</Badge>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 border-0"><div className={`w-1.5 h-1.5 rounded-full ${sCfg.color} mr-1`} />{sCfg.label}</Badge>
          {task.category && <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5" style={{ borderColor: task.category.color, color: task.category.color }}>{task.category.name}</Badge>}
          {dueDateLabel && (
            <span className={`text-[10px] flex items-center gap-0.5 ${isOverdue ? "text-red-500 font-medium" : "text-muted-foreground"}`}>
              <Clock className="w-2.5 h-2.5" />{dueDateLabel}{task.dueTime && ` ${task.dueTime}`}
            </span>
          )}
          {task.tags && task.tags.split(",").filter(Boolean).map((tag: string) => (
            <span key={tag} className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0 rounded">#{tag.trim()}</span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════ TASK FORM (inner - remounts via key) ═══════════ */
function TaskFormInner({ editTask, categories, onSave, onCancel }: {
  editTask?: any; categories: any[]; onSave: (data: any) => Promise<void>; onCancel: () => void;
}) {
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
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    await onSave({
      title, description, status, priority, dueDate: dueDate || null,
      dueTime: dueTime || null, categoryId: categoryId === "none" ? null : categoryId || null,
      tags, isRecurring, recurRule: recurRule || null,
    });
    setSaving(false);
  };

  return (
    <div className="space-y-4 py-2">
      <div className="space-y-2">
        <Label>Title *</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs to be done?" className="h-10" />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add details..." rows={3} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Priority</Label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todo">To Do</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="done">Done</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2"><Label>Due Date</Label><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="h-10" /></div>
        <div className="space-y-2"><Label>Time</Label><Input type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} className="h-10" /></div>
      </div>
      <div className="space-y-2">
        <Label>Category</Label>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Category</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />{c.name}</div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2"><Label>Tags (comma-separated)</Label><Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="e.g. backend, urgent, meeting" className="h-10" /></div>
      <div className="flex items-center gap-3"><Switch checked={isRecurring} onCheckedChange={setIsRecurring} /><Label>Recurring Task</Label></div>
      {isRecurring && (
        <div className="space-y-2">
          <Label>Repeat</Label>
          <Select value={recurRule} onValueChange={setRecurRule}>
            <SelectTrigger><SelectValue placeholder="Select frequency" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSave} disabled={saving || !title.trim()} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null} {editTask ? "Update" : "Create"}
        </Button>
      </DialogFooter>
    </div>
  );
}

/* ═══════════ TASK FORM DIALOG (wrapper) ═══════════ */
function TaskFormDialog({ open, onOpenChange, editTask }: { open: boolean; onOpenChange: (o: boolean) => void; editTask?: any }) {
  const { addTask, updateTask, categories } = useAppStore();
  const dialogKey = `${editTask?.id || "new"}-${open ? "open" : "closed"}`;

  const handleSave = async (data: any) => {
    if (editTask) {
      await updateTask(editTask.id, data);
      toast.success("Task updated successfully");
    } else {
      await addTask(data);
      toast.success("Task created successfully");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{editTask ? "Edit Task" : "Create New Task"}</DialogTitle></DialogHeader>
        {open && <TaskFormInner key={dialogKey} editTask={editTask} categories={categories} onSave={handleSave} onCancel={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

/* ═══════════ CATEGORY FORM (inner - remounts via key) ═══════════ */
function CategoryFormInner({ editCat, onSave, onCancel, onDelete }: {
  editCat?: any; onSave: (data: any) => Promise<void>; onCancel: () => void; onDelete: () => void;
}) {
  const [name, setName] = useState(editCat?.name || "");
  const [icon, setIcon] = useState(editCat?.icon || "tag");
  const [color, setColor] = useState(editCat?.color || "#6366f1");
  const [saving, setSaving] = useState(false);
  const iconOptions = ["tag", "code", "bug", "users", "briefcase", "heart", "activity", "book-open", "message-circle"];
  const colorOptions = ["#10b981", "#ef4444", "#8b5cf6", "#f59e0b", "#ec4899", "#06b6d4", "#3b82f6", "#f97316", "#6366f1"];

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await onSave({ name, icon, color });
    setSaving(false);
  };

  return (
    <div className="space-y-4 py-2">
      <div className="space-y-2"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Category name" /></div>
      <div className="space-y-2">
        <Label>Icon</Label>
        <div className="flex flex-wrap gap-2">
          {iconOptions.map((ic) => {
            const Ic = iconMap[ic] || Tag;
            return (
              <button key={ic} onClick={() => setIcon(ic)}
                className={`w-9 h-9 rounded-lg flex items-center justify-center border-2 transition-all ${icon === ic ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950" : "border-border hover:border-muted-foreground"}`}>
                <Ic className="w-4 h-4" />
              </button>
            );
          })}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Color</Label>
        <div className="flex flex-wrap gap-2">
          {colorOptions.map((c) => (
            <button key={c} onClick={() => setColor(c)}
              className={`w-8 h-8 rounded-full border-2 transition-all ${color === c ? "border-foreground scale-110" : "border-transparent hover:scale-105"}`}
              style={{ backgroundColor: c }} />
          ))}
        </div>
      </div>
      <DialogFooter className="flex justify-between">
        {editCat && <Button variant="destructive" size="sm" onClick={onDelete}><Trash2 className="w-3.5 h-3.5 mr-1" /> Delete</Button>}
        <div className="flex gap-2 ml-auto">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !name.trim()} className="bg-gradient-to-r from-emerald-600 to-teal-600">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null} {editCat ? "Update" : "Create"}
          </Button>
        </div>
      </DialogFooter>
    </div>
  );
}

/* ═══════════ CATEGORY FORM DIALOG (wrapper) ═══════════ */
function CategoryFormDialog({ open, onOpenChange, editCat }: { open: boolean; onOpenChange: (o: boolean) => void; editCat?: any }) {
  const { addCategory, updateCategory, deleteCategory } = useAppStore();
  const dialogKey = `${editCat?.id || "new"}-${open ? "open" : "closed"}`;

  const handleSave = async (data: any) => {
    if (editCat) {
      await updateCategory(editCat.id, data);
      toast.success("Category updated");
    } else {
      await addCategory(data);
      toast.success("Category created");
    }
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!editCat) return;
    await deleteCategory(editCat.id);
    toast.success("Category deleted");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{editCat ? "Edit Category" : "New Category"}</DialogTitle></DialogHeader>
        {open && <CategoryFormInner key={dialogKey} editCat={editCat} onSave={handleSave} onCancel={() => onOpenChange(false)} onDelete={handleDelete} />}
      </DialogContent>
    </Dialog>
  );
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
      <div>
        <h1 className="text-2xl font-bold">Good {new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 17 ? "Afternoon" : "Evening"}!</h1>
        <p className="text-muted-foreground text-sm">Here&apos;s your productivity overview for today.</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Tasks", value: totalTasks, icon: List, color: "from-slate-500 to-slate-600" },
          { label: "Completed", value: doneTasks, icon: CheckCircle2, color: "from-emerald-500 to-teal-600" },
          { label: "In Progress", value: inProgressTasks, icon: Timer, color: "from-blue-500 to-cyan-600" },
          { label: "Overdue", value: overdueTasks, icon: AlertTriangle, color: "from-red-500 to-rose-600" },
        ].map((stat) => (
          <Card key={stat.label} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}><stat.icon className="w-4 h-4 text-white" /></div>
                <span className="text-2xl font-bold">{stat.value}</span>
              </div>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3"><h3 className="font-semibold text-sm">Completion Rate</h3><span className="text-lg font-bold text-emerald-600">{completionRate}%</span></div>
            <Progress value={completionRate} className="h-2" />
            <div className="flex justify-between mt-2 text-[10px] text-muted-foreground"><span>{doneTasks} done</span><span>{totalTasks - doneTasks} remaining</span></div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm mb-3">Priority Breakdown</h3>
            <div className="space-y-2">
              {(["urgent", "high", "medium", "low"] as const).map((p) => {
                const cfg = priorityConfig[p];
                const count = tasks.filter((t) => t.priority === p && t.status !== "done").length;
                const pct = totalTasks > 0 ? (count / totalTasks) * 100 : 0;
                return (
                  <div key={p} className="flex items-center gap-2">
                    <span className={`text-xs w-14 ${cfg.color} font-medium`}>{cfg.label}</span>
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden"><div className={`h-full rounded-full ${cfg.bg}`} style={{ width: `${pct}%` }} /></div>
                    <span className="text-[10px] text-muted-foreground w-6 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Today&apos;s Tasks ({todayTasks.length})</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => setCurrentView("tasks")}>View All <ChevronRight className="w-3 h-3 ml-0.5" /></Button>
          </div>
        </CardHeader>
        <CardContent>
          {todayTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No tasks for today. Enjoy your free time!</p>
          ) : (
            <div className="space-y-2">
              {todayTasks.slice(0, 5).map((task) => {
                const pCfg = priorityConfig[task.priority];
                return (
                  <div key={task.id} className="flex items-center gap-2 py-1.5">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: task.category?.color || "#94a3b8" }} />
                    <span className={`text-sm flex-1 ${task.status === "done" ? "line-through text-muted-foreground" : ""}`}>{task.title}</span>
                    <Badge variant="secondary" className={`text-[9px] px-1.5 py-0 h-4 ${pCfg.bg} ${pCfg.color} border-0`}>{pCfg.label}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Categories</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {categoryStats.map((cat) => {
              const Icon = iconMap[cat.icon] || Tag;
              return (
                <button key={cat.id} onClick={() => { useAppStore.getState().setFilterCategoryId(cat.id); setCurrentView("tasks"); }}
                  className="flex items-center gap-2 p-2.5 rounded-xl border hover:shadow-md transition-all text-left">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: cat.color + "20" }}><Icon className="w-4 h-4" style={{ color: cat.color }} /></div>
                  <div><p className="text-xs font-medium">{cat.name}</p><p className="text-[10px] text-muted-foreground">{cat.count} tasks</p></div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ═══════════ TASK LIST VIEW ═══════════ */
function TaskListView() {
  const { tasks, filterStatus, filterPriority, filterCategoryId, searchQuery,
    setFilterStatus, setFilterPriority, setFilterCategoryId, setSearchQuery,
    updateTask, deleteTask, categories } = useAppStore();
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (filterStatus !== "all" && t.status !== filterStatus) return false;
      if (filterPriority !== "all" && t.priority !== filterPriority) return false;
      if (filterCategoryId !== "all" && t.categoryId !== filterCategoryId) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return t.title.toLowerCase().includes(q) || (t.description || "").toLowerCase().includes(q) || t.tags.toLowerCase().includes(q);
      }
      return true;
    });
  }, [tasks, filterStatus, filterPriority, filterCategoryId, searchQuery]);

  const grouped = useMemo(() => {
    const groups: Record<string, any[]> = {};
    const noDate = "No Date";
    filtered.forEach((t) => { const key = t.dueDate || noDate; if (!groups[key]) groups[key] = []; groups[key].push(t); });
    return Object.entries(groups).sort(([a], [b]) => {
      if (a === noDate) return 1;
      if (b === noDate) return -1;
      return a.localeCompare(b);
    });
  }, [filtered]);

  const formatDateLabel = (dateStr: string) => {
    if (dateStr === "No Date") return "No Due Date";
    const d = parseISO(dateStr);
    if (!isValid(d)) return dateStr;
    if (isToday(d)) return "Today";
    if (isTomorrow(d)) return "Tomorrow";
    if (isYesterday(d)) return "Yesterday";
    return format(d, "EEEE, MMM d, yyyy");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div><h1 className="text-xl font-bold">Task List</h1><p className="text-sm text-muted-foreground">{filtered.length} tasks</p></div>
        <Button onClick={() => { setEditingTask(undefined); setTaskDialogOpen(true); }} className="bg-gradient-to-r from-emerald-600 to-teal-600 gap-1.5"><Plus className="w-4 h-4" /> New Task</Button>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search tasks..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-9" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[120px] h-9 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="todo">To Do</SelectItem><SelectItem value="in-progress">In Progress</SelectItem><SelectItem value="done">Done</SelectItem></SelectContent>
          </Select>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-[120px] h-9 text-xs"><SelectValue placeholder="Priority" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All Priority</SelectItem><SelectItem value="urgent">Urgent</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="low">Low</SelectItem></SelectContent>
          </Select>
          <Select value={filterCategoryId} onValueChange={setFilterCategoryId}>
            <SelectTrigger className="w-[130px] h-9 text-xs"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All Categories</SelectItem>{categories.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}</SelectContent>
          </Select>
        </div>
      </div>
      <ScrollArea className="h-[calc(100vh-320px)]">
        <AnimatePresence mode="popLayout">
          {grouped.length === 0 ? (
            <div className="text-center py-12"><p className="text-muted-foreground">No tasks found</p></div>
          ) : (
            grouped.map(([dateStr, groupTasks]) => (
              <div key={dateStr} className="mb-5">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 sticky top-0 bg-background py-1 z-10">
                  {formatDateLabel(dateStr)} <span className="text-muted-foreground/50">({groupTasks.length})</span>
                </h3>
                <div className="space-y-2">
                  {groupTasks.map((task) => (
                    <TaskCard key={task.id} task={task}
                      onEdit={() => { setEditingTask(task); setTaskDialogOpen(true); }}
                      onToggleDone={() => updateTask(task.id, { status: task.status === "done" ? "todo" : "done" })}
                      onDelete={() => { deleteTask(task.id); toast.success("Task deleted"); }} />
                  ))}
                </div>
              </div>
            ))
          )}
        </AnimatePresence>
      </ScrollArea>
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
  const totalMonth = filtered.length;
  const doneMonth = filtered.filter((t) => t.status === "done").length;
  const overdueMonth = filtered.filter((t) => t.status !== "done" && parseISO(t.dueDate!) < new Date(new Date().toDateString())).length;

  return (
    <div className="space-y-4">
      <div><h1 className="text-xl font-bold">Monthly View</h1><p className="text-sm text-muted-foreground">{monthLabel}</p></div>
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-0 shadow-sm"><CardContent className="p-3 text-center"><p className="text-xl font-bold">{totalMonth}</p><p className="text-[10px] text-muted-foreground">Total</p></CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-3 text-center"><p className="text-xl font-bold text-emerald-600">{doneMonth}</p><p className="text-[10px] text-muted-foreground">Completed</p></CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-3 text-center"><p className="text-xl font-bold text-red-500">{overdueMonth}</p><p className="text-[10px] text-muted-foreground">Overdue</p></CardContent></Card>
      </div>
      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeft className="w-4 h-4" /></Button>
        <h2 className="font-semibold">{monthLabel}</h2>
        <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRight className="w-4 h-4" /></Button>
      </div>
      <ScrollArea className="h-[calc(100vh-380px)]">
        {grouped.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground"><p>No tasks this month</p></div>
        ) : (
          grouped.map(([dateStr, dayTasks]) => {
            const d = parseISO(dateStr);
            const label = isToday(d) ? "Today" : isTomorrow(d) ? "Tomorrow" : format(d, "EEE, MMM d");
            return (
              <div key={dateStr} className="mb-4">
                <div className="flex items-center gap-2 mb-2"><h3 className="text-xs font-semibold text-muted-foreground">{label}</h3><Separator className="flex-1" /></div>
                <div className="space-y-1.5">
                  {dayTasks.map((task) => (
                    <div key={task.id} className="flex items-center gap-2 py-1 px-2 rounded-lg hover:bg-accent/50">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: task.category?.color || "#94a3b8" }} />
                      <span className={`text-sm flex-1 ${task.status === "done" ? "line-through text-muted-foreground" : ""}`}>{task.title}</span>
                      <Badge variant="secondary" className={`text-[9px] px-1 py-0 h-4 ${priorityConfig[task.priority]?.bg} ${priorityConfig[task.priority]?.color} border-0`}>{task.priority}</Badge>
                      <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 border-0">{statusConfig[task.status]?.label}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </ScrollArea>
    </div>
  );
}

/* ═══════════ CALENDAR VIEW ═══════════ */
function CalendarView() {
  const { tasks, setSelectedDate, selectedDate, setCurrentView } = useAppStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = getDay(monthStart);
  const taskCountMap = useMemo(() => { const map: Record<string, number> = {}; tasks.forEach((t) => { if (!t.dueDate) return; map[t.dueDate] = (map[t.dueDate] || 0) + 1; }); return map; }, [tasks]);
  const monthLabel = format(currentMonth, "MMMM yyyy");
  const selectedDayTasks = useMemo(() => { if (!selectedDate) return []; return tasks.filter((t) => t.dueDate === selectedDate); }, [tasks, selectedDate]);
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold">Calendar</h1><p className="text-sm text-muted-foreground">{monthLabel}</p></div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeft className="w-4 h-4" /></Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>Today</Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRight className="w-4 h-4" /></Button>
        </div>
      </div>
      <Card className="border-0 shadow-sm">
        <CardContent className="p-3">
          <div className="grid grid-cols-7 gap-1 mb-1">{dayNames.map((d) => (<div key={d} className="text-center text-[10px] font-semibold text-muted-foreground py-1">{d}</div>))}</div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: startDay }).map((_, i) => (<div key={`empty-${i}`} className="aspect-square" />))}
            {daysInMonth.map((day) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const count = taskCountMap[dateStr] || 0;
              const isSelected = selectedDate === dateStr;
              const isCurrentDay = isToday(day);
              return (
                <button key={dateStr} onClick={() => setSelectedDate(dateStr)}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs relative transition-all ${isSelected ? "bg-emerald-500 text-white shadow-md" : isCurrentDay ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold" : "hover:bg-accent"}`}>
                  <span>{format(day, "d")}</span>
                  {count > 0 && !isSelected && (<div className="absolute bottom-0.5 flex gap-0.5">{Array.from({ length: Math.min(count, 3) }).map((_, i) => (<div key={i} className="w-1 h-1 rounded-full bg-emerald-500" />))}</div>)}
                  {count > 0 && isSelected && (<span className="text-[8px] opacity-80">{count}</span>)}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
      {selectedDate && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">{isToday(parseISO(selectedDate)) ? "Today" : format(parseISO(selectedDate), "EEE, MMM d")} &mdash; {selectedDayTasks.length} tasks</CardTitle>
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => setCurrentView("tasks")}>View in List <ChevronRight className="w-3 h-3 ml-0.5" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            {selectedDayTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-3">No tasks on this day</p>
            ) : (
              <div className="space-y-1.5">
                {selectedDayTasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-accent/50">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: task.category?.color || "#94a3b8" }} />
                    <span className={`text-sm flex-1 ${task.status === "done" ? "line-through text-muted-foreground" : ""}`}>{task.title}</span>
                    <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 border-0">{statusConfig[task.status]?.label}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
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
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold">Categories</h1><p className="text-sm text-muted-foreground">Organize your tasks by category</p></div>
        <Button onClick={() => { setEditingCat(undefined); setCatDialogOpen(true); }} className="bg-gradient-to-r from-emerald-600 to-teal-600 gap-1.5"><Plus className="w-4 h-4" /> New Category</Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {categories.map((cat) => {
          const Icon = iconMap[cat.icon] || Tag;
          const catTasks = tasks.filter((t) => t.categoryId === cat.id);
          const doneCount = catTasks.filter((t) => t.status === "done").length;
          const pendingCount = catTasks.filter((t) => t.status !== "done").length;
          const pct = catTasks.length > 0 ? Math.round((doneCount / catTasks.length) * 100) : 0;
          return (
            <Card key={cat.id} className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer group" onClick={() => { setEditingCat(cat); setCatDialogOpen(true); }}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: cat.color + "20" }}><Icon className="w-5 h-5" style={{ color: cat.color }} /></div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100"><Edit3 className="w-3.5 h-3.5" /></Button>
                </div>
                <h3 className="font-semibold text-sm">{cat.name}</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">{catTasks.length} tasks</p>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[10px] mb-1"><span className="text-muted-foreground">{doneCount} done / {pendingCount} pending</span><span className="font-medium">{pct}%</span></div>
                  <Progress value={pct} className="h-1.5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <CategoryFormDialog open={catDialogOpen} onOpenChange={setCatDialogOpen} editCat={editingCat} />
    </div>
  );
}

/* ═══════════ THEME TOGGLE ═══════════ */
function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}

/* ═══════════ MAIN APP ═══════════ */
function AppContent() {
  const { isAuthenticated, isLoading, checkAuth, fetchTasks, fetchCategories, currentView, sidebarOpen, setSidebarOpen } = useAppStore();
  const seededRef = useRef(false);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated) { fetchTasks(); fetchCategories(); }
  }, [isAuthenticated, fetchTasks, fetchCategories]);

  useEffect(() => {
    if (isAuthenticated && !seededRef.current) {
      seededRef.current = true;
      fetch("/api/seed", { method: "POST" }).then(() => { fetchTasks(); fetchCategories(); }).catch(() => {});
    }
  }, [isAuthenticated, fetchTasks, fetchCategories]);

  if (isLoading) return (<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>);
  if (!isAuthenticated) return <LoginPage />;

  const views: Record<ViewMode, React.ReactNode> = {
    dashboard: <DashboardView />, tasks: <TaskListView />, monthly: <MonthlyView />, calendar: <CalendarView />, categories: <CategoriesView />,
  };

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="hidden md:flex w-64 flex-col border-r bg-card h-screen sticky top-0"><SidebarNav /></aside>
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}><SheetContent side="left" className="p-0 w-64"><SidebarNav onNavClose={() => setSidebarOpen(false)} /></SheetContent></Sheet>
      <main className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b px-4 py-3 flex md:hidden items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}><Menu className="w-5 h-5" /></Button>
          <h1 className="font-semibold text-sm">TaskFlow Pro</h1>
        </header>
        <header className="hidden md:flex sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b px-6 py-3 items-center justify-between">
          <div /><ThemeToggle />
        </header>
        <div className="p-4 md:p-6 max-w-5xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div key={currentView} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
              {views[currentView]}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

/* ═══════════ PAGE ═══════════ */
export default function HomePage() {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <AppContent />
      </TooltipProvider>
    </NextThemesProvider>
  );
}
