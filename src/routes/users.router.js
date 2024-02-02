import express from "express";
import Joi from "joi";
import * as bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import axios from "axios";
import userMiddleware from "../middlewares/user.middleware.js";
import { prisma } from "../utils/index.js";

const usersRouter = express.Router()

// 유효성 검사
const userSchema = Joi.object({
    email: Joi.string().email().required(),
    nickname: Joi.string().min(2).max(15).required(),
    password: Joi.string().pattern(new RegExp("^[a-zA-Z0-9]{5,20}$")).required(),
});

// 회원가입 api
usersRouter.post("/sign-up", async (req, res, next) => {
    try {
        // 요청받은 데이터의 유효성 검사
        const { email, nickname, password } = await userSchema.validateAsync(req.body);
        
        // 이메일 중복 체크
        const exisingUser = await prisma.Users.findUnique({ where: { email } });
        if (exisingUser) {
            return res.status(409).json({ message: "중복된 이메일입니다." })
        }

        // 닉네임 중복 체크
        const existingNickname = await prisma.Users.findFirst({ where: { nickname } });
        if (existingNickname) {
            return res.status(409).json({ message: "중복된 닉네임입니다." })
        }

        // 비밀번호를 해싱
        const hasedPassword = await bcrypt.hash(password, 10); // 비밀번호가 10진법으로 사용됨

        // db에 사용자를 추가합니다.
        // const newUser = await prisma.users.create({ data : { email, nickname, password: hasedPassword }, });
        await prisma.users.create({ data: { email, nickname, password: hasedPassword }, });

        res.status(200).json({ message: "회원가입이 완료되었습니다." })

    } catch (err) {
        next(err);
    }
});


// 소셜 로그인 API
usersRouter.post("/auth/kakao/sign-in", async (req, res, next) => {
    try {
      const responseUser = await axios.get("https://kapi.kakao.com/v2/user/me", {
        headers: {
          Authorization: `Bearer ${req.body.access_token}`,
        },
      });
      const existEmil = await prisma.Users.findFirst({
        where: { email: responseUser.data.kakao_account.email },
      });
      if (!existEmil) {
        await prisma.Users.create({
          data: { email: responseUser.data.kakao_account.email },
        });
      }
      // Users 테이블의 사용자 email을 기반으로 accessToken 발급
      const accessToken = createAccessToken(responseUser.data.kakao_account.email);
  
      // Users 테이블의 사용자 email을 기반으로 refreshToken 발급
      const refreshToken = createRefreshToken(responseUser.data.kakao_account.email);
  
      // refreshToken을 해시화
      const salt = bcrypt.genSaltSync(parseInt(process.env.BCRYPT_SALT));
      const hashedRefreshToken = bcrypt.hashSync(refreshToken, salt);
  
      // users 테이블에서 id 필드를 찾아 user.id와 일치한다면 hashed... 필드를 업데이트합니다.
      await prisma.users.update({
          where: { email: responseUser.data.kakao_account.email }, // { 테이블에 저장된 id : 로그인한 id } 일치하면 아래필드 업데이트
      data: { hashedRefreshToken },
      });
      res.cookie("refreshToken", `Bearer ${refreshToken}`, {
        // secure: true, // https 환경에서만 전송됨.
      });
  
      return res.status(200).json({
        message: "로그인에 성공하였습니다.",
        data: { accessToken, refreshToken },
      });
    } catch (err) {
      next(err);
    }
  });

// 로그인 api
usersRouter.post("/sign-in", async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // 유효성 검사 시 핸들링에 따라 에러를 처리합니다. 
        if (!email || !password) throw { name: "ValidationError" };

        const user = await prisma.Users.findFirst({ where: { email } });
        if (!user) throw { name: "NoneData" };
        if (email !== user.email) throw { name: "EmailError" };

        // 해시된 비밀번호가 일치하는지 확인합니다.
        const checkPassword = await bcrypt.compare(password, user.password);
        if (!checkPassword) {
            return res.status(400).json({ errorMessage: "비밀번호가 일치하지 않습니다." });
        }

        // Users 테이블의 사용자 email을 기반으로 accessToken 발급
        const accessToken = createAccessToken(user.email);

        // Users 테이블의 사용자 email을 기반으로 refreshToken 발급
        const refreshToken = createRefreshToken(user.email);

        // refreshToken을 해시화 
        const salt = bcrypt.genSaltSync(parseInt(process.env.BCRYPT_SALT));
        const hashedRefreshToken = bcrypt.hashSync(refreshToken, salt);

        // users 테이블에서 id 필드를 찾아 user.id와 일치한다면 hashed... 필드를 업데이트합니다.
        await prisma.users.update({
            where: { id: user.id }, // { 테이블에 저장된 id : 로그인한 id } 일치하면 아래필드 업데이트
            data: { hashedRefreshToken, },
        });

        // (name, value, [options]).
        // 이름이 name 인 쿠키를 설정하며
        // 이 쿠키의 값으로 value 를 사용합니다.
        // [options]로 쿠키의 여러 설정을 지정할 수 있습니다.
        res.cookie("refreshToken", `Bearer ${refreshToken}`, {
            secure: true, // https 환경에서만 전송됨.
        });

        return res.status(200).json({ message: "로그인에 성공하였습니다.", data: { accessToken, refreshToken } });
    } catch (err) {
        next(err);
    }
});

