import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    name:{type: String},
    email:{
        type: String,
        required: true
    },
    password:{type: String },
    resetPasswordToken: { type: String},
    resetPasswordExpires: {type: Date}
})

const User = mongoose.model('User', UserSchema);
export default User;