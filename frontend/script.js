document.addEventListener("DOMContentLoaded", () => {

  const socket = io("https://realtime-chatbox-f6jz.onrender.com");

  /* ELEMENTS */
  const joinScreen = document.getElementById("joinScreen");
  const chatScreen = document.getElementById("chatScreen");

  const usernameInput = document.getElementById("usernameInput");
  const joinGlobalBtn = document.getElementById("joinGlobalBtn");

  const privatePasswordInput = document.getElementById("privatePasswordInput");
  const privateCodeInput = document.getElementById("privateCodeInput");
  const createPrivateBtn = document.getElementById("createPrivateBtn");
  const joinPrivateBtn = document.getElementById("joinPrivateBtn");

  const chatTitle = document.getElementById("chatTitle");
  const messages = document.getElementById("messages");

  const messageInput = document.getElementById("messageInput");
  const sendBtn = document.getElementById("sendBtn");
  const exitBtn = document.getElementById("exitBtn");

  /* STATE */
  let currentRoom = null;
  let currentUser = null;

  /* HELPERS */
  function showChat(title) {
    joinScreen.classList.add("hidden");
    chatScreen.classList.remove("hidden");
    chatTitle.textContent = title;
    messages.innerHTML = "";
  }

  function showJoin() {
    chatScreen.classList.add("hidden");
    joinScreen.classList.remove("hidden");
    currentRoom = null;
  }

  function addSystem(msg) {
    const div = document.createElement("div");
    div.className = "system";
    div.textContent = msg;
    messages.appendChild(div);
  }

  function addMessage(user, text) {
    const div = document.createElement("div");
    div.className = "msg " + (user === currentUser ? "self" : "other");
    div.textContent = user === currentUser ? text : `${user}: ${text}`;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function getUsername() {
    const name = usernameInput.value.trim();
    if (!name) {
      alert("Enter username");
      return null;
    }
    return name;
  }

  /* JOIN GLOBAL */
  joinGlobalBtn.onclick = () => {
    const name = getUsername();
    if (!name) return;

    currentUser = name;
    currentRoom = "global";

    showChat("🌍 Global Chat");
    socket.emit("joinGlobal", { username: name });
  };

  /* CREATE PRIVATE */
  createPrivateBtn.onclick = () => {
    const name = getUsername();
    const password = privatePasswordInput.value.trim();
    if (!password) return alert("Enter room password");

    currentUser = name;
    socket.emit("createPrivate", { username: name, password });
  };

  /* JOIN PRIVATE */
  joinPrivateBtn.onclick = () => {
    const name = getUsername();
    const code = privateCodeInput.value.trim();
    if (!code) return alert("Enter room code");

    currentUser = name;
    socket.emit("joinPrivate", { username: name, code });
  };

  /* SEND MESSAGE */
  sendBtn.onclick = () => {
    if (!messageInput.value || !currentRoom) return;

    socket.emit("chatMessage", {
      room: currentRoom,
      username: currentUser,
      message: messageInput.value
    });

    messageInput.value = "";
  };

  messageInput.addEventListener("keypress", e => {
    if (e.key === "Enter") sendBtn.click();
  });

  /* EXIT */
  exitBtn.onclick = () => {
    socket.emit("leaveRoom", {
      room: currentRoom,
      username: currentUser
    });
    showJoin();
  };

  /* SOCKET EVENTS */
  socket.on("systemMessage", msg => addSystem(msg));
  socket.on("chatMessage", data => addMessage(data.username, data.message));

  socket.on("privateCreated", ({ code }) => {
    currentRoom = code;
    showChat(`🔒 Private Room (${code})`);
    addSystem(`Room created. Code: ${code}`);
  });

  socket.on("joinedPrivate", ({ code }) => {
    currentRoom = code;
    showChat(`🔒 Private Room (${code})`);
    addSystem("Joined private room");
  });

  socket.on("errorMessage", msg => alert(msg));
});