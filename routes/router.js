const express = require("express")
const router = express.Router()
const session = require('express-session')
const MongoStore = require("connect-mongo")
const User = require('../models/user')
const Map = require('../models/map')
const Agent = require('../models/agent')
const multer = require('multer')
const fs = require('fs')
const path = require('path')
const bcrypt = require('bcrypt')
const { default: axios } = require("axios")

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
    res.render('user_login', { title: "User Login"})
})

//route to get the user register page
router.get('/register', (req, res) => {
    res.render('user_register', { title: "User Register"})
})

//route to get the home page
router.get('/home', async (req, res) => {
    if (req.session.user) {
        const responseOne = await axios.get("https://valorant-api.com/v1/gamemodes")
        const gameModes = responseOne.data.data
        const filteredGameModes = gameModes.map(mode => ({
            displayName: mode.displayName,
            description: mode.description,
            duration: mode.duration,
            displayIcon: mode.displayIcon,
        }))

        const responseTwo = await axios.get("https://valorant-api.com/v1/competitivetiers")
        const competitiveTiers = responseTwo.data.data
        const latestCompetitiveTier = competitiveTiers[competitiveTiers.length - 1].tiers
        console.log(latestCompetitiveTier)
        const tier = latestCompetitiveTier.map((tier)=>({
            tier: tier.tier,
            tierName : tier.tierName,
            bg : tier.backgroundColor,
            icon : tier.largeIcon
        }))
        const newtier = tier.slice(3,tier.length)

        res.render('home', { title: "Home Page", name: req.session.user.name, image: req.session.user.image, email: req.session.user.email, gameModes : filteredGameModes, tiers : newtier });
    } else {
        res.render('user_login', { title: "User Login", type: "danger", message: "Relogin needed" });
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
            return res.render("user_register", { title: "User Register", type : "danger", message: "Passsword is not matching!" })
        }

        const existinguser = await User.findOne({ email: req.body.email })
        if (existinguser) {
            if (req.file) {
                const imagePath = path.join(__dirname, "../uploads", req.file.filename);
                fs.unlinkSync(imagePath);
            }
            return res.render("user_register", { title: "User Register", type : "danger", message: "Email already in use!" })
        }

        const hashpassword = await bcrypt.hash(req.body.password, 10)

        const user = new User({
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            image: req.file.filename,
            password: hashpassword
        })
        await user.save()
        res.render("user_login", { title: "User Login", message: "User registered successfully", type: "success" });
    } catch (err) {
        res.status(500).send("Internal Server Error");
        console.log(err)
    }
})

//route to check login data in database and redirecting to home page
router.post('/', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        const password = req.body.password
        if (!user) {
            return res.render('user_login', { title: "User Login", type: "danger", message: "No user found" });
        }

        const ismatch = await bcrypt.compare(password, user.password)
        if (!ismatch) {
            return res.render('user_login', { title: "User Login", type: "danger", message: "Wrong password" });
        }

        if (ismatch && req.body.email === user.email) {
            req.session.user = user;
            res.redirect("/home")
        }
    } catch (error) {
        return res.render('user_login', { title: "User Login", type : "danger", message: "Internal error" });
    }
});

//route to logout from homepage
router.get('/logout',(req,res)=>{
    try{
        req.session.user = null
    if(!req.session.user){
        res.header('cache-control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
        res.render('user_login', { title: "User Login", message: "logout successfully", type : "success" })
    }else{
        console.log("Logout error");
        res.redirect('/home')
    }
    }catch{
        console.error("Error in admin-logout route:", error);
        res.status(500).send("Internal Server Error");
    }
})

//route to get the admin login
router.get('/admin', (req, res) => {
    res.render('admin_login', { title: "Admin Login"})
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
            res.render("admin_login", { title: "Admin Login", type: "danger", message: "Invalid Credentials!" });
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
                    res.render('admin_dashboard', { title: "Admin Dashboard", users: users });
                })
                
        } else {
            res.render('admin_login', { title: "Admin Login", type: "danger", message: "Relogin needed!" });
        }
    } catch (error) {
        console.error("Error in admin_dashboard route:", error);
        res.status(500).send("Internal Server Error");
    }
});

//route to get the admin users list
router.get('/admin_users', async (req, res) => {
    try {
        if (req.session.admin) {
            User.find().exec()
                .then((users) => {
                    res.render('admin_users', { title: "Admin users", users: users });
                })
                .catch((err) => {
                    res.json({ message: err.message })
                })
        } else {
            res.render('admin_login', { title: "Admin Login", type: "danger", message: "Relogin needed!" });
        }
    } catch (error) {
        console.error("Error in admin_dashboard route:", error);
        res.status(500).send("Internal Server Error");
    }
});

