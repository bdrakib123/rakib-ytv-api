const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", require("./routes/ytRoutes"));

app.get("/", (req, res) => {
  res.json({ status: true, message: "Rakib YTV API Running 🚀" });
});

app.listen(process.env.PORT || 3000);
