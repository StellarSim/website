const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const User = require("../models/User");
const Booking = require("../models/Booking");
const Contact = require("../models/Contact");
const Gallery = require("../models/Gallery");
const Testimonial = require("../models/Testimonial");
const { isAuthenticated, isNotAuthenticated } = require("../middleware/auth");
const { sendBookingStatusUpdate } = require("../utils/emailService");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../public/uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only image files (jpeg, jpg, png, gif) are allowed!"));
  },
});

// Admin login page
router.get("/login", isNotAuthenticated, (req, res) => {
  res.render("pages/admin/login", {
    title: "Admin Login - Stellar Simulations",
    description: "Admin login page for Stellar Simulations website.",
  });
});

// Admin login process
router.post("/login", isNotAuthenticated, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).render("pages/admin/login", {
        title: "Admin Login - Stellar Simulations",
        description: "Admin login page for Stellar Simulations website.",
        error: "User not found",
        email,
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).render("pages/admin/login", {
        title: "Admin Login - Stellar Simulations",
        description: "Admin login page for Stellar Simulations website.",
        error: "Incorrect password",
        email,
      });
    }

    // Set session
    req.session.user = {
      id: user._id,
      email: user.email,
      name: user.name,
    };
    req.session.isAdmin = true;

    // Redirect to dashboard or original destination
    const redirectUrl = req.session.returnTo || "/admin/dashboard";
    delete req.session.returnTo;

    res.redirect(redirectUrl);
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).render("pages/admin/login", {
      title: "Admin Login - Stellar Simulations",
      description: "Admin login page for Stellar Simulations website.",
      error: "An error occurred during login. Please try again.",
      email: req.body.email,
    });
  }
});

// Admin logout
router.get("/logout", isAuthenticated, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
    }
    res.redirect("/admin/login");
  });
});

// Admin dashboard
router.get("/dashboard", isAuthenticated, async (req, res) => {
  try {
    // Get counts for dashboard statistics
    const pendingBookingsCount = await Booking.countDocuments({
      status: "pending",
    });
    const approvedBookingsCount = await Booking.countDocuments({
      status: "approved",
    });
    const unreadContactsCount = await Contact.countDocuments({ isRead: false });
    const galleryItemsCount = await Gallery.countDocuments();

    // Get recent bookings
    const recentBookings = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(5);

    // Get recent contact submissions
    const recentContacts = await Contact.find()
      .sort({ createdAt: -1 })
      .limit(5);

    res.render("pages/admin/dashboard", {
      title: "Admin Dashboard - Stellar Simulations",
      description: "Admin dashboard for Stellar Simulations website.",
      stats: {
        pendingBookings: pendingBookingsCount,
        approvedBookings: approvedBookingsCount,
        unreadContacts: unreadContactsCount,
        galleryItems: galleryItemsCount,
      },
      recentBookings,
      recentContacts,
      req,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).render("pages/error", {
      title: "Error",
      description: "Something went wrong.",
      error: process.env.NODE_ENV === "development" ? error : {},
    });
  }
});

// Bookings management
router.get("/bookings", isAuthenticated, async (req, res) => {
  try {
    const status = req.query.status || "all";
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    // Build query based on status filter
    const query = status !== "all" ? { status } : {};

    // Get bookings with pagination
    const bookings = await Booking.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const totalBookings = await Booking.countDocuments(query);

    res.render("pages/admin/bookings", {
      title: "Manage Bookings - Stellar Simulations",
      description: "Manage booking requests for Stellar Simulations.",
      bookings,
      currentStatus: status,
      pagination: {
        current: page,
        pages: Math.ceil(totalBookings / limit),
        total: totalBookings,
      },
    });
  } catch (error) {
    console.error("Bookings management error:", error);
    res.status(500).render("pages/error", {
      title: "Error",
      description: "Something went wrong.",
      error: process.env.NODE_ENV === "development" ? error : {},
    });
  }
});

// View booking details
router.get("/bookings/:id", isAuthenticated, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).render("pages/error", {
        title: "Not Found",
        description: "Booking not found.",
        error: { status: 404 },
      });
    }

    res.render("pages/admin/booking-details", {
      title: "Booking Details - Stellar Simulations",
      description: "View booking details for Stellar Simulations.",
      booking,
    });
  } catch (error) {
    console.error("Booking details error:", error);
    res.status(500).render("pages/error", {
      title: "Error",
      description: "Something went wrong.",
      error: process.env.NODE_ENV === "development" ? error : {},
    });
  }
});

