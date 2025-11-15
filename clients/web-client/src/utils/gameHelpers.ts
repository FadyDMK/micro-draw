// Color palette for drawing
export const COLORS = [
  { name: 'white', value: '#FFFFFF' },
  { name: 'black', value: '#000000' },
  { name: 'red', value: '#FF0000' },
  { name: 'green', value: '#00FF00' },
  { name: 'blue', value: '#0000FF' },
  { name: 'yellow', value: '#FFFF00' },
  { name: 'magenta', value: '#FF00FF' },
  { name: 'cyan', value: '#00FFFF' },
  { name: 'orange', value: '#FF8800' },
  { name: 'purple', value: '#8800FF' },
];

export const CANVAS_CONFIG = {
  GRID_WIDTH: 40,
  GRID_HEIGHT: 20,
  CELL_SIZE: 20, 
  LINE_WIDTH: 2,
};

export const formatTime = (ms: number): string => {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const getColorHex = (colorName: string): string => {
  const color = COLORS.find((c) => c.name === colorName);
  return color?.value || '#FFFFFF';
};

export const createWordHint = (length: number): string => {
  return '_ '.repeat(length).trim();
};
