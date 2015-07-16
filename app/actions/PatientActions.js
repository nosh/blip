var AppDispatcher = require('../dispatcher/AppDispatcher');
var AppConstants = require('../constants/AppConstants');

var PatientActions = module.exports = {
  add: function(patient) {
    AppDispatcher.handleServerAction({
      type: AppConstants.ActionTypes.Patient.ADD,
      patient: patient
    });
  }
};