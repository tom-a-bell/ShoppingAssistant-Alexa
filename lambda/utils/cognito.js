const AWS = require('aws-sdk');
require('amazon-cognito-js');

const cognitoSyncManager = () => new AWS.CognitoSyncManager({ DataStore: AWS.CognitoSyncManager.StoreInMemory });

const onConflict = (dataset, conflicts, callback) => {
  console.error('Conflict(s) encountered while syncing to remote store:', JSON.stringify(conflicts, null, 2));

  // Abandon the synchronization process.
  return callback(false);
};

const onDatasetDeleted = (dataset, datasetName, callback) => {
  console.log('Dataset deleted in remote store:', datasetName);

  // Return true to delete the local copy of the dataset.
  // Return false to handle deleted datasets outside of the synchronization callback.
  return callback(true);
};

const onDatasetsMerged = (dataset, datasetNames, callback) => {
  console.log('Datasets merged in remote store:', datasetNames);

  // Return true to continue the synchronization process.
  // Return false to handle dataset merges outside of the synchronization callback.
  return callback(false);
};

const getCognitoCredentials = (accessToken) => {
  // Initialize the Amazon Cognito credentials provider
  AWS.config.region = process.env.COGNITO_AWS_REGION;
  AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: process.env.COGNITO_IDENTITY_POOL_ID,
    Logins: { 'www.amazon.com': accessToken },
  });

  return AWS.config.credentials.getPromise();
};

const openOrCreateDataset = datasetName => new Promise((resolve, reject) => {
  cognitoSyncManager().openOrCreateDataset(datasetName, (error, dataset) => {
    if (error) {
      console.error(`Failed to open dataset: ${datasetName}`, error);
      return reject(error);
    }
    console.log('Opened dataset:', datasetName);
    return resolve(dataset);
  });
});

const saveItemToDataset = (dataset, itemId, item) => new Promise((resolve, reject) => {
  dataset.put(itemId, item, (error, record) => {
    if (error) {
      console.error(`Failed to save item to dataset: ${item}`, error);
      return reject(error);
    }
    console.log('Saved item to dataset:', record);
    return resolve(dataset);
  });
});

const removeItemFromDataset = (dataset, itemId) => new Promise((resolve, reject) => {
  dataset.remove(itemId, (error, record) => {
    if (error) {
      console.error(`Failed to remove item from dataset: ${itemId}`, error);
      return reject(error);
    }
    console.log('Removed item from dataset:', record);
    return resolve(dataset);
  });
});

const synchronizeDataset = dataset => new Promise((resolve, reject) => {
  dataset.synchronize({
    onSuccess(syncedDataset, updatedRecords) {
      console.log('Synchronized dataset to remote store:', `${updatedRecords.length} records updated`);
      resolve(syncedDataset);
    },
    onFailure(error) {
      console.error('Failed to synchronize dataset to remote store:', error);
      reject(error);
    },
    onConflict,
    onDatasetDeleted,
    onDatasetsMerged,
  });
});

module.exports = {
  getCognitoCredentials,
  openOrCreateDataset,
  saveItemToDataset,
  removeItemFromDataset,
  synchronizeDataset,
};
