class User {
  constructor(user) {
    this.userId = user.userId;
    this.accessToken = user.accessToken;
    this.consentToken = user.permissions && user.permissions.consentToken;
  }

  isFullyEnabled() {
    return this.accessToken && this.consentToken;
  }
}

module.exports = User;
