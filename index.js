const port = process.env.PORT || 3000;
こと

const MONGODB_URL = process.env.MONGODB_URL;
const mongoose = require("mongoose");
mongoose.connect(MONGODB_URL, { useNewUrlParser: true });

// Database options
const options = {
    timestamps: true, // add timestamp
    toJSON: { // change the way how data is converted to JSON
        virtuals: true,
        versionKey: false,
        transform: (_, ret) => { delete ret._id; return ret; }
    }
};

const ideaSchema = mongoose.Schema({ idea: String, x: Number, y: Number, name: String, roomName: String }, options)
const ideaPost = mongoose.model("ideaPost", ideaSchema);
const willPost = mongoose.model("willPost", { will: Number, name: String, roomName: String });
const lotteryResult = mongoose.model("lotteryResult", { hit: String, roomName: String });

const express = require('express');
const app = express();
app.set('view engine', 'ejs');
app.use(express.static('public'));

const http = require('http');
const server = http.createServer(app);

const { Server } = require('socket.io');

const io = new Server(server, {
    cors: {
      origin: "https://letstrymeter.adaptable.app/"
    }
});

app.get(['/', '/rooms'], (req, res) => {
    res.render('rooms', { rooms });
});

app.get('/rooms/:name', (req, res) => {
    res.render('index', { name: req.params.name })
});

const allIdeas = new Map();
const allMembers = new Map();
const rooms = new Set();

async function setupRoom(roomName) {
    if (rooms.has(roomName)) return false;
    rooms.add(roomName);
    const members = new Set();
    allMembers.set(roomName, members);
    const ideas = new Map();
    allIdeas.set(roomName, ideas);
    try {
        const pastIdeas = await ideaPost.find({ roomName });
        pastIdeas.forEach(idea => ideas.set(idea.id, idea));
    } catch (e) { console.error(e); }
    return true;
}

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('room add', (roomName) => {
        if (setupRoom(roomName)) {
            socket.emit('room add', roomName);
        }
    })

    socket.on('login', async (data) => {
        const member = data.userName;
        const room = data.roomName;

        setupRoom(room);
        const members = allMembers.get(room);
        const ideas = allIdeas.get(room);

        members.add(member);
        socket.join(room);
        console.log(member + "が" + room + "に入室しました!");

        try {
            const wills = await willPost.find({ roomName: room });
            const minWill = wills.length > 0 ? wills.map(w => w.will).reduce((a, b) => a < b ? a : b) : 1;
            const loginData = { member, minWill };
            io.to(room).emit('login', loginData);
        } catch (e) { console.error(e); }

        socket.emit('login log', Array.from(members));
        socket.emit('idea log', Array.from(ideas.values()));

        socket.on('disconnect', () => {
            console.log('A user disconnected');
        });

        socket.on('idea add', async (data) => {
            const x = Math.random();
            const y = Math.random()
            try {
                const idea = await ideaPost.create({ ...data, x, y, name: member, roomName: room });
                ideas.set(idea.id, idea);
                io.to(room).emit('idea add', idea);
            } catch (e) { console.error(e); }
        })

        socket.on('idea move', (data) => {
            if (!data) return;
            const idea = ideas.get(data.id);
            if (!idea) return;
            idea.x = data.x;
            idea.y = data.y;
            io.to(room).emit('idea move', data);
        });

        socket.on('idea released', async (data) => {
            if (!data) return;
            const idea = ideas.get(data.id);
            if (!idea) return;
            idea.x = data.x;
            idea.y = data.y;
            io.to(room).emit('idea released', data);

            const update = { x: data.x, y: data.y };
            const options = { new: true, upsert: true };
            try {
                await ideaPost.findByIdAndUpdate(data.id, update, options);
            } catch (e) { console.error(e); }
        });

        socket.on('will input', async (will) => {
            const filter = { name: member, roomName: room };
            const update = { will };
            const options = { new: true, upsert: true };
            try {
                const data = await willPost.findOneAndUpdate(filter, update, options);
                io.to(room).emit('will input', data);
            } catch (e) { console.error(e); }
        });

        socket.on('lottery start', async () => {
            try {
                const wills = await willPost.find({ roomName: room });
                if (wills.length == 0) {
                    return;
                }
                const minWill = wills.map(w => w.will).reduce((a, b) => a < b ? a : b);
                io.to(room).emit('lottery ready', minWill);
                const willX = minWill;
                const willY = 50;

                const ideas = await ideaPost.find({ roomName: room });
                if (ideas.length == 0) {
                    io.to(room).emit('lottery start', null);
                    return;
                }
                const result = doLottery(ideas, willX, willY);
                console.log(result);
                if (result) {
                    const hit = result.lottery[result.selectedIndex].idea;
                    lotteryResult.create({ hit, roomName: room });
                    io.to(room).emit('lottery start', result);
                }
            } catch (e) { console.error(e) }
        });
    });
})

function distance(x1, y1, x2, y2) {
    return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}

function doLottery(ideas, willX, willY) {
    // Step 1: for each idea, calculate 1 / distance. distance = (x * 100, y * 100) and (willX, willY)
    const ideaP = ideas.map(p => ({ idea: p.idea, p: 1 / distance(p.x * 100, p.y * 100, willX, willY) }));

    // Step 2: for each idea, caluculate lottery probability
    const total = ideaP.reduce((sum, element) => sum + element.p, 0);
    const lottery = ideaP.map(p => ({ idea: p.idea, p: p.p / total }));
    lottery.sort((a, b) => a.p - b.p); // sort by probability

    // Step 3: do lottery
    const threshold = Math.random();
    let sum = 0;
    for (let i = 0; i < lottery.length; i++) {
        const l = lottery[i];
        sum += l.p;
        if (sum > threshold) return { selectedIndex: i, lottery };
    }
    return null;
}

server.listen(port, () => {
    console.log('Server listening on port:' + port);
});