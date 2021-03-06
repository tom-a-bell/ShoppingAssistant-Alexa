const axios = require('axios');
const querystring = require('querystring');

function getUserId(records) {
  const getUserIds = record => JSON.parse(record.value).userId;
  const isNotNull = value => !!value;

  return Object
    .values(records)
    .map(getUserIds)
    .find(isNotNull);
}

async function getAccessToken() {
  const url = 'https://api.amazon.com/auth/O2/token';
  const data = {
    client_id: process.env.ALEXA_SKILL_CLIENT_ID,
    client_secret: process.env.ALEXA_SKILL_CLIENT_SECRET,
    grant_type: 'client_credentials',
    scope: 'alexa:skill_messaging',
  };

  try {
    const response = await axios.post(url, querystring.stringify(data));
    return response.data.access_token;
  } catch (error) {
    console.error(error);
    return undefined;
  }
}

async function sendMessageToAlexa(userId, records, accessToken) {
  if (!userId) {
    console.error('User ID not specified');
    return;
  }

  if (!accessToken) {
    console.error('Access token not specified');
    return;
  }

  const apiEndpoint = process.env.ALEXA_SKILL_MESSAGING_ENDPOINT;
  const url = `${apiEndpoint}/${userId}`;
  const data = {
    data: records,
    expiresAfterSeconds: 60,
  };
  const config = {
    headers: { Authorization: `Bearer ${accessToken}` },
  };

  try {
    await axios.post(url, data, config);
  } catch (error) {
    console.error(error);
  }
}

const sendMessageToAlexaSkill = async (records) => {
  const userId = getUserId(records);
  const accessToken = await getAccessToken();
  await sendMessageToAlexa(userId, records, accessToken);
};

exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  // Check for the event type
  if (event.eventType !== 'SyncTrigger') {
    return event;
  }

  // Check for the dataset name
  if (event.datasetName !== 'ShoppingList') {
    return event;
  }

  const recordHasChanged = ([, record]) => record && record.newValue !== record.oldValue;

  const changeForRecord = (record) => {
    if (record.newValue && !record.oldValue) return 'create';
    if (!record.newValue && record.oldValue) return 'delete';
    if (record.newValue !== record.oldValue) return 'update';
    return 'none';
  };

  const buildRecord = ([key, record]) => ({
    [key]: { change: changeForRecord(record), value: record.op === 'replace' ? record.newValue : record.oldValue },
  });

  const buildRecords = (records, entry) => ({
    ...records,
    ...buildRecord(entry),
  });

  const changedRecords = Object
    .entries(event.datasetRecords)
    .filter(recordHasChanged)
    .reduce(buildRecords, {});

  await sendMessageToAlexaSkill(changedRecords);

  return event;
};
