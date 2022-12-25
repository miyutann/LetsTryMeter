let socket;

const ideaForm = document.getElementById('ideaForm');
const ideaText = document.getElementById('ideaText');
const ideaButton = document.getElementById('ideaButton');
const willButton = document.getElementById('willButton');
const lotteryButton = document.getElementById('lotteryButton');
const lotteryResult = document.getElementById('lotteryResult');
const willInput = document.getElementById('usersInput');
const joinedMembers = document.getElementById('members');


const members = [];

// ----------------------------------------------------------------------------
// Setup
// ----------------------------------------------------------------------------

function setup(){
    const canvas = createCanvas(600, 400);
    canvas.parent('p5container');
    adjustCanvasSize();

    canvas.mouseClicked(canvasClicked);
    canvas.mouseMoved(canvasMouseMoved);
    canvas.mousePressed(canvasMousePressed);
    canvas.mouseReleased(canvasMouseReleased);

    ideaForm.addEventListener('submit', ideaSubmit);
    // ideaButton.addEventListener('click', ideaButtonClicked);
    willButton.addEventListener('click', willButtonClicked);
    lotteryButton.addEventListener('click', lotteryButtonClicked);

    // slider = createSlider(0, 100, 50, 1);
    // slider.position(10, 0);
    // slider.style('width', '80px');
    slider = document.getElementById("willSlider");

    socket = io();
    socket.on('idea log', ideaLogReceived);
    socket.on('idea add', newIdeaAdded);
    socket.on('idea move', ideaMoved);
    socket.on('idea released', ideaReleased);
    socket.on('login log', loginLogReceived);

    const userName = window.prompt("名前を入力してください");
    socket.emit('login', { roomName, userName });

    socket.on('login', (member) => {
        console.log(`${member}が参加しました!`);
        // document.querySelector('#users').innerHTML = ``;
        members.push(member);
        members.forEach(showLoginMembers);
    })

}



function adjustCanvasSize(){
    resizeCanvas(document.body.clientWidth -40, 400);//元は-40
}

function windowResized(){
    adjustCanvasSize();
}

// function fire(){
//     let place = slider.value();
//     let fireX = (document.body.clientWidth - 50)/100*place;
//     textSize(60);
//     text("🔥", fireX, 215);    
// }

// ----------------------------------------------------------------------------
// Render data
// ----------------------------------------------------------------------------

const ideas = [];
let grabbed = null;

function draw(){
    background(255,249,235);
    drawArrow();
    drawIdeas();
    drawMarker(slider.value);
    
}

function drawMarker(will){
    push();
    const marker = "🔥";
    textSize(50);
    let X = (width-textWidth(marker))/100*will;
    // ellipse(X, 200, 20, 20);
    text(marker, X, 215);
    // text(will, X, 215);
    pop();
}

function drawIdeas(){
    push();
    textAlign(CENTER, CENTER);
    rectMode(CENTER);
    textSize(15);
    ideas.forEach(drawIdea);
    pop();
}

function drawIdea(data){
    const idea = data.idea;
    const x = data.x * width;
    const y = data.y * height;
    const { w, h } = getTextSize(idea);
    if(data.grabbed){
        fill(190);
    }else if(x<width/5){
        fill(255);
    }else if(width/5<=x && x<width*2/5){
        fill(255,249,210);
    }else if(width*2/5<=x && x<width*3/5){
        fill(255,188,0);
    }else if(width*3/5<=x && x<width*4/5){
        fill(255,152,0);
    }else{
        fill(255,80,0);
    }
    rect(x, y, w, h, h/9);
    fill(0);
    text(idea, x, y);
}

function getTextSize(text){
    const w = textWidth(text) + 4;
    const h = textAscent() + textDescent() + 4;
    return { w, h };
}

function isIdeaAt(idea, x, y){
    const dx = Math.abs(idea.x * width - x);
    const dy = Math.abs(idea.y * height - y);
    const { w, h } = getTextSize(idea);
    return dx < w / 2 && dy < h / 2;
}

