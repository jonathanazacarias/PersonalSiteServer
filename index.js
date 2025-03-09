import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import env from "dotenv";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

const app = express();
const port = 3000;
env.config();

const GOOGLE_RECAPTCHA_SECRET_KEY = process.env.GOOGLE_RECAPTCHA_SECRET_KEY;


// CORS stuff
const whitelist = [
  "https://jonathanzacarias.com",
  "https://www.jonathanzacarias.com",
  "http://localhost:5173",
];

const headers = [
  "Content-Type",
  "Authorization",
  "Access-Control-Allow-Methods",
  "Access-Control-Request-Headers",
];

let corsOptions = {
  origin: [
    "https://jonathanzacarias.com",
    "https://www.jonathanzacarias.com",
    "http://localhost:5173",
  ],
  allowedHeaders: headers,
  credentials: true,
  enablePreflight: true,
};

app.use(cors(corsOptions));
// set preflight options for cors
app.options("*", (req, res) => {
  console.log(req.origin);
  const origin = req.origin;
  let responseOrigin = "";
  if(whitelist.includes(origin)) {
    responseOrigin = whitelist[whitelist.indexOf(origin)];
  }
  res.setHeader('Access-Control-Allow-Origin', responseOrigin);
});

app.use(express.json());

// create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  port: 465, // true for 465, false for other ports
  host: "smtp.gmail.com",
  auth: {
    user: "jonathanazacarias@gmail.com",
    pass: process.env.GMAIL_PASS,
  },
  secure: true,
});

app.get("/", (req, res) => {
  res.send(`
        <h1>Welcome</h1>
    `);
  console.log("Welcome log");
});

app.post("/contact", (req, res) => {
  const mailData = {
    from: "jonathanazacarias@gmail.com", // sender address
    to: "jonathanazacarias@gmail.com", // list of receivers
    subject: `Personal Site Contact Form: ${req.body.subject}`,
    text: "New personal site contact form message.",
    html: `<b>Sender name: ${req.body.fName} ${req.body.lName}</b>
           <p>${req.body.org}</p>
           <br />
           <p>${req.body.email}</p>
           <br />
           <p>${req.body.message}</p> 
           `,
  };
  try {
    transporter.sendMail(mailData, function (err, info) {
      if (err) {
        console.log(err);
        res.sendStatus(503);
      } else {
        // console.log(info);
        res.send(uuidv4()).status(200);
      }
    });
  } catch (error) {
    res.sendStatus(500);
  }
});

app.post("/verify", async (req, res) => {
  console.log(`Verification request made. \n ${req} \n`);
  if (req.body.captchaToken) {
    const captchaToken = req.body.captchaToken;
    try {
      const result = await axios.post(
        `https://www.google.com/recaptcha/api/siteverify?secret=${GOOGLE_RECAPTCHA_SECRET_KEY}&response=${captchaToken}`
      );
      console.log(result);
      res.send(result.data.success).status(200);
    } catch (error) {
      res.sendStatus(500);
    }
  } else {
    res.sendStatus(403);
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}.`);
});
