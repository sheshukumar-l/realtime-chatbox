const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http, {
  cors: { origin: "*" }
});

app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

// In-memory rooms
const rooms = {};

// Create room
io.on("connection", socket => {
  
  socket.on("createRoom", (roomName, callback) => {
    if (!roomName || rooms[roomName]) {
      return callback({ ok: false, error: "Invalid or existing room" });
    }

    rooms[roomName] = [];
    callback({ ok: true });
  });

  // Join room
  socket.on("joinRoom", ({ username, room }, callback) => {
    if (!rooms[room]) {
      return callback({ ok: false, error: "Room does not exist" });
    }

    socket.join(room);
    socket.username = username;
    socket.room = room;

    socket.to(room).emit("userJoined", username);
    callback({ ok: true, messages: rooms[room] });
  });

  // Global chat
  socket.on("joinGlobal", (username, callback) => {
    socket.join("global");
    socket.username = username;
    callback({ ok: true });
  });

  // Send message
  socket.on("chatMessage", ({ username, msg, room }) => {
    const message = { username, msg };

    if (room === "global") {
      io.to("global").emit("chatMessage", message);
    } else {
      rooms[room].push(message);
      io.to(room).emit("chatMessage", message);
    }
  });

  socket.on("disconnect", () => {
    if (socket.room) {
      socket.to(socket.room).emit("userLeft", socket.username);
    }
  });
});

http.listen(PORT, () => console.log(`Server running on PORT ${PORT}`));