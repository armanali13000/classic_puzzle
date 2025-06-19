// ✅ Complete working version
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  LayoutAnimation,
  UIManager,
  Platform,
  ViewStyle,
  ImageStyle,
} from 'react-native';
import { Audio } from 'expo-av';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

const screenWidth = Dimensions.get('window').width;

const moveSound = require('./assets/sounds/move.mp3');
const winSound = require('./assets/sounds/win.mp3');

const levelImages = [
  require('./assets/images/level1.jpg'),
  require('./assets/images/level2.jpg'),
  require('./assets/images/level3.jpg'),
  require('./assets/images/level4.jpg'),
  require('./assets/images/level5.jpg'),
  require('./assets/images/level6.jpg'),
  require('./assets/images/level7.jpg'),
  require('./assets/images/level8.jpg'),
  require('./assets/images/level9.jpg'),
  require('./assets/images/level10.jpg'),
  require('./assets/images/level11.jpg'),
  require('./assets/images/level12.jpg'),
  require('./assets/images/level13.jpg'),
  require('./assets/images/level14.jpg'),
  require('./assets/images/level15.jpg'),
];

export default function App() {
  const [level, setLevel] = useState(1);
  const [tiles, setTiles] = useState<number[]>([]);
  const [gridSize, setGridSize] = useState(2);
  const [gameWon, setGameWon] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);

  const totalTiles = gridSize * gridSize;
  const tileSize = screenWidth / gridSize;
  const currentImage = levelImages[imageIndex];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive) {
      interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive]);

  useEffect(() => {
    setGridByLevel();
  }, [level]);

  useEffect(() => {
    generatePuzzle();
  }, [gridSize, imageIndex]);

  const playSound = async (soundFile: any) => {
    const { sound } = await Audio.Sound.createAsync(soundFile);
    await sound.playAsync();
    sound.setOnPlaybackStatusUpdate((status) => {
      if ('isPlaying' in status && !status.isPlaying) {
        sound.unloadAsync();
      }
    });
  };

  const setGridByLevel = () => {
    if (level <= 3) setGridSize(2);
    else if (level <= 10) setGridSize(3);
    else if (level <= 13) setGridSize(4);
    else setGridSize(5);
  };

  const generatePuzzle = () => {
    const initial = [...Array(totalTiles).keys()];
    let shuffled = shuffle([...initial]);
    // prevent instantly solved puzzle
    while (shuffled.every((val, idx) => val === idx)) {
      shuffled = shuffle([...initial]);
    }
    setTiles(shuffled);
    setGameWon(false);
    setSeconds(0);
    setTimerActive(true);
  };

  const shuffle = (arr: number[]) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const isAdjacent = (i1: number, i2: number) => {
    const row1 = Math.floor(i1 / gridSize);
    const col1 = i1 % gridSize;
    const row2 = Math.floor(i2 / gridSize);
    const col2 = i2 % gridSize;
    return (
      (row1 === row2 && Math.abs(col1 - col2) === 1) ||
      (col1 === col2 && Math.abs(row1 - row2) === 1)
    );
  };

  const moveTile = async (index: number) => {
    const emptyIndex = tiles.indexOf(totalTiles - 1);
    if (isAdjacent(index, emptyIndex)) {
      const newTiles = [...tiles];
      [newTiles[index], newTiles[emptyIndex]] = [newTiles[emptyIndex], newTiles[index]];
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setTiles(newTiles);
      await playSound(moveSound);
      checkWin(newTiles);
    }
  };

  const checkWin = async (arr: number[]) => {
    const isSolved = arr.every((val, idx) => val === idx);
    if (isSolved) {
      setGameWon(true);
      setTimerActive(false);
      await playSound(winSound);
    }
  };

  const handleNextLevel = () => {
    const nextLevel = level + 1;
    const nextImageIndex = (nextLevel - 1) % levelImages.length;
    setLevel(nextLevel);
    setImageIndex(nextImageIndex);
    // 👇 re-trigger grid and image update
    setTimeout(() => {
      generatePuzzle();
    }, 100);
  };

  const renderTile = (tileNumber: number, index: number) => {
    if (tileNumber === totalTiles - 1) {
      return <View key={index} style={[getTileStyle(tileSize), styles.blank]} />;
    }

    const row = Math.floor(tileNumber / gridSize);
    const col = tileNumber % gridSize;

    return (
      <TouchableOpacity key={index} onPress={() => moveTile(index)}>
        <View style={getTileStyle(tileSize)}>
          <Image
            source={currentImage}
            style={{
              width: tileSize * gridSize,
              height: tileSize * gridSize,
              transform: [
                { translateX: -col * tileSize },
                { translateY: -row * tileSize },
              ],
            }}
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Level {level}</Text>
      <Text style={styles.timer}>⏱️ Time: {seconds}s</Text>

      <View style={getGridStyle(tileSize, gridSize)}>
        {tiles.map((tile, index) => renderTile(tile, index))}
      </View>

      <TouchableOpacity style={styles.button} onPress={generatePuzzle}>
        <Text style={styles.buttonText}>🔄 Shuffle</Text>
      </TouchableOpacity>

      {gameWon && (
        <TouchableOpacity style={styles.button} onPress={handleNextLevel}>
          <Text style={styles.buttonText}>🎉 Next Level</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.refTitle}>Reference Image:</Text>
      <Image
        source={currentImage}
        style={getReferenceStyle(tileSize * gridSize)}
        resizeMode="contain"
      />
      <Text style={styles.devTitle}>Developed by Arman</Text>
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 50,
    backgroundColor: '#f2f2f2',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  timer: {
    fontSize: 16,
    marginBottom: 15,
  },
  blank: {
    backgroundColor: '#eee',
  },
  button: {
    marginTop: 15,
    backgroundColor: '#007AFF',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  refTitle: {
    fontSize: 18,
    marginTop: 30,
    marginBottom: 10,
  },
  devTitle: {
    fontSize: 10,
    marginTop: 30,
    marginBottom: 10,
  },
});

const getTileStyle = (size: number): ViewStyle => ({
  width: size,
  height: size,
  overflow: 'hidden',
  borderWidth: 1,
  borderColor: '#fff',
});

const getGridStyle = (tileSize: number, gridSize: number): ViewStyle => ({
  width: tileSize * gridSize,
  height: tileSize * gridSize,
  flexDirection: 'row',
  flexWrap: 'wrap',
  backgroundColor: '#ccc',
  borderRadius: 8,
});

const getReferenceStyle = (size: number): ImageStyle => ({
  width: size * 0.4,
  height: size * 0.4,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: '#aaa',
});
