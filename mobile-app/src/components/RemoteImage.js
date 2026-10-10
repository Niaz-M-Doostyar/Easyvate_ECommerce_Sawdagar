import React, { useEffect, useMemo, useState, useContext } from 'react';
import { Image, View, StyleSheet } from 'react-native';
import { ImageLoadingContext } from './DeferredImages';
import { buildImageUriCandidates } from '../config';

export default function RemoteImage({
  source,
  fallbackSource,
  fallback = null,
  style,
  resizeMode = 'cover',
  width,
  quality,
  cache = 'force-cache',
  onError,
  onLoad,
  ...rest
}) {
  const enabled = useContext(ImageLoadingContext);
  const candidates = useMemo(() => {
    const options = width ? { width, quality } : undefined;
    const primary = buildImageUriCandidates(source, options);
    const secondary = buildImageUriCandidates(fallbackSource, options);
    return Array.from(new Set([...primary, ...secondary]));
  }, [fallbackSource, quality, source, width]);
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [exhausted, setExhausted] = useState(false);
  const [loadedUri, setLoadedUri] = useState(null);
  const previewUri = useMemo(() => width > 80
    ? buildImageUriCandidates(source, { width: 80 })[0] : null, [source, width]);

  useEffect(() => {
    setCandidateIndex(0);
    setExhausted(false);
  }, [candidates]);

  const uri = candidates[candidateIndex];
  if (!enabled || !uri || exhausted) {
    return fallback;
  }

  return (
    <View style={style}>
      {previewUri && previewUri !== uri && loadedUri !== uri && (
        <Image source={{ uri: previewUri, cache: 'force-cache' }} style={StyleSheet.absoluteFill}
          resizeMode={resizeMode} fadeDuration={0} accessible={false} />
      )}
    <Image
      source={cache ? { uri, cache } : { uri }}
      style={StyleSheet.absoluteFill}
      resizeMode={resizeMode}
      progressiveRenderingEnabled
      fadeDuration={220}
      onLoad={event => {
        setLoadedUri(uri);
        onLoad?.(event);
      }}
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
    </View>
  );
}