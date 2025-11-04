const { v4: uuidv4 } = require('uuid');

const users = new Map(); // id -> { id, username, password }
const tokens = new Map(); // token -> userId

function sanitize(user) {
    if (!user) return null;
    const { password, ...rest } = user;
    return rest;
}

function findByUsername(username) {
    for (let user of users.values()) {
        if (user.username === username) return user;
    }
    return null;
}

function registerUser(req, res) {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).send('Username and password are required');
    if (findByUsername(username)) return res.status(409).send('Username already exists');

    const id = uuidv4();
    const newUser = { id, username, password };
    users.set(id, newUser);
    res.status(201).json(sanitize(newUser));
}

function loginUser(req, res) {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).send('Username and password are required');

    const user = findByUsername(username);
    if (!user || user.password !== password) return res.status(401).send('Invalid credentials');

    const token = uuidv4();
    tokens.set(token, user.id); // store actual user.id
    return res.json({ token, user: sanitize(user) });
}

function verifyTokenHandler(req, res) {
    const token = req.params.token;
    const userId = tokens.get(token);
    if (!userId) return res.status(404).send('Token not found');
    res.json({ valid: true, userId });
}

function getUser(req, res) {
    const userId = req.params.userId;
    const user = users.get(userId);
    if (!user) return res.status(404).send('User not found');
    res.json(sanitize(user));
}

function getAllUsers(req, res) {
    const list = Array.from(users.values()).map(u => sanitize(u));
    res.json(list);
}

module.exports = {
    registerUser,
    loginUser,
    verifyTokenHandler,
    sanitize,
    getUser,
    getAllUsers
};