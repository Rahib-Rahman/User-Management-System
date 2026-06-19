require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const router = require('./routes/user.routes');
const PORT = process.env.PORT || 5000;

const app = express();

app.use(cors({
    origin: [process.env.CLIENT_URL,           // https://rahib-user-management-system.netlify.app
        "http://localhost:5173",          // for local development
        "http://localhost:3000"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"]
}));

app.use(express.json());
app.use(passport.initialize());
require('./middleware/auth.passport')(passport);
app.use('/api', router);

const start = async () => {
    try {
        app.listen(PORT, () => {
            console.log(`Server started on ${PORT}`);
        });
    } catch (error) {
        console.log(error);
    }
};

start();