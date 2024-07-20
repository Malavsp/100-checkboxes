const express = require("express");
const { createServer } = require("node:http");
const { join } = require("node:path");
const { Server } = require("socket.io");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

async function main() {
  // open the database file
  const db = await open({
    filename: "checkboxes.db",
    driver: sqlite3.Database,
  });

  try {
    // creates table if not exists
    await db.exec(`
      CREATE TABLE IF NOT EXISTS checkboxes (
        id INTEGER PRIMARY KEY UNIQUE,
        name VARCHAR UNIQUE NOT NULL,
        state BOOLEAN default false
      );
    `);

    // insert checbox name and default state during new table creation
    for (let i = 1; i <= 100; i++) {
      let result = await db.run(
        `INSERT into checkboxes (name) VALUES('checkbox-${i}');`
      );
    }
  } catch (e) {
    if (e.errno === 19) {
      // to check if sqlite_unique constraint error --> default state exists
      // do nothing
    } else {
      console.error(e);
    }
  }

  const app = express();
  const server = createServer(app);
  const io = new Server(server, {
    connectionStateRecovery: {},
  });

  app.get("/", (req, res) => {
    res.sendFile(join(__dirname, "index.html"));
  });

  io.on("connection", async (socket) => {
    // get live state for every new connection
    let states = await db.all(`SELECT name, state FROM checkboxes  `);
    // console.log(states);
    console.log("New user connected");
    socket.emit("initialize", states);

    socket.on("checked", async (data) => {
      // console.log(data);
      // states[data.id] = data.checked;

      // updates state on change
      const update = await db.run(
        `UPDATE checkboxes SET state = ? WHERE name = ?`,
        [data.checked, data.id]
      );
      // console.log(update);
      io.emit("checked", data);
    });
  });
  // console.log("io", io);

  server.listen(3000, () => {
    console.log("server running at http://localhost:3000");
  });
}

main();
