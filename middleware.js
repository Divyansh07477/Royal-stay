const Listing = require("./models/listing");
module.exports.isOwner = async (req, res, next) => {
    let { id } = req.params;

    const listing = await Listing.findById(id);

    if (!listing.owner.equals(req.user._id)) {
        req.flash("error", "You are not the owner!");
        return res.redirect(`/listings/${id}`);
    }

    next();
};
module.exports.isLoggedIn = (req, res, next) => {
    console.log(req.user);

    if (!req.isAuthenticated()) {
        req.flash("error", "You are not logged");
        return res.redirect("/listings");
    }

    next();
};