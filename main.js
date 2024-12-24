require("dotenv").config()
const express = require('express')
const session = require('express-session')
const mongoose = require('mongoose')
const MongoStore = require("connect-mongo")
const path = require('path')
const cookieParser = require('cookie-parser')

const app = express()
const PORT = process.env.PORT || 7000

mongoose.connect(process.env.DB_URI)
    .then((result) => {
        app.listen(PORT, () => {
            console.log("Db connected and server listening to port 3000")
        })
    })
    .catch((err) => {
        console.log("MongoDB connection error!")
        process.exit(1)
    })


// session
app.use(cookieParser())
app.use(session({
    secret: "my secret key",
    saveUninitialized: true,
    resave: false,
    store: false,
    cookie: {
        name: 'myCookie',
        maxAge: 1000 * 60 * 60 * 2,
        sameSite: true,
    }
}))


app.use((req, res, next) => {
    res.locals.message = req.session.message
    delete req.session.message
    next()
})

app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
});

//middlewares
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

//Static file serving
app.use('/static', express.static(path.join(__dirname, "public")))
app.use(express.static("uploads"))

//Routes
app.use("", require("./routes/router"))

//view engine
app.set("view engine", "ejs")
