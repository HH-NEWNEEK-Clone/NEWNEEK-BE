import dotenv from "dotenv";
import express from "express";
import nodemailer from "nodemailer";

const router = express.Router();

let transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "yeonz",
    pass: "tcatnlhgwvflkqny9"
  },
});

router.get("/news/sending/email", async (req, res, next) => {
  try {
    const mailOptions = {
      to: "ubitnoa@gmail.com",
      subject: "테스트용",
      text: "이메일아 제발 보내져라",
    };
    const result = await transporter.sendMail(mailOptions);
    res.status(200).json({ result });
  } catch (error) {
    console.log(error);
  }
});

export default router;
