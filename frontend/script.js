const socket = io("https://realtime-chatbox-f6jz.onrender.com");

const join = document.getElementById("join");
const chat = document.getElementById("chat");

const usernameInput = document.getElementById("username");
const msgInput = document.getElementById("msgInput");
const messages = document.getElementById("messages");
const roomTitle = document.getElementById("roomTitle");
const typingDiv = document.getElementById("typing");

document.getElementById("globalBtn").onclick = () => {
  socket.emit("joinGlobal", usernameInput.value);
  startChat("Global Chat");
};

document.getElementById("createRoom").onclick = () => {
  socket.emit("createPrivateRoom", {
    username: usernameInput.value,
    password: document.getElementById("roomPassword").value
  }, res => {
    alert("Room Code: " + res.code);
    startChat("Private Room " + res.code);
  });
};

document.getElementById("joinRoom").onclick = () => {
  socket.emit("joinPrivateRoom", {
    username: usernameInput.value,
    code: document.getElementById("roomCode").value,
    password: document.getElementById("roomPassword").value
  }, res => {
    if (res.error) alert(res.error);
    else startChat("Private Room");
  });
};

document.getElementById("sendBtn").onclick = () => {
  if (!msgInput.value) return;
  socket.emit("sendMessage", msgInput.value);
  msgInput.value = "";
};

document.getElementById("exitBtn").onclick = () => {
  socket.emit("leaveRoom");
  chat.classList.add("hidden");
  join.classList.remove("hidden");
};

socket.on("message", data => {
  const div = document.createElement("div");

  if (data.user === "System") {
    div.className = "system";
    div.innerText = data.text;
  } else {
    div.className = "msg " + (data.user === usernameInput.value ? "me" : "other");
    div.innerText = `${data.user}: ${data.text}`;
  }

  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
});

socket.on("typing", d => {
  typingDiv.innerText = d.isTyping ? `${d.user} typing...` : "";
});

function startChat(title) {
  roomTitle.innerText = title;
  join.classList.add("hidden");
  chat.classList.remove("hidden");
}