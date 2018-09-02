const UnknownRequestHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput) {
    console.error('Unhandled request:', JSON.stringify(handlerInput.requestEnvelope.request, null, 2));
  },
};

module.exports = UnknownRequestHandler;
