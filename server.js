const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // allow Netlify frontend
    methods: ["GET", "POST"]
  }
});

/* =========================
   IN-MEMORY STORAGE
========================= */
const privateRooms = {}; // code -> { password, users: [] }

/* =========================
   SOCKET HANDLING
========================= */
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  /* JOIN GLOBAL CHAT */
  socket.on("joinGlobal", ({ username }) => {
    socket.join("global");
    socket.username = username;
    socket.room = "global";

    io.to("global").emit("systemMessage", `${username} joined Global Chat`);
  });

  /* CREATE PRIVATE ROOM */
  socket.on("createPrivate", ({ username, password }) => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    privateRooms[code] = {
      password,
      users: [socket.id]
    };

    socket.join(code);
    socket.username = username;
    socket.room = code;

    socket.emit("privateCreated", { code });
    io.to(code).emit("systemMessage", `${username} created the room`);
  });

  /* JOIN PRIVATE ROOM */
  socket.on("joinPrivate", ({ username, code }) => {
    const room = privateRooms[code];

    if (!room) {
      socket.emit("errorMessage", "Invalid room code");
      return;
    }

    socket.join(code);
    room.users.push(socket.id);

    socket.username = username;
    socket.room = code;

    socket.emit("joinedPrivate", { code });
    io.to(code).emit("systemMessage", `${username} joined the room`);
  });

  /* CHAT MESSAGE (🔥 THIS WAS MISSING / BROKEN BEFORE) */
  socket.on("chatMessage", ({ room, username, message }) => {
    if (!room || !message) return;

    io.to(room).emit("chatMessage", {
      username,
      message
    });
  });

  /* LEAVE ROOM */
  socket.on("leaveRoom", ({ room, username }) => {
    socket.leave(room);
    io.to(room).emit("systemMessage", `${username} left the chat`);
  });

  /* DISCONNECT */
  socket.on("disconnect", () => {
    if (socket.room && socket.username) {
      io.to(socket.room).emit(
        "systemMessage",
        `${socket.username} disconnected`
      );
    }
    console.log("User disconnected:", socket.id);
  });
});

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Server running on port", PORT);
});