usersRouter.post("/refresh", async (req, res, next) => {
    try {
        const { accessToken, refreshToken } = req.body;

        if (!refreshToken || !accessToken) {
            throw new Error(" 로그인이 필요한 서비스 입니다. ");
        }

        const decodedInfo = decodedAccessToken(accessToken);

        const user = await prisma.Users.findFirst({
            where: { email: decodedInfo.email },
        });

        if (!user) {
            throw new Error(" 토큰 사용자가 존재 하지 않습니다. ");
        }

        const verifyRefreshToken = validateRefreshToken(
            refreshToken,
            user.hashedRefreshToken
        );

        if (verifyRefreshToken == "invalid token") {
            await prisma.users.update({
                where: { id: user.id },
                data: {
                    hashedRefreshToken: null,
                },
            });

            return res
                .status(401)
                .json({ message: "토큰이 인증에 실패 하였습니다." });
        }

        if (verifyRefreshToken == "jwt expired") {
            await prisma.Users.update({
                where: { id: user.id },
                data: {
                    hashedRefreshToken: null,
                },
            });

            throw new Error(" 로그인이 필요한 서비스 입니다. ");
        }

        const myNewAccessToken = createAccessToken(user.email);
        const myNewRefreshToken = createRefreshToken(user.email);

        const salt = bcrypt.genSaltSync(parseInt(process.env.BCRYPT_SALT));
        const hashedRefreshToken = bcrypt.hashSync(myNewRefreshToken, salt);

        await prisma.Users.update({
            where: { id: user.id },
            data: {
                hashedRefreshToken,
            },
        });

        return res.status(200).json({
            message: "토큰 재발급.",
            data: { myNewAccessToken, myNewRefreshToken },
        });
    } catch (err) {
        next(err);
    }
});

// 로그아웃 API 
usersRouter.post('/sign-out', userMiddleware, async(req, res, next) => {
    try {
        if(!req.user) throw { name: "NoneData" }
        
        await prisma.Users.update({
            where: { id: req.Users.id },
            data: {
                hashedRefreshToken: null,
            }
        })
        return res.status(200).json({ message: "로그 아 웃." })
    } catch (err) {
        next(err)
    }
});

export function createAccessToken(email) {
    const accessToken = jwt.sign(
        { email }, // JWT 데이터
        process.env.JWT_ACCESS_SECRET_KEY, // Access Token의 비밀 키
        { expiresIn: "1h" } // Access Token이 10초 뒤에 만료되도록 설정.
    );

    return accessToken;
}

// Refresh Token을 생성하는 함수
export function createRefreshToken(email) {
    const refreshToken = jwt.sign(
        { email }, // JWT 데이터
        process.env.JWT_REFRESH_SECRET_KEY, // Refresh Token의 비밀 키
        { expiresIn: "7d" } // Refresh Token이 7일 뒤에 만료되도록 설정.
    );

    return refreshToken;
}

async function validateRefreshToken(refreshToken, hashedRefreshToken) {
    try {
        const [tokenType, token] = refreshToken.split(" ");

        if (tokenType !== "Bearer")
            throw new Error(" 로그인이 필요한 서비스 입니다. ");

        const checkRefreshToken = await bcrypt.compare(token, hashedRefreshToken);

        if (!checkRefreshToken) {
            return res.status(400).json({ errorMessage: "잘못된 접근입니다. " });
        }
        return jwt.verify(token, process.env.JWT_REFRESH_SECRET_KEY);
    } catch (error) {
        return error.message;
    }
}

async function decodedAccessToken(accessToken) {
    try {
        const [tokenType, token] = refreshToken.split(" ");
        return jwt.decode(token, process.env.JWT_ACCESS_SECRET_KEY);
    } catch (error) {
        return error.message;
    }
}

export default usersRouter;