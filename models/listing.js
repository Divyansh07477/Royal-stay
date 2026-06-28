const mongoose = require("mongoose");
const Review = require("./review.js");
const { required } = require("joi");
const Schema = mongoose.Schema;

const listingSchema = new Schema({
  title: {
    type: String,
    required: true,
  },

  description: String,

  image: {
    filename: {
      type: String,
      default: "listingimage",
    },

    url: {
      type: String,
      default:
        "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
      set: (v) =>
        v === ""
          ? "https://images.unsplash.com/photo-1506744038136-46273834b3fb"
          : v,
    },
  },

  price: Number,
  location: String,
  country: String,

  category: {
    type: String,
    required: true,
  },

  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  reviews: [
    {
      type: Schema.Types.ObjectId,
      ref: "Review",
    },
  ],
});
const Listing = mongoose.model("Listing", listingSchema);

module.exports = Listing;