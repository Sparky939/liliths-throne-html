/* Lifebound grid runtime. Same tile shape, function names, and window.grid
   fields as Lifebound/index.html so the later full editor port can drop in.

   Flexibility: getMaxifiedGrid / loadGrid / renderGrid / movePlayer use each
   grid's own width and height (from LT_GRID_META or inferred tile bounds).
   grid.gridSize stays as max(width, height) for existing square-grid code. */

(function () {
  // window.print is normally the browser's print-dialog trigger; this codebase
  // never uses that meaning, so it's safe to repurpose here — but that also
  // means TS's lib.dom type for it (`() => void`) doesn't match what we're
  // treating it as, hence the casts.
  var rawPrint = window.print as unknown;
  var hasLog = !!(rawPrint && typeof (rawPrint as PrintLike).log === "function");
  var print: PrintLike = hasLog ? (rawPrint as PrintLike) : {
    log: function () {},
    warn: function (...args: unknown[]) { console.warn(...args); },
    error: function (...args: unknown[]) { console.error(...args); },
  };
  window.print = print as unknown as () => void;

  var grid: GridState = window.grid = window.grid || {};
  grid.gridSize = grid.gridSize || 25;
  grid.gridWidth = grid.gridWidth || grid.gridSize;
  grid.gridHeight = grid.gridHeight || grid.gridSize;
  grid.visibleTiles = grid.visibleTiles || 5;
  grid.zoomLevel = grid.zoomLevel || grid.visibleTiles;
  grid.playerPosition = grid.playerPosition || { x: 0, y: 0 };
  grid.gridName = grid.gridName || "";
  grid.gridStyle = grid.gridStyle || "better_rooms";
  grid.gridPruningValue = grid.gridPruningValue || 8;
  grid.gridSymmetrical = grid.gridSymmetrical != null ? grid.gridSymmetrical : true;
  grid.isDrawing = false;
  grid.drawMethod = grid.drawMethod || "None";
  grid.lastTransMethod = grid.lastTransMethod || "None";
  grid.selectedLocation = grid.selectedLocation || null;
  grid.selectedColorLocation = grid.selectedColorLocation || null;
  grid.selectedColor = grid.selectedColor || null;
  grid.selectedTravelType = grid.selectedTravelType || null;
  grid.selectedTravelLocation = grid.selectedTravelLocation || null;
  grid.selectedLocationIcon = grid.selectedLocationIcon || null;
  grid.selectedTravelLocationCoords = grid.selectedTravelLocationCoords || {};
  grid.selectedTile = grid.selectedTile || null;
  grid.currentTile = grid.currentTile || null;
  grid.currentLocation = grid.currentLocation || "";
  grid.currentLocationType = grid.currentLocationType || "";
  grid.currentLocationSubtype = grid.currentLocationSubtype || "";
  grid.currentEstablishment = grid.currentEstablishment || "";
  grid.currentRegion = grid.currentRegion || "";
  grid.currentTilePeople = grid.currentTilePeople || [];
  grid.hidden = !!grid.hidden;
  grid.locations = grid.locations || [];
  grid.homes = grid.homes || [];
  grid.favoritedLocations = grid.favoritedLocations || [];
  grid.locationConditions = grid.locationConditions || [];

  window.allGrids = window.allGrids || {};
  window.selectedTile = window.selectedTile || null;

  function gridWidth() {
    if (grid.gridData && grid.gridData[0]) return grid.gridData[0].length;
    return grid.gridWidth || grid.gridSize || 25;
  }

  function gridHeight() {
    if (grid.gridData) return grid.gridData.length;
    return grid.gridHeight || grid.gridSize || 25;
  }

  function declareGridVariables() {
    window.gridContainer = document.getElementById("grid");
    window.gridInfoBox = document.getElementById("grid-info");
    if (grid.hidden) hideGrid(false);
  }
  window.declareGridVariables = declareGridVariables;

  function hideGrid(setState?: boolean) {
    if (setState !== false) grid.hidden = true;
    var section = document.querySelector<HTMLElement>('[data-ui="map"]');
    if (section && grid.hidden) section.hidden = true;
  }
  window.hideGrid = hideGrid;

  function unhideGrid(setState?: boolean) {
    if (setState !== false) grid.hidden = false;
    var section = document.querySelector<HTMLElement>('[data-ui="map"]');
    if (section && !grid.hidden) section.hidden = false;
  }
  window.unhideGrid = unhideGrid;

  function showGrid(setState?: boolean) {
    unhideGrid(setState);
  }
  window.showGrid = showGrid;

  function createEmptyGrid(size?: number): GridTile[][] {
    size = size || grid.gridSize || 25;
    var gridData = Array.from({ length: size }, function (_, row) {
      return Array.from({ length: size as number }, function (_, col): GridTile {
        return {
          x: col,
          y: row,
          isNavigable: true,
          location: null,
          isStartingPoint: col === 0 && row === 0,
        };
      });
    });
    return gridData;
  }
  window.createEmptyGrid = createEmptyGrid;

  function createClusteredGrid(size: number, locations?: GridLocation[]): GridTile[][] {
    locations = locations || grid.locations || [];
    var gridData = Array.from({ length: size }, function (_, row) {
      return Array.from({ length: size }, function (_, col): GridTile {
        var location = locations!.length ? locations![(Math.floor(row / 4) + Math.floor(col / 6)) % locations!.length] : null;
        return { x: col, y: row, isNavigable: Math.random() > 0.2, location: location };
      });
    });
    return gridData;
  }
  window.createClusteredGrid = createClusteredGrid;

  function findFirstNavigableTile(inputGrid?: GridTile[][] | null): GridTile | null {
    var data = inputGrid || grid.gridData;
    if (!data) return null;
    for (var row = 0; row < data.length; row++) {
      for (var col = 0; col < data[row].length; col++) {
        var tile = data[row][col];
        if (tile && tile.isNavigable) return tile;
      }
    }
    return null;
  }
  window.findFirstNavigableTile = findFirstNavigableTile;

  function findTile(gridData: GridTile[][] | null | undefined, x: number, y: number): GridTile | null {
    if (!gridData) return null;
    if (gridData[y] && gridData[y][x] && typeof gridData[y][x].x === "number") return gridData[y][x];
    for (var row = 0; row < gridData.length; row++) {
      if (!gridData[row] || typeof gridData[row].length !== "number") continue;
      for (var col = 0; col < gridData[row].length; col++) {
        var tile = gridData[row][col];
        if (tile && tile.x === x && tile.y === y) return tile;
      }
    }
    return null;
  }
  window.findTile = findTile;

  function findTileMinified(gridData: GridTile[] | null | undefined, x: number, y: number): GridTile | null {
    if (!gridData) return null;
    for (var i = 0; i < gridData.length; i++) {
      var tile = gridData[i];
      if (tile && tile.x === x && tile.y === y) return tile;
    }
    return null;
  }
  window.findTileMinified = findTileMinified;

  function getMinifiedGrid(gridData: GridTile[][] | null | undefined): GridTile[] {
    var minimized: GridTile[] = [];
    if (!gridData) return minimized;
    for (var row = 0; row < gridData.length; row++) {
      for (var col = 0; col < gridData[row].length; col++) {
        var tile = gridData[row][col];
        if (!tile || !tile.isNavigable) continue;
        var minTile: GridTile = { x: tile.x, y: tile.y, location: tile.location || null, isNavigable: true };
        if (tile.isStartingPoint === true) minTile.isStartingPoint = true;
        if (tile.travelConfig != null) minTile.travelConfig = tile.travelConfig;
        minimized.push(minTile);
      }
    }
    return minimized;
  }
  window.getMinifiedGrid = getMinifiedGrid;

  // Distinguishes the flat "minified" tile-list format (only navigable tiles,
  // no [][] nesting) from the full 2D grid — the discriminant is whether the
  // first element itself looks like a tile (has a numeric .x) rather than
  // being another array.
  function isFlatTileArray(g: TileLike[] | TileLike[][]): g is TileLike[] {
    return g.length > 0 && typeof (g[0] as GridTile).x === "number";
  }

  function isAlreadyMaxified(minimizedGrid: TileLike[] | TileLike[][] | null | undefined): boolean {
    return !!(
      minimizedGrid &&
      minimizedGrid.length &&
      Array.isArray(minimizedGrid[0]) &&
      minimizedGrid[0].length &&
      minimizedGrid[0][0] &&
      typeof minimizedGrid[0][0] === "object" &&
      "isNavigable" in minimizedGrid[0][0]
    );
  }

  function getMaxifiedGrid(minimizedGrid: TileLike[] | TileLike[][] | null | undefined, gridSize?: number, gridHeight?: number): GridTile[][] {
    if (isAlreadyMaxified(minimizedGrid)) return minimizedGrid as GridTile[][];
    var width = typeof gridSize === "number" ? gridSize : 25;
    var height = typeof gridHeight === "number" ? gridHeight : width;
    var flat = minimizedGrid as GridTile[] | null | undefined;
    if (Array.isArray(flat)) {
      for (var i = 0; i < flat.length; i++) {
        var t = flat[i];
        if (!t) continue;
        if (typeof t.x === "number" && t.x + 1 > width) width = t.x + 1;
        if (typeof t.y === "number" && t.y + 1 > height) height = t.y + 1;
      }
    }
    var lookup: Record<string, GridTile> = {};
    if (Array.isArray(flat)) {
      for (var n = 0; n < flat.length; n++) {
        var nav = flat[n];
        if (nav && typeof nav.x === "number") lookup[nav.x + "," + nav.y] = nav;
      }
    }
    return Array.from({ length: height }, function (_, y) {
      return Array.from({ length: width }, function (_, x): GridTile {
        var navTile = lookup[x + "," + y];
        if (navTile) {
          return {
            x: navTile.x,
            y: navTile.y,
            isNavigable: true,
            location: navTile.location || null,
            travelConfig: navTile.travelConfig || null,
            isStartingPoint: navTile.isStartingPoint || false,
          };
        }
        return { x: x, y: y, isNavigable: false, location: null, isStartingPoint: false };
      });
    });
  }
  window.getMaxifiedGrid = getMaxifiedGrid;

  function getCurrentTile(): GridTile | null {
    if (!grid.gridData || !grid.playerPosition) return null;
    var row = grid.gridData[grid.playerPosition.y];
    return row ? row[grid.playerPosition.x] : null;
  }
  window.getCurrentTile = getCurrentTile;

  function getLocation(name: string | null | undefined, locations?: GridLocation[]): GridLocation | null {
    if (!name) return null;
    locations = locations || grid.locations || [];
    for (var i = 0; i < locations.length; i++) {
      var loc = locations[i];
      if (loc && loc.name === name) return loc;
      if (loc && loc.sublocations && loc.sublocations.length) {
        var found = getLocation(name, loc.sublocations);
        if (found) return found;
      }
    }
    return null;
  }
  window.getLocation = getLocation;
  window.getLocationByName = getLocation;

  function collectLocationsFromGrid(fullGrid: GridTile[][] | null | undefined): GridLocation[] {
    var seen: Record<string, boolean> = {};
    var list: GridLocation[] = [];
    if (!fullGrid) return list;
    for (var y = 0; y < fullGrid.length; y++) {
      for (var x = 0; x < fullGrid[y].length; x++) {
        var loc = fullGrid[y][x] && fullGrid[y][x].location;
        if (!loc || !loc.name || seen[loc.name + "|" + (loc.placeType || "")]) continue;
        seen[loc.name + "|" + (loc.placeType || "")] = true;
        list.push(loc);
      }
    }
    return list;
  }

  function renderGrid(): void {
    var gridContainer = window.gridContainer || document.getElementById("grid");
    window.gridContainer = gridContainer;
    if (!grid.gridData || !grid.gridName) {
      hideGrid(false);
      return;
    }
    if (!gridContainer) return;
    showGrid(false);

    var width = gridWidth();
    var height = gridHeight();
    var view = Math.max(1, grid.zoomLevel || 5);
    var viewW = Math.min(view, width);
    var viewH = Math.min(view, height);
    gridContainer.innerHTML = "";
    gridContainer.className = "map-container";
    gridContainer.style.gridTemplateColumns = "repeat(" + viewW + ", 1fr)";
    gridContainer.style.gridTemplateRows = "repeat(" + viewH + ", 1fr)";
    gridContainer.style.aspectRatio = viewW + " / " + viewH;

    var startX = Math.max(0, Math.min(width - viewW, grid.playerPosition.x - Math.floor(viewW / 2)));
    var startY = Math.max(0, Math.min(height - viewH, grid.playerPosition.y - Math.floor(viewH / 2)));
    var px = grid.playerPosition.x;
    var py = grid.playerPosition.y;

    for (var row = startY; row < startY + viewH; row++) {
      for (var col = startX; col < startX + viewW; col++) {
        var tile = grid.gridData[row] && grid.gridData[row][col];
        if (!tile) continue;
        var isPlayer = px === col && py === row;
        var adjacent = (Math.abs(col - px) === 1 && row === py) || (Math.abs(row - py) === 1 && col === px);
        var placeType = tile.location && tile.location.placeType;
        var knownVisual = !!(window.LT && LT.placeVisuals && placeType && LT.placeVisuals[placeType]);
        var visual = (window.LT && LT.placeVisual && placeType) ? LT.placeVisual(placeType) : null;
        var tileDiv = document.createElement("div");
        var classes = "map-tile";
        if (!tile.isNavigable) classes += " blank";
        else if (isPlayer) classes += " player";
        if (tile.isNavigable && adjacent) classes += " movement";
        if (tile.isNavigable && typeof LT !== "undefined" && LT.isDangerousTile && LT.isDangerousTile(placeType)) {
          classes += " dangerous";
        }
        tileDiv.className = classes;
        var bg = (knownVisual && visual && visual.background)
          || (tile.location && tile.location.color)
          || (visual && visual.background)
          || "#bbbbbb";
        if (tile.isNavigable && bg) tileDiv.style.backgroundColor = bg;
        var iconSrc = (tile.location && tile.location.icon && tile.location.icon.src) || (visual && visual.icon);
        if (tile.isNavigable && iconSrc) {
          var placeIcon = document.createElement("div");
          placeIcon.className = "place-icon";
          var content = document.createElement("div");
          content.className = "map-tile-content";
          var img = document.createElement("img");
          img.src = iconSrc;
          img.alt = (tile.location && tile.location.name) || "";
          img.draggable = false;
          img.setAttribute("draggable", "false");
          content.appendChild(img);
          placeIcon.appendChild(content);
          tileDiv.appendChild(placeIcon);
        } else if (isPlayer && tile.isNavigable) {
          var playerMark = document.createElement("div");
          playerMark.className = "place-icon player-marker";
          tileDiv.appendChild(playerMark);
        }
        if (tile.isNavigable) {
          (function (r, c) {
            tileDiv.addEventListener("click", function () {
              selectTile(r, c);
            });
          })(row, col);
        }
        gridContainer.appendChild(tileDiv);
      }
    }
  }
  window.renderGrid = renderGrid;

  function updateInfo(): void {
    var tile = getCurrentTile();
    var box = window.gridInfoBox || document.getElementById("grid-info");
    window.gridInfoBox = box;
    if (!box) return;
    if (!tile) {
      box.textContent = "Out of bounds";
      return;
    }
    if (tile.isNavigable && tile.location && tile.location.name) {
      box.textContent = tile.location.name;
    } else if (tile.isNavigable) {
      box.textContent = "You are here.";
    } else {
      box.textContent = "This tile is non-navigable.";
    }
  }
  window.updateInfo = updateInfo;

  function applyCurrentTileState(): void {
    grid.currentTile = getCurrentTile();
    grid.currentLocation = (grid.currentTile && grid.currentTile.location && grid.currentTile.location.name) || "";
    grid.currentLocationType = (grid.currentTile && grid.currentTile.location && grid.currentTile.location.type) || "";
    grid.currentLocationSubtype = (grid.currentTile && grid.currentTile.location && grid.currentTile.location.subtype) || "";
    if (window.player) {
      window.player.currentLocation = grid.currentLocation;
      window.player.currentCoords = { x: grid.playerPosition.x, y: grid.playerPosition.y };
    }
  }

  var movePlayerLastMove = 0;
  function movePlayer(dx: number, dy: number, moveMode?: string): void {
    moveMode = moveMode || "Default";
    var cooldown = 100;
    var now = Date.now();
    if (now - movePlayerLastMove < cooldown) return;
    movePlayerLastMove = now;

    var newX;
    var newY;
    var width = gridWidth();
    var height = gridHeight();

    function runTravelHandler() {
      grid.playerPosition = { x: newX, y: newY };
      applyCurrentTileState();
      grid.lastTransMethod = "Walk";
      renderGrid();
      updateInfo();
      if (typeof grid.onMove === "function") grid.onMove(getCurrentTile(), grid);
    }

    if (moveMode === "Default") {
      newX = grid.playerPosition.x + dx;
      newY = grid.playerPosition.y + dy;
    } else if (moveMode === "TileClick") {
      var clickedX = dx;
      var clickedY = dy;
      var distX = Math.abs(clickedX - grid.playerPosition.x);
      var distY = Math.abs(clickedY - grid.playerPosition.y);
      if ((distX === 1 && distY === 0) || (distX === 0 && distY === 1)) {
        newX = clickedX;
        newY = clickedY;
      } else {
        return;
      }
    } else if (moveMode === "Teleport") {
      newX = dx;
      newY = dy;
    } else {
      return;
    }

    if (
      newX >= 0 &&
      newY >= 0 &&
      newX < width &&
      newY < height &&
      (function () {
        var dest = grid.gridData![newY] && grid.gridData![newY][newX];
        if (dest && typeof LT.canEnterTile === "function" && !LT.canEnterTile(dest)) return false;
        return true;
      })() &&
      grid.gridData![newY] &&
      grid.gridData![newY][newX] &&
      grid.gridData![newY][newX].isNavigable
    ) {
      runTravelHandler();
    }
  }
  window.movePlayer = movePlayer;

  // newGrid accepts either a grid name to look up in window.allGrids, or raw
  // grid data directly; tile accepts a coord-only hint. Resolved into
  // separate, properly-typed locals below instead of reassigning the params
  // across incompatible shapes.
  function loadGrid(newGrid: string | TileLike[] | TileLike[][] | null | undefined, tile?: { x?: number; y?: number } | null): void {
    var hint = tile || {};
    var newGridName: string | undefined;
    var source: TileLike[] | TileLike[][] | null | undefined = typeof newGrid === "string" ? undefined : newGrid;
    if (typeof newGrid === "string") {
      newGridName = newGrid;
      source = window.allGrids[newGrid];
      if (!source) {
        print.error('Grid with name "' + newGridName + '" not found.');
        return;
      }
    }

    var meta: Partial<GridMeta> = (window.LT_GRID_META && newGridName && window.LT_GRID_META[newGridName]) || {};
    var maxified = getMaxifiedGrid(source, meta.width || grid.gridSize || 25, meta.height);
    if (!maxified) return;

    var tilePosition: { x: number; y: number };
    if (hint.x === undefined || hint.y === undefined) {
      var found = findFirstNavigableTile(maxified);
      if (!found) return;
      tilePosition = { x: found.x, y: found.y };
    } else {
      tilePosition = { x: hint.x || 0, y: hint.y || 0 };
    }

    grid.gridName = newGridName || grid.gridName;
    grid.gridData = maxified;
    grid.gridWidth = maxified[0] ? maxified[0].length : meta.width || 25;
    grid.gridHeight = maxified.length;
    grid.gridSize = Math.max(grid.gridWidth, grid.gridHeight);
    grid.playerPosition = { x: tilePosition.x, y: tilePosition.y };
    grid.locations = collectLocationsFromGrid(maxified);
    window.selectedTile = grid.gridData![tilePosition.y] && grid.gridData![tilePosition.y][tilePosition.x];
    applyCurrentTileState();
    renderGrid();
    updateInfo();
    if (typeof grid.onLoad === "function") grid.onLoad(getCurrentTile(), grid);
  }
  window.loadGrid = loadGrid;

  function generateGrid(mode?: string): void {
    mode = mode || "Normal";
    var size = grid.gridSize || 25;
    if (typeof window.generateDungeon === "function" && grid.gridStyle && grid.gridStyle !== "empty") {
      var newGrid: number[][] = [];
      for (var y = 0; y < size; y++) {
        newGrid[y] = [];
        for (var x = 0; x < size; x++) newGrid[y][x] = 0;
      }
      var style = grid.gridStyle;
      if (style === "corridors" || style === "corridors_rooms" || style === "thick_corridors" || style === "better_rooms") {
        window.generateDungeon(newGrid, 1, 1);
        if (style === "corridors_rooms" && typeof window.addRooms === "function") window.addRooms(newGrid);
        if (style === "thick_corridors" && typeof window.thickenCorridors === "function") window.thickenCorridors(newGrid, 2);
        if (style === "better_rooms" && typeof window.addBetterRooms === "function") window.addBetterRooms(newGrid);
      } else if (style === "cellular" && typeof window.generateCellular === "function") {
        newGrid = window.generateCellular(newGrid);
      } else if (style === "drunkards" && typeof window.generateDrunkards === "function") {
        window.generateDrunkards(newGrid);
      } else if (style === "continent" && typeof window.generateContinent === "function") {
        newGrid = window.generateContinent(newGrid);
      }
      grid.gridData = Array.from({ length: size }, function (_, gy) {
        return Array.from({ length: size }, function (_, gx) {
          var value = newGrid[gy][gx];
          var isNavigable = value === 1 || value === 2;
          var location: GridLocation | null = null;
          if (value === 1) location = { color: "#bbb", name: "Corridor" };
          else if (value === 2) location = { color: "#888", name: "Room" };
          return { x: gx, y: gy, isNavigable: isNavigable, location: location, isStartingPoint: gx === 0 && gy === 0 };
        });
      });
    } else {
      grid.gridData = createEmptyGrid(size);
    }
    if (mode === "Normal") {
      var gridNameEl = document.getElementById("grid-name") as HTMLInputElement | null;
      grid.gridName = (gridNameEl && gridNameEl.value && gridNameEl.value.trim()) || grid.gridName || "NewGrid";
    }
    grid.gridWidth = size;
    grid.gridHeight = size;
    var firstTile = findFirstNavigableTile();
    if (firstTile) grid.playerPosition = grid.playerPosition || { x: firstTile.x, y: firstTile.y };
    if (window.gridContainer) renderGrid();
    updateInfo();
  }
  window.generateGrid = generateGrid;

  function travelLocked(): boolean {
    if (window.LT && LT.game && LT.game.currentNode && LT.game.currentNode.travelDisabled) return true;
    if (window.LT && LT.combat && LT.combat.active) return true;
    if (window.LT && LT.sex && LT.sex.active) return true;
    return false;
  }

  function selectTile(row: number, col: number): void {
    if (travelLocked()) return;
    if (!grid.gridData || !grid.gridData[row] || !grid.gridData[row][col]) return;
    var tile = grid.gridData[row][col];
    window.selectedTile = tile;
    grid.selectedTile = tile;
    if (grid.drawMethod && grid.drawMethod !== "None" && typeof window.startDrawing === "function") {
      return;
    }
    if (!tile.isNavigable) return;
    var px = grid.playerPosition.x;
    var py = grid.playerPosition.y;
    if (row === py && col === px) return;
    var distX = Math.abs(col - px);
    var distY = Math.abs(row - py);
    if ((distX === 1 && distY === 0) || (distX === 0 && distY === 1)) {
      movePlayer(col - px, row - py);
    }
  }
  window.selectTile = selectTile;

  function cycleGridZoom(): void {
    var steps = [3, 5, 7, 9];
    var i = steps.indexOf(grid.zoomLevel);
    grid.zoomLevel = steps[(i + 1) % steps.length];
    renderGrid();
  }
  window.cycleGridZoom = cycleGridZoom;

  function goToTileLocation(locationName: string): boolean {
    // window.allGrids' generated data is always the flat format, but this
    // still handles the nested shape defensively for any future grid source.
    var currentGrid = window.allGrids[grid.gridName] as TileLike[] | TileLike[][];
    if (!currentGrid) return false;
    var matches: TileLike[] = [];
    if (isFlatTileArray(currentGrid)) {
      for (var i = 0; i < currentGrid.length; i++) {
        if (currentGrid[i].location && currentGrid[i].location!.name === locationName) matches.push(currentGrid[i]);
      }
    } else {
      for (var y = 0; y < currentGrid.length; y++) {
        for (var x = 0; x < currentGrid[y].length; x++) {
          var t = currentGrid[y][x];
          if (t && t.location && t.location.name === locationName) matches.push(t);
        }
      }
    }
    if (!matches.length) return false;
    var target = matches[0];
    movePlayer(target.x, target.y, "Teleport");
    return true;
  }
  window.goToTileLocation = goToTileLocation;
})();
