const axios = require('axios');
const querystring = require('querystring');

const sendMessageToAlexaSkill = async (records) => {
  let accessToken;
  try {
    const url = 'https://api.amazon.com/auth/O2/token';
    const data = {
      client_id: process.env.ALEXA_SKILL_CLIENT_ID,
      client_secret: process.env.ALEXA_SKILL_CLIENT_SECRET,
      grant_type: 'client_credentials',
      scope: 'alexa:skill_messaging',
    };

    const response = await axios.post(url, querystring.stringify(data));
    accessToken = response.data.access_token;
  } catch (error) {
    console.error(error);
  }

  if (!accessToken) {
    console.error('Failed to obtain access token');
    return;
  }

  try {
    const url = `https://api.amazonalexa.com/v1/skillmessages/users/${process.env.ALEXA_SKILL_USER_ID}`;
    const data = {
      data: records,
      expiresAfterSeconds: 60,
    };
    const config = {
      headers: { Authorization: `Bearer ${accessToken}` },
    };

    await axios.post(url, data, config);
  } catch (error) {
    console.error(error);
  }
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

  const modifiedEvent = event;

  // Modify value for a key
  if ('SampleKey1' in event.datasetRecords) {
    modifiedEvent.datasetRecords.SampleKey1.newValue = 'ModifyValue1';
    modifiedEvent.datasetRecords.SampleKey1.op = 'replace';
  }

  // Remove a key
  if ('SampleKey2' in event.datasetRecords) {
    modifiedEvent.datasetRecords.SampleKey2.op = 'remove';
  }

  // // Add a key
  // if (!('SampleKey3' in event.datasetRecords)) {
  //     modifiedEvent.datasetRecords.SampleKey3 = {
  //         newValue: 'ModifyValue3',
  //         op: 'replace',
  //     };
  // }

  // const buildRecords = (records, entry) => {
  //   const [key, record] = entry;
  //   records[key] = {
  //     value: record.op === 'replace' ? record.newValue : record.oldValue,
  //     change: record.op,
  //   };
  //   return records;
  // };

  // const updatedRecords = event.datasetRecords.filter(record => record.newValue !== record.oldValue);
  // const recordData = Object.entries(updatedRecords).reduce(buildRecords, {});

  const records = {
    '2a0c6037-6ff7-4b30-96f1-1debea144aa2': event.datasetRecords['2a0c6037-6ff7-4b30-96f1-1debea144aa2'],
  };

  await sendMessageToAlexaSkill(records);

  return modifiedEvent;
};
