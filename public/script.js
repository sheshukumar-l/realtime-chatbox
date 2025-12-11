// script.js - Discord-like client: timestamps + typing + simple rooms
const BACKEND = "https://realtime-chatbox-f6jz.onrender.com"; // YOUR render URL
const socket = io(BACKEND);

// UI
const roomsList = document.getElementById("roomsList");
const newRoomInput = document.getElementById("newRoomInput");
const createRoomBtn = document.getElementById("createRoomBtn");
const usernameInput = document.getElementById("usernameInput");
const joinGlobalBtn = document.getElementById("joinGlobalBtn");

const roomTitle = document.getElementById("roomTitle");
const roomUsers = document.getElementById("roomUsers");
const messagesDiv = document.getElementById("messages");
const typingIndicator = document.getElementById("typingIndicator");
const msgInput = document.getElementById("msgInput");
const sendBtn = document.getElementById("sendBtn");

let username = "";
let currentRoom = "";
let typingTimeout = null;
let isTyping = false;

// utils
function timeShort(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"});
}

function addMessage(m, self = false) {
  const el = document.createElement("div");
  el.className = "msg" + (self ? " self" : "");
  const meta = `<div class="meta">${m.username}</div>`;
  const body = `<div class="text">${m.msg}</div>`;
  const time =` <div class="time">${timeShort(m.ts)}</div>`;
  el.innerHTML =` ${meta}${body}${time}`;
  messagesDiv.appendChild(el);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function addNotice(text) {
  const n = document.createElement("div");
  n.className = "join-notice";
  n.textContent = text;
  messagesDiv.appendChild(n);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function clearTyping() {
  typingIndicator.textContent = "";
}

// fetch and render rooms list
function refreshRooms() {
  socket.emit("getRooms", (list) => {
    renderRooms(list || []);
  });
}

function renderRooms(list) {
  roomsList.innerHTML = "";
  if (!list.length) {
    const li = document.createElement("li"); li.textContent = "global"; li.addEventListener("click", () => joinGlobal()); roomsList.appendChild(li);
    return;
  }
  // ensure global shown
  const gl = document.createElement("li"); gl.textContent = "global"; gl.addEventListener("click", () => joinGlobal()); roomsList.appendChild(gl);

  list.forEach(r => {
    const li = document.createElement("li");
    li.textContent = r;
    li.addEventListener("click", () => joinRoom(r));
    roomsList.appendChild(li);
  });
}

// socket: server will not automatically provide rooms list in this simplified server,
// so we show only known rooms from interactions. We'll request create/join events to update UI.
refreshRooms();

// create room
createRoomBtn.addEventListener("click", () => {
  const rn = newRoomInput.value.trim();
  if (!rn) return alert("Enter room name");
  socket.emit("createRoom", rn, (res) => {
    if (!res.ok) return alert(res.error || "Cannot create");
    newRoomInput.value = "";
    refreshRooms();
    alert(`Room "${rn}" created. Click it to join.`);
  });
});

// join global
joinGlobalBtn.addEventListener("click", () => {
  const name = usernameInput.value.trim();
  if (!name) return alert("Enter a display name");
  username = name;
  socket.emit("joinGlobal", username, (res) => {
    if (res.ok) {
      enterRoom("global", res.messages || []);
    }
  });
});

// join room
function joinRoom(roomName) {
  const name = usernameInput.value.trim();
  if (!name) return alert("Enter a display name");
  username = name;
  socket.emit("joinRoom", { username, room: roomName }, (res) => {
    if (!res.ok) return alert(res.error || "Unable to join");
    enterRoom(roomName, res.messages || []);
  });
}

function enterRoom(name, messages) {
  currentRoom = name;
  roomTitle.textContent =` # ${name}`;
  roomUsers.textContent = `(?)`; // server does not provide count in simple version
  messagesDiv.innerHTML = "";
  typingIndicator.textContent = "";
  if (messages && messages.length) messages.forEach(m => addMessage(m, m.username === username));
}

// send message
sendBtn.addEventListener("click", sendMessage);
msgInput.addEventListener("keyup", (e) => {
  if (e.key === "Enter") sendMessage();
  handleTyping();
});

function sendMessage() {
  const text = msgInput.value.trim();
  if (!text || !currentRoom) return;
  const payload = { username, msg: text, room: currentRoom };
  addMessage({ username, msg: text, ts: new Date().toISOString() }, true);
  socket.emit("chatMessage", payload);
  msgInput.value = "";
  // clear typing state
  isTyping = false;
  socket.emit("typing", { room: currentRoom, username, isTyping: false });
}

function handleTyping() {
  if (!currentRoom) return;
  if (!isTyping) {
    isTyping = true;
    socket.emit("typing", { room: currentRoom, username, isTyping: true });
  }
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    isTyping = false;
    socket.emit("typing", { room: currentRoom, username, isTyping: false });
  }, 900);
}

// Socket listeners
socket.on("chatMessage", (m) => {
  if (!currentRoom) return;
  // ensure it belongs to current room - server sends only to room
  addMessage(m, m.username === username);
});

socket.on("userJoined", (name) => addNotice(`${name} joined`));
socket.on("userLeft", (name) => addNotice(`${name} left`));
socket.on("typing", ({ username: who, isTyping }) => {
  if (!isTyping) return clearTyping();
  typingIndicator.textContent = `${who} is typing...`;
});

// expose refreshRooms in case you need to call manually
window.refreshRooms = refreshRooms;