//route to admin logout
router.get('/admin-logout',(req,res)=>{
    try{
        req.session.admin = null
    if(!req.session.admin){
        res.header('cache-control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
        res.render('admin_login', { title: "Admin Login", message: "logout successfully", type : "success" })
    }else{
        console.log("Logout error");
        res.redirect('/admin_dashboard')
    }
    }catch{
        console.error("Error in admin-logout route:", error);
        res.status(500).send("Internal Server Error");
    }
})

//route to get user adding page
router.get('/add-user', async (req, res) => {
    try {
        if (req.session.admin) {
            res.render("admin_add_user", { title: "Admin add User" })
        } else {
            res.render('admin_login', { title: "Admin Login", message: "", errmsg: "Relogin needed" });
        }
    } catch (err) {
        console.error("Error in admin-add-user route:", error);
        res.status(500).send("Internal Server Error");
    }
})

//route to post new user data to databse
router.post('/add', upload, async (req, res) => {
    try {
        const existinguser = await User.findOne({ email: req.body.email });
        if (existinguser) {
            // If the email exists for another user, redirect back to the edit page
            if (req.file) {
                const imagePath = path.join(__dirname, "../uploads", req.file.filename);
                fs.unlinkSync(imagePath);
            }
            req.session.message = {
                type: "danger",
                message: "Email already exist!"
            }
            return res.redirect('/add-user');
        }
        //Hashing the password
        const hpass = await bcrypt.hash(req.body.password, 10)
        const user = new User({
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            password: hpass,
            image: req.file.filename,
        })
        await user.save()
        req.session.message = {
            type: "success",
            message: "User added successfully.."
        }
        res.redirect("/admin_dashboard")
    } catch (error) {
        console.error("Error in admin-add-user route:", error);
        res.status(500).send("Internal Server Error");
    }
})

//route to get the admin user edit page
router.get('/edit/:id', (req, res) => {
    let id = req.params.id
    User.findById(id)
        .then((user) => {
            if (user == null) {
                res.redirect('/admin_dashboard')
            } else {
                res.render("admin_edit_user", { title: "Admin Edit User", user: user })
            }
        })
        .catch((err) => {
            res.redirect('/admin_dashboard')
        })
})

//route to post the admin user edit / update data in to database
router.post('/update/:id', upload, async (req, res) => {
    const id = req.params.id;
    let new_img = "";

    if (req.file) {
        new_img = req.file.filename;
        try {
            fs.unlinkSync("./uploads/" + req.body.old_image);
        } catch (err) {
            console.error('Error deleting old image:', err);
            return res.status(500).send("Internal Server Error");
        }
    } else {
        new_img = req.body.old_image;
    }

    try {
        const existinguser = await User.findOne({ email: req.body.email });
        if (existinguser && existinguser._id.toString() !== id) {
            // If the email exists for another user, redirect back to the edit page
            req.session.message = {
                type: "danger",
                message: "Email already exist!"
            }
            return res.redirect(`/edit/${id}`);
        }

        await User.findByIdAndUpdate(id, {
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            image: new_img,
        });

        if (req.session.admin) {
            req.session.message = {
                type: "success",
                message: "User updated successfully."
            };
            res.redirect('/admin_dashboard');
        } else {
            res.render("admin_login", { title: "Admin Login", type: "danger", message: "Relogin needed!" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});


//route to get the admin user delete
router.get('/delete/:id', (req, res) => {
    let id = req.params.id
    User.findByIdAndDelete(id)
        .then((result) => {
            if (result.image && result.image != "") {
                try {
                    fs.unlinkSync("./uploads/" + result.image)
                } catch (err) {
                    res.status(500).send(err.message);
                }
            }
            req.session.message = {
                type: "success",
                message: "User deleted successfuly.."
            }
            res.redirect('/admin_dashboard')
        })
        .catch((err) => {
            if (req.session.admin) {
                req.session.message = {
                    type: "danger",
                    message: "Error in user deletion!"
                }
                res.redirect('/admin_dashboard')
                console.log("Error in user deleting ", err)
            } else {
                res.render("admin_login", { titlle: "Admin Login", type : "danger", message: "Relogin needed!" })
            }
        })
})

//route to return back from edit page to admin dashboard
router.get('/editback', (req, res) => {
    try {
        if (!req.session.admin) {
            res.render("admin_login", { titlle: "Admin Login", type : "danger", message: "Relogin needed!" })
        } else {
            res.redirect('/admin_dashboard')
        }
    } catch (err) {
        res.render("admin_login", { titlle: "Admin Login", type : "danger", message: "Relogin needed" })
        console.log(err)
    }
})


module.exports = router