const express = require("express");
const router = express.Router();
const Testimonial = require("../models/Testimonial");
const Gallery = require("../models/Gallery");

// Home page
router.get("/", async (req, res) => {
  try {
    // Get featured testimonials
    const testimonials = await Testimonial.find({ isApproved: true })
      .sort({ createdAt: -1 })
      .limit(3);

    // Get featured gallery images
    const featuredImages = await Gallery.find({ featured: true })
      .sort({ sortOrder: 1 })
      .limit(6);

    res.render("pages/index", {
      title: "Stellar Simulations - Spaceship Bridge Simulator Experiences",
      description:
        "Experience the thrill of commanding a spaceship with our mobile bridge simulator. Perfect for birthday parties and events throughout Utah.",
      testimonials,
      featuredImages,
      req,
    });
  } catch (error) {
    console.error("Home page error:", error);
    res.status(500).render("pages/error", {
      title: "Error",
      description: "Something went wrong.",
      error: process.env.NODE_ENV === "development" ? error : {},
    });
  }
});

// About Us page
router.get("/about", (req, res) => {
  res.render("pages/about", {
    title: "About Us - Stellar Simulations",
    description:
      "Learn about Stellar Simulations, our mission, our mobile spaceship bridge simulator, and our team.",
    req,
  });
});

// Gallery page
router.get("/gallery", async (req, res) => {
  try {
    const category = req.query.category || "all";

    // Build query based on category filter
    const query = category !== "all" ? { category } : {};

    // Get gallery images
    const images = await Gallery.find(query).sort({
      sortOrder: 1,
      createdAt: -1,
    });

    // Get all available categories for filter
    const categories = await Gallery.distinct("category");

    res.render("pages/gallery", {
      title: "Gallery - Stellar Simulations",
      description:
        "View photos and videos of our spaceship bridge simulator in action at various events.",
      images,
      categories,
      currentCategory: category,
      req,
    });
  } catch (error) {
    console.error("Gallery page error:", error);
    res.status(500).render("pages/error", {
      title: "Error",
      description: "Something went wrong.",
      error: process.env.NODE_ENV === "development" ? error : {},
    });
  }
});

// Testimonials page
router.get("/testimonials", async (req, res) => {
  try {
    const testimonials = await Testimonial.find({ isApproved: true }).sort({
      createdAt: -1,
    });

    res.render("pages/testimonials", {
      title: "Testimonials - Stellar Simulations",
      description:
        "Read what our customers have to say about their experiences with our spaceship bridge simulator.",
      testimonials,
      req,
    });
  } catch (error) {
    console.error("Testimonials page error:", error);
    res.status(500).render("pages/error", {
      title: "Error",
      description: "Something went wrong.",
      error: process.env.NODE_ENV === "development" ? error : {},
    });
  }
});

module.exports = router;
