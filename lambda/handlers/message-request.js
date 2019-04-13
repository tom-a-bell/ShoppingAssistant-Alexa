const { getShoppingListId } = require('../utils/list-utils');
const { asyncForEach, requestFor } = require('../utils/util');

async function updateListItem(listServiceClient, listId, itemId, update) {
  switch (update.change) {
    case 'create':
      console.log('Creating item with properties:', update.value);
      await listServiceClient.createListItem(listId, JSON.parse(update.value));
      break;
    case 'update':
      console.log('Updating item with properties:', update.value);
      await listServiceClient.updateListItem(listId, itemId, JSON.parse(update.value));
      break;
    case 'delete':
      console.log('Deleting item with properties:', update.value);
      await listServiceClient.deleteListItem(listId, itemId);
      break;
    default:
      console.error('Unrecognised change request:', update.change);
  }
}

const MessageRequestHandler = {
  canHandle(handlerInput) {
    return requestFor(handlerInput).isOfType(['Messaging.MessageReceived']);
  },
  async handle(handlerInput) {
    const updatedListItems = requestFor(handlerInput).message.entries();

    const listServiceClient = handlerInput.serviceClientFactory.getListManagementServiceClient();
    const listId = await getShoppingListId(listServiceClient);

    const updateItem = ([itemId, update]) => updateListItem(listServiceClient, listId, itemId, update);
    await asyncForEach(updatedListItems, updateItem);
  },
};

module.exports = MessageRequestHandler;
