const axios = require('axios');
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3000';

async function verifyToken(token) {
    if (!token) return null;

    try{
        const response = await axios.get(`${USER_SERVICE_URL}/users/tokens/${encodeURIComponent(token)}`, { timeout: 2000 });
        return response.data && response.data.userId ? response.data.userId : null;
    } catch (error) {
        return null;
    }
}

module.exports = {
    verifyToken
};