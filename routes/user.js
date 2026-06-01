const express = require("express");
const router = express.Router();
const passport = require("passport");
const User = require("../models/user.js");
const wrapAsync = require("../utils/wrapAsync.js");

router.get("/signup", (req, res) => {
   res.render("users/signup.ejs");
});

router.post("/signup", wrapAsync(async (req, res) => {
    try{
    let { username, email, password } = req.body;

    const newUser = new User({ email, username });

    const registeredUser = await User.register(newUser, password);

    console.log(registeredUser);

    req.flash("success", "Welcome to Royal stay");
    res.redirect("/listings");
    } catch(err) {
        req.flash("error", err.message);
        res.redirect("/signup");
    }
})
);


router.get("/login", (req,res)=>{
    res.render("users/login.ejs");
})



router.post("/login",
  passport.authenticate("local", {
    failureRedirect: '/login',
    failureFlash: true
  }),
 async (req, res) => {
   req.flash("success" , "Welcome back to Royal stay");
   res.redirect("/listings");
  }
);



router.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.flash("success", "Logged out successfully");
    res.redirect("/listings");
  });
});






router.post("/listings/:id/reserve", (req, res) => {
    req.flash("success", "Your hotel reserved successfully!");
    res.redirect(`/listings/${req.params.id}`);
});
module.exports = router;