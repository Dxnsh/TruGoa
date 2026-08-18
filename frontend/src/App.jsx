import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
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
import GuidesPage from "./pages/GuidesPage/GuidesPage";
import GuidePostPage from "./pages/GuidePostPage/GuidePostPage";
import JourneyPage from "./pages/JourneyPage/JourneyPage";
import AdminRoute from "./routes/AdminRoute";
import NotFoundPage from "./pages/NotFoundPage/NotFoundPage";
import AboutPage from "./pages/StaticPages/AboutPage";
import ManifestoPage from "./pages/StaticPages/ManifestoPage";
import ContactPage from "./pages/StaticPages/ContactPage";

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
        <Route path="/guides" element={<GuidesPage />} />
        <Route path="/guides/:slug" element={<GuidePostPage />} />
        <Route path="/journey" element={<JourneyPage />} />
        <Route path="/about"       element={<AboutPage />} />
        <Route path="/manifesto"   element={<ManifestoPage />} />
        <Route path="/contact"     element={<ContactPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Analytics />
    </BrowserRouter>
  );
}

export default App;