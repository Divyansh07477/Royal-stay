// const Listing = require("./models/listing");
// module.exports.isOwner = async (req, res, next) => {
//     let { id } = req.params;

//     const listing = await Listing.findById(id);

//     if (!listing.owner.equals(req.user._id)) {
//         req.flash("error", "You are not the owner!");
//         return res.redirect(`/listings/${id}`);
//     }

//     next();
// };
// module.exports.isLoggedIn = (req, res, next) => {
//     console.log(req.user);

//     if (!req.isAuthenticated()) {
//         req.flash("error", "You are not logged");
//         return res.redirect("/listings");
//     }

//     next();
// };




const Listing = require("./models/listing");

// LOGIN CHECK
module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.flash("error", "You are not logged in");
        return res.redirect("/login");
    }
    next();
};


module.exports.isOwner = async (req, res, next) => {
    try {
        let { id } = req.params;

        const listing = await Listing.findById(id);

        //  listing exist check
        if (!listing) {
            req.flash("error", "Listing not found");
            return res.redirect("/listings");
        }

        //  owner check safe
        if (!listing.owner.equals(req.user._id)) {
            req.flash("error", "You are not the owner!");
            return res.redirect(`/listings/${id}`);
        }

        next();

    } catch (err) {
        console.log(err);
        req.flash("error", "Something went wrong");
        res.redirect("/listings");
    }
};