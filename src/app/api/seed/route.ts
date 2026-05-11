import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST() {
  try {
    // Create preset users if they don't exist
    const users = [
      { username: "admin", password: "admin123", name: "Admin User", avatar: "A" },
      { username: "dev", password: "dev123", name: "Developer", avatar: "D" },
      { username: "business", password: "biz123", name: "Business Pro", avatar: "B" },
    ];

    for (const u of users) {
      await db.user.upsert({
        where: { username: u.username },
        update: {},
        create: u,
      });
    }

    const admin = await db.user.findUnique({ where: { username: "admin" } });
    if (!admin) return NextResponse.json({ error: "Seed failed" }, { status: 500 });

    // Create default categories
    const categories = [
      { name: "Development", icon: "code", color: "#10b981", userId: admin.id },
      { name: "Bug Fix", icon: "bug", color: "#ef4444", userId: admin.id },
      { name: "Meeting", icon: "users", color: "#8b5cf6", userId: admin.id },
      { name: "Business", icon: "briefcase", color: "#f59e0b", userId: admin.id },
      { name: "Personal", icon: "heart", color: "#ec4899", userId: admin.id },
      { name: "Health", icon: "activity", color: "#06b6d4", userId: admin.id },
      { name: "Learning", icon: "book-open", color: "#3b82f6", userId: admin.id },
      { name: "Social", icon: "message-circle", color: "#f97316", userId: admin.id },
    ];

    for (const c of categories) {
      await db.category.upsert({
        where: { name_userId: { name: c.name, userId: c.userId } },
        update: {},
        create: c,
      });
    }

    // Create sample tasks
    const allCats = await db.category.findMany({ where: { userId: admin.id } });
    const catMap = Object.fromEntries(allCats.map((c) => [c.name, c.id]));

    const today = new Date();
    const fmt = (d: Date) => d.toISOString().split("T")[0];

    const tasks = [
      { title: "Fix authentication bug in API", description: "Users getting 401 on valid tokens after refresh", status: "in-progress", priority: "urgent", dueDate: fmt(today), categoryId: catMap["Bug Fix"], tags: "backend,auth" },
      { title: "Review pull request #234", description: "New feature branch for payment integration", status: "todo", priority: "high", dueDate: fmt(today), categoryId: catMap["Development"], tags: "code-review" },
      { title: "Sprint planning meeting", description: "Plan next 2-week sprint with team", status: "todo", priority: "high", dueDate: fmt(new Date(today.getTime() + 86400000)), categoryId: catMap["Meeting"], tags: "agile,team" },
      { title: "Update project roadmap", description: "Q2 goals alignment and timeline revision", status: "todo", priority: "medium", dueDate: fmt(new Date(today.getTime() + 172800000)), categoryId: catMap["Business"], tags: "planning" },
      { title: "Gym session - Cardio", description: "30 min treadmill + 20 min cycling", status: "todo", priority: "low", dueDate: fmt(today), categoryId: catMap["Health"], tags: "fitness" },
      { title: "Read 'Designing Data-Intensive Applications' Ch.5", description: "Focus on replication and partitioning concepts", status: "todo", priority: "medium", dueDate: fmt(new Date(today.getTime() + 259200000)), categoryId: catMap["Learning"], tags: "reading,architecture" },
      { title: "Dinner with Alex and Sam", description: "Italian place downtown at 7:30 PM", status: "todo", priority: "medium", dueDate: fmt(new Date(today.getTime() + 86400000)), categoryId: catMap["Social"], tags: "dinner,friends" },
      { title: "Deploy v2.1 to staging", description: "Run full test suite before production push", status: "done", priority: "high", dueDate: fmt(new Date(today.getTime() - 86400000)), categoryId: catMap["Development"], tags: "devops,release", completedAt: new Date(today.getTime() - 86400000).toISOString() },
      { title: "Investor call follow-up", description: "Send updated financial projections", status: "done", priority: "urgent", dueDate: fmt(new Date(today.getTime() - 172800000)), categoryId: catMap["Business"], tags: "investors,followup", completedAt: new Date(today.getTime() - 172800000).toISOString() },
      { title: "Write unit tests for auth module", description: "Cover edge cases for token refresh flow", status: "todo", priority: "high", dueDate: fmt(new Date(today.getTime() + 345600000)), categoryId: catMap["Development"], tags: "testing,backend" },
      { title: "Call mom", description: "Weekly check-in call", status: "todo", priority: "medium", dueDate: fmt(new Date(today.getTime() + 86400000)), categoryId: catMap["Personal"], tags: "family" },
      { title: "Prepare quarterly business report", description: "Revenue, expenses, and projections for board meeting", status: "in-progress", priority: "urgent", dueDate: fmt(new Date(today.getTime() + 432000000)), categoryId: catMap["Business"], tags: "finance,report" },
    ];

    for (const t of tasks) {
      await db.task.create({ data: { ...t, userId: admin.id } });
    }

    return NextResponse.json({ success: true, message: "Database seeded successfully" });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
