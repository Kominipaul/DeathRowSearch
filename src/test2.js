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
        if (operator === "=") return { term: { [field]: value } };
        if (operator === "!=") return { bool: { must_not: { term: { [field]: value } } } };
        if (operator === ">") return { range: { [field]: { gt: value } } };
        if (operator === "<") return { range: { [field]: { lt: value } } };
        if (operator === ">=") return { range: { [field]: { gte: value } } };
        if (operator === "<=") return { range: { [field]: { lte: value } } };
        if (operator === "=>") return { range: { [field]: { gte: value } } };
        if (operator === "=<") return { range: { [field]: { lte: value } } };
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

// Example Usage
const input = "Race != Hispanic OR (Age => 32 AND Victims < 5)";
const elasticQuery = buildElasticQuery(input);

console.log(JSON.stringify(elasticQuery, null, 2));



