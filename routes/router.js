const express = require("express")
const router = express.Router()
const session = require('express-session')
const MongoStore = require("connect-mongo")
const User = require('../models/user')
const Valorant = require('valorant-api-js')
const fs = require('fs')
const path = require('path')
const bcrypt = require('bcrypt')
const { default: axios } = require("axios")

const multer = require('multer')
const { storage } = require("../utils/cloudinary.config");
const upload = multer({ storage });



function isAuthenticated(req, res, next) {
    if (req.session.user) {
        // If user is logged in, proceed to the next middleware/route
        return next();
    }
    // If not logged in, redirect to login page
    res.redirect('/');
}


//route to get the user register page
router.get('/register', (req, res) => {
    res.render('user_register', { title: "User Register"})
})

//route to post user register data to database
router.post("/register", upload.single("image"),async (req, res) => {
    try {
        if (req.body.password !== req.body.cpass) {
            return res.render("user_register", { 
                title: "User Register", 
                type: "danger", 
                message: "Password is not matching!" 
            });
        }

        const existingUser = await User.findOne({ email: req.body.email });
        if (existingUser) {
            return res.render("user_register", { 
                title: "User Register", 
                type: "danger", 
                message: "Email already in use!" 
            });
        }

        const hashPassword = await bcrypt.hash(req.body.password, 10);

        const user = new User({
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            image: req.file.path,
            password: hashPassword
        });

        await user.save();
        res.render("user_login", { 
            title: "User Login", 
            message: "User registered successfully", 
            type: "success" 
        });
    } catch (err) {
        res.status(500).send("Internal Server Error");
        console.error(err);
    }
})

//route to get the user login page
router.get('/', (req, res) => {
    if (req.session.user) {
        return res.redirect('/home');
    }
    res.render('user_login', { title: "User Login" });
});

//route to check login data in database and redirecting to home page
router.post('/', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Input validation
        if (!email || !password) {
            return res.render('user_login', { 
                title: "User Login", 
                type: "danger", 
                message: "Please provide both email and password" 
            });
        }

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.render('user_login', { 
                title: "User Login", 
                type: "danger", 
                message: "No user found with the provided email" 
            });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.render('user_login', { 
                title: "User Login", 
                type: "danger", 
                message: "Incorrect password" 
            });
        }

        // Successful login
        req.session.user = user;
        res.redirect("/home");
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).render('user_login', { 
            title: "User Login", 
            type: "danger", 
            message: "Internal server error. Please try again later." 
        });
    }
});

//route to get the home page
router.get('/home',isAuthenticated, async (req, res) => {
    try{
    res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.header('Pragma', 'no-cache');
    res.header('Expires', '0');
        const config = {language : "en-US"}
        const client = new Valorant(config)

        const gameModes = await client.getGamemodes()
        const filteredGameModes = gameModes.data.map(mode => ({
            displayName: mode.displayName,
            description: mode.description,
            duration: mode.duration,
            displayIcon: mode.displayIcon,
        }))

        const competitiveTiers = await client.getCompetitiveTiers()
        const latestCompetitiveTier = competitiveTiers.data[competitiveTiers.data.length - 1].tiers
        const tier = latestCompetitiveTier.map((tier)=>({
            tier: tier.tier,
            tierName : tier.tierName,
            bg : tier.backgroundColor,
            icon : tier.largeIcon
        }))
        const newtier = tier.slice(3,tier.length)

        
        const weapons = await client.getWeapons()
        const filteredWeapons = weapons.data.map((weapon)=>({
            name : weapon.displayName,
            image : weapon.displayIcon
        }))

        const agents = await client.getAgents()
        const filteredAgents = agents.data
        .filter(agent => agent.isPlayableCharacter)
        .map((agent)=>({
            name : agent.displayName,
            icon : agent.displayIcon
        }))
        
        const maps = await client.getMaps()
        const filteredMaps = maps.data.map((map)=>({
            name : map.displayName,
            image : map.splash
        }))

        res.render('home', { title: "Home Page", name: req.session.user.name, image: req.session.user.image, email: req.session.user.email, gameModes : filteredGameModes, tiers : newtier, weapons : filteredWeapons, agents : filteredAgents, maps : filteredMaps });
    }catch(err){
        console.error("Error fetching data:", error);
        res.status(500).send("Internal Server Error");
    }
});

//route to logout from homepage
router.get('/logout',(req,res)=>{
    try {
        req.session.destroy(() => {
            // Disable caching
            res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.header('Pragma', 'no-cache');
            res.header('Expires', '0');

            // Redirect to login page after session destruction
            res.render('user_login', { 
                title: "User Login", 
                message: "Logged out successfully", 
                type: "success" 
            });
        });
    } catch (error) {
        console.error("Error in logout route:", error);
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
            res.redirect("/admin_users");
        } else {
            res.render("admin_login", { title: "Admin Login", type: "danger", message: "Invalid Credentials!" });
        }
    } catch (error) {
        console.error("Error in admin-login route:", error);
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
router.post('/add', async (req, res) => {
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
router.post('/update/:id', async (req, res) => {
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
    try{
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
    }catch(err){
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
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