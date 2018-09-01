const Request = require('./request.js');

function requestFor(handlerInput) {
  return new Request(handlerInput.requestEnvelope.request);
}

async function asyncForEach(array, callback) {
  const promises = array.map(callback);
  await Promise.all(promises);
}

module.exports = {
  asyncForEach,
  requestFor,
};
