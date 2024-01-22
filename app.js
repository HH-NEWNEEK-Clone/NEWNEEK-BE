import express from 'express';
import crawlingCategory from './src/routes/crawling.bycategory.js'
import sendEmail from './src/routes/send-email.js'

const app = express()
const port = 3000

app.use(express.json())

app.use(express.urlencoded({ extended: true }));

const router = express.Router();

router.get("/", (req, res) => {
    return res.json({ message: "hello world!!" })
})
app.use("/api", [crawlingCategory, sendEmail]);

app.listen(port, () => {
    console.log(port, "Server Start")
})