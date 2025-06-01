const nodemailer = require("nodemailer");

// Create reusable transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const emailStyle = `
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: #222;
  background-color: #f7f9fc;
  padding: 20px;
  border-radius: 8px;
`;

const headingStyle = `
  color: #0047ab;
  border-bottom: 2px solid #007bff;
  padding-bottom: 5px;
  margin-bottom: 20px;
`;

const labelStyle = `
  font-weight: 600;
  color: #003366;
`;

const paragraphStyle = `
  line-height: 1.5;
  margin: 8px 0;
`;

const listStyle = `
  padding-left: 20px;
  margin: 10px 0 20px 0;
`;

const linkStyle = `
  color: #007bff;
  text-decoration: none;
`;

const footerStyle = `
  margin-top: 30px;
  font-size: 0.9em;
  color: #555;
`;

/**
 * Wrap content with a container and style
 */
function wrapWithContainer(htmlContent) {
  return `
    <div style="${emailStyle}">
      ${htmlContent}
    </div>
  `;
}

/**
 * Send email notification for new booking request
 * @param {Object} booking - Booking object with all details
 * @returns {Promise}
 */
const sendBookingNotification = async (booking) => {
  const adminEmail = process.env.ADMIN_EMAIL;

  const html = wrapWithContainer(`
    <h1 style="${headingStyle}">New Booking Request</h1>
    <p style="${paragraphStyle}"><span style="${labelStyle}">Name:</span> ${
    booking.name
  }</p>
    <p style="${paragraphStyle}"><span style="${labelStyle}">Email:</span> ${
    booking.email
  }</p>
    <p style="${paragraphStyle}"><span style="${labelStyle}">Phone:</span> ${
    booking.phone
  }</p>
    <p style="${paragraphStyle}"><span style="${labelStyle}">Event Type:</span> ${
    booking.eventType
  }</p>
    <p style="${paragraphStyle}"><span style="${labelStyle}">Event Date:</span> ${new Date(
    booking.eventDate
  ).toLocaleDateString()}</p>
    <p style="${paragraphStyle}"><span style="${labelStyle}">Duration:</span> ${
    booking.duration
  }</p>
    <p style="${paragraphStyle}"><span style="${labelStyle}">Attendees:</span> ${
    booking.attendees
  }</p>
    <p style="${paragraphStyle}"><span style="${labelStyle}">Location:</span> ${
    booking.location.address
  }, ${booking.location.city}, ${booking.location.state} ${
    booking.location.zipCode
  }</p>
    <p style="${paragraphStyle}"><span style="${labelStyle}">Special Requests:</span> ${
    booking.specialRequests || "None"
  }</p>
    <p style="${paragraphStyle}"><span style="${labelStyle}">Created At:</span> ${new Date(
    booking.createdAt
  ).toLocaleString()}</p>
    <p style="${paragraphStyle}">
      Please log in to the <a href="${
        process.env.NODE_ENV === "production"
          ? "https://stellarsimulations.com"
          : "http://localhost:3000"
      }/admin" style="${linkStyle}">admin dashboard</a> to approve or decline this request.
    </p>
  `);

  const mailOptions = {
    from: `"Stellar Simulations" <${process.env.EMAIL_USER}>`,
    to: adminEmail,
    subject: "New Booking Request",
    html,
  };

  return transporter.sendMail(mailOptions);
};

/**
 * Send confirmation email to customer for booking request
 * @param {Object} booking
 * @returns {Promise}
 */
const sendBookingConfirmation = async (booking) => {
  const html = wrapWithContainer(`
    <h1 style="${headingStyle}">Thank You for Your Booking Request!</h1>
    <p style="${paragraphStyle}">Dear ${booking.name},</p>
    <p style="${paragraphStyle}">
      We have received your booking request for a ${
        booking.duration
      } spaceship bridge simulator experience on ${new Date(
    booking.eventDate
  ).toLocaleDateString()}.
    </p>
    <p style="${paragraphStyle}">
      Our team will review your request and get back to you shortly to confirm availability and provide further details.
    </p>
    <p style="${labelStyle}">Booking Details:</p>
    <ul style="${listStyle}">
      <li><strong>Event Type:</strong> ${booking.eventType}</li>
      <li><strong>Event Date:</strong> ${new Date(
        booking.eventDate
      ).toLocaleDateString()}</li>
      <li><strong>Duration:</strong> ${booking.duration}</li>
      <li><strong>Attendees:</strong> ${booking.attendees}</li>
      <li><strong>Location:</strong> ${booking.location.address}, ${
    booking.location.city
  }, ${booking.location.state} ${booking.location.zipCode}</li>
    </ul>
    <p style="${paragraphStyle}">
      If you have any questions or need to make changes to your booking, please contact us at <a href="mailto:${
        process.env.ADMIN_EMAIL || "info@stellarsimulations.com"
      }" style="${linkStyle}">${
    process.env.ADMIN_EMAIL || "info@stellarsimulations.com"
  }</a>.
    </p>
    <p style="${paragraphStyle}">
      Thank you for choosing Stellar Simulations for your event!
    </p>
    <p style="${paragraphStyle}">Best regards,<br>The Stellar Simulations Team</p>
  `);

  const mailOptions = {
    from: `"Stellar Simulations" <${process.env.EMAIL_USER}>`,
    to: booking.email,
    subject: "Your Booking Request Has Been Received",
    html,
  };

  return transporter.sendMail(mailOptions);
};

/**
 * Send email notification for new contact form submission
 * @param {Object} contact
 * @returns {Promise}
 */
const sendContactNotification = async (contact) => {
  const adminEmail = process.env.ADMIN_EMAIL;

  const html = wrapWithContainer(`
    <h1 style="${headingStyle}">New Contact Form Submission</h1>
    <p style="${paragraphStyle}"><span style="${labelStyle}">Name:</span> ${
    contact.name
  }</p>
    <p style="${paragraphStyle}"><span style="${labelStyle}">Email:</span> ${
    contact.email
  }</p>
    <p style="${paragraphStyle}"><span style="${labelStyle}">Phone:</span> ${
    contact.phone || "Not provided"
  }</p>
    <p style="${paragraphStyle}"><span style="${labelStyle}">Subject:</span> ${
    contact.subject
  }</p>
    <p style="${paragraphStyle}"><span style="${labelStyle}">Message:</span></p>
    <p style="${paragraphStyle}">${contact.message}</p>
    <p style="${paragraphStyle}"><span style="${labelStyle}">Submitted At:</span> ${new Date(
    contact.createdAt
  ).toLocaleString()}</p>
  `);

  const mailOptions = {
    from: `"Stellar Simulations" <${process.env.EMAIL_USER}>`,
    to: adminEmail,
    subject: `New Contact Form Submission: ${contact.subject}`,
    html,
  };

  return transporter.sendMail(mailOptions);
};

/**
 * Send confirmation email to customer for contact form submission
 * @param {Object} contact
 * @returns {Promise}
 */
const sendContactConfirmation = async (contact) => {
  const html = wrapWithContainer(`
    <h1 style="${headingStyle}">Thank You for Contacting Us!</h1>
    <p style="${paragraphStyle}">Dear ${contact.name},</p>
    <p style="${paragraphStyle}">
      We have received your message regarding "<strong>${contact.subject}</strong>" and will get back to you as soon as possible.
    </p>
    <p style="${paragraphStyle}">For your reference, here is a copy of your message:</p>
    <p style="${paragraphStyle}">${contact.message}</p>
    <p style="${paragraphStyle}">
      If you have any additional information to provide, please feel free to reply to this email.
    </p>
    <p style="${paragraphStyle}">Thank you for your interest in Stellar Simulations!</p>
    <p style="${paragraphStyle}">Best regards,<br>The Stellar Simulations Team</p>
  `);

  const mailOptions = {
    from: `"Stellar Simulations" <${process.env.EMAIL_USER}>`,
    to: contact.email,
    subject: "We've Received Your Message",
    html,
  };

  return transporter.sendMail(mailOptions);
};

/**
 * Send booking status update email to customer
 * @param {Object} booking
 * @returns {Promise}
 */
const sendBookingStatusUpdate = async (booking) => {
  const statusMessages = {
    approved: {
      subject: "Your Booking Has Been Approved!",
      heading: "Booking Approved",
      message: `We're excited to confirm your ${
        booking.duration
      } spaceship bridge simulator experience on ${new Date(
        booking.eventDate
      ).toLocaleDateString()}. Our team is looking forward to providing an unforgettable experience for your ${
        booking.eventType
      }.`,
    },
    declined: {
      subject: "Regarding Your Booking Request",
      heading: "Booking Request Update",
      message:
        "We regret to inform you that we are unable to accommodate your booking request at this time. This could be due to scheduling conflicts or other logistical constraints.",
    },
  };

  const statusInfo = statusMessages[booking.status] || {
    subject: "Booking Status Update",
    heading: "Booking Status Update",
    message: "Here is an update regarding your booking request.",
  };

  const html = wrapWithContainer(`
    <h1 style="${headingStyle}">${statusInfo.heading}</h1>
    <p style="${paragraphStyle}">Dear ${booking.name},</p>
    <p style="${paragraphStyle}">${statusInfo.message}</p>
    <p style="${labelStyle}">Booking Details:</p>
    <ul style="${listStyle}">
      <li><strong>Event Type:</strong> ${booking.eventType}</li>
      <li><strong>Event Date:</strong> ${new Date(
        booking.eventDate
      ).toLocaleDateString()}</li>
      <li><strong>Duration:</strong> ${booking.duration}</li>
      <li><strong>Attendees:</strong> ${booking.attendees}</li>
      <li><strong>Location:</strong> ${booking.location.address}, ${
    booking.location.city
  }, ${booking.location.state} ${booking.location.zipCode}</li>
    </ul>
    <p style="${paragraphStyle}">
      If you have any questions or need further assistance, please contact us at <a href="mailto:${
        process.env.ADMIN_EMAIL || "info@stellarsimulations.com"
      }" style="${linkStyle}">${
    process.env.ADMIN_EMAIL || "info@stellarsimulations.com"
  }</a>.
    </p>
    <p style="${paragraphStyle}">Thank you for choosing Stellar Simulations!</p>
    <p style="${paragraphStyle}">Best regards,<br>The Stellar Simulations Team</p>
  `);

  const mailOptions = {
    from: `"Stellar Simulations" <${process.env.EMAIL_USER}>`,
    to: booking.email,
    subject: statusInfo.subject,
    html,
  };

  return transporter.sendMail(mailOptions);
};

module.exports = {
  sendBookingNotification,
  sendBookingConfirmation,
  sendContactNotification,
  sendContactConfirmation,
  sendBookingStatusUpdate,
};
