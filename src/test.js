function translateQuery(expression) {
  const operators = {
    "!=": "must_not",
    ">": "gt",
    "<": "lt",
    ">=": "gte",
    "<=": "lte",
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
          should: clauses.map(parseExpression)
        }
      };
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

// Example usage
const expression0 = "Victims = 1 OR Age > 20 AND Age < 40";
const expression1 = "Age > 20 AND Age < 40 AND Race = Hispanic OR Victims != 1";
const query = translateQuery(expression0);
const query1 = translateQuery(expression1);



// Log the resulting query
//console.log(JSON.stringify(query, null, 2));
console.log(JSON.stringify(query, null, 2));
