/**
 * Copyright (c) 2014, Tidepool Project
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

/** @jsx React.DOM */

var _ = require('lodash');
var React = require('react');

var config = require('../../config');
var routeMap = require('../../routemap');
var utils = require('../../core/utils');

// Dispatcher for Flux Architecture
var UserActions = require('../../actions/UserActions');

// Stores
var UserStore = require('../../stores/UserStore');
var InvitationStore = require('../../stores/InvitationStore');
var PatientStore = require('../../stores/PatientStore');
var PatientDataStore = require('../../stores/PatientDataStore');

// Components
var Navbar = require('../navbar');
var LogoutOverlay = require('../logoutoverlay');
var BrowserWarningOverlay = require('../browserwarningoverlay');
var TidepoolNotification = require('../notification');
var TermsOverlay = require('../termsoverlay');
var MailTo = require('../mailto');

// Pages
var Login = require('../../pages/login');
var Signup = require('../../pages/signup');
var Profile = require('../../pages/profile');
var Patients = require('../../pages/patients');
var Patient = require('../../pages/patient');
var PatientNew = require('../../pages/patientnew');
var PatientData = require('../../pages/patientdata');
var RequestPasswordReset = require('../../pages/passwordreset/request');
var ConfirmPasswordReset = require('../../pages/passwordreset/confirm');
var EmailVerification = require('../../pages/emailverification');

// Styles
require('tideline/css/tideline.less');
require('../../core/less/fonts.less');
require('../../style.less');

// Blip favicon
require('../../../favicon.ico');

/**
 * Get the state from all the Flux stores and bundle into
 * one object
 * 
 * @return {Object}
 */
function getAppState() {
  var state = {
    userState: UserStore.getData(),
    invitationState: InvitationStore.getData(),
    patientState: PatientStore.getData(),
    patientDataState: PatientDataStore.getData(),
  };

  console.log('State', state);
  return state;
}

/**
 * The controller view component of Blip
 */
