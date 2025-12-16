const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

/* CORS */
app.use(
  cors({
    origin: [
      "https://realtimechatbox.netlify.app",
      "http://localhost:5500",
    ],
  })
);

const io = new Server(server, {
  cors: {
    origin: [
      "https://realtimechatbox.netlify.app",
      "http://localhost:5500",
    ],
    methods: ["GET", "POST"],
  },
});

/* Storage */
const privateRooms = {};

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  socket.on("joinGlobal", (username) => {
    socket.username = username;
    socket.join("global");
    io.to("global").emit("notice", `${username} joined global chat`);
  });

  socket.on("createPrivate", (username, cb) => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const password = Math.random().toString(36).slice(2, 8);

    privateRooms[code] = password;
    socket.username = username;
    socket.join(code);

    cb({ code, password });
  });

  socket.on("joinPrivate", ({ username, code, password }, cb) => {
    if (!privateRooms[code]) {
      return cb({ ok: false, msg: "Room not found" });
    }
    if (privateRooms[code] !== password) {
      return cb({ ok: false, msg: "Wrong password" });
    }

    socket.username = username;
    socket.join(code);
    cb({ ok: true });
  });

  socket.on("chatMessage", ({ room, text }) => {
    socket.to(room).emit("chatMessage", {
      user: socket.username,
      text,
    });
  });

  socket.on("leaveRoom", (room) => {
    socket.leave(room);
  });

  socket.on("disconnect", () => {
    console.log("Disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);