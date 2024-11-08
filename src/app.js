const express = require('express');
const fs = require('fs');
const { Client } = require('@elastic/elasticsearch');
const path = require('path');
const app = express();
const port = 3000;

const esClient = new Client({
  node: 'https://localhost:9200',
  auth: {
    username: 'elastic',
    password: 'cSCbnHyH-DOaUNQiIOXx',
  },
  tls: {
    ca: fs.readFileSync(path.join(__dirname, '../http_ca.crt')),
    rejectUnauthorized: false,
  },
});

const indexName = 'prisoners';

// API endpoint to fetch data from Elasticsearch
app.get('/api/statements', async (req, res) => {
  try {

    const searchTerm = req.query.searchTerm || "";

    const response = await esClient.search({
      index: indexName,
      body: {
        query: {
          multi_match: {
            query: searchTerm,  // Replace this with the term you're searching for
            fields: ["LastName"],  // Replace with the fields to search across
            type: "best_fields",  // Options: "best_fields" or "most_fields"
            fuzziness: "AUTO"  // Allows for typo tolerance, like in a search engine
          }
        }
      }
    });
    

    // Send the data in `response.hits.hits` directly
    if (response.hits && response.hits.hits) {
      res.json(response.hits.hits);
    } else {
      console.error('Unexpected Elasticsearch response structure:', response);
      res.status(500).json({ error: 'Unexpected response structure from Elasticsearch' });
    }
  } catch (err) {
    console.error('Error fetching data from Elasticsearch:', err);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
