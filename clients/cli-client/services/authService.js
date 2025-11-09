const axios = require('axios');
const { USER_SERVICE_URL } = require('../config/config');

async function login(username, password) {
    try {
        const reponse = await axios.post(`${USER_SERVICE_URL}/login`,
            { username, password },
            { timeout: 2000 });
        return reponse.data;
    } catch (error) {
        if (error.response && error.response.status === 401) {
            throw new Error('Invalid username or password');
        }
        throw new Error('Login failed: ' + error.message);
    }
}
async function register(username, password) {
    try {
        const reponse = await axios.post(`${USER_SERVICE_URL}/register`,
            { username, password },
            { timeout: 2000 });
        return reponse.data;
    } catch (error) {
        if (error.response && error.response.status === 409) {
            throw new Error('Username already exists');
        }
        throw new Error('Registration failed: ' + error.message);
    }
}
module.exports = {
    login,
    register
};