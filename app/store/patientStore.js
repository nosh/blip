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
var _ = require('lodash');
var React = require('react');
var async = require('async');
var inherits = require('inherits');
var sundial = require('sundial');

var nurseShark = require('tideline/plugins/nurseshark/');
var TidelineData = require('tideline/js/tidelinedata');

var userMessages = require('../userMessages');
var utils = require('../core/utils');
var queryString = require('../core/querystring');
var BaseStore = require('./baseStore');

/**
 * @constructor
 * @param {Object} api API wrapper
 * @param {Object} log logger
 */
var PatientStore = module.exports = function (api, log) {
  PatientStore.super_.apply(this, [api, log]);
  this.setInitialState();
};
inherits(PatientStore, BaseStore);

/**
 * Set the initial state of the patient store
 */
PatientStore.prototype.setInitialState = function() {
  var queryParams = queryString.parseTypes(window.location.search);
  var timePrefs = {
    timezoneAware: false,
    timezoneName: null
  };
  if (!_.isEmpty(queryParams.timezone)) {
    var queryTimezone = queryParams.timezone.replace('-', '/');
    try {
      sundial.checkTimezoneName(queryTimezone);
      timePrefs.timezoneAware = true;
      timePrefs.timezoneName = queryTimezone;
      this.log('Viewing data in timezone-aware mode with', queryTimezone, 'as the selected timezone.');
    }
    catch(err) {
      this.log(new Error('Invalid timezone name in query parameter. (Try capitalizing properly.)'));
    }
  }
  var bgPrefs = {
    bgUnits: 'mg/dL'
  };
  if (!_.isEmpty(queryParams.units)) {
    var queryUnits = queryParams.units.toLowerCase();
    if (queryUnits === 'mmoll') {
      bgPrefs.bgUnits = 'mmol/L';
    }
  }

  this.state = { 
    bgPrefs: bgPrefs,
    timePrefs: timePrefs,
    queryParams: queryParams
  };
  this.resetState();
};

PatientStore.prototype.resetState = function() {
  this.state = _.assign(this.state, { 
    user: null,
    fetchingUser: true,
    patient: null,
    patients: null,
    fetchPatient: true,
    fetchingPatients: true,
    patientData: null,
    fetchingPatientData: true
  });
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

PatientStore.prototype.fetchPatientData = function(component, patient) {
  var self = this;

  var patientId = patient.userid;

  self.setState(component, {fetchingPatientData: true});

  var loadPatientData = function(cb) {
    self.api.patientData.get(patientId, cb);
  };

  var loadTeamNotes = function(cb) {
    self.api.team.getNotes(patientId, cb);
  };

  async.parallel({
    patientData: loadPatientData,
    teamNotes: loadTeamNotes
  },
  function(err, results) {
    if (err) {
      self.setState(component, {fetchingPatientData: false});
      // Patient with id not found, cary on
      if (err.status === 404) {
        this.log('No data found for patient '+patientId);
        return;
      }

      return component.handleApiError(err, userMessages.ERR_FETCHING_PATIENT_DATA+patientId, utils.buildExceptionDetails());
    }

    var patientData = results.patientData || [];
    var notes = results.teamNotes || [];

    self.log('Patient device data count', patientData.length);
    self.log('Team notes count', notes.length);

    var combinedData = patientData.concat(notes);
    window.downloadInputData = function() {
      console.save(combinedData, 'blip-input.json');
    };
    patientData = self.processPatientData(component, combinedData);
    
    // NOTE: intentional use of _.clone instead of _.cloneDeep
    // we only need a shallow clone at the top level of the patientId keys
    // and the _.cloneDeep I had originally would hang the browser for *seconds*
    // when there was actually something in this.state.patientData
    var allPatientsData = _.clone(self.state.patientData) || {};
    allPatientsData[patientId] = patientData;

    self.setState(component, {
      bgPrefs: {
        bgClasses: patientData.bgClasses,
        bgUnits: patientData.bgUnits
      },
      patientData: allPatientsData,
      fetchingPatientData: false
    });
  });
};

PatientStore.prototype.processPatientData = function(component, data) {
  if (!(data && data.length >= 0)) {
    return null;
  }

  var mostRecentUpload = _.sortBy(_.where(data, {type: 'upload'}), function(d) {
    return Date.parse(d.time);
  }).reverse()[0];

  var timePrefsForTideline;
  if (!_.isEmpty(mostRecentUpload) && !_.isEmpty(mostRecentUpload.timezone)) {
    try {
      sundial.checkTimezoneName(mostRecentUpload.timezone);
      timePrefsForTideline = {
        timezoneAware: true,
        timezoneName: mostRecentUpload.timezone
      };
    }
    catch(err) {
      this.log(err);
      this.log('Upload metadata lacking a valid timezone!', mostRecentUpload);
    }
  }
  var queryParams = this.state.queryParams;
  // if the user has put a timezone in the query params
  // it'll be stored already in the state, and we just keep using it
  if (!_.isEmpty(queryParams.timezone) || _.isEmpty(timePrefsForTideline)) {
    timePrefsForTideline = this.state.timePrefs;
  }
  // but otherwise we use the timezone from the most recent upload metadata obj
  else {
    this.setState(component, {
      timePrefs: timePrefsForTideline
    });
    this.log('Defaulting to display in timezone of most recent upload at', mostRecentUpload.time, mostRecentUpload.timezone);
  }

  console.time('Nurseshark Total');
  var res = nurseShark.processData(data, this.state.bgPrefs.bgUnits);
  console.timeEnd('Nurseshark Total');
  console.time('TidelineData Total');
  var tidelineData = new TidelineData(res.processedData, {
    timePrefs: this.state.timePrefs,
    bgUnits: this.state.bgPrefs.bgUnits
  });
  console.timeEnd('TidelineData Total');

  window.tidelineData = tidelineData;
  window.downloadProcessedData = function() {
    console.save(res.processedData, 'nurseshark-output.json');
  };
  window.downloadErroredData = function() {
    console.save(res.erroredData, 'errored.json');
  };

  return tidelineData;
};