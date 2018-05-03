const __isType = type => oTarget => Object.prototype.toString.call(oTarget).replace(/^.*\s(.*)]$/, '$1') === type;

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
const oType = {};
['String', 'Object', 'Number', 'Undefined', 'Function', 'Array', 'Null', 'Boolean'].forEach(_type => {
  oType[`is${_type}`] = __isType(_type);
});

const stringifyPrimitive = v => {
  if (oType.isString(v)) {
    return v;
  } else if (oType.isBoolean(v)) {
    return v ? 'true' : 'false';
  } else if (oType.isNumber(v)) {
    return isFinite(v) ? v : ''; // eslint-disable-line
  }
  return '';
};

oType.encode = (obj, sep, eq) => {
  const _sep = sep || '&';
  const _eq = eq || '=';
  const _obj = obj === null ? undefined : obj;

  if (oType.isObject(_obj)) {
    return Object.keys(_obj)
      .map(k => {
        const ks = encodeURIComponent(stringifyPrimitive(k)) + _eq;
        if (oType.isArray(_obj[k])) {
          return _obj[k].map(v => ks + encodeURIComponent(stringifyPrimitive(v))).join(_sep);
        }
        return ks + encodeURIComponent(stringifyPrimitive(_obj[k]));
      })
      .join(_sep);
  }
  return encodeURIComponent(stringifyPrimitive(_obj));
};

oType.decode = (str, sep = '&', eq = '=', options) => {
  const obj = {};

  if (!oType.isString(str) || str.length === 0) {
    return obj;
  }

  const regexp = /\+/g;
  const _aStr = str.split(sep);

  const maxKeys = options && oType.isNumber(options.maxKeys) ? options.maxKeys : 1000;

  let len = _aStr.length;
  // maxKeys <= 0 means that we should not limit keys count
  if (maxKeys > 0 && len > maxKeys) {
    len = maxKeys;
  }

  for (let i = 0; i < len; ++i) {
    const x = _aStr[i].replace(regexp, '%20');
    const idx = x.indexOf(eq);
    let kstr;
    let vstr;

    if (idx >= 0) {
      kstr = x.substr(0, idx);
      vstr = x.substr(idx + 1);
    } else {
      kstr = x;
      vstr = '';
    }

    const k = decodeURIComponent(kstr);
    const v = decodeURIComponent(vstr);

    // eslint-disable-next-line
    if (!obj.hasOwnProperty(k)) {
      obj[k] = v;
    } else if (oType.isArray(obj[k])) {
      obj[k].push(v);
    } else {
      obj[k] = [obj[k], v];
    }
  }

  return obj;
};

export default oType;
