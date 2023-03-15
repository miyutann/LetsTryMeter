const rooms = document.getElementById('rooms');
const roomForm = document.getElementById('roomForm');
const roomNameInput = document.getElementById('roomNameInput');

const socket = io();

socket.on('room add', (roomName) => {
    const anchor = document.createElement('a');
    anchor.textContent = roomName;
    anchor.href = "/rooms/" + roomName;
    const li = document.createElement('li');
    li.appendChild(anchor);
    rooms.appendChild(li);

    //rooms.jsでルームを選択したら、
    //サーバ側で「socket.join(ルームの名前)」
    //入室したルーム名もサーバに保存できるようにする
});


roomForm.addEventListener('submit', roomNaming);

function roomNaming(e){
    e.preventDefault();
    const roomName = roomNameInput.value;
    if(roomName){
        socket.emit('room add', roomName);
        roomNameInput.value = '';
    }
    return false;
}
