const Status = require('../constants/list-status');
const ShoppingList = require('../shopping-list');
const { requestFor, userFor } = require('../utils/util');

const ItemEventHandler = {
  canHandle(handlerInput) {
    return requestFor(handlerInput).isOfType([
      'AlexaHouseholdListEvent.ItemsCreated',
      'AlexaHouseholdListEvent.ItemsUpdated',
      'AlexaHouseholdListEvent.ItemsDeleted',
    ]);
  },
  async handle(handlerInput) {
    const user = userFor(handlerInput);
    const request = requestFor(handlerInput);
    const { listId, listItemIds } = request.body;

    if (!user.isFullyEnabled()) {
      const reason = !user.accessToken ? 'accessToken for linked account not specified' : 'consentToken not specified';
      console.error('Failed to synchronize shopping list to Cognito:', reason);
    }

    // Fetch the full list of active items
    const listServiceClient = handlerInput.serviceClientFactory.getListManagementServiceClient();
    const list = await listServiceClient.getList(listId, Status.ACTIVE);

    let listItems;
    let itemNames;
    switch (request.type) {
      case 'AlexaHouseholdListEvent.ItemsCreated':
        listItems = await Promise.all(listItemIds.map(itemId => listServiceClient.getListItem(listId, itemId)));
        itemNames = listItems.map(item => `"${item.value}"`).join(', ');
        console.log(`New item ${itemNames} added to your ${list.name}`);
        await ShoppingList.saveItemsToCognitoDataset(listItems, user);
        break;
      case 'AlexaHouseholdListEvent.ItemsUpdated':
        listItems = await Promise.all(listItemIds.map(itemId => listServiceClient.getListItem(listId, itemId)));
        itemNames = listItems.map(item => `"${item.value}"`).join(', ');
        console.log(`Existing item ${itemNames} updated on your ${list.name}`);
        await ShoppingList.saveItemsToCognitoDataset(listItems, user);
        break;
      case 'AlexaHouseholdListEvent.ItemsDeleted':
        console.log(`Item with ID ${listItemIds.join(', ')} deleted from your ${list.name}`);
        await ShoppingList.removeItemsFromCognitoDataset(listItemIds, user);
        break;
      default:
        console.error('Unexpected request type:', request.type);
    }
  },
};

module.exports = ItemEventHandler;
