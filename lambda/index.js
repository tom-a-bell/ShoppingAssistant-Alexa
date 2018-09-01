const Alexa = require('ask-sdk');

// Import request handlers
const AmazonHelpHandler = require('./handlers/help-request');
const AmazonStopHandler = require('./handlers/stop-request');

const SkillEventHandler = require('./handlers/skill-event');
const ListEventHandler = require('./handlers/list-event');
const ItemEventHandler = require('./handlers/item-event');

const LaunchRequestHandler = require('./handlers/launch-request');
const IntentRequestHandler = require('./handlers/intent-request');
const MessageRequestHandler = require('./handlers/message-request');
const UnknownRequestHandler = require('./handlers/unknown-request');

const SessionEndedHandler = require('./handlers/session-ended');
const ErrorHandler = require('./handlers/error-handler');

// Export skill handler

const skillBuilder = Alexa.SkillBuilders.custom();
exports.handler = skillBuilder
  .addRequestHandlers(
    AmazonStopHandler,
    AmazonHelpHandler,
    LaunchRequestHandler,
    IntentRequestHandler,
    SkillEventHandler,
    ItemEventHandler,
    ListEventHandler,
    MessageRequestHandler,
    SessionEndedHandler,
    UnknownRequestHandler,
  )
  .addErrorHandlers(ErrorHandler)
  .withApiClient(new Alexa.DefaultApiClient())
  .lambda();
