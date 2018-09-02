const mergeRemoteAndLocalValues = (conflict) => {
  const localValue = conflict.getLocalRecord().getValue();
  const remoteValue = conflict.getRemoteRecord().getValue();

  // If the local value is empty, the record should be deleted.
  if (!localValue) return null;

  const localProperties = localValue && JSON.parse(localValue);
  const remoteProperties = remoteValue && JSON.parse(remoteValue);

  // Merge the remote and local properties, giving precedence to local properties.
  const mergedProperties = { ...remoteProperties, ...localProperties };
  return JSON.stringify(mergedProperties);
};

const abandonSynchronization = (dataset, conflicts, callback) => {
  console.log('Abandoning the synchronization process');
  return callback(false);
};

const resolveConflictsWithLocalRecord = (dataset, conflicts, callback) => {
  const resolvedRecords = conflicts.map(conflict => conflict.resolveWithLocalRecord());
  console.log('Conflicts resolved by using local records:', JSON.stringify(resolvedRecords, null, 2));
  dataset.resolve(resolvedRecords, () => callback(true));
};

const resolveConflictsWithRemoteRecord = (dataset, conflicts, callback) => {
  const resolvedRecords = conflicts.map(conflict => conflict.resolveWithRemoteRecord());
  console.log('Conflicts resolved by using remote records:', JSON.stringify(resolvedRecords, null, 2));
  dataset.resolve(resolvedRecords, () => callback(true));
};

const resolveConflictsByMergingDifferences = (dataset, conflicts, callback) => {
  const resolvedRecords = conflicts.map(conflict => conflict.resolveWithValue(mergeRemoteAndLocalValues(conflict)));
  console.log('Conflicts resolved by merging remote and local records:', JSON.stringify(resolvedRecords, null, 2));
  dataset.resolve(resolvedRecords, () => callback(true));
};

const ResolutionStrategy = {
  ABANDON: abandonSynchronization,
  USE_LOCAL: resolveConflictsWithLocalRecord,
  USE_REMOTE: resolveConflictsWithRemoteRecord,
  MERGE: resolveConflictsByMergingDifferences,
};

const conflictHandlerWithResolutionStrategy = resolutionStrategy => (dataset, conflicts, callback) => {
  console.warn('Conflicts encountered while syncing to remote store:', JSON.stringify(conflicts, null, 2));
  return resolutionStrategy(dataset, conflicts, callback);
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

// Default conflict handler strategy is to merge differences, preferring local values.
const onConflict = conflictHandlerWithResolutionStrategy(ResolutionStrategy.MERGE);

module.exports = {
  ResolutionStrategy,
  conflictHandlerWithResolutionStrategy,
  onDatasetDeleted,
  onDatasetsMerged,
  onConflict,
};
