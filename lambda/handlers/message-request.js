const { SHOPPING_LIST_ID } = require('../constants/constants');
const { asyncForEach, requestFor } = require('../utils/util');

async function updateListItem(listServiceClient, itemId, update) {
  switch (update.change) {
    case 'create':
      console.log('Creating item with properties:', update.value);
      await listServiceClient.createListItem(SHOPPING_LIST_ID, JSON.parse(update.value));
      break;
    case 'update':
      console.log('Updating item with properties:', update.value);
      await listServiceClient.updateListItem(SHOPPING_LIST_ID, itemId, JSON.parse(update.value));
      break;
    case 'delete':
      console.log('Deleting item with properties:', update.value);
      await listServiceClient.deleteListItem(SHOPPING_LIST_ID, itemId);
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
    const updateItem = ([itemId, update]) => updateListItem(listServiceClient, itemId, update);

    await asyncForEach(updatedListItems, updateItem);
  },
};

module.exports = MessageRequestHandler;
