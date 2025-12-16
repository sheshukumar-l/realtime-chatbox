const BACKEND = "https://realtime-chatbox-f6jz.onrender.com";
const socket = io(BACKEND);

const joinScreen = document.getElementById("joinScreen");
const chatScreen = document.getElementById("chatScreen");

const usernameInput = document.getElementById("username");
const joinGlobalBtn = document.getElementById("joinGlobal");
const createPrivateBtn = document.getElementById("createPrivate");
const joinPrivateBtn = document.getElementById("joinPrivate");

const roomCodeInput = document.getElementById("roomCode");
const roomPassInput = document.getElementById("roomPass");

const roomTitle = document.getElementById("roomTitle");
const messages = document.getElementById("messages");
const msgInput = document.getElementById("msgInput");
const sendBtn = document.getElementById("sendBtn");
const exitBtn = document.getElementById("exitBtn");

let currentRoom = "";

function addMsg(user, text, self) {
  const div = document.createElement("div");
  div.className = "msg " + (self ? "self" : "other");
  div.textContent = `${user}: ${text}`;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

joinGlobalBtn.onclick = () => {
  const name = usernameInput.value.trim();
  if (!name) return alert("Enter name");

  currentRoom = "global";
  socket.emit("joinGlobal", name);

  joinScreen.classList.add("hidden");
  chatScreen.classList.remove("hidden");
  roomTitle.textContent = "Global Chat";
};

createPrivateBtn.onclick = () => {
  const name = usernameInput.value.trim();
  if (!name) return alert("Enter name");

  socket.emit("createPrivate", name, (res) => {
    alert(`Room Code: ${res.code}\nPassword: ${res.password}`);
    currentRoom = res.code;

    joinScreen.classList.add("hidden");
    chatScreen.classList.remove("hidden");
    roomTitle.textContent = `Private Room ${res.code}`;
  });
};

joinPrivateBtn.onclick = () => {
  socket.emit(
    "joinPrivate",
    {
      username: usernameInput.value,
      code: roomCodeInput.value,
      password: roomPassInput.value,
    },
    (res) => {
      if (!res.ok) return alert(res.msg);

      currentRoom = roomCodeInput.value;
      joinScreen.classList.add("hidden");
      chatScreen.classList.remove("hidden");
      roomTitle.textContent = `Private Room ${currentRoom}`;
    }
  );
};

sendBtn.onclick = () => {
  if (!msgInput.value) return;
  socket.emit("chatMessage", { room: currentRoom, text: msgInput.value });
  addMsg("You", msgInput.value, true);
  msgInput.value = "";
};

socket.on("chatMessage", (data) => {
  addMsg(data.user, data.text, false);
});

exitBtn.onclick = () => {
  socket.emit("leaveRoom", currentRoom);
  chatScreen.classList.add("hidden");
  joinScreen.classList.remove("hidden");
  messages.innerHTML = "";
};