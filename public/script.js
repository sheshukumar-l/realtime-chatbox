const BACKEND = "https://realtime-chatbox-f6jz.onrender.com";
const socket = io(BACKEND);

// UI Elements
const joinScreen = document.getElementById("joinScreen");
const chatScreen = document.getElementById("chatScreen");
const usernameInput = document.getElementById("usernameInput");
const roomInput = document.getElementById("roomInput");
const joinBtn = document.getElementById("joinBtn");

const roomTitle = document.getElementById("roomTitle");
const messagesDiv = document.getElementById("messages");
const msgInput = document.getElementById("msgInput");
const sendBtn = document.getElementById("sendBtn");
const leaveRoomBtn = document.getElementById("leaveRoomBtn");

let username = "";
let room = "";

// Private room UI
const privateRoomScreen = document.getElementById("privateRoomScreen");
const privateUsername = document.getElementById("privateUsername");
const roomPassword = document.getElementById("roomPassword");
const createPrivateBtn = document.getElementById("createPrivateBtn");

const roomCodeInput = document.getElementById("roomCodeInput");
const joinPasswordInput = document.getElementById("joinPasswordInput");
const joinPrivateBtn = document.getElementById("joinPrivateBtn");
const roomCodeDisplay = document.getElementById("roomCodeDisplay");

// Join room
joinBtn.onclick = () => {
  username = usernameInput.value.trim();
  room = roomInput.value.trim() || "global";

  if (!username) return alert("Enter username");

  socket.emit("joinRoom", { username, room });

  roomTitle.textContent = room;
  joinScreen.classList.add("hidden");
  chatScreen.classList.remove("hidden");
};

// Send message
sendBtn.onclick = sendMessage;
msgInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});

function sendMessage() {
  const text = msgInput.value.trim();
  if (!text) return;

  socket.emit("chatMessage", {
    room,
    username,
    text
  });

  msgInput.value = "";
}

// Receive chat message
socket.on("chatMessage", ({ username: user, text }) => {
  addMessage(user, text, user === username);
});

// System messages
socket.on("systemMessage", (msg) => {
  addSystemMessage(msg);
});

// UI helpers
function addMessage(user, text, self) {
  if (!text) return;

  const div = document.createElement("div");
  div.className = "msg" + (self ? " self" : "");
  div.innerHTML = `<strong>${user}</strong>: ${text}`;
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function addSystemMessage(text) {
  const div = document.createElement("div");
  div.className = "system-msg";
  div.textContent = text;
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// CREATE PRIVATE ROOM
createPrivateBtn.addEventListener("click", () => {
  const username = privateUsername.value.trim();
  const password = roomPassword.value.trim();

  if (!username || !password) {
    return alert("Enter username and password");
  }

  socket.emit("createPrivateRoom", { username, password }, (res) => {
    if (!res.ok) return alert(res.msg);

    room = res.roomCode;
    roomTitle.textContent = `Private Room: ${room}`;
    roomCodeDisplay.textContent = `Room Code: ${room}`;

    privateRoomScreen.classList.add("hidden");
    chatScreen.classList.remove("hidden");
  });
});

// JOIN PRIVATE ROOM
joinPrivateBtn.addEventListener("click", () => {
  const username = privateUsername.value.trim();
  const roomCode = roomCodeInput.value.trim();
  const password = joinPasswordInput.value.trim();

  if (!username || !roomCode || !password) {
    return alert("Fill all fields");
  }

  socket.emit(
    "joinPrivateRoom",
    { username, roomCode, password },
    (res) => {
      if (!res.ok) return alert(res.msg);

      room = roomCode;
      roomTitle.textContent = `Private Room: ${room}`;

      privateRoomScreen.classList.add("hidden");
      chatScreen.classList.remove("hidden");
    }
  );
});

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