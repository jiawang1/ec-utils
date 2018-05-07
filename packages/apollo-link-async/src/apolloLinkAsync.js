import { ApolloLink } from 'apollo-link';
import Observable from 'zen-observable';
import { graphql } from 'graphql-anywhere/lib/async';
import utils from './utils';

/**
 *  derective troop supports three parameter:
 *  type: troop resource type
 *  command: troop command
 *  id: resource id for response of mutation
 */
const troop = {};
['type', 'command', 'id'].forEach(key => {
  troop[key] = info => info.directives && info.directives.troop && info.directives.troop[key];
});

const isQueryResult = Symbol.for('isQueryResult');

const markAsQueryResult = obj => {
  if (utils.isObject(obj) && !obj[isQueryResult]) {
    Object.defineProperty(obj, isQueryResult, {
      value: true
    });
  } else if (utils.isArray(obj)) {
    obj.map(markAsQueryResult);
  }
  return obj;
};

/**
 *  this method used to generate troop style query string
 * @param  {} selections : graphql AST selections. should include all query fields
 * @param  {} parent : parent data object
 */
export const constructTroopQuery = (selections, parent) => {
  if (!selections) return parent;

  let hasSibling = false;
  return selections.reduce((str, field) => {
    if (field.name.value === '__typename') return str;
    let query = str;
    if (field.selectionSet) {
      if (hasSibling) {
        query = `${query},${parent}.${field.name.value}`;
      } else {
        hasSibling = true;
        query = `${query}.${field.name.value}`;
      }
      return constructTroopQuery(field.selectionSet.selections, query);
    }
    return query;
  }, parent);
};

/**
 * @param  {} query
 * @param  {} field
 */
export const getSelection = (query, field) => {
  let selection;
  query.definitions.some(def => {
    if (def.selectionSet && def.selectionSet.selections) {
      return def.selectionSet.selections.some(sel => {
        if (sel.name.value === field) {
          selection = sel;
          return true;
        }
        return false;
      });
    }
    return false;
  });
  return selection;
};

/**
 * @param  {} directives
 */

export const getTypeFromDirective = directives => {
  let type = null;
  directives.some(_dir => {
    if (_dir.name.value === 'troop') {
      return _dir.arguments.some(arg => {
        if (arg.name.value === 'type') {
          type = arg.value.value;
          return true;
        }
        return false;
      });
    }
    return false;
  });
  return type;
};

const adapterCheck = adapter =>
  !!adapter && typeof adapter.query === 'function' && typeof adapter.mutate === 'function';
/**
 * @param  {} resolvers : customize graphql resolvers , used to supply data for data type or fields.
 *                        This resolver has higher priority than default resolver.
 * @param  {} graphqlAdapter : request client shoudl provide methods query and mutate
 */
