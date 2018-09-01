const UnknownRequestHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput) {
    console.log('Unhandled request');
    console.log(handlerInput.requestEnvelope.request);
  },
};

module.exports = UnknownRequestHandler;
