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
let currentRoom = "";

/* Helpers */
function showChat(room) {
  joinScreen.classList.remove("active");
  chatScreen.classList.add("active");
  roomTitle.textContent = room;
  messagesDiv.innerHTML = "";
}

function showJoin() {
  chatScreen.classList.remove("active");
  joinScreen.classList.add("active");
}

function addMessage(user, text, self) {
  const div = document.createElement("div");
  div.className = "msg " + (self ? "self" : "");
  div.innerHTML = `<strong>${user}</strong>: ${text}`;
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

/* Join Global */
joinGlobalBtn.onclick = () => {
  username = usernameInput.value.trim();
  if (!username) return alert("Enter username");

  currentRoom = "global";
  socket.emit("joinGlobal", username);
  showChat("Global");
};

/* Create Private Room */
createPrivateBtn.onclick = () => {
  username = usernameInput.value.trim();
  if (!username) return alert("Enter username");

  socket.emit("createPrivate", username, (res) => {
    alert(`Room Code: ${res.code}\nPassword: ${res.password}`);
    currentRoom = res.code;
    showChat("Private Room");
  });
};

/* Join Private Room */
joinPrivateBtn.onclick = () => {
  username = usernameInput.value.trim();
  const code = privateCodeInput.value.trim();
  const pass = privatePasswordInput.value.trim();

  if (!username || !code || !pass) return alert("Fill all fields");

  socket.emit("joinPrivate", { username, code, pass }, (res) => {
    if (!res.ok) return alert(res.error);
    currentRoom = code;
    showChat("Private Room");
  });
};

/* Send Message */
sendBtn.onclick = () => {
  const text = msgInput.value.trim();
  if (!text) return;

  socket.emit("chatMessage", { room: currentRoom, text });
  addMessage(username, text, true);
  msgInput.value = "";
};

/* Leave Room */
leaveBtn.onclick = () => {
  socket.emit("leaveRoom", currentRoom);
  showJoin();
};

/* Receive Message */
socket.on("chatMessage", ({ user, text }) => {
  addMessage(user, text, false);
});