import express from "express";
import dotenv from "dotenv";
import path from "path";
import ejs from "ejs";
import mongoose from "mongoose";
const __dirname = path.resolve();
import session from "express-session";
import flash from "connect-flash";
import passport from "passport";


dotenv.config();
const app = express();
const port = process.env.port || 3000;

app.use(express.json());
app.use(express.urlencoded({extended: false}));


//Session
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
}));

app.use(flash());

//Passport
app.use(passport.initialize());
app.use(passport.session());


//Local variables
app.use((req, res, next)=>{
    res.locals.user = req.user || null;
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
});


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

//DB CONNECTION
mongoose.connect(process.env.DB_CONNECTION,
    {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
        useCreateIndex: true,
    },
    ()=>{
        console.log("Database Connected");
    }
);


//Load routes
import indexRouter from "./routes/home.js";
import userRouter from "./routes/users.js";

//use routes
app.use('/', indexRouter);
app.use('/users', userRouter);


app.listen(port, () => {
    console.log(`Listening on port ${port}`);
})