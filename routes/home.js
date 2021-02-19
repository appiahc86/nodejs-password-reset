import express from "express";
const router = express.Router();

import auth from "../middleware/auth.js";
router.get('/', auth, (req, res)=>{
    res.render('index')
});



export default router;
