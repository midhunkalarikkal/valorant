const express = require("express")
const router = express.Router()
const User = require('../models/user')
const Valorant = require('valorant-api-js')
const bcrypt = require('bcrypt')

const multer = require('multer')
const { cloudinary, storage } = require("../utils/cloudinary.config");
const upload = multer({ storage });

function isAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    }
    res.redirect('/');
}


//route to get the user register page
router.get('/register', (req, res, next) => {
    try {
        return res.render('user_register', { title: "User Register" });
    } catch (err) {
        next(err);
    }
})

//route to post user register data to database
router.post("/register", upload.single("image"),async (req, res, next) => {
    try {
        if (req.body.password !== req.body.cpass) {
            return res.status(400).json({
                success: false,
                message: "Password is not matching!.",
            });
        }

        if (!/^[A-Za-z\s]{4,20}$/.test(req.body.name)) {
            return res.status(400).json({
                success: false,
                message: "Invalid name. Name must be 4-20 characters long and contain only alphabets and spaces..",
            });
        }
        
        if (!req.body.email.endsWith("@gmail.com")) {
            return res.status(400).json({
                success: false,
                message: "Invalid email. Email must end with '@gmail.com'.",
            });
        }
        
        if (!/^[0-9]{10}$/.test(req.body.phone)) {
            return res.status(400).json({
                success: false,
                message: "Invalid phone number. Phone number must contain exactly 10 digits.",
            });
        }
        
        if (!/^.{8,}$/.test(req.body.password)) {
            return res.status(400).json({
                success: false,
                message: "Invalid password. Password must be at least 8 characters long.",
            });
        }

        const existingUser = await User.findOne({ email: req.body.email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Email already in use!.",
            });
        }

        let uploadedImageUrl = null;
        if (req.file) {
            uploadedImageUrl = req.file.path;
        }

        const hashPassword = await bcrypt.hash(req.body.password, 10);

        const user = new User({
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            image: uploadedImageUrl,
            password: hashPassword
        });

        await user.save();
        return res.status(200).json({ success : true, message: "Registration successful!", redirectUrl : "/" });
    } catch (err) {
        next(err);
    }
})

//route to get the user login page
router.get('/', (req, res, next) => {
    try{
        if (req.session.user) {
            return res.redirect('/home');
        }
        res.render('user_login', { title: "User Login" });
    }catch (err) {
        next(err);
    }
});

//route to check login data in database and redirecting to home page
router.post('/', async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please provide both email and password.",
            });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "No user found with the provided email.",
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Incorrect password.",
            });
        }

        req.session.user = user;
        return res.json({
            success: true,
            message: "Login successful! Redirecting...",
            redirectUrl: "/home",
        });
    } catch (err) {
        next(err);
    }
});

//route to get the home page
router.get('/home',isAuthenticated, async (req, res, next) => {
    try{
    res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.header('Pragma', 'no-cache');
    res.header('Expires', '0');
        const config = {language : "en-US"}
        const client = new Valorant(config)

        const gameModes = await client.getGamemodes();
        const competitiveTiers = await client.getCompetitiveTiers();
        const weapons = await client.getWeapons();
        const agents = await client.getAgents();
        const maps = await client.getMaps();

        if (!gameModes || !gameModes.data || !competitiveTiers || !competitiveTiers.data || 
            !weapons || !weapons.data || !agents || !agents.data || 
            !maps || !maps.data) {
            throw new Error("API fetching is slow or data is missing. Please wait and refresh.");
        }

        const filteredGameModes = gameModes.data.map(mode => ({
            displayName: mode.displayName,
            description: mode.description,
            duration: mode.duration,
            displayIcon: mode.displayIcon,
        }));

        const latestCompetitiveTier = competitiveTiers.data[competitiveTiers.data.length - 1].tiers;
        const tier = latestCompetitiveTier.map((tier) => ({
            tier: tier.tier,
            tierName: tier.tierName,
            bg: tier.backgroundColor,
            icon: tier.largeIcon
        }));
        const newtier = tier.slice(3, tier.length);

        const filteredWeapons = weapons.data.map((weapon) => ({
            name: weapon.displayName,
            image: weapon.displayIcon
        }));

        const filteredAgents = agents.data
            .filter(agent => agent.isPlayableCharacter)
            .map((agent) => ({
                name: agent.displayName,
                icon: agent.displayIcon
            }));

        const filteredMaps = maps.data.map((map) => ({
            name: map.displayName,
            image: map.splash,
            uuid: map.uuid
        }));

        res.render('home', {
            title: "Home Page",
            name: req.session.user.name,
            image: req.session.user.image,
            email: req.session.user.email,
            gameModes: filteredGameModes,
            tiers: newtier,
            weapons: filteredWeapons,
            agents: filteredAgents,
            maps: filteredMaps
        });
    }catch(err){
        next(err);
    }
});

//route to logout from homepage
router.get('/logout',(req,res, next)=>{
    try {
        req.session.destroy(() => {
            res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.header('Pragma', 'no-cache');
            res.header('Expires', '0');

            res.render('user_login', { 
                title: "User Login", 
                message: "Logged out successfully", 
                type: "success" 
            });
        });
    } catch (err) {
        next(err);
    }
})

function isAdminAuthenticated(req, res, next) {
    if (req.session.admin) {
        return next();
    }
    res.redirect('/admin');
}

