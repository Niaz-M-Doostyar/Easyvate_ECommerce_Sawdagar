import React, { createContext, useEffect, useRef, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';

export const ImageLoadingContext = createContext(true);
const listeners = new Set();
let scheduled = false;

// One measurement pass per frame; loading stays enabled once a section approaches.
export function notifyImageViewport() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    listeners.forEach(check => check());
  });
}

export default function DeferredImages({ children }) {
  const view = useRef(null);
  const [ready, setReady] = useState(false);
  const { height } = useWindowDimensions();
  useEffect(() => {
    if (ready) return;
    let active = true;
    const check = () => view.current?.measureInWindow((_x, y, _width, measuredHeight) => {
      if (active && measuredHeight > 0 && y < height + 240 && y + measuredHeight > -240) setReady(true);
    });
    listeners.add(check);
    check();
    return () => { active = false; listeners.delete(check); };
  }, [height, ready]);
  return <View ref={view} collapsable={false} onLayout={notifyImageViewport}>
    <ImageLoadingContext.Provider value={ready}>{children}</ImageLoadingContext.Provider>
  </View>;
}
