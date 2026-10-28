/**
 * ==============================================================================
 * CYCLEGO - BACKEND SERVER
 * File: server.js
 * Technology: Node.js, Express, MongoDB Atlas (Mongoose)
 * Description: Clean, simplified server managing authentication, dynamic fleet,
 *              live active status, and resilient data storage.
 * ==============================================================================
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dns = require('dns');

// 1. Google Public DNS for Windows SRV Resolution
try { dns.setServers(['8.8.8.8', '8.8.4.4']); } catch (e) {}

const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// 2. Database Connection
const MONGO_URI = "mongodb+srv://suganthpiranav_db_user:GvYIGxiiUMaGK4tP@cluster0.7nqmue5.mongodb.net/cyclego_db?retryWrites=true&w=majority";
let isMongoConnected = false;

mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 })
  .then(() => {
    isMongoConnected = true;
    console.log("[MongoDB] Connected successfully to Atlas!");
    seedData();
  })
  .catch(err => console.warn("[MongoDB] Atlas unavailable, running in resilient mode:", err.message));

// 3. Data Models
const User = mongoose.model('User', new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, default: "" },
  email: { type: String, default: "" },
  password: { type: String, default: "user123" },
  role: { type: String, enum: ['Customer', 'Admin'], default: 'Customer' },
  avatar: { type: String, default: '🚴' }
}));

const Booking = mongoose.model('Booking', new mongoose.Schema({
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
}));

// 4. Seed Data & In-Memory Fallback Store
const DEMO_USERS = [
  { name: "Alex Rider", email: "rider@cyclego.com", password: "user123", role: "Customer", avatar: "🚴", phone: "9876543210" },
  { name: "Sarah Admin", email: "admin@cyclego.com", password: "admin123", role: "Admin", avatar: "👑", phone: "9876543211" },
  { name: "Maya Patel", email: "maya@cyclego.com", password: "user123", role: "Customer", avatar: "🚴", phone: "9876543212" },
  { name: "Vikram Singh", email: "vikram@cyclego.com", password: "user123", role: "Customer", avatar: "🚵", phone: "9876543213" },
  { name: "Priya Sharma", email: "priya@cyclego.com", password: "user123", role: "Customer", avatar: "🚴", phone: "9876543214" }
];

const BICYCLE_FLEET = [
  { id: "bike-1", name: "Aurora Volt Commuter", category: "Electric", pricePerDay: 500, image: "images/cycle_hero.jpg", specs: ["250W Motor", "45km Range", "Hydraulic Discs"], tag: "Popular", description: "Eco-friendly, pedal-assist smart electric bicycle with aerodynamic alloy frame." },
  { id: "bike-2", name: "TrailBlazer Pro 29", category: "Mountain", pricePerDay: 320, image: "images/cycle_mountain.jpg", specs: ["29\" Wheels", "21-Speed Shimano", "Front Suspension"], tag: "Off-Road", description: "Rugged terrain explorer built for trail riding, climbs, and gravel terrain." },
  { id: "bike-3", name: "Speedster Veloce S-Works", category: "Road", pricePerDay: 400, image: "images/cycle_road.jpg", specs: ["Carbon-Alloy", "16-Speed Drop Bar", "Aero Wheels"], tag: "Speed", description: "Ultra-lightweight sprint bicycle crafted for high-speed endurance cycling." },
  { id: "bike-4", name: "Flying Pigeon Classic", category: "City", pricePerDay: 200, image: "images/cycle_city.jpg", specs: ["Vintage Steel Frame", "Comfort Saddle", "Cargo Rack"], tag: "Classic", description: "Timeless vintage urban cruiser with relaxed geometry for easy city commutes." },
  { id: "bike-5", name: "Orbea Occam Enduro", category: "Mountain", pricePerDay: 450, image: "images/cycle_enduro.jpg", specs: ["Fox 36 Suspension", "12-Speed Eagle", "Dropper Post"], tag: "Pro-Trail", description: "Competition-grade full suspension mountain bike for aggressive descents." },
  { id: "bike-6", name: "UrbanGlide Step-Through", category: "City", pricePerDay: 250, image: "images/cycle_urban.jpg", specs: ["Step-Through Frame", "Shimano 7-Speed", "Mudguards"], tag: "Everyday", description: "Comfortable ergonomic cruiser with front basket, perfect for errands." },
  { id: "bike-7", name: "Arctic Explorer Fatbike", category: "All-Terrain", pricePerDay: 380, image: "images/cycle_fatbike.jpg", specs: ["4.0\" Fat Tires", "Mechanical Discs", "Reinforced Fork"], tag: "All-Weather", description: "Ultra-wide grip tires engineered to conquer snow, sand, and rough terrain." }
];

let memoryBookings = [
  { _id: "book-001", userName: "Alex Rider", userEmail: "rider@cyclego.com", userPhone: "9876543210", cycleId: "bike-1", cycleName: "Aurora Volt Commuter", category: "Electric", cycleImage: "images/cycle_hero.jpg", days: 3, pricePerDay: 500, totalCost: 1500, bookingDate: new Date(Date.now() - 172800000), status: "Active" },
  { _id: "book-002", userName: "Michael Chen", userEmail: "mchen@example.com", userPhone: "9876543299", cycleId: "bike-5", cycleName: "Orbea Occam Enduro", category: "Mountain", cycleImage: "images/cycle_enduro.jpg", days: 2, pricePerDay: 450, totalCost: 900, bookingDate: new Date(Date.now() - 86400000), status: "Confirmed" },
  { _id: "book-003", userName: "Priya Sharma", userEmail: "priya@example.com", userPhone: "9876543214", cycleId: "bike-4", cycleName: "Flying Pigeon Classic", category: "City", cycleImage: "images/cycle_city.jpg", days: 4, pricePerDay: 200, totalCost: 800, bookingDate: new Date(Date.now() - 259200000), status: "Returned" }
];

async function seedData() {
  try {
    for (const u of DEMO_USERS) {
      if (!await User.findOne({ email: u.email })) await User.create(u);
    }
    if (await Booking.countDocuments() === 0) await Booking.insertMany(memoryBookings);
  } catch (e) { console.error("[Seed] Error:", e.message); }
}

// 5. REST APIs

// Health & Demo Accounts
app.get('/api/status', (req, res) => res.json({ status: "online", mongoConnected: isMongoConnected, mode: isMongoConnected ? "MongoDB Atlas Cloud" : "Resilient Store" }));
app.get('/api/demo-users', (req, res) => res.json({ success: true, users: DEMO_USERS }));

// Existing User Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ success: false, message: "Enter email & password" });

  let user = null;
  if (isMongoConnected) {
    try { user = await User.findOne({ email, password }); } catch (e) {}
  }
  if (!user) {
    user = DEMO_USERS.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
  }
  if (user) {
    return res.json({ success: true, user: { name: user.name, email: user.email, phone: user.phone || "", role: user.role, avatar: user.avatar || "🚴" } });
  }
  res.status(401).json({ success: false, message: "Invalid credentials. Use demo credentials." });
});

// Quick Sign-In for New Users (Name, Phone, Optional Email)
app.post('/api/auth/quick-login', async (req, res) => {
  const { name, phone, email } = req.body;
  if (!name?.trim() || !phone?.trim()) {
    return res.status(400).json({ success: false, message: "Name and phone are required." });
  }
  const cleanPhone = phone.trim();
  const cleanEmail = email?.trim() || `${cleanPhone}@cyclego.user`;
  const userData = { name: name.trim(), phone: cleanPhone, email: cleanEmail, role: "Customer", avatar: "🚴", password: "user123" };

  if (isMongoConnected) {
    try {
      let user = await User.findOne({ $or: [{ phone: cleanPhone }, { email: cleanEmail }] });
      if (!user) user = await User.create(userData);
      return res.json({ success: true, user: { name: user.name, email: user.email, phone: user.phone, role: user.role, avatar: user.avatar } });
    } catch (e) { console.error("[Quick Login] DB Error:", e.message); }
  }
  res.json({ success: true, user: userData });
});

// Live Fleet with Active Status Annotations ("Booked by another user")
app.get('/api/bicycles', async (req, res) => {
  let activeBookings = memoryBookings.filter(b => b.status === 'Active');
  if (isMongoConnected) {
    try { activeBookings = await Booking.find({ status: 'Active' }); } catch (e) {}
  }

  const liveFleet = BICYCLE_FLEET.map(bike => {
    const active = activeBookings.find(b => b.cycleId === bike.id);
    return active
      ? { ...bike, isBooked: true, bookingStatus: 'Active', bookedBy: active.userName, bookedUserEmail: active.userEmail, bookedUserPhone: active.userPhone }
      : { ...bike, isBooked: false, bookingStatus: 'Available' };
  });
  res.json({ success: true, fleet: liveFleet });
});

// Create Booking with Active Conflict Check
app.post('/api/bookings', async (req, res) => {
  const { userName, userEmail, userPhone, cycleId, cycleName, category, cycleImage, days, pricePerDay } = req.body;
  const daysNum = parseInt(days, 10) || 1;
  const rate = parseFloat(pricePerDay) || 300;

  // Conflict Check: Prevent booking if already active
  let active = memoryBookings.find(b => b.cycleId === cycleId && b.status === 'Active');
  if (isMongoConnected) {
    try { active = await Booking.findOne({ cycleId, status: 'Active' }); } catch (e) {}
  }
  if (active) {
    return res.status(400).json({ success: false, message: `This cycle is currently booked by ${active.userName} and is in active use.` });
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
    totalCost: daysNum * rate,
    bookingDate: new Date(),
    status: "Confirmed"
  };

  if (isMongoConnected) {
    try {
      const saved = await Booking.create(item);
      memoryBookings.unshift(item);
      return res.json({ success: true, booking: saved });
    } catch (e) { console.error("[Booking] Save error:", e.message); }
  }
  memoryBookings.unshift(item);
  res.json({ success: true, booking: item });
});

// Customer Bookings List
app.get('/api/bookings', async (req, res) => {
  const { email, phone, name } = req.query;
  if (isMongoConnected) {
    try {
      const or = [];
      if (email) or.push({ userEmail: email });
      if (phone) or.push({ userPhone: phone });
      if (name) or.push({ userName: name });
      const docs = await Booking.find(or.length ? { $or: or } : {}).sort({ bookingDate: -1 });
      return res.json({ success: true, bookings: docs });
    } catch (e) {}
  }

  const filtered = memoryBookings.filter(b => {
    if (!email && !phone && !name) return true;
    return (email && b.userEmail?.toLowerCase() === email.toLowerCase()) ||
           (phone && b.userPhone === phone) ||
           (name && b.userName?.toLowerCase() === name.toLowerCase());
  });
  res.json({ success: true, bookings: filtered });
});

// Admin Bookings & Metrics
app.get('/api/admin/bookings', async (req, res) => {
  let list = memoryBookings;
  if (isMongoConnected) {
    try { list = await Booking.find().sort({ bookingDate: -1 }); } catch (e) {}
  }
  const totalBookings = list.length;
  const totalRevenue = list.reduce((sum, b) => sum + (b.totalCost || 0), 0);
  const activeRentals = list.filter(b => b.status === 'Active' || b.status === 'Confirmed').length;
  const returnedRentals = list.filter(b => b.status === 'Returned').length;

  res.json({ success: true, metrics: { totalBookings, totalRevenue, activeRentals, returnedRentals }, bookings: list });
});

// Admin Status Update (Active, Returned, Confirmed)
app.patch('/api/admin/bookings/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  let updated = null;

  if (isMongoConnected) {
    try { updated = await Booking.findByIdAndUpdate(id, { status }, { returnDocument: 'after' }); } catch (e) {}
  }
  const found = memoryBookings.find(b => String(b._id) === String(id));
  if (found) found.status = status;

  if (updated || found) return res.json({ success: true, booking: updated || found });
  res.status(404).json({ success: false, message: "Booking not found" });
});

// Default Route & Start Server
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));

app.listen(PORT, () => console.log(`[CycleGo Server] Live at http://localhost:${PORT}`));
