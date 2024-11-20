import { Client } from '@elastic/elasticsearch';
import fs from 'fs';
import csv from 'csv-parser';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the __filename equivalent and __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Correct the path to the CSV file (ensure it's in the same directory or adjust accordingly)
const csvFilePath = path.join(__dirname, 'Texas_Last_Statement.csv');  // Adjust path if necessary
console.log('CSV file path:', csvFilePath);  // Print out to verify the path

// Set up the Elasticsearch client
const certPath = path.join(__dirname, '..', 'http_ca.crt');  // Adjust path if necessary

const esClient = new Client({
  node: 'https://localhost:9200', // Secure connection (https)
  auth: {
    username: 'elastic',
    password: 'cSCbnHyH-DOaUNQiIOXx',
  },
  tls: {
    ca: fs.readFileSync(certPath), // Use correct certificate path
    rejectUnauthorized: false,  // Optional: set to true if you want to enforce certificate validation
  },
});

// Function to index CSV data into Elasticsearch
export const indexDataFromCSV = async (csvFilePath, indexName) => {
  const results = [];
  
  fs.createReadStream(csvFilePath)
    .pipe(csv())
    .on('data', (row) => results.push(row))
    .on('end', async () => {
      // Prepare the bulk request body with unique _id (TDCJNumber)
      const body = results.flatMap((doc) => [
        { index: { _index: indexName, _id: doc.TDCJNumber } },  // Use TDCJNumber as the unique ID
        doc,
      ]);

      try {
        const bulkResponse = await esClient.bulk({ refresh: true, body });

        // Log the full bulk response for debugging
        console.log('Bulk Response:', bulkResponse);

        // Access errors directly from the bulk response (not through body)
        if (bulkResponse.errors) {
          console.error('Bulk indexing errors occurred:', bulkResponse.errors);
        } else {
          console.log('Data indexed successfully');
        }
      } catch (err) {
        console.error('Error indexing data:', err);
      }
    });
};

// Path to your CSV file and Elasticsearch index name
const indexName = 'prisoners'; // DeathRows

