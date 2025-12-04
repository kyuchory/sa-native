import { useRef, useEffect, useCallback } from 'react';
import { RecordShortViewRequest } from '../types/cut';

interface ViewTrackingState {
  shortId: number;
  videoDuration: number;
  watchedSegments: Set<number>;
}

interface UseViewTrackingProps {
  shortId: number;
  isActive: boolean;
  onViewComplete: (shortId: number, data: RecordShortViewRequest) => void;
}

const COMPLETION_THRESHOLD = 0.9;

export const useShortViewTracking = ({
  shortId,
  isActive,
  onViewComplete,
}: UseViewTrackingProps) => {
  const trackingRef = useRef<ViewTrackingState>({
    shortId,
    videoDuration: 0,
    watchedSegments: new Set(),
  });

  const rafRef = useRef<number | null>(null);

  // shortId 변경 시 초기화
  useEffect(() => {
    trackingRef.current = {
      shortId,
      videoDuration: 0,
      watchedSegments: new Set(),
    };
  }, [shortId]);

  const trackingLoop = useCallback((player: any) => {
    if (!player.playing) {
      rafRef.current = requestAnimationFrame(() => trackingLoop(player));
      return;
    }

    const currentTime = player.currentTime || 0;
    const duration = player.duration || 0;
    const tracking = trackingRef.current;

    if (duration > 0 && tracking.videoDuration === 0) {
      tracking.videoDuration = duration;
    }

    const currentSecond = Math.floor(currentTime);
    if (!tracking.watchedSegments.has(currentSecond)) {
      tracking.watchedSegments.add(currentSecond);
    }

    rafRef.current = requestAnimationFrame(() => trackingLoop(player));
  }, []);

  const startTracking = useCallback((player: any) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => trackingLoop(player));
  }, [trackingLoop]);

  const stopTracking = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const recordAndReset = useCallback(() => {
    const tracking = trackingRef.current;
    const watchedSeconds = tracking.watchedSegments.size;

    if (watchedSeconds >= 1) {
      const duration = Math.floor(tracking.videoDuration);
      const watchedRatio = duration > 0 ? watchedSeconds / duration : 0;

      onViewComplete(tracking.shortId, {
        watched_seconds: watchedSeconds,
        is_completed: watchedRatio >= COMPLETION_THRESHOLD,
      });
    }

    stopTracking();
  }, [onViewComplete, stopTracking]);

  useEffect(() => {
    return () => stopTracking();
  }, [stopTracking]);

  return { startTracking, stopTracking, recordAndReset };
};
