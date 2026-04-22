import mongoose from "mongoose";

const businessSchema = new mongoose.Schema({
 name:{type:String, required:true},
 location:{type:String, required:true},
 category:String,
 price_range:String,
 trust_level:{
   type:String,
   default:"risky"
 },
 rating:{type:Number, default:0},
 review_count:{type:Number, default:0},
 description: String,
 contact:     String,
 images:      [{type:String}],
 status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending", 
  },

},{timestamps:true});

export default mongoose.model("Business", businessSchema);