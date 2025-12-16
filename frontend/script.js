const BACKEND = "https://realtime-chatbox-f6jz.onrender.com";
const socket = io(BACKEND);

const join = document.getElementById("join");
const chat = document.getElementById("chat");

const usernameInput = document.getElementById("username");
const roomPassword = document.getElementById("roomPassword");
const roomCode = document.getElementById("roomCode");

const joinGlobal = document.getElementById("joinGlobal");
const createRoom = document.getElementById("createRoom");
const joinRoom = document.getElementById("joinRoom");

const roomTitle = document.getElementById("roomTitle");
const messages = document.getElementById("messages");

const msgInput = document.getElementById("msg");
const sendBtn = document.getElementById("send");
const exitBtn = document.getElementById("exit");

let currentRoom = "global";

joinGlobal.onclick = () => {
  const name = usernameInput.value.trim();
  if (!name) return alert("Enter name");

  socket.emit("join-global", name);
  roomTitle.textContent = "Global Chat";
  join.classList.add("hidden");
  chat.classList.remove("hidden");
};

createRoom.onclick = () => {
  socket.emit("create-private", {
    username: usernameInput.value,
    password: roomPassword.value
  }, (res) => {
    alert("Room Code: " + res.code);
  });
};

joinRoom.onclick = () => {
  socket.emit("join-private", {
    username: usernameInput.value,
    code: roomCode.value,
    password: roomPassword.value
  }, (res) => {
    if (res.error) return alert(res.error);
    currentRoom = roomCode.value;
    roomTitle.textContent = "Private Room " + currentRoom;
    join.classList.add("hidden");
    chat.classList.remove("hidden");
  });
};

sendBtn.onclick = () => {
  const text = msgInput.value;
  if (!text) return;

  if (currentRoom === "global") {
    socket.emit("global-message", text);
  } else {
    socket.emit("private-message", { code: currentRoom, text });
  }

  msgInput.value = "";
};

socket.on("message", (msg) => {
  const div = document.createElement("div");

  if (msg.user === "System") {
    div.className = "message system";
    div.textContent = msg.text;
  } else if (msg.user === usernameInput.value) {
    div.className = "message me";
    div.textContent = msg.text;
  } else {
    div.className = "message other";
    div.textContent = `${msg.user}: ${msg.text}`;
  }

  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
});

exitBtn.onclick = () => location.reload();