const createAsyncLink = (graphqlAdapter, resolvers = {}) => {
  if (!adapterCheck(graphqlAdapter)) {
    throw new Error('graphqlAdapter should be an object with method query and mutate');
  }
  const schema = { types: [] };

  const defaultQueryResolver = async (fieldName, rootValue, args, { currentContext, query }, info) => {
    const id = args && args.id;
    if (!id) return null;

    const prefix = troop.type(info) || fieldName;
    const selection = getSelection(query, fieldName);
    const condition = constructTroopQuery(selection.selectionSet.selections, '');
    let __query = '';
    if (Array.isArray(id)) {
      __query = id.map(_id => `${prefix}!${_id}${condition}`).join('|');
    } else {
      __query = `${prefix}!${id}${condition}`;
    }
    const result = await graphqlAdapter.query(__query, currentContext);
    return markAsQueryResult(result);
  };

  const readCacheByNormalizeKey = (cache, key) => {
    if (cache && cache.data && cache.data.data) {
      return cache.data.data[key];
    }
    return null;
  };

  const getCommandFromCache = (cache, fieldName) => {
    const commandCache = readCacheByNormalizeKey(cache, 'command:command!*');

    if (commandCache && commandCache.results) {
      const {
        results: { json }
      } = commandCache; // eslint-disable-line
      return json ? json[fieldName] : null;
    }
    console.log('No troop command found in cache'); // eslint-disable-line
    return null;
  };

  const defaultMutationResolver = async (
    fieldName,
    rootValue,
    args,
    { currentContext, query, cache },
    info
  ) => {
    if (cache && cache.data && cache.data.data) {
      const commandKey = troop.command(info);
      const command = getCommandFromCache(cache, commandKey);
      const mutationSelection = getSelection(query, fieldName);
      const body = mutationSelection.arguments.reduce(
        (_body, arg) => Object.assign({}, _body, { [arg.name.value]: args[arg.name.value] }),
        {}
      );
      if (command) {
        const res = await graphqlAdapter.mutate(command, body, currentContext);
        const queryType = troop.type(info);
        if (queryType) {
          const id = troop.id(info);
          if (id) {
            /** both queryType and ID supplied will trigger query again */
            const querySel = { ...mutationSelection, name: { kind: 'name', value: queryType } };
            const selectionSet = { kind: 'SelectionSet', selections: [querySel] };

            const def = {
              ...query.definitions[0],
              kind: 'name',
              value: queryType,
              operation: 'query',
              selectionSet
            };

            const folkQuery = { definitions: [def], kind: 'Document' };
            // eslint-disable-next-line
            return resolver(queryType, {}, { id }, { currentContext, query: folkQuery, cache }, {});
          }
          /** only queryType supplied, this case should be data returned by mutation, res should
           * include all data required by mutation, so just put res as root to construct result
           */
          // eslint-disable-next-line
          return resolver(queryType, { queryType: res }, { id }, { currentContext, cache }, {});
        }
        return res || null; // must no undefined return
      }
      throw new Error('no troop command found in memory');
    }
    return null;
  };

  const defaultResolver = (fieldName, rootValue, args, context, info) => {
    if (context.query.definitions[0].operation === 'query') {
      return defaultQueryResolver(fieldName, rootValue, args, context, info);
    }
    return defaultMutationResolver(fieldName, rootValue, args, context, info);
  };

  const __generate = oService => {
    Object.keys(oService).forEach(key => {
      const _obj = { name: key };
      if (utils.isObject(oService[key])) {
        _obj.type = 'Object';
        schema.types.push(_obj);
        __generate(oService[key]);
      } else if (utils.isFunction(oService[key])) {
        _obj.type = 'Function';
        schema.types.push(_obj);
      }
    });
  };
  const generateServices = oService => {
    if (schema.isReady) return schema;
    __generate(oService);
    schema.isReady = true;
    return schema;
  };

  const resolver = (fieldName, rootValue = {}, args, context, info) => {
    if (fieldName === '__schema') return generateServices(resolvers);
    const fieldValue = rootValue[fieldName];

    // If fieldValue is defined, server returned a value
    if (fieldValue !== undefined) return markAsQueryResult(fieldValue);
    // do not resolve __typename in resolver, just generate __typename after this method
    if (fieldName === '__typename') return null;

    // Look for the field in the custom resolver mapresolvers
    let resolverMap = null;
    const { query } = context;
    if (!query) {
      throw new Error(`rootValue does not include fieldName : ${fieldName}`);
    }

    if (query.definitions[0].operation === 'query') {
      resolverMap = resolvers.Query || resolvers.query;
    } else {
      resolverMap = resolvers.Mutation || resolvers.mutation;
    }

    if (resolverMap && resolverMap[fieldName]) {
      return resolverMap[fieldName](rootValue, args, context, info);
    }
    /**
     * nested opreation is not support, choose customize resolver way,
     * current field assigned to null
     */
    if (rootValue[isQueryResult]) {
      return null;
    }
    return defaultResolver(fieldName, rootValue, args, context, info);
  };

  const findDefination = (name, defs) => defs.find(def => def.name.value === name);

  const generateType = (data, definations, type) => {
    if (Array.isArray(data)) {
      data.forEach(__data => {
        if (utils.isObject(__data)) {
          // eslint-disable-next-line
          __data.__typename = type;
          generateType(__data, definations);
        }
      });
    } else {
      Object.keys(data).forEach(k => {
        if (Array.isArray(data[k]) || utils.isObject(data[k])) {
          const def = findDefination(k, definations);
          const troopType = getTypeFromDirective(def.directives) || k;

          if (utils.isObject(data[k])) {
            // eslint-disable-next-line no-param-reassign
            data[k].__typename = troopType;
          }
          /* for some dynamic fields case ( troop command ), selectionSet maybe not match with data
              so here must check def.selectionSet
           */
          if (def.selectionSet) {
            generateType(data[k], def.selectionSet.selections, troopType);
          }
        }
      });
    }
  };

  return new class AsyncLink extends ApolloLink {
    request(operation) {
      const { setContext, query } = operation;
      let context = null;
      // context = Object.assign({}, operation.getContext(), { query });
      context = { ...operation.getContext(), query };
      setContext(context);
      return new Observable(observer => {
        const observerErrorHandler = observer.error.bind(observer);
        const sub = Observable.of({
          data: {}
        }).subscribe({
          next: ({ data, errors }) => {
            graphql(resolver, operation.query, data, operation.getContext(), operation.variables)
              .then(nextData => {
                generateType(nextData, operation.query.definitions[0].selectionSet.selections);
                observer.next({
                  data: nextData,
                  errors
                });
                observer.complete();
              })
              .catch(err => observerErrorHandler(err));
          },
          error: observerErrorHandler
        });

        return () => {
          if (sub) sub.unsubscribe();
        };
      });
    }
  }();
};

export default createAsyncLink;
