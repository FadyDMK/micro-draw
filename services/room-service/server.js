const express = require('express');
const roomRoutes = require('./routes/roomRoutes');
const port = process.env.PORT || 4000;
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/', roomRoutes);
app.listen(port, () => {
    console.log(`Room Service running on port ${port}`);
});