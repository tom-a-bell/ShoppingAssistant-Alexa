const { requestFor } = require('../utils/util');

const IntentRequestHandler = {
  canHandle(handlerInput) {
    return requestFor(handlerInput).isIntentWithName('HelloWorldIntent');
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak('Hi there!')
      .withSimpleCard('Shopping Assistant', 'Hi there!')
      .getResponse();
  },
};

module.exports = IntentRequestHandler;
