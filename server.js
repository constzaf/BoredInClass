let usersOnline = 0;
let leaderboard = {};
const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static("public"));

// Shared state
let clickCount = 0;
let cursors = {};

// Socket connections
io.on("connection", (socket) => {
  const username = socket.handshake.auth.username || "Guest" + Math.floor(Math.random()*1000);
  socket.username = username;
  usersOnline ++;
  
  // Send number of users online
  io.emit("usersOnline", usersOnline);

  // Send initial state
  socket.emit("init", { clickCount, cursors });
  socket.emit("leaderboard", leaderboard);

  // Broadcast join message
  socket.broadcast.emit("system", `${username} joined`);

  // Click events
  socket.on("bananaClick", () => {
    clickCount++;

    if (!leaderboard[socket.username]){
    	leaderboard[socket.username] = 0;
    }
    leaderboard[socket.username]++;
    io.emit("updateCount", clickCount);
    io.emit("leaderboard", leaderboard);
  });

  // Cursor movement
  socket.on("cursorMove", (pos) => {
    cursors[socket.id] = { x: pos.x, y: pos.y, username };
    socket.broadcast.emit("updateCursors", { id: socket.id, pos: cursors[socket.id] });
  });

  // Chat messages
  socket.on("chatMessage", (text) => {
    io.emit("chatMessage", { user: username, text });
  });

  // Disconnect
  socket.on("disconnect", () => {
    usersOnline--;
    io.emit("usersOnline", usersOnline);
    delete cursors[socket.id];
    io.emit("system", `${username} left`);
    io.emit("removeCursor", socket.id);
    io.emit("leaderboard", leaderboard);
  });
});

http.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));

