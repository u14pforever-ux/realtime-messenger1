const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const rooms = {};

io.on('connection', socket => {
  console.log('connected:', socket.id);

  socket.on('join', ({ room, user }) => {
    socket.join(room);
    socket.data.user = user;
    socket.data.room = room;

    rooms[room] = rooms[room] || [];
    socket.emit('history', rooms[room]);

    const members = Array.from(io.sockets.adapter.rooms.get(room) || [])
      .map(id => ({ id, user: io.sockets.sockets.get(id)?.data.user }));

    io.to(room).emit('presence', members);
    socket.to(room).emit('system', { text: `${user} joined the room` });
  });

  socket.on('message', ({ text }) => {
    const room = socket.data.room;
    const user = socket.data.user || 'Anonymous';
    if (!room) return;

    const msg = {
      id: Date.now() + "-" + Math.random().toString(36).slice(2,7),
      user,
      text,
      ts: Date.now()
    };

    rooms[room].push(msg);
    if (rooms[room].length > 200) rooms[room].shift();

    io.to(room).emit('message', msg);
  });

  socket.on('typing', (isTyping) => {
    const room = socket.data.room;
    const user = socket.data.user;
    if (!room) return;
    socket.to(room).emit('typing', { user, isTyping });
  });

  socket.on('disconnect', () => {
    const room = socket.data.room;
    const user = socket.data.user;
    if (!room) return;

    setTimeout(() => {
      const members = Array.from(io.sockets.adapter.rooms.get(room) || [])
        .map(id => ({ id, user: io.sockets.sockets.get(id)?.data.user }));
      io.to(room).emit('presence', members);
      io.to(room).emit('system', { text: `${user || 'Someone'} left the room` });
    }, 100);
  });
});

app.get('/', (req, res) => res.send('Realtime Messenger Backend Running'));

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log("Server listening on", PORT));
