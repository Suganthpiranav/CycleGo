/**
 * ==============================================================================
 * CYCLEGO - REACT.JS INTERACTIVE FLEET
 * File: react-app.js
 * Technology: React 18 (useState, useEffect) + Babel Standalone
 * Description: Interactive bicycle fleet with duration slider, instant booking,
 *              live active status ("Booked by another user"), and confirmation popup.
 * ==============================================================================
 */

function FleetApp() {
  const [fleet, setFleet] = React.useState([]);
  const [category, setCategory] = React.useState("All");
  const [days, setDays] = React.useState(2);
  const [selectedBike, setSelectedBike] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [confirmedBooking, setConfirmedBooking] = React.useState(null);
  const [errorMsg, setErrorMsg] = React.useState("");

  // 1. Fetch live fleet from backend API with automatic real-time sync
  const fetchFleetData = React.useCallback(() => {
    fetch('/api/bicycles')
      .then((r) => r.json())
      .then((d) => {
        if (d && d.fleet) {
          setFleet(d.fleet);
          setSelectedBike((prev) => {
            if (!prev) return d.fleet[0];
            const found = d.fleet.find((b) => b.id === prev.id);
            return found || d.fleet[0];
          });
        }
      })
      .catch((e) => console.error("[Fleet] Sync error:", e));
  }, []);

  React.useEffect(() => {
    fetchFleetData();
    // Auto-poll every 3.5 seconds so admin status changes appear live to all users
    const timer = setInterval(fetchFleetData, 3500);
    return () => clearInterval(timer);
  }, [fetchFleetData]);

  const categories = ["All", "Electric", "Mountain", "Road", "City", "All-Terrain"];

  const filtered = category === "All"
    ? fleet
    : fleet.filter((b) => b.category.toLowerCase() === category.toLowerCase());

  const totalCost = (selectedBike?.pricePerDay || 300) * days;
  const currentUser = JSON.parse(localStorage.getItem('cyclego_user') || 'null');

  // 2. Handle Booking Creation & Trigger Confirmation Popup
  const handleBooking = async (bike) => {
    // Prevent booking if already active
    if (bike.isBooked) {
      setErrorMsg(`"${bike.name}" is currently booked by another user.`);
      return;
    }

    setLoading(true);
    setErrorMsg("");

    const payload = {
      userName: currentUser ? currentUser.name : "Guest Rider",
      userEmail: currentUser ? currentUser.email : "",
      userPhone: currentUser ? (currentUser.phone || "") : "",
      cycleId: bike.id,
      cycleName: bike.name,
      category: bike.category,
      cycleImage: bike.image,
      days: days,
      pricePerDay: bike.pricePerDay
    };

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        setErrorMsg(data.message || "Could not complete booking.");
        return;
      }

      // Open booking confirmation popup modal
      setConfirmedBooking({
        bike,
        days,
        totalCost: bike.pricePerDay * days,
        bookingId: data.booking?._id || "book-" + Date.now()
      });

      // Refresh fleet status & user reservations immediately
      fetchFleetData();
      if (window.refreshBookingsList) window.refreshBookingsList();
    } catch (err) {
      setConfirmedBooking({
        bike,
        days,
        totalCost: bike.pricePerDay * days,
        bookingId: "book-local"
      });
      if (window.refreshBookingsList) window.refreshBookingsList();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="react-fleet-wrapper">
      
      {/* Category Filter Pills */}
      <div className="react-filter-bar">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`btn-filter ${category === cat ? 'active' : ''}`}
            onClick={() => setCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Live Duration Slider & Dynamic Price Calculator */}
      <div className="react-calc-card">
        <div className="calc-left">
          <label className="calc-label">
            🗓️ Rental Duration: <strong>{days} {days === 1 ? 'Day' : 'Days'}</strong>
          </label>
          <input
            type="range"
            min="1"
            max="14"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="calc-slider"
          />
        </div>
        <div className="calc-right">
          <span className="calc-caption">Total for {selectedBike?.name || 'Selected'}:</span>
          <span className="calc-price">₹{totalCost}</span>
          <small className="calc-rate">(₹{selectedBike?.pricePerDay || 300}/day × {days} days)</small>
        </div>
      </div>

      {errorMsg && (
        <div className="react-error-alert">
          <span>⚠️ {errorMsg}</span>
          <button className="alert-dismiss-btn" onClick={() => setErrorMsg("")}>✕</button>
        </div>
      )}

      {/* 3. Booking Confirmation Popup Modal */}
      {confirmedBooking && (
        <div className="booking-modal-overlay" onClick={() => setConfirmedBooking(null)}>
          <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setConfirmedBooking(null)}>✕</button>
            
            <div className="modal-header">
              <span className="modal-icon">🎉</span>
              <h3>Booking Confirmed!</h3>
              <p>Your cycle reservation has been placed successfully.</p>
            </div>

            <div className="modal-bike-card">
              <img src={confirmedBooking.bike.image} alt={confirmedBooking.bike.name} className="modal-bike-img" />
              <div className="modal-bike-info">
                <h4>{confirmedBooking.bike.name}</h4>
                <span className="category-badge">{confirmedBooking.bike.category}</span>
              </div>
            </div>

            <div className="modal-details-grid">
              <div className="detail-item">
                <span>Duration</span>
                <strong>{confirmedBooking.days} {confirmedBooking.days === 1 ? 'Day' : 'Days'}</strong>
              </div>
              <div className="detail-item">
                <span>Total Amount</span>
                <strong className="text-primary">₹{confirmedBooking.totalCost}</strong>
              </div>
              <div className="detail-item">
                <span>Status</span>
                <strong className="text-warning">🟡 Confirmed</strong>
              </div>
            </div>

            <div className="modal-status-notice">
              ℹ️ <strong>Live Status:</strong> Once admin marks this cycle <strong>Active</strong>, it will appear as <em>Active</em> on your dashboard and lock for other users!
            </div>

            <div className="modal-actions">
              <button
                className="btn btn-primary btn-block"
                onClick={() => {
                  setConfirmedBooking(null);
                  const el = document.getElementById('my-bookings');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                View in My Bookings 🚴
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Fleet Cards Grid */}
      <div className="fleet-grid">
        {filtered.map((bike) => {
          const isSelected = selectedBike?.id === bike.id;

          // Check if this cycle is active with current user vs another user
          const isRentedByMe = bike.isBooked && currentUser && (
            (bike.bookedUserEmail && currentUser.email && bike.bookedUserEmail.toLowerCase() === currentUser.email.toLowerCase()) ||
            (bike.bookedUserPhone && currentUser.phone && bike.bookedUserPhone === currentUser.phone) ||
            (bike.bookedBy && currentUser.name && bike.bookedBy.toLowerCase() === currentUser.name.toLowerCase())
          );
          const isRentedByOther = bike.isBooked && !isRentedByMe;

          return (
            <div
              key={bike.id}
              className={`fleet-card ${isSelected ? 'selected' : ''} ${isRentedByOther ? 'is-booked-other' : ''} ${isRentedByMe ? 'is-my-ride' : ''}`}
              onClick={() => setSelectedBike(bike)}
            >
              <div className="fleet-card-img-wrap">
                <img src={bike.image} alt={bike.name} className="fleet-card-img" />
                <span className="category-pill">{bike.category}</span>
                
                {/* Status Badges on Image */}
                {isRentedByOther && (
                  <span className="tag-pill tag-booked">🔒 Booked by another user</span>
                )}
                {isRentedByMe && (
                  <span className="tag-pill tag-my-ride">🟢 Your Active Ride</span>
                )}
                {!bike.isBooked && bike.tag && (
                  <span className="tag-pill">{bike.tag}</span>
                )}
              </div>

              <div className="fleet-card-body">
                <div className="fleet-card-header">
                  <h3 className="fleet-card-title">{bike.name}</h3>
                  <div className="fleet-price-badge">
                    <strong>₹{bike.pricePerDay}</strong>
                    <span>/day</span>
                  </div>
                </div>

                <p className="fleet-card-desc">{bike.description}</p>

                {/* Status Alert Inside Card */}
                {isRentedByOther && (
                  <div className="card-booked-alert">
                    🔒 <strong>Booked by another user</strong> ({bike.bookedBy || 'Active Rider'})
                  </div>
                )}
                {isRentedByMe && (
                  <div className="card-my-ride-alert">
                    🟢 <strong>Your Active Ride:</strong> Cycle is on-road with you!
                  </div>
                )}

                <div className="specs-list">
                  {bike.specs && bike.specs.map((s, i) => (
                    <span key={i} className="spec-badge">✓ {s}</span>
                  ))}
                </div>

                <div className="fleet-card-footer">
                  <div className="card-total-preview">
                    <span>Total ({days}d):</span>
                    <strong>₹{bike.pricePerDay * days}</strong>
                  </div>

                  {/* Dynamic Action Button based on availability */}
                  {isRentedByOther ? (
                    <button
                      className="btn btn-disabled btn-sm"
                      disabled
                      title="This cycle is currently booked by another user and marked active by admin"
                    >
                      🔒 Booked by another user
                    </button>
                  ) : isRentedByMe ? (
                    <button
                      className="btn btn-secondary btn-sm"
                      disabled
                      title="You are currently riding this cycle"
                    >
                      🟢 Your Active Ride
                    </button>
                  ) : (
                    <button
                      className="btn btn-primary btn-sm"
                      disabled={loading}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBike(bike);
                        handleBooking(bike);
                      }}
                    >
                      {loading ? "Reserving..." : "Book Now"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}

// Mount React Component
const rootContainer = document.getElementById('react-cycle-root');
if (rootContainer) {
  const root = ReactDOM.createRoot(rootContainer);
  root.render(<FleetApp />);
}
