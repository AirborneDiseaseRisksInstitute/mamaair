import * as Keychain from 'react-native-keychain';
import {
  createMMKV,
  deleteMMKV,
  existsMMKV,
  type Configuration,
  type MMKV,
} from 'react-native-mmkv';

const STORAGE_KEY_SERVICE = 'africa.mamaair.mobile.storage-key.v1';
const STORAGE_KEY_USERNAME = 'mamaair-storage-key';
const STORAGE_KEY_VERSION = 1;
const DEFAULT_MMKV_ID = 'mmkv.default';
const SECURE_ID_PREFIX = 'mamaair.secure.v1.';
const VERIFICATION_KEY = '__mamaair_secure_storage_verification_v1';
const VERIFICATION_VALUE = 'mamaair-secure-storage-v1';
const MIGRATION_KEY = '__mamaair_secure_storage_migrated_v1';
const KEY_ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

export const LEGACY_MMKV_IDS = [
  DEFAULT_MMKV_ID,
  'mamaair-recommendation-experience',
  'mamaair-product-analytics',
  'mamaair-notification-navigation',
  'mamaair-location-permission',
  'mamaair-ad-display',
] as const;

export const ENCRYPTED_LOCATION_STORAGE_ID = 'mamaair-location-queue';

const ALL_SECURE_STORAGE_IDS = [
  ...LEGACY_MMKV_IDS,
  ENCRYPTED_LOCATION_STORAGE_ID,
] as const;

interface StoredEncryptionKey {
  version: number;
  key: string;
}

type EncryptedMMKVConfiguration = Omit<
  Configuration,
  'encryptionKey' | 'encryptionType'
>;

let encryptionKey: string | null = null;
let initializationPromise: Promise<void> | null = null;
let encryptionEnabledInTests = false;

const isTestEnvironment = (): boolean => typeof jest !== 'undefined';

const shouldBypassEncryption = (): boolean =>
  isTestEnvironment() && !encryptionEnabledInTests;

export const secureStorageId = (legacyId: string): string =>
  `${SECURE_ID_PREFIX}${legacyId}`;

const keychainOptions = { service: STORAGE_KEY_SERVICE };

const parseStoredKey = (value: string): string => {
  const parsed = JSON.parse(value) as Partial<StoredEncryptionKey>;
  if (
    parsed.version !== STORAGE_KEY_VERSION ||
    typeof parsed.key !== 'string' ||
    parsed.key.length !== 32
  ) {
    throw new Error('The secure storage key is invalid.');
  }
  return parsed.key;
};

const generateEncryptionKey = (): string => {
  const randomValues = new Uint8Array(32);
  const cryptoProvider = (
    globalThis as typeof globalThis & {
      crypto?: { getRandomValues?: (values: Uint8Array) => Uint8Array };
    }
  ).crypto;

  if (!cryptoProvider?.getRandomValues) {
    throw new Error('A cryptographically secure random source is unavailable.');
  }
  cryptoProvider.getRandomValues(randomValues);
  return Array.from(
    randomValues,
    value => KEY_ALPHABET[value % KEY_ALPHABET.length],
  ).join('');
};

const hasExistingSecureStorage = (): boolean =>
  ALL_SECURE_STORAGE_IDS.some(id => existsMMKV(secureStorageId(id)));

const persistEncryptionKey = async (key: string): Promise<void> => {
  const payload: StoredEncryptionKey = {
    version: STORAGE_KEY_VERSION,
    key,
  };
  const result = await Keychain.setGenericPassword(
    STORAGE_KEY_USERNAME,
    JSON.stringify(payload),
    {
      ...keychainOptions,
      accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
      cloudSync: false,
      securityLevel: Keychain.SECURITY_LEVEL.SECURE_SOFTWARE,
      storage: Keychain.STORAGE_TYPE.AES_GCM_NO_AUTH,
    },
  );
  if (!result) throw new Error('The secure storage key could not be stored.');

  const verified = await Keychain.getGenericPassword(keychainOptions);
  if (
    !verified ||
    verified.username !== STORAGE_KEY_USERNAME ||
    parseStoredKey(verified.password) !== key
  ) {
    await Keychain.resetGenericPassword(keychainOptions).catch(() => false);
    throw new Error('The secure storage key could not be verified.');
  }
};

const loadOrCreateEncryptionKey = async (): Promise<string> => {
  const credentials = await Keychain.getGenericPassword(keychainOptions);
  if (credentials) {
    if (credentials.username !== STORAGE_KEY_USERNAME) {
      throw new Error('The secure storage key owner is invalid.');
    }
    return parseStoredKey(credentials.password);
  }

  // Never silently replace a lost key: doing so would make existing encrypted
  // health data unreadable and look like an empty profile.
  if (hasExistingSecureStorage()) {
    throw new Error('The secure storage key is unavailable.');
  }

  const key = generateEncryptionKey();
  await persistEncryptionKey(key);
  return key;
};

