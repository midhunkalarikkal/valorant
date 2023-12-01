require("dotenv").config()
const express = require('express')
const session = require('express-session')
const mongoose = require('mongoose')
const MongoStore = require("connect-mongo")

const app = express()
const PORT = process.env.PORT || 7000

//databse connection
mongoose.connect(process.env.DB_URI)
const db = mongoose.connection
db.on("error" , (error) => console.log(err , "Db connection error"))
db.once("open" , () => console.log("Database connected"))

//view engine
app.set("view engine","ejs")

//middlewares
app.use(express.urlencoded({extended : true}))
app.use(express.json())

app.use('/static', express.static(path.join(__dirname, "public")))
app.use("",require("./routes/router"))


//session
app.use(session({
    secret : "my secret key",
    saveUninitialized : false,
    resave : false,
    store: MongoStore.create({ mongoUrl:process.env.DB_URI }),
    cookie:{
        name:'myCookie',
        maxAge:1000*60*60*2,
        sameSite: true,
    }
}))


app.use((req,res,next)=>{
    res.locals.message = req.session.message
    delete req.session.message
    next()
})


app.listen(PORT, ()=> { 
    console.log(`Server is listening to the port ${PORT}`)
})