const express = require("express")
const router = express.Router()
const session = require('express-session')
const MongoStore = require("connect-mongo")
const User = require('../models/users')
const multer = require('multer')
const fs = require('fs')
const path = require('path')

router.use(session({
    secret: "my secret key",
    saveUninitialized: true,
    resave: false,
    store: MongoStore.create({ mongoUrl: process.env.DB_URI }),
    cookie: {
        name: 'myCookie',
        maxAge: 1000 * 60 * 60 * 2,
        sameSite: true,
    }
}))

router.use((req,res,next)=>{
    res.locals.message = req.session.message
    delete req.session.message
    next()
})

router.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
});

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
    if (req.session.user) {
        res.render('home', { title: "Home Page", name: req.session.user.name });
    } else {
        res.render('user_login', { title: "User Login", message: "", errmsg: "Relogin needed" });
    }
});

//route to post user register data to database
router.post("/register", upload, async (req, res) => {
    try {
        if (req.body.password !== req.body.cpass) {
            if (req.file) {
                const imagePath = path.join(__dirname, "../uploads", req.file.filename);
                fs.unlinkSync(imagePath);
            }
            return res.render("user_register", { title: "User Register", message: "", errmsg: "Passsword is not matching." })
        }

        const existinguser = await User.findOne({ email: req.body.email })
        if (existinguser) {
            if (req.file) {
                const imagePath = path.join(__dirname, "../uploads", req.file.filename);
                fs.unlinkSync(imagePath);
            }
            return res.render("user_register", { title: "User Register", message: "", errmsg: "Email already in use." })
        }

        const user = new User({
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            image: req.file.filename,
            password: req.body.password
        })
        await user.save()
        res.render("user_login", { title: "User Login", message: "Successfull registration", errmsg: "" });
    } catch (err) {
        res.status(500).send("Internal Server Error");
        console.log(err)
    }
})

//route to check login data in database and redirecting to home page
router.post('/', async (req, res) => {
    const user = await User.findOne({ email: req.body.email });
    const password = req.body.password
    if (!user) {
        return res.render('user_login', { title: "User Login", message: "", errmsg: "No user found" });
    }

    if (password !== user.password) {
        return res.render('user_login', { title: "User Login", message: "", errmsg: "Wrong password" });
    }

    if (req.body.password === user.password && req.body.email === user.email) {
        req.session.user = user;
        res.redirect("/home")
    }

});

