import express from 'express';
import axios from 'axios';
import userRouter from './src/routes/users.router.js';
import kakaoRouter from './src/routes/kakao.js'
import errorHandlingMiddleware from "./src/middlewares/error.handling.middleware.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import session from 'express-session';

const app = express();
const port = 3000;

app.use(cors({
    origin: '*',
}));

app.use(express.json());
app.use(cookieParser());

app.use(
    session({
        secret: "ym-secret-key",
        resave: true,
        secure: false,
        saveUninitialized: false,
    })
);

app.use(express.urlencoded({ extended: true }));

// const REDIRECT_URI = 'http://54.250.244.188/api/auth/kakao/callback';
// const REST_API_KEY = '4d53af679065e77f93be56fcdf730e1e';

// // 프론트엔드에서 전달받은 `access_token` 값
// app.post('/api/auth/kakao/callback', async (req, res) => {
//     const { access_token } = req.body;

//     // Kakao API로부터 유저 정보를 가져오기 위한 요청
//     try {
//         const tokenResponse = await axios.post('https://kauth.kakao.com/oauth/token', {
//             grant_type: 'authorization_code',
//             client_id: REST_API_KEY,
//             redirect_uri: REDIRECT_URI,
//             code: access_token,
//         });

//         const accessToken = tokenResponse.data.access_token;
//         const userResponse = await axios.get('https://kapi.kakao.com/v2/user/me', {
//             headers: {
//                 'Content-Type': 'application/x-www-form-urlencoded',
//                 Authorization: `Bearer ${accessToken}`,
//             },
//         });

//         console.log('User Info:', userResponse.data);
//         res.send('User Info: ' + JSON.stringify(userResponse.data));
//     } catch (error) {
//         console.error('Error exchanging code for access token', error.response.data);
//         res.status(500).send('Internal Server Error');
//     }
// });

app.get("/", (req, res) => {
    return res.send("okay");
});

app.use("/api", [userRouter, kakaoRouter]);
app.use(errorHandlingMiddleware);

app.listen(port, () => {
    console.log(port, "서버가 열렸습니다.");
});
