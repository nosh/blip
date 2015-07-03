/** @jsx React.DOM */
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
var React = require('react');
var inherits = require('inherits');

var userMessages = require('../userMessages');
var utils = require('../core/utils');
var BaseStore = require('./baseStore');

/**
 * @constructor
 * @param {Object} api API wrapper
 * @param {Object} log logger
 */
var InviteStore = module.exports = function(api, log) {
  InviteStore.super_.apply(this, [api, log]);

  this.state = {
    invites: null,
    fetchingInvites: true,
    pendingInvites:null,
    fetchingPendingInvites: true
  };
};
inherits(InviteStore, BaseStore);

/**
 * Go and fetch invites and update state of store and component
 * 
 * @param  {ReactComponent} component
 */
InviteStore.prototype.fetchInvites = function(component) {
  var self = this;

  self.setState(component, {fetchingInvites: true});

  self.api.invitation.getReceived(function(err, invites) {
    if (err) {

      self.setState(component, {
        fetchingInvites: false
      });

      return component.handleApiError(err, userMessages.ERR_FETCHING_INVITES, utils.buildExceptionDetails());
    }

    self.setState(component, {
      invites: invites,
      fetchingInvites: false
    });
  });
};


/**
 * Go and fetch pending invites and update state of store and component
 * 
 * @param  {ReactComponent} component
 * @param {Function} cb callback function
 */
InviteStore.prototype.fetchPendingInvites = function(component, cb) {
  var self = this;

  self.setState(component, {fetchingPendingInvites: true});

  self.api.invitation.getSent(function(err, invites) {
    if (err) {
      self.setState(component, {
        fetchingPendingInvites: false
      });

      if (cb) {
        cb(err);
      }

      return component.handleApiError(err, userMessages.ERR_FETCHING_PENDING_INVITES, utils.buildExceptionDetails());
    }

    self.setState(component, {
      pendingInvites: invites,
      fetchingPendingInvites: false
    });

    if (cb) {
      cb();
    }
  });
};