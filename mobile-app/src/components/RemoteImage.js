import React, { useEffect, useMemo, useState } from 'react';
import { Image } from 'react-native';
import { buildImageUriCandidates } from '../config';

export default function RemoteImage({
  source,
  fallbackSource,
  fallback = null,
  style,
  resizeMode = 'cover',
  cache = 'force-cache',
  onError,
  onLoad,
  ...rest
}) {
  const candidates = useMemo(() => {
    const primary = buildImageUriCandidates(source);
    const secondary = buildImageUriCandidates(fallbackSource);
    return Array.from(new Set([...primary, ...secondary]));
  }, [fallbackSource, source]);
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [exhausted, setExhausted] = useState(false);

  useEffect(() => {
    setCandidateIndex(0);
    setExhausted(false);
  }, [candidates]);

  const uri = candidates[candidateIndex];
  if (!uri || exhausted) {
    return fallback;
  }

  return (
    <Image
      source={{ uri, cache }}
      style={style}
      resizeMode={resizeMode}
      progressiveRenderingEnabled
      fadeDuration={220}
      onLoad={onLoad}
      onError={(event) => {
        setCandidateIndex((current) => {
          if (current + 1 < candidates.length) {
            return current + 1;
          }
          setExhausted(true);
          return current;
        });

        if (onError) {
          onError(event);
        }
      }}
      {...rest}
    />
  );
}