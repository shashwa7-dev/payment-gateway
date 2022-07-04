import { Route, Routes } from "react-router-dom";
import "./App.css";
import OrderStatus from "./OrderStatus";
import PaymentGateway from "./PaymentGateway";
function App() {
  return (
    <div className="App">
      <Routes>
        <Route exact path="/" element={<PaymentGateway />} />
        <Route exact path="/order-status" element={<OrderStatus />} />
      </Routes>
    </div>
  );
}

export default App;
