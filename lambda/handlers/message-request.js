const { asyncForEach, requestFor } = require('../utils/util');

const listId = 'YW16bjEuYWNjb3VudC5BSExKRldaNzRKMzQ0QTZPUFBHUUlTQUxIVEJRLVNIT1BQSU5HX0lURU0=';

async function updateListItem(listServiceClient, itemId, update) {
  switch (update.change) {
    case 'create':
      console.log('Creating item with properties:', update.value);
      await listServiceClient.createListItem(listId, JSON.parse(update.value));
      return;
    case 'update':
      console.log('Updating item with properties:', update.value);
      await listServiceClient.updateListItem(listId, itemId, JSON.parse(update.value));
      return;
    case 'delete':
      console.log('Deleting item with properties:', update.value);
      await listServiceClient.deleteListItem(listId, itemId);
      return;
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
