const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

/* ✅ CORS CONFIG (VERY IMPORTANT) */
app.use(
  cors({
    origin: [
      "https://realtimechatbox.netlify.app",
      "http://localhost:5500",
      "http://127.0.0.1:5500",
    ],
    methods: ["GET", "POST"],
  })
);

/* Socket.IO with CORS */
const io = new Server(server, {
  cors: {
    origin: [
      "https://realtimechatbox.netlify.app",
      "http://localhost:5500",
    ],
    methods: ["GET", "POST"],
  },
});

/* Room storage */
const privateRooms = {};

/* SOCKET LOGIC */
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  /* Global chat */
  socket.on("joinGlobal", (username) => {
    socket.username = username;
    socket.join("global");
  });

  /* Create private room */
  socket.on("createPrivate", (username, cb) => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const password = Math.random().toString(36).slice(2, 8);

    privateRooms[code] = { password };
    socket.username = username;
    socket.join(code);

    cb({ code, password });
  });

  /* Join private room */
  socket.on("joinPrivate", ({ username, code, pass }, cb) => {
    if (!privateRooms[code]) {
      return cb({ ok: false, error: "Room not found" });
    }
    if (privateRooms[code].password !== pass) {
      return cb({ ok: false, error: "Wrong password" });
    }

    socket.username = username;
    socket.join(code);
    cb({ ok: true });
  });

  /* Chat messages */
  socket.on("chatMessage", ({ room, text }) => {
    socket.to(room).emit("chatMessage", {
      user: socket.username,
      text,
    });
  });

  /* Leave room */
  socket.on("leaveRoom", (room) => {
    socket.leave(room);
  });

  socket.on("disconnect", () => {
    console.log("Disconnected:", socket.id);
  });
});

/* Server start */
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});