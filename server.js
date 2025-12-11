// server.js
const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http, {
  cors: { origin: "*" }
});
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

// In-memory store
const users = {}; // socketId -> { username, room, matchedWith }
const rooms = {}; // roomName -> { password: string|null, members:Set(socketId), messages: [{id,username,msg,ts,type}], createdAt }

// Global room name
const GLOBAL = "global";

// ensure global exists
rooms[GLOBAL] = { password: null, members: new Set(), messages: [], createdAt: Date.now() };

// Helpers
function getRoomList() {
  return Object.keys(rooms).map(name => ({
    name,
    hasPassword: !!rooms[name].password,
    users: rooms[name].members.size
  }));
}

function timestampNow() {
  return new Date().toISOString();
}

function messageObj(username, msg, type = "text") {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
    username,
    msg,
    type,
    ts: timestampNow()
  };
}

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  // Send current rooms list
  socket.on("getRooms", (cb) => {
    cb && cb(getRoomList());
  });

  // Create a room (with optional password)
  socket.on("createRoom", ({ name, password }, cb) => {
    if (!name) return cb && cb({ ok: false, error: "Invalid room name" });
    if (rooms[name]) return cb && cb({ ok: false, error: "Room already exists" });
    rooms[name] = { password: password || null, members: new Set(), messages: [], createdAt: Date.now() };
    io.emit("roomsUpdated", getRoomList());
    cb && cb({ ok: true });
  });

  // Join Global
  socket.on("joinGlobal", (username, cb) => {
    if (!username) return cb && cb({ ok: false, error: "No username" });
    // Leave previous
    const prev = users[socket.id]?.room;
    if (prev) {
      leaveRoomInternal(socket, prev);
    }
    users[socket.id] = { username, room: GLOBAL, matchedWith: null };
    rooms[GLOBAL].members.add(socket.id);
    socket.join(GLOBAL);
    io.to(GLOBAL).emit("userJoined", username);
    io.to(GLOBAL).emit("roomUsers", Array.from(rooms[GLOBAL].members).map(id => users[id].username));
    cb && cb({ ok: true, room: GLOBAL, messages: rooms[GLOBAL].messages });
    io.emit("roomsUpdated", getRoomList());
  });

  // Join a room (private or public)
  socket.on("joinRoom", ({ username, room, password }, cb) => {
    if (!username || !room) return cb && cb({ ok: false, error: "Missing data" });
    // check room exists
    const meta = rooms[room];
    if (!meta) return cb && cb({ ok: false, error: "Room not found" });
    if (meta.password && meta.password !== (password || "")) {
      return cb && cb({ ok: false, error: "Wrong password" });
    }

    // Leave previous room if any
    const prev = users[socket.id]?.room;
    if (prev) {
      leaveRoomInternal(socket, prev);
    }

    users[socket.id] = { username, room, matchedWith: null };
    meta.members.add(socket.id);
    socket.join(room);

    io.to(room).emit("userJoined", username);
    io.to(room).emit("roomUsers", Array.from(meta.members).map(id => users[id].username));
    cb && cb({ ok: true, room, messages: meta.messages });
    io.emit("roomsUpdated", getRoomList());
  });

  // Leave room
  socket.on("leaveRoom", (cb) => {
    const info = users[socket.id];
    if (!info) return cb && cb({ ok: false });
    const { room } = info;
    leaveRoomInternal(socket, room);
    delete users[socket.id];
    cb && cb({ ok: true });
    io.emit("roomsUpdated", getRoomList());
  });

  // Chat message (room or direct if room is private)
  socket.on("chatMessage", (data) => {
    // data = { username, msg, room, type? }
    if (!data || !data.room) return;
    const r = rooms[data.room];
    if (!r) return;
    const m = messageObj(data.username, data.msg, data.type || "text");
    r.messages.push(m);
    // limit message history to last 200
    if (r.messages.length > 200) r.messages.shift();
    io.to(data.room).emit("chatMessage", m);
  });

  // Typing indicator
  socket.on("typing", ({ room, username, isTyping }) => {
    if (!room) return;
    socket.to(room).emit("typing", { username, isTyping });
  });

  // Message seen
  socket.on("messageSeen", ({ room, messageId, username }) => {
    // we just broadcast seen
    if (room) {
      io.to(room).emit("messageSeen", { messageId, username });
    }
  });

  // Send image (base64) - small images only recommended
  socket.on("sendImage", ({ room, username, dataUrl }) => {
    if (!room) return;
    const m = messageObj(username, dataUrl, "image");
    rooms[room].messages.push(m);
    if (rooms[room].messages.length > 200) rooms[room].messages.shift();
    io.to(room).emit("chatMessage", m);
  });

  // Random match: server pairs users who request random chat
  // We'll keep a small queue
  socket.on("randomMatch", ({ username }, cb) => {
    socket.randomQueue = socket.randomQueue || true;
    socket.usernameForRandom = username || "Anon";

    // find a waiting socket (other than this)
    let partner = null;
    for (let [id, s] of Object.entries(io.sockets.sockets)) {
      if (id === socket.id) continue;
      const so = io.sockets.sockets.get(id);
      if (so && so.waitingForRandom && so.id !== socket.id) {
        partner = so;
        break;
      }
    }

    if (partner) {
      // create temp room name
      const roomName = `dm-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
      rooms[roomName] = { password: null, members: new Set(), messages: [], createdAt: Date.now() };

      // join both
      const uname1 = username || "User";
      const uname2 = partner.usernameForRandom || "User";

      users[socket.id] = { username: uname1, room: roomName, matchedWith: partner.id };
      users[partner.id] = { username: uname2, room: roomName, matchedWith: socket.id };

      rooms[roomName].members.add(socket.id);
      rooms[roomName].members.add(partner.id);

      socket.join(roomName);
      partner.join(roomName);

      // notify both
      io.to(socket.id).emit("randomMatched", { room: roomName, partner: uname2, messages: [] });
      io.to(partner.id).emit("randomMatched", { room: roomName, partner: uname1, messages: [] });

      // clear waiting flag
      partner.waitingForRandom = false;
      socket.waitingForRandom = false;
      io.emit("roomsUpdated", getRoomList());
      return cb && cb({ ok: true, room: roomName });
    }

    // if not partner found, mark waiting
    socket.waitingForRandom = true;
    socket.usernameForRandom = username || "User";
    cb && cb({ ok: true, waiting: true });
  });

  // On disconnect
  socket.on("disconnect", () => {
    const info = users[socket.id];
    if (info) {
      const { username, room } = info;
      if (rooms[room]) {
        rooms[room].members.delete(socket.id);
        io.to(room).emit("userLeft", username);
        io.to(room).emit("roomUsers", Array.from(rooms[room].members).map(id => users[id]?.username || "Unknown"));
        if (rooms[room].members.size === 0 && room !== GLOBAL) {
          delete rooms[room];
        }
      }
      delete users[socket.id];
    }
    socket.waitingForRandom = false;
    console.log("Disconnected:", socket.id);
    io.emit("roomsUpdated", getRoomList());
  });
});

// internal helper for leaving
function leaveRoomInternal(socket, room) {
  const info = users[socket.id];
  if (!info || info.room !== room) {
    // still remove if present in room list
    if (rooms[room]) rooms[room].members.delete(socket.id);
    try { socket.leave(room); } catch (e) {}
    return;
  }
  const username = info.username;
  socket.leave(room);
  if (rooms[room]) {
    rooms[room].members.delete(socket.id);
    io.to(room).emit("userLeft", username);
    io.to(room).emit("roomUsers", Array.from(rooms[room].members).map(id => users[id]?.username || "Unknown"));
    if (rooms[room].members.size === 0 && room !== GLOBAL) {
      delete rooms[room];
    }
  }
}

http.listen(PORT, () => console.log(`Server listening on ${PORT}`));