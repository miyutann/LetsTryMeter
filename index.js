const port = process.env.PORT || 3000;

const MONGODB_URL = "mongodb+srv://rin-co:2525rinko@cluster0.rypsris.mongodb.net/?retryWrites=true&w=majority";
const e = require('express');
const mongoose = require("mongoose");
mongoose.connect(MONGODB_URL, { useNewUrlParser: true });

const ideaPost = mongoose.model("ideaPost", { idea: String, name: String, roomName: String });
const willPost = mongoose.model("willPost", { will: Number, name: String, roomName: String });

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
app.get('/rooms', (req, res) =>{
    res.render('rooms');
});
app.get('/rooms/:name', (req, res) => {
    res.render('index', { name: req.params.name })
});
//res.render("rooms", { createdRooms: rooms });
//(rooms.ejs内で↓)
// <% createdRooms.forEach(rooms => {
//   <h5><%= room.roomId %></h5>
// <% }); %>

// const ideas = [];
// const members = new Set();
const allIdeas = new Map();
const allMembers = new Map();


io.on('connection', (socket) => {
    console.log('A user connected');
    
    // const fetchUserId = 
    // const userId = fetchUserId(socket);
    // socket.join(userId);
    // io.to(userId).emit("hi");

    socket.on('room add', (roomName) =>{
        socket.emit('room add', roomName);
        console.log(roomName);
        

        io.of("/").adapter.on('create-room', (data) => {
            // const rn = JSON.stringify(roomName);
            roomName.textContent = data;
            console.log(`room ${roomName} was created!`);
            
          });

    })

    socket.on('login', (data) => {
        const member = data.userName;
        const room = data.roomName;
        let members = allMembers.get(room);
        if(!members){
            members = new Set();
            allMembers.set(room, members);
        }
        let ideas = allIdeas.get(room);
        if(!ideas){
            ideas = new Map();
            allIdeas.set(room, ideas);
        }
        socket.join(room);
        console.log(member + "が" + room + "に入室しました!");
        members.add(member);
        io.to(room).emit('login', member);
        
        socket.emit('login log', Array.from(members));
        socket.emit('idea log', Array.from(ideas.values()));

        socket.on('disconnect', () => {

            console.log('A user disconnected');
            
        });
    
    // io.to(`${room}`).emit('login log', members);

        socket.on('idea add', (data) => {
            const x = Math.random();
            const y = Math.random()
            const idea = { ...data, x, y, id: ideas.size, name: member, roomName: room }; // TODO: save idea in database
            ideaPost.create(idea);
            ideas.set(idea.id, idea);
            io.to(room).emit('idea add', idea);
        })

        socket.on('idea move', (data) => {
            // TODO: check data is inside
            const idea = ideas.get(data.id);
            if(idea){
                idea.x = data.x;
                idea.y = data.y;
                io.to(room).emit('idea move', data);
                //ideaが動いたことをデータベースに保存する
            }
        });

        socket.on('idea released', (data) => {

            io.to(room).emit('idea released', data);
        });

        socket.on('will input', (will) => {
            const data = { will, name: member, roomName: room }; 
            willPost.create(data);
            io.to(room).emit('will input', data);

            willPost.updateMany({ name : member }, { $set: { will: will }}, function(err){
                if(err) throw err;
            }).exec(
            willPost.find({ roomName: room }).distinct('will', function(err, result) {
                if (err) {
                    throw err
                }
                else{
                    const willBox = result;
                    console.log(willBox);
                }
            })
            )
        });
            
        socket.on('lottery start', (data) => {
            ideaPost.find({ roomName: room }, { "_id" : 0, "idea" : 1 }, function(err, result) {
                if (err) {
                    throw err
                }
                else{
                    const ideaBox = result;
                    console.log(ideaBox);//resultの中身は出た
                    const shuffleIdea = Math.floor(Math.random() * ideaBox.length);
                    const bestIdea = ideaBox[shuffleIdea];
                    io.emit('lottery start', bestIdea);
                }
            });
        })

        
    });

    

});

server.listen(port, () => {
    console.log('Server listening on port:'  + port);
});