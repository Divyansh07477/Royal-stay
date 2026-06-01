const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const{listingSchema,reviewSchema}=require("../schema.js");
const ExpressError = require("../utils/ExpressError.js");
const Listing = require("../models/listing.js");
const Review = require("../models/review.js");

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
router.post("/",validateListing ,wrapAsync(async (req, res) => {

    let result = listingSchema.validate(req.body);

    // if(result.error){
    //     throw new ExpressError(400, result.error);
    // }

    const newListing = new Listing(req.body.listing);

    await newListing.save();
  req.flash("success","New Hotel Created Successfully");
    res.redirect("/listings");
   

}));
//edit routes
router.get("/:id/edit", wrapAsync(async (req,res)=>{
  let {id} =req.params;
       const listing = await Listing.findById(id);
       res.render("listings/edit.ejs", {listing});
}))

//update route 
router.put("/:id",validateListing, wrapAsync(async (req,res)=>{
  // if(req.body.listing) {
  //   throw new ExpressError(400,"Send valid data for listing")
  //  }
  let {id} =req.params;
  await Listing.findByIdAndUpdate(id,{...req.body.listing});
  
  req.flash("success","Update Hotel Successfully");
  res.redirect(`/listings/${id}`);
}))


//delete route
router.delete("/:id",  wrapAsync(async (req, res) => {
  let { id } = req.params;

  let deletedListing = await Listing.findByIdAndDelete(id);

  console.log(deletedListing); // ab ye valid hai
req.flash("success","Delete Hotel Successfully");
  res.redirect("/listings");
}));

module.exports = router;