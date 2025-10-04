import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { UpdateCharacterRequest } from '@/types/api';
import { isError } from '@/types/api';
import { update as updateCharacter } from '@/services/characterService';
import { showError } from '@/utils/errorDisplay';

const AUTOSAVE_DELAY = 800;
const AUTOSAVE_MAX_WAIT = 4000;

export type CharacterPatch = UpdateCharacterRequest;

interface AutosaveHandle {
  save: (patch: CharacterPatch) => Promise<void>;
  flush: () => Promise<void>;
}

export function useCharacterAutosave(characterId?: string | number | null): AutosaveHandle {
  const idRef = useRef<string | null>(characterId ? String(characterId) : null);
  const latestPatchRef = useRef<CharacterPatch | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxWaitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstScheduledAtRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const flushingRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    idRef.current = characterId ? String(characterId) : null;
  }, [characterId]);

  const clearTimers = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (maxWaitTimerRef.current) {
      clearTimeout(maxWaitTimerRef.current);
      maxWaitTimerRef.current = null;
    }
  }, []);

  const flush = useCallback(async () => {
    if (flushingRef.current) {
      return flushingRef.current;
    }

    if (!idRef.current || !latestPatchRef.current) {
      clearTimers();
      firstScheduledAtRef.current = null;
      return Promise.resolve();
    }

    const patch = latestPatchRef.current;
    latestPatchRef.current = null;
    clearTimers();
    firstScheduledAtRef.current = null;

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const requestPromise = updateCharacter(idRef.current, patch, controller.signal)
      .then((result) => {
        if (isError(result)) {
          showError(result.error ?? 'Failed to save character', result.statusCode, result.errorCode);
        }
      })
      .finally(() => {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
        if (flushingRef.current === requestPromise) {
          flushingRef.current = null;
        }
      });

    flushingRef.current = requestPromise;
    return requestPromise;
  }, [clearTimers]);

  const scheduleFlush = useCallback(() => {
    clearTimers();

    debounceTimerRef.current = setTimeout(() => {
      void flush();
    }, AUTOSAVE_DELAY);

    const firstScheduledAt = firstScheduledAtRef.current;
    if (firstScheduledAt === null) {
      firstScheduledAtRef.current = Date.now();
    }

    const elapsed = firstScheduledAtRef.current ? Date.now() - firstScheduledAtRef.current : 0;
    if (elapsed >= AUTOSAVE_MAX_WAIT) {
      void flush();
    } else {
      maxWaitTimerRef.current = setTimeout(() => {
        void flush();
      }, AUTOSAVE_MAX_WAIT - elapsed);
    }
  }, [clearTimers, flush]);

  const save = useCallback(async (patch: CharacterPatch) => {
    if (!idRef.current) {
      return;
    }

    latestPatchRef.current = {
      ...(latestPatchRef.current ?? {}),
      ...patch,
    };

    if (!firstScheduledAtRef.current) {
      firstScheduledAtRef.current = Date.now();
    }

    scheduleFlush();
  }, [scheduleFlush]);

  useEffect(() => () => {
    clearTimers();
    abortControllerRef.current?.abort();
  }, [clearTimers]);

  return useMemo(
    () => ({
      save,
      flush,
    }),
    [flush, save]
  );
}
