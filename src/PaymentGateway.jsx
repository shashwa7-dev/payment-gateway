import axios from "axios";
import { useState } from "react";
import { useEffect } from "react";
function loadRazorpay(src_url) {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = src_url;
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

const PaymentGateway = () => {
  const [payments, setPaymentList] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:3001/payments")
      .then((res) => res.data)
      .then((data) => {
        setPaymentList(data.payments);
      })
      .catch((err) => console.log("fetch failed:", err.message));
  }, [payments]);
  async function displayRazorpay() {
    const res = await loadRazorpay(
      "https://checkout.razorpay.com/v1/checkout.js"
    );
    if (!res) {
      alert("Razorpay SDK failed to load.");
      return;
    }
    const _order = await axios
      .post("http://localhost:3001/create-order", { amount: 500 })
      .then((res) => res.data);
    console.log("order:", _order);
    const options = {
      key: "rzp_test_AkwbSqazhbGLan", // Enter the Key ID generated from the Dashboard,
      currency: _order.currency,
      amount: _order.amount,
      name: "Dehidden",
      description: "Test Transaction",
      image: "http://localhost:3001/logo.svg",
      order_id: _order.id, //This is a sample Order ID. Pass the `id` obtained in the response of Step 1
      handler: function (response) {
        axios
          .post("http://localhost:3001/payment-success", {
            amount: _order.amount,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpayOrderId: response.razorpay_order_id,
            razorpaySignature: response.razorpay_signature,
          })
          .then((res) => alert(res.data.msg));
      },
      prefill: {
        name: "Shashwat Tripathi",
        email: "shashwat@tripathi.com",
        contact: "9999999999",
      },
      notes: {
        address: "Razorpay Corporate Office",
      },
      theme: {
        color: "#6e1bff",
      },
    };
    const rzp1 = new window.Razorpay(options);
    rzp1.open();
  }
  return (
    <div className="paymentGT">
      <button onClick={displayRazorpay}>Pay</button>
      <div>
        {payments.map((payment, idx) => {
          return (
            <div
              key={idx}
              style={{
                border: "1px solid",
                fontSize: ".8rem",
                margin: "1rem 0",
                padding: ".5rem",
                textAlign: "left",
              }}
            >
              <p>
                Amount: <span>{payment?.amount}</span>
              </p>
              <p>
                OrderID: <span>{payment?.meta?.orderID}</span>
              </p>
              <p>
                PaymentID: <span>{payment?.meta?.paymentID}</span>
              </p>
              <p>
                Status: <span>{payment?.isPaid}</span>
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PaymentGateway;
