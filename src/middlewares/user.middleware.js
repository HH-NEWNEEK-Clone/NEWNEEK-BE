import jwt from "jsonwebtoken";
import { prisma } from "../utils/index.js";

export default async function (req, res, next) {
    try {
        const accessToken = req.headers.authorization;

        if (!accessToken) {
            throw new Error(" 로그인이 필요한 서비스 입니다. ");
        }

        const verifyAccessToken = validateAccesstoken(accessToken);

        if (verifyAccessToken == "invalid token") {
            return res
                .status(401)
                .json({ message: "토큰이 인증에 실패 하였습니다." });
        }

        if (verifyAccessToken == "jwt expired") {
            return res.status(401).json({ message: "토큰이 만료 되었습니다." });
        }

        const username = verifyAccessToken.username;

        const user = await prisma.Users.findFirst({
            where: { username },
        });

        if (!user) {
            throw new Error(" 토큰 사용자가 존재 하지 않습니다. ");
        }

        req.user = user;

        next();

    } catch (error) {
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
        switch (error.name) {
            case "TokenExpiredError":
                return res.status(401).json({ message: "토큰이 만료 되었습니다." });
            case "JsonWebTokenError":
                return res
                    .status(401)
                    .json({ message: "토큰이 인증에 실패 하였습니다." });
            default:
                return res
                    .status(401)
                    .json({ message: error.message ?? "비정상적인 요청입니다." });
        }
    }
}

function validateAccesstoken(accessToken) {
    try {
        const [tokenType, token] = accessToken.split(" ");

        if (tokenType !== "Bearer")
            throw new Error(" 로그인이 필요한 서비스 입니다. ");

        return jwt.verify(token, process.env.JWT_ACCESS_SECRET_KEY);
    } catch (error) {
        return error.message;
    }
}


