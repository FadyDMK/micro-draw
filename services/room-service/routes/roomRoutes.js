const express = require('express');
const router = express.Router();
const roomsController = require('../controllers/roomsController');

router.post('/rooms/create', roomsController.createRoom);
router.post('/rooms/join/:roomId', roomsController.joinRoom);
router.get('/rooms/:roomId', roomsController.getRoom);
router.get('/rooms', roomsController.listRooms);

module.exports = router;