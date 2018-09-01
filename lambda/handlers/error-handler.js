const Messages = require('../messages');

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    const { request } = handlerInput.requestEnvelope;

    console.error('Original request:', JSON.stringify(request, null, 2));
    console.error(`Error handled: ${error}`, JSON.stringify(error, null, 2));

    return handlerInput.responseBuilder
      .speak(Messages.errorOutput)
      .reprompt(Messages.errorReprompt)
      .getResponse();
  },
};

module.exports = ErrorHandler;
