import { Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/auth/ProtectedRoute'
import AdminLayout from './components/layout/AdminLayout'
import MainLayout from './components/layout/MainLayout'
import { AuthProvider } from './context/AuthContext'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminMoviesPage from './pages/admin/AdminMoviesPage'
import AdminTheatresPage from './pages/admin/AdminTheatresPage'
import BookingConfirmationPage from './pages/BookingConfirmationPage'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import MovieDetailsPage from './pages/MovieDetailsPage'
import MoviesPage from './pages/MoviesPage'
import MyBookingsPage from './pages/MyBookingsPage'
import NotFoundPage from './pages/NotFoundPage'
import RegisterPage from './pages/RegisterPage'
import SeatSelectionPage from './pages/SeatSelectionPage'
import ShowtimesPage from './pages/ShowtimesPage'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/movies" element={<MoviesPage />} />
          <Route path="/movies/:movieId" element={<MovieDetailsPage />} />
          <Route path="/movies/:movieId/theatres" element={<ShowtimesPage />} />
          <Route
            path="/movies/:movieId/seats/:showId"
            element={<SeatSelectionPage />}
          />
          <Route
            path="/booking/confirmation"
            element={<BookingConfirmationPage />}
          />
          {/* Protected Customer Routes */}
          <Route
            path="/bookings"
            element={
              <ProtectedRoute>
                <MyBookingsPage />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Protected Administrator Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin={true}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="movies" element={<AdminMoviesPage />} />
          <Route path="theatres" element={<AdminTheatresPage />} />
        </Route>

        <Route element={<MainLayout />}>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}

export default App
