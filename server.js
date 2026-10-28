/**
 * ==============================================================================
 * CYCLEGO - BACKEND SERVER
 * File: server.js
 * Technology: Node.js, Express, MongoDB (Mongoose)
 * Description: Modular, concise server handling authentication, bicycle fleet,
 *              admin booking management, and MongoDB Atlas persistence.
 * ==============================================================================
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dns = require('dns');

// Use reliable Google DNS resolvers to resolve MongoDB Atlas SRV records on Windows
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
  console.warn("[DNS] Custom DNS set failed:", e.message);
}

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// MongoDB Atlas Connection
const MONGO_URI = "mongodb+srv://suganthpiranav_db_user:GvYIGxiiUMaGK4tP@cluster0.7nqmue5.mongodb.net/cyclego_db?retryWrites=true&w=majority";
let isMongoConnected = false;

mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 })
  .then(() => {
    isMongoConnected = true;
    console.log("[MongoDB] Connected successfully to MongoDB Atlas!");
    seedData();
  })
  .catch((err) => {
    isMongoConnected = false;
    console.warn("[MongoDB] Atlas direct access unavailable, using resilient store:", err.message);
  });

// Schemas & Models
// User Schema: supports email and/or phone authentication
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, default: "" },
  email: { type: String, default: "" },
  password: { type: String, default: "user123" },
  role: { type: String, enum: ['Customer', 'Admin'], default: 'Customer' },
  avatar: { type: String, default: '🚴' }
});

// Booking Schema: custom String _id for reliable Atlas & local storage
const BookingSchema = new mongoose.Schema({
  _id: { type: String },
  userName: { type: String, required: true },
  userEmail: { type: String, default: "" },
  userPhone: { type: String, default: "" },
  cycleId: { type: String, required: true },
  cycleName: { type: String, required: true },
  category: { type: String, required: true },
  cycleImage: { type: String, default: 'images/cycle_hero.jpg' },
  days: { type: Number, required: true },
  pricePerDay: { type: Number, required: true },
  totalCost: { type: Number, required: true },
  bookingDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['Confirmed', 'Active', 'Returned', 'Cancelled'], default: 'Confirmed' }
});

const User = mongoose.model('User', UserSchema);
const Booking = mongoose.model('Booking', BookingSchema);

// Expanded Realistic Demo Users
const DEMO_USERS = [
  { name: "Alex Rider", email: "rider@cyclego.com", password: "user123", role: "Customer", avatar: "🚴", phone: "9876543210" },
  { name: "Sarah Admin", email: "admin@cyclego.com", password: "admin123", role: "Admin", avatar: "👑", phone: "9876543211" },
  { name: "Maya Patel", email: "maya@cyclego.com", password: "user123", role: "Customer", avatar: "🚴", phone: "9876543212" },
  { name: "Vikram Singh", email: "vikram@cyclego.com", password: "user123", role: "Customer", avatar: "🚵", phone: "9876543213" },
  { name: "Priya Sharma", email: "priya@cyclego.com", password: "user123", role: "Customer", avatar: "🚴", phone: "9876543214" }
];

// 7 Realistic Bicycle Fleet
const BICYCLE_FLEET = [
  {
    id: "bike-1",
    name: "Aurora Volt Commuter",
    category: "Electric",
    pricePerDay: 500,
    image: "images/cycle_hero.jpg",
    specs: ["250W Motor", "45km Range", "Hydraulic Discs"],
    tag: "Popular",
    description: "Eco-friendly, pedal-assist smart electric bicycle with aerodynamic alloy frame."
  },
  {
    id: "bike-2",
    name: "TrailBlazer Pro 29",
    category: "Mountain",
    pricePerDay: 320,
    image: "images/cycle_mountain.jpg",
    specs: ["29\" Wheels", "21-Speed Shimano", "Front Suspension"],
    tag: "Off-Road",
    description: "Rugged terrain explorer built for trail riding, climbs, and gravel terrain."
  },
  {
    id: "bike-3",
    name: "Speedster Veloce S-Works",
    category: "Road",
    pricePerDay: 400,
    image: "images/cycle_road.jpg",
    specs: ["Carbon-Alloy", "16-Speed Drop Bar", "Aero Wheels"],
    tag: "Speed",
    description: "Ultra-lightweight sprint bicycle crafted for high-speed endurance cycling."
  },
  {
    id: "bike-4",
    name: "Flying Pigeon Classic",
    category: "City",
    pricePerDay: 200,
    image: "images/cycle_city.jpg",
    specs: ["Vintage Steel Frame", "Comfort Saddle", "Cargo Rack"],
    tag: "Classic",
    description: "Timeless vintage urban cruiser with relaxed geometry for easy city commutes."
  },
  {
    id: "bike-5",
    name: "Orbea Occam Enduro",
    category: "Mountain",
    pricePerDay: 450,
    image: "images/cycle_enduro.jpg",
    specs: ["Fox 36 Suspension", "12-Speed Eagle", "Dropper Post"],
    tag: "Pro-Trail",
    description: "Competition-grade full suspension mountain bike for aggressive descents."
  },
  {
    id: "bike-6",
    name: "UrbanGlide Step-Through",
    category: "City",
    pricePerDay: 250,
    image: "images/cycle_urban.jpg",
    specs: ["Step-Through Frame", "Shimano 7-Speed", "Mudguards"],
    tag: "Everyday",
    description: "Comfortable ergonomic cruiser with front basket, perfect for errands."
  },
  {
    id: "bike-7",
    name: "Arctic Explorer Fatbike",
    category: "All-Terrain",
    pricePerDay: 380,
    image: "images/cycle_fatbike.jpg",
    specs: ["4.0\" Fat Tires", "Mechanical Discs", "Reinforced Fork"],
    tag: "All-Weather",
    description: "Ultra-wide grip tires engineered to conquer snow, sand, and rough terrain."
  }
];

// Initial Seed Bookings (displayed in Admin Dashboard)
let memoryBookings = [
  {
    _id: "book-001",
    userName: "Alex Rider",
    userEmail: "rider@cyclego.com",
    cycleId: "bike-1",
    cycleName: "Aurora Volt Commuter",
    category: "Electric",
    cycleImage: "images/cycle_hero.jpg",
    days: 3,
    pricePerDay: 500,
    totalCost: 1500,
    bookingDate: new Date(Date.now() - 86400000 * 2),
    status: "Active"
  },
  {
    _id: "book-002",
    userName: "Michael Chen",
    userEmail: "mchen@example.com",
    cycleId: "bike-5",
    cycleName: "Orbea Occam Enduro",
    category: "Mountain",
    cycleImage: "images/cycle_enduro.jpg",
    days: 2,
    pricePerDay: 450,
    totalCost: 900,
    bookingDate: new Date(Date.now() - 86400000),
    status: "Confirmed"
  },
  {
    _id: "book-003",
    userName: "Priya Sharma",
    userEmail: "priya@example.com",
    cycleId: "bike-4",
    cycleName: "Flying Pigeon Classic",
    category: "City",
    cycleImage: "images/cycle_city.jpg",
    days: 4,
    pricePerDay: 200,
    totalCost: 800,
    bookingDate: new Date(Date.now() - 86400000 * 3),
    status: "Returned"
  }
];

async function seedData() {
  try {
    for (const u of DEMO_USERS) {
      const exists = await User.findOne({ email: u.email });
      if (!exists) await User.create(u);
    }
    const count = await Booking.countDocuments();
    if (count === 0) {
      await Booking.insertMany(memoryBookings);
    }
  } catch (e) {
    console.error("Seed error:", e.message);
  }
}

// REST APIs

// 1. Health & DB Status
app.get('/api/status', (req, res) => {
  res.json({
    status: "online",
    mongoConnected: isMongoConnected,
    mode: isMongoConnected ? "MongoDB Atlas Cloud" : "Resilient Store"
  });
});

// 2. Demo Users List (for login page dropdown)
app.get('/api/demo-users', (req, res) => {
  res.json({ success: true, users: DEMO_USERS });
});

// 3. Existing User Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Enter email & password" });
  }

  if (isMongoConnected) {
    try {
      const user = await User.findOne({ email, password });
      if (user) {
        return res.json({
          success: true,
          user: { name: user.name, email: user.email, phone: user.phone, role: user.role, avatar: user.avatar }
        });
      }
    } catch (e) {
      console.error("DB Login error:", e.message);
    }
  }

  // Fallback demo users check
  const matched = DEMO_USERS.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
  if (matched) {
    return res.json({
      success: true,
      user: { name: matched.name, email: matched.email, phone: matched.phone, role: matched.role, avatar: matched.avatar }
    });
  }

  return res.status(401).json({ success: false, message: "Invalid credentials. Use demo credentials." });
});

// 4. New User Quick Login / Registration (Name, Phone, Optional Email)
app.post('/api/auth/quick-login', async (req, res) => {
  const { name, phone, email } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: "Please enter your full name." });
  }
  if (!phone || !phone.trim()) {
    return res.status(400).json({ success: false, message: "Please enter your phone number." });
  }

  const cleanName = name.trim();
  const cleanPhone = phone.trim();
  const cleanEmail = (email && email.trim()) ? email.trim() : `${cleanPhone}@cyclego.user`;

  const userData = {
    name: cleanName,
    phone: cleanPhone,
    email: cleanEmail,
    role: "Customer",
    avatar: "🚴",
    password: "user123"
  };

  if (isMongoConnected) {
    try {
      let user = await User.findOne({ $or: [{ phone: cleanPhone }, { email: cleanEmail }] });
      if (!user) {
        user = await User.create(userData);
      }
      return res.json({
        success: true,
        user: { name: user.name, email: user.email, phone: user.phone, role: user.role, avatar: user.avatar }
      });
    } catch (e) {
      console.error("[Quick Login] DB Error:", e.message);
    }
  }

  // Resilient memory fallback
  res.json({ success: true, user: userData });
});

// 5. Bicycle Fleet (annotated with live Active booking status)
app.get('/api/bicycles', async (req, res) => {
  let activeBookings = [];

  if (isMongoConnected) {
    try {
      activeBookings = await Booking.find({ status: 'Active' });
    } catch (e) {
      console.error("[Fleet] DB active query error:", e.message);
      activeBookings = memoryBookings.filter(b => b.status === 'Active');
    }
  } else {
    activeBookings = memoryBookings.filter(b => b.status === 'Active');
  }

  // Map each cycle with its live availability status
  const liveFleet = BICYCLE_FLEET.map(bike => {
    const active = activeBookings.find(b => b.cycleId === bike.id);
    if (active) {
      return {
        ...bike,
        isBooked: true,
        bookingStatus: 'Active',
        bookedBy: active.userName,
        bookedUserEmail: active.userEmail,
        bookedUserPhone: active.userPhone
      };
    }
    return {
      ...bike,
      isBooked: false,
      bookingStatus: 'Available'
    };
  });

  res.json({ success: true, fleet: liveFleet });
});

// 6. Customer: Create Booking
app.post('/api/bookings', async (req, res) => {
  const { userName, userEmail, userPhone, cycleId, cycleName, category, cycleImage, days, pricePerDay } = req.body;
  const daysNum = parseInt(days, 10) || 1;
  const rate = parseFloat(pricePerDay) || 300;
  const totalCost = daysNum * rate;

  // Check if cycle is already marked Active by admin (prevent conflict)
  if (isMongoConnected) {
    try {
      const active = await Booking.findOne({ cycleId, status: 'Active' });
      if (active) {
        return res.status(400).json({ success: false, message: `This cycle is currently booked by another user (${active.userName}) and is in active use.` });
      }
    } catch (e) {
      console.error("[Booking] Active check error:", e.message);
    }
  } else {
    const active = memoryBookings.find(b => b.cycleId === cycleId && b.status === 'Active');
    if (active) {
      return res.status(400).json({ success: false, message: `This cycle is currently booked by another user (${active.userName}).` });
    }
  }

  const item = {
    _id: "book-" + Date.now(),
    userName: userName || "Guest Rider",
    userEmail: userEmail || "guest@cyclego.com",
    userPhone: userPhone || "",
    cycleId: cycleId || "bike-1",
    cycleName: cycleName || "Bicycle",
    category: category || "Standard",
    cycleImage: cycleImage || "images/cycle_hero.jpg",
    days: daysNum,
    pricePerDay: rate,
    totalCost,
    bookingDate: new Date(),
    status: "Confirmed"
  };

  if (isMongoConnected) {
    try {
      const saved = await Booking.create(item);
      memoryBookings.unshift(item);
      return res.json({ success: true, booking: saved });
    } catch (e) {
      console.error("DB Save failed:", e.message);
    }
  }

  memoryBookings.unshift(item);
  res.json({ success: true, booking: item });
});

// 7. Customer: Get Own Bookings
app.get('/api/bookings', async (req, res) => {
  const { email, phone, name } = req.query;

  if (isMongoConnected) {
    try {
      const conditions = [];
      if (email) conditions.push({ userEmail: email });
      if (phone) conditions.push({ userPhone: phone });
      if (name) conditions.push({ userName: name });

      const query = conditions.length > 0 ? { $or: conditions } : {};
      const docs = await Booking.find(query).sort({ bookingDate: -1 });
      return res.json({ success: true, bookings: docs });
    } catch (e) {
      console.error("DB Fetch error:", e.message);
    }
  }

  const filtered = memoryBookings.filter(b => {
    if (!email && !phone && !name) return true;
    return (email && b.userEmail && b.userEmail.toLowerCase() === email.toLowerCase()) ||
           (phone && b.userPhone === phone) ||
           (name && b.userName && b.userName.toLowerCase() === name.toLowerCase());
  });
  res.json({ success: true, bookings: filtered });
});

// 8. Admin: Get All Booked Cycles & Summary Metrics
app.get('/api/admin/bookings', async (req, res) => {
  let list = memoryBookings;
  if (isMongoConnected) {
    try {
      list = await Booking.find().sort({ bookingDate: -1 });
    } catch (e) {
      console.error("DB Admin fetch error:", e.message);
    }
  }

  const totalBookings = list.length;
  const totalRevenue = list.reduce((sum, b) => sum + (b.totalCost || 0), 0);
  const activeRentals = list.filter(b => b.status === 'Active' || b.status === 'Confirmed').length;
  const returnedRentals = list.filter(b => b.status === 'Returned').length;

  res.json({
    success: true,
    metrics: { totalBookings, totalRevenue, activeRentals, returnedRentals },
    bookings: list
  });
});

// 9. Admin: Update Booking Status (e.g. Active, Returned)
app.patch('/api/admin/bookings/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  let updated = null;
  if (isMongoConnected) {
    try {
      updated = await Booking.findByIdAndUpdate(id, { status }, { returnDocument: 'after' });
    } catch (e) {
      console.error("DB Update error:", e.message);
    }
  }

  const found = memoryBookings.find(b => String(b._id) === String(id));
  if (found) found.status = status;

  if (updated || found) {
    return res.json({ success: true, booking: updated || found });
  }

  res.status(404).json({ success: false, message: "Booking not found" });
});

// Default Route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`[CycleGo Server] Live at http://localhost:${PORT}`);
});
