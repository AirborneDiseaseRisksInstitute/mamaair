import * as Keychain from 'react-native-keychain';
import { createMMKV, existsMMKV } from 'react-native-mmkv';
import * as storageModule from '../../src/services/storage/EncryptedStorage';

const keychainMock = Keychain as jest.Mocked<typeof Keychain> & {
  __credentials: Map<
    string,
    { username: string; password: string; service: string }
  >;
};

const clearStorageState = (): void => {
  const mmkvMock = jest.requireMock('react-native-mmkv') as {
    __stores: Map<string, Map<string, unknown>>;
  };
  mmkvMock.__stores.clear();
  keychainMock.__credentials.clear();
  jest.clearAllMocks();
};

const installDeterministicCrypto = (): void => {
  Object.defineProperty(globalThis, 'crypto', {
    configurable: true,
    value: {
      getRandomValues: (values: Uint8Array) => {
        values.forEach((_, index) => {
          values[index] = index;
        });
        return values;
      },
    },
  });
};

describe('encrypted MMKV bootstrap', () => {
  beforeEach(() => {
    storageModule.__resetEncryptedStorageForTests();
    clearStorageState();
    installDeterministicCrypto();
  });

  it('migrates plaintext data to AES-256 storage and protects its key', async () => {
    const legacyStorage = createMMKV({ id: 'mmkv.default' });
    legacyStorage.set('user_email', 'person@example.com');

    await storageModule.initializeEncryptedStorage({ forceInTest: true });
    const encryptedStorage = storageModule.createEncryptedMMKV();

    expect(encryptedStorage.id).toBe(
      storageModule.secureStorageId('mmkv.default'),
    );
    expect(encryptedStorage.isEncrypted).toBe(true);
    expect(encryptedStorage.getString('user_email')).toBe('person@example.com');
    expect(legacyStorage.contains('user_email')).toBe(false);
    expect(existsMMKV('mmkv.default')).toBe(false);
    expect(keychainMock.setGenericPassword).toHaveBeenCalledWith(
      'mamaair-storage-key',
      expect.any(String),
      expect.objectContaining({
        service: 'africa.mamaair.mobile.storage-key.v1',
        cloudSync: false,
        storage: 'KeystoreAESGCM_NoAuth',
      }),
    );
  });

  it('fails closed instead of replacing a missing key', async () => {
    createMMKV({
      id: storageModule.secureStorageId('mmkv.default'),
      encryptionKey: 'existing-encryption-key-value',
      encryptionType: 'AES-256',
    });

    await expect(
      storageModule.initializeEncryptedStorage({ forceInTest: true }),
    ).rejects.toThrow('secure storage key is unavailable');
    expect(keychainMock.setGenericPassword).not.toHaveBeenCalled();
  });
});
