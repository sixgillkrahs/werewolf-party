const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  let games = {};

  // Simple basic role pool for prototyping Werewolf (e.g., 3 players + 3 center = 6 roles)
  const availableRoles = ["Werewolf", "Werewolf", "Seer", "Robber", "Troublemaker", "Villager"];

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on("joinGame", (roomName, username, roomId) => {
      // Use roomId as the definitive socket room for broadcasting
      const activeRoom = roomId || roomName;

      socket.join(activeRoom);
      if (!games[activeRoom]) {
        games[activeRoom] = { players: [], state: "lobby", centerCards: [], name: roomName };
      }

      // Check if user already in room
      const existingPlayer = games[activeRoom].players.find(p => p.username === username);
      if (!existingPlayer) {
        games[activeRoom].players.push({ id: socket.id, username, role: null });
      } else {
        existingPlayer.id = socket.id;
      }

      io.to(activeRoom).emit("gameStateUpdate", games[activeRoom]);
    });

    socket.on("startGame", (roomId) => {
      if (games[roomId] && games[roomId].state === "lobby") {
        const game = games[roomId];
        const numPlayers = game.players.length;

        // Shuffle roles
        let roles = [...availableRoles].sort(() => Math.random() - 0.5);

        // Assign roles to players
        game.players.forEach(player => {
           player.role = roles.pop();
        });

        // Remaining go to center
        game.centerCards = roles;
        game.state = "night";

        io.to(roomId).emit("gameStateUpdate", game);
      }
    });

    socket.on("endNight", (roomId) => {
        if (games[roomId] && games[roomId].state === "night") {
            games[roomId].state = "day";
            io.to(roomId).emit("gameStateUpdate", games[roomId]);
        }
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
