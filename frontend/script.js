const BACKEND = "https://realtime-chatbox-f6jz.onrender.com";
const socket = io(BACKEND);

/* ---------- ELEMENTS ---------- */
const messagesDiv = document.getElementById("messages");
const msgInput = document.getElementById("msgInput");
const sendBtn = document.getElementById("sendBtn");
const exitBtn = document.getElementById("exitBtn");
const roomTitle = document.getElementById("roomTitle");

/* ---------- STATE ---------- */
let username = "";
let currentRoom = "";

/* ---------- HELPERS ---------- */
function clearMessages() {
  messagesDiv.innerHTML = "";
}

function scrollBottom() {
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function addSystem(text) {
  const div = document.createElement("div");
  div.className = "system";
  div.textContent = text;
  messagesDiv.appendChild(div);
  scrollBottom();
}

function addMessage(user, text, isSelf) {
  const div = document.createElement("div");
  div.className = `msg ${isSelf ? "self" : "other"}`;
  div.innerHTML = `<strong>${user}</strong><br>${text}`;
  messagesDiv.appendChild(div);
  scrollBottom();
}

/* ---------- SEND MESSAGE ---------- */
sendBtn.addEventListener("click", () => {
  const msg = msgInput.value.trim();
  if (!msg || !currentRoom) return;

  socket.emit("sendMessage", {
    room: currentRoom,
    message: msg
  });

  msgInput.value = "";
});

msgInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendBtn.click();
});

/* ---------- EXIT ROOM ---------- */
exitBtn.addEventListener("click", () => {
  socket.emit("leaveRoom", currentRoom);
  currentRoom = "";
  clearMessages();
  roomTitle.textContent = "Not in a room";
});

/* ---------- SOCKET EVENTS ---------- */
socket.on("system", (text) => {
  addSystem(text);
});

socket.on("message", ({ user, message }) => {
  addMessage(user, message, user === username);
});

/* ---------- JOIN GLOBAL ---------- */
function joinGlobal(name) {
  username = name;
  currentRoom = "global";
  clearMessages();
  roomTitle.textContent = "🌍 Global Chat";
  socket.emit("joinGlobal", username);
}

/* ---------- PRIVATE ROOM ---------- */
function joinPrivate(name, code, password) {
  username = name;
  clearMessages();
  socket.emit("joinPrivateRoom", { username, code, password }, (res) => {
    if (!res.ok) return alert(res.error);
    currentRoom = code;
    roomTitle.textContent = "🔒 Private Room";
  });
}