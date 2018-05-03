const OP_ID = '!';
const OP_PROPERTY = '.';
const OP_PATH = ',';
const OP_QUERY = '|';
const RE_TEXT = /("|')(.*?)\1/;
const TO_RAW = '$2';

/**
 * @param  {} query
 */
export const parse2AST = (query = '') => {
  const _query = query;
  let index;
  const { length } = _query;
  let char;
  let mark = 0;
  let quote = null;
  let operation = null;
  const ast = [];

  // Step through the query
  for (index = 0; index < length; index++) {
    char = _query.charAt(index);

    switch (char) {
      case '"': // Double quote
      case "'": // Single quote
        // Set / unset quote char
        quote = quote === char ? null : char;
        break;

      case OP_ID:
        // Break fast if we're quoted
        if (quote !== null) {
          break;
        }

        // Init new op
        operation = { op: char };
        break;

      case OP_PROPERTY:
      case OP_PATH:
        // Break fast if we're quoted
        if (quote !== null) {
          break;
        }

        // If there's an active op, store TEXT and push on _AST
        if (operation !== null) {
          operation.raw = (operation.text = _query.substring(mark, index)).replace(RE_TEXT, TO_RAW);
          ast.push(operation);
        }

        // Init new op
        operation = { op: char };

        // Set mark
        mark = index + 1;
        break;

      case OP_QUERY:
      case ' ': // Space
      case '\t': // Horizontal tab
      case '\r': // Carriage return
      case '\n': // Newline
        // Break fast if we're quoted
        if (quote !== null) {
          break;
        }
        // If there's an active op, store TEXT and push on _AST
        if (operation !== null) {
          operation.raw = (operation.text = _query.substring(mark, index)).replace(RE_TEXT, TO_RAW);
          ast.push(operation);
        }
        // Reset op
        operation = null;

        // Set mark
        mark = index + 1;
        break;
      default:
    }
  }
  // If there's an active op, store TEXT and push on _AST
  if (operation !== null) {
    operation.raw = (operation.text = _query.substring(mark, length)).replace(RE_TEXT, TO_RAW);
    ast.push(operation);
  }

  return ast;
};

export const ASTRewrite2Query = ast => {
  let result = '';
  let root;
  const { length } = ast;
  // Step through AST
  for (let index = 0; index < length; index++) {
    const operation = ast[index];
    switch (operation.op) {
      case OP_ID:
        // cache root node
        root = operation;
        // If this is the first OP_ID, there's no need to add OP_QUERY
        result += index === 0 ? operation.text : OP_QUERY + operation.text;
        break;

      case OP_PROPERTY:
        result += OP_PROPERTY + operation.text;
        break;
      case OP_PATH:
        if (index !== 0) {
          result += OP_QUERY + root.text;
        }
        break;
      default:
        break;
    }
  }
  return result;
};
