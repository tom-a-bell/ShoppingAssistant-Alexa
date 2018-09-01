const Cognito = require('./utils/cognito');

const recordForItem = item => JSON.stringify({
  id: item.id,
  value: item.value,
  status: item.status,
  version: item.version,
  createdTime: item.createdTime,
  updatedTime: item.updatedTime,
});

const openOrCreateShoppingList = () => Cognito.openOrCreateDataset('ShoppingList');
const saveItem = (item, dataset) => Cognito.saveItemToDataset(dataset, item.id, recordForItem(item));
const removeItem = (itemId, dataset) => Cognito.removeItemFromDataset(dataset, itemId);
const synchronizeShoppingList = shoppingList => Cognito.synchronizeDataset(shoppingList);

const saveItems = (items, dataset) => items.reduce(
  (promiseChain, item) => promiseChain.then(currentDataset => saveItem(item, currentDataset)),
  Promise.resolve(dataset),
);

const removeItems = (itemIds, dataset) => itemIds.reduce(
  (promiseChain, itemId) => promiseChain.then(currentDataset => removeItem(itemId, currentDataset)),
  Promise.resolve(dataset),
);

const saveItemsToCognitoDataset = (items, accessToken) => {
  const saveItemsToShoppingList = shoppingList => saveItems(items, shoppingList);
  return Cognito.getCognitoCredentials(accessToken)
    .then(openOrCreateShoppingList)
    .then(saveItemsToShoppingList)
    .then(synchronizeShoppingList)
    .catch(error => console.error('Failed to save items to Cognito dataset:', error));
};

const removeItemsFromCognitoDataset = (itemIds, accessToken) => {
  const removeItemsFromShoppingList = shoppingList => removeItems(itemIds, shoppingList);
  return Cognito.getCognitoCredentials(accessToken)
    .then(openOrCreateShoppingList)
    .then(removeItemsFromShoppingList)
    .then(synchronizeShoppingList)
    .catch(error => console.error('Failed to remove items from Cognito dataset:', error));
};

module.exports = {
  saveItemsToCognitoDataset,
  removeItemsFromCognitoDataset,
};