//route to get the admin login
router.get('/admin', (req, res, next) => {
    try{
        if (req.session.admin) {
            return res.redirect('/admin_users');
        }
        res.render('admin_login', { title: "Admin Login" });
    }catch(err){
        next(err);
    }
})

//route to post the data from admin login to databse for checking credentials
router.post('/admin-login', async (req, res, next) => {
    try {
        const adminemail = process.env.ADMIN_EMAIL || "admin@gmail.com";
        const adminpassword = process.env.ADMIN_PASSWORD || "admin123"; 

        const { email, password } = req.body;

        if (email === adminemail && password === adminpassword) {
            req.session.admin = { email: adminemail };
            res.redirect("/admin_users"); 
        } else {
            res.render("admin_login", { title: "Admin Login", type: "danger", message: "Invalid Credentials!" });
        }
    } catch (err) {
        next(err);
    }
});

//route to get the admin users list
router.get('/admin_users',isAdminAuthenticated, async (req, res, next) => {
    try {
        const users = await User.find().exec();
        res.render('admin_users', { 
            title: "Admin Users", 
            users: users 
        });
    } catch (err) {
        next(err);
    }
});

//route to admin logout
router.get('/admin-logout',(req,res, next)=>{
    try {
        req.session.admin = null; 
        res.header('Cache-Control', 'no-cache, no-store, must-revalidate'); 
        res.render('admin_login', { 
            title: "Admin Login", 
            message: "Logged out successfully", 
            type: "success" 
        });
    } catch (err) {
        next(err);
    }
})

//route to get user adding page
router.get('/add-user',isAdminAuthenticated, async (req, res, next) => {
    try {
        res.render("admin_add_user", { title: "Admin add User" })
    } catch (err) {
        res.redirect('/admin_users');
    }
})

//route to post new user data to databse
router.post('/add',isAdminAuthenticated, upload.single("image"), async (req, res, next) => {
    try {
        const existinguser = await User.findOne({ email: req.body.email });
        if (existinguser) {
            return res.json({
                success: false,
                message: "Already registered with this email.",
            });
        }

        let uploadedImageUrl = null;
        if (req.file) {
            uploadedImageUrl = req.file.path; 
        }

        const hpass = await bcrypt.hash(req.body.password, 10);

        const user = new User({
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            password: hpass,
            image: uploadedImageUrl, 
        });

        await user.save();
        return res.json({
            success: true,
            message: "User added successfully..",
            redirectUrl : "/admin_users"
        });
    } catch (err) {
        next(err);
    }
})

//route to get the admin user edit page
router.get('/edit/:id',isAdminAuthenticated, async(req, res, next) => {
    try {
        const id = req.params.id;
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).send("User not found");
        }
        res.render("admin_edit_user", { title: "Admin Edit User", user: user });
    } catch (err) {
        res.redirect('/admin_users');
    }
})

//route to post the admin user edit / update data in to database
router.post('/update/:id',upload.single('image'), async (req, res, next) => {
    try {
        const id = req.params.id;

        const existingUser = await User.findOne({ email: req.body.email });
        if (existingUser && existingUser._id.toString() !== id) {
            req.session.message = {
                type: "danger",
                message: "User updation error.",
            };
            return res.redirect('/admin_users');
        }

        let newImageUrl = req.body.old_image;

        if (req.file) {
            if (req.body.old_image) {
                try{
                    const oldImagePublicId = req.body.old_image.split('/').pop().split('.')[0];
                    await cloudinary.uploader.destroy(oldImagePublicId);
                }catch(err){
                    req.session.message = {
                        type: "danger",
                        message: "User updation error.",
                    };
                    return res.redirect('/admin_users');
                }
            }
            newImageUrl = req.file.path;
        }

        const updatedUser = await User.findByIdAndUpdate(
            id,
            {
                name: req.body.name,
                email: req.body.email,
                phone: req.body.phone,
                image: newImageUrl
            },
            { new: true }
        );

        if (req.session.admin) {
            req.session.message = {
                type: "success",
                message: "User updated successfully.",
            };
            return res.redirect('/admin_users');
        } else {
            return res.render("admin_login", {
                title: "Admin Login",
                type: "danger",
                message: "Relogin needed!",
            });
        }
    } catch (err) {
        next(err);
    }
});


//route to get the admin user delete
router.get('/delete/:id',isAdminAuthenticated, async(req, res, next) => {
    try {
        let id = req.params.id;

        const user = await User.findById(id);
        if (!user) {
            req.session.message = {
                type: "danger",
                message: "User not found!"
            };
            return res.redirect('/admin_users');
        }

        if (user.image) {
            const publicId = user.image.split('/').pop().split('.')[0];

            try {
                await cloudinary.uploader.destroy(publicId);
                await User.findByIdAndDelete(id);

                req.session.message = {
                    type: "success",
                    message: "User deleted successfully."
                };
                return res.redirect('/admin_users');
            } catch (cloudinaryError) {
                req.session.message = {
                    type: "danger",
                    message: "Error deleting image from Cloudinary."
                };
                return res.redirect('/admin_users');
            }
        } else {
            await User.findByIdAndDelete(id);

            req.session.message = {
                type: "success",
                message: "User deleted successfully."
            };
            return res.redirect('/admin_users');
        }

    } catch (err) {
        next(err);
    }
})

//route to return back from edit page to admin dashboard
router.get('/editback',isAdminAuthenticated, (req, res, next) => {
    return res.redirect('/admin_users');
})


module.exports = router