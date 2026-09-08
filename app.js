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






  //const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";
const dbUrl = process.env.ATLASDB_URL;

const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync.js");

const session = require("express-session");
const MongoStore = require("connect-mongo");

const ExpressError = require("./utils/ExpressError.js");

const {
    listingSchema,
    reviewSchema
} = require("./schema.js");

const Review = require("./models/review.js");

const listings = require("./routes/listing.js");

const flash = require("connect-flash");

const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;

const User = require("./models/user.js");

const userRouter = require("./routes/user.js");


// ======================================================
// DATABASE
// ======================================================

async function main() {
    //await mongoose.connect(MONGO_URL);
     await mongoose.connect(dbUrl);
}


// ======================================================
// EJS
// ======================================================

app.set("view engine", "ejs");

app.set(
    "views",
    path.join(__dirname, "views")
);


// ======================================================
// MIDDLEWARE
// ======================================================

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);

app.use(
    methodOverride("_method")
);

app.engine(
    "ejs",
    ejsMate
);

app.use(
    express.static(
        path.join(__dirname, "/public")
    )
);


// ======================================================
// SESSION
// ======================================================

const sessionOption = {

    secret: "mysupersecretcode",

    resave: false,

    saveUninitialized: true,

    cookie: {

        expires:
            Date.now() +
            7 *
            24 *
            60 *
            60 *
            1000,

        maxAge:
            7 *
            24 *
            60 *
            60 *
            1000,

        httpOnly: true
    }
};


app.use(
    session(sessionOption)
);

app.use(flash());


// ======================================================
// PASSPORT
// ======================================================

app.use(
    passport.initialize()
);

app.use(
    passport.session()
);

passport.use(
    new LocalStrategy(
        User.authenticate()
    )
);

passport.serializeUser(
    User.serializeUser()
);

passport.deserializeUser(
    User.deserializeUser()
);


// ======================================================
// LOCALS
// ======================================================

app.use((req, res, next) => {

    res.locals.success =
        req.flash("success");

    res.locals.error =
        req.flash("error");

    next();
});


app.use((req, res, next) => {

    res.locals.currentUser =
        req.user;

    next();
});


// ======================================================
// MJ AI ASSISTANT
// ======================================================

// Supported categories
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

    arctic: "Arctic",

    snowfall: "Arctic",
    "snow fall": "Arctic",

    snow: "Arctic",
    snowy: "Arctic",

    ice: "Arctic",
    icy: "Arctic"
};


// ======================================================
// CATEGORY DETECTOR
// ======================================================

function detectMJCategory(message) {

    const lowerMessage =
        message.toLowerCase().trim();


    if (
        lowerMessage.includes("mountain") ||
        lowerMessage.includes("mountains")
    ) {
        return "Mountains";
    }


    if (
        lowerMessage.includes("beach") ||
        lowerMessage.includes("beaches")
    ) {
        return "Beaches";
    }


    if (
        lowerMessage.includes("camping")
    ) {
        return "Camping";
    }


    if (
        lowerMessage.includes("castle")
    ) {
        return "Castle";
    }


    if (
        lowerMessage.includes("luxury")
    ) {
        return "Luxury";
    }


    if (
        lowerMessage.includes("pool") ||
        lowerMessage.includes("pools")
    ) {
        return "Pools";
    }


    if (
        lowerMessage.includes("arctic") ||
        lowerMessage.includes("snowfall") ||
        lowerMessage.includes("snow fall") ||
        lowerMessage.includes("snow") ||
        lowerMessage.includes("snowy") ||
        lowerMessage.includes("ice") ||
        lowerMessage.includes("icy")
    ) {
        return "Arctic";
    }


    return null;
}


// ======================================================
// BEST HOTEL DETECTOR
// ======================================================

function wantsBestHotel(message) {

    const lowerMessage =
        message.toLowerCase();

    return (

        lowerMessage.includes("best hotel") ||

        lowerMessage.includes("best hotels") ||

        lowerMessage.includes("top hotel") ||

        lowerMessage.includes("top hotels") ||

        lowerMessage.includes("sabse best hotel") ||

        lowerMessage.includes("best wala hotel") ||

        lowerMessage.includes("best one")

    );
}


// ======================================================
// CATEGORY REQUEST DETECTOR
// ======================================================

function wantsCategory(message) {

    const lowerMessage =
        message.toLowerCase();

    const categoryWords = [

        "hotel",
        "hotels",

        "dikhao",
        "dikhana",
        "dikha",

        "kholo",
        "open",

        "wale",

        "category",

        "show",

        "find",

        "search"

    ];

    return categoryWords.some(
        word =>
            lowerMessage.includes(word)
    );
}


