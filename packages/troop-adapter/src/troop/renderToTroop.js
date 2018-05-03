import React from 'react'; //eslint-disable-line
import ReactDOM from 'react-dom'; //eslint-disable-line
import getTroopConnector from './troopConnector';
import TroopWrapper from './TroopWrapper';

const renderToTroop = (option = {}) => WrappedComponent => {
  const { sub } = option;

  const wrap = (TargetComponent, props = {}) => {
    const _prop = { ...props, asWrapper: true };
    return React.createElement(TroopWrapper, _prop, React.createElement(TargetComponent));
  };

  const connector = getTroopConnector();
  connector.subscribe(sub, (ops = {}) => {
    const { node, ...props } = ops;
    ReactDOM.render(wrap(WrappedComponent, props), node);
  });
};

export default renderToTroop;
