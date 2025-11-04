const express = require('express');
const router = express.Router();
const roomsController = require('../controllers/roomsController');

router.post('/rooms', roomsController.createRoom);
router.post('/rooms/:roomId/join', roomsController.joinRoom);
router.get('/rooms/:roomId', roomsController.getRoom);
router.get('/rooms', roomsController.listRooms);

module.exports = router;