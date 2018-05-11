import 'whatwg-fetch';
import invariant from 'invariant';
import { troopQuery, troopCommand, troopCommandWithObject as postCommandWithObject } from './simpleQuery';
import utils from './utils';

const mimeType = {
  json: 'application/json',
  form: 'application/x-www-form-urlencoded',
  text: 'text/plain',
  all: '*/*'
};

const method = {
  get: 'GET',
  post: 'POST',
  put: 'PUT',
  DELETE: 'DELETE'
};

const logError = err => {
  // eslint-disable-next-line
  console.log(err.stack || err);
};

const __fetch = _method => async (url, option, payload) => {
  invariant(url !== undefined, 'URL must be supplied');
  invariant(option !== undefined, 'HTTP request options must be supplied, ');
  const __url = url;
  const ops = Object.assign(
    {},
    {
      credentials: 'same-origin'
    },
    option,
    { method: _method }
  );

  if (typeof payload !== 'undefined') {
    ops.body = payload;
  }
  try {
    return await fetch(__url, ops);
  } catch (err) {
    logError(err);
    throw err;
  }
};

const get = __fetch(method.get);
const post = __fetch(method.post);
const put = __fetch(method.put);
const DELETE = __fetch(method.DELETE);

const getJson = async (url, option = {}) => {
  const _option = { ...option };
  if (_option.headers) {
    _option.headers.Accept = mimeType.json;
  } else {
    _option.headers = {
      Accept: mimeType.json
    };
  }
  try {
    const response = await get(url, _option);
    return utils.checkStatus(response).json();
  } catch (err) {
    logError(err);
    throw err;
  }
};

/**
 * @param  {} url : requested URL
 * @param  {} body : request body for post
 * @param  {} option : http request options, { headers:{},.... }
 */
const postJson = async (url, body, option = {}) => {
  const _option = { ...option };
  if (_option.headers) {
    _option.headers.Accept = mimeType.json;
    _option.headers['Content-Type'] = mimeType.json;
  } else {
    _option.headers = {
      'Content-Type': mimeType.json,
      Accept: mimeType.json
    };
  }
  try {
    const response = await post(url, _option, typeof body === 'string' ? body : JSON.stringify(body));
    return utils.checkStatus(response).json();
  } catch (err) {
    logError(err);
    throw err;
  }
};

/**
 * @param  {} url : requested URL
 * @param  {} body : request body for post
 * @param  {} option : http request options, { headers:{},.... }
 */
const postForm = async (url, body, option = {}) => {
  invariant(url !== undefined, 'URL must be supplied');
  invariant(body !== undefined, 'HTTP request payload must be supplied');
  const _body = typeof body === 'string' ? body : utils.encode(body);
  const _option = option;
  if (_option.headers) {
    _option.headers['Content-Type'] = mimeType.form;
    _option.headers.Accept = mimeType.all;
  } else {
    _option.headers = {
      'Content-Type': mimeType.form,
      Accept: mimeType.all
    };
  }
  try {
    const response = await post(url, _option, _body);
    return response.json();
  } catch (err) {
    logError(err);
    throw err;
  }
};

const query = (url, resource, options = {}) => troopQuery(url, resource, options);

const postCommand = (url, body, options = {}) => troopCommand(url, body, options);

export default {
  get,
  post,
  put,
  DELETE,
  getJson,
  postJson,
  query,
  postCommand,
  postCommandWithObject,
  postForm
};
