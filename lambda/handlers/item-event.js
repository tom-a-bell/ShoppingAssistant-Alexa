const ShoppingList = require('../shopping-list');
const { requestFor } = require('../utils/util');

// Status of list, either active or completed
const STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
};

const ItemEventHandler = {
  canHandle(handlerInput) {
    return requestFor(handlerInput).isOfType([
      'AlexaHouseholdListEvent.ItemsCreated',
      'AlexaHouseholdListEvent.ItemsUpdated',
      'AlexaHouseholdListEvent.ItemsDeleted',
    ]);
  },
  async handle(handlerInput) {
    const request = requestFor(handlerInput);
    const { listId, listItemIds } = request.body;
    console.log('Item was created, updated or deleted');

    const { consentToken } = handlerInput.requestEnvelope.context.System.user.permissions;
    if (!consentToken) {
      console.error('Error: consentToken not specified');
    }

    const { accessToken } = handlerInput.requestEnvelope.context.System.user;
    if (!accessToken) {
      console.error('Error: accessToken for linked account not specified');
    }

    // Fetch the full list of active items
    const listServiceClient = handlerInput.serviceClientFactory.getListManagementServiceClient();
    const list = await listServiceClient.getList(listId, STATUS.ACTIVE);

    let listItems;
    let itemNames;
    switch (request.type) {
      case 'AlexaHouseholdListEvent.ItemsCreated':
        listItems = await Promise.all(listItemIds.map(itemId => listServiceClient.getListItem(listId, itemId)));
        itemNames = listItems.map(item => item.value).join(', ');
        console.log(`"${itemNames}" was added to your ${list.name}`);
        await ShoppingList.saveItemsToCognitoDataset(listItems, accessToken);
        break;
      case 'AlexaHouseholdListEvent.ItemsUpdated':
        listItems = await Promise.all(listItemIds.map(itemId => listServiceClient.getListItem(listId, itemId)));
        itemNames = listItems.map(item => item.value).join(', ');
        console.log(`"${itemNames}" was updated on your ${list.name}`);
        await ShoppingList.saveItemsToCognitoDataset(listItems, accessToken);
        break;
      case 'AlexaHouseholdListEvent.ItemsDeleted':
        console.log(`"${listItemIds}" was deleted from your ${list.name}`);
        await ShoppingList.removeItemsFromCognitoDataset(listItemIds, accessToken);
        break;
      default:
        console.error('Unexpected request type:', request.type);
    }
  },
};

module.exports = ItemEventHandler;
