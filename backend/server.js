import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import cors from "cors";
import helmet from "helmet";
import businessRoutes from "./routes/businessRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js"; 
import aiRoutes from "./routes/aiRoutes.js";  
import authRoutes from "./routes/authRoutes.js"
import adminRoutes from "./routes/adminRoutes.js"
import touristRoutes from "./routes/touristRoutes.js";

dotenv.config();
connectDB();

const app=express();
app.use(cors());
app.use(express.json());
app.use(helmet());
app.use("/api/businesses", businessRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/ai", aiRoutes); 
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/tourist", touristRoutes); 
app.use(helmet({
  crossOriginOpenerPolicy: false, 
}));

app.get("/",(req,res)=>{
    res.send("API running")
});

app.listen(process.env.PORT,()=>{
    console.log(`server running on port ${process.env.PORT} `);
    
})