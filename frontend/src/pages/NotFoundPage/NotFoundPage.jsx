import { useNavigate } from "react-router-dom";
import { EmptyState, PrimaryButton } from "../../Theme";
import SEO from "../../components/SEO/SEO";

const NotFoundPage = () => {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
      <SEO title="Page Not Found" noindex />
      <EmptyState
        icon="🧭"
        title="Page not found"
        subtitle="The page you're looking for doesn't exist or may have moved."
        action={<PrimaryButton onClick={() => navigate("/")}>Back to Home</PrimaryButton>}
      />
    </div>
  );
};

export default NotFoundPage;
