const express = require('express');
const router = express.Router();
const roomsController = require('../controllers/roomsController');

router.post('/create', roomsController.createRoom);
router.post('/join/:roomId', roomsController.joinRoom);
router.get('/:roomId', roomsController.getRoom);
router.get('/', roomsController.listRooms);

module.exports = router;