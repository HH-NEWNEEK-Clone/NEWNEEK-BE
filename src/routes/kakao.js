import express from 'express'
import { prisma } from "../utils/index.js";
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import dotenv from 'dotenv'
import axios from 'axios';
import qs from 'qs'

const router = express.Router()

const REDIRECT_URI = 'http://54.250.244.188/api/auth/kakao/callback';
const REST_API_KEY = '4d53af679065e77f93be56fcdf730e1e';

// Kakao Callback 처리
// Frontend에서 코드를 받아서 Kakao API로 AccessToken을 요청합니다.
router.post('/auth/kakao/callback', async (req, res) => {
  const { code } = req.query;
  try {
    // AccessToken으로 Kakao API로 사용자 정보를 요청합니다.
    const accessToken = tokenResponse.data.access_token;
    const response = await axios({
      method: "POST",
      url: "https://kauth.kakao.com/oauth/token",
      headers: {
        "content-type": "application/x-www-form-urlencoded;charset=utf-8",
      },

      data: qs.stringify({
        grant_type: "authorization_code",
        client_id: REDIRECT_URI,
        redirect_uri: REST_API_KEY,
        code: code,
      })
    });

    const { access_token } = response.data

    const userResponse = await axios({
      method: "GET",
      url: "https://kapi.kakao.com/v2/user/me",
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });
    const findUser = await prisma.users.findFirst({
      where: { email: userResponse.data.kakao_account.email },
    });
    if (findUser) {
      const accessToken = jwt.sign({ id: findUser.id }, key, {
        expiresIn: "1h",
      })
      const refreshToken = jwt.sign({ id: findUser.id }, key, {
        expiresIn: "7d",
      });
      await client.set(`RefreshToken:${findUser.id}`, refreshToken, "EX", 7 * 24 * 60 * 60 );
      res.setHeader("Authorization", `Bearer ${accessToken}`);
      res.setHeader("Refreshtoken", refreshToken);
      return res.json({ message: "done ?" });
    } else {
      var userResponseIdString = userResponse.data.id.toString();
      var kakaoIdsubString = userResponseIdString.substring(0, 8);

      const encryptionPassword = await bcrypt.hash(kakaoIdsubString, 10);

      const createUser = await prisma.users.create({
        data: {
          email: userResponse.data.kakao_account.email,
          username: userResponse.data.properties.nickname,
          password: encryptionPassword,
          profileImg: userResponse.data.properties.profile_image,
          userType : 'K'
        },
      });
      const accesstoken = jwt.sign({ id: createUser.id }, key, {expiresIn: "1h"});
      const refreshtoken = jwt.sign({ id: createUser.id }, key, {expiresIn: "7d"});

      await client.set(`RefreshToken:${createUser.id}`, refreshtoken, "EX", 7 * 24 * 60 * 60 );

      res.setHeader("Authorization", `Bearer ${accesstoken}`);
      res.setHeader("Refreshtoken", refreshtoken);

      return res.json({ message: "회원가입이 완료되었습니다." });
    }
  } catch (err) {
    next(err);
  }
});

export default router;


