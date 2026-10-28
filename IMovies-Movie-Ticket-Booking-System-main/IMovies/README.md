# IMovies — Full-Stack Cinema Ticket Booking System

A production-grade, full-stack MERN application for movie ticket reservation with real-time seat locking, role-based JWT authentication, and administrative cinema management.

---

## Architecture & Features

### 1. Customer Experience
- **Cinematic Dark Theme**: Responsive layouts built with Tailwind CSS, Google Fonts (Playfair Display & Manrope), and high-resolution posters.
- **Movie Catalogue**: Live search, filtering by genre and language, and sorting by rating, year, or title.
- **Movie Details & Showtimes**: High-definition backdrop preview, director & cast information, and upcoming screening schedules.
- **Interactive Seating Layout**: Clear seating grid (Rows A–H, 12 seats per row) with real-time differentiation between available, selected, and unavailable seats.
- **Seat Limit Enforcement**: Configurable max limit (6 seats per reservation) and automatic price computation.
- **Ticket Pass & My Bookings**: Confirmed reservations saved to the user's account with reference IDs, print action, and status tracking.

### 2. Security & Authentication
- **User Registration & Login**: Data validation, duplicate prevention, and bcrypt password hashing with salt.
- **JWT Authorization**: Cryptographically signed JSON Web Tokens stored securely with Bearer authorization headers.
- **Role-Based Access Control**: Strict segregation between `customer` and `admin` roles, enforced at both route middleware and database levels.

### 3. Concurrency & Reliability
- **Atomic Serial Execution**: In-process Mutex queue guaranteeing that concurrent users attempting to reserve the exact same seat cannot double-book (tested with simultaneous `Promise.all` race condition tests).
- **Dual Persistence Strategy**: Supports live MongoDB connections with graceful zero-configuration fallback to an atomic JSON storage engine in `server/data/`.

### 4. Admin Management Hub
- **Admin Dashboard**: Live system metrics (movies, partner theatres, scheduled shows, verified bookings, uptime).
- **Movie Management**: Create, update, search, and delete movie entries with direct backend persistence.
- **Theatre & Show Management**: Add multiplex partner locations, configure screen names and amenities, and schedule new showtimes.

---

## Quick Start Guide

### 1. Start the Backend API

Open a terminal in the project root:

```bash
cd server
copy .env.example .env
npm install
npm run dev
```

The server will listen at `http://localhost:5000`.

### 2. Start the Frontend Application

Open a second terminal:

```bash
cd client
npm install
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## Seed Accounts for Testing

| Role | Email | Password |
| :--- | :--- | :--- |
| **Administrator** | `admin@imovies.com` | `Admin@123456` |
| **Customer** | `customer@imovies.com` | `Customer@123` |

You can also register any new customer account directly from the `/register` page.

---

## Automated Test Suites

Run the complete backend integration test suite:

```bash
cd server
npm test
```

This runs all 86 automated integration tests across:
1. **Auth API Suite** (12 tests) — Registration, hashing, token verification, role enforcement.
2. **Showtime & Seat Selection Flow** (10 tests) — Live shows, expired shows, seat validation, atomic race condition concurrency.
3. **Admin Management & Movies Suite** (11 tests) — Admin CRUD, customer authorization rejection, and live metrics.
4. **Phase 5 End-to-End Ticket Booking Suite** (14 tests) — Server atomic reservation, payment simulation, owner cancellation, seat release, and race condition prevention.
5. **Phase 6 Admin Dashboard & Cinema Management Suite** (20 tests) — Authorization guards, movie CRUD & poster assets, theatre capacity, show scheduling, conflict detection (409), unsafe deletion prevention, and persistence verification.
6. **Final Comprehensive Verification Suite** (15 tests) — Complete user journey from browsing to checkout, cancellation, token discard, admin login, and database audit.
