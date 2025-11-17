import { useCallback, useRef, useState } from 'react';

const ACCOUNT_STORAGE_KEY = 'chatsystem.account-name';

const getStoredAccountName = () => {
  if (typeof window === 'undefined') {
    return '';
  }
  return window.localStorage.getItem(ACCOUNT_STORAGE_KEY) ?? '';
};

const persistAccountName = (value: string) => {
  if (typeof window === 'undefined') {
    return;
  }
  if (value) {
    window.localStorage.setItem(ACCOUNT_STORAGE_KEY, value);
  } else {
    window.localStorage.removeItem(ACCOUNT_STORAGE_KEY);
  }
};

export const useQuickAccount = () => {
  const initialAccountName = useRef(getStoredAccountName());
  const [accountName, setAccountName] = useState(initialAccountName.current);

  const saveAccountName = useCallback((value: string) => {
    const normalized = value.trim();
    setAccountName(normalized);
    persistAccountName(normalized);
  }, []);

  const resetAccountName = useCallback(() => {
    setAccountName('');
    persistAccountName('');
  }, []);

  const normalizedName = accountName.trim();
  const isAccountReady = Boolean(normalizedName);
  const accountDisplayName = isAccountReady ? normalizedName : 'Guest user';

  return {
    accountName,
    isAccountReady,
    accountDisplayName,
    saveAccountName,
    resetAccountName,
  };
};

export type UseQuickAccountReturn = ReturnType<typeof useQuickAccount>;
