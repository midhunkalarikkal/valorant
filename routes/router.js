const express = require("express")
const router = express.Router()
const User = require('../models/users')
const multer = require('multer')
const fs = require('fs')

//image upload
var storage = multer.diskStorage({
    destination: function (req, res, cb) {
        cb(null, "./uploads")
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + "_" + Date.now() + "_" + file.originalname)
    }
})

var upload = multer({
    storage: storage
}).single("image")


//route to get the user login page
router.get('/', (req, res) => {
    res.render('user_login', { title: "User Login", message: '', errmsg: "" })
})

//route to get the user register page
router.get('/register', (req, res) => {
    res.render('user_register', { title: "User Register", message: '', errmsg: "" })
})

//route to get the home page
router.get('/home', (req, res) => {
    res.render('home', { title: "Home Page" })
})

//route to get the admin login
router.get('/admin', (req, res) => {
    res.render('admin_login', { title: "Admin Login", message: '', errmsg: "" })
})

//route to get the admin dashboard
router.get('/admin_dashboard', (req, res) => {
    res.render('admin_dashboard', { title: "Admin Dashboard" })
})

//route to post user register data to database
router.post("/register", upload , async (req,res)=>{
    try{
        if(req.body.password !== req.body.cpass){
            return res.render("user_register",{title : "User Register" , message : "" , errmsg : "Passsword is not matching."})
        }
        
        const existinguser = await User.findOne({ email:req.body.email })
        if(existinguser){
            return res.render("user_register",{title : "User Register" , message : "" , errmsg : "Email already in use."})
        }
        
        const  user = new User({
            name : req.body.name,
            email : req.body.email,
            phone : req.body.phone,
            image : req.file.filename,
            password : req.body.password
        })
        await user.save()
        res.render("user_login",{ title : "User Login" , message : "Successfull registration" , errmsg : ""});
    }catch (err) {
        res.send("outside try error")
        console.log(err)
    }
})







module.exports = router