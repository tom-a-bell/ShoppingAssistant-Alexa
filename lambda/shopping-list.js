const Cognito = require('./utils/cognito');

const recordForItem = (item, user) => JSON.stringify({
  id: item.id,
  value: item.value,
  status: item.status,
  version: item.version,
  createdTime: item.createdTime,
  updatedTime: item.updatedTime,
  userId: user.userId,
});

const openOrCreateShoppingList = () => Cognito.openOrCreateDataset('ShoppingList');
const saveItem = (item, user, dataset) => Cognito.saveItemToDataset(dataset, item.id, recordForItem(item, user));
const removeItem = (itemId, dataset) => Cognito.removeItemFromDataset(dataset, itemId);
const synchronizeShoppingList = shoppingList => Cognito.synchronizeDataset(shoppingList);

const saveItems = (items, user, dataset) => items.reduce(
  (promiseChain, item) => promiseChain.then(currentDataset => saveItem(item, user, currentDataset)),
  Promise.resolve(dataset),
);

const removeItems = (itemIds, dataset) => itemIds.reduce(
  (promiseChain, itemId) => promiseChain.then(currentDataset => removeItem(itemId, currentDataset)),
  Promise.resolve(dataset),
);

const saveItemsToCognitoDataset = (items, user) => {
  const saveItemsToShoppingList = shoppingList => saveItems(items, user, shoppingList);
  return Cognito.getCognitoCredentials(user.accessToken)
    .then(openOrCreateShoppingList)
    .then(saveItemsToShoppingList)
    .then(synchronizeShoppingList)
    .catch(error => console.error('Failed to save items to Cognito dataset:', error));
};

const removeItemsFromCognitoDataset = (itemIds, user) => {
  const removeItemsFromShoppingList = shoppingList => removeItems(itemIds, shoppingList);
  return Cognito.getCognitoCredentials(user.accessToken)
    .then(openOrCreateShoppingList)
    .then(removeItemsFromShoppingList)
    .then(synchronizeShoppingList)
    .catch(error => console.error('Failed to remove items from Cognito dataset:', error));
};

module.exports = {
  saveItemsToCognitoDataset,
  removeItemsFromCognitoDataset,
};
