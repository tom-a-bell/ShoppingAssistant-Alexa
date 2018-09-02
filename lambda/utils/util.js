const Request = require('./request');
const User = require('./user');

async function asyncForEach(array, callback) {
  const promises = array.map(callback);
  await Promise.all(promises);
}

function requestFor(handlerInput) {
  return new Request(handlerInput.requestEnvelope.request);
}

function userFor(handlerInput) {
  return new User(handlerInput.requestEnvelope.context.System.user);
}

module.exports = {
  asyncForEach,
  requestFor,
  userFor,
};
