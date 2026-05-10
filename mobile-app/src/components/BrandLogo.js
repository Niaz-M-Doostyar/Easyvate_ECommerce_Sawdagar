import React from 'react';
import { Image } from 'react-native';

const WORDMARK = require('../../assets/brand-logo.png');
const SYMBOL = require('../../assets/brand-symbol.png');
const WORDMARK_RATIO = 1416 / 348;
const SYMBOL_RATIO = 187 / 257;

export default function BrandLogo({ variant = 'wordmark', width = 176, size = 72, style }) {
  if (variant === 'symbol') {
    return (
      <Image
        source={SYMBOL}
        resizeMode="contain"
        style={[
          {
            width: size * SYMBOL_RATIO,
            height: size,
          },
          style,
        ]}
      />
    );
  }

  return (
    <Image
      source={WORDMARK}
      resizeMode="contain"
      style={[
        {
          width,
          height: width / WORDMARK_RATIO,
        },
        style,
      ]}
    />
  );
}