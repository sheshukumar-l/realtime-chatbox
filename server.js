const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// In-memory rooms
const privateRooms = {};

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  // GLOBAL CHAT
  socket.on("join-global", (username) => {
    socket.username = username;
    socket.join("global");

    io.to("global").emit("message", {
      user: "System",
      text: `${username} joined Global chat`
    });
  });

  socket.on("global-message", (text) => {
    io.to("global").emit("message", {
      user: socket.username,
      text
    });
  });

  // CREATE PRIVATE ROOM
  socket.on("create-private", ({ username, password }, cb) => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    privateRooms[code] = {
      password,
      users: []
    };

    cb({ code });
  });

  // JOIN PRIVATE ROOM
  socket.on("join-private", ({ username, code, password }, cb) => {
    const room = privateRooms[code];

    if (!room || room.password !== password) {
      return cb({ error: "Invalid room or password" });
    }

    socket.username = username;
    socket.join(code);
    room.users.push(username);

    io.to(code).emit("message", {
      user: "System",
      text: `${username} joined private room`
    });

    cb({ success: true });
  });

  socket.on("private-message", ({ code, text }) => {
    io.to(code).emit("message", {
      user: socket.username,
      text
    });
  });

  socket.on("disconnect", () => {
    console.log("Disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () =>
  console.log("Server running on", PORT)
);