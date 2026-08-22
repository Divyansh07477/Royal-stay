
 
require("dotenv").config();

console.log("GEMINI KEY LOADED:", !!process.env.GEMINI_API_KEY);

const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});


const express = require("express");
const app = express();
  const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const path = require("path");
const methodOverride = require("method-override");
const { cloudinary } = require("./cloudConfig.js");
 mongoose.set("strictQuery", true);
  
  const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";
// const dbUrl =process.env.ATLASDB_URL;
  
   mongoose.set("strictQuery", true);
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync.js");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const ExpressError = require("./utils/ExpressError.js");



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
  //    await mongoose.connect(dbUrl);
  }




app.set("view engine","ejs");
app.set("views",path.join(__dirname, "views"));


app.use(express.json());
app.use (express.urlencoded({extended: true}));
app.use(methodOverride ("_method"));
app.engine('ejs', ejsMate);
app.use(express.static(path.join (__dirname,"/public")));



// const store= MongoStore.create({
//  mongoUrl:dbUrl,
//   crypto: {
//     secret: "mysupersecretcode"
//   },
//   touchAfter: 24 * 3600,
// });

// store.on("error",(err)=>{
//   console.log("Error in MONGO SESSION STORE",err);
// });





const sessionOption = {
  // store,
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























// ===============================
// MJ AI ASSISTANT
// ===============================

const categories = {
    mountain: "Mountains",
    mountains: "Mountains",
    beach: "Beaches",
    beaches: "Beaches",
    camping: "Camping",
    castle: "Castle",
    luxury: "Luxury",
    pool: "Pools",
    pools: "Pools",
    arctic: "Arctic"
};

app.post("/api/mj", async (req, res) => {

    try {

        const { message } = req.body;

        if (!message) {
            return res.status(400).json({
                error: "Message is required"
            });
        }

        const lowerMessage = message.toLowerCase().trim();


        // ==========================================
        // 1. DIRECT CATEGORY DETECTION
        // ==========================================

        let detectedCategory = null;

        if (
            lowerMessage.includes("mountain") ||
            lowerMessage.includes("mountains")
        ) {
            detectedCategory = "Mountains";
        }
        else if (
            lowerMessage.includes("beach") ||
            lowerMessage.includes("beaches")
        ) {
            detectedCategory = "Beaches";
        }
        else if (lowerMessage.includes("camping")) {
            detectedCategory = "Camping";
        }
        else if (lowerMessage.includes("castle")) {
            detectedCategory = "Castle";
        }
        else if (lowerMessage.includes("luxury")) {
            detectedCategory = "Luxury";
        }
        else if (
            lowerMessage.includes("pool") ||
            lowerMessage.includes("pools")
        ) {
            detectedCategory = "Pools";
        }
        else if (lowerMessage.includes("arctic")) {
            detectedCategory = "Arctic";
        }


        // ==========================================
        // 2. GET ALL HOTELS
        // ==========================================

        const allListings = await Listing.find({})
            .select("_id title description price location country category")
            .lean();


        // ==========================================
        // 3. IF BOSS WANTS CATEGORY
        // ==========================================

        const categoryWords = [
            "hotel",
            "hotels",
            "dikhao",
            "dikhana",
            "dikha",
            "kholo",
            "open",
            "wale",
            "category"
        ];

        const wantsCategory =
            detectedCategory &&
            categoryWords.some(word =>
                lowerMessage.includes(word)
            );

        if (wantsCategory) {

            return res.json({

                action: "category",

                category: detectedCategory,

                hotelId: "",

                url:
                    `/listings/category/${detectedCategory}`,

                reply:
                    `Ji Boss, ${detectedCategory} category open kar rahi hoon.`

            });

        }


        // ==========================================
        // 4. HOTEL DATA FOR GEMINI
        // ==========================================

        const hotelData = allListings.map((hotel) => ({

            id: hotel._id.toString(),

            title: hotel.title,

            description: hotel.description,

            price: hotel.price,

            location: hotel.location,

            country: hotel.country,

            category: hotel.category

        }));


        // ==========================================
        // 5. GEMINI
        // ==========================================

        const response = await ai.models.generateContent({

            model: "gemini-3.5-flash-lite",

            contents: `

User said:

"${message}"


Available Royal Stay hotels:

${JSON.stringify(hotelData)}

`,

            config: {

                systemInstruction: `

You are MJ, the female AI assistant of Royal Stay.

Always call the user "Boss".

Understand Hindi, Hinglish and English.


Reply in the same language/style as Boss.

If Boss speaks in Hindi script, reply in Hindi script.
If Boss speaks in Hinglish or Roman Hindi, reply in Hinglish.
If Boss speaks in English, reply in English.
If Boss mixes Hindi and English, reply naturally in Hinglish.

Never force every response into Hindi.

You have access to the REAL hotel data given below.


IMPORTANT:

Only use hotels that actually exist.

Never invent a hotel.

Never invent a hotel ID.


HOTEL OPEN:

If Boss asks to open a specific hotel,
find the matching hotel from the provided list.

Return:

{
    "action": "open",
    "hotelId": "REAL_ID",
    "reply": "Ji Boss, hotel open kar rahi hoon."
}


HOTEL INFORMATION:

If Boss asks about a hotel's information,
return:

{
    "action": "info",
    "hotelId": "REAL_ID",
    "reply": "SHORT INFORMATION"
}


CATEGORY:

Categories are:

Mountains
Beaches
Camping
Castle
Luxury
Pools
Arctic


If Boss asks about a category,
return:

{
    "action": "category",
    "hotelId": "",
    "category": "Mountains",
    "reply": "Ji Boss, Mountains category open kar rahi hoon."
}


SEARCH:

If Boss asks to find/search hotels:

{
    "action": "search",
    "hotelId": "",
    "category": "",
    "reply": "SHORT RESPONSE"
}


NORMAL CHAT:

{
    "action": "chat",
    "hotelId": "",
    "category": "",
    "reply": "SHORT RESPONSE"
}


Keep replies short because they are spoken aloud.

Always call the user Boss.

Return ONLY valid JSON.

Do NOT use markdown.

`

            }

        });


        // ==========================================
        // 6. PARSE GEMINI RESPONSE
        // ==========================================

        let result;

        try {

            let text = response.text.trim();

            text = text
                .replace(/^```json\s*/i, "")
                .replace(/^```\s*/i, "")
                .replace(/\s*```$/i, "")
                .trim();

            result = JSON.parse(text);

        }
        catch (parseError) {

            console.error(
                "MJ JSON ERROR:",
                response.text
            );

            return res.json({

                action: "chat",

                hotelId: "",

                category: "",

                reply:
                    "Sorry Boss, mujhe request samajhne mein problem hui."

            });

        }


        // ==========================================
        // 7. CATEGORY RESPONSE
        // ==========================================

        if (
            result.action === "category" &&
            result.category
        ) {

            const categoryKey =
                result.category
                    .toLowerCase()
                    .trim();

            const category =
                categories[categoryKey];

            if (category) {

                return res.json({

                    action: "category",

                    category: category,

                    hotelId: "",

                    url:
                        `/listings/category/${category}`,

                    reply:
                        result.reply ||
                        `Ji Boss, ${category} category open kar rahi hoon.`

                });

            }

        }


        // ==========================================
        // 8. OPEN HOTEL
        // ==========================================

        if (
            result.action === "open" &&
            result.hotelId
        ) {

            const hotel = allListings.find(

                listing =>
                    listing._id.toString() ===
                    result.hotelId

            );

            if (hotel) {

                return res.json({

                    action: "open",

                    hotelId:
                        hotel._id.toString(),

                    url:
                        `/listings/${hotel._id}`,

                    hotel: {

                        title:
                            hotel.title,

                        description:
                            hotel.description,

                        price:
                            hotel.price,

                        location:
                            hotel.location,

                        country:
                            hotel.country,

                        category:
                            hotel.category

                    },

                    reply:
                        result.reply ||
                        `Ji Boss, ${hotel.title} open kar rahi hoon.`

                });

            }

        }


        // ==========================================
        // 9. HOTEL INFORMATION
        // ==========================================

        if (
            result.action === "info" &&
            result.hotelId
        ) {

            const hotel = allListings.find(

                listing =>
                    listing._id.toString() ===
                    result.hotelId

            );

            if (hotel) {

                return res.json({

                    action: "info",

                    hotelId:
                        hotel._id.toString(),

                    url:
                        `/listings/${hotel._id}`,

                    hotel: {

                        title:
                            hotel.title,

                        description:
                            hotel.description,

                        price:
                            hotel.price,

                        location:
                            hotel.location,

                        country:
                            hotel.country,

                        category:
                            hotel.category

                    },

                    reply:
                        result.reply ||
                        `Ji Boss, ${hotel.title} ki information ye hai.`

                });

            }

        }


        // ==========================================
        // 10. SEARCH
        // ==========================================

        if (result.action === "search") {

            return res.json({

                action: "search",

                hotelId:
                    result.hotelId || "",

                category:
                    result.category || "",

                reply:
                    result.reply ||
                    "Ji Boss, hotels search kar rahi hoon."

            });

        }


        // ==========================================
        // 11. NORMAL CHAT
        // ==========================================

        return res.json({

            action: "chat",

            hotelId: "",

            category: "",

            reply:
                result.reply ||
                "Ji Boss."

        });


    }
    catch (error) {

        console.error(
            "MJ ERROR:",
            error
        );

        res.status(500).json({

            error:
                error.message ||
                "MJ temporarily unavailable."

        });

    }

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