// Update booking status
router.post("/bookings/:id/status", isAuthenticated, async (req, res) => {
  try {
    const { status } = req.body;

    if (!["pending", "approved", "declined"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Send email notification for status update
    if (status === "approved" || status === "declined") {
      try {
        await sendBookingStatusUpdate(booking);
      } catch (emailError) {
        console.error("Status update email error:", emailError);
        // Continue even if email fails
      }
    }

    res.json({ success: true, booking });
  } catch (error) {
    console.error("Update booking status error:", error);
    res
      .status(500)
      .json({ error: "An error occurred while updating booking status" });
  }
});

// Calendar view
router.get("/calendar", isAuthenticated, async (req, res) => {
  try {
    // Get all approved bookings
    const bookings = await Booking.find({ status: "approved" });

    // Format bookings for calendar
    const calendarEvents = bookings.map((booking) => ({
      id: booking._id,
      title: `${booking.eventType} - ${booking.name}`,
      start: booking.eventDate,
      url: `/admin/bookings/${booking._id}`,
    }));

    res.render("pages/admin/calendar", {
      title: "Booking Calendar - Stellar Simulations",
      description:
        "Calendar view of approved bookings for Stellar Simulations.",
      calendarEvents: JSON.stringify(calendarEvents),
    });
  } catch (error) {
    console.error("Calendar view error:", error);
    res.status(500).render("pages/error", {
      title: "Error",
      description: "Something went wrong.",
      error: process.env.NODE_ENV === "development" ? error : {},
    });
  }
});

// Contact submissions management
router.get("/contacts", isAuthenticated, async (req, res) => {
  try {
    const filter = req.query.filter || "all";
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    // Build query based on read/unread filter
    const query =
      filter === "unread"
        ? { isRead: false }
        : filter === "read"
        ? { isRead: true }
        : {};

    // Get contacts with pagination
    const contacts = await Contact.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const totalContacts = await Contact.countDocuments(query);

    res.render("pages/admin/contacts", {
      title: "Contact Submissions - Stellar Simulations",
      description: "Manage contact form submissions for Stellar Simulations.",
      contacts,
      currentFilter: filter,
      pagination: {
        current: page,
        pages: Math.ceil(totalContacts / limit),
        total: totalContacts,
      },
    });
  } catch (error) {
    console.error("Contacts management error:", error);
    res.status(500).render("pages/error", {
      title: "Error",
      description: "Something went wrong.",
      error: process.env.NODE_ENV === "development" ? error : {},
    });
  }
});

// Mark contact as read
router.post("/contacts/:id/read", isAuthenticated, async (req, res) => {
  try {
    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );

    if (!contact) {
      return res.status(404).json({ error: "Contact not found" });
    }

    res.json({ success: true, contact });
  } catch (error) {
    console.error("Mark contact as read error:", error);
    res.status(500).json({ error: "An error occurred while updating contact" });
  }
});

// Gallery management
router.get("/gallery", isAuthenticated, async (req, res) => {
  try {
    const images = await Gallery.find().sort({ sortOrder: 1, createdAt: -1 });

    res.render("pages/admin/gallery", {
      title: "Manage Gallery - Stellar Simulations",
      description: "Manage gallery images for Stellar Simulations.",
      images,
    });
  } catch (error) {
    console.error("Gallery management error:", error);
    res.status(500).render("pages/error", {
      title: "Error",
      description: "Something went wrong.",
      error: process.env.NODE_ENV === "development" ? error : {},
    });
  }
});

// Add gallery image
router.post(
  "/gallery",
  isAuthenticated,
  upload.single("image"),
  async (req, res) => {
    try {
      const { title, description, category, featured } = req.body;

      if (!req.file) {
        return res.status(400).render("pages/admin/gallery", {
          title: "Manage Gallery - Stellar Simulations",
          description: "Manage gallery images for Stellar Simulations.",
          error: "Image file is required",
          formData: req.body,
        });
      }

      // Get highest sort order
      const highestSortOrder = await Gallery.findOne().sort({ sortOrder: -1 });
      const nextSortOrder = highestSortOrder
        ? highestSortOrder.sortOrder + 1
        : 1;

      // Create new gallery image
      const galleryImage = new Gallery({
        title,
        description,
        imageUrl: `/uploads/${req.file.filename}`,
        category,
        featured: featured === "on",
        sortOrder: nextSortOrder,
      });

      await galleryImage.save();

      res.redirect("/admin/gallery");
    } catch (error) {
      console.error("Add gallery image error:", error);
      res.status(500).render("pages/admin/gallery", {
        title: "Manage Gallery - Stellar Simulations",
        description: "Manage gallery images for Stellar Simulations.",
        error: "An error occurred while adding the image",
        formData: req.body,
      });
    }
  }
);

// Delete gallery image
router.post("/gallery/:id/delete", isAuthenticated, async (req, res) => {
  try {
    const image = await Gallery.findById(req.params.id);

    if (!image) {
      return res.status(404).json({ error: "Image not found" });
    }

    // Delete image file from uploads directory
    const imagePath = path.join(__dirname, "../public", image.imageUrl);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    // Delete image from database
    await Gallery.findByIdAndDelete(req.params.id);

    res.json({ success: true });
  } catch (error) {
    console.error("Delete gallery image error:", error);
    res
      .status(500)
      .json({ error: "An error occurred while deleting the image" });
  }
});

// Update gallery image
router.post(
  "/gallery/:id",
  isAuthenticated,
  upload.single("image"),
  async (req, res) => {
    try {
      const { title, description, category, featured, sortOrder } = req.body;

      const updateData = {
        title,
        description,
        category,
        featured: featured === "on",
        sortOrder: parseInt(sortOrder) || 0,
      };

      // If new image uploaded, update imageUrl
      if (req.file) {
        // Get old image path to delete
        const oldImage = await Gallery.findById(req.params.id);
        if (oldImage && oldImage.imageUrl) {
          const oldImagePath = path.join(
            __dirname,
            "../public",
            oldImage.imageUrl
          );
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }

        updateData.imageUrl = `/uploads/${req.file.filename}`;
      }

      const image = await Gallery.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
      });

      if (!image) {
        return res.status(404).json({ error: "Image not found" });
      }

      res.redirect("/admin/gallery");
    } catch (error) {
      console.error("Update gallery image error:", error);
      res.status(500).render("pages/admin/gallery", {
        title: "Manage Gallery - Stellar Simulations",
        description: "Manage gallery images for Stellar Simulations.",
        error: "An error occurred while updating the image",
        formData: req.body,
      });
    }
  }
);

