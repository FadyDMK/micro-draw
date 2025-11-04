const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');

router.get('/tokens/:token', usersController.verifyTokenHandler); 
router.get('/user/:userId', usersController.getUser);

router.post('/register', usersController.registerUser);
router.post('/login', usersController.loginUser);
router.get('/user/all', usersController.getAllUsers);


module.exports = router;

