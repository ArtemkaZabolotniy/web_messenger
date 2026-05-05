const chatsContainer = document.querySelector('#chats');
let currentUser;
let myConnection;

const autoScroll = () => {
  const chat = document.querySelector('#main_chat');
  chat.scrollTop = chat.scrollHeight;
};

async function loadUserFromUrl() {
  const parts = window.location.pathname.split('/');
  const id = parts[parts.length - 1];

  if (!id) return;

  const response = await fetch('/api/user/' + encodeURIComponent(id));
  if (!response.ok) {
    console.error('Cannot load user');
    return;
  }

  currentUser = await response.json();
  if (currentUser) {
    initWebSocket();
  }
}
const knownUsers = [];
loadUserFromUrl();
const searchBtn = document.querySelector('#search');

async function searchUser() {
  const usernameToFind = document.querySelector('#search').value.trim();
  try {
    const response = await fetch('/api/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username: usernameToFind }),
    });
    const findedUser = await response.json();
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Network response is not ok');
    }
    const isKnownUser = knownUsers.some(
      (user) => user.id === findedUser.id || user.username === findedUser.username
    );
    const isSelf = findedUser.id === currentUser.id;

    if (findedUser && !isKnownUser && !isSelf) {
      knownUsers.push(findedUser);
      document.querySelector('#chats').innerHTML += `
      <div class="chat" data-id='${findedUser.id}'>
        <div class="left">
          <img src="/client/img/user_icon.png" alt="" class="user_icon" />
          ${findedUser.username}
        </div>
      </div>
      `;
    }
    if (!findedUser) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Network response is not ok');
    }
  } catch (error) {
    console.log('Error:', error);
  }
}

searchBtn.addEventListener('keydown', searchUser);

let activeChat;

chatsContainer.addEventListener('click', getActiveUser);
function getActiveUser(event) {
  const clickedChat = event.target.closest('.chat');
  if (!clickedChat) return;

  const userId = clickedChat.dataset.id;
  activeChat = knownUsers.find((u) => u.id === Number(userId));
  loadChatHistory(activeChat);
}
function loadChatHistory(receiver) {
  const payload = {
    type: 'load_history',
    fromId: currentUser.id,
    toId: receiver.id,
  };
  myConnection.send(JSON.stringify(payload));
}
function initWebSocket() {
  myConnection = new WebSocket('ws://' + window.location.host);
  myConnection.onopen = function () {
    const authPayload = {
      type: 'connect_user',
      fromId: currentUser.id,
    };
    myConnection.send(JSON.stringify(authPayload));
  };
  myConnection.onmessage = function (event) {
    const unpackedData = JSON.parse(event.data);
    const friendName = activeChat.username;
    document.querySelector('#UsernameChat').innerHTML = friendName;
    if (unpackedData.type === 'history_data') {
      chat.innerHTML = '';
      unpackedData.data.forEach((element) => {
        const text = element.text;
        const isMine = element.fromId === currentUser.id;
        chat.innerHTML += `
   <div class="${isMine ? 'my_massege' : 'friend_massege'}"><span class="${isMine ? 'my_text' : 'friend_text'}">${text}</span></div>
  `;
      });
      autoScroll();
      return;
    }

    if (!activeChat || unpackedData.fromId !== activeChat.id) return;

    const text = unpackedData.text;
    chat.innerHTML += `
   <div class="friend_massege"><span class="friend_text">${text}</span></div> 
  `;
    autoScroll();
  };
}
let createNewGroup;
function openModalWindow() {
  const modalWindow = document.createElement('dialog');
  modalWindow.className = 'modal_window';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'modal_close_btn';
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', 'Close dialog');
  closeBtn.innerHTML = '&times;';
  closeBtn.addEventListener('click', () => modalWindow.close());

  const modalCards = document.createElement('div');
  modalCards.className = 'modal-cards';

  modalWindow.appendChild(closeBtn);
  modalWindow.appendChild(modalCards);
  modalWindow.insertAdjacentHTML(
    'beforeend',
    `
      <div id="group-create-panel" class="group-create-panel--modal">
        <input type="text" id="group-name-input" placeholder="Enter group name" />
        <button id="create-group-btn" type="button">Create Group</button>
      </div>
    `
  );
  document.body.appendChild(modalWindow);
  createNewGroup = document.querySelector('#create-group-btn');
  modalWindow.showModal();
  modalWindow.addEventListener('close', () => modalWindow.remove());
  knownUsers.forEach((u) => {
    modalCards.insertAdjacentHTML(
      'beforeend',
      `
        <div class="chat" data-status="false">
          <div class="left">
            <img src="/assets/user_icon.png" alt="" class="user_icon" />
            <span class = 'innerUserName' data-user-name='${u.username}'>${u.username}</span>
          </div>
      </div>
      `
    );
  });
  modalCards.addEventListener('click', (e) => {
    let chat = e.target.closest('.chat');
    chat.dataset.dataStatus = e.target.closest('.chat').dataset.dataStatus === "true" ? "false" : "true";
  })
  createNewGroup.addEventListener('click', () => {
    const allChats = modalCards.querySelectorAll('.chat');
    const name = document.querySelector('#group-name-input').value;
    let payload = {
      type:"group_create",
      grouName:name,
      people:[]
    }
    allChats.forEach(chat => {
      if(chat.dataset.dataStatus === "true") {
        const userForGroupCreate = chat.querySelector('.innerUserName').dataset.userName;
        payload.people.push(userForGroupCreate)
      }
    })
    myConnection.send(JSON.stringify(payload))
  });
}
function greateGroup() {}
const gropuMakerBtn = document.querySelector('#new-group-btn');
gropuMakerBtn.addEventListener('click', openModalWindow);

const sendBtn = document.querySelector('#send_massage');
const inputValue = document.querySelector('#input_send');

const sendMsg = () => {
  if (!activeChat) return;
  const sendValue = inputValue.value;
  if (!sendValue.trim()) return;
  let chat = document.querySelector('#main_chat');
  chat.innerHTML += `<div class="my_massege"><span class="my_text">${sendValue}</span></div>`;
  autoScroll();
  const fullMsg = {
    type: 'sendMsg',
    fromId: currentUser.id,
    toId: activeChat.id,
    text: sendValue,
  };
  myConnection.send(JSON.stringify(fullMsg));
};

sendBtn.addEventListener('click', sendMsg);
