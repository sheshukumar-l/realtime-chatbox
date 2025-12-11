// server.js
const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http, {
  cors: { origin: "*" }
});
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

// In-memory rooms & messages (simple demo)
const rooms = {
  global: { members: new Set(), messages: [] }
};

function msgObj(username, msg, type = "text") {
  return {
    id:` ${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
    username,
    msg,
    type,
    ts: new Date().toISOString()
  };
}

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  // create room
  socket.on("createRoom", (roomName, cb) => {
    if (!roomName || rooms[roomName]) return cb && cb({ ok: false, error: "Invalid or existing room" });
    rooms[roomName] = { members: new Set(), messages: [] };
    return cb && cb({ ok: true });
  });

  // join global
  socket.on("joinGlobal", (username, cb) => {
    socket.join("global");
    socket.username = username;
    rooms.global.members.add(socket.id);
    io.to("global").emit("userJoined", username);
    return cb && cb({ ok: true, messages: rooms.global.messages });
  });

  // join room
  socket.on("joinRoom", ({ username, room }, cb) => {
    if (!rooms[room]) return cb && cb({ ok: false, error: "Room does not exist" });
    // leave any previous room
    if (socket.room) {
      const prev = socket.room;
      socket.leave(prev);
      rooms[prev].members.delete(socket.id);
      io.to(prev).emit("userLeft", socket.username || "Unknown");
    }

    socket.join(room);
    socket.room = room;
    socket.username = username;
    rooms[room].members.add(socket.id);

    io.to(room).emit("userJoined", username);
    return cb && cb({ ok: true, messages: rooms[room].messages });
  });

  // leave room
  socket.on("leaveRoom", (cb) => {
    if (!socket.room) return cb && cb({ ok: false });
    const r = socket.room;
    socket.leave(r);
    rooms[r].members.delete(socket.id);
    io.to(r).emit("userLeft", socket.username || "Unknown");
    delete socket.room;
    return cb && cb({ ok: true });
  });

  // chat message
  socket.on("chatMessage", (data) => {
    // data: { username, msg, room, type? }
    if (!data || !data.room) return;
    const m = msgObj(data.username, data.msg, data.type || "text");
    if (!rooms[data.room]) rooms[data.room] = { members: new Set(), messages: [] };
    rooms[data.room].messages.push(m);
    if (rooms[data.room].messages.length > 300) rooms[data.room].messages.shift();
    io.to(data.room).emit("chatMessage", m);
  });

  // typing indicator
  socket.on("typing", ({ room, username, isTyping }) => {
    if (!room) return;
    socket.to(room).emit("typing", { username, isTyping });
  });

  socket.on("disconnect", () => {
    if (socket.room && rooms[socket.room]) {
      rooms[socket.room].members.delete(socket.id);
      io.to(socket.room).emit("userLeft", socket.username || "Unknown");
    }
    console.log("Disconnected:", socket.id);
  });
});

http.listen(PORT, () => console.log(`Server running on PORT ${PORT}`));