// Username prompt
let username = localStorage.getItem("username");
if (!username) {
  username = prompt("Enter a username:") || "Guest" + Math.floor(Math.random()*1000);
  localStorage.setItem("username", username);
}

// Connect
const socket = io({ auth: { username } });

// Update online user count
const usersOnlineEl = document.getElementById("usersOnline");

socket.on("usersOnline", (count) => {
  usersOnlineEl.textContent = count;
});

// DOM elements
const kirkstow = document.getElementById("kirkstow");
const counter = document.getElementById("counter");
const chatBox = document.getElementById("chatBox");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");

// Banana click
kirkstow.addEventListener("click", () => socket.emit("kirkstowClick"));

// Chat
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (chatInput.value) {
    socket.emit("chatMessage", chatInput.value);
    chatInput.value = "";
  }
});

// Receive initial state
socket.on("init", (data) => { counter.textContent = data.clickCount; });

// Update counter
socket.on("updateCount", (count) => counter.textContent = count);

// Chat messages
socket.on("chatMessage", (msg) => {
  chatBox.innerHTML += `<p><strong>${msg.user}:</strong> ${msg.text}</p>`;
  chatBox.scrollTop = chatBox.scrollHeight;
});

// System messages
socket.on("system", (msg) => {
  chatBox.innerHTML += `<p><em>${msg}</em></p>`;
  chatBox.scrollTop = chatBox.scrollHeight;
});

const leaderboardEl = document.getElementById("leaderboard");

socket.on("leaderboard", (data) => {
  leaderboardEl.innerHTML = "";

  const sorted = Object.entries(data)
    .sort((a, b) => b[1] - a[1]);

  for (const [user, clicks] of sorted) {
    const li = document.createElement("li");
    li.textContent = `${user}: ${clicks}`;
    leaderboardEl.appendChild(li);
  }
});

// Cursor updates
socket.on("updateCursors", ({ id, pos }) => {
  let el = document.getElementById(`cursor-${id}`);
  if (!el) {
    el = document.createElement("div");
    el.id = `cursor-${id}`;
    el.className = "cursor";
    el.innerText = pos.username;
    document.body.appendChild(el);
  }
  el.style.left = pos.x + "px";
  el.style.top = pos.y + "px";
});

// Remove cursor
socket.on("removeCursor", (id) => {
  const el = document.getElementById(`cursor-${id}`);
  if (el) el.remove();
});

// Track mouse
document.addEventListener("mousemove", (e) => {
  socket.emit("cursorMove", { x: e.pageX, y: e.pageY });
});

