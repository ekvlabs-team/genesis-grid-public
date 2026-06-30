function normalizeWallet(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

export function bindMediaStateToWallet(media, wallet) {
  return {
    ...(media || {}),
    wallet: normalizeWallet(wallet),
  };
}

export function mediaSelectedState(wallet = '') {
  return {
    status: 'selected',
    wallet: normalizeWallet(wallet),
    message: 'Client check passed. API upload starts after the wallet session is active.',
  };
}

export function mediaCreatingIntentState(wallet = '') {
  return {
    status: 'creating_intent',
    wallet: normalizeWallet(wallet),
    message: 'Creating private quarantine intent through the Genesis Grid API.',
  };
}

export function mediaFailedState(error, wallet = '') {
  return {
    status: 'failed',
    wallet: normalizeWallet(wallet),
    message: error?.message || 'Media upload failed before quarantine.',
  };
}

export function mediaIntentAcceptedState(media) {
  return {
    ...media,
    status: 'intent_accepted',
    canComplete: false,
    message: 'Secure quarantine upload target is not available yet. Intent was accepted; no uploaded state is claimed.',
  };
}

export function canSubmitWithMedia(media, wallet = '') {
  const ready = media?.status === 'uploaded' || media?.status === 'approved';
  const ownerWallet = normalizeWallet(media?.wallet);
  const currentWallet = normalizeWallet(wallet);
  return ready && Boolean(ownerWallet) && ownerWallet === currentWallet;
}

export function mediaStatusTitle(status) {
  return status === 'intent_accepted'
    ? 'Intent accepted'
    : String(status || 'pending').replace(/_/gu, ' ');
}
