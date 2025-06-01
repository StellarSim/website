const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");
const {
  sendBookingNotification,
  sendBookingConfirmation,
} = require("../utils/emailService");
const rateLimit = require("express-rate-limit");

// Rate limiting for booking submissions
const bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each IP to 5 booking requests per hour
  message:
    "Too many booking requests from this IP, please try again after an hour",
});

// Booking page
router.get("/", (req, res) => {
  console.log("GET /booking");
  res.render("pages/booking", {
    title: "Book Your Experience - Stellar Simulations",
    description:
      "Book your spaceship bridge simulator experience for your next event. Available in 2.5-hour, 5-hour, or 10-hour sessions throughout Utah.",
    success: req.query.success === "true",
    req,
  });
});

// Submit booking request
router.post("/", bookingLimiter, async (req, res) => {
  console.log("POST /booking");
  try {
    const {
      name,
      email,
      phone,
      eventType,
      eventDate,
      duration,
      attendees,
      address,
      city,
      state,
      zipCode,
      specialRequests,
    } = req.body;

    // Create new booking
    const booking = new Booking({
      name,
      email,
      phone,
      eventType,
      eventDate,
      duration,
      attendees,
      location: {
        address,
        city,
        state: state || "Utah",
        zipCode,
      },
      specialRequests,
      status: "pending",
    });

    // Save booking to database
    await booking.save();

    // Send email notifications
    console.log("Sending email notifications...");
    try {
      await sendBookingNotification(booking);
      await sendBookingConfirmation(booking);
    } catch (emailError) {
      console.error("Email notification error:", emailError);
      // Continue even if email fails
    }

    // Redirect with success message
    res.redirect("/booking?success=true");
  } catch (error) {
    console.error("Booking submission error:", error);
    res.status(400).render("pages/booking", {
      title: "Book Your Experience - Stellar Simulations",
      description:
        "Book your spaceship bridge simulator experience for your next event.",
      error:
        "There was an error processing your booking request. Please try again.",
      formData: req.body,
      req,
    });
  }
});

// Check availability endpoint (for potential AJAX calls from the frontend)
router.get("/check-availability", async (req, res) => {
  console.log("GET /booking/check-availability");
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ error: "Date parameter is required" });
    }

    // Find bookings on the requested date
    const bookings = await Booking.find({
      eventDate: {
        $gte: new Date(new Date(date).setHours(0, 0, 0)),
        $lt: new Date(new Date(date).setHours(23, 59, 59)),
      },
      status: "approved",
    });

    // Return availability status
    res.json({
      date,
      isAvailable: bookings.length === 0,
      bookingsCount: bookings.length,
    });
  } catch (error) {
    console.error("Availability check error:", error);
    res.status(500).json({ error: "Error checking availability" });
  }
});

module.exports = router;
