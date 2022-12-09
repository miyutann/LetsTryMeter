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
    resizeCanvas(document.body.clientWidth -140, 400);//元は-40
}

function windowResized(){
    adjustCanvasSize();
}

function drawArrow(){
    line(10, 200, document.body.clientWidth -170, 200);
    line(document.body.clientWidth -165, 215, document.body.clientWidth -150, 200);
    line(document.body.clientWidth -165, 185, document.body.clientWidth -150, 200);
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
    background(196);
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
    }
    else{
        fill(255);
    }
    rect(x, y, w, h);
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
    socket.on('will input', (will) => {
        // const usersWill = will.name + ": " + will.will + "%の挑戦したい";
        const usersWill = ": 🆗";
        const w = document.createElement('li');
        w.textContent = usersWill;
        willInput.appendChild(w);
    })
    lotteryButton = false;
}

function lotteryButtonClicked(){
    const msg = "抽選しました！";
    console.log(msg);
    socket.emit('lottery start', msg);
    socket.on('lottery start', (bestIdea) => {
        console.log(bestIdea);
        const result = document.createElement('li');
        result.textContent = bestIdea.idea;
        lotteryResult.appendChild(result);
    })
}

function showLoginMembers(member){
    console.log(member);
    const mid = "member-" + member;
    let u = document.getElementById(mid);
    console.log(u);
    if(!u){
        u = document.createElement('li');
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
    }
}



