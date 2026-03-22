const express = require('express');
const path = require('path');
const app = express();

const PORT = 3000;
app.use(express.static(path.join(__dirname, '../static')));
app.use(express.json());

const defaultUsers = [
  {
    id: 1,
    username: 'admin',
    password: 'admin',
  },
  {
    id: 2,
    username: 'Yehor',
    password: 'DevOps',
  },
];
let users = defaultUsers.map((u) => ({ ...u }));

function resetUsers() {
  users = defaultUsers.map((u) => ({ ...u }));
}

app.post('/api/login', (req, res) => {
  const user = users.find((u) => u.username == req.body.username);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  } else if (user.password != req.body.password) {
    return res.status(401).json({ error: 'Invalid password' });
  } else {
    res.json({ id: user.id, username: user.username });
  }
});

app.post('/api/register', (req, res) => {
  const userExists = users.find((u) => u.username === req.body.username);
  if (userExists) {
    return res.status(409).json({ error: 'User already exists' });
  }

  const newUser = {
    id: users.length > 0 ? users.at(-1).id + 1 : 1,
    username: req.body.username,
    password: req.body.password,
  };
  
  users.push(newUser);
  res.status(200).json(newUser); // Fixed: sends the object, not the array length
});

app.get('/user/:id', (req, res) => {
  const user = users.find((u) => String(u.id) === req.params.id);
  if (!user) {
    return res.status(404).send('User not found');
  }

  res.sendFile(path.join(__dirname,'..' ,'static', 'user.html'));
});

app.get('/api/user/:id', (req, res) => {
  const user = users.find((u) => String(u.id) === req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User is not found' });
  }
  res.json({
    id: user.id,
    username: user.username,
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

app.post('/api/search', (req, res) => {
  const { username } = req.body;
  // Check if username is missing, empty, or just spaces
  if (!username || username.trim() === '') {
    return res.status(400).json({ error: 'Username is required' });
  }

  const searchUser = users.find((u) => u.username === username);
  if (searchUser) {
    const { password, ...userWithoutPassword } = searchUser; // Security: don't send password
    res.json(userWithoutPassword);
  } else {
    res.status(404).json({ error: 'User is not found' });
  }
});

module.exports = { app, resetUsers };
