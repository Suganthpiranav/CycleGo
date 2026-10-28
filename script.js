/**
 * ==============================================================================
 * CYCLEGO - CLIENT CONTROLLER
 * File: script.js
 * Technology: Modern JavaScript (ES6+)
 * Description: Client-side session management, real-time booking status syncing,
 *              and prominent display when a cycle is marked "Active" by admin.
 * ==============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    initSession();
    fetchUserBookings();
    
    // Auto-poll every 3.5 seconds so admin status changes (e.g. Active) appear live
    setInterval(fetchUserBookings, 3500);
});

// 1. Session Setup & Header Profile Display
function initSession() {
    const user = JSON.parse(localStorage.getItem('cyclego_user') || 'null');
    const chip = document.getElementById('userProfileChip');
    const loginBtn = document.getElementById('loginNavBtn');
    const nameDisplay = document.getElementById('userNameDisplay');
    const avatar = document.getElementById('userAvatar');

    if (user && chip && loginBtn) {
        chip.classList.remove('hidden');
        loginBtn.classList.add('hidden');
        nameDisplay.textContent = user.name;
        if (user.avatar) avatar.textContent = user.avatar;
    }
}

// 2. Sign Out Handler
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('cyclego_user');
        window.location.href = "login.html";
    });
}

// 3. Fetch User Bookings & Show "Cycle is Active" Live Status
async function fetchUserBookings() {
    const tbody = document.getElementById('bookingsTableBody');
    if (!tbody) return;

    const user = JSON.parse(localStorage.getItem('cyclego_user') || 'null');
    
    // Build query params based on user's email, phone, or name
    const params = new URLSearchParams();
    if (user) {
        if (user.email) params.append('email', user.email);
        if (user.phone) params.append('phone', user.phone);
        if (user.name) params.append('name', user.name);
    }
    const queryStr = params.toString() ? '?' + params.toString() : '';

    try {
        const res = await fetch('/api/bookings' + queryStr);
        const data = await res.json();
        const list = (data.success && data.bookings) ? data.bookings : [];

        // Check if ANY booked cycle is marked "Active" by Admin
        const activeRide = list.find(b => b.status === 'Active');
        renderActiveBanner(activeRide);

        if (list.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">
                        No reservations recorded yet. Browse the fleet above to book your cycle!
                    </td>
                </tr>`;
            return;
        }

        // Render Bookings Table
        tbody.innerHTML = list.map(b => `
            <tr class="${b.status === 'Active' ? 'row-active-ride' : ''}">
                <td><strong>${escapeHTML(b.userName)}</strong></td>
                <td><strong>${escapeHTML(b.cycleName)}</strong></td>
                <td><span class="category-badge">${escapeHTML(b.category)}</span></td>
                <td>${b.days} ${b.days === 1 ? 'Day' : 'Days'}</td>
                <td><strong style="color: var(--primary-accent);">₹${b.totalCost}</strong></td>
                <td>${renderStatusBadge(b.status)}</td>
            </tr>
        `).join('');
    } catch (e) {
        console.error("Bookings sync error:", e);
    }
}

// 4. Render Active Ride Banner if Admin marked cycle as "Active"
function renderActiveBanner(activeRide) {
    let banner = document.getElementById('activeRentalBanner');
    const section = document.getElementById('my-bookings');
    const tableWrapper = document.querySelector('.bookings-table-wrapper');

    if (activeRide) {
        if (!banner && tableWrapper && tableWrapper.parentNode) {
            banner = document.createElement('div');
            banner.id = 'activeRentalBanner';
            banner.className = 'active-rental-banner';
            tableWrapper.parentNode.insertBefore(banner, tableWrapper);
        }
        if (banner) {
            banner.innerHTML = `
                <div class="banner-pulse-dot"></div>
                <div class="banner-content">
                    <h4>🟢 Cycle is Active!</h4>
                    <p>Your reserved bicycle <strong>${escapeHTML(activeRide.cycleName)}</strong> was marked <strong>Active</strong> by admin. Your ride is currently in progress!</p>
                </div>
            `;
            banner.classList.remove('hidden');
        }
    } else if (banner) {
        banner.classList.add('hidden');
    }
}

// 5. Render Distinct Status Badge
function renderStatusBadge(status) {
    if (status === 'Active') {
        return `<span class="status-badge status-active"><span class="pulse-dot active-dot"></span> Cycle is Active</span>`;
    } else if (status === 'Confirmed') {
        return `<span class="status-badge status-confirmed">🟡 Confirmed</span>`;
    } else if (status === 'Returned') {
        return `<span class="status-badge status-returned">🏁 Returned</span>`;
    }
    return `<span class="status-badge">${escapeHTML(status)}</span>`;
}

// Expose refresh hook for React component
window.refreshBookingsList = fetchUserBookings;

// Helper to escape HTML safely
function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));
}
