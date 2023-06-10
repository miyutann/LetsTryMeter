let socket;

const ideaForm = document.getElementById('ideaForm');
const ideaText = document.getElementById('ideaText');
const ideaButton = document.getElementById('ideaButton');
// 
const willInput = document.getElementById('usersInput');
const joinedMembers = document.getElementById('members');
const slider = document.getElementById("willSlider");


const members = [];

let minWill;
let state; // 0 = start, 1 = roulette rotating, 2 = roulette stoppped
let startTime, stopTime; // roulette start time and stop time
let lotteryData;

// ----------------------------------------------------------------------------
// Setup
// ----------------------------------------------------------------------------

function setup() {
    const canvas = createCanvas(600, 400);
    canvas.parent('p5container');
    adjustCanvasSize();

    canvas.mouseMoved(canvasMouseMoved);
    canvas.mousePressed(canvasMousePressed);
    canvas.mouseReleased(canvasMouseReleased);

    ideaForm.addEventListener('submit', ideaSubmit);
    //

    socket = io();
    socket.on('idea log', ideaLogReceived);
    socket.on('idea add', newIdeaAdded);
    socket.on('idea move', ideaMoved);
    socket.on('idea released', ideaReleased);
    socket.on('login log', loginLogReceived);
    socket.on('will input', willInputReceived);

    const userName = window.prompt("名前を入力してください");
    socket.emit('login', { roomName, userName });

    socket.on('login', (data) => {
        console.log(data.member + "が参加しました!");
        minWill = data.minWill;
        members.push(data.member);
        members.forEach(showLoginMembers);
    })

    state = 0;
}

function adjustCanvasSize() {
    resizeCanvas(document.body.clientWidth - 40, 400);//元は-40
}

function windowResized() {
    adjustCanvasSize();
}

// ----------------------------------------------------------------------------
// Render data
// ----------------------------------------------------------------------------

const ideas = new Map();
let grabbed = null;

function draw() {
    background(255, 249, 235);
    drawArrow();
    drawIdeas();
    drawMarker(slider.value);
    showRoulette();
}

function drawMarker(will) {
    push();
    // 
    pop();
}

function drawIdeas() {
    push();
    textAlign(CENTER, CENTER);
    rectMode(CENTER);
    textSize(15);
    ideas.forEach(drawIdea);
    pop();
}

function drawIdea(data) {
    const idea = data.idea;
    const x = data.x * width;
    const y = data.y * height;
    const { w, h } = getTextSize(idea);
    if (data.grabbed) {
        fill(190);
    } else if (x < width * 0.2) {
        fill(255);
    } else if (x < width * 0.4) {
        fill(255, 249, 210);
    } else if (x < width * 0.6) {
        fill(255, 188, 0);
    } else if (x < width * 0.8) {
        fill(255, 152, 0);
    } else {
        fill(255, 80, 0);
    }
    rect(x, y, w, h, h / 9);
    fill(0);
    text(idea, x, y);
}

function getTextSize(text) {
    const w = textWidth(text) + 4;
    const h = textAscent() + textDescent() + 4;
    return { w, h };
}

function isIdeaAt(idea, x, y) {
    const dx = Math.abs(idea.x * width - x);
    const dy = Math.abs(idea.y * height - y);
    const { w, h } = getTextSize(idea);
    return dx < w / 2 && dy < h / 2;
}

function drawArrow() {
    push();
    line(10, 200, width - 50, 200);
    line(width - 65, 215, width - 50, 200);
    line(width - 65, 185, width - 50, 200);
    textSize(13);
    text("0%", 10,180);
    text("100%", width-50,180);
    text("High →", width * 0.5, 20);
    text("← Low", width * 0.5 - 80, 20);
    pop();
}

function showRoulette() {
    push();
    // 
    pop();
}

function drawRoulette(t, hit) { // t = アニメーション経過時間, hit = あたりの番号
    //
    push();
    // 
    pop();
    //
}

function selectedIdea() {
    // 
}

function sumArray(arr) {
    //
}

function rouletteStart() {
    //
}

function share() {
    //
}

// ----------------------------------------------------------------------------
// UI Event Handlers
// ----------------------------------------------------------------------------

function canvasMousePressed() {
    const reversed = Array.from(ideas.values()).reverse();
    for (let i = reversed.length - 1; i >= 0; i--) {
        const idea = reversed[i];
        if (!idea.grabbed && isIdeaAt(idea, mouseX, mouseY)) {
            idea.grabbed = true;
            grabbed = idea;
            socket.emit('idea move', grabbed);
            return;
        }
    }
}

function canvasMouseReleased() {
    if (grabbed) {
        socket.emit('idea released', grabbed);
        grabbed.grabbed = false;
        grabbed = null;            
    }
}

function canvasMouseMoved() {
    if (grabbed) {
        grabbed.x = constrain(mouseX / width, 0, 1);
        grabbed.y = constrain(mouseY / height, 0, 1);
        socket.emit('idea move', grabbed);
    }
}

function ideaSubmit(e) {
    e.preventDefault();
    const idea = ideaText.value;
    if (idea) {
        socket.emit('idea add', { idea });
        ideaText.value = '';
    }
    return false;
}

function willButtonClicked(e) {
    //
}

function lotteryButtonClicked() {
    //
}

function showLoginMembers(member) {
    console.log(member);
    const mid = "member-" + member;
    let u = document.getElementById(mid);
    if (!u) {
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
function loginLogReceived(data) {
    data.forEach(member => members.push(member));
    members.forEach(showLoginMembers);
}

function ideaLogReceived(data) {
    data.forEach(newIdeaAdded);
}

function newIdeaAdded(data) {
    ideas.set(data.id, data);
}
function pastIdeaAdded(data) {
    ideas.set(data.id, data);
}

const themes = ['gohan', 'animal'];
const gohan = ["美味しいシュウマイ", "マシュマロ", "お好み焼き","カルビ","和風パスタ","かりんとう","えだまめしか勝たん", "ピーマン","ハンバーグ"];
const animal = ["えぞりす", "きたきつね", "しまりす","たんぽぽ","かたばみ","つきのわぐま","ウーバールーパー","ハイエナ","ディンゴ"];
const output = document.getElementById('ideaText');
themes.forEach((value) => {
    const getTheme = document.getElementById(value);
    getTheme.addEventListener('click', () => {
        const text = getTheme.textContent;
        if (text == "ご飯🍚") {
            const randomG = gohan[Math.floor(Math.random() * gohan.length)];
            output.value = randomG;
        } else if (text == "生き物🐁") {
            const randomA = animal[Math.floor(Math.random() * animal.length)];
            output.value = randomA;
        }
    })
})


function ideaMoved(data) {
    const target = ideas.get(data.id);
    if (target) {
        target.x = data.x;
        target.y = data.y;
        target.grabbed = true;
    }
}

function ideaReleased(data) {
    const target = ideas.get(data.id);
    if (target) {
        target.grabbed = false;
    }
}

function willInputReceived(data) {
    //
}