var _ = require('lodash');
var Dispatcher = require('flux').Dispatcher;

/*
 * Sources Index
 */
var SOURCES = {
  VIEW: 'VIEW_ACTION',
  SERVER: 'SERVER_ACTION'
};

var AppDispatcher = module.exports = _.assign(new Dispatcher(), {
  /**
   * A bridge function between the views and the dispatcher, marking the action
   * as a view action.
   * 
   * @param  {object} action The data coming from the view.
   */
  handleViewAction: function(action) {
    this.dispatch({
      source: SOURCES.VIEW,
      action: action
    });
  },
  /**
   * A bridge function between api and the dispatcher, marking the action
   * as a server action.
   * 
   * @param  {object} action The data coming from the server.
   */
  handleServerAction: function(action) {
    this.dispatch({
      source: SOURCES.SERVER,
      action: action
    });
  }
});