import 'whatwg-fetch';
import { parse2AST, ASTRewrite2Query } from './queryParser';
import utils from './utils';

const httpOption = {
  method: 'post',
  credentials: 'same-origin'
};

const queryHeader = {
  'Content-Type': 'application/x-www-form-urlencoded'
};

const commandHeader = {
  'Content-Type': 'application/json'
};

const __serialize = (node, oCache) => {
  let id;
  let value;
  const deserializeCache = oCache;
  let result = node;

  if ('id' in node) {
    id = node.id; // eslint-disable-line
    if (Object.prototype.hasOwnProperty.call(deserializeCache, id)) {
      result = deserializeCache[id];
      if (node.collapsed) {
        return result; // Bypass collapsed object that already exists in cache.
      }
    } else {
      deserializeCache[id] = node; // Reuse ref to node (avoids object creation)
    }
  }

  if (utils.isArray(node)) {
    for (let i = 0, iMax = node.length; i < iMax; i++) {
      value = node[i];
      result[i] =
        utils.isObject(value) || (utils.isArray(value) && value.length !== 0) ? __serialize(value, deserializeCache) : value;
    }
  } else if (utils.isObject(node)) {
    Object.keys(node).forEach(key => {
      if (key === 'id' || (key === 'collapsed' && !result.collapsed)) {
        return;
      }
      value = node[key];
      result[key] =
        utils.isObject(value) || (utils.isArray(value) && value.length !== 0) ? __serialize(value, deserializeCache) : value;
    });
  }
  return result;
};

export const serialize = jsonNode => {
  if (!jsonNode) return jsonNode;
  let oCache = {};
  if (utils.isObject(jsonNode) || (utils.isArray(jsonNode) && jsonNode.length !== 0)) {
    __serialize(jsonNode, oCache);
  } else {
    oCache = jsonNode;
  }
  return oCache;
};

export const __prepareContextURL = (url, troopContext) => {
  if (!troopContext) return url;
  const [_url, queryStr] = url.split('?');
  const queryParam = queryStr ? utils.decode(queryStr) : {};
  const { c: extraContext = '', ...otherParam } = queryParam;
  const contextValues = troopContext.values;
  const contextParams = Object.keys(contextValues).reduce(
    (params, key) =>
      Object.assign(params, {
        [key]: contextValues[key].value
      }),
    {}
  );
  const queryObject = { ...otherParam, c: utils.encode({ ...utils.decode(extraContext), ...contextParams }, '|') };
  return `${_url}?${utils.encode(queryObject)}`;
};

export const troopQuery = async (url, jointQuery, options) => {
  const ids = [];
  const normalizeQuery = jointQuery.split('|').map((query, queryIndex) => {
    const ast = parse2AST(query);
    if (ast.length > 0) {
      // Store raw ID list used to figure out final response
      ids[queryIndex] = ast[0].raw;
    }
    return ASTRewrite2Query(ast);
  });

  const { troopContext, ...__options } = options;
  const __url = __prepareContextURL(url, troopContext);
  __options.headers = __options.headers ? { ...__options.headers, ...queryHeader } : queryHeader;

  const fetchOptions = {
    ...__options,
    ...httpOption,
    body: normalizeQuery.length > 0 ? `q=${encodeURIComponent(normalizeQuery.join('|'))}` : ''
  };
  try {
    const response = await fetch(__url, fetchOptions);
    const json = await response.json();
    const serialObject = serialize(json);
    return ids.map(id => serialObject[id]);
  } catch (err) {
    console.error(err); // eslint-disable-line
    throw err;
  }
};

export const troopCommand = async (url, content, options) => {
  const body = typeof content === 'string' ? content : JSON.stringify(content);
  const { troopContext, ...__options } = options;
  const __url = __prepareContextURL(url, troopContext);
  __options.headers = __options.headers ? { ...__options.headers, ...commandHeader } : commandHeader;
  const fetchOptions = {
    ...__options,
    ...httpOption,
    body
  };
  try {
    const response = await fetch(__url, fetchOptions);
    return response.json();
  } catch (err) {
    console.error(err); // eslint-disable-line
    throw err;
  }
};

export const troopCommandWithObject = async (oCommand, content, troopContext) => {
  const { url } = oCommand;
  return troopCommand(url, content, {
    troopContext,
    headers: { 'content-type': oCommand.contentType }
  });
};
