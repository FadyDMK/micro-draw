const express = require('express');
const usersRouter = require('./routes/userRoutes');
const port = process.env.PORT || 3000;
const path = require("path");
 

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/', usersRouter);



app.listen(port, () => {
    console.log(`User Service running on port ${port}`);
});
