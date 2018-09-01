const { requestFor } = require('../utils/util');

const SkillEventHandler = {
  canHandle(handlerInput) {
    return requestFor(handlerInput).isOfType([
      'AlexaSkillEvent.SkillEnabled',
      'AlexaSkillEvent.SkillDisabled',
      'AlexaSkillEvent.SkillAccountLinked',
      'AlexaSkillEvent.SkillPermissionAccepted',
      'AlexaSkillEvent.SkillPermissionChanged',
    ]);
  },
  handle(handlerInput) {
    const { userId } = handlerInput.requestEnvelope.context.System.user;
    const request = requestFor(handlerInput);
    let acceptedPermissions;

    switch (request.type) {
      case 'AlexaSkillEvent.SkillEnabled':
        console.log(`Skill was enabled for user: ${userId}`);
        break;
      case 'AlexaSkillEvent.SkillDisabled':
        console.log(`Skill was disabled for user: ${userId}`);
        break;
      case 'AlexaSkillEvent.SkillPermissionAccepted':
        acceptedPermissions = JSON.stringify(request.body.acceptedPermissions);
        console.log(`Skill permissions were accepted for user ${userId}. New permissions: ${acceptedPermissions}`);
        break;
      case 'AlexaSkillEvent.SkillPermissionChanged':
        acceptedPermissions = JSON.stringify(request.body.acceptedPermissions);
        console.log(`Skill permissions were changed for user ${userId}. New permissions: ${acceptedPermissions}`);
        break;
      case 'AlexaSkillEvent.SkillAccountLinked':
        console.log(`Skill account was linked for user ${userId}`);
        break;
      default:
        console.log(`Unexpected request type: ${request.type}`);
    }
  },
};

module.exports = SkillEventHandler;
