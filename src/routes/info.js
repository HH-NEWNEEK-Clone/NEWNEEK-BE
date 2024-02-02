import express, { response } from "express";
import Joi from "joi";
import * as bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../utils/index.js";
import userMiddleware from "../middlewares/user.middleware.js";
import nunjucks from "nunjucks";
import qs from "qs";
import dotenv from "dotenv";
import axios from "axios";
import session from "express-session";

const router = express();

router.set("view engine", "html");
nunjucks.configure("views", {
  express: router,
});
router.use(
  session({
    secret: "ras",
    resave: true,
    secure: false,
    saveUninitialized: false,
  })
);

// 발급 받은 키들 입력
const kakao = {
  clientID: "4d53af679065e77f93be56fcdf730e1e",
  clientSecret: "W8gUjTyZavUQHo68VuCdK7pE0aZs2TeY",
  redirectUri: "http://localhost:3000/auth/kakao/callback",
};

// 카카오 로그인 페이지 연결을 만듦.
// 우리 주소가 아닌 카카오의 로그인 페이지.
// autuorize? 뒤에 우리의 정보가 담김.
router.get("/auth/kakao", (req, res) => {
  const kakaoAuthURL = `https://kauth.kakao.com/oauth/authorize?client_id=${kakao.clientID}&redirect_uri=${kakao.redirectUri}&response_type=code&scope=account_email`;
  res.redirect(kakaoAuthURL);
});
// FE.

// 이부분은 aixos 를 활용해 access 토큰을 받기 위해.
// 결과값만 받음
router.get("/auth/kakao/callback", async (req, res) => {
  //   console.log(req.query.code);
  try {
    //access토큰을 받기 위한 코드
    const response = await axios.post(
      "https://kauth.kakao.com/oauth/token",
      {
        grant_type: "authorization_code", //특정 스트링
        client_id: kakao.clientID,
        client_secret: kakao.clientSecret,
        redirect_uri: kakao.redirectUri,
        code: req.query.code, //결과값을 반환했다. 안됐다.
      },
      {
        headers: {
          "content-type": "application/x-www-form-urlencoded",
        },
      }
    );
    return res.json({ data:response.data})
  } catch (e) {
    console.log(e);
  }
});

router.get("/auth/kakao/callback", async (req, res) => {
  try {
    const response = await axios.post(
      "https://kauth.kakao.com/oauth/token",
      {
        grant_type: "authorization_code",
        client_id: kakao.clientID,
        client_secret: kakao.clientSecret,
        redirect_uri: kakao.redirectUri,
        code: req.query.code,
      },
      {
        headers: {
          "content-type": "application/x-www-form-urlencoded",
        },
      }
    );

    // Kakao 세션 정보를 세션에 저장
    req.session.kakao = response.data;

    return res.json({ data: response.data });
  } catch (e) {
    console.log(e);
    res.status(500).send("내부 서버 오류");
  }
});

router.get("/auth/info", (req, res) => {
  console.log("req.session.kakao:", req.session.kakao);

  try {
    if (req.session.kakao && req.session.kakao.properties) {
      let { account_email } = req.session.kakao.properties;
      res.render("info", {
        account_email,
      });
    } else {
      throw new Error(
        "req.session.kakao or req.session.kakao.properties is undefined"
      );
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/test", (req, res) => {
  res.render("index");
});

router.get(kakao.redirectUri);

router.listen(3000, () => {
  console.log(`server start 3000`);
});
