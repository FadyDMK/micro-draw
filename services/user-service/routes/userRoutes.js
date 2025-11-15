const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');

router.get('/tokens/:token', usersController.verifyTokenHandler); 
router.get('/:userId', usersController.getUser);

router.post('/register', usersController.registerUser);
router.post('/login', usersController.loginUser);
router.get('/all', usersController.getAllUsers);


module.exports = router;

