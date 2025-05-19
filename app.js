const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const xss = require('xss-clean');
const path = require('path');
const connectmongoDB = require('./config/mongodbConfig.js');
const useragent = require('express-useragent');

const homepageRoutes = require('./v1/routes/homepage');
const productRoutes = require('./v1/routes/product');
// Keep the model import but comment out routes until ready
const streamerRoutes = require('./v1/routes/streamer');
const cartRoutes = require('./v1/routes/cart');
const checkoutRoutes = require('./v1/routes/checkout');
const authRoutes = require('./v1/routes/auth');

dotenv.config();
const app = express();
connectmongoDB();

// Define allowed origins based on environment
const allowedOrigins = [
  // Development origins
  'http://localhost:3000',
  'http://localhost:5173', // For Vite default port
  `http://localhost:${process.env.PORT}`,
  // Production origins
  'https://slicenshare.vercel.app',
  'https://slice-nshare-server.vercel.app',
  process.env.PRODUCTION_CLIENT_URL,
  process.env.PRODUCTION_API_URL,
].filter(Boolean); // Remove any undefined values

// Define CORS options
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      console.log('Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Allow-Origin',
    'Access-Control-Allow-Headers',
    'Access-Control-Allow-Methods'
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  credentials: true,
  optionsSuccessStatus: 200, // For legacy browser support
  maxAge: 86400 // 24 hours
};

// Apply security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "unsafe-none" }
}));
app.use(xss());
app.use(express.json());
// Apply CORS middleware globally
app.use(cors(corsOptions));
// Handle preflight requests with CORS
app.options('*', cors(corsOptions));
// Serve static files with correct MIME types
// Serving static files with correct MIME types
app.use('/public', express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, path, stat) => {
    if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  },
}));

// Base API route with error handling
app.get('/api/v1', (req, res) => {
  try {
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>API v1 Response</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background-color: #f4f4f4;
            margin: 0;
          }
          .container {
            text-align: center;
            padding: 20px;
            border-radius: 8px;
            background-color: #ffffff;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
          }
          h1 {
            color: #333;
          }
          p {
            color: #555;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Welcome to SliceNShare API v1</h1>
          <p>This is the HTML response for the <i>/api/v1</i> endpoint.</p>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Error in /api/v1 route:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.use(useragent.express());

// Serve favicon with proper error handling
app.get('/favicon.ico', (req, res) => {
  try {
    res.status(204).end(); // No content response for favicon requests
  } catch (error) {
    console.error('Error serving favicon:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.use('/api/v1/homepage', homepageRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/products', productRoutes);
// Will implement streamer routes after user authentication is complete
// app.use('/api/v1/streamers', streamerRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/checkout', checkoutRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
  console.log(`Server is running on ${process.env.BASE_URL}`);
})