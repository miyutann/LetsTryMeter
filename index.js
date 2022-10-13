const port = process.env.port || 3000;

const express = require('express');
const app = express();
app.set('view engine', 'ejs');
app.use(express.static('public'));

const http = require('http');
const server = http.createServer(app);

const { Server } = require('socket.io');
const io = new Server(server);

app.get('/', (req, res) => {
    res.render('index');
});

const ideas = [];

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.emit('idea log', ideas);

    socket.on('idea add', (data) => {
        const x = Math.random();
        const y = Math.random();
        const idea = { ...data, x, y, id: ideas.length }; // TODO: save idea in database
        ideas.push(idea);
        io.emit('idea add', idea);
    })

    socket.on('idea move', (data) => {
        // TODO: check data is inside
        const idea = ideas.find(idea => idea.id == data.id);
        if(idea){
            idea.x = data.x;
            idea.y = data.y;
            io.emit('idea move', data);
        }
    });

    socket.on('idea released', (data) => {
        io.emit('idea released', data);
    });
});

server.listen(port, () => {
    console.log('Server listening on port:'  + port);
});