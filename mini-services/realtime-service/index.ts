// @ts-nocheck — This is a standalone microservice, not part of the Next.js app.
// It has its own dependencies (socket.io) and runs separately.
// tsconfig.json excludes "mini-services" from the Next.js build.
import { Server } from "socket.io";

const PORT = 3003;

const io = new Server(PORT, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

const userSockets = new Map<string, string>(); // userId -> socketId

io.on("connection", (socket) => {
  console.log(`[WS] Connected: ${socket.id}`);

  socket.on("join", (userId: string) => {
    userSockets.set(userId, socket.id);
    socket.join(userId);
    console.log(`[WS] User ${userId} joined (socket: ${socket.id})`);
  });

  socket.on("task_update", (data: { projectId?: string; task: any; userId: string }) => {
    // Broadcast to all users in the project room
    if (data.projectId) {
      socket.to(data.projectId).emit("task_changed", data);
    }
  });

  socket.on("join_project", (projectId: string) => {
    socket.join(projectId);
    console.log(`[WS] Socket ${socket.id} joined project ${projectId}`);
  });

  socket.on("leave_project", (projectId: string) => {
    socket.leave(projectId);
  });

  socket.on("notify", (data: { userId: string; type: string; payload: any }) => {
    socket.to(data.userId).emit("notification", data);
  });

  socket.on("disconnect", () => {
    for (const [uid, sid] of userSockets.entries()) {
      if (sid === socket.id) { userSockets.delete(uid); break; }
    }
    console.log(`[WS] Disconnected: ${socket.id}`);
  });
});

console.log(`[WS] Real-time service running on port ${PORT}`);
