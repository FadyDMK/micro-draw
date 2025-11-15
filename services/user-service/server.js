const express = require('express');
const cors = require('cors');
const usersRouter = require('./routes/userRoutes');
const port = process.env.PORT || 3000;
const path = require("path");
 

const app = express();
app.use(cors()); // Enable CORS for all routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/users', usersRouter);



app.listen(port, () => {
    console.log(`User Service running on port ${port}`);
});
