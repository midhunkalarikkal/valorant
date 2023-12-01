const express = require("express")
const router = express.Router()


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
    res.render('home', { title: "Home Page"})
})

//route to get the admin login
router.get('/admin', (req, res) => {
    res.render('admin_login', { title: "Admin Login", message: '', errmsg: "" })
})

//route to get the admin dashboard
router.get('/admin_dashboard', (req, res) => {
    res.render('admin_dashboard', { title: "Admin Dashboard"})
})

module.exports = router