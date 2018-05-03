import React from 'react'; // eslint-disable-line
import PropTypes from 'prop-types';
import getTroopConnector from './troopConnector';

export default class TroopWrapper extends React.Component {
  constructor(props) {
    super(props);
    this.connector = getTroopConnector();
  }
  getChildContext() {
    return {
      connector: this.connector
    };
  }

  render() {
    const { children, asWrapper, ...props } = this.props;
    if (asWrapper) {
      return this.connector ? React.cloneElement(React.Children.only(children), props) : null;
    }
    return this.connector ? React.Children.only(children) : null;
  }
}

TroopWrapper.childContextTypes = {
  connector: PropTypes.object,
  asWrapper: PropTypes.bool
};

TroopWrapper.defaultProps = {
  asWrapper: false
};
/* eslint-disable react/require-default-props */
TroopWrapper.propTypes = {
  children: PropTypes.element,
  asWrapper: PropTypes.bool
};
