import express from 'express';
import fs from 'fs';
import { Client } from '@elastic/elasticsearch';
import path from 'path';
import { indexDataFromCSV } from './index_data.js';
import { fileURLToPath } from 'url';

const app = express();
const port = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const csvFilePath = path.join(__dirname, 'Texas_Last_Statement.csv'); // Adjust path if necessary
const indexName = 'prisoners';

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

// Translate function
function translateQuery(expression) {
  const operators = {
    "!=": "must_not",
    ">=": "gte",
    "<=": "lte",
    ">": "gt",
    "<": "lt",
    "=": "term"
  };

  function parseExpression(expression) {
    // Handle parentheses for precedence
    if (expression.includes("(")) {
      const stack = [];
      let start = -1;

      for (let i = 0; i < expression.length; i++) {
        if (expression[i] === "(") {
          if (start === -1) start = i;
          stack.push(i);
        } else if (expression[i] === ")") {
          stack.pop();
          if (stack.length === 0) {
            const inner = expression.substring(start + 1, i);
            const parsedInner = parseExpression(inner);
            const before = expression.substring(0, start);
            const after = expression.substring(i + 1);
            return parseExpression(before + `__P${start}__` + after);
          }
        }
      }
    }

    // Handle OR
    if (expression.includes(" OR ")) {
      const clauses = expression.split(" OR ").map(clause => clause.trim());
      return {
        bool: {
          should: clauses.map(parseExpression)  // Place clauses under 'should' in the query
        }
      };
    }

    // Handle AND
    if (expression.includes(" AND ")) {
      const clauses = expression.split(" AND ").map(clause => clause.trim());
      return {
        bool: {
          must: clauses.map(parseExpression)  // Place clauses under 'must' in the query
        }
      };
    }

    // Parse individual condition
    return parseCondition(expression.trim(), operators);
  }

  function parseCondition(condition, operators) {
    for (const [op, esOp] of Object.entries(operators)) {
      if (condition.includes(op)) {
        const [field, value] = condition.split(op).map(str => str.trim());
        const formattedValue = value.replace(/['"]/g, ""); // Remove quotes

        if (esOp === "term") {
          return { term: { [field]: formattedValue } };
        } else if (esOp === "must_not") {
          return { bool: { must_not: { term: { [field]: formattedValue } } } };
        } else {
          return { range: { [field]: { [esOp]: isNaN(formattedValue) ? formattedValue : parseFloat(formattedValue) } } };
        }
      }
    }
    throw new Error(`Unsupported condition: ${condition}`);
  }

  // Parse the full expression
  return parseExpression(expression);
}

// API endpoint to fetch data from Elasticsearch

app.get('/api/statements', async (req, res) => {
  console.log('Query Parameters:', req.query); // Log all query parameters
  const { filter } = req.query;

  console.log('Filter:', filter); // Log the `filter` parameter

  if (!filter) {
    return res.status(400).json({ error: 'Filter parameter is required' });
  }

  try {
    // Use the translateQuery function to convert the filter into an Elasticsearch query
    const esQuery = translateQuery(filter);

    console.log('Elasticsearch query:', JSON.stringify(esQuery, null, 2));

    // Build Elasticsearch query body
    const queryBody = {
      query: esQuery,
    };

    // Perform the search query
    const response = await esClient.search({
      index: indexName,
      body: queryBody,
    });

    // Check if we have hits in the response
    if (response?.hits?.hits?.length > 0) {
      // Send back the hits as the response
      res.json(response.hits.hits);
    } else {
      // If no results were found, return 404 with an error message
      res.status(404).json({ error: 'No results found' });
    }
  } catch (err) {
    // Handle any errors that occur during the search
    console.error('Error fetching data from Elasticsearch:', err);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

// Index the data from CSV
indexDataFromCSV(csvFilePath, indexName);

// Serve index.html for the root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Start the server and listen on the specified port
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
