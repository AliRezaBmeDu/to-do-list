"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { useAppStore, ViewMode } from "@/store/useAppStore";
import { useSocialStore } from "@/store/useSocialStore";
import { format, isToday, isTomorrow, isYesterday, isSameMonth, parseISO, isValid, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, List, CalendarDays, Tags, LogOut, Plus, Search,
  ChevronLeft, ChevronRight, Clock, AlertTriangle, Flag,
  MoreHorizontal, Trash2, Edit3, Loader2,
  Sun, Moon, Menu, Code, Bug, Users, Briefcase, Heart, Activity,
  BookOpen, MessageCircle, Tag, TrendingUp, CheckCircle2, Circle,
  Timer, ArrowUpRight, ArrowDownRight, Sparkles,
  UserPlus, UserMinus, Send, Bell, MessageSquare, FolderKanban,
  UserCheck, UserX, Eye, ArrowRight
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
function LoginPage() {
  const login = useAppStore((s) => s.login);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
            </form>
            <div className="mt-6 pt-4 border-t">
              <p className="text-xs text-muted-foreground text-center mb-3">Demo Credentials</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { user: "admin", pass: "admin123", label: "Admin" },
                  { user: "dev", pass: "dev123", label: "Developer" },
                  { user: "business", pass: "biz123", label: "Business" },
                ].map((c) => (
                  <button key={c.user} type="button" onClick={() => { setUsername(c.user); setPassword(c.pass); }} className="text-xs px-3 py-2 rounded-lg border hover:bg-accent transition-colors">{c.label}</button>
                ))}
              </div>
            </div>
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
    { id: "projects", label: "Projects", icon: FolderKanban },
    { id: "friends", label: "Friends", icon: Users },
    { id: "categories", label: "Categories", icon: Tags },
  ];
  const pendingTasks = tasks.filter((t) => t.status !== "done").length;
  const { unreadCount } = useSocialStore();

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
function TaskFormInner({ editTask, categories, onSave, onCancel, projectId, members }: {
  editTask?: any; categories: any[]; onSave: (data: any) => Promise<void>; onCancel: () => void; projectId?: string; members?: any[];
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
  const [assigneeId, setAssigneeId] = useState(editTask?.assigneeId || "none");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    await onSave({
      title, description, status, priority, dueDate: dueDate || null,
      dueTime: dueTime || null, categoryId: categoryId === "none" ? null : categoryId || null,
      tags, isRecurring, recurRule: recurRule || null,
      ...(projectId ? { projectId } : {}),
      ...(assigneeId !== "none" ? { assigneeId } : {}),
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
      {members && members.length > 0 && (
        <div className="space-y-2">
          <Label>Assign To</Label>
          <Select value={assigneeId} onValueChange={setAssigneeId}>
            <SelectTrigger><SelectValue placeholder="Assign to member" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Unassigned</SelectItem>
              {members.map((m: any) => (
                <SelectItem key={m.userId} value={m.userId}>{m.user?.name || "Unknown"}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
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
function TaskFormDialog({ open, onOpenChange, editTask, projectId, members }: { open: boolean; onOpenChange: (o: boolean) => void; editTask?: any; projectId?: string; members?: any[] }) {
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
        {open && <TaskFormInner key={dialogKey} editTask={editTask} categories={categories} onSave={handleSave} onCancel={() => onOpenChange(false)} projectId={projectId} members={members} />}
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

/* ═══════════ FRIENDS VIEW ═══════════ */
function FriendsView() {
  const { friends, pendingRequests, discoverUsers, friendsLoading, fetchFriendsData, sendFriendRequest, acceptFriendRequest, rejectFriendRequest } = useSocialStore();
  const [tab, setTab] = useState<"friends" | "requests" | "discover">("friends");
  const [search, setSearch] = useState("");

  useEffect(() => { fetchFriendsData(); }, [fetchFriendsData]);

  const filteredDiscover = search ? discoverUsers.filter((u) => u.name.toLowerCase().includes(search.toLowerCase()) || u.username.toLowerCase().includes(search.toLowerCase())) : discoverUsers;

  return (
    <div className="space-y-4">
      <div><h1 className="text-xl font-bold">Friends</h1><p className="text-sm text-muted-foreground">Manage your connections</p></div>
      <div className="flex gap-2">
        {(["friends", "requests", "discover"] as const).map((t) => {
          const cfg = { friends: { label: "Friends", count: friends.length }, requests: { label: "Requests", count: pendingRequests.length }, discover: { label: "Discover", count: 0 } };
          return (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === t ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md" : "bg-muted hover:bg-accent"}`}>
              {cfg[t].label} {cfg[t].count > 0 && <span className="ml-1 text-xs opacity-80">({cfg[t].count})</span>}
            </button>
          );
        })}
      </div>

      {tab === "discover" && (
        <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" /></div>
      )}

      <ScrollArea className="h-[calc(100vh-300px)]">
        {friendsLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-emerald-500" /></div>
        ) : tab === "friends" ? (
          friends.length === 0 ? <div className="text-center py-12 text-muted-foreground"><Users className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No friends yet. Discover users to connect!</p></div> : (
            <div className="space-y-2">
              {friends.map((f) => (
                <div key={f.id} className="flex items-center gap-3 p-3 rounded-xl border hover:shadow-sm transition-all">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold">{(f.avatar || f.name[0])}</div>
                  <div className="flex-1 min-w-0"><p className="font-medium text-sm">{f.name}</p><p className="text-[10px] text-muted-foreground">@{f.username}</p></div>
                  <Badge variant="secondary" className="text-[10px] border-0"><UserCheck className="w-3 h-3 mr-1" />Friends</Badge>
                </div>
              ))}
            </div>
          )
        ) : tab === "requests" ? (
          pendingRequests.length === 0 ? <div className="text-center py-12 text-muted-foreground"><Bell className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No pending requests</p></div> : (
            <div className="space-y-2">
              {pendingRequests.map((r) => {
                const isIncoming = r.receiver?.id === useAppStore.getState().user?.id;
                const other = isIncoming ? r.sender : r.receiver;
                return (
                  <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl border">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-bold">{(other?.avatar || other?.name?.[0] || "?")}</div>
                    <div className="flex-1 min-w-0"><p className="font-medium text-sm">{other?.name}</p><p className="text-[10px] text-muted-foreground">@{other?.username}</p></div>
                    {isIncoming ? (
                      <div className="flex gap-1.5">
                        <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700" onClick={() => acceptFriendRequest(r.id)}><UserCheck className="w-3 h-3 mr-1" />Accept</Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => rejectFriendRequest(r.id)}><UserX className="w-3 h-3 mr-1" />Decline</Button>
                      </div>
                    ) : (
                      <Badge variant="secondary" className="text-[10px] border-0"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
                    )}
                  </div>
                );
              })}
            </div>
          )
        ) : (
          filteredDiscover.length === 0 ? <div className="text-center py-12 text-muted-foreground"><UserPlus className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No users found</p></div> : (
            <div className="space-y-2">
              {filteredDiscover.map((u) => (
                <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl border hover:shadow-sm transition-all">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center text-white font-bold">{(u.avatar || u.name[0])}</div>
                  <div className="flex-1 min-w-0"><p className="font-medium text-sm">{u.name}</p><p className="text-[10px] text-muted-foreground">@{u.username}</p></div>
                  <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700" onClick={() => sendFriendRequest(u.id)}><UserPlus className="w-3 h-3 mr-1" />Add</Button>
                </div>
              ))}
            </div>
          )
        )}
      </ScrollArea>
    </div>
  );
}

/* ═══════════ PROJECTS VIEW ═══════════ */
function ProjectsView() {
  const { projects, projectsLoading, fetchProjects, createProject, deleteProject } = useSocialStore();
  const { setCurrentView, setSelectedProjectId } = useAppStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#10b981");

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const colorOptions = ["#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#3b82f6", "#ec4899", "#06b6d4", "#f97316"];

  const handleCreate = async () => {
    if (!name.trim()) return;
    const p = await createProject({ name, description, color });
    if (p) { toast.success("Project created!"); setDialogOpen(false); setName(""); setDescription(""); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold">Projects</h1><p className="text-sm text-muted-foreground">Collaborate with your team</p></div>
        <Button onClick={() => setDialogOpen(true)} className="bg-gradient-to-r from-emerald-600 to-teal-600 gap-1.5"><Plus className="w-4 h-4" /> New Project</Button>
      </div>

      {projectsLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-emerald-500" /></div>
      ) : projects.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground"><FolderKanban className="w-16 h-16 mx-auto mb-4 opacity-20" /><p className="text-lg font-medium">No projects yet</p><p className="text-sm mt-1">Create a project and invite friends to collaborate!</p></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {projects.map((p) => {
            const doneCount = p.tasks?.filter((t: any) => t.status === "done").length || 0;
            const totalCount = p.tasks?.length || p._count?.tasks || 0;
            const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
            return (
              <Card key={p.id} className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer group" onClick={() => { setSelectedProjectId(p.id); setCurrentView("project-detail"); }}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                      <h3 className="font-semibold text-sm">{p.name}</h3>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); deleteProject(p.id); toast.success("Project deleted"); }}><Trash2 className="w-3 h-3 text-red-500" /></Button>
                  </div>
                  {p.description && <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{p.description}</p>}
                  <div className="flex items-center gap-3 mt-3 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{p.members?.length || 0} members</span>
                    <span className="flex items-center gap-1"><List className="w-3 h-3" />{totalCount} tasks</span>
                  </div>
                  {totalCount > 0 && (
                    <div className="mt-2"><Progress value={pct} className="h-1" /><p className="text-[10px] text-muted-foreground mt-0.5">{pct}% complete</p></div>
                  )}
                  <div className="flex -space-x-2 mt-2">
                    {p.members?.slice(0, 5).map((m) => (
                      <div key={m.id} className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-[8px] font-bold border-2 border-background">{(m.user.avatar || m.user.name[0])}</div>
                    ))}
                    {(p.members?.length || 0) > 5 && <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[8px] border-2 border-background">+{p.members.length - 5}</div>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Create Project</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Project name" /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's this project about?" rows={2} /></div>
            <div className="space-y-2"><Label>Color</Label><div className="flex gap-2">{colorOptions.map((c) => (<button key={c} onClick={() => setColor(c)} className={`w-8 h-8 rounded-full border-2 transition-all ${color === c ? "border-foreground scale-110" : "border-transparent"}`} style={{ backgroundColor: c }} />))}</div></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={handleCreate} className="bg-gradient-to-r from-emerald-600 to-teal-600">Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ═══════════ PROJECT DETAIL VIEW ═══════════ */
function ProjectDetailView() {
  const { selectedProjectId, setCurrentView, categories } = useAppStore();
  const { currentProject, fetchProjectDetail, addProjectTask, updateProjectTask, addProjectMember, removeProjectMember, taskComments, fetchComments, addComment } = useSocialStore();
  const { friends } = useSocialStore();
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [commentTaskId, setCommentTaskId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");

  useEffect(() => {
    if (selectedProjectId) fetchProjectDetail(selectedProjectId);
  }, [selectedProjectId, fetchProjectDetail]);

  useEffect(() => {
    if (commentTaskId) fetchComments(commentTaskId);
  }, [commentTaskId, fetchComments]);

  if (!currentProject) return <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin text-emerald-500 mx-auto" /></div>;

  const isOwner = currentProject.ownerId === useAppStore.getState().user?.id;
  const projectTasks = currentProject.tasks || [];
  const doneTasks = projectTasks.filter((t: any) => t.status === "done").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setCurrentView("projects")}><ChevronLeft className="w-4 h-4" /></Button>
        <div className="flex-1">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: currentProject.color }} /><h1 className="text-xl font-bold">{currentProject.name}</h1></div>
          {currentProject.description && <p className="text-sm text-muted-foreground">{currentProject.description}</p>}
        </div>
        <Button onClick={() => setTaskDialogOpen(true)} className="bg-gradient-to-r from-emerald-600 to-teal-600 gap-1.5"><Plus className="w-4 h-4" /> Add Task</Button>
        <Button variant="outline" onClick={() => setMemberDialogOpen(true)} className="gap-1.5"><UserPlus className="w-4 h-4" /> Members</Button>
      </div>

      {/* Members bar */}
      <div className="flex items-center gap-2">
        <div className="flex -space-x-2">
          {currentProject.members?.map((m) => (
            <div key={m.id} className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-[9px] font-bold border-2 border-background" title={`${m.user.name} (${m.role})`}>{(m.user.avatar || m.user.name[0])}</div>
          ))}
        </div>
        <span className="text-xs text-muted-foreground">{currentProject.members?.length} members</span>
        <Separator orientation="vertical" className="h-4" />
        <span className="text-xs text-muted-foreground">{doneTasks}/{projectTasks.length} tasks done</span>
      </div>

      {/* Task list */}
      <ScrollArea className="h-[calc(100vh-320px)]">
        {projectTasks.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground"><List className="w-12 h-12 mx-auto mb-3 opacity-20" /><p>No tasks in this project yet</p></div>
        ) : (
          <div className="space-y-2">
            {projectTasks.map((task: any) => {
              const pCfg = priorityConfig[task.priority] || priorityConfig.medium;
              const sCfg = statusConfig[task.status] || statusConfig.todo;
              const taskCommentCount = task.comments?.length || 0;
              return (
                <div key={task.id} className="group flex gap-3 p-3 rounded-xl border hover:shadow-sm transition-all">
                  <button onClick={() => updateProjectTask(task.id, { status: task.status === "done" ? "todo" : "done" })} className="mt-0.5 flex-shrink-0">
                    {task.status === "done" ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Circle className="w-5 h-5 text-muted-foreground hover:text-emerald-500" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className={`text-sm font-medium ${task.status === "done" ? "line-through text-muted-foreground" : ""}`}>{task.title}</h4>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => { setCommentTaskId(commentTaskId === task.id ? null : task.id); setCommentText(""); }}><MessageSquare className="w-3 h-3" /></Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 h-5 ${pCfg.bg} ${pCfg.color} border-0`}>{pCfg.label}</Badge>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 border-0"><div className={`w-1.5 h-1.5 rounded-full ${sCfg.color} mr-1`} />{sCfg.label}</Badge>
                      {task.assignee && <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">{task.assignee.name}</Badge>}
                      {taskCommentCount > 0 && <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><MessageSquare className="w-2.5 h-2.5" />{taskCommentCount}</span>}
                    </div>
                    {/* Comments section */}
                    {commentTaskId === task.id && (
                      <div className="mt-2 pt-2 border-t space-y-2">
                        {task.comments?.map((c: any) => (
                          <div key={c.id} className="flex gap-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center text-white text-[8px] font-bold flex-shrink-0">{(c.user.avatar || c.user.name[0])}</div>
                            <div className="flex-1 min-w-0"><p className="text-[10px] font-medium">{c.user.name} <span className="font-normal text-muted-foreground">{format(new Date(c.createdAt), "MMM d, h:mm a")}</span></p><p className="text-xs">{c.content}</p></div>
                          </div>
                        ))}
                        <div className="flex gap-2">
                          <Input placeholder="Add a comment..." value={commentText} onChange={(e) => setCommentText(e.target.value)} className="h-7 text-xs" onKeyDown={(e) => { if (e.key === "Enter" && commentText.trim()) { addComment(task.id, commentText); setCommentText(""); } }} />
                          <Button size="sm" className="h-7 text-xs bg-emerald-600" onClick={() => { if (commentText.trim()) { addComment(task.id, commentText); setCommentText(""); } }}><Send className="w-3 h-3" /></Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Add Task Dialog */}
      <TaskFormDialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen} editTask={undefined} projectId={selectedProjectId!} members={currentProject.members || []} />

      {/* Manage Members Dialog */}
      <Dialog open={memberDialogOpen} onOpenChange={setMemberDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Manage Members</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase">Current Members</h4>
            <div className="space-y-2">
              {currentProject.members?.map((m) => (
                <div key={m.id} className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-[9px] font-bold">{(m.user.avatar || m.user.name[0])}</div>
                  <span className="text-sm flex-1">{m.user.name}</span>
                  <Badge variant="secondary" className="text-[9px] border-0">{m.role}</Badge>
                  {isOwner && m.role !== "owner" && <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { removeProjectMember(currentProject.id, m.userId); toast.success("Member removed"); }}><UserMinus className="w-3 h-3 text-red-500" /></Button>}
                </div>
              ))}
            </div>
            {friends.length > 0 && (<>
              <Separator />
              <h4 className="text-xs font-semibold text-muted-foreground uppercase">Add from Friends</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {friends.filter((f) => !currentProject.members?.some((m) => m.userId === f.id)).map((f) => (
                  <div key={f.id} className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-[9px] font-bold">{(f.avatar || f.name[0])}</div>
                    <span className="text-sm flex-1">{f.name}</span>
                    <Button size="sm" className="h-6 text-xs bg-emerald-600" onClick={() => { addProjectMember(currentProject.id, f.id); toast.success("Member added!"); }}><UserPlus className="w-3 h-3 mr-1" />Add</Button>
                  </div>
                ))}
              </div>
            </>)}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ═══════════ NOTIFICATION BELL ═══════════ */
function NotificationBell() {
  const { notifications, unreadCount, fetchNotifications, markAllNotificationsRead } = useSocialStore();
  const [open, setOpen] = useState(false);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[8px] rounded-full flex items-center justify-center font-bold">{unreadCount > 9 ? "9+" : unreadCount}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-2">
          <span className="text-sm font-semibold">Notifications</span>
          {unreadCount > 0 && <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => markAllNotificationsRead()}>Mark all read</Button>}
        </div>
        <Separator />
        <div className="max-h-64 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No notifications</p>
          ) : (
            notifications.slice(0, 10).map((n) => (
              <div key={n.id} className={`px-3 py-2 text-xs hover:bg-accent/50 cursor-pointer ${!n.read ? "bg-emerald-50 dark:bg-emerald-950/30" : ""}`}>
                <p className="font-medium">{n.title}</p>
                {n.body && <p className="text-muted-foreground mt-0.5">{n.body}</p>}
                <p className="text-[10px] text-muted-foreground mt-0.5">{format(new Date(n.createdAt), "MMM d, h:mm a")}</p>
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
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
    dashboard: <DashboardView />, tasks: <TaskListView />, monthly: <MonthlyView />, calendar: <CalendarView />,
    projects: <ProjectsView />, friends: <FriendsView />, "project-detail": <ProjectDetailView />, categories: <CategoriesView />,
  };

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="hidden md:flex w-64 flex-col border-r bg-card h-screen sticky top-0"><SidebarNav /></aside>
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}><SheetContent side="left" className="p-0 w-64"><SidebarNav onNavClose={() => setSidebarOpen(false)} /></SheetContent></Sheet>
      <main className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b px-4 py-3 flex md:hidden items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}><Menu className="w-5 h-5" /></Button>
          <h1 className="font-semibold text-sm flex-1">TaskFlow Pro</h1>
          <NotificationBell />
        </header>
        <header className="hidden md:flex sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b px-6 py-3 items-center justify-between">
          <div />
          <div className="flex items-center gap-1"><NotificationBell /><ThemeToggle /></div>
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
