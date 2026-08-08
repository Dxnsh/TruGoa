import mongoose from "mongoose";

const ownerSchema= new mongoose.Schema({
   name:       {type:String, required:true, trim: true},
   email:      {
     type: String,
     required: true,
     unique: true,
     trim: true,
     lowercase: true,
     match: [/^\S+@\S+\.\S+$/, "Invalid email address"],
   },
   password:   {type:String, required:true},
},  {timestamps: true} );

export default mongoose.model("Owner", ownerSchema);