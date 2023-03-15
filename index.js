const port = process.env.PORT || 3000;

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
const io = new Server(server);

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

        socket.join(room);
        console.log(member + "が" + room + "に入室しました!");

        try {            
            const wills = await willPost.find({ roomName: room });
            const minWill = wills.length > 0 ? wills.map(w => w.will).reduce((a, b) => a < b ? a : b) : 1;
            const loginData = { member, minWill };
            console.log(minWill);
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
            const filter = { name: member, roomName: room };
            const update = { will };
            const options = { new: true, upsert: true };
            willPost.findOneAndUpdate(filter, update, options, function(err, result){
                if(err) throw err;
                console.log(result);
            })
            console.log('データを作成しました')
            io.to(room).emit('will input', data);
        });
            
        socket.on('lottery ready', (data) => {
            const x = data.x;
            const y = data.y;
            const idea = data.idea;
            const filter = { idea: idea, roomName: room };
            const update = { x, y };
            const options = { new: true, upsert: true };
            ideaPost.findOneAndUpdate(filter, update, options, function(err, result){
                if(err) throw err;
                console.log(result);
            })//座標位置を保存
        });

        socket.on('lottery start', (m)=>{
        willPost.exists({ roomName: room }, { "_id" : 0, "will" : 1 }, function(err, result) {
            if (err) {
            throw err
            }
            else{
            if(result!==null){
            willPost.find({ roomName: room }, { "_id" : 0, "will" : 1 }, function(err, result) {
                if (err) {
                    throw err
                    }
                    else{
                        const willBox = result;
                        const minWill = willBox.map(w => w.will).reduce((a,b)=>a<b?a:b)
                        // console.log(minWill);
                        io.to(room).emit('lottery ready', minWill);
                        const willX = minWill;
                        const willY = 50;
                        
                ideaPost.exists({ roomName: room }, function(err, result) {
                    if (err) {
                    throw err
                    }
                    else{
                    if(result!==null){
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
                            ideaD.forEach(function(value, index, array){array[index]=1/Math.sqrt(value)});// 1/3,1/4(距離分の1)
                            const totalD = ideaD.reduce(function(sum, element){
                                return sum + element;
                              }, 0);// 1/3+1/4(距離分の1の合計)
                            // ideaD.forEach(function(value, index, array){array[index]=Math.floor(value/totalD*100)});
                            ideaD.forEach(function(value, index, array){array[index]=value/totalD});
                            const ideaBox = result.map(w => w.idea);
                            const p = ideaD;//当選確率
                            var lot = p.reduce((value, index, array) => {
                                value[ideaBox[array]] = index;
                                return value;
                            }, {});
                            const array = Object.keys(lot).map((k)=>({ key: k, value: lot[k] }));
                            array.sort((a, b) => a.value - b.value);
                            lot = Object.assign({}, ...array.map((item) => ({
                            [item.key]: item.value,
                            })));
                            console.log(lot);
                            //   昇順に並び替えた
                            // var number = Math.floor(Math.random()*100);
                            var number = Math.random();
                            var weight = 0;
                            var election = "";
                            for(var key in lot){
                                weight += lot[key]; //すき焼き:0.1、焼肉:0.5、しゃぶしゃぶ:1
                                if(number < weight){
                                election = key;
                                break;
                                }
                            }
                            console.log(election);//抽選結果
                            const saveResult = { hit: election, roomName: room };
                            lotteryResult.create(saveResult);
                            const lotteryData = { election, lot }
                            io.to(room).emit('lottery start', lotteryData);
                            //抽選結果をクライアントに送って、ルーレットの画面を出す  
                            }
                        
                        })
                    }else{
                        io.to(room).emit('lottery start', null);
                    }

                }})
                
                    
                    
                    }
               
                })
            }}
            });
        })
    });
});


server.listen(port, () => {
    console.log('Server listening on port:'  + port);
});