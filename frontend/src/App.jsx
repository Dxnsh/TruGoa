import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar/Navbar";
import Homepage from "./pages/HomePage/Homepage";
import ListingPage from "./pages/ListingPage/ListingPage";
import DetailPage from "./pages/DetailPage/DetailPage";
import GoaGuide from "./pages/GoaGuide/GoaGuide";
import AddBusiness from "./pages/AddBusiness/AddBusiness";
import AuthPage from "./pages/Auth/AuthPage";
import AdminLogin from "./pages/Admin/AdminLogin";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import ItineraryPage from "./pages/ItineraryPage/ItineraryPage";
import BookingPage from "./pages/BookingPage/BookingPage";
import MyBookingsPage from "./pages/MyBookingPage/MyBookingPage";

// ✅ protects routes that need login
const ProtectedRoute = ({ children }) => {
  const { isLoggedIn, authLoading } = useAuth();
  if (authLoading) return null; 
  if (!isLoggedIn) return <Navigate to="/auth" replace />;
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/"             element={<Homepage />} />
        <Route path="/listings"     element={<ListingPage />} />
        <Route path="/listings/:id" element={<DetailPage />} />
        <Route path="/goaguide"     element={<GoaGuide />} />
        <Route path="/auth"         element={<AuthPage />} />
        <Route path="/admin"         element={<AdminLogin />} />
        <Route path="/admin/dashboard"   element={<AdminDashboard />} />
        <Route path="/itinerary"   element={<ItineraryPage />} />
        <Route path="/booking/:id" element={<BookingPage/>}/>
        <Route path="/my-bookings" element={<MyBookingsPage />} />

        <Route path="/add-business" element={
          <ProtectedRoute>       {/* ✅ protected */}
            <AddBusiness />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;