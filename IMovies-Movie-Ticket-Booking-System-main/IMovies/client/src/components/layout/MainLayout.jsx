import { Outlet } from 'react-router-dom'
import ErrorBoundary from './ErrorBoundary'
import Footer from './Footer'
import Navbar from './Navbar'

function MainLayout() {
  return (
    <div className="flex min-h-svh flex-col bg-cinema-950 text-zinc-100">
      <Navbar />
      <main className="flex-1">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
      <Footer />
    </div>
  )
}

export default MainLayout