// Testimonials management
router.get("/testimonials", isAuthenticated, async (req, res) => {
  try {
    const testimonials = await Testimonial.find().sort({ createdAt: -1 });

    res.render("pages/admin/testimonials", {
      title: "Manage Testimonials - Stellar Simulations",
      description: "Manage testimonials for Stellar Simulations.",
      testimonials,
    });
  } catch (error) {
    console.error("Testimonials management error:", error);
    res.status(500).render("pages/error", {
      title: "Error",
      description: "Something went wrong.",
      error: process.env.NODE_ENV === "development" ? error : {},
    });
  }
});

// Add testimonial
router.post("/testimonials", isAuthenticated, async (req, res) => {
  try {
    const { name, role, content, rating, eventType, isApproved } = req.body;

    // Create new testimonial
    const testimonial = new Testimonial({
      name,
      role,
      content,
      rating: parseInt(rating),
      eventType,
      isApproved: isApproved === "on",
    });

    await testimonial.save();

    res.redirect("/admin/testimonials");
  } catch (error) {
    console.error("Add testimonial error:", error);
    res.status(500).render("pages/admin/testimonials", {
      title: "Manage Testimonials - Stellar Simulations",
      description: "Manage testimonials for Stellar Simulations.",
      error: "An error occurred while adding the testimonial",
      formData: req.body,
    });
  }
});

