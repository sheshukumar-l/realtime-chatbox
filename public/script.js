const socket = io("https://realtime-chatbox-f6jz.onrender.com");

const sidebar = document.getElementById("sidebar");
const chat = document.getElementById("chat");

const toggleSidebar = document.getElementById("toggleSidebar");
const joinGlobalBtn = document.getElementById("joinGlobalBtn");
const joinRoomBtn = document.getElementById("joinRoomBtn");

const usernameInput = document.getElementById("usernameInput");
const roomInput = document.getElementById("roomInput");

const currentRoomEl = document.getElementById("currentRoom");
const messagesDiv = document.getElementById("messages");
const msgInput = document.getElementById("msgInput");
const sendBtn = document.getElementById("sendBtn");

let username = "";
let room = "global";

/* MOBILE TOGGLE */
toggleSidebar.addEventListener("click", () => {
  sidebar.classList.toggle("hide");
});

/* JOIN GLOBAL */
joinGlobalBtn.addEventListener("click", () => {
  joinRoom("global");
});

/* JOIN PRIVATE */
joinRoomBtn.addEventListener("click", () => {
  const privateRoom = roomInput.value.trim();
  if (!privateRoom) return alert("Enter room name");
  joinRoom(privateRoom);
});

function joinRoom(roomName) {
  username = usernameInput.value.trim();
  if (!username) return alert("Enter username");

  room = roomName;
  socket.emit("joinRoom", { username, room });

  currentRoomEl.textContent = roomName === "global" ? "🌍 Global" : roomName;
  messagesDiv.innerHTML = "";

  sidebar.classList.add("hide");
  chat.classList.add("show");
}

/* SEND MESSAGE */
sendBtn.addEventListener("click", sendMessage);
msgInput.addEventListener("keydown", e => {
  if (e.key === "Enter") sendMessage();
});

function sendMessage() {
  const text = msgInput.value.trim();
  if (!text) return;
  socket.emit("chatMessage", { room, username, text });
  msgInput.value = "";
}

/* RECEIVE */
socket.on("chatMessage", data => {
  addMessage(data.username, data.text, data.username === username);
});

/* UI */
function addMessage(user, text, self) {
  const div = document.createElement("div");
  div.className = "msg" + (self ? " self" : "");
  div.innerHTML = `<strong>${user}</strong>: ${text}`;
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}