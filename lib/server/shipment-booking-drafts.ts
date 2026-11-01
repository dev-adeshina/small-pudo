interface DraftSnapshot {
  exists: boolean;
  data(): { status?: unknown } | undefined;
}

/**
 * Run the read/status guard and update callback inside the caller's Firestore
 * transaction. The caller owns the transaction and update payload.
 */
export async function updateDraftOnlyWhileEditable(
  readDraft: () => Promise<DraftSnapshot>,
  updateDraft: () => void
): Promise<boolean> {
  const snapshot = await readDraft();

  if (!snapshot.exists || snapshot.data()?.status !== "draft") {
    return false;
  }

  updateDraft();
  return true;
}
