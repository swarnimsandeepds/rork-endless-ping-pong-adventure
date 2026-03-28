import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
  PanResponder,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Pause, Play, RotateCcw } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const PADDLE_HEIGHT = 12;
const PADDLE_WIDTH = 100;
const BALL_SIZE = 16;
const INITIAL_BALL_SPEED = 6;
const SPEED_INCREMENT = 0.3;
const AI_SPEED = 5;

type Particle = {
  x: number;
  y: number;
  opacity: Animated.Value;
  scale: Animated.Value;
};

export default function PingPongGame() {
  const insets = useSafeAreaInsets();
  
  const [score, setScore] = useState({ player: 0, ai: 0 });
  const [combo, setCombo] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [ballSpeed, setBallSpeed] = useState(INITIAL_BALL_SPEED);

  const playerPaddleX = useRef(new Animated.Value(SCREEN_WIDTH / 2 - PADDLE_WIDTH / 2)).current;
  const aiPaddleX = useRef(new Animated.Value(SCREEN_WIDTH / 2 - PADDLE_WIDTH / 2)).current;
  const ballX = useRef(new Animated.Value(SCREEN_WIDTH / 2 - BALL_SIZE / 2)).current;
  const ballY = useRef(new Animated.Value(SCREEN_HEIGHT / 2 - BALL_SIZE / 2)).current;

  const ballVelocity = useRef({ x: INITIAL_BALL_SPEED, y: INITIAL_BALL_SPEED });
  const playerPaddleXValue = useRef(SCREEN_WIDTH / 2 - PADDLE_WIDTH / 2);
  const aiPaddleXValue = useRef(SCREEN_WIDTH / 2 - PADDLE_WIDTH / 2);
  const ballXValue = useRef(SCREEN_WIDTH / 2 - BALL_SIZE / 2);
  const ballYValue = useRef(SCREEN_HEIGHT / 2 - BALL_SIZE / 2);

  const [particles, setParticles] = useState<Particle[]>([]);
  const animationFrame = useRef<number | null>(null);

  playerPaddleX.addListener(({ value }) => {
    playerPaddleXValue.current = value;
  });

  aiPaddleX.addListener(({ value }) => {
    aiPaddleXValue.current = value;
  });

  ballX.addListener(({ value }) => {
    ballXValue.current = value;
  });

  ballY.addListener(({ value }) => {
    ballYValue.current = value;
  });

  const createParticle = (x: number, y: number) => {
    const opacity = new Animated.Value(1);
    const scale = new Animated.Value(1);

    const particle: Particle = { x, y, opacity, scale };

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setParticles((prev) => prev.filter((p) => p !== particle));
    });

    setParticles((prev) => [...prev, particle]);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => gameStarted && !isPaused,
      onMoveShouldSetPanResponder: () => gameStarted && !isPaused,
      onPanResponderMove: (_, gestureState) => {
        let newX = gestureState.moveX - PADDLE_WIDTH / 2;
        newX = Math.max(0, Math.min(SCREEN_WIDTH - PADDLE_WIDTH, newX));
        
        playerPaddleX.setValue(newX);
      },
    })
  ).current;

  const resetBall = (scoredBy: 'player' | 'ai') => {
    ballVelocity.current = {
      x: scoredBy === 'player' ? INITIAL_BALL_SPEED : -INITIAL_BALL_SPEED,
      y: (Math.random() - 0.5) * INITIAL_BALL_SPEED,
    };
    
    ballX.setValue(SCREEN_WIDTH / 2 - BALL_SIZE / 2);
    ballY.setValue(SCREEN_HEIGHT / 2 - BALL_SIZE / 2);
    setBallSpeed(INITIAL_BALL_SPEED);
  };

  const startGame = () => {
    setGameStarted(true);
    setIsPaused(false);
    setScore({ player: 0, ai: 0 });
    setCombo(0);
    resetBall('ai');
  };

  const togglePause = () => {
    if (!gameStarted) return;
    setIsPaused(!isPaused);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const restartGame = () => {
    setGameStarted(false);
    setIsPaused(false);
    setScore({ player: 0, ai: 0 });
    setCombo(0);
    setBallSpeed(INITIAL_BALL_SPEED);
    
    playerPaddleX.setValue(SCREEN_WIDTH / 2 - PADDLE_WIDTH / 2);
    aiPaddleX.setValue(SCREEN_WIDTH / 2 - PADDLE_WIDTH / 2);
    ballX.setValue(SCREEN_WIDTH / 2 - BALL_SIZE / 2);
    ballY.setValue(SCREEN_HEIGHT / 2 - BALL_SIZE / 2);
    
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  useEffect(() => {
    if (!gameStarted || isPaused) {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
        animationFrame.current = null;
      }
      return;
    }

    const gameLoop = () => {
      let newBallX = ballXValue.current + ballVelocity.current.x;
      let newBallY = ballYValue.current + ballVelocity.current.y;

      if (newBallX <= 0 || newBallX >= SCREEN_WIDTH - BALL_SIZE) {
        ballVelocity.current.x *= -1;
        newBallX = Math.max(0, Math.min(SCREEN_WIDTH - BALL_SIZE, newBallX));
        createParticle(newBallX + BALL_SIZE / 2, newBallY + BALL_SIZE / 2);
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }

      if (
        newBallY + BALL_SIZE >= SCREEN_HEIGHT - PADDLE_HEIGHT &&
        newBallX + BALL_SIZE >= playerPaddleXValue.current &&
        newBallX <= playerPaddleXValue.current + PADDLE_WIDTH
      ) {
        ballVelocity.current.y = -Math.abs(ballVelocity.current.y);
        const hitPosition = (newBallX + BALL_SIZE / 2 - playerPaddleXValue.current) / PADDLE_WIDTH;
        ballVelocity.current.x = (hitPosition - 0.5) * 10;
        
        const newSpeed = ballSpeed + SPEED_INCREMENT;
        setBallSpeed(newSpeed);
        ballVelocity.current.y = -newSpeed;
        
        setCombo((prev) => prev + 1);
        createParticle(newBallX + BALL_SIZE / 2, newBallY + BALL_SIZE / 2);
        
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
      }

      if (
        newBallY <= PADDLE_HEIGHT &&
        newBallX + BALL_SIZE >= aiPaddleXValue.current &&
        newBallX <= aiPaddleXValue.current + PADDLE_WIDTH
      ) {
        ballVelocity.current.y = Math.abs(ballVelocity.current.y);
        const hitPosition = (newBallX + BALL_SIZE / 2 - aiPaddleXValue.current) / PADDLE_WIDTH;
        ballVelocity.current.x = (hitPosition - 0.5) * 10;
        
        createParticle(newBallX + BALL_SIZE / 2, newBallY + BALL_SIZE / 2);
        
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }

      if (newBallY > SCREEN_HEIGHT) {
        setScore((prev) => ({ ...prev, ai: prev.ai + 1 }));
        setCombo(0);
        resetBall('ai');
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        return;
      }

      if (newBallY < -BALL_SIZE) {
        setScore((prev) => ({ ...prev, player: prev.player + 1 }));
        resetBall('player');
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        return;
      }

      const aiTargetX = ballXValue.current - PADDLE_WIDTH / 2 + BALL_SIZE / 2;
      const aiCurrentX = aiPaddleXValue.current;
      const aiDiff = aiTargetX - aiCurrentX;
      
      let newAiX = aiCurrentX + Math.sign(aiDiff) * Math.min(AI_SPEED, Math.abs(aiDiff));
      newAiX = Math.max(0, Math.min(SCREEN_WIDTH - PADDLE_WIDTH, newAiX));

      ballX.setValue(newBallX);
      ballY.setValue(newBallY);
      aiPaddleX.setValue(newAiX);

      animationFrame.current = requestAnimationFrame(gameLoop);
    };

    animationFrame.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [gameStarted, isPaused, ballSpeed]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0f0c29', '#302b63', '#24243e']}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>YOU</Text>
          <Text style={styles.scoreText}>{score.player}</Text>
        </View>

        <View style={styles.centerInfo}>
          {combo > 2 && (
            <View style={styles.comboContainer}>
              <Text style={styles.comboText}>{combo}x COMBO!</Text>
            </View>
          )}
        </View>

        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>AI</Text>
          <Text style={styles.scoreText}>{score.ai}</Text>
        </View>
      </View>

      <View style={styles.controls}>
        {!gameStarted ? (
          <TouchableOpacity style={styles.startButton} onPress={startGame}>
            <LinearGradient
              colors={['#00f2fe', '#4facfe']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.startButtonGradient}
            >
              <Play color="#fff" size={32} fill="#fff" />
              <Text style={styles.startButtonText}>START GAME</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <View style={styles.gameControls}>
            <TouchableOpacity style={styles.controlButton} onPress={togglePause}>
              {isPaused ? (
                <Play color="#00f2fe" size={24} fill="#00f2fe" />
              ) : (
                <Pause color="#00f2fe" size={24} fill="#00f2fe" />
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlButton} onPress={restartGame}>
              <RotateCcw color="#ff6b9d" size={24} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {gameStarted && (
        <>
          <View style={styles.gameArea} {...panResponder.panHandlers}>
            <Animated.View
              style={[
                styles.paddle,
                styles.playerPaddle,
                {
                  transform: [{ translateX: playerPaddleX }],
                },
              ]}
            >
              <LinearGradient
                colors={['#00f2fe', '#4facfe']}
                style={styles.paddleGradient}
              />
            </Animated.View>

            <Animated.View
              style={[
                styles.paddle,
                styles.aiPaddle,
                {
                  transform: [{ translateX: aiPaddleX }],
                },
              ]}
            >
              <LinearGradient
                colors={['#ff6b9d', '#ffc371']}
                style={styles.paddleGradient}
              />
            </Animated.View>

            <Animated.View
              style={[
                styles.ball,
                {
                  transform: [
                    { translateX: ballX },
                    { translateY: ballY },
                  ],
                },
              ]}
            >
              <LinearGradient
                colors={['#f093fb', '#f5576c']}
                style={styles.ballGradient}
              />
            </Animated.View>

            {particles.map((particle, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.particle,
                  {
                    left: particle.x,
                    top: particle.y,
                    opacity: particle.opacity,
                    transform: [{ scale: particle.scale }],
                  },
                ]}
              />
            ))}

            <View style={styles.centerLine} />
          </View>

          {isPaused && (
            <View style={styles.pauseOverlay}>
              <Text style={styles.pauseText}>PAUSED</Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0c29',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 30,
    paddingBottom: 20,
    zIndex: 10,
  },
  scoreContainer: {
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
    opacity: 0.6,
    letterSpacing: 2,
  },
  scoreText: {
    fontSize: 48,
    fontWeight: '800' as const,
    color: '#fff',
    marginTop: 5,
  },
  centerInfo: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  comboContainer: {
    backgroundColor: 'rgba(255, 107, 157, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#ff6b9d',
  },
  comboText: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: '#ff6b9d',
    letterSpacing: 1,
  },
  controls: {
    alignItems: 'center',
    marginBottom: 20,
    zIndex: 10,
  },
  startButton: {
    borderRadius: 30,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#00f2fe',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 18,
    gap: 12,
  },
  startButtonText: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#fff',
    letterSpacing: 2,
  },
  gameControls: {
    flexDirection: 'row',
    gap: 16,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  gameArea: {
    flex: 1,
    position: 'relative',
  },
  paddle: {
    position: 'absolute',
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    borderRadius: PADDLE_HEIGHT / 2,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#00f2fe',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  playerPaddle: {
    bottom: 20,
  },
  aiPaddle: {
    top: 20,
  },
  paddleGradient: {
    flex: 1,
  },
  ball: {
    position: 'absolute',
    width: BALL_SIZE,
    height: BALL_SIZE,
    borderRadius: BALL_SIZE / 2,
    overflow: 'hidden',
    elevation: 15,
    shadowColor: '#f5576c',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
  },
  ballGradient: {
    flex: 1,
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f5576c',
  },
  centerLine: {
    position: 'absolute',
    top: SCREEN_HEIGHT / 2 - 1,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  pauseOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  pauseText: {
    fontSize: 48,
    fontWeight: '800' as const,
    color: '#fff',
    letterSpacing: 4,
  },
});
