/* eslint-env jest */

jest.mock('@react-native-community/netinfo', () =>
  require('@react-native-community/netinfo/jest/netinfo-mock.js'),
);

jest.mock('react-native-mmkv', () => {
  const values = new Map();
  return {
    __values: values,
    createMMKV: () => ({
      getString: key => values.get(key),
      getNumber: key => values.get(key),
      getBoolean: key => values.get(key),
      set: (key, value) => values.set(key, value),
      remove: key => values.delete(key),
      contains: key => values.has(key),
      clearAll: () => values.clear(),
    }),
  };
});

jest.mock('react-native-keychain', () => {
  const credentials = new Map();
  const serviceFor = options => options?.service || 'default';

  return {
    __credentials: credentials,
    ACCESSIBLE: {
      AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY:
        'AccessibleAfterFirstUnlockThisDeviceOnly',
    },
    SECURITY_LEVEL: {
      SECURE_SOFTWARE: 'SECURE_SOFTWARE',
    },
    STORAGE_TYPE: {
      AES_GCM_NO_AUTH: 'KeystoreAESGCM_NoAuth',
    },
    setGenericPassword: jest.fn(async (username, password, options) => {
      const service = serviceFor(options);
      credentials.set(service, { username, password, service });
      return { service, storage: 'KeystoreAESGCM_NoAuth' };
    }),
    getGenericPassword: jest.fn(async options => {
      return credentials.get(serviceFor(options)) || false;
    }),
    resetGenericPassword: jest.fn(async options => {
      credentials.delete(serviceFor(options));
      return true;
    }),
  };
});
