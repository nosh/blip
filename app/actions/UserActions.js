var AppDispatcher = require('../dispatcher/AppDispatcher');
var AppConstants = require('../constants/AppConstants');

var UserActions = module.exports = {
  set: function(user) {
    AppDispatcher.handleServerAction({
      type: AppConstants.ActionTypes.User.SET,
      user: user
    });
  },
  unset: function() {
    AppDispatcher.handleServerAction({
      type: AppConstants.ActionTypes.User.UNSET
    });
  },

  login: function(loginDetails) {
    AppDispatcher.handleViewAction({
      type: AppConstants.ActionTypes.User.LOGIN,
      loginDetails: loginDetails
    });
  },
  logout: function() {
    AppDispatcher.handleViewAction({
      type: AppConstants.ActionTypes.User.LOGOUT
    });
  },
  confirmSignup: function(key) {
    AppDispatcher.handleViewAction({
      type: AppConstants.ActionTypes.User.CONFIRM_SIGNUP,
      key: key
    });
  }
};