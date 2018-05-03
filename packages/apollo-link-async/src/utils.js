const __isType = type => oTarget =>
  Object.prototype.toString.call(oTarget).replace(/^\[.*\s(.*)\]$/, '$1') === type;

/**
 * export functions:
 *  isString
 *  isObject
 *  isNumber
 *  isUndefined
 *  isFunction
 *  isArray
 *  isNull
 */
const __utils = {};
['String', 'Object', 'Number', 'Undefined', 'Function', 'Array', 'Null', 'Boolean'].forEach(_type => {
  __utils[`is${_type}`] = __isType(_type);
});

const generateSelectionSetFromObj = obj => {
  if (
    typeof obj === 'number' ||
    typeof obj === 'boolean' ||
    typeof obj === 'string' ||
    typeof obj === 'undefined' ||
    obj === null
  ) {
    // No selection set here
    return null;
  }
  if (Array.isArray(obj)) {
    return generateSelectionSetFromObj(obj[0]);
  }

  const selections = [];
  const selectionSet = {
    kind: 'SelectionSet',
    selections
  };

  Object.keys(obj).forEach(key => {
    const field = {
      kind: 'Field',
      name: {
        kind: 'Name',
        value: key
      }
    };
    const nestedSelSet = generateSelectionSetFromObj(obj[key]);

    if (nestedSelSet) {
      field.selectionSet = nestedSelSet;
    }
    selections.push(field);
  });

  return selectionSet;
};

const generateQueryFromObject = obj => {
  const operation = {
    kind: 'OperationDefinition',
    operation: 'query',
    name: {
      kind: 'Name',
      value: 'GeneratedClientQuery'
    },
    selectionSet: generateSelectionSetFromObj(obj)
  };

  return {
    kind: 'Document',
    definitions: [operation]
  };
};

const utils = {
  ...__utils,
  generateQueryFromObject
};

export default utils;
