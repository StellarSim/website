# Stellar Simulations Website

A complete multi-page website for Stellar Simulations, a company that provides spaceship bridge simulator experiences for events like birthday parties using a custom-designed simulator trailer.

## Features

- **Modern Design**: Blue-toned color scheme with responsive layout for mobile and desktop
- **Strong SEO Implementation**: Meta tags, Open Graph, sitemap.xml, structured data
- **Express.js Backend**: Node.js backend with MongoDB database integration
- **Comprehensive Pages**:
  - Homepage with value proposition and featured content
  - Booking page for session requests
  - About Us page
  - Gallery page
  - Reviews/Testimonials page
  - Contact page
  - Admin dashboard (password protected)
- **Form Handling**: Booking requests and contact form submissions
- **Security Features**: Rate-limiting, spam protection, secure admin access
- **Email Notifications**: Automated emails for new bookings and inquiries

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript, EJS templating
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Authentication**: Express-session, bcrypt
- **Email**: Nodemailer
- **Security**: Helmet, Express Rate Limit

## Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env` file with required environment variables (see `.env.example`)
4. Start the development server: `npm run dev`

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/stellar-simulations
SESSION_SECRET=your_session_secret
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=secure_password_hash
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
NODE_ENV=development
```

## Project Structure

```
├── config/             # Configuration files
├── controllers/        # Route controllers
├── middleware/         # Custom middleware
├── models/             # Database models
├── public/             # Static assets
│   ├── css/            # Stylesheets
│   ├── js/             # Client-side JavaScript
│   ├── images/         # Images and media
│   └── uploads/        # User uploaded content
├── routes/             # Express routes
├── utils/              # Utility functions
├── views/              # EJS templates
│   ├── partials/       # Reusable template parts
│   └── pages/          # Page templates
├── .env                # Environment variables
├── .env.example        # Example environment file
├── .gitignore          # Git ignore file
├── package.json        # Project dependencies
├── server.js           # Application entry point
└── README.md           # Project documentation
```

## License

ISC
