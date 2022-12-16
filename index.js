const port = process.env.PORT || 3000;

const MONGODB_URL = "mongodb+srv://rin-co:2525rinko@cluster0.rypsris.mongodb.net/?retryWrites=true&w=majority";
const e = require('express');
const mongoose = require("mongoose");
mongoose.connect(MONGODB_URL, { useNewUrlParser: true });

const ideaPost = mongoose.model("ideaPost", { idea: String, x: Number, y: Number, name: String, roomName: String });
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
            const x = data.x;
            const y = data.y;
            const idea = data.idea;
            const filter = { idea: idea, roomName: room };
            const update = { x, y };
            const options = { new: true, upsert: true };
            ideaPost.findOneAndUpdate(filter, update, options, function(err, result){
                if(err) throw err;
                console.log(result);
            });
        });

        socket.on('will input', (will) => {
            const filter = { name: member, roomName: room };
            const update = { will };
            const options = { new: true, upsert: true };
            willPost.findOneAndUpdate(filter, update, options, function(err, result){
                if(err) throw err;
                console.log(result);
            });
            // const data = { will, name: member, roomName: room }; 
            
            // if(willPost.exists({name : member, roomName : room})){
            //     willPost.deleteMany({ name : member, roomName : room }, function(err){
            //         if(err) throw err;
            //         console.log('前回のデータを' + will + 'に更新しました');
            //     });//true
            // }
            // willPost.create(data);
            console.log('データを作成しました')
            io.to(room).emit('will input', data);
        });
            
        socket.on('lottery start', (data) => {
            const ideaX = data.x*100;
            const ideaY = data.y*100;
            willPost.find({ roomName: room }, { "_id" : 0, "will" : 1 }, function(err, result) {
                if (err) {
                    throw err
                    }
                    else{
                        const willBox = result;
                        const minWill = willBox.map(w => w.will).reduce((a,b)=>a<b?a:b)
                        console.log(minWill);
                        io.emit('lottery start', minWill);
                        const willX = minWill;
                        const willY = 50;
                        // const distance = Math.sqrt((ideaX - willX)**2 + (ideaY - willY)**2);
                        // const idea = data.idea;
                        ideaPost.find({ roomName: room }, function(err, result) {
                            if(err) { throw err
                            }else{
                            const xOfAllIdeas = result.map(w => w.x);//アイデアのx座標（配列）
                            const yOfAllIdeas = result.map(w => w.y);//アイデアのy座標（配列）
                            xOfAllIdeas.forEach(function(value, index, array){array[index]=(value*100-willX)**2});
                            yOfAllIdeas.forEach(function(value, index, array){array[index]=(value*100-willY)**2});
                            function func(...arr){
                                let ret_arr = arr[0].slice();
                                for(let i=1;i<arr.length;i++){
                                    for(let j=0; j<arr[i].length; j++)ret_arr[j] += arr[i][j];
                                }
                                return ret_arr;  
                            }
                            const ideaD = func(xOfAllIdeas,yOfAllIdeas);
                            ideaD.forEach(function(value, index, array){array[index]=1/Math.sqrt(value)});
                            const totalD = ideaD.reduce(function(sum, element){
                                return sum + element;
                              }, 0);
                            console.log(totalD);
                            ideaD.forEach(function(value, index, array){array[index]=value/totalD});
                            const p = ideaD;//当選確率
                            console.log(p);

                            }
                        })
                    }
                        
                        // const totalW = willBox.map(w => w.will).reduce((sum,element)=>sum+element,0);
                        // console.log(totalW);
                        // const p = 1/distance/
                        // if(distance = 0){
                            
                        // }       


                    // const ideaBox = result;
                    // console.log(ideaBox);//resultの中身は出た
                    // const shuffleIdea = Math.floor(Math.random() * ideaBox.length);
                    // const bestIdea = ideaBox[shuffleIdea];
                    // io.emit('lottery start', bestIdea);
            //     }
            // });
            });
        });
    });
});


server.listen(port, () => {
    console.log('Server listening on port:'  + port);
});