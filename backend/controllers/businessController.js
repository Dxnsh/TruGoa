import Business from "../models/Business.js";
import cloudinary from "../config/cloudinary.js";

// POST
export const createBusiness = async (req, res) => {
  try {
    console.log("=== CREATE BUSINESS ===");
    console.log("body:", JSON.stringify(req.body, null, 2)); // ✅
    
    const { name, location, price_range, trust_level, category, description, contact, images } = req.body;

    if (!name.trim() || !location.trim()) {
      return res.status(400).json({ error: "Name and location required" });
    }

    const business = await Business.create({
      name,
      location,
      price_range,
      trust_level,
      category,
      description,
      contact,
      images: images || [],
    });

    res.status(201).json(business);
  } catch (error) {
    console.log("=== ERROR ===");
    console.log(error.message); // ✅
    console.log(error.stack);   // ✅
    res.status(500).json({ error: error.message });
  }
};

// GET ALL
export const getBusinesses = async (req, res) => {
  try {
    const data = await Business.find({status: "approved"});
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET single business by ID
export const getBusinessById = async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);

    if (!business) {
      return res.status(404).json({ error: "Business not found" });
    }

    res.json(business);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPLOAD IMAGES
    export const uploadImages = async (req, res) => {
      try {
        console.log("files received:", req.files.length); // ✅ add this
        console.log("files:", req.files.map(f => f.originalname)); 
        if (!req.files || req.files.length === 0) {
          return res.status(400).json({ error: "No images uploaded" });
        }

        // upload each file buffer to Cloudinary manually
        const uploadPromises = req.files.map(file => {
          return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              {
                folder: "trugoa_businesses",
                transformation: [{ width: 1200, height: 800, crop: "limit", quality: "auto" }],
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result.secure_url); // ✅ get the https URL
              }
            );
            stream.end(file.buffer); // ✅ push the buffer into the stream
          });
        });

        const urls = await Promise.all(uploadPromises);
        res.json({ urls });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    };