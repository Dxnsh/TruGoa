import {LayoutDashboard, Store, CheckCircle, XCircle, LogOut }from "lucide-react";
import { theme } from "../../../Theme";
import { useNavigate } from "react-router-dom";


const AdminSidebar=({activeTab, setActiveTab})=>{
    const navigate = useNavigate();

    const menuItem=[
        {
            key:"pending",
            label:"Pending",
            icon:<Store size={18} />
        },
        {
            key:"approved",
            label:"Approved",
            icon:<CheckCircle size={18}/>
        },
        {
            key:"rejected",
            label:"Rejected",
            icon:<XCircle size={18}/>
        },
    ];

    const handleLogout=()=>{
        localStorage.removeItem("trugoa_admin_token");
        navigate("/admin");
    };

    return(
    <div
      style={{
        width: 260,
        background: theme.colors.bgDark,
        minHeight: "100vh",
        padding: "24px 18px",
        color: "white",
        position: "sticky",
        top: 0,
      }}
    >
     <div style={{ marginBottom: 40 }}>
         <div
          style={{
            fontSize: 22,
            fontWeight: 800,
            marginBottom: 6,
          }}
        >
          TruGoa Admin
        </div>

        <div
          style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.5)",
          }}
        >
          Business Dashboard
        </div>
      </div>

      {/* Menu */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {menuItem.map((item) => {
          const active = activeTab === item.key;

          return (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                border: "none",
                background: active
                  ? theme.colors.primary
                  : "transparent",
                color: active
                  ? "white"
                  : "rgba(255,255,255,0.7)",
                padding: "14px 16px",
                borderRadius: 12,
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 600,
                transition: "0.2s",
              }}
            >
              {item.icon}
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        style={{
          marginTop: 40,
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 12,
          border: "none",
          background: "rgba(255,255,255,0.08)",
          color: "rgba(255,255,255,0.8)",
          padding: "14px 16px",
          borderRadius: 12,
          cursor: "pointer",
        }}
      >
        <LogOut size={18} />
        Logout
      </button>
    </div>
  );
};

export default AdminSidebar;
    

