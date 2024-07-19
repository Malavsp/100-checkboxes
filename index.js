const express = require("express");
const { createServer } = require("node:http");
const { join } = require("node:path");
const { Server } = require("socket.io");

const app = express();
const server = createServer(app);
const io = new Server(server);

app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "index.html"));
});

let states = Array(100).fill(false);

io.on("connection", (socket) => {
  console.log("New user connected");

  socket.emit("initialize", states);

  socket.on("checked", (data) => {
    // console.log(data);
    states[data.id] = data.checked;
    // console.log(states);
    io.emit("checked", data);
  });
});
// console.log("io", io);

server.listen(3000, () => {
  console.log("server running at http://localhost:3000");
});
