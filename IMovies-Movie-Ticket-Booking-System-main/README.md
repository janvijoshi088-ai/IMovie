# 🎬 IMovies – Movie Ticket Booking System

**IMovies** is a full-stack movie ticket booking web application that provides users with a convenient way to explore movies, view showtimes, select seats, and manage their bookings. It also includes an admin interface for managing movies, theatres, and shows.

The project is built using the MERN stack and aims to provide a smooth, responsive, and user-friendly movie booking experience.

## ✨ Features

### 👤 User Features
- **User Authentication:** Register, log in, and log out securely.
- **Browse Movies:** Explore available movies and view their details.
- **Movie Details:** View movie information, descriptions, genres, and posters.
- **Showtimes:** Browse available shows and their schedules.
- **Interactive Seat Selection:** Select seats and view their availability.
- **Ticket Booking:** Book tickets and view booking confirmation.
- **My Bookings:** View booking history and manage eligible bookings.
- **Responsive UI:** Use the application on desktop, tablet, and mobile devices.

### 🛠️ Admin Features
- **Admin Dashboard:** View relevant application statistics.
- **Movie Management:** Add, edit, view, and delete movie records.
- **Theatre Management:** Manage theatre information.
- **Show Management:** Manage movie showtimes and schedules.
- **Access Control:** Restrict administrative operations to authorized users.

*Note: Features may vary depending on the final implementation. Only advertise functionality that has been tested.*

## 🧰 Tech Stack

### Frontend
- React.js
- Vite
- Tailwind CSS
- React Router

### Backend
- Node.js
- Express.js
- REST APIs

### Database
- MongoDB
- Mongoose

### Development Tools
- Git
- GitHub
- Visual Studio Code / Google Antigravity

## 📁 Project Structure

```text
IMovies/
├── client/                 # React frontend
│   ├── public/             # Public assets and movie posters
│   ├── src/
│   │   ├── api/            # API utilities
│   │   ├── assets/         # Frontend assets
│   │   ├── components/     # Reusable UI components
│   │   ├── data/           # Supporting or sample data
│   │   ├── pages/          # Application pages
│   │   ├── App.jsx         # Application routes
│   │   └── index.css       # Global styles
│   ├── package.json
│   └── vite.config.js
│
├── server/                 # Express backend
│   ├── src/                # Server source code
│   ├── package.json
│   └── .env.example        # Environment-variable template, if present
│
├── .gitignore
└── README.md
```

## ⚙️ Prerequisites

Before running the project, install the following:

- [Node.js](https://nodejs.org/) (an LTS version compatible with the project dependencies)
- npm (included with Node.js)
- MongoDB, either installed locally or hosted through MongoDB Atlas
- Git (optional for running the project, required for Git-based workflows)

## 🚀 Getting Started

Follow these steps to run IMovies locally.

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR-USERNAME/IMovies-Movie-Ticket-Booking-System.git
```

Navigate to the project directory:

```bash
cd IMovies-Movie-Ticket-Booking-System
```

Replace `YOUR-USERNAME` with your GitHub username.

### 2. Install Frontend Dependencies

```bash
cd client
npm install
```

### 3. Install Backend Dependencies

Open another terminal in the project root and run:

```bash
cd server
npm install
```

### 4. Configure Environment Variables

Create a `.env` file inside the `server` directory.

Use the following as a starting point, adjusting the variable names to match your backend implementation:

```env
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/imovies
```

If your project requires additional variables, configure them according to your actual implementation.

**Important:**
- Make sure MongoDB is running if you use a local database.
- If you use MongoDB Atlas, replace the local MongoDB URI with your Atlas connection string.
- Never commit your actual `.env` file or database credentials to GitHub.
- Keep `.env.example` limited to placeholder values.

### 5. Start the Backend

From the `server` directory, run:

```bash
npm run dev
```

If your backend does not define a `dev` script, use the appropriate command from `server/package.json`.

The backend should start on:

```text
http://localhost:5000
```

If the health endpoint is available, you can test it at:

```text
http://localhost:5000/api/health
```

### 6. Start the Frontend

Open a separate terminal and navigate to the `client` directory:

```bash
cd client
npm run dev
```

Vite will display the local development URL. It is usually:

```text
http://localhost:5173
```

Open that address in your browser to use IMovies.

## 🔐 Security Notes

- User passwords should be securely hashed.
- Protected backend routes should validate authentication and authorization.
- Administrator operations should require server-side role checks.
- Environment variables and secrets must remain private.
- Booking operations should validate seat availability on the backend.
- Never expose database credentials or private API keys in frontend code.

## 🧪 Testing

Test the application before using it for a demonstration or submission.

Recommended checks:

- User registration and login
- Movie listings and movie details
- Showtimes and seat selection
- Booking creation and confirmation
- Booking history and cancellation, if implemented
- Admin access and movie management
- Theatre and show management
- Database persistence
- Frontend responsiveness
- Error handling and invalid requests

## 🔮 Future Improvements

Potential enhancements include:

- Integration with a real payment gateway
- Email or SMS booking notifications
- Movie search, sorting, and filtering
- QR-code-based ticket verification
- Improved admin analytics
- Theatre-specific seat layouts
- Automated testing and deployment
- Cloud hosting for the frontend, backend, and database

## 🎓 Project Purpose

IMovies was developed as a full-stack web development project to demonstrate frontend development, REST API integration, database operations, authentication, and application design.

## 👨‍💻 Author
**Shantanu Karkare**
- GitHub: [Shantanu-Karkare](https://github.com/Shantanu-Karkare)
---
