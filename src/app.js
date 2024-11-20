import express from 'express';
import fs from 'fs';
import { Client } from '@elastic/elasticsearch';
import path from 'path';
import {indexDataFromCSV} from './index_data.js' 
import { fileURLToPath } from 'url';

const app = express();
const port = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const csvFilePath = path.join(__dirname, 'Texas_Last_Statement.csv');  // Adjust path if necessary
const indexName = 'prisoners'

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, '..', 'public')));

const esClient = new Client({
  node: 'https://localhost:9200',
  auth: {
    username: 'elastic',
    password: 'cSCbnHyH-DOaUNQiIOXx',
  },
  tls: {
    ca: fs.readFileSync(path.resolve('..', 'http_ca.crt')), // Resolving path for the certificate
    rejectUnauthorized: false,
  },
});


// API endpoint to fetch data from Elasticsearch
app.get('/api/statements', async (req, res) => {
  try {
    const searchTerm = req.query.searchTerm || ''; // Default to empty string if no search term

    // Perform the Elasticsearch search query
    const response = await esClient.search({
      index: indexName,
      body: {
        query: {
          multi_match: {
            query: searchTerm, // Term to search for
            fields: ['LastName'], // Fields to search across
            type: 'best_fields', // Best match search strategy
            fuzziness: 'AUTO', // Allow typo tolerance
          },
        },
      },
    });

    // Log the full response to check its structure
    console.log('Elasticsearch Response:', response);

    // Check if the response contains the search results
    if (response && response.hits && Array.isArray(response.hits.hits) && response.hits.hits.length > 0) {
      // Access the hits and send them back as the response
      res.json(response.hits.hits); // Send back the search results
    } else {
      console.error('No search results found or unexpected Elasticsearch response structure:', response);
      res.status(404).json({ error: 'No results found' });
    }
  } catch (err) {
    console.error('Error fetching data from Elasticsearch:', err);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

indexDataFromCSV(csvFilePath, indexName);

// Serve index.html for the root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});


// Start the server and listen on the specified port
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
