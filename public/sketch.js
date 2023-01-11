let socket;

const ideaForm = document.getElementById('ideaForm');
const ideaText = document.getElementById('ideaText');
const ideaButton = document.getElementById('ideaButton');

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

    socket = io();
    socket.on('idea log', ideaLogReceived);
    socket.on('idea add', newIdeaAdded);
    socket.on('idea move', ideaMoved);
    socket.on('idea released', ideaReleased);
}

function adjustCanvasSize(){
    resizeCanvas(document.body.clientWidth - 40, 400);
}

function windowResized(){
    adjustCanvasSize();
}

// ----------------------------------------------------------------------------
// Render data
// ----------------------------------------------------------------------------

const ideas = new Map();
let grabbed = null;

function draw(){
    background(196);
    drawIdeas();
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

function canvasMousePressed() {
    const reversed = Array.from(ideas.values()).reverse();
    for(let i = reversed.length - 1; i >= 0; i--){
        const idea = reversed[i];
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

// ----------------------------------------------------------------------------
// Network Event Handlers
// ----------------------------------------------------------------------------
function ideaLogReceived(data){
    data.forEach(newIdeaAdded);
}

function newIdeaAdded(data){
    ideas.set(data.id, data);
}

function ideaMoved(data){
    const target = ideas.get(data.id);
    if(target){
        target.x = data.x;
        target.y = data.y;
        target.grabbed = true;
    }
}

function ideaReleased(data){
    const target = ideas.get(data.id);
    if(target){
        target.grabbed = false;
    }
}
