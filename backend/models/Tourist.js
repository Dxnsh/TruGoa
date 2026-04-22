import mongoose from "mongoose";

const touristSchema= new mongoose.Schema({
    name:     {type:"String", required: true},
    email:    {type:"String", required: true, unique: true},
    googleId: {type:"String", required: true, unique: true},
    avatar:   {type:"String"},
}, {timestamps: true});

export default mongoose.model("Tourist", touristSchema)