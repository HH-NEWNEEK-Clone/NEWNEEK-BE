import express from 'express';
import crawlingCategory from './src/routes/crawlings.js'
import sendEmail from './src/routes/send-email.js'
import userRouter from './src/routes/users.router.js';
import errorHandlingMiddleware from "./src/middlewares/error.handling.middleware.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import session from 'express-session';

const app = express()
const port = 3000

// const whitelist = ['http://localhost:3000', 'http://example2.com']
// let corsOptions = {
//   origin: function (origin, callback) {
//     if (whitelist.indexOf(origin) !== -1) {
//       callback(null, true)
//     } else {
//       callback(new Error('Not allowed by CORS'))
//     }
//   }
// }


app.use(cors());

app.use(express.json());
app.use(cookieParser());

app.use(
    session({
        secret: process.env.MY_SECRET_KEY,
        resave: false,
        saveUninitialized: false,
        // cookie: { 
        //     secure: true 
        // }
    })
);


app.use(express.urlencoded({ extended: true }));

const router = express.Router();

router.get("/", (req, res) => {
    return res.json({ message: "hello world!!" })
})
app.use("/api", [crawlingCategory, sendEmail, userRouter]);
app.use(errorHandlingMiddleware);

app.listen(port, () => {
    console.log(port, "서버가 열렸습니다.")
})