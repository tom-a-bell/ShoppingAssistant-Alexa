const AWS = require('aws-sdk');
require('amazon-cognito-js');

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
    const { listId, listItemIds } = handlerInput.requestEnvelope.request.body;
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

    // Initialize the Amazon Cognito credentials provider
    const identityProvider = 'www.amazon.com';
    AWS.config.region = process.env.COGNITO_AWS_REGION;
    AWS.config.credentials = new AWS.CognitoIdentityCredentials({
      IdentityPoolId: process.env.COGNITO_IDENTITY_POOL_ID,
      Logins: { [identityProvider]: accessToken },
    });

    try {
      await AWS.config.credentials.getPromise();

      const syncManager = new AWS.CognitoSyncManager({ DataStore: AWS.CognitoSyncManager.StoreInMemory });
      syncManager.openOrCreateDataset('ShoppingList', (datasetError, dataset) => {
        if (datasetError) {
          console.error('Failed to open or create dataset');
          console.error(datasetError);
        } else {
          list.items.forEach((item) => {
            const itemId = item.id;
            const itemDetails = JSON.stringify({
              id: item.id,
              value: item.value,
              status: item.status,
              version: item.version,
              createdTime: item.createdTime,
              updatedTime: item.updatedTime,
            });

            dataset.put(itemId, itemDetails, (error, record) => {
              if (error) {
                console.error(`Failed to save item to dataset: ${record}`);
                console.error(error);
              } else {
                console.log(`Saved item to dataset: ${record}`);
              }
            });
          });

          // Synchronize the local and remote datasets
          dataset.synchronize({
            onSuccess(newDataset, newRecords) {
              console.log(`Successfully synchronized ${newRecords.length} new records.`);
            },

            onFailure(error) {
              console.error('Failed to synchronize dataset to remote store!');
              console.error(error);
            },

            onConflict(newDataset, conflicts, callback) {
              console.error('Conflict encountered while syncing to remote store!');

              // Abandon the synchronization process.
              return callback(false);
            },

            onDatasetDeleted(deletedDataset, datasetName, callback) {
              console.log(`Dataset deleted in remote store: ${datasetName}`);

              // Return true to delete the local copy of the dataset.
              // Return false to handle deleted datasets outside the synchronization callback.
              return callback(true);
            },

            onDatasetsMerged(mergedDataset, datasetNames, callback) {
              console.log(`Datasets merged in remote store: ${datasetNames}`);

              // Return true to continue the synchronization process.
              // Return false to handle dataset merges outside the synchronization callback.
              return callback(false);
            },
          });
        }
      });
    } catch (error) {
      console.error('Failed to log in with Cognito identity credentials!');
      console.error(error);
    }

    if (handlerInput.requestEnvelope.request.type === 'AlexaHouseholdListEvent.ItemsDeleted') {
      console.log(`"${listItemIds}" was deleted from your ${list.name}`);
    } else {
      for (let i = 0, len = listItemIds.length; i < len; i += 1) {
        // using await within the loop to avoid throttling
        const listItem = await listServiceClient.getListItem(listId, listItemIds[i]);
        const itemName = listItem.value;
        switch (handlerInput.requestEnvelope.request.type) {
          case 'AlexaHouseholdListEvent.ItemsCreated':
            console.log(`"${itemName}" was added to your ${list.name}`);
            break;
          case 'AlexaHouseholdListEvent.ItemsUpdated':
            console.log(`"${itemName}" was updated on your ${list.name}`);
            break;
          default:
            console.log(`Unexpected request type ${handlerInput.requestEnvelope.request.type}`);
        }
      }
    }
  },
};

module.exports = ItemEventHandler;