var AppComponent = module.exports = React.createClass({
  contextTypes: {
    log: React.PropTypes.func.isRequired,
    api: React.PropTypes.object.isRequired,
    router: React.PropTypes.object.isRequired,
    personUtils: React.PropTypes.object.isRequired,
    trackMetric: React.PropTypes.func.isRequired,
    DEBUG: React.PropTypes.bool.isRequired
  },

  /**
   * Get the initial state of the component
   * 
   * @return {Object}
   */
  getInitialState: function() {
    return _.assign({
      page: null,
      showingAcceptTerms: false,
      dismissedBrowserWarning: false,
    }, getAppState());
  },

  /**
   * List for changes on all the Stores after the component has been
   * mounted
   */
  componentDidMount: function() {
    console.log('Component has mounted');
    UserStore.addChangeListener(this._onChange);
    InvitationStore.addChangeListener(this._onChange);
    PatientStore.addChangeListener(this._onChange);
    PatientDataStore.addChangeListener(this._onChange);

    this._setupAndStartRouter();
  },

  /**
   * Remove any listeners before unmounting
   */
  componentWillUnmount: function() {
    console.log('Component about to unmount');
    UserStore.removeChangeListener(this._onChange);
    InvitationStore.removeChangeListener(this._onChange);
    PatientStore.removeChangeListener(this._onChange);
    PatientDataStore.removeChangeListener(this._onChange);
  },

  /**
   * Called when component state has changed and things
   * are about to be re-rendered
   * @param  {Object} nextProps
   * @param  {Object} nextState
   */
  componentWillUpdate: function(nextProps, nextState) {
    // Called on props or state changes
    // Since app main component has no props,
    // this will be called on a state change
    if (this.context.DEBUG) {
      var stateDiff = utils.objectDifference(nextState, this.state);
      this.context.log('State changed', stateDiff);
    }
  },

  /**
   * Set up the router for this Application
   */
  _setupAndStartRouter: function() {
    var self = this;

    var routingTable = {};
    _.forEach(routeMap.routes, function(handlerName, route) {
      routingTable[route] = self[handlerName];
    });

    var isAuthenticated = function() {
      return self.state.userState.authenticated;
    };

    // Currently no-op
    var onRouteChange = function() {};
    console.log('Setting up router');
    console.log(routingTable);
    self.context.router.setup(routingTable, {
      isAuthenticated: isAuthenticated,
      noAuthRoutes: routeMap.noAuthRoutes,
      externalAppRoutes: routeMap.externalAppRoutes,
      defaultNotAuthenticatedRoute: routeMap.defaultNotAuthenticatedRoute,
      defaultAuthenticatedRoute: routeMap.defaultAuthenticatedRoute,
      onRouteChange: onRouteChange
    });
    console.log('Starting router');
    self.context.router.start();
  },

  /**
   * Render the component into the DOM
   */
  render: function() {
    this.context.log('Rendering AppComponent');
    var overlay = this.renderOverlay();
    var page = this.renderPage();
    var footer = this.renderFooter();

    /* jshint ignore:start */
    return (
      <div className="app">
        {overlay}
        {page}
        {footer}
      </div>
    );
    /* jshint ignore:end */
  },

  // Override on route change
  renderPage: function() {
    return null;
  },

  renderOverlay: function() {
    this.context.log('Rendering overlay');
    if (this.state.userState.loggingOut) {
      /* jshint ignore:start */
      return (
        <LogoutOverlay ref="logoutOverlay" />
      );
      /* jshint ignore:end */
    }

    if (!utils.isChrome() && !this.state.dismissedBrowserWarning) {
      /* jshint ignore:start */
      return (
        <BrowserWarningOverlay onSubmit={this.handleAcceptedBrowserWarning} />
      );
      /* jshint ignore:end */
    }

    if (this.state.showingAcceptTerms) {
      /* jshint ignore:start */
      return (
        <TermsOverlay
          onSubmit={this.handleAcceptedTerms}
          trackMetric={this.context.trackMetric} />
      );
      /* jshint ignore:end */
    }

    return null;
  },

  renderFooter: function() {
    var title ='Send us feedback';
    var subject = 'Feedback on Blip';

    return (
      /* jshint ignore:start */
      <div className='container-small-outer footer'>
        <div className='container-small-inner'>
          <MailTo
            linkTitle={title}
            emailAddress={'support@tidepool.org'}
            emailSubject={subject}
            onLinkClicked={function() {
              this.context.trackMetric('Clicked Give Feedback');
            }} />
        </div>
        {this.renderVersion()}
      </div>
      /* jshint ignore:end */
    );
  },

  renderVersion: function() {
    var version = config.VERSION;
    if (version) {
      version = 'v' + version + ' beta';
      return (
        /* jshint ignore:start */
        <div className="Navbar-version" ref="version">{version}</div>
        /* jshint ignore:end */
      );
    }
    return null;
  },

  renderLogin: function() {
    return (
      /* jshint ignore:start */
      <Login
        onSubmit={UserActions.login}
        seedEmail={'gordonmdent@gmail.com'}
        isInvite={false}
        onSubmitSuccess={function() {}}
        onSubmitNotAuthorized={function() {}}
        trackMetric={this.context.trackMetric} />
      /* jshint ignore:end */
    );
  },

/**
 * Routing functions - all functions prefixed with show* are 
 * associated with the router and handle moving to a new
 * page in the application
 */

  redirectToDefaultRoute: function() {
    this.showPatients(true);
  },

  showPatients: function(showPatientData) {
    this.context.log('Show Patients');
  },

  showLogin: function() {
    this.context.log('Show Login');
    this.renderPage = this.renderLogin;
    this.setState({page: 'login'});
  },

  showSignup: function() {
    this.context.log('Show Signup');
  },

  showEmailVerification: function() {
    this.context.log('Show Email Verification');
  },

  showProfile: function() {
    this.context.log('Show Profile');
  },

  showPatient: function() {
    this.context.log('Show Patient');
  },

  showPatientNew: function() {
    this.context.log('Show Patient New');
  },

  showPatientShare: function() {
    this.context.log('Show Patient Share');
  },

  showPatientData: function() {
    this.context.log('Show Patient Data');
  },

  showRequestPasswordReset: function() {
    this.context.log('Show Request Password Reset');
  },

  showConfirmPasswordReset: function() {
    this.context.log('Show Confirm Password Reset');
  },

/**
 * Server Handler functions
 */

  handleExternalPasswordUpdate: function() {
    this.context.log('Handle External Password Update');
  },




  /**
   * Update view state when change event is received
   */
  _onChange: function() {
    this.setState(getAppState());
  }
});