function translateQuery(expression) {
  const operators = {
    "!=": "must_not",
    ">=": "gte",
    "<=": "lte",
    "=>": "gte",
    "=<": "lte",
    ">": "gt",
    "<": "lt",
    "=": "term"
  };

  function parseExpression(expression) {
    // Handle parentheses recursively
    while (expression.includes("(")) {
      const start = expression.lastIndexOf("(");
      const end = expression.indexOf(")", start);
      if (end === -1) throw new Error("Mismatched parentheses in expression.");

      const inner = expression.substring(start + 1, end);
      const parsedInner = parseExpression(inner);  // Recursively parse inner expression

      // Replace the entire parenthesis with parsed object (don't stringify it)
      expression = expression.substring(0, start) + JSON.stringify(parsedInner) + expression.substring(end + 1);
    }

    // Handle AND
    if (expression.includes(" AND ")) {
      const clauses = expression.split(" AND ").map(clause => clause.trim());
      return {
        bool: {
          must: clauses.map(parseExpression)
        }
      };
    }

    // Handle OR
    if (expression.includes(" OR ")) {
      const clauses = expression.split(" OR ").map(clause => clause.trim());
      return {
        bool: {
          should: clauses.map(parseExpression)
        }
      };
    }

    // Handle NOT
    if (expression.startsWith("NOT ")) {
      const operand = expression.substring(4).trim();
      return {
        bool: {
          must_not: parseExpression(operand)
        }
      };
    }

    // Parse individual condition
    return parseCondition(expression.trim());
  }

  function parseCondition(condition) {
    // Ensure that condition is not already parsed object
    if (typeof condition === 'object') {
      return condition; // Already parsed object, just return it
    }

    for (const [op, esOp] of Object.entries(operators)) {
      if (condition.includes(op)) {
        const [field, value] = condition.split(op).map(str => str.trim());
        if (!field || !value) throw new Error(`Invalid condition: "${condition}"`);

        const formattedValue = value.replace(/['"]/g, ""); // Remove quotes

        if (esOp === "term") {
          return { term: { [field]: formattedValue } };
        } else if (esOp === "must_not") {
          return { bool: { must_not: { term: { [field]: formattedValue } } } };
        } else {
          return {
            range: {
              [field]: {
                [esOp]: isNaN(formattedValue) ? formattedValue : parseFloat(formattedValue)
              }
            }
          };
        }
      }
    }
    throw new Error(`Unsupported condition: "${condition}"`);
  }

  return parseExpression(expression);
}

const input = 'NOT (Race != Hispanic OR Age => 32 AND Victims < 5)';
const query = translateQuery(input);
console.log(JSON.stringify(query, null, 2));
