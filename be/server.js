const express = require("express");
const app = express();
const Razorypay = require("razorpay");
const cors = require("cors");
const bodyParser = require("body-parser");
const shortId = require("shortid");
const path = require("path");
const axios = require("axios").default;

app.use(express.urlencoded({ extended: true }));
app.use(express.json({ extended: false }));

//if you want in every domain then
app.use(cors()); //enable cors
let order_status = {
  isPaid: Boolean,
  amount: Number,
  meta: {
    orderID: String,
    paymentID: String,
    txSignature: String,
  },
};
app.use(bodyParser.json());
const rzpay = new Razorypay({
  key_id: "rzp_test_AkwbSqazhbGLan",
  key_secret: "8AgddMwWD1lGqneXvCAx2FVU",
});

//GET reqs
app.get("/logo.svg", (req, res) => {
  res.sendFile(path.join(__dirname, "./images", "dehidden_logo.svg"));
});
app.get("/", (req, res) => {
  res.send("Hello World");
});
app.get("/payments", async (req, res) => {
  const resp = await axios.get("http://localhost:8000/checkouts"); //json server
  const payments = await resp.data;
  res.send({ payments });
});

//POST reqs
app.post("/create-order", async (req, res) => {
  try {
    const options = {
      amount: req.body.amount + "00",
      currency: "INR",
      receipt: shortId.generate(), //to generate random string, replace it with actual order id
    };
    const order = await rzpay.orders.create(options);
    if (!order) return res.status(500).send("Order creation failed!");
    res.send({
      id: order.id,
      currency: order.currency,
      amount: order.amount,
    });
  } catch (err) {
    res.status(500).send(error);
  }
});

app.post("/payment-success", (req, res) => {
  console.log("cheking payment status");
  try {
    // getting the details back from our font-end
    const { amount, razorpayPaymentId, razorpayOrderId, razorpaySignature } =
      req.body;
    const db_url = "http://localhost:8000/checkouts";

    order_status.isPaid = "true";
    order_status.amount = amount;
    order_status.meta.orderID = razorpayOrderId;
    order_status.meta.paymentID = razorpayPaymentId;
    order_status.meta.txSignature = razorpaySignature;

    axios
      .post(db_url, order_status)
      .then(() => console.log("checkout status added!"));
    res.send({
      msg: "Payment Successfull 🎉",
    });
  } catch (error) {
    res.status(500).send(error);
  }
});
app.post("/verify-payment", (req, res) => {
  try {
    const SECRET = "shashwa7@dehidden-be.com";
    const crypto = require("crypto");
    const shaSum = crypto.createHmac("sha256", SECRET); //instance that'll create a hash digest for the body we'll receive from the razorpay server
    shaSum.update(JSON.stringify(req.body));
    const digest = shaSum.digest("hex"); //digest of the req's body
    const rzpay_verification_hash = req.headers["x-razorpay-signature"]; //hash returned from razor pay server
    //note: express lowercases all header keys so lowercase the header key you use.
    //eg: actual header key:X-Razorpay-Signature => lowerCased : x-razorpay-signature
    console.log("digest, verifyhex", digest, rzpay_verification_hash);
    //now comparing the body digest with verification hexcode
    if (digest === rzpay_verification_hash) {
      //payment verified/successfull
      //initiate process
      console.log("Request is legit!");

      //store payment status in db
      const db_url = "http://localhost:8000/payments";
      const order_data = req.body.payload.payment.entity;
      axios.post(db_url, order_data).then(() => console.log("payment added!"));
      res.json({ status: "Payment Successfull " });
    } else {
      console.log("Request is tempered!");
      res.status(500);
    }
  } catch (err) {
    alert(err.message);
    res.status(404);
  }
});

app.listen(3001, () => {
  console.log("Listening at port 3001.");
});
