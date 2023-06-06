let socket;

const ideaForm = document.getElementById('ideaForm');
const ideaText = document.getElementById('ideaText');
const ideaButton = document.getElementById('ideaButton');
// const willButton = document.getElementById('willButton');
// const lotteryButton = document.getElementById('lotteryButton');
// const lotteryResult = document.getElementById('lotteryResult');
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
    willButton.addEventListener('click', willButtonClicked);
    lotteryButton.addEventListener('click', lotteryButtonClicked);

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
    // textSize(50);

    // const marker = "";
    // const markerX = (width - textWidth(marker)) / 100 * will;
    // const minWillX = (width - textWidth(marker)) / 100 * minWill;

    // text(marker, markerX, 215);
    // if(minWill) text(marker, minWillX, 215);

    // textSize(13);
    // text(`あなた`, markerX + 15, 170);
    // text(`${will}%`, markerX + 20, 235);
    // if (minWill) {
    //     text("メンバー最小値", minWillX - 35, 170);
    //     text(`${minWill}%`, minWillX - 5, 235);            
    // }

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
    // textAlign(CENTER, TOP);
    // textSize(20);

    // if (state == 1) {
    //     const t = millis();
    //     if (drawRoulette(t - startTime, lotteryData.selectedIndex)) {
    //         stopTime = t;
    //         state = 2;
    //     }
    //     text("抽選中...", width * 0.5, 0);
    // }
    // else if (state == 2) {
    //     drawRoulette(stopTime - startTime, lotteryData.selectedIndex);
    //     text(selectedIdea() + "が選ばれました!", width * 0.5, 0);
    //     // share();
    // }

    pop();
}

function drawRoulette(t, hit) { // t = アニメーション経過時間, hit = あたりの番号
    // const lottery = lotteryData.lottery;
    // const a = log(t) * 10;

    push();
    // fill(255);
    // rect(0, 0, width, height);

    // stroke(255, 204, 0);
    // fill(255, 204, 0);
    // const x = width * 0.8;
    // const y = height * 0.5;
    // triangle(x, y + 10, x, y - 10, x - 20, y);

    // textAlign(CENTER, CENTER);
    // translate(width / 2, height / 2);

    // rotate(a);

    // const hitSum = sumArray(lottery.slice(0, hit).map(l => l.p));
    // const hitA = (TWO_PI * hitSum + a) % TWO_PI;
    // const hitRange = TWO_PI * lottery[hit].p;
    // const shouldStop = t > 5000 && (hitA > TWO_PI - hitRange / 2);

    // for (let i = 0; i < lottery.length; i++) {
    //     const p = TWO_PI * lottery[i].p / 2;
    //     rotate(p);
    //     stroke("#6c757d");
    //     fill(shouldStop && i == hit ? "#dc3545" : 255);
    //     arc(0, 0, 300, 300, -p, p, PIE);

    //     noStroke();
    //     fill(0);
    //     text(lottery[i].idea, 100, 0);
    //     rotate(p);
    // }

    pop();

    // return shouldStop; // returns true if animation should stop
}

function selectedIdea() {
    // return lotteryData ? lotteryData.lottery[lotteryData.selectedIndex].idea : "";
}

function sumArray(arr) {
    // return arr.reduce((acc, v) => acc + v, 0);
}

function rouletteStart() {
    // state = 1;
    // startTime = millis();
}

function share() {
    // const share_line = document.getElementById("js-share-line");
    // share_line.setAttribute(
    //     "href",
    //     "https://social-plugins.line.me/lineit/share?url=" + share_url
    // );
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
    // e.preventDefault();
    // const will = slider.value;
    // slider.disabled = true;
    // socket.emit('will input', will);
}

function lotteryButtonClicked() {
    socket.emit('lottery start');
    socket.on('lottery start', (data) => {
        if (data) {
            lotteryData = data;
            rouletteStart();
        }
    })
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

// let willArray = []; 

function willInputReceived(data) {
    // will = data.will;
    // if(will > minWill) {
    //     minWill = will;
    // }

    // willArray.push(data);
    // let sum = 0;
    // for(let i = 0; i < willArray.length; i++){
    //     sum += willArray[i];
    // }
    // minWill = sum / willArray.length;
}