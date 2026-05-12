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

    // Create friend requests between preset users
    const devUser = await db.user.findUnique({ where: { username: "dev" } });
    const bizUser = await db.user.findUnique({ where: { username: "business" } });
    if (devUser && bizUser) {
      // Admin is friends with dev
      await db.friendRequest.upsert({
        where: { senderId_receiverId: { senderId: admin.id, receiverId: devUser.id } },
        update: {},
        create: { senderId: admin.id, receiverId: devUser.id, status: "accepted" },
      });
      // Business sent request to admin (pending)
      const existingReq = await db.friendRequest.findUnique({
        where: { senderId_receiverId: { senderId: bizUser.id, receiverId: admin.id } },
      });
      if (!existingReq) {
        await db.friendRequest.create({ data: { senderId: bizUser.id, receiverId: admin.id, status: "pending" } });
        await db.notification.create({ data: { userId: admin.id, type: "friend_request", title: "Friend Request", body: "Business Pro sent you a friend request", linkId: "seed" } });
      }
      // Dev and biz are friends
      await db.friendRequest.upsert({
        where: { senderId_receiverId: { senderId: devUser.id, receiverId: bizUser.id } },
        update: {},
        create: { senderId: devUser.id, receiverId: bizUser.id, status: "accepted" },
      });
    }

    // Create a sample project
    if (devUser) {
      const existingProject = await db.project.findFirst({ where: { name: "TaskFlow v2.0" } });
      if (!existingProject) {
        const project = await db.project.create({
          data: {
            name: "TaskFlow v2.0",
            description: "Next major release with social features and real-time collaboration",
            color: "#8b5cf6",
            ownerId: admin.id,
            members: {
              create: [
                { userId: admin.id, role: "owner" },
                { userId: devUser.id, role: "admin" },
              ],
            },
          },
        });
        // Add project tasks
        await db.task.createMany({
          data: [
            { title: "Design social features mockup", description: "Create Figma mockups for friends, projects, and notifications", status: "done", priority: "high", projectId: project.id, userId: admin.id, assigneeId: devUser.id, completedAt: new Date().toISOString() },
            { title: "Implement friend request system", description: "Backend API + frontend UI for sending/accepting requests", status: "in-progress", priority: "urgent", projectId: project.id, userId: admin.id, assigneeId: devUser.id },
            { title: "Build project collaboration UI", description: "Project detail view with tasks, members, and comments", status: "todo", priority: "high", projectId: project.id, userId: admin.id },
            { title: "Add real-time notifications", description: "WebSocket integration for live task updates", status: "todo", priority: "medium", projectId: project.id, userId: admin.id, assigneeId: devUser.id },
            { title: "Write integration tests", description: "E2E tests for social features", status: "todo", priority: "medium", projectId: project.id, userId: admin.id },
          ],
        });
        // Add a comment on the first task
        const firstTask = await db.task.findFirst({ where: { projectId: project.id } });
        if (firstTask) {
          await db.comment.create({ data: { content: "Great progress on this! The mockups look solid.", taskId: firstTask.id, userId: devUser.id } });
        }
      }
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
