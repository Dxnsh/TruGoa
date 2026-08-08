import { Navigate } from "react-router-dom";

const AdminRoute = ({ children }) => {
    const adminToken = localStorage.getItem("trugoa_admin_token");

    if (!adminToken) {
        return <Navigate to="/admin" replace />;
    }

    return children;
}

export default AdminRoute;