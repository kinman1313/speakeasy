export class SignalProtocolStore {
  constructor() {
    this.store = {};
  }

  async getIdentityKeyPair() {
    return this.get('identityKey');
  }

  async getLocalRegistrationId() {
    return this.get('registrationId');
  }

  async put(key, value) {
    if (key === undefined || value === undefined || key === null || value === null) {
      throw new Error('Tried to store undefined/null');
    }
    this.store[key] = value;
  }

  async get(key, defaultValue) {
    if (key === null || key === undefined) {
      throw new Error('Tried to get value for undefined/null key');
    }
    if (key in this.store) {
      return this.store[key];
    }
    return defaultValue;
  }

  async remove(key) {
    if (key === null || key === undefined) {
      throw new Error('Tried to remove value for undefined/null key');
    }
    delete this.store[key];
  }

  async isTrustedIdentity(identifier, identityKey) {
    if (identifier === null || identifier === undefined) {
      throw new Error('tried to check identity key for undefined/null key');
    }
    if (!(identityKey instanceof ArrayBuffer)) {
      throw new Error('Expected identityKey to be an ArrayBuffer');
    }
    const trusted = await this.get('identityKey' + identifier);
    if (trusted === undefined) {
      return true;
    }
    return identityKey === trusted;
  }

  async loadIdentityKey(identifier) {
    if (identifier === null || identifier === undefined) {
      throw new Error('Tried to get identity key for undefined/null key');
    }
    return this.get('identityKey' + identifier);
  }

  async saveIdentity(identifier, identityKey) {
    if (identifier === null || identifier === undefined) {
      throw new Error('Tried to put identity key for undefined/null key');
    }
    const address = 'identityKey' + identifier;
    const existing = await this.get(address);
    if (existing && identityKey !== existing) {
      await this.put(address, identityKey);
      return true;
    } else if (!existing) {
      await this.put(address, identityKey);
      return false;
    }
    return false;
  }

  async loadPreKey(keyId) {
    return this.get('25519KeypreKey' + keyId);
  }

  async storePreKey(keyId, keyPair) {
    return this.put('25519KeypreKey' + keyId, keyPair);
  }

  async removePreKey(keyId) {
    return this.remove('25519KeypreKey' + keyId);
  }

  async loadSignedPreKey(keyId) {
    return this.get('25519KeysignedKey' + keyId);
  }

  async storeSignedPreKey(keyId, keyPair) {
    return this.put('25519KeysignedKey' + keyId, keyPair);
  }

  async removeSignedPreKey(keyId) {
    return this.remove('25519KeysignedKey' + keyId);
  }

  async loadSession(identifier) {
    return this.get('session' + identifier);
  }

  async storeSession(identifier, record) {
    return this.put('session' + identifier, record);
  }

  async removeSession(identifier) {
    return this.remove('session' + identifier);
  }

  async removeAllSessions(identifier) {
    for (const key in this.store) {
      if (key.startsWith('session' + identifier)) {
        delete this.store[key];
      }
    }
  }

  async clearStorage() {
    this.store = {};
  }

  getStore() {
    return this.store;
  }
}
