import express from 'express';

const app = express()
const port = 3000

app.use(express.json())

app.use(express.urlencoded({ extended: true }));

const router = express.Router();

router.get("/", (req, res) => {
    return res.json({ message: "hello world!!" })
})

app.listen(port, () => {
    console.log(port, "Server Start")
})