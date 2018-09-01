class Message {
  constructor(message) {
    this.message = message;
  }

  entries() {
    return Object.entries(this.message);
  }
}

class Request {
  constructor(request) {
    this.type = request.type;
    this.body = request.body;
    this.intent = request.intent;
    this.message = new Message(request.message);
  }

  isOfType(requestTypes) {
    return requestTypes.includes(this.type);
  }

  isIntentWithName(intentName) {
    return this.type === 'IntentRequest' && this.intent.name === intentName;
  }
}

module.exports = Request;
