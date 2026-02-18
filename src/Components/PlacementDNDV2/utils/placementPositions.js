export const getAvailablePosition = (roomType, occupiedPositions) => {
  const maxPositions = Array.from({ length: roomType }, (_, i) => i);
  return maxPositions.find((pos) => !occupiedPositions.includes(pos));
};
