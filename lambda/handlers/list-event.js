const Status = require('../constants/list-status');
const { requestFor } = require('../utils/util');

const ListEventHandler = {
  canHandle(handlerInput) {
    return requestFor(handlerInput).isOfType([
      'AlexaHouseholdListEvent.ListCreated',
      'AlexaHouseholdListEvent.ListUpdated',
      'AlexaHouseholdListEvent.ListDeleted',
    ]);
  },
  async handle(handlerInput) {
    const request = requestFor(handlerInput);
    const { listId } = request.body;

    const listServiceClient = handlerInput.serviceClientFactory.getListManagementServiceClient();

    let list;
    switch (request.type) {
      case 'AlexaHouseholdListEvent.ListCreated':
        list = await listServiceClient.getList(listId, Status.ACTIVE);
        console.log(`List "${list.name}" was created`);
        break;
      case 'AlexaHouseholdListEvent.ListUpdated':
        list = await listServiceClient.getList(listId, Status.ACTIVE);
        console.log(`List "${list.name}" was updated`);
        break;
      case 'AlexaHouseholdListEvent.ListDeleted':
        console.log(`List with ID ${listId} was deleted`);
        break;
      default:
        console.error('Unexpected request type:', request.type);
    }
  },
};

module.exports = ListEventHandler;
