const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const multer = require("multer");

const app = express();
const upload = multer({ dest: "uploads/" });

// ================= FRONTEND =================
app.get("/", (req, res) => {
  res.send(`
  <html>
  <head>
    <title>Saqqa Search 🔥</title>
    <style>
      body { background:#0b0f1a; color:white; font-family:Arial; text-align:center; }
      input { padding:10px; width:70%; border-radius:10px; }
      button { padding:10px; background:gold; border:none; border-radius:10px; }
      .card { background:#1a1f2e; margin:10px; padding:10px; border-radius:10px; }
    </style>
  </head>
  <body>
    <h1>🔥 Saqqa Search</h1>

    <input id="q" placeholder="Search..." />
    <button onclick="go()">Search</button>

    <div id="results"></div>

    <script>
      async function go() {
        const q = document.getElementById("q").value;
        const res = await fetch('/search?q=' + q);
        const data = await res.json();

        const div = document.getElementById("results");
        div.innerHTML = "";

        data.forEach(p => {
          div.innerHTML += \`
            <div class="card">
              <h3>\${p.name}</h3>
              <p>\${p.site}</p>
              <p>$\${p.price}</p>
              \${p.tag ? "<b>🔥 Best Price</b>" : ""}
              <br/>
              <a href="\${p.link}" target="_blank">View</a>
            </div>
          \`;
        });
      }
    </script>
  </body>
  </html>
  `);
});

// ================= SCRAPING =================
async function scrapeAmazon(q) {
  try {
    const { data } = await axios.get(\`https://www.amazon.com/s?k=\${q}\`);
    const $ = cheerio.load(data);

    let arr = [];
    $(".s-result-item").each((i, el) => {
      const name = $(el).find("h2 span").text();
      const price = $(el).find(".a-price-whole").text();

      if (name && price) {
        arr.push({
          name,
          price: parseInt(price),
          site: "Amazon",
          link: "https://amazon.com"
        });
      }
    });

    return arr.slice(0,5);
  } catch {
    return [];
  }
}

async function scrapeEbay(q) {
  try {
    const { data } = await axios.get(\`https://www.ebay.com/sch/i.html?_nkw=\${q}\`);
    const $ = cheerio.load(data);

    let arr = [];
    $(".s-item").each((i, el) => {
      const name = $(el).find(".s-item__title").text();
      const price = $(el).find(".s-item__price").text().replace(/[^0-9]/g,'');

      if (name && price) {
        arr.push({
          name,
          price: parseInt(price),
          site: "eBay",
          link: "https://ebay.com"
        });
      }
    });

    return arr.slice(0,5);
  } catch {
    return [];
  }
}

// ================= API =================
app.get("/search", async (req, res) => {
  const q = req.query.q;

  const a = await scrapeAmazon(q);
  const e = await scrapeEbay(q);

  let results = [...a, ...e];

  const lowest = Math.min(...results.map(r => r.price));

  results = results.map(r => ({
    ...r,
    tag: r.price === lowest
  }));

  res.json(results);
});

// ================= RUN =================
app.listen(3000, () => console.log("🔥 running"));
