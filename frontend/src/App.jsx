import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";
import Homepage from "./pages/HomePage/Homepage";
import ExplorePage from "./pages/ExplorePage/ExplorePage";
import DetailPage from "./pages/DetailPage/DetailPage";
import GoaGuide from "./pages/GoaGuide/GoaGuide";
import AuthPage from "./pages/Auth/AuthPage";
import AdminLogin from "./pages/Admin/AdminLogin";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import ItineraryPage from "./pages/ItineraryPage/ItineraryPage";
import SavedPlacesPage from "./pages/SavedPlacesPage/SavedPlacesPage";
import StoriesPage from "./pages/StoriesPage/StoriesPage";
import StoryArticlePage from "./pages/StoryArticlePage/StoryArticlePage";
import JourneyPage from "./pages/JourneyPage/JourneyPage";
import AdminRoute from "./routes/AdminRoute";
import NotFoundPage from "./pages/NotFoundPage/NotFoundPage";

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/"             element={<Homepage />} />
        <Route path="/explore"     element={<ExplorePage/>}/>
          
        <Route path="/listings/:slug" element={<DetailPage />} />
        <Route path="/goaguide"     element={<GoaGuide />} />
        <Route path="/auth"         element={<AuthPage />} />
        <Route path="/admin"         element={<AdminLogin />}/>
        <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard/></AdminRoute>}/>
        <Route path="/itinerary"   element={<ItineraryPage />} />
        <Route path="/saved"       element={<SavedPlacesPage />} />
        <Route path="/stories/:slug" element={<StoriesPage />} />
        <Route path="/stories/:slug/:storySlug" element={<StoryArticlePage />} />
        <Route path="/journey" element={<JourneyPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;