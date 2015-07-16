var _ = require('lodash');
var EventEmitter = require('events').EventEmitter;

var AppDispatcher = require('../dispatcher/AppDispatcher');
var AppConstants = require('../constants/AppConstants');

var CHANGE_EVENT = 'change';

/*
 * Private variables in module
 */

var _patients = {};

function _addPatient(patient) {
  _patients[patient.id] = patient;
}

var PatientStore = module.exports = _.assign({}, EventEmitter.prototype, {
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
    return _patients;
  }
});

PatientStore.dispatchToken = AppDispatcher.register(function(payload) {
  var action = payload.action;

  switch(action.type) {
    case AppConstants.ActionTypes.Patient.ADD:
      _addPatient(action.patient);
      PatientStore.emitChange();
      break;
  }

  return true;
});