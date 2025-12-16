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

let username = "";
let room = "";

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