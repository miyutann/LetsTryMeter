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

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('click', (data) => {
        console.log(data);
    })

    socket.on('idea add', (data) => {
        const x = Math.random();
        const y = Math.random();
        io.emit('idea', { ...data, x, y });
    })
});

server.listen(port, () => {
    console.log('Server listening on port:'  + port);
});

