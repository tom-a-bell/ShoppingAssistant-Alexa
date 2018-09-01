const Messages = require('../messages');
const { requestFor } = require('../utils/util');

// Permissions requested by the skill
const permissions = ['read::alexa:household:list'];

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return requestFor(handlerInput).isOfType(['LaunchRequest']);
  },
  handle(handlerInput) {
    const { responseBuilder } = handlerInput;

    const { accessToken } = handlerInput.requestEnvelope.session.user;
    if (!accessToken) {
      return responseBuilder
        .speak(Messages.linkAccountOutput)
        .withLinkAccountCard()
        .getResponse();
    }

    const { consentToken } = handlerInput.requestEnvelope.context.System.user.permissions;
    if (!consentToken) {
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
