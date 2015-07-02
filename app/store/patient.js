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
var _ = require('lodash');
var userMessages = require('../userMessages');
var utils = require('../core/utils');

/**
 * @constructor
 * @param {Object} api API wrapper
 */
var PatientStore = module.exports = function (api, log) {
  this.api = api;
  this.state = {
    user: null,
    fetchingUser: true,
    patient: null,
    patients: null,
    fetchPatient: true,
    fetchingPatients: true
  };
};

/**
 * Get the current state of the store
 * 
 * @return {Object}
 */
PatientStore.prototype.getState = function() {
  return this.state;
};

/**
 * Set the state of the store and the supplied component's state too
 * 
 * @param {ReactComponent} component
 * @param {Object} state changes to apply to state
 */
PatientStore.prototype.setState = function(component, state) {
  this.state = _.assign(this.state, state);
  component.setState(state);
};

/**
 * Go and fetch patients and update state of store and component
 * 
 * @param  {ReactComponent} component
 * @param  {Object} options
 */
PatientStore.prototype.fetchPatients = function(component, options) {
  var self = this;

  if(options && !options.hideLoading) {
      self.setState(component, {fetchingPatients: true});
  }

  self.api.patient.getAll(function(err, patients) {
    if (err) {
      self.setState(component, {fetchingPatients: false});
      return component.handleApiError(err, userMessages.ERR_FETCHING_TEAMS, utils.buildExceptionDetails());
    }

    self.setState(component, {
      patients: patients,
      fetchingPatients: false
    });
  });
};

/**
 * Go and fetch the current user details
 * @param  {ReactComponent} component
 */
PatientStore.prototype.fetchUser = function(component) {
  var self = this;

  self.setState(component, {fetchingUser: true});

  self.api.user.get(function(err, user) {
    if (err) {
      self.setState(component, {fetchingUser: false});
      return component.handleApiError(err, userMessages.ERR_FETCHING_USER, utils.buildExceptionDetails());
    }

    self.setState(component, {
      user: user,
      fetchingUser: false
    });
  });
};

/**
 * Go and fetch a particular patient given a patientId
 * 
 * @param  {ReactComponent} component
 * @param  {Number}   patientId
 * @param  {Function} callback
 */
PatientStore.prototype.fetchPatient = function(component, patientId, callback) {
  var self = this;

  self.setState(component, {fetchingPatient: true});

  self.api.patient.get(patientId, function(err, patient) {
    if (err) {
      if (err.status === 404) {
        self.log('Patient not found with id ' + patientId);
        var setupMsg = (patientId === self.state.user.userid) ? userMessages.ERR_YOUR_ACCOUNT_NOT_CONFIGURED : userMessages.ERR_ACCOUNT_NOT_CONFIGURED;
        var dataStoreLink = (<a href="#/patients/new" onClick={self.closeNotification}>{userMessages.YOUR_ACCOUNT_DATA_SETUP}</a>);
        return self.handleActionableError(err, setupMsg, dataStoreLink);
      }
      // we can't deal with it so just show error handler
      return self.handleApiError(err, userMessages.ERR_FETCHING_PATIENT+patientId, utils.buildExceptionDetails());
    }

    self.setState(component, {
      patient: patient,
      fetchingPatient: false
    });

    if (typeof callback === 'function') {
      callback(null, patient);
    }
  });
};