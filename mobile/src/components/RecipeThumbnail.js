import React, { useState, useEffect } from 'react';
import { Image, Text, StyleSheet } from 'react-native';
import { resolveImageUrl } from '../services/api';

export default function RecipeThumbnail({
  uri,
  style,
  imageStyle,
  emojiSize = 30,
  fallbackEmoji = '🍲',
}) {
  const [hasError, setHasError] = useState(false);
  const resolvedUri = resolveImageUrl(uri);

  useEffect(() => {
    setHasError(false);
  }, [resolvedUri]);

  if (resolvedUri && !hasError) {
    return (
      <Image
        source={{ uri: resolvedUri }}
        style={[styles.defaultImage, style, imageStyle]}
        resizeMode="cover"
        onError={() => setHasError(true)}
      />
    );
  }

  const isEmojiText = typeof uri === 'string' && uri.trim() !== '' && !uri.includes('/');

  return (
    <Text style={{ fontSize: emojiSize }}>
      {isEmojiText ? uri : fallbackEmoji}
    </Text>
  );
}

const styles = StyleSheet.create({
  defaultImage: {
    width: '100%',
    height: '100%',
  },
});