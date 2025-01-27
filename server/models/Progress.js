import mongoose from "mongoose";

const progressSchema = new mongoose.Schema({
    task: { type: String, required: true, unique: true }, 
    lastIndex: { type: Number, required: true }, 
});

const Progress = mongoose.model('Progress', progressSchema);

export default Progress;