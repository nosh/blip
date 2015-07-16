var UserAPI = module.exports = function(api) {
  if (!this.api.initialised) {
    throw new Error('API not initialised');
  }
  this.api = api;
};

UserAPI.prototype.login = function(user) {
  this.api.login(user, function(err, data) {
    console.log(err, data);
  });
};