// Update testimonial
router.post("/testimonials/:id", isAuthenticated, async (req, res) => {
  try {
    const { name, role, content, rating, eventType, isApproved } = req.body;

    const testimonial = await Testimonial.findByIdAndUpdate(
      req.params.id,
      {
        name,
        role,
        content,
        rating: parseInt(rating),
        eventType,
        isApproved: isApproved === "on",
      },
      { new: true }
    );

    if (!testimonial) {
      return res.status(404).json({ error: "Testimonial not found" });
    }

    res.redirect("/admin/testimonials");
  } catch (error) {
    console.error("Update testimonial error:", error);
    res.status(500).render("pages/admin/testimonials", {
      title: "Manage Testimonials - Stellar Simulations",
      description: "Manage testimonials for Stellar Simulations.",
      error: "An error occurred while updating the testimonial",
      formData: req.body,
    });
  }
});

// Delete testimonial
router.post("/testimonials/:id/delete", isAuthenticated, async (req, res) => {
  try {
    const testimonial = await Testimonial.findByIdAndDelete(req.params.id);

    if (!testimonial) {
      return res.status(404).json({ error: "Testimonial not found" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Delete testimonial error:", error);
    res
      .status(500)
      .json({ error: "An error occurred while deleting the testimonial" });
  }
});

// Export bookings as CSV
router.get("/export/bookings", isAuthenticated, async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });

    // Create CSV header
    let csv =
      "Name,Email,Phone,Event Type,Event Date,Duration,Attendees,Address,City,State,Zip Code,Special Requests,Status,Created At\n";

    // Add booking data
    bookings.forEach((booking) => {
      csv += `"${booking.name}","${booking.email}","${booking.phone}","${
        booking.eventType
      }","${new Date(booking.eventDate).toLocaleDateString()}","${
        booking.duration
      }","${booking.attendees}","${booking.location.address}","${
        booking.location.city
      }","${booking.location.state}","${booking.location.zipCode}","${
        booking.specialRequests || ""
      }","${booking.status}","${new Date(
        booking.createdAt
      ).toLocaleString()}"\n`;
    });

    // Set headers for file download
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=bookings.csv");

    res.send(csv);
  } catch (error) {
    console.error("Export bookings error:", error);
    res.status(500).render("pages/error", {
      title: "Error",
      description: "Something went wrong.",
      error: process.env.NODE_ENV === "development" ? error : {},
    });
  }
});

// Initialize admin user (only for first-time setup)
router.get("/setup", async (req, res) => {
  try {
    // Check if admin user already exists
    const adminExists = await User.findOne({ role: "admin" });

    if (adminExists) {
      return res
        .status(403)
        .send("Admin user already exists. Setup is not allowed.");
    }

    // Create admin user from environment variables
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      return res
        .status(400)
        .send("Admin email and password must be set in environment variables.");
    }

    // Create new admin user
    const admin = new User({
      email: adminEmail,
      password: adminPassword,
      name: "Admin",
      role: "admin",
    });

    await admin.save();

    res.send("Admin user created successfully. You can now log in.");
  } catch (error) {
    console.error("Admin setup error:", error);
    res.status(500).send("An error occurred during setup.");
  }
});

module.exports = router;
