const Messages = require('../messages');
const { requestFor } = require('../utils/util');

const AmazonHelpHandler = {
  canHandle(handlerInput) {
    return requestFor(handlerInput).isIntentWithName('AMAZON.HelpIntent');
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(Messages.helpOutput)
      .reprompt(Messages.helpReprompt)
      .getResponse();
  },
};

module.exports = AmazonHelpHandler;
