require("dotenv").config();

const express = require("express");
const cors = require("cors");

const { createClient } = require("@supabase/supabase-js");

const app = express();

app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

app.get("/", (req, res) => {
  res.send("Backend Running ✅");
});

app.get("/inventory", async (req, res) => {

  const { data, error } = await supabase
    .from("inventory_summary")
    .select("*");

  if (error) {
    return res.status(500).json(error);
  }

  res.json(data);
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server running on port 3000");
});
