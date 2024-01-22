import express from 'express';
import userRouter from './src/routes/users.router.js';
import errorHandlingMiddleware from "./src/middlewares/error.handling.middleware.js";
import cookieParser from "cookie-parser";
import expressSession from "express-session";
import cors from "cors";

const app = express()
const port = 3000

app.use(cors());

app.use(express.json());
app.use(cookieParser());
app.use(
    expressSession({
        secret: process.env.MY_SECRET_KEY,
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 1000 * 60 * 60 * 24,
            secure: true, // https 일때 도 값이 잘 들어갈 수 있도록 배포시에 주석풀기.
        },
    })
);
app.use(express.urlencoded({ extended: true }));

const router = express.Router();

router.get("/", (req, res) => {
    return res.json({ message: "hello world!!" })
})

app.use("/api", [userRouter]);
app.use(errorHandlingMiddleware);

app.listen(port, () => {
    console.log(port, "서버가 열렸습니다.")
})