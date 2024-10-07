// Import dotenv for environment variables
require("dotenv").config();
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const expressBrute = require("express-brute");
const https = require("https");
const fs = require("fs");
const cookieParser = require("cookie-parser"); // Added for handling cookies

const app = express();

// Load SSL certificate
const serverOptions = {
  key: fs.readFileSync("./localhost-key.pem"),
  cert: fs.readFileSync("./localhost.pem"),
};

const corsOptions = {
  origin: ["http://localhost:3000", "https://localhost:3000"],
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Middleware
app.use(express.json());
app.use(cookieParser()); // Enable cookie parsing

// Security Headers
app.use(
  helmet({
    frameguard: { action: "deny" }, // Protects against Clickjacking attacks
  })
);

// Rate limiter to prevent DDoS
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use(limiter);

// Express Brute for brute-force protection
const store = new expressBrute.MemoryStore();
const bruteforce = new expressBrute(store);

// In-memory storage
let users = [];
let payments = [];

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const token = req.cookies.jwt; // Get token from cookie

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid token" });
    }
    req.user = user;
    next();
  });
};

// User registration endpoint
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { email, username, password } = req.body;

    // Validation patterns
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const usernamePattern = /^[a-zA-Z0-9_]{3,20}$/;
    const passwordPattern =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (
      !emailPattern.test(email) ||
      !usernamePattern.test(username) ||
      !passwordPattern.test(password)
    ) {
      return res.status(400).json({ message: "Invalid input format." });
    }

    const existingUser = users.find((user) => user.email === email);
    if (existingUser) {
      return res.status(409).json({ message: "User already registered." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      id: users.length + 1,
      email,
      username,
      password: hashedPassword,
    };

    users.push(newUser);

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// User login endpoint
app.post("/api/auth/login", bruteforce.prevent, async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = users.find((u) => u.email === email);
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Set token in HTTP-only secure cookie
    res.cookie("jwt", token, {
      httpOnly: true, // Prevent client-side access
      secure: true, // Send only over HTTPS
      sameSite: "Strict", // Prevents CSRF
      maxAge: 60 * 60 * 1000, // 1 hour
    });

    res.json({ message: "Login successful", token });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// Payment endpoint
app.post("/api/auth/payments", authenticateToken, (req, res) => {
  res.json({ message: "Payment processed successfully" });
});

// Start HTTPS server
const PORT = process.env.PORT || 5000;
https.createServer(serverOptions, app).listen(PORT, () => {
  console.log(`Server running on https://localhost:${PORT}`);
});

// View users route
app.get("/api/auth/users", (req, res) => {
  res.json(users);
});

app.get("/", (req, res) => {
  res.send("Welcome to the secure payment portal!");
});

// Serve static files from React app (assuming the frontend is built)
const path = require("path");

app.use(express.static(path.join(__dirname, "frontend/build")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend/build", "index.html"));
});

app.post("/api/auth/logout", (req, res) => {
  res.clearCookie("jwt", { httpOnly: true, secure: true, sameSite: "Strict" });
  res.json({ message: "Logout successful" });
});
