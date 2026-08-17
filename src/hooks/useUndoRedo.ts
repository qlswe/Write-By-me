import { useState, useCallback, useRef } from 'react';

export interface UndoRedoOptions {
  maxHistory?: number;
}

export function useUndoRedo<T>(
  initialPresent: T,
  options: UndoRedoOptions = {}
) {
  const { maxHistory = 40 } = options;
  const [past, setPast] = useState<T[]>([]);
  const [present, setPresent] = useState<T>(initialPresent);
  const [future, setFuture] = useState<T[]>([]);
  
  // Ref to track last state change timestamp for debounced history grouping
  const lastPushTimeRef = useRef<number>(0);

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  const undo = useCallback(() => {
    setPast((prevPast) => {
      if (prevPast.length === 0) return prevPast;
      const previous = prevPast[prevPast.length - 1];
      const newPast = prevPast.slice(0, prevPast.length - 1);

      setFuture((prevFuture) => [present, ...prevFuture]);
      setPresent(previous);
      return newPast;
    });
  }, [present]);

  const redo = useCallback(() => {
    setFuture((prevFuture) => {
      if (prevFuture.length === 0) return prevFuture;
      const next = prevFuture[0];
      const newFuture = prevFuture.slice(1);

      setPast((prevPast) => [...prevPast, present]);
      setPresent(next);
      return newFuture;
    });
  }, [present]);

  const set = useCallback((newPresent: T | ((curr: T) => T), shouldRecord: boolean = true) => {
    setPresent((current) => {
      const nextValue = typeof newPresent === 'function' ? (newPresent as (curr: T) => T)(current) : newPresent;
      if (nextValue === current) return current;

      if (shouldRecord) {
        setPast((prevPast) => {
          const updated = [...prevPast, current];
          if (updated.length > maxHistory) {
            return updated.slice(updated.length - maxHistory);
          }
          return updated;
        });
        setFuture([]);
      }
      return nextValue;
    });
  }, [maxHistory]);

  const reset = useCallback((newPresent: T) => {
    setPast([]);
    setPresent(newPresent);
    setFuture([]);
  }, []);

  return {
    state: present,
    set,
    undo,
    redo,
    canUndo,
    canRedo,
    reset,
    past,
    future
  };
}