//route to logout from homepage
router.get('/logout', (req, res) => {
    res.clearCookie('myCookie');
    req.session.destroy(function (err) {
        if (err) {
            console.log(err);
        } else {
            res.header('cache-control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
            res.render('user_login', { title: "User Login", message: "logout successfully", errmsg: "" })
        }
    })
})

//route to get the admin login
router.get('/admin', (req, res) => {
    res.render('admin_login', { title: "Admin Login", message: '', errmsg: "" })
})


//route to post the data from admin login to databse for checking credentials
router.post('/admin-login', async (req, res) => {
    try {
        const adminemail = "admin@gmail.com";
        const adminpassword = "admin123";

        const { email, password } = req.body;

        if (email === adminemail && password === adminpassword) {
            req.session.admin = { email: adminemail };
            res.redirect("/admin_dashboard");
        } else {
            res.render("admin_login", { title: "Admin Login", message: "", errmsg: "Invalid Credentials" });
        }
    } catch (error) {
        console.error("Error in admin-login route:", error);
        res.status(500).send("Internal Server Error");
    }
});


//route to get the admin dashboard
router.get('/admin_dashboard', async (req, res) => {
    try {
        if (req.session.admin) {
            User.find().exec()
                .then((users) => {
                    res.render('admin_dashboard', { title: "Admin Dashboard", users : users});
                })
                .catch((err) => {
                    res.json({ message: err.message })
                })
        } else {
            res.render('admin_login', { title: "Admin Login", message: "", errmsg: "Relogin needed" });
        }
    } catch (error) {
        console.error("Error in admin_dashboard route:", error);
        res.status(500).send("Internal Server Error");
    }
});

//route to admin logout
router.get('/admin-logout', async (req, res) => {
    try {
        res.clearCookie('myCookie');
        req.session.destroy(function (err) {
            if (err) {
                console.error("Error during admin logout:", err);
                res.status(500).send("Internal Server Error");
            } else {
                res.header('cache-control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
                res.render('admin_login', { title: "Admin Login", message: "Logout successfully", errmsg: "" });
            }
        });
    } catch (error) {
        console.error("Error in admin-logout route:", error);
        res.status(500).send("Internal Server Error");
    }
});

//route to get user adding page
router.get('/add-user', async (req,res)=>{
    try{
        if(req.session.admin){
            res.render("admin_add_user",{title : "Admin add User"})
        }else{
            res.render('admin_login', { title: "Admin Login", message: "", errmsg: "Relogin needed" });
        }
    }catch(err){
        console.error("Error in admin-add-user route:", error);
        res.status(500).send("Internal Server Error");
    }
})

//route to post new user data to databse
router.post('/add', upload , async (req,res)=>{
    try{
    const user = new User({
        name : req.body.name,
        email : req.body.email,
        phone : req.body.phone,
        password : req.body.password,
        image : req.file.filename,
    })
    await user.save()
            req.session.message = {
                type : "success",
                message : "User added successfully.."
            }
            res.redirect("/admin_dashboard")
        }catch(error){
        console.error("Error in admin-add-user route:", error);
        res.status(500).send("Internal Server Error");
    }
})

//route to get the admin user edit page
router.get('/edit/:id', (req,res)=>{
    let id = req.params.id
    User.findById(id)
    .then((user)=>{
        if(user == null){
                res.redirect('/admin_dashboard')
        }else{
            res.render("admin_edit_user",{title : "Admin Edit User", user : user})
        }
    })
    .catch((err) => {
        res.redirect('/admin_dashboard')
    })
})

//route to post the admin user edit / update data in to database
router.post('/update/:id', upload , (req,res)=>{
    const id = req.params.id
    let new_img = ""

    if(req.file){
        new_img = req.file.filename
        try{
            fs.unlinkSync("./uploads/"+req.body.old_image)
        }catch(err){
            console.error('Error deleting old image:', err);
            return res.status(500).send("Internal Server Error");
        }
    }else{
        new_img = req.body.old_image
    }

    User.findByIdAndUpdate(id , {
        name : req.body.name,
        email : req.body.email,
        phone : req.body.phone,
        password : req.body.password,
        image : new_img,
    })
    .then(()=>{
        if(req.session.admin){
            req.session.message = {
                type : "success",
                message : "User updated Successfully.."
            }
            res.redirect('/admin_dashboard')
        }else{
            res.render("admin_login",{titlle : "Admin Login" , message : "", errmsg : "Relogin needed"})
        }
    })
    .catch((err)=>{
        if(req.session.admin){
            req.session.message = {
                type : "danger",
                message : "Error in user updation!"
            }
            res.redirect('/admin_dashboard')
            console.log(err)
        }else{
            res.render("admin_login",{titlle : "Admin Login" , message : "", errmsg : "Rwlogin needed"})
        }
    })
})

//route to get the admin user delete
router.get('/delete/:id',(req,res)=>{
    let id = req.params.id
    User.findByIdAndDelete(id)
    .then((result)=>{
        if(result.image && result.image != ""){
            try{
                fs.unlinkSync("./uploads/"+result.image)
            }catch(err){
                res.status(500).send(err.message);
            }
        }
            req.session.message = {
                type : "success",
                message : "User deleted successfuly.."
            }
            res.redirect('/admin_dashboard')
    })
    .catch((err)=>{
        if(req.session.admin){
            req.session.message = {
                type : "danger",
                message : "Error in user deletion!"
            }
            res.redirect('/admin_dashboard')
            console.log("Error in user deleting ",err)
        }else{
            res.render("admin_login",{titlle : "Admin Login" , message : "", errmsg : "Rwlogin needed"})
        }
    })
})

module.exports = router