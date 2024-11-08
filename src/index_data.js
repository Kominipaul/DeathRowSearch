const { Client } = require('@elastic/elasticsearch');
const fs = require('fs');
const csv = require('csv-parser');

const esClient = new Client({
  node: 'https://localhost:9200', // Secure connection (https)
  auth: {
    username: 'elastic', // Elasticsearch username
    password: 'cSCbnHyH-DOaUNQiIOXx', // Loaded password
  },
  tls: {
    ca: fs.readFileSync('../http_ca.crt'), // Path to your SSL certificate
    rejectUnauthorized: false, // May be required for self-signed certs
  },
});

// Function to index CSV data into Elasticsearch
const indexDataFromCSV = async (csvFilePath, indexName) => {
  const results = [];
  
  fs.createReadStream(csvFilePath)
    .pipe(csv())
    .on('data', (row) => results.push(row))
    .on('end', async () => {
      // Prepare the bulk request body
      const body = results.flatMap((doc) => [
        { index: { _index: indexName } },
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
const csvFilePath = 'Texas_Last_Statement.csv';
const indexName = 'prisoners';

// Call the function to index the data
indexDataFromCSV(csvFilePath, indexName);
