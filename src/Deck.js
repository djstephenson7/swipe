import React, { Component } from 'react';
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

class Deck extends Component {
  static defaultProps = {
    onSwipeRight: () => {},
    onSwipeLeft: () => {},
  };

  constructor(props) {
    super(props);
    const position = new Animated.ValueXY();
    const panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (event, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (event, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          this.forceSwipe('right');
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          this.forceSwipe('left');
        } else {
          this.resetPosition();
        }
      },
    });

    this.state = { panResponder, position, index: 0 };
  }

  //WARNING! To be deprecated in React v17. Use new lifecycle static getDerivedStateFromProps instead.
  componentWillReceiveProps(nextProps) {
    if (nextProps.data !== this.props.data) {
      this.setState({ index: 0 });
    }
  }

  componentDidUpdate() {
    UIManager.setLayoutAnimationEnabledExperimental &&
      UIManager.setLayoutAnimationEnabledExperimental(true);
    LayoutAnimation.spring();
  }

  forceSwipe(direction) {
    const screenWidth = direction === 'right' ? SCREEN_WIDTH : -SCREEN_WIDTH;

    Animated.timing(this.state.position, {
      toValue: { x: screenWidth, y: 0 },
      duration: DURATION,
      useNativeDriver: false,
    }).start(() => this.onSwipeComplete(direction));
  }

  onSwipeComplete(direction) {
    const { onSwipeLeft, onSwipeRight, data } = this.props;
    const { index, position } = this.state;
    const item = data[index];

    position.setValue({ x: 0, y: 0 });
    direction === 'right' ? onSwipeRight(item) : onSwipeLeft(item);
    this.setState({ index: index + 1 });
  }

  resetPosition() {
    Animated.spring(this.state.position, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: false,
    }).start();
  }

  getCardStyle() {
    const { position } = this.state;
    const rotate = position.x.interpolate({
      inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
      outputRange: ['-80deg', '0deg', '80deg'],
    });

    return { ...position.getLayout(), transform: [{ rotate }] };
  }

  renderCards() {
    const { index, panResponder } = this.state;
    const { data, renderNoMoreCards, renderCard } = this.props;

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
              style={[this.getCardStyle(), styles.cardStyle]}
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
  }

  render() {
    return <View>{this.renderCards()}</View>;
  }
}

const styles = StyleSheet.create({
  cardStyle: { position: 'absolute', width: SCREEN_WIDTH },
});

export default Deck;
