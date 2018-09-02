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
    const listClient = handlerInput.serviceClientFactory.getListManagementServiceClient();
    const { listId } = handlerInput.requestEnvelope.request.body;
    const status = Status.ACTIVE;

    if (handlerInput.requestEnvelope.request.type === 'AlexaHouseholdListEvent.ListDeleted') {
      console.log(`list ${listId} was deleted`);
    } else {
      const list = await listClient.getList(listId, status);
      switch (handlerInput.requestEnvelope.request.type) {
        case 'AlexaHouseholdListEvent.ListCreated':
          console.log(`list ${list.name} was created`);
          break;
        case 'AlexaHouseholdListEvent.ListUpdated':
          console.log(`list ${list.name} was updated`);
          break;
        default:
          console.log(`unexpected request type ${handlerInput.requestEnvelope.request.type}`);
      }
    }
  },
};

module.exports = ListEventHandler;
