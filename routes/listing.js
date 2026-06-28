const multer = require("multer");
const { storage } = require("../cloudConfig");
const upload = multer({ storage });




const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const{listingSchema,reviewSchema}=require("../schema.js");
const ExpressError = require("../utils/ExpressError.js");
const Listing = require("../models/listing.js");
const Review = require("../models/review.js");
const { isLoggedIn, isOwner } = require("../middleware");
const validateListing =(req,res,next) =>{




let {error} = result = listingSchema.validate(req.body);
if(error) {
  let errMsg=error.details.map ((el)=> el.message).join(",");
  
  throw new ExpressError(400, errMsg);
} else{
  next();
}
}






//index routes  
router.get("/", wrapAsync(async (req,res)=>{
   const allListings = await Listing.find({});
  res.render("listings/index",{allListings});
  }))

  //new routes
router.get("/new",(req,res)=>{
  if(!req.isAuthenticated()){
    req.flash("error", "You are not logged")
    return res.redirect("/listings");
  }
  res.render("listings/new.ejs");
})


  //show routes
router.get("/:id", wrapAsync(async (req, res) => {
    let { id } = req.params;

    const listing = await Listing.findById(id).populate("reviews");

    if (!listing) {
        req.flash("error", "Hotel does not exist");
        return res.redirect("/listings");
    }

    res.render("listings/show.ejs", { listing });
}));



//create route
// router.post("/", isLoggedIn, validateListing, wrapAsync(async (req, res) => {

//     const newListing = new Listing(req.body.listing);

//     newListing.owner = req.user._id;

//     await newListing.save();

//     req.flash("success", "New Hotel Created Successfully");
//     res.redirect("/listings");

// }));

router.post(
  "/",
  isLoggedIn,
  upload.single("listing[image]"),
  validateListing,
  wrapAsync(async (req, res) => {

    const newListing = new Listing(req.body.listing);

    newListing.owner = req.user._id;

    newListing.image = {
      url: req.file.path,
      filename: req.file.filename,
    };

    await newListing.save();

    req.flash("success", "New Hotel Created Successfully");
    res.redirect("/listings");
}));







// Edit Route
//router.get("/:id/edit", wrapAsync(async (req, res) => {
router.get("/:id/edit", isLoggedIn, isOwner, wrapAsync(async (req, res) => {

    if (!req.isAuthenticated()) {
        req.flash("error", "You are not  logged into edit a listing!");
        return res.redirect("/login");
    }

    let { id } = req.params;
    const listing = await Listing.findById(id);

    if (!listing) {
        req.flash("error", "Listing not found!");
        return res.redirect("/listings");
    }

    res.render("listings/edit.ejs", { listing });
}));



//update route 
router.put("/:id",
  isLoggedIn,
  isOwner,
  upload.single("listing[image]"),
  validateListing,
  wrapAsync(async (req, res) => {

    let { id } = req.params;

    let listing = await Listing.findById(id);

    // update fields
    listing.title = req.body.listing.title;
    listing.description = req.body.listing.description;
    listing.price = req.body.listing.price;
    listing.location = req.body.listing.location;
    listing.country = req.body.listing.country;
    listing.category = req.body.listing.category;

    // IMAGE FIX (IMPORTANT)
    if (req.file) {
      listing.image = {
        url: req.file.path,
        filename: req.file.filename,
      };
    }

    await listing.save();

    req.flash("success", "Update Hotel Successfully");
    res.redirect(`/listings/${id}`);
  })
);


//delete route
//router.delete("/:id",  wrapAsync(async (req, res) => {
router.delete("/:id", isLoggedIn, isOwner, wrapAsync(async (req, res) => {
  let { id } = req.params;

  let deletedListing = await Listing.findByIdAndDelete(id);

  console.log(deletedListing); // ab ye valid hai
req.flash("success","Delete Hotel Successfully");
  res.redirect("/listings");
}));

module.exports = router;