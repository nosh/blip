/**
 * Copyright (c) 2015, Tidepool Project
 *
 * This program is free software; you can redistribute it and/or modify it under
 * the terms of the associated License, which is identical to the BSD 2-Clause
 * License as published by the Open Source Initiative at opensource.org.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the License for more details.
 *
 * You should have received a copy of the License along with this program; if
 * not, you can obtain one from Tidepool Project at tidepool.org.
 */
var _ = require('lodash');

/**
 * @constructor
 * @param {Object} api API wrapper
 * @param {Object} log logger
 */
var BaseStore = module.exports = function (api, log) {
  this.api = api;
  this.log = log;
  this.state = {};
};

/**
 * Get the current state of the store
 * 
 * @return {Object}
 */
BaseStore.prototype.getState = function() {
  return this.state;
};

/**
 * Set the state of the store and the supplied component's state too
 * 
 * @param {ReactComponent} component
 * @param {Object} state changes to apply to state
 */
BaseStore.prototype.setState = function(component, state) {
  this.state = _.assign(this.state, state);
  component.setState(state);
};