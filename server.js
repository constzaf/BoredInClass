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

  // Send initial state
  socket.emit("init", { clickCount, cursors });

  // Broadcast join message
  socket.broadcast.emit("system", `${username} joined`);

  // Click events
  socket.on("bananaClick", () => {
    clickCount++;
    io.emit("updateCount", clickCount);
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
    delete cursors[socket.id];
    io.emit("system", `${username} left`);
    io.emit("removeCursor", socket.id);
  });
});

http.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));