const openSecureStorage = (id: string, key: string): MMKV => {
  const encryptedId = secureStorageId(id);
  const alreadyExists = existsMMKV(encryptedId);
  const storage = createMMKV({
    id: encryptedId,
    encryptionKey: key,
    encryptionType: 'AES-256',
  });

  if (alreadyExists) {
    if (storage.getString(VERIFICATION_KEY) !== VERIFICATION_VALUE) {
      throw new Error(`Secure storage verification failed for ${id}.`);
    }
  } else {
    storage.set(VERIFICATION_KEY, VERIFICATION_VALUE);
  }

  return storage;
};

const removeLegacyStorage = (id: string): void => {
  const legacyStorage = createMMKV({ id });
  legacyStorage.clearAll();
  legacyStorage.trim();
  if (!deleteMMKV(id) && existsMMKV(id)) {
    throw new Error(`Plaintext storage could not be removed for ${id}.`);
  }
};

const migrateLegacyStorage = (id: string, key: string): void => {
  const legacyExists = existsMMKV(id);
  const secureExists = existsMMKV(secureStorageId(id));
  if (!legacyExists && !secureExists) return;

  const secureStorage = openSecureStorage(id, key);
  if (secureStorage.getBoolean(MIGRATION_KEY) === true) {
    if (legacyExists) removeLegacyStorage(id);
    return;
  }

  if (!legacyExists) {
    // Secure stores created on a fresh install before this fix contain a
    // valid verification value but no migration marker. The legacy removal
    // path writes the marker before deleting plaintext, so a verified
    // secure-only store is safe to finalize without discarding its data.
    secureStorage.set(MIGRATION_KEY, true);
    return;
  }

  const legacyStorage = createMMKV({ id });
  const legacyKeys = legacyStorage.getAllKeys();
  secureStorage.importAllFrom(legacyStorage);

  if (legacyKeys.some(legacyKey => !secureStorage.contains(legacyKey))) {
    throw new Error(`Secure storage migration verification failed for ${id}.`);
  }

  secureStorage.set(VERIFICATION_KEY, VERIFICATION_VALUE);
  secureStorage.set(MIGRATION_KEY, true);
  removeLegacyStorage(id);
};

export const initializeEncryptedStorage = (
  options: { forceInTest?: boolean } = {},
): Promise<void> => {
  if (options.forceInTest) encryptionEnabledInTests = true;
  if (shouldBypassEncryption()) return Promise.resolve();
  if (encryptionKey) return Promise.resolve();
  if (initializationPromise) return initializationPromise;

  initializationPromise = (async () => {
    const key = await loadOrCreateEncryptionKey();
    LEGACY_MMKV_IDS.forEach(id => migrateLegacyStorage(id, key));
    encryptionKey = key;
  })().catch(error => {
    initializationPromise = null;
    encryptionKey = null;
    throw error;
  });

  return initializationPromise;
};

export const createEncryptedMMKV = (
  configuration: EncryptedMMKVConfiguration = { id: DEFAULT_MMKV_ID },
): MMKV => {
  const id = configuration.id || DEFAULT_MMKV_ID;
  if (shouldBypassEncryption()) return createMMKV({ ...configuration, id });
  if (!encryptionKey) {
    throw new Error('Encrypted storage has not been initialized.');
  }

  const encryptedId = secureStorageId(id);
  const alreadyExists = existsMMKV(encryptedId);
  const storage = createMMKV({
    ...configuration,
    id: encryptedId,
    encryptionKey,
    encryptionType: 'AES-256',
  });

  if (alreadyExists) {
    if (storage.getString(VERIFICATION_KEY) !== VERIFICATION_VALUE) {
      throw new Error(`Secure storage verification failed for ${id}.`);
    }
  } else {
    storage.set(VERIFICATION_KEY, VERIFICATION_VALUE);
    // This store was created directly by the current app, not by the legacy
    // migration path, so it is already in its final encrypted form.
    storage.set(MIGRATION_KEY, true);
  }
  return storage;
};

export const clearEncryptedMMKVData = (storage: MMKV): void => {
  storage
    .getAllKeys()
    .filter(key => key !== VERIFICATION_KEY && key !== MIGRATION_KEY)
    .forEach(key => storage.remove(key));
};

export const __resetEncryptedStorageForTests = (): void => {
  if (!isTestEnvironment()) {
    throw new Error('Encrypted storage can only be reset by tests.');
  }
  encryptionKey = null;
  initializationPromise = null;
  encryptionEnabledInTests = false;
};
