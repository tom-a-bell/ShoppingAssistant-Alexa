const { requestFor } = require('../utils/util');

const SessionEndedHandler = {
  canHandle(handlerInput) {
    return requestFor(handlerInput).isOfType(['SessionEndedRequest']);
  },
  handle(handlerInput) {
    const request = requestFor(handlerInput);
    console.log('Session ended with reason:', request.reason);
    return handlerInput.responseBuilder.getResponse();
  },
};

module.exports = SessionEndedHandler;