function drawArrow(){
    push();
    line(10, 200, document.body.clientWidth -50, 200);
    line(document.body.clientWidth -65, 215, document.body.clientWidth -50, 200);
    line(document.body.clientWidth -65, 185, document.body.clientWidth -50, 200);
    textSize(30);
    text("Try!", document.body.clientWidth -100, 165);
    pop();
}


// ----------------------------------------------------------------------------
// UI Event Handlers
// ----------------------------------------------------------------------------

function canvasClicked(){

}

function canvasMousePressed(){
    for(let i = ideas.length - 1; i >= 0; i--){
        const idea = ideas[i];
        if(!idea.grabbed && isIdeaAt(idea, mouseX, mouseY)){
            idea.grabbed = true;
            grabbed = idea;
            socket.emit('idea move', grabbed);
            return;
        }
    }
}

function canvasMouseReleased(){
    ideas.forEach(idea => idea.grabbed = false);
    socket.emit('idea released', grabbed);
    grabbed = null;
}

function canvasMouseMoved(){
    if(grabbed){
        grabbed.x = constrain(mouseX / width, 0, 1);
        grabbed.y = constrain(mouseY / height, 0, 1);
        socket.emit('idea move', grabbed);
    }
}

function ideaSubmit(e){
    e.preventDefault();
    const idea = ideaText.value;
    if(idea){
        socket.emit('idea add', { idea });
        ideaText.value = '';
    }
    return false;
}

function willButtonClicked(e){
    e.preventDefault();
    const will = slider.value;
    //スライダーを動かせないようにしたい
    socket.emit('will input', will);
    socket.on('will input', (data) => {
        // var parent = document.querySelector('.justify-content-start list-inline');
        // var target = document.querySelector('.list-inline-item');
        // parent.removeChild(target);
        // console.log(will);
        // const w = document.createElement('li');
        // w.className = 'list-inline-item';
        // w.textContent = will;
        // willInput.appendChild(w);
    })
    // lotteryButton = false;
}

function lotteryButtonClicked(){
    const msg = "抽選しました！";
    console.log(msg);
    socket.emit('lottery start', msg);
    socket.on('lottery start', (data) => {
        console.log(data.election);
        // const result = document.createElement('li');
        // result.textContent = data.value;
        // lotteryResult.appendChild(result);
    })
}

function showLoginMembers(member){
    console.log(member);
    const mid = "member-" + member;
    let u = document.getElementById(mid);
    console.log(u);
    if(!u){
        u = document.createElement('li');
        u.className = 'list-inline-item';
        u.textContent = member;
        u.id = mid;
        joinedMembers.appendChild(u);
    }

}

// ----------------------------------------------------------------------------
// Network Event Handlers
// ----------------------------------------------------------------------------
function loginLogReceived(data){
    data.forEach(member => members.push(member));
    members.forEach(showLoginMembers);
    //dataの中にあるmemberをmembersに順に入れていく
}

function ideaLogReceived(data){
    data.forEach(idea => ideas.push(idea));
}

function newIdeaAdded(data){
    ideas.push({ ...data, grabbed: false });
}

const themes = ['gohan', 'asobi'];
const gohan = ["美味しいシュウマイ", "回転寿司", "お好み焼き"];
const asobi = ["ユニバ", "プラネタリウム", "岩盤浴"];
const output = document.getElementById('ideaText');
themes.forEach((value)=>{
    const getTheme = document.getElementById(value);
    getTheme.addEventListener('click', ()=>{
    const text = getTheme.textContent;
    if(text=="ご飯🍚"){
        const randomG = gohan[Math.floor(Math.random()*gohan.length)];
        output.value = randomG;
    }else if(text=="遊び🎡"){
        const randomA = asobi[Math.floor(Math.random()*asobi.length)];
        output.value = randomA;
    }
    })
})


function ideaMoved(data){
    const target = ideas.find(idea => idea.id == data.id);
    if(target){
        target.x = data.x;
        target.y = data.y;
        target.grabbed = true;
    }
}

function ideaReleased(data){
    const target = ideas.find(idea => idea.id == data.id);
    if(target){
        target.grabbed = false;
        socket.emit('lottery ready', data);
    }
}



