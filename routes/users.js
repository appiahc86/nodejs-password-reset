import express from "express";
const router = express.Router();

import userController from "../controller/userController.js";
router.get('/', userController.index);
router.post('/store', userController.store);
router.get('/remove/:id', userController.remove);

router.get('/login', userController.loginForm);
router.post('/login', userController.login);
router.get('/logout', userController.logout);
router.get('/forgotForm', userController.forgotForm);
router.post('/forgot', userController.forgot);
router.get('/reset/:token', userController.reset);
router.post('/reset/:token', userController.processReset);


export default router;
