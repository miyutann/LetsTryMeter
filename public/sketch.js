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

    ideaForm.addEventListener('submit', ideaSubmit);
    // ideaButton.addEventListener('click', ideaButtonClicked);

    socket = io();
    socket.on('idea', newIdeaAdded);
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

const ideas = [];

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
    const w = textWidth(idea);
    const h = textAscent() + textDescent();
    rect(x, y, w, h);
    text(idea, x, y);
}

// ----------------------------------------------------------------------------
// UI Event Handlers
// ----------------------------------------------------------------------------

function canvasClicked(){

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
function newIdeaAdded(data){
    ideas.push(data);
}