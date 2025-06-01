const express = require("express");
const router = express.Router();
const Contact = require("../models/Contact");
const {
  sendContactNotification,
  sendContactConfirmation,
} = require("../utils/emailService");
const rateLimit = require("express-rate-limit");

// Rate limiting for contact form submissions
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each IP to 5 contact form submissions per hour
  message:
    "Too many contact requests from this IP, please try again after an hour",
});

// Contact page
router.get("/", (req, res) => {
  res.render("pages/contact", {
    title: "Contact Us - Stellar Simulations",
    description:
      "Get in touch with Stellar Simulations for questions about our spaceship bridge simulator experiences or to request more information.",
    success: req.query.success === "true",
    req,
  });
});

// Submit contact form
router.post("/", contactLimiter, async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    // Create new contact submission
    const contact = new Contact({
      name,
      email,
      phone,
      subject,
      message,
    });

    // Save contact to database
    await contact.save();

    // Send email notifications
    try {
      await sendContactNotification(contact);
      await sendContactConfirmation(contact);
    } catch (emailError) {
      console.error("Email notification error:", emailError);
      // Continue even if email fails
    }

    // Redirect with success message
    res.redirect("/contact?success=true");
  } catch (error) {
    console.error("Contact submission error:", error);
    res.status(400).render("pages/contact", {
      title: "Contact Us - Stellar Simulations",
      description:
        "Get in touch with Stellar Simulations for questions about our spaceship bridge simulator experiences.",
      error:
        "There was an error processing your contact request. Please try again.",
      formData: req.body,
      req,
    });
  }
});

module.exports = router;
