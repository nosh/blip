var _ = require('lodash');
var EventEmitter = require('events').EventEmitter;

var bows = require('bows');
var sundial = require('sundial');
var queryString = require('../core/querystring');

var log = bows('UserStore');

var AppDispatcher = require('../dispatcher/AppDispatcher');
var AppConstants = require('../constants/AppConstants');

var CHANGE_EVENT = 'change';

/*
 * Private variables/functions in module
 */
var _user = {};

function _setUser(user) {
  _user = user;
}

var UserStore = module.exports = _.assign({}, EventEmitter.prototype, {
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
        log('Viewing data in timezone-aware mode with', queryTimezone, 'as the selected timezone.');
      }
      catch(err) {
        log(new Error('Invalid timezone name in query parameter. (Try capitalizing properly.)'));
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

    return {
      user: _user,
      authenticated: !_.isEmpty(_user),
      loggingOut: false,
      bgPrefs: bgPrefs,
      timePrefs: timePrefs,
      queryParams: queryParams
    };
  }
});

UserStore.dispatchToken = AppDispatcher.register(function(payload) {
  if (payload.source === 'VIEW_ACTION') {
    processViewAction(payload.action);
  } else {
    processServerAction(payload.action);
  }
});

function processViewAction(action) {
  switch(action.type) {
    case AppConstants.ActionTypes.User.LOGIN:
      console.log('Login Attempt', action);
      UserStore.emitChange();
      break;
  }

  return true;
}

function processServerAction(action) {
  switch(action.type) {
    case AppConstants.ActionTypes.User.SET:
      _setUser(action.user);
      UserStore.emitChange();
      break;
  }

  return true;
}