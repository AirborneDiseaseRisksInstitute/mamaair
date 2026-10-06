/* eslint-env jest */

jest.mock('@react-native-community/netinfo', () =>
  require('@react-native-community/netinfo/jest/netinfo-mock.js'),
);

jest.mock('react-native-mmkv', () => {
  const stores = new Map();
  const defaultId = 'mmkv.default';
  const storageFor = id => {
    if (!stores.has(id)) stores.set(id, new Map());
    return stores.get(id);
  };
  const createStorage = configuration => {
    const id = configuration?.id || defaultId;
    const values = storageFor(id);
    return {
      id,
      isEncrypted: Boolean(configuration?.encryptionKey),
      getString: key => values.get(key),
      getNumber: key => values.get(key),
      getBoolean: key => values.get(key),
      set: (key, value) => values.set(key, value),
      remove: key => values.delete(key),
      contains: key => values.has(key),
      getAllKeys: () => [...values.keys()],
      clearAll: () => values.clear(),
      trim: () => undefined,
      importAllFrom: source => {
        const keys = source.getAllKeys();
        keys.forEach(key => {
          const value =
            source.getString(key) ??
            source.getNumber(key) ??
            source.getBoolean(key);
          if (value !== undefined) values.set(key, value);
        });
        return keys.length;
      },
    };
  };
  return {
    __stores: stores,
    createMMKV: configuration => createStorage(configuration),
    existsMMKV: id => stores.has(id),
    deleteMMKV: id => stores.delete(id),
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
