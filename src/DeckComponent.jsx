import React, { useState, useLayoutEffect, useEffect } from 'react';
import {
  Animated,
  Dimensions,
  LayoutAnimation,
  PanResponder,
  StyleSheet,
  UIManager,
  View,
} from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 0.25 * SCREEN_WIDTH;
const DURATION = 250;

const Deck = (props) => {
  const {
    onSwipeLeft,
    onSwipeRight,
    data,
    renderCard,
    renderNoMoreCards,
  } = props;

  const [index, setIndex] = useState(0);
  const [position] = useState(new Animated.ValueXY());
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (event, gesture) => {
      position.setValue({ x: gesture.dx, y: gesture.dy });
    },
    onPanResponderRelease: (event, gesture) => {
      if (gesture.dx > SWIPE_THRESHOLD) {
        forceSwipe('right');
      } else if (gesture.dx < -SWIPE_THRESHOLD) {
        forceSwipe('left');
      } else {
        resetPosition();
      }
    },
  });

  useEffect(() => {
    setIndex(0);
  }, [data]);

  useLayoutEffect(() => {
    UIManager.setLayoutAnimationEnabledExperimental &&
      UIManager.setLayoutAnimationEnabledExperimental(true);

    LayoutAnimation.spring();
  });

  const forceSwipe = (direction) => {
    const screenWidth = direction === 'right' ? SCREEN_WIDTH : -SCREEN_WIDTH;

    Animated.timing(position, {
      toValue: { x: screenWidth, y: 0 },
      duration: DURATION,
      useNativeDriver: false,
    }).start(() => onSwipeComplete(direction));
  };

  const onSwipeComplete = (direction) => {
    const item = data[index];

    position.setValue({ x: 0, y: 0 });
    direction === 'right' ? onSwipeRight(item) : onSwipeLeft(item);
    setIndex(index + 1);
  };

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: false,
    }).start();
  };

  const getCardStyle = () => {
    const rotate = position.x.interpolate({
      inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
      outputRange: ['-80deg', '0deg', '80deg'],
    });

    return { ...position.getLayout(), transform: [{ rotate }] };
  };

  const renderCards = () => {
    if (index >= data.length) {
      return renderNoMoreCards();
    }

    return data
      .map((item, i) => {
        if (i < index) return null;

        if (i === index) {
          return (
            <Animated.View
              key={item.id}
              style={[getCardStyle(), styles.cardStyle]}
              {...panResponder.panHandlers}
            >
              {renderCard(item)}
            </Animated.View>
          );
        }
        return (
          <Animated.View
            key={item.id}
            style={[styles.cardStyle, { top: 10 * i - index }]}
          >
            {renderCard(item)}
          </Animated.View>
        );
      })
      .reverse();
  };

  return <View>{renderCards()}</View>;
};

Deck.defaultProps = {
  onSwipeRight: () => {},
  onSwipeLeft: () => {},
};

const styles = StyleSheet.create({
  cardStyle: { position: 'absolute', width: SCREEN_WIDTH },
});

export default Deck;
