const express = require("express")
const router = express.Router()


//route to get the user login page
router.get('/', (req, res) => {
    res.render('user_login', { title: "User Login", message: '', errmsg: "" })
})

//route to get the user register page
router.get('/register', (req, res) => {
    res.render('user_register', { title: "User Login", message: '', errmsg: "" })
})

module.exports = router