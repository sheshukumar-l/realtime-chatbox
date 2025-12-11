const BACKEND = "https://real-time-chatbox-f4k1.onrender.com";
const socket = io(BACKEND);

const home = document.getElementById("home");
const chat = document.getElementById("chat");

const usernameInput = document.getElementById("username");
const roomNameInput = document.getElementById("roomName");
const joinRoomNameInput = document.getElementById("joinRoomName");
const errorBox = document.getElementById("error");

const chatTitle = document.getElementById("chatTitle");
const messagesDiv = document.getElementById("messages");
const msgInput = document.getElementById("msgInput");

let username = "";
let currentRoom = "";

// Join global
document.getElementById("joinGlobal").onclick = () => {
  username = usernameInput.value;

  if (!username) return showError("Enter name");

  socket.emit("joinGlobal", username, res => {
    if (res.ok) {
      enterChat("global");
    }
  });
};

// Create room
document.getElementById("createRoom").onclick = () => {
  const room = roomNameInput.value;

  socket.emit("createRoom", room, res => {
    if (!res.ok) return showError(res.error);
    alert("Room created!");
  });
};

// Join room
document.getElementById("joinRoom").onclick = () => {
  const room = joinRoomNameInput.value;
  username = usernameInput.value;

  if (!username) return showError("Enter name");

  socket.emit("joinRoom", { username, room }, res => {
    if (!res.ok) return showError(res.error);
    enterChat(room);
    loadMessages(res.messages);
  });
};

// Send msg
document.getElementById("sendBtn").onclick = () => {
  const msg = msgInput.value;

  if (!msg) return;

  socket.emit("chatMessage", {
    username,
    msg,
    room: currentRoom
  });

  msgInput.value = "";
};

socket.on("chatMessage", msg => {
  addMessage(msg.username, msg.msg);
});

socket.on("userJoined", name => {
  addMessage("System",` ${name} joined`);
});

socket.on("userLeft", name => {
  addMessage("System",` ${name} left`);
});

// Helpers
function enterChat(room) {
  home.classList.add("hidden");
  chat.classList.remove("hidden");
  chatTitle.innerText =` Chat: ${room}`;
  currentRoom = room;
}

function addMessage(user, text) {
  const div = document.createElement("div");
  div.textContent = `${user}: ${text}`;
  messagesDiv.appendChild(div);
}

function loadMessages(list) {
  messagesDiv.innerHTML = "";
  list.forEach(m => addMessage(m.username, m.msg));
}

function showError(msg) {
  errorBox.textContent = msg;
}