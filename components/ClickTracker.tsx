'use client';

import { useEffect, useState, useRef } from 'react';

export default function ClickTracker() {
  const [clickCount, setClickCount] = useState(0);
  const [sessionStart] = useState(Date.now());

  const clickCountRef = useRef(0);

  useEffect(() => {
    clickCountRef.current = clickCount;
  }, [clickCount]);

  useEffect(() => {
    // Add global click listener
    const handleClick = () => {
      setClickCount(prev => prev + 1);
    };

    document.addEventListener('click', handleClick);

    // Handle beforeunload
    const handleBeforeUnload = () => {
      const sessionEnd = Date.now();
      // Send data to API
      navigator.sendBeacon?.('/api/track-clicks', JSON.stringify({
        clickCount: clickCountRef.current,
        sessionStart,
        sessionEnd,
      })) || fetch('/api/track-clicks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clickCount: clickCountRef.current,
          sessionStart,
          sessionEnd,
        }),
      });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('click', handleClick);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [sessionStart]);

  // This component doesn't render anything
  return null;
}