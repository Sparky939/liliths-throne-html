export {};

declare global {
  // Ambient shape of the LT global namespace object. LT is populated
  // incrementally by every converted script; as more of the engine moves
  // to TypeScript, replace `[key: string]: any` with real per-module
  // types instead of widening this interface further.
  interface LTNamespace {
    [key: string]: any;
  }

  interface Window {
    LT: LTNamespace;
  }

  var LT: LTNamespace;

  // A handful of globals live outside the LT namespace: they're declared
  // inside an IIFE (mainly js/grid/*) and exposed only via a runtime
  // `window.X = X` assignment, which TS can't see as a real declaration.
  // Declared loosely here rather than fixed up per converted file.
  var grid: any;
  var player: any;
  var ltGame: any;
  var selectedTile: any;
  var gridContainer: any;
  var gridInfoBox: any;
  var LT_GRID_META: any;
  var allGrids: any;
  function getCurrentTile(...args: any[]): any;
  function openUI(...args: any[]): any;
  function print(...args: any[]): any;
  function updateInfo(...args: any[]): any;
  function movePlayer(...args: any[]): any;
  function getLocation(...args: any[]): any;
  function getLocationByName(...args: any[]): any;
  function findTile(...args: any[]): any;
  function findTileMinified(...args: any[]): any;
  function findFirstNavigableTile(...args: any[]): any;
  function goToTileLocation(...args: any[]): any;
  function selectTile(...args: any[]): any;
  function showGrid(...args: any[]): any;
  function hideGrid(...args: any[]): any;
  function unhideGrid(...args: any[]): any;
  function renderGrid(...args: any[]): any;
  function loadGrid(...args: any[]): any;
  function cycleGridZoom(...args: any[]): any;
  function createEmptyGrid(...args: any[]): any;
  function createClusteredGrid(...args: any[]): any;
  function generateGrid(...args: any[]): any;
  function generateContinent(...args: any[]): any;
  function generateCellular(...args: any[]): any;
  function generateDrunkards(...args: any[]): any;
  function generateDungeon(...args: any[]): any;
  function thickenCorridors(...args: any[]): any;
  function addRooms(...args: any[]): any;
  function addBetterRooms(...args: any[]): any;
  function declareGridVariables(...args: any[]): any;
  function getMinifiedGrid(...args: any[]): any;
  function getMaxifiedGrid(...args: any[]): any;
  function startDrawing(...args: any[]): any;
}
