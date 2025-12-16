const BACKEND = "https://realtime-chatbox-f6jz.onrender.com";
const socket = io(BACKEND);

/* Screens */
const joinScreen = document.getElementById("joinScreen");
const chatScreen = document.getElementById("chatScreen");

/* Inputs */
const usernameInput = document.getElementById("usernameInput");
const roomPasswordInput = document.getElementById("roomPasswordInput");
const roomCodeInput = document.getElementById("roomCodeInput");

/* Buttons */
const joinGlobalBtn = document.getElementById("joinGlobalBtn");
const createPrivateBtn = document.getElementById("createPrivateBtn");
const joinPrivateBtn = document.getElementById("joinPrivateBtn");
const sendBtn = document.getElementById("sendBtn");
const exitBtn = document.getElementById("exitBtn");

/* Chat */
const messagesDiv = document.getElementById("messages");
const msgInput = document.getElementById("msgInput");
const roomTitle = document.getElementById("roomTitle");

/* State */
let username = "";
let currentRoom = "";

/* Helpers */
function showChat(title) {
  joinScreen.classList.add("hidden");
  chatScreen.classList.remove("hidden");
  roomTitle.textContent = title;
  messagesDiv.innerHTML = "";
}

function showJoin() {
  chatScreen.classList.add("hidden");
  joinScreen.classList.remove("hidden");
  messagesDiv.innerHTML = "";
}

function addMessage(user, msg, self) {
  const div = document.createElement("div");
  div.className = `msg ${self ? "self" : "other"}`;
  div.innerHTML = `<strong>${user}</strong><br>${msg}`;
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function addSystem(text) {
  const div = document.createElement("div");
  div.className = "system";
  div.textContent = text;
  messagesDiv.appendChild(div);
}

/* Join Global */
joinGlobalBtn.onclick = () => {
  if (!usernameInput.value) return alert("Enter username");
  username = usernameInput.value;
  currentRoom = "global";
  showChat("🌍 Global Chat");
  socket.emit("joinGlobal", username);
};

/* Create Private */
createPrivateBtn.onclick = () => {
  if (!usernameInput.value || !roomPasswordInput.value)
    return alert("Fill all fields");

  username = usernameInput.value;

  socket.emit(
    "createPrivateRoom",
    { username, password: roomPasswordInput.value },
    (res) => {
      if (!res.ok) return alert(res.error);
      currentRoom = res.code;
      showChat("🔒 Private Room");
      alert("Room Code: " + res.code);
    }
  );
};

/* Join Private */
joinPrivateBtn.onclick = () => {
  if (!usernameInput.value || !roomCodeInput.value)
    return alert("Fill all fields");

  username = usernameInput.value;

  socket.emit(
    "joinPrivateRoom",
    {
      username,
      code: roomCodeInput.value,
      password: roomPasswordInput.value,
    },
    (res) => {
      if (!res.ok) return alert(res.error);
      currentRoom = roomCodeInput.value;
      showChat("🔒 Private Room");
    }
  );
};

/* Send message */
sendBtn.onclick = () => {
  if (!msgInput.value) return;
  socket.emit("sendMessage", {
    room: currentRoom,
    message: msgInput.value,
  });
  msgInput.value = "";
};

/* Exit */
exitBtn.onclick = () => {
  socket.emit("leaveRoom", currentRoom);
  currentRoom = "";
  showJoin();
};

/* Socket events */
socket.on("system", addSystem);
socket.on("message", ({ user, message }) =>
  addMessage(user, message, user === username)
);