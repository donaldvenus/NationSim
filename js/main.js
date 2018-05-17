// Self invoking function to start the simulation scripts.
(function() {
	var canvas = document.getElementById('sim-box');
	var ctx = canvas.getContext('2d');

	/** 
	 * TODO: Make size of each square dynamic based on canvas size. For now,
	 * assume every square is 10x10 pixels (the entire 800x400 canvas will be
	 * an 80x40 grid).
	 */
	var numRows = 40;
	var numCols = 80;
	var nation1 = generateNation('nation1', '#91bbff');
	var nation2 = generateNation('nation2', '#f76c6c');
	var nationsArr = [nation1, nation2];
	var grid = generateGrid();
	initNations();
	simLoop();

	/**
	 * Generates the grid for the simulation by creating a province for every grid
	 * space.
	 */
	function generateGrid() {
		var grid = [];

		for (var i = 0; i < numRows; i++) {
			grid[i] = [];
			for (var j = 0; j < numCols; j++) {
				grid[i].push(generateProvince(i, j));
			}
		}
		return grid;
	}

	// Generates a new province given a row and column position in the main grid. 
	function generateProvince(row, col) {
		var province = {};
		province.row = row;
		province.col = col;
		province.population = Math.floor(Math.random() * 100000);
		province.econValue = Math.floor(Math.random() * 10);
		if (col < 40) province.ownerIndex = 0;
		else province.ownerIndex = 1;
		return province;
	}

	// Generates a new nation given a name and color
	function generateNation(name, color) {
		var nation = {};
		nation.name = name;
		nation.color = color;
		nation.population = 0;
		nation.econValue = 0;
		nation.armySize = 0;
		nation.targetProvince = undefined;

		return nation;
	}

	// Initialize values for each nation.
	function initNations() {
		for (var i = 0; i < numRows; i++) {
			for (var j = 0; j < numCols; j++) {
				nationsArr[grid[i][j].ownerIndex].population 
					+= grid[i][j].population;
				nationsArr[grid[i][j].ownerIndex].armySize
					+= grid[i][j].population / 1000;
				nationsArr[grid[i][j].ownerIndex].econValue
					+= grid[i][j].econValue;
			}
		}
	}

	// Returns a province, checking grid bounds.
	function getProvince(x, y) {
		if (x < 0 || x >= numRows || y < 0 || y >= numCols) return undefined;
		else return grid[x][y];
	}

	// Returns a list of bordering enemy provinces.
	function getBorders(province) {
		var borders = [];
		var adj = {};
		adj = getProvince(province.row - 1, province.col);
		if (adj && adj.ownerIndex != province.ownerIndex) borders.push(adj);
		adj = getProvince(province.row - 1, province.col - 1);
		if (adj && adj.ownerIndex != province.ownerIndex) borders.push(adj);
		adj = getProvince(province.row - 1, province.col + 1);
		if (adj && adj.ownerIndex != province.ownerIndex) borders.push(adj);
		adj = getProvince(province.row, province.col - 1);
		if (adj && adj.ownerIndex != province.ownerIndex) borders.push(adj);
		adj = getProvince(province.row, province.col + 1);
		if (adj && adj.ownerIndex != province.ownerIndex) borders.push(adj);
		adj = getProvince(province.row + 1, province.col);
		if (adj && adj.ownerIndex != province.ownerIndex) borders.push(adj);
		adj = getProvince(province.row + 1, province.col - 1);
		if (adj && adj.ownerIndex != province.ownerIndex) borders.push(adj);
		adj = getProvince(province.row + 1, province.col + 1);
		if (adj && adj.ownerIndex != province.ownerIndex) borders.push(adj);
		return borders;
	}

	// Sets the current goal province for each nation.
	function determineTargetProvince() {
		for (var i = 0; i < numRows; i++) {
			for (var j = 0; j < numCols; j++) {
				var borders = getBorders(grid[i][j]);
				for (var n = 0; n < borders.length; n++) {
					if (nationsArr[grid[i][j].ownerIndex]
						                     .targetProvince == undefined ||
						borders[n].econValue > 
						nationsArr[grid[i][j].ownerIndex]
						                     .targetProvince
						                     .econValue) {
						nationsArr[grid[i][j].ownerIndex].targetProvince = 
							borders[n];
					}
				}
			}
		}
	}

	// Color each province based on the province owner.
	function drawMap() {
		for (var i = 0; i < numRows; i++) {
			for (var j = 0; j < numCols; j++) {
				ctx.fillStyle = nationsArr[grid[i][j].ownerIndex].color;
				ctx.fillRect(j * 10, i * 10, 10, 10);
			}
		}
	}

	// Determine which provinces change ownership this turn.
	function handleWarfare() {
		// Do a basic 1v1 strength comparison. Winner gets a random province.
		if (nationsArr[0].armySize > nationsArr[1].armySize) {
			grid[nationsArr[0].targetProvince.row]
			    [nationsArr[0].targetProvince.col].ownerIndex = 0;
			nationsArr[0].targetProvince = undefined;

		}
		else {
			grid[nationsArr[1].targetProvince.row] 
			    [nationsArr[1].targetProvince.col].ownerIndex = 1;
			nationsArr[1].targetProvince = undefined;
		}
	}

	// Runs the simulation until stopped.
	function simLoop() {
		ctx.clearRect(0,0,800,400);
		determineTargetProvince();
		handleWarfare();
		drawMap();
		window.requestAnimationFrame(simLoop);
	}

})();
	
