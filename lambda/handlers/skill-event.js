const { SHOPPING_LIST_ID } = require('../constants/constants');
const Status = require('../constants/list-status');

const ShoppingList = require('../shopping-list');
const { requestFor, userFor } = require('../utils/util');

async function syncShoppingListToCognito(user, serviceClientFactory) {
  if (!user.isFullyEnabled()) {
    const reason = !user.accessToken ? 'accessToken for linked account not specified' : 'consentToken not specified';
    console.error('Failed to synchronize shopping list to Cognito:', reason);
    return;
  }

  const listServiceClient = serviceClientFactory.getListManagementServiceClient();
  const list = await listServiceClient.getList(SHOPPING_LIST_ID, Status.ACTIVE);
  await ShoppingList.saveItemsToCognitoDataset(list.items, user.accessToken);
}

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
  async handle(handlerInput) {
    const request = requestFor(handlerInput);
    const user = userFor(handlerInput);

    let acceptedPermissions;
    switch (request.type) {
      case 'AlexaSkillEvent.SkillEnabled':
        console.log('Skill was enabled for user:', user.userId);
        break;
      case 'AlexaSkillEvent.SkillDisabled':
        console.log('Skill was disabled for user:', user.userId);
        break;
      case 'AlexaSkillEvent.SkillPermissionAccepted':
        acceptedPermissions = JSON.stringify(request.body.acceptedPermissions);
        console.log(`Skill permissions were accepted for user ${user.userId}. New permissions: ${acceptedPermissions}`);
        await syncShoppingListToCognito(user, handlerInput.serviceClientFactory);
        break;
      case 'AlexaSkillEvent.SkillPermissionChanged':
        acceptedPermissions = JSON.stringify(request.body.acceptedPermissions);
        console.log(`Skill permissions were changed for user ${user.userId}. New permissions: ${acceptedPermissions}`);
        break;
      case 'AlexaSkillEvent.SkillAccountLinked':
        console.log('Skill account was linked for user:', user.userId);
        await syncShoppingListToCognito(user, handlerInput.serviceClientFactory);
        break;
      default:
        console.error('Unexpected request type:', request.type);
    }
  },
};

module.exports = SkillEventHandler;
