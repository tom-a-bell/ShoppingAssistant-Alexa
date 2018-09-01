const Messages = require('../messages');
const { requestFor } = require('../utils/util');

const AmazonCancelStopHandler = {
  canHandle(handlerInput) {
    return requestFor(handlerInput).isIntentWithName('AMAZON.CancelIntent')
        || requestFor(handlerInput).isIntentWithName('AMAZON.StopIntent');
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(Messages.endSessionOutput)
      .withShouldEndSession(true)
      .getResponse();
  },
};

module.exports = AmazonCancelStopHandler;
