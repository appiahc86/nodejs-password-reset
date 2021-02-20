import User from "../models/User.js";
import nodemailer from "nodemailer";
import passport from "passport";
import strategy from "passport-local";
const LocalStrategy = strategy.Strategy;
import crypto from "crypto";
import async from "async";



//Passport Strategy
passport.use(new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password'
    }, (email, password, done) => {

        User.findOne({email: email.trim().toLowerCase()}).then(user =>{

            if (!user) return done(null, false, {message: 'Sorry, this user was not found'});

            if (password === user.password){
                return done(null, user);
            }else {
                return done(null, false, {message: 'Incorrect Password'});
            }

        });
    }

));

//serialize
passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});




const userController = {

    index: async (req, res)=>{
        const users = await User.find();
       res.render('users/index', {users});
    },

    store: async (req, res)=>{

        const newUser = new User({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password
        });

        await newUser.save()

        res.redirect('back')
    },

    remove: async (req, res)=>{

        const user = await User.findByIdAndRemove(req.params.id);

         res.redirect('/users')
    },

    loginForm: async (req, res) =>{
        if (req.user) return res.redirect('/');
        res.render('users/login');
    },

    //Login
    login: async (req, res, next)=>{
        passport.authenticate('local', {
            successRedirect: '/',
            failureRedirect: '/users/login',
            failureFlash: true
        })(req, res, next);
    },

    //Logout
    logout: (req, res) => {
        req.logout();
        res.redirect('/users/login');
    },

    forgotForm: async (req, res)=>{
        res.render('users/forgot', {user: req.user})
    },


    forgot: async (req, res, next)=>{  //Forgot password
        async.waterfall([
            function(done) {
                crypto.randomBytes(20, function(err, buf) {
                    let token = buf.toString('hex');
                    done(err, token);
                });
            },
            function(token, done) {
                User.findOne({ email: req.body.email }, function(err, user) {
                    if (!user) {
                        req.flash('success_msg', 'No account with that email address exists.');
                        return res.redirect('back');
                    }

                    user.resetPasswordToken = token;
                    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

                    user.save(function(err) {
                        done(err, token, user);
                    });
                });
            },
            function(token, user, done) {
                let smtpTransport = nodemailer.createTransport({
                    // service: 'gmail',
                    host: process.env.EMAIL_HOST,
                    port: process.env.EMAIL_PORT,
                    auth: {
                       
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASS
                    }
                });
                let mailOptions = {
                    to: user.email,
                    from: '"InnoCentCoded"<wsappiah@gmail.com>',
                    subject: 'Node.js Password Reset',
                    text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
                        'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                        'http://' + req.headers.host + '/users/reset/' + token + '\n\n' +
                        'If you did not request this, please ignore this email and your password will remain unchanged.\n'
                };
                smtpTransport.sendMail(mailOptions, function(err) {
                    req.flash('success_msg', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
                    done(err, 'done');
                });
            }
        ], function(err) {
            if (err) return next(err);
            res.redirect('/users/forgotForm');
        });

    },

    reset: async (req, res)=>{
        User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
            if (!user) {
                req.flash('error', 'Password reset token is invalid or has expired.');
                return res.redirect('/users/forgotForm');
            }
            res.render('users/reset', { user });

        });

    },

    processReset: async(req, res)=>{ //Reset password
        async.waterfall([
            function(done) {
                User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
                    if (!user) {
                        req.flash('success_msg', 'Password reset token is invalid or has expired.');
                        return res.redirect('back');
                    }

                    user.password = req.body.password;
                    user.resetPasswordToken = undefined;
                    user.resetPasswordExpires = undefined;

                    user.save(function(err) {
                        req.login(user, function(err) {
                            done(err, user);
                        });
                    });
                });
            },
            function(user, done) {
                let smtpTransport = nodemailer.createTransport({

                    host: process.env.EMAIL_HOST,
                    port: process.env.EMAIL_PORT,
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASS
                    }
                });
                var mailOptions = {
                    to: user.email,
                    from: '"InnoCentCoded"<wsappiah@gmail.com>',
                    subject: 'Your password has been changed',
                    text: 'Hello,\n\n' +
                        'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
                };
                smtpTransport.sendMail(mailOptions, function(err) {
                    req.flash('success', 'Success! Your password has been changed.');
                    done(err);
                });
            }
        ], function(err) {
            res.redirect('/');
        });
    }




}




export default userController;
