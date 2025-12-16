const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.static("public"));

const rooms = {}; // { roomName: Set(socketId) }

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  socket.on("joinRoom", ({ username, room }) => {
    if (!username || !room) return;

    socket.username = username;
    socket.room = room;

    socket.join(room);

    if (!rooms[room]) rooms[room] = new Set();
    rooms[room].add(socket.id);

    socket.emit("systemMessage", `You joined ${room}`);
    socket.to(room).emit("systemMessage", `${username} joined the room`);
  });

  socket.on("chatMessage", ({ room, username, text }) => {
    if (!text || !room) return;

    io.to(room).emit("chatMessage", {
      username,
      text
    });
  });

  socket.on("disconnect", () => {
    const room = socket.room;
    if (room && rooms[room]) {
      rooms[room].delete(socket.id);
      socket.to(room).emit(
        "systemMessage",
        `${socket.username || "User"} left the room`
      );
      if (rooms[room].size === 0) delete rooms[room];
    }
    console.log("Disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () =>
  console.log(`✅ Server running on PORT ${PORT}`)
);