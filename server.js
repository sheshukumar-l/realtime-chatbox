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

/**
 * rooms structure:
 * {
 *   roomCode: {
 *     password: "1234",
 *     members: Set()
 *   }
 * }
 */
const rooms = {};

// Utility: generate 6-digit room code
function generateRoomCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  leaveRoomBtn.addEventListener("click", () => {
  if (!room) return;

  socket.emit("leaveRoom", { room, username });

  // Reset UI
  room = "";
  messagesDiv.innerHTML = "";
  roomTitle.textContent = "Not in a room";

  chatScreen.classList.add("hidden");
  entryScreen.classList.remove("hidden");
});

  // ✅ CREATE PRIVATE ROOM
  socket.on("createPrivateRoom", ({ username, password }, cb) => {
    if (!username || !password) {
      return cb({ ok: false, msg: "Missing details" });
    }

    let roomCode;
    do {
      roomCode = generateRoomCode();
    } while (rooms[roomCode]);

    rooms[roomCode] = {
      password,
      members: new Set()
    };

    socket.username = username;
    socket.room = roomCode;

    socket.join(roomCode);
    rooms[roomCode].members.add(socket.id);

    cb({ ok: true, roomCode });
    socket.emit("systemMessage", `Private room created`);
  });

  // ✅ JOIN PRIVATE ROOM
  socket.on("joinPrivateRoom", ({ username, roomCode, password }, cb) => {
    const room = rooms[roomCode];

    if (!room) {
      return cb({ ok: false, msg: "Invalid room code" });
    }

    if (room.password !== password) {
      return cb({ ok: false, msg: "Wrong password" });
    }

    socket.username = username;
    socket.room = roomCode;

    socket.join(roomCode);
    room.members.add(socket.id);

    socket.to(roomCode).emit(
      "systemMessage",
      `${username} joined the room`
    );

    cb({ ok: true });
  });

  // ✅ CHAT MESSAGE
  socket.on("chatMessage", ({ text }) => {
    if (!text || !socket.room) return;

    io.to(socket.room).emit("chatMessage", {
      username: socket.username,
      text
    });
  });

  // ✅ DISCONNECT
  socket.on("disconnect", () => {
    const roomCode = socket.room;
    if (roomCode && rooms[roomCode]) {
      rooms[roomCode].members.delete(socket.id);
      socket.to(roomCode).emit(
        "systemMessage",
        `${socket.username || "User"} left`
      );

      if (rooms[roomCode].members.size === 0) {
        delete rooms[roomCode];
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () =>
  console.log(`Server running on PORT ${PORT}`)
);