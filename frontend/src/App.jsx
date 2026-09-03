import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
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
import JournalPage from "./pages/JournalPage/JournalPage";
import JournalPostPage from "./pages/JournalPostPage/JournalPostPage";
import JourneyPage from "./pages/JourneyPage/JourneyPage";
import AdminRoute from "./routes/AdminRoute";
import NotFoundPage from "./pages/NotFoundPage/NotFoundPage";
import AboutPage from "./pages/StaticPages/AboutPage";
import ManifestoPage from "./pages/StaticPages/ManifestoPage";
import ContactPage from "./pages/StaticPages/ContactPage";
import PrivacyPage from "./pages/StaticPages/PrivacyPage";
import TermsPage from "./pages/StaticPages/TermsPage";
import TrendingDetail from "./pages/TrendingDetail/TrendingDetail";
import TrendingPage from "./pages/TrendingPage/TrendingPage";
// The journal used to live at /guides. Anything already linked or indexed
// there is forwarded rather than dropped on a 404.
const GuideSlugRedirect = () => {
  const { slug } = useParams();
  return <Navigate to={`/journal/${slug}`} replace />;
};

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
        <Route path="/journal" element={<JournalPage />} />
        <Route path="/journal/:slug" element={<JournalPostPage />} />
        <Route path="/guides" element={<Navigate to="/journal" replace />} />
        <Route path="/guides/:slug" element={<GuideSlugRedirect />} />
        <Route path="/journey" element={<JourneyPage />} />
        <Route path="/about"       element={<AboutPage />} />
        <Route path="/manifesto"   element={<ManifestoPage />} />
        <Route path="/contact"     element={<ContactPage />} />
        <Route path="/privacy"     element={<PrivacyPage />} />
        <Route path="/terms"       element={<TermsPage />} />
        <Route path="/trending"     element={<TrendingPage />} />
     

        <Route path="/trending/:slug"     element={<TrendingDetail />} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Analytics />
    </BrowserRouter>
  );
}

export default App;