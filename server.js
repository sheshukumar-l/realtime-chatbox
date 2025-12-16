const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
app.use(cors());
app.use(express.static("public"));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const rooms = {}; // { roomCode: { password, users:Set } }

io.on("connection", (socket) => {

  socket.on("joinGlobal", (username) => {
    socket.username = username;
    socket.room = "global";
    socket.join("global");

    io.to("global").emit("message", {
      user: "System",
      text: `${username} joined Global Chat`
    });
  });

  socket.on("createPrivateRoom", ({ username, password }, cb) => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    rooms[code] = {
      password,
      users: new Set()
    };

    socket.username = username;
    socket.room = code;
    rooms[code].users.add(socket.id);
    socket.join(code);

    cb({ code });

    io.to(code).emit("message", {
      user: "System",
      text: `${username} created the room`
    });
  });

  socket.on("joinPrivateRoom", ({ username, code, password }, cb) => {
    if (!rooms[code] || rooms[code].password !== password) {
      return cb({ error: "Invalid room code or password" });
    }

    socket.username = username;
    socket.room = code;
    rooms[code].users.add(socket.id);
    socket.join(code);

    cb({ success: true });

    io.to(code).emit("message", {
      user: "System",
      text: `${username} joined the room`
    });
  });

  socket.on("sendMessage", (text) => {
    if (!socket.room) return;

    io.to(socket.room).emit("message", {
      user: socket.username,
      text
    });
  });

  socket.on("typing", (isTyping) => {
    socket.to(socket.room).emit("typing", {
      user: socket.username,
      isTyping
    });
  });

  socket.on("leaveRoom", () => {
    if (!socket.room) return;

    socket.leave(socket.room);
    socket.to(socket.room).emit("message", {
      user: "System",
      text: `${socket.username} left the room`
    });

    socket.room = null;
  });

  socket.on("disconnect", () => {
    if (socket.room && rooms[socket.room]) {
      rooms[socket.room].users.delete(socket.id);
    }
  });
});

server.listen(process.env.PORT || 3000, () => {
  console.log("Server running");
});