"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.SignalProtocolStore = void 0;
var _libsignalClient = _interopRequireDefault(require("@signalapp/libsignal-client"));
class SignalProtocolStore {
  constructor() {
    this.store = {
      identityKeys: new Map(),
      preKeys: new Map(),
      signedPreKeys: new Map(),
      sessions: new Map(),
      senderKeys: new Map(),
      senderKeyRecords: new Map()
    };
  }
  async saveIdentity(identifier, identityKey) {
    this.store.identityKeys.set(identifier, identityKey);
    return true;
  }
  async getIdentity(identifier) {
    return this.store.identityKeys.get(identifier);
  }
  async loadPreKey(keyId) {
    const preKey = this.store.preKeys.get(keyId);
    if (preKey) {
      this.store.preKeys.delete(keyId); // PreKeys are one-time use
    }
    return preKey;
  }
  async storePreKey(keyId, keyPair) {
    this.store.preKeys.set(keyId, keyPair);
  }
  async removePreKey(keyId) {
    this.store.preKeys.delete(keyId);
  }
  async loadSignedPreKey(keyId) {
    return this.store.signedPreKeys.get(keyId);
  }
  async storeSignedPreKey(keyId, keyPair) {
    this.store.signedPreKeys.set(keyId, keyPair);
  }
  async removeSignedPreKey(keyId) {
    this.store.signedPreKeys.delete(keyId);
  }
  async loadSession(identifier) {
    return this.store.sessions.get(identifier);
  }
  async storeSession(identifier, record) {
    this.store.sessions.set(identifier, record);
  }
  async removeSession(identifier) {
    this.store.sessions.delete(identifier);
  }
  async removeAllSessions(identifier) {
    for (const key of this.store.sessions.keys()) {
      if (key.startsWith(identifier)) {
        this.store.sessions.delete(key);
      }
    }
  }

  // Sender Key operations for group messaging
  async storeSenderKey(senderKeyId, record) {
    this.store.senderKeys.set(senderKeyId, record);
  }
  async loadSenderKey(senderKeyId) {
    return this.store.senderKeys.get(senderKeyId);
  }
  async removeSenderKey(senderKeyId) {
    this.store.senderKeys.delete(senderKeyId);
  }

  // Additional methods for group sessions
  async storeSenderKeyRecord(distributionId, record) {
    this.store.senderKeyRecords.set(distributionId, record);
  }
  async loadSenderKeyRecord(distributionId) {
    return this.store.senderKeyRecords.get(distributionId);
  }

  // Utility methods
  async getDeviceIds(identifier) {
    const deviceIds = new Set();
    for (const key of this.store.sessions.keys()) {
      if (key.startsWith(identifier)) {
        const [, deviceId] = key.split('.');
        deviceIds.add(parseInt(deviceId, 10));
      }
    }
    return Array.from(deviceIds);
  }
  async clearAll() {
    this.store.identityKeys.clear();
    this.store.preKeys.clear();
    this.store.signedPreKeys.clear();
    this.store.sessions.clear();
    this.store.senderKeys.clear();
    this.store.senderKeyRecords.clear();
  }

  // Direction trust management
  async isTrustedIdentity(identifier, identityKey, direction) {
    const existing = await this.getIdentity(identifier);
    if (!existing) {
      return true;
    }
    return existing.equals(identityKey);
  }
}
exports.SignalProtocolStore = SignalProtocolStore;
var _default = exports.default = SignalProtocolStore;