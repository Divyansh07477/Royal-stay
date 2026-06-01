const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const path =require("path");
const methodOverride = require ("method-override");


const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";
mongoose.set("strictQuery", true);
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync.js");
const session = require("express-session");
const ExpressError = require("./utils/ExpressError.js");

// const wrapAsync = require("./utils/wrapAsync.js");

const{listingSchema,reviewSchema}=require("./schema.js");
const Review =require("./models/review.js");

const listings  =require("./routes/listing.js")


const flash= require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const User = require("./models/user.js");

const userRouter=require("./routes/user.js");


async function main() {
  await mongoose.connect(MONGO_URL);
}

app.set("view engine","ejs");
app.set("views",path.join(__dirname, "views"));
app.use (express.urlencoded({extended: true}));
app.use(methodOverride ("_method"));
app.engine('ejs', ejsMate);
app.use(express.static(path.join (__dirname,"/public")));
const sessionOption = {
  secret: "mysupersecretcode",
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge:  7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  },

}
app.use(session(sessionOption));

app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use((req,res,next)=>{
  res.locals.success = req.flash("success");
   res.locals.error = req.flash("error");
  next();
})


app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  next();
});
// app.get("/demouser", async (req,res)=>{
//   let fakeUser = new User({
//     email: "ffshiva494@gmail.com",
//     username: "divyansh"
//   });

//   let registeredUser = await User.register(fakeUser,"helloworld"); 
//   res.send(registeredUser);
// });



const validateListing =(req,res,next) =>{
let {error} = result = listingSchema.validate(req.body);
if(error) {
  let errMsg=error.details.map ((el)=> el.message).join(",");
  
  throw new ExpressError(400, errMsg);
} else{
  next();
}
}




const validateReview =(req,res,next) =>{
let {error}  = reviewSchema.validate(req.body);
if(error) {
  let errMsg=error.details.map ((el)=> el.message).join(",");
  
  throw new ExpressError(400, errMsg);
} else{
  next();
}
}

main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });




  //signup 

  app.use("/", userRouter);



//home 
app.get("/", (req, res) => {
   res.render("listings/home.ejs");
});




// search route
app.get("/listings/search", wrapAsync(async (req, res) => {

    let { q } = req.query;

    const allListings = await Listing.find({
        $or: [
            { title: { $regex: q, $options: "i" } },
            { category: { $regex: q, $options: "i" } }
        ]
    });

    res.render("listings/index.ejs", { allListings });

}));


 //category route
 app.get("/listings/category/:category", wrapAsync( async (req, res) => {
  let { category } = req.params;

  const allListings = await Listing.find({
    category: { $regex: new RegExp(`^${category}$`, "i") }
  });

  res.render("listings/index.ejs", { allListings, category });
}));


app.use("/listings",listings);


// // reviews
// //post route
app.post("/listings/:id/reviews",validateReview,wrapAsync(async(req,res)=>{
  let listing= await Listing.findById(req.params.id);
  let newReview = new Review(req.body.review);

  listing.reviews.push(newReview);
   await newReview.save();
   await listing.save();
req.flash("success","  Create Review  Successfully");
  res.redirect(`/listings/${listing._id}`);

}));


// //delete  review route
app.delete("/listings/:id/reviews/:reviewId", wrapAsync(async(req,res)=>{
  let {id, reviewId} =req.params;
  await Listing.findByIdAndUpdate(id,{$pull: {reviews: reviewId}});
 await Review.findByIdAndDelete(reviewId);
req.flash("success","   Delete Review  Successfully");
 res.redirect(`/listings/${id}`);

})
);

// app.get("/testListing", async (req, res) => {
//   let sampleListing = new Listing({
//     title: "My new villa",
//     description: "By the beach",
//     price: 1200,
//     location: "Calangute, Goa",
//     country: "India",
//   });

//   await sampleListing.save();

//   console.log("sample was saved");

//   res.send("successful testing");
// });



app.use((req,res,next)=>{
  next(new ExpressError(404, "Page Not Found"));
});
app.use((err, req, res, next) => {
  let { statusCode = 500, message = "Something went wrong" } = err;
  res.status(statusCode).render("error.ejs", { message });
});

app.listen(8080, () => {
  console.log("server is listening to port 8080");
});