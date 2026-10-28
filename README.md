# 🚲 CycleGo – Smart Bicycle Rental Platform

CycleGo is a modern, responsive, full-stack bicycle rental web application built with **Node.js**, **Express**, **MongoDB Atlas (Mongoose)**, **React 18**, and clean **Vanilla CSS**.

---

## ✨ Features

- **🔑 Multi-Role Authentication & Quick Access**:
  - Demo accounts dropdown with 1-click login for Customers and Fleet Administrators.
  - **New User Fast Sign-In**: Anyone can register and ride instantly with just Name & Phone Number (Email optional).
- **🚴 Interactive Fleet Catalog**:
  - Filter bicycles by category (*Electric, Mountain, Road, City, All-Terrain*).
  - Live rental duration slider with dynamic pricing calculator.
  - Animated booking confirmation popup modal.
- **🔒 Real-Time Cycle Availability & Locking**:
  - When an admin marks any bicycle as **Active**, other users instantly see `🔒 Booked by another user` and the booking button is disabled.
  - Conflict protection prevents double-booking of any active cycle.
- **🟢 Active Ride Tracking for Riders**:
  - Riders see their active cycle status updated live to `🟢 Cycle is Active`.
  - Prominent alert banner notifies the rider that their ride is in progress.
- **👑 Fleet Admin Dashboard**:
  - Summary KPI cards (*Total Bookings, Active On-Road, Revenue, Returned*).
  - Search and filter by rider name, cycle, or email.
  - One-click status management (*Mark Active*, *Set Confirmed*, *Mark Returned*).
- **☁️ Cloud & Resilient Storage**:
  - Direct connection to **MongoDB Atlas** for persistent storage of users and reservations.
  - Automatic fallback to resilient in-memory store in case of offline network conditions.

---

## 🛠️ Tech Stack

- **Frontend**: HTML5, Vanilla CSS3 (Custom Design System, Emerald Palette), React 18, Babel Standalone
- **Backend**: Node.js, Express 5, CORS
- **Database**: MongoDB Atlas with Mongoose ORM
- **Network**: Custom Google Public DNS resolver configuration for Windows SRV compatibility

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- npm

### 2. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/Suganthpiranav/CycleGo.git
cd CycleGo
npm install
```

### 3. Start the Application
```bash
npm start
```
The server will start at **http://localhost:5000**.

---

## 👥 Demo Accounts

| Role | Email | Password | Access / Destination |
| :--- | :--- | :--- | :--- |
| **Alex Rider** (Customer) | `rider@cyclego.com` | `user123` | Bicycle Catalog (`index.html`) |
| **Sarah Admin** (Fleet Admin) | `admin@cyclego.com` | `admin123` | Fleet Operations Dashboard (`admin.html`) |
| **Maya Patel** (Customer) | `maya@cyclego.com` | `user123` | Bicycle Catalog (`index.html`) |
| **Vikram Singh** (Customer) | `vikram@cyclego.com` | `user123` | Bicycle Catalog (`index.html`) |
| **Priya Sharma** (Customer) | `priya@cyclego.com` | `user123` | Bicycle Catalog (`index.html`) |

---

## 📄 License
This project is open-source under the [ISC License](LICENSE).
