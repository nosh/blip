var _ = require('lodash');
var EventEmitter = require('events').EventEmitter;

var AppDispatcher = require('../dispatcher/AppDispatcher');
var AppConstants = require('../constants/AppConstants');

var CHANGE_EVENT = 'change';

/*
 * Private variables in module
 */

var _patientsData = {};

function _addPatientData(patientData) {
  _patientsData[patientData.id] = patientData;
}

var PatientDataStore = module.exports = _.assign({}, EventEmitter.prototype, {
  emitChange: function() {
    this.emit(CHANGE_EVENT);
  },
  addChangeListener: function(callback) {
    this.on(CHANGE_EVENT, callback);
  },
  removeChangeListener: function(callback) {
    this.removeListener(CHANGE_EVENT, callback);
  },
  getData: function() {
    return _patientsData;
  }
});

PatientDataStore.dispatchToken = AppDispatcher.register(function(payload) {
  var action = payload.action;

  switch(action.type) {
    case AppConstants.ActionTypes.Patient.ADD:
      _addPatientData(action.patient);
      PatientDataStore.emitChange();
      break;
  }

  return true;
});