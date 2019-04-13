const getShoppingListId = async (listServiceClient) => {
  const listsMetadata = await listServiceClient.getListsMetadata();
  return listsMetadata.lists.find(list => list.name === 'Alexa shopping list').listId;
};

module.exports = {
  getShoppingListId,
};
