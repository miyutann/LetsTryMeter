let socket;

socket = io();

socket.on('room add', (roomName) => {
    const anchor = document.createElement('a');
    anchor.textContent = roomName;
    roomForm.appendChild(anchor);
    anchor.href = "/rooms/" + roomName;

    //rooms.jsでルームを選択したら、
    //サーバ側で「socket.join(ルームの名前)」
    //入室したルーム名もサーバに保存できるようにする
});

const roomForm = document.getElementById('roomForm');
const roomNameInput = document.getElementById('roomNameInput');
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
