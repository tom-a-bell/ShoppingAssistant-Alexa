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
const buildRecordsForItems = (items, user) => items.reduce(
  (records, item) => ({ ...records, [item.id]: recordForItem(item, user) }),
  {},
);

const openOrCreateShoppingList = () => Cognito.openOrCreateDataset('ShoppingList');
const saveItems = (items, user, dataset) => Cognito.saveItemsToDataset(dataset, buildRecordsForItems(items, user));
const removeItems = (itemIds, dataset) => Cognito.removeItemsFromDataset(dataset, itemIds);
const synchronizeShoppingList = shoppingList => Cognito.synchronizeDataset(shoppingList);

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
