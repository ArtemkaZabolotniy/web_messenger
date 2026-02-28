import users from './localStorage.js';
let logInUser = null;
let logInData = null;

window.getInform = () => {
    const user = document.getElementById("username").value;
    const pass = document.getElementById("password").value;
    let flag = true;
    for(let elem in users) {
        if(users[elem].username == user) {
            alert("User with same username already existed");
            flag = false;
            break;
        }
    }
    if(flag == true) {
        users.push(
            {
            id:users.at(-1).id+1,
            username:user,
            password:`${pass}`
            }
        )
    }
}
window.logIn = () => {
    const user = document.getElementById("username").value;
    const pass = document.getElementById("password").value;
    for(let elem in users) {
        if(users[elem].username == user && users[elem].password == pass) {
            const logInUsername = users[elem].username;
            const logInPassword = users[elem].password;
            logInData = [logInUsername, logInPassword];
            // pushimo w json
            try {
                localStorage.setItem('logInData', JSON.stringify(logInData));
            } catch (e) {
                console.warn('could not store login data', e);
            }
            window.open("./usersPage.html","_blank");
        }
    }
}
window.showUp = () => {
    console.log(users)
}