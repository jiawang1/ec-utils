const STARTUPEVENT = 'troop/ready';

const TROOP_CONTEXT = 'troopjs';
const TROOP_HUB = 'troopjs-core/pubsub/hub';

class TroopEventConnector {
  constructor() {
    this.__troopHandler = null;
    this.cache = {
      sub: [],
      pub: []
    };
    this.__troopHandler = this.__getTroopEventhandler();
    if (!this.__troopHandler) {
      const __handler = () => {
        this.__registerTroopHandler();
      };
      if (window.addEventListener) {
        document.addEventListener(STARTUPEVENT, __handler, false);
      } else if (window.attachEvent) {
        document.attachEvent(`on${STARTUPEVENT}`, __handler);
      } else {
        throw new Error('too old browser, can not support');
      }
    } else {
      this.__initTroopEvent();
    }
  }

  __getTroopEventhandler() {
    let handler = null;
    if (window.requirejs && window.requirejs.s && window.requirejs.s.contexts) {
      Object.keys(window.requirejs.s.contexts).some(key => {
        if (key.search(TROOP_CONTEXT) !== 0) {
          return false;
        }
        if (window.requirejs.s.contexts[key][TROOP_HUB]) {
          handler = window.requirejs.s.contexts[key][TROOP_HUB];
          return true;
        }
        return false;
      });
    }
    return handler;
  }

  __registerTroopHandler() {
    this.__troopHandler = this.__getTroopEventhandler();
    this.__initTroopEvent();
  }

  __initTroopEvent() {
    this.cache.sub.forEach(sub => {
      this.__sub(sub.eventName, this.__troopHandler, sub.cb);
    });
    this.cache.sub = [];
    this.cache.pub.forEach(pub => {
      this.__troopHandler
        .publish(pub.eventName, pub.data)
        .then(args => pub.res(args))
        .catch(err => pub.rej(err));
    });
    this.cache.pub = [];
  }

  isConnected() {
    return !!this.__troopHandler;
  }

  __sub(eventName, context, cb) {
    const MEMORY_PREFIX = /^hub(:memory)?\//;
    const _eventName = eventName.replace(MEMORY_PREFIX, '');

    this.__troopHandler.subscribe(_eventName, context, cb);

    if (MEMORY_PREFIX.test(eventName.trim())) {
      this.__troopHandler.republish(_eventName, false, context, cb);
    }
  }

  subscribe(eventName, cb) {
    if (this.isConnected()) {
      this.__sub(eventName, this.__troopHandler, cb);
    } else {
      this.cache.sub.push({
        eventName,
        cb
      });
    }
  }
  publish(eventName, data) {
    if (this.isConnected()) {
      return this.__troopHandler.publish(eventName, data);
    }
    return new Promise((res, rej) => {
      this.cache.pub.push({
        eventName,
        data,
        res,
        rej
      });
    });
  }
  unsubscribe(eventName, cb) {
    let inx = -1;
    if (
      this.cache.sub.some((sub, index) => {
        inx = index;
        return eventName === sub.eventName && (cb === undefined || cb === sub.cb);
      })
    ) {
      this.cache.splice(inx, 1);
    } else {
      this.__troopHandler.unsubscribe(eventName, this.__troopHandler, cb);
    }
  }
}

let tc = null;

const getTroopConnector = () => {
  if (!tc) {
    tc = new TroopEventConnector();
  }
  return tc;
};

export default getTroopConnector;
