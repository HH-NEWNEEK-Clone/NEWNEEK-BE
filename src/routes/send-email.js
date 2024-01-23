import dotenv from "dotenv";
import express from "express";
import nodemailer from "nodemailer";

const router = express.Router();
dotenv.config();

let transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.NODEMAILER_USER,
    pass: process.env.NODEMAILER_PASS
  },
});

router.post("/news/sending/email", async (req, res, next) => {
  try {
    const {email, nickname} = req.body
    const mailOptions = {
      to: email,
      subject: `${nickname}님, 뉴닉 구독을 환영합니다`,
      text: 
      `
      안녕하세요 ${nickname}님, 뉴닉 구독을 환영합니다. 
      본 이메일은 뉴닉 정기 구독을 신청하신 분들께 발송됩니다.
      <테스트용>`,
    };
    const result = await transporter.sendMail(mailOptions);
    res.status(200).json({ result });
  } catch (error) {
    console.log(error);
  }
});

export default router;
