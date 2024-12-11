import { Client } from '@elastic/elasticsearch';
import fs from 'fs';
import csv from 'csv-parser';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __filename and __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CSV and certificate paths
const csvFilePath = path.join(__dirname, 'Texas_Last_Statement.csv');
const certPath = path.join(__dirname, '..', 'http_ca.crt');

// Validate file paths
if (!fs.existsSync(csvFilePath)) {
  console.error('CSV file not found:', csvFilePath);
  process.exit(1);
}
if (!fs.existsSync(certPath)) {
  console.error('Certificate file not found:', certPath);
  process.exit(1);
}

// Elasticsearch client setup
const esClient = new Client({
  node: 'https://localhost:9200',
  auth: {
    username: 'elastic',
    password: process.env.ELASTIC_PASSWORD || 'changeme', // Default if not provided
  },
  tls: {
    ca: fs.readFileSync(certPath),
    rejectUnauthorized: false,
  },
});

// Function to read CSV and clean data
const readCSV = async (csvFilePath) => {
  const results = [];
  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => {
        // Data cleaning and validation
        row.Age = parseInt(row.Age, 10) || null;
        row.TDCJNumber = row.TDCJNumber?.trim() || null;
        row.Race = row.Race?.trim() || 'Unknown';
        if (row.TDCJNumber) results.push(row); // Only push valid rows
      })
      .on('end', () => resolve(results))
      .on('error', (err) => reject(err));
  });
};

// Function to bulk index data into Elasticsearch
const bulkIndexData = async (indexName, data) => {
  const chunkSize = 500; // Define batch size for indexing
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize).flatMap((doc) => [
      { index: { _index: indexName, _id: doc.TDCJNumber } },
      doc,
    ]);

    try {
      const bulkResponse = await esClient.bulk({ refresh: true, body: chunk });
      if (bulkResponse.errors) {
        // Identify and log failed documents
        const erroredDocs = bulkResponse.items.filter((item) => item.index?.error);
        console.error('Errors occurred in the following documents:', JSON.stringify(erroredDocs, null, 2));
      } else {
        console.log(`Successfully indexed chunk ${i / chunkSize + 1}`);
      }
    } catch (err) {
      console.error(`Error indexing chunk ${i / chunkSize + 1}:`, err);
    }
  }
};

// Main function to read, process, and index data
export const indexDataFromCSV = async (csvFilePath, indexName) => {
  console.log('Starting CSV data indexing...');
  try {
    const data = await readCSV(csvFilePath);
    console.log(`Successfully read ${data.length} records from the CSV.`);
    await bulkIndexData(indexName, data);
    console.log('Data indexing completed successfully.');
  } catch (err) {
    console.error('Error during indexing process:', err);
  }
};

// Index name
const indexName = 'prisoners'; // Adjust as needed

// Execute the indexing
indexDataFromCSV(csvFilePath, indexName);

// Edit Record
export const parseEditCommand = (command) => {
  const regex = /TDCJ = (\d+)\s*\((.*?)\);/;
  const match = command.match(regex);
  
  if (!match) {
    throw new Error("Invalid command format.");
  }
  
  const tdcjNumber = match[1];
  const updates = match[2].split(',').reduce((acc, pair) => {
    const [key, value] = pair.split('=').map((str) => str.trim());
    if (key && value) {
      // Allow quoted values to handle strings with spaces (like "White")
      acc[key] = value.startsWith('"') && value.endsWith('"')
        ? value.slice(1, -1) // Remove quotes
        : value; // Otherwise it's treated as a number or boolean
    }
    return acc;
  }, {});
  
  return { tdcjNumber, updates };
};


export const updateElasticsearchDocument = async (tdcjNumber, updates, indexName) => {
  try {
    const updateBody = { doc: updates };
    const response = await esClient.update({
      index: indexName,
      id: tdcjNumber,
      body: updateBody,
      refresh: true,
    });
    console.log(`Document with TDCJNumber ${tdcjNumber} updated in Elasticsearch.`);
    return response;
  } catch (err) {
    console.error('Error updating document in Elasticsearch:', err);
    throw err;
  }
};


export const updateCSV = (csvFilePath, tdcjNumber, updates) => {
  return new Promise((resolve, reject) => {
    const results = [];
    let updated = false;

    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => {
        if (row.TDCJNumber === tdcjNumber) {
          // Update the row with the new values (and handle field renaming)
          Object.keys(updates).forEach((field) => {
            // If the field exists, update it, otherwise add a new one
            if (row.hasOwnProperty(field)) {
              row[field] = updates[field];
            } else {
              row[field] = updates[field]; // Add the new field if not found
            }
          });
          updated = true;
        }
        results.push(row);
      })
      .on('end', () => {
        if (updated) {
          // Write the updated data back to the CSV file
          const headers = Object.keys(results[0]);
          const csvOutput = [
            headers.join(','), // CSV header
            ...results.map((row) => headers.map((field) => row[field]).join(','))
          ].join('\n');
          
          fs.writeFileSync(csvFilePath, csvOutput, 'utf8');
          console.log(`CSV file updated successfully.`);
        } else {
          console.error(`TDCJNumber ${tdcjNumber} not found in the CSV.`);
        }
        resolve();
      })
      .on('error', reject);
  });
};


export const editRecord = async (command, csvFilePath, indexName) => {
  try {
    // Parse the edit command
    const { tdcjNumber, updates } = parseEditCommand(command);

    // Update Elasticsearch document
    await updateElasticsearchDocument(tdcjNumber, updates, indexName);

    // Update CSV file
    await updateCSV(csvFilePath, tdcjNumber, updates);

    console.log('Record edited successfully.');
  } catch (err) {
    console.error('Error editing the record:', err);
  }
};



// DELETE Command
export const parseDeleteCommand = (command) => {
  const regex = /TDCJ = (\d+);?/;
  const match = command.match(regex);

  if (!match) {
    throw new Error("Invalid command format.");
  }

  const tdcjNumber = match[1];
  return tdcjNumber;
};

export const deleteFromElasticsearch = async (tdcjNumber, indexName) => {
  try {
    const response = await esClient.delete({
      index: indexName,
      id: tdcjNumber,
    });

    if (response.result === 'not_found') {
      throw new Error(`Document with TDCJNumber ${tdcjNumber} not found in Elasticsearch.`);
    }

    console.log(`Document with TDCJNumber ${tdcjNumber} deleted from Elasticsearch.`);
  } catch (err) {
    console.error('Error deleting document from Elasticsearch:', err);
    throw err;
  }
};

export const deleteFromCSV = async (csvFilePath, tdcjNumber) => {
  const results = [];
  let deleted = false;

  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => {
        if (row.TDCJNumber === tdcjNumber) {
          deleted = true; // Skip this record
        } else {
          results.push(row);
        }
      })
      .on('end', () => {
        if (deleted) {
          const headers = Object.keys(results[0]);
          const csvOutput = [
            headers.join(','), // CSV header
            ...results.map((row) => headers.map((field) => row[field]).join(','))
          ].join('\n');

          fs.writeFileSync(csvFilePath, csvOutput, 'utf8');
          console.log(`CSV file updated: Record with TDCJNumber ${tdcjNumber} deleted.`);
        } else {
          console.error(`TDCJNumber ${tdcjNumber} not found in the CSV.`);
        }
        resolve();
      })
      .on('error', reject);
  });
};



