const Messages = require('../messages');
const { requestFor, userFor } = require('../utils/util');

// Permissions requested by the skill
const permissions = ['read::alexa:household:list'];

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return requestFor(handlerInput).isOfType(['LaunchRequest']);
  },
  handle(handlerInput) {
    const user = userFor(handlerInput);
    const { responseBuilder } = handlerInput;

    if (!user.accessToken) {
      return responseBuilder
        .speak(Messages.linkAccountOutput)
        .withLinkAccountCard()
        .getResponse();
    }

    if (!user.consentToken) {
      return responseBuilder
        .speak(Messages.enablePermissionsOutput)
        .withAskForPermissionsConsentCard(permissions)
        .getResponse();
    }

    return responseBuilder
      .speak(Messages.welcomeOutput)
      .reprompt(Messages.welcomeReprompt)
      .getResponse();
  },
};

module.exports = LaunchRequestHandler;
