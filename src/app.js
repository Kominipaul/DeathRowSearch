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
    password: process.env.ELASTIC_PASSWORD,
  },
  tls: {
    ca: fs.readFileSync(path.resolve('..', 'http_ca.crt')), // Resolving path for the certificate
    rejectUnauthorized: false,
  },
});

// Tokenizer: Breaks input into tokens
function tokenize(input) {
    const tokens = [];
    const regex = /\s*(>=|<=|=>|=<|!=|=|>|<|AND|OR|NOT|\(|\)|\w+|\d+)\s*/gi;
    let match;
    while ((match = regex.exec(input)) !== null) {
        const value = match[1];
        if (["AND", "OR", "NOT"].includes(value.toUpperCase())) {
            tokens.push({ type: "LOGICAL", value: value.toUpperCase() });
        } else if (["=", ">", "<", ">=", "<=", "=>", "=<", "!="].includes(value)) {
            tokens.push({ type: "OPERATOR", value });
        } else if (value === "(" || value === ")") {
            tokens.push({ type: "PAREN", value });
        } else if (isNaN(value)) {
            tokens.push({ type: "FIELD", value });
        } else {
            tokens.push({ type: "VALUE", value });
        }
    }
    return tokens;
}

// Parser: Builds an abstract syntax tree (AST)
function parse(tokens) {
    let index = 0;

    function parseExpression() {
        let node = parseTerm();

        while (index < tokens.length && tokens[index].type === "LOGICAL" && tokens[index].value === "OR") {
            const operator = tokens[index++];
            const right = parseTerm();
            node = { type: "LOGICAL", operator: operator.value, left: node, right };
        }
        return node;
    }

    function parseTerm() {
        let node = parseFactor();

        while (index < tokens.length && tokens[index].type === "LOGICAL" && tokens[index].value === "AND") {
            const operator = tokens[index++];
            const right = parseFactor();
            node = { type: "LOGICAL", operator: operator.value, left: node, right };
        }
        return node;
    }

    function parseFactor() {
        if (tokens[index].type === "LOGICAL" && tokens[index].value === "NOT") {
            index++;
            const node = parseFactor();
            return { type: "LOGICAL", operator: "NOT", operand: node };
        }

        if (tokens[index].type === "PAREN" && tokens[index].value === "(") {
            index++;
            const node = parseExpression();
            if (tokens[index].type === "PAREN" && tokens[index].value === ")") {
                index++;
                return node;
            } else {
                throw new Error("Mismatched parentheses");
            }
        }

        return parseComparison();
    }

    function parseComparison() {
        const field = tokens[index++].value;
        let operator = tokens[index++].value;
        if (operator === "=>") operator = ">=";
        if (operator === "=<") operator = "<=";
        const value = tokens[index++].value;
        return { type: "COMPARISON", field, operator, value };
    }

    return parseExpression();
}

// Translator: Converts AST to Elasticsearch query
function translateToElastic(node) {
  if (node.type === "COMPARISON") {
    const { field, operator, value } = node;

    // Use match for case-insensitive equality
    if (operator === "=") return { match: { [field]: value } };

    // Must_not for inequality with match query
    if (operator === "!=") return {
        bool: {
            must_not: {
                match: { [field]: value }
            }
        }
    };

    // Range queries remain the same
    if (operator === ">") return { range: { [field]: { gt: value } } };
    if (operator === "<") return { range: { [field]: { lt: value } } };
    if (operator === ">=") return { range: { [field]: { gte: value } } };
    if (operator === "<=") return { range: { [field]: { lte: value } } };
  }

    if (node.type === "LOGICAL") {
        if (node.operator === "AND") {
            return { bool: { must: [translateToElastic(node.left), translateToElastic(node.right)] } };
        }
        if (node.operator === "OR") {
            return { bool: { should: [translateToElastic(node.left), translateToElastic(node.right)] } };
        }
        if (node.operator === "NOT") {
            return { bool: { must_not: translateToElastic(node.operand) } };
        }
    }
}

// Main Function: Combines everything to process user input
function buildElasticQuery(input) {
    const tokens = tokenize(input);
    const ast = parse(tokens);
    return { query: translateToElastic(ast) };
}

// API endpoint to fetch data from Elasticsearch

app.get('/api/statements', async (req, res) => {
    console.log('Query Parameters:', req.query); // Log all query parameters
    const { filter, from, size } = req.query;
    
    console.log('Filter:', filter); // Log the `filter` parameter

    if (!filter) {
        return res.status(400).json({ error: 'Filter parameter is required' });
    }

    try {
        // Use the buildElasticQuery function to convert the filter into an Elasticsearch query
        const esQuery = buildElasticQuery(filter);

        // Log the Elasticsearch query in the terminal before executing it
        console.log('Elasticsearch query:', JSON.stringify(esQuery, null, 2));

        // Perform the search query with the pagination (from and size)
        const response = await esClient.search({
            index: indexName,
            body: esQuery,
            from: from || 0,   // Pagination: starting point (default to 0)
            size: size || 10,  // Pagination: page size (default to 10)
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
