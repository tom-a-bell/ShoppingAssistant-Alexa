const Alexa = require('ask-sdk');
const AWS = require('aws-sdk');
require('amazon-cognito-js');

const welcomeOutput = 'Welcome to Shopping Assistant';
const welcomeReprompt = 'What can I help you with?';
const linkAccountOutput = 'Please use the Alexa App to authenticate on Amazon to start using this skill';
const permissionsOutput = 'Please enable List permissions in the Alexa App.';
const helpOutput = 'You can demonstrate ... by ...  Try saying ...';
const helpReprompt = 'Try saying ...';

// Permissions requested by the skill
const permissions = ['read::alexa:household:list'];

// Status of list, either active or completed
const STATUS = {
    ACTIVE: 'active',
    COMPLETED: 'completed',
};

// handlers

const SkillEventHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return (request.type === 'AlexaSkillEvent.SkillEnabled' ||
            request.type === 'AlexaSkillEvent.SkillDisabled' ||
            request.type === 'AlexaSkillEvent.SkillPermissionAccepted' ||
            request.type === 'AlexaSkillEvent.SkillPermissionChanged' ||
            request.type === 'AlexaSkillEvent.SkillAccountLinked');
    },
    handle(handlerInput) {
        const userId = handlerInput.requestEnvelope.context.System.user.userId;
        let acceptedPermissions;
        switch (handlerInput.requestEnvelope.request.type) {
            case 'AlexaSkillEvent.SkillEnabled':
                console.log(`skill was enabled for user: ${userId}`);
                break;
            case 'AlexaSkillEvent.SkillDisabled':
                console.log(`skill was disabled for user: ${userId}`);
                break;
            case 'AlexaSkillEvent.SkillPermissionAccepted':
                acceptedPermissions = JSON.stringify(handlerInput.requestEnvelope.request.body.acceptedPermissions);
                console.log(`skill permissions were accepted for user ${userId}. New permissions: ${acceptedPermissions}`);
                break;
            case 'AlexaSkillEvent.SkillPermissionChanged':
                acceptedPermissions = JSON.stringify(handlerInput.requestEnvelope.request.body.acceptedPermissions);
                console.log(`skill permissions were changed for user ${userId}. New permissions: ${acceptedPermissions}`);
                break;
            case 'AlexaSkillEvent.SkillAccountLinked':
                console.log(`skill account was linked for user ${userId}`);
                break;
            default:
                console.log(`unexpected request type: ${handlerInput.requestEnvelope.request.type}`);
        }
    },
};

const ItemEventHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        console.log(request);
        return (request.type === 'AlexaHouseholdListEvent.ItemsCreated' ||
            request.type === 'AlexaHouseholdListEvent.ItemsDeleted' ||
            request.type === 'AlexaHouseholdListEvent.ItemsUpdated');
    },
    async handle(handlerInput) {
        const listId = handlerInput.requestEnvelope.request.body.listId;
        const listItemIds = handlerInput.requestEnvelope.request.body.listItemIds;
        console.log('Item was created, updated or deleted');

        const consentToken = handlerInput.requestEnvelope.context.System.user.permissions
                          && handlerInput.requestEnvelope.context.System.user.permissions.consentToken;
        if (!consentToken) {
            console.error('Error: consentToken not specified');
        }

        const accessToken = handlerInput.requestEnvelope.context.System.user.accessToken;
        if (!accessToken) {
            console.error('Error: accessToken for linked account not specified');
        }

        // Fetch the full list of active items
        const listServiceClient = handlerInput.serviceClientFactory.getListManagementServiceClient();
        const list = await listServiceClient.getList(listId, STATUS.ACTIVE);

        // Initialize the Amazon Cognito credentials provider
        // const identityProvider = `cognito-idp.${process.env.COGNITO_AWS_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}`;
        const identityProvider = 'www.amazon.com';
        AWS.config.region = process.env.COGNITO_AWS_REGION;
        AWS.config.credentials = new AWS.CognitoIdentityCredentials({
            IdentityPoolId: process.env.COGNITO_IDENTITY_POOL_ID,
            Logins: { [identityProvider]: accessToken }
        });

        try {
            await await AWS.config.credentials.getPromise();

            const syncManager = new AWS.CognitoSyncManager({ DataStore: AWS.CognitoSyncManager.StoreInMemory });
            syncManager.openOrCreateDataset('ShoppingList', function(error, dataset) {
                if (error) {
                    console.error('Failed to open or create dataset');
                    console.error(error);
                } else {
                    list.items.forEach(function(item) {
                        const itemId = item.id;
                        const itemDetails = JSON.stringify({
                            "value": item.value,
                            "status": item.status,
                            "version": item.version,
                            "createdTime": item.createdTime,
                            "updatedTime": item.updatedTime,
                        });

                        dataset.put(itemId, itemDetails, function (error, record) {
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
                        onSuccess: function(dataset, newRecords) {
                            console.log(`Successfully synchronized ${newRecords.length} new records.`);
                        },

                        onFailure: function(error) {
                            console.error('Failed to synchronize dataset to remote store!');
                            console.error(error);
                        },

                        onConflict: function(dataset, conflicts, callback) {
                            console.error('Conflict encountered while syncing to remote store!');

                            // Abandon the synchronization process.
                           return callback(false);
                        },

                        onDatasetDeleted: function(dataset, datasetName, callback) {
                            console.log(`Dataset deleted in remote store: ${datasetName}`);

                            // Return true to delete the local copy of the dataset.
                            // Return false to handle deleted datasets outside the synchronization callback.
                            return callback(true);
                        },

                        onDatasetsMerged: function(dataset, datasetNames, callback) {
                            console.log(`Datasets merged in remote store: ${datasetNames}`);

                            // Return true to continue the synchronization process.
                            // Return false to handle dataset merges outside the synchronization callback.
                            return callback(false);
                        }
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

const ListEventHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return (request.type === 'AlexaHouseholdListEvent.ListCreated' ||
            request.type === 'AlexaHouseholdListEvent.ListUpdated' ||
            request.type === 'AlexaHouseholdListEvent.ListDeleted');
    },
    async handle(handlerInput) {
        const listClient = handlerInput.serviceClientFactory.getListManagementServiceClient();
        const listId = handlerInput.requestEnvelope.request.body.listId;
        const status = STATUS.ACTIVE;

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

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'LaunchRequest';
    },
    handle(handlerInput) {
        const responseBuilder = handlerInput.responseBuilder;

        const accessToken = handlerInput.requestEnvelope.session.user
                         && handlerInput.requestEnvelope.session.user.accessToken;
        if (!accessToken) {
            return responseBuilder
                .speak(linkAccountOutput)
                .withLinkAccountCard()
                .getResponse();
        }

        const consentToken = handlerInput.requestEnvelope.context.System.user.permissions
                          && handlerInput.requestEnvelope.context.System.user.permissions.consentToken;
        if (!consentToken) {
            return responseBuilder
                .speak(permissionsOutput)
                .withAskForPermissionsConsentCard(permissions)
                .getResponse();
        }

        return responseBuilder
            .speak(welcomeOutput)
            .reprompt(welcomeReprompt)
            .getResponse();
    },
};

const UnhandledHandler = {
    canHandle(handlerInput) {
        return true;
    },
    handle(handlerInput) {
        console.log('unhandled');
        console.log(handlerInput.requestEnvelope.request);
    },
};

const AmazonHelpHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const responseBuilder = handlerInput.responseBuilder;
        return responseBuilder
            .speak(helpOutput)
            .reprompt(helpReprompt)
            .getResponse();
    },
};

const AmazonCancelStopHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' &&
            (request.intent.name === 'AMAZON.CancelIntent' || request.intent.name === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const responseBuilder = handlerInput.responseBuilder;
        const speechOutput = 'Okay, talk to you later! ';

        return responseBuilder
            .speak(speechOutput)
            .withShouldEndSession(true)
            .getResponse();
    },
};

const SessionEndedHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);
        return handlerInput.responseBuilder.getResponse();
    },
};

const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        const request = handlerInput.requestEnvelope.request;

        console.log(`Original Request was: ${JSON.stringify(request, null, 2)}`);
        console.log(`Error handled: ${error}`);

        return handlerInput.responseBuilder
            .speak('Sorry, I had trouble doing what you asked.  Please ask for it again.')
            .reprompt('Sorry, I had trouble doing what you asked.  Please ask for it again.')
            .getResponse();
    },
};

// exports

const skillBuilder = Alexa.SkillBuilders.custom();
exports.handler = skillBuilder
    .addRequestHandlers(
        AmazonCancelStopHandler,
        AmazonHelpHandler,
        LaunchRequestHandler,
        SkillEventHandler,
        ItemEventHandler,
        ListEventHandler,
        SessionEndedHandler,
        UnhandledHandler,
    )
    .addErrorHandlers(ErrorHandler)
    .withApiClient(new Alexa.DefaultApiClient())
    .lambda();
