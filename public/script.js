const BACKEND = "https://realtime-chatbox-f6jz.onrender.com";
const socket = io(BACKEND);

/* Screens */
const joinScreen = document.getElementById("joinScreen");
const chatScreen = document.getElementById("chatScreen");

/* Inputs */
const usernameInput = document.getElementById("usernameInput");
const msgInput = document.getElementById("msgInput");
const privateCodeInput = document.getElementById("privateCodeInput");
const privatePasswordInput = document.getElementById("privatePasswordInput");

/* Buttons */
const joinGlobalBtn = document.getElementById("joinGlobalBtn");
const joinPrivateBtn = document.getElementById("joinPrivateBtn");
const createPrivateBtn = document.getElementById("createPrivateBtn");
const sendBtn = document.getElementById("sendBtn");
const leaveBtn = document.getElementById("leaveBtn");

/* UI */
const messagesDiv = document.getElementById("messages");
const roomTitle = document.getElementById("roomTitle");

let username = "";
let room = "";

/* UI Helpers */
function showChat() {
  joinScreen.classList.remove("active");
  chatScreen.classList.add("active");
}

function showJoin() {
  chatScreen.classList.remove("active");
  joinScreen.classList.add("active");
  messagesDiv.innerHTML = "";
}

function addMessage(user, text, self = false) {
  const div = document.createElement("div");
  div.className = "msg " + (self ? "self" : "");
  div.innerHTML = `<strong>${user}</strong>: ${text}`;
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

/* JOIN GLOBAL */
joinGlobalBtn.onclick = () => {
  username = usernameInput.value.trim();
  if (!username) return alert("Enter name");

  room = "global";
  roomTitle.textContent = "🌍 Global";

  socket.emit("joinRoom", { room, username });
  showChat();
};

/* CREATE PRIVATE */
createPrivateBtn.onclick = () => {
  username = usernameInput.value.trim();
  const password = privatePasswordInput.value.trim();
  if (!username || !password) return alert("Fill all fields");

  socket.emit("createPrivate", { username, password }, (res) => {
    if (!res.ok) return alert(res.error);
    room = res.room;
    roomTitle.textContent = "🔒 Private " + room;
    showChat();
    alert("Room Code: " + room);
  });
};

/* JOIN PRIVATE */
joinPrivateBtn.onclick = () => {
  username = usernameInput.value.trim();
  const code = privateCodeInput.value.trim();
  if (!username || !code) return alert("Enter name & code");

  socket.emit("joinPrivate", { username, code }, (res) => {
    if (!res.ok) return alert(res.error);
    room = code;
    roomTitle.textContent = "🔒 Private " + room;
    showChat();
  });
};

/* SEND MESSAGE */
sendBtn.onclick = () => {
  const msg = msgInput.value.trim();
  if (!msg) return;
  socket.emit("message", { room, username, text: msg });
  addMessage(username, msg, true);
  msgInput.value = "";
};

/* LEAVE */
leaveBtn.onclick = () => {
  socket.emit("leaveRoom", { room, username });
  showJoin();
};

/* SOCKET EVENTS */
socket.on("message", (data) => {
  if (data.username !== username) {
    addMessage(data.username, data.text);
  }
});