// ======================================================
// GET BEST HOTEL
// ======================================================

async function getBestHotel(category = null) {

    let query = {};


    if (category) {

        query = {

            category: {
                $regex:
                    new RegExp(
                        `^${category}$`,
                        "i"
                    )
            }

        };

    }


    const hotels =
        await Listing.find(query)
            .select(
                "_id title description price location country category reviews"
            )
            .lean();


    if (!hotels.length) {

        return null;

    }


    /*
       Since the existing Listing schema does not
       provide a confirmed numeric rating field,
       we rank using available real data.

       Priority:
       1. More reviews
       2. Lower price
    */

    hotels.sort((a, b) => {

        const reviewsA =
            Array.isArray(a.reviews)
                ? a.reviews.length
                : 0;

        const reviewsB =
            Array.isArray(b.reviews)
                ? b.reviews.length
                : 0;


        if (reviewsB !== reviewsA) {

            return reviewsB - reviewsA;

        }


        const priceA =
            Number(a.price) || 0;

        const priceB =
            Number(b.price) || 0;


        return priceA - priceB;

    });


    return hotels[0];

}


// ======================================================
// MJ API
// ======================================================

app.post("/api/mj", async (req, res) => {

    try {

        const {
            message,
            currentCategory
        } = req.body;


        // --------------------------------------------------
        // MESSAGE CHECK
        // --------------------------------------------------

        if (!message) {

            return res.status(400).json({

                error:
                    "Message is required"

            });

        }


        const lowerMessage =
            message.toLowerCase().trim();


        // --------------------------------------------------
        // CATEGORY DETECTION
        // --------------------------------------------------

        const detectedCategory =
            detectMJCategory(message);


        /*
          If frontend already knows the current category,
          use it when Boss says:

          "isme best hotel open karo"
          "best hotel isme hai"
          etc.
        */

        const activeCategory =
            detectedCategory ||
            currentCategory ||
            null;


        // --------------------------------------------------
        // GET ALL REAL HOTELS
        // --------------------------------------------------

        const allListings =
            await Listing.find({})
                .select(
                    "_id title description price location country category reviews"
                )
                .lean();


        // ==================================================
        // 1. BEST HOTEL COMMAND
        // ==================================================

        if (
            wantsBestHotel(message)
        ) {

            /*
              If Boss explicitly mentioned a category,
              use that category.

              Otherwise use currentCategory.
            */

            const bestHotel =
                await getBestHotel(
                    activeCategory
                );


            if (!bestHotel) {

                return res.json({

                    action: "chat",

                    hotelId: "",

                    category:
                        activeCategory || "",

                    reply:
                        activeCategory
                            ? `Sorry Boss, ${activeCategory} category mein abhi koi hotel available nahi hai.`
                            : "Boss, pehle koi category open kar do, phir main usme best hotel open kar dungi."

                });

            }


            return res.json({

                action: "open",

                hotelId:
                    bestHotel._id.toString(),

                url:
                    `/listings/${bestHotel._id}`,

                category:
                    bestHotel.category || "",

                hotel: {

                    title:
                        bestHotel.title,

                    description:
                        bestHotel.description,

                    price:
                        bestHotel.price,

                    location:
                        bestHotel.location,

                    country:
                        bestHotel.country,

                    category:
                        bestHotel.category

                },

                reply:
                    activeCategory
                        ? `Ji Boss, ${activeCategory} category ka best hotel open kar rahi hoon.`
                        : `Ji Boss, ${bestHotel.title} open kar rahi hoon.`

            });

        }


        // ==================================================
        // 2. DIRECT CATEGORY
        // ==================================================

        if (
            detectedCategory &&
            wantsCategory(message)
        ) {

            return res.json({

                action: "category",

                category:
                    detectedCategory,

                hotelId: "",

                url:
                    `/listings/category/${encodeURIComponent(
                        detectedCategory
                    )}`,

                reply:
                    `Ji Boss, ${detectedCategory} category open kar rahi hoon.`

            });

        }


        // ==================================================
        // 3. HOTEL DATA FOR GEMINI
        // ==================================================

        const hotelData =
            allListings.map(hotel => ({

                id:
                    hotel._id.toString(),

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

            }));


        // ==================================================
        // 4. GEMINI
        // ==================================================

        const response =
            await ai.models.generateContent({

                model:
                    "gemini-3.5-flash-lite",

                contents: `

User said:

"${message}"

Current category:

${activeCategory || "None"}

Available REAL Royal Stay hotels:

${JSON.stringify(hotelData)}

`,

                config: {

                 systemInstruction: `

You are MJ, the female AI assistant of Royal Stay.

Always call the user "Boss".

========================
LANGUAGE DETECTION
========================

Detect the language of Boss's LATEST message.

IMPORTANT:
Always reply in the SAME language and style as Boss's latest message.

1. If Boss speaks English:
   - Reply completely in English.
   - Do NOT use Hindi or Hinglish words.
   - Do NOT say "Ji Boss".
   - Use natural English.

2. If Boss speaks Hindi in Devanagari script:
   - Reply in Hindi script.

3. If Boss speaks Hinglish / Roman Hindi:
   - Reply in natural Hinglish.
   - Use Roman Hindi, not Devanagari.

4. If Boss mixes English and Hindi:
   - Reply in the same mixed Hinglish style.

5. Never change the language unnecessarily.

Examples:

Boss:
"Show me hotels in mountains"

MJ:
"Sure Boss, I’m showing you the hotels in the Mountains category."

Boss:
"Mountains me hotels dikhao"

MJ:
"Ji Boss, Mountains category ke hotels dikha rahi hoon."

Boss:
"मुझे Mountains के hotels दिखाओ"

MJ:
"जी Boss, Mountains category के hotels दिखा रही हूँ।"

Boss:
"Which hotel is the best?"

MJ:
"Sure Boss, I’ll open the best hotel."

========================

Keep replies short because they are spoken aloud.

You have access ONLY to the real hotel data provided.

Never invent a hotel.

Never invent a hotel ID.

Current category may be available.

Current category:

${activeCategory || "None"}


HOTEL OPEN:

If Boss asks to open a specific hotel,
find the matching hotel from the real hotel list.

Return:

{
    "action": "open",
    "hotelId": "REAL_ID",
    "reply": "SHORT RESPONSE IN BOSS'S LANGUAGE"
}


HOTEL INFORMATION:

If Boss asks about hotel information,
return:

{
    "action": "info",
    "hotelId": "REAL_ID",
    "reply": "SHORT RESPONSE IN BOSS'S LANGUAGE"
}


CATEGORY:

Available categories:

Mountains
Beaches
Camping
Castle
Luxury
Pools
Arctic

If Boss asks for a category:

{
    "action": "category",
    "hotelId": "",
    "category": "Mountains",
    "reply": "SHORT RESPONSE IN BOSS'S LANGUAGE"
}


SEARCH:

If Boss asks to search hotels:

{
    "action": "search",
    "hotelId": "",
    "category": "",
    "reply": "SHORT RESPONSE IN BOSS'S LANGUAGE"
}


NORMAL CHAT:

{
    "action": "chat",
    "hotelId": "",
    "category": "",
    "reply": "SHORT RESPONSE IN BOSS'S LANGUAGE"
}


Return ONLY valid JSON.

Do NOT use markdown.

`
                }

            });


        // ==================================================
        // 5. PARSE GEMINI
        // ==================================================

        let result;


        try {

            let text =
                response.text.trim();


            text =
                text
                    .replace(
                        /^```json\s*/i,
                        ""
                    )
                    .replace(
                        /^```\s*/i,
                        ""
                    )
                    .replace(
                        /\s*```$/i,
                        ""
                    )
                    .trim();


            result =
                JSON.parse(text);

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


        // ==================================================
        // 6. CATEGORY RESPONSE
        // ==================================================

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

                    category:
                        category,

                    hotelId: "",

                    url:
                        `/listings/category/${encodeURIComponent(
                            category
                        )}`,

                    reply:
                        result.reply ||
                        `Ji Boss, ${category} category open kar rahi hoon.`

                });

            }

        }


        // ==================================================
        // 7. OPEN HOTEL
        // ==================================================

        if (
            result.action === "open" &&
            result.hotelId
        ) {

            const hotel =
                allListings.find(
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

                    category:
                        hotel.category || "",

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


        // ==================================================
        // 8. HOTEL INFO
        // ==================================================

        if (
            result.action === "info" &&
            result.hotelId
        ) {

            const hotel =
                allListings.find(
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

                    category:
                        hotel.category || "",

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


        // ==================================================
        // 9. SEARCH
        // ==================================================

        if (
            result.action === "search"
        ) {

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


        // ==================================================
        // 10. NORMAL CHAT
        // ==================================================

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


// ======================================================
// LISTING VALIDATION
// ======================================================

const validateListing =
    (req, res, next) => {

        let {
            error
        } =
            listingSchema.validate(
                req.body
            );


        if (error) {

            let errMsg =
                error.details
                    .map(
                        el => el.message
                    )
                    .join(",");


            throw new ExpressError(
                400,
                errMsg
            );

        }
        else {

            next();

        }

    };


// ======================================================
// REVIEW VALIDATION
// ======================================================

const validateReview =
    (req, res, next) => {

        let {
            error
        } =
            reviewSchema.validate(
                req.body
            );


        if (error) {

            let errMsg =
                error.details
                    .map(
                        el => el.message
                    )
                    .join(",");


            throw new ExpressError(
                400,
                errMsg
            );

        }
        else {

            next();

        }

    };


// ======================================================
// START DATABASE
// ======================================================

main()

    .then(() => {

        console.log(
            "connected to DB"
        );

    })

    .catch(err => {

        console.log(err);

    });


// ======================================================
// USER ROUTES
// ======================================================

app.use(
    "/",
    userRouter
);


// ======================================================
// HOME
// ======================================================

app.get("/", (req, res) => {

    res.render(
        "listings/home.ejs"
    );

});


// ======================================================
// SEARCH
// ======================================================

app.get(
    "/listings/search",
    wrapAsync(
        async (req, res) => {

            let { q } =
                req.query;


            if (!q) {

                return res.render(
                    "listings/index.ejs",
                    {
                        allListings: []
                    }
                );

            }


            const allListings =
                await Listing.find({

                    $or: [

                        {
                            title: {
                                $regex: q,
                                $options: "i"
                            }
                        },

                        {
                            category: {
                                $regex: q,
                                $options: "i"
                            }
                        },

                        {
                            location: {
                                $regex: q,
                                $options: "i"
                            }
                        },

                        {
                            country: {
                                $regex: q,
                                $options: "i"
                            }
                        }

                    ]

                });


            res.render(
                "listings/index.ejs",
                {
                    allListings
                }
            );

        }
    )
);


// ======================================================
// CATEGORY
// ======================================================

app.get(
    "/listings/category/:category",
    wrapAsync(
        async (req, res) => {

            let {
                category
            } = req.params;


            const allListings =
                await Listing.find({

                    category: {
                        $regex:
                            new RegExp(
                                `^${category}$`,
                                "i"
                            )
                    }

                });


            res.render(
                "listings/index.ejs",
                {
                    allListings,
                    category
                }
            );

        }
    )
);


// ======================================================
// LISTING ROUTES
// ======================================================

app.use(
    "/listings",
    listings
);


// ======================================================
// REVIEWS - CREATE
// ======================================================

app.post(
    "/listings/:id/reviews",

    validateReview,

    wrapAsync(
        async (req, res) => {

            let listing =
                await Listing.findById(
                    req.params.id
                );


            let newReview =
                new Review(
                    req.body.review
                );


            listing.reviews.push(
                newReview
            );


            await newReview.save();

            await listing.save();


            req.flash(
                "success",
                "Create Review Successfully"
            );


            res.redirect(
                `/listings/${listing._id}`
            );

        }
    )
);


// ======================================================
// REVIEW - DELETE
// ======================================================

app.delete(
    "/listings/:id/reviews/:reviewId",

    wrapAsync(
        async (req, res) => {

            let {
                id,
                reviewId
            } = req.params;


            await Listing.findByIdAndUpdate(

                id,

                {
                    $pull: {
                        reviews: reviewId
                    }
                }

            );


            await Review.findByIdAndDelete(
                reviewId
            );


            req.flash(
                "success",
                "Delete Review Successfully"
            );


            res.redirect(
                `/listings/${id}`
            );

        }
    )
);


// ======================================================
// 404
// ======================================================

app.use(
    (req, res, next) => {

        next(
            new ExpressError(
                404,
                "Page Not Found"
            )
        );

    }
);


// ======================================================
// ERROR HANDLER
// ======================================================

app.use(
    (err, req, res, next) => {

        let {
            statusCode = 500,
            message = "Something went wrong"
        } = err;


        res
            .status(statusCode)
            .render(
                "error.ejs",
                {
                    message
                }
            );

    }
);


// ======================================================
// SERVER
// ======================================================

app.listen(
    8080,
    () => {

        console.log(
            "server is listening to port 8080"
        );

    }
);