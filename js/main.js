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
	var grid = generateGrid();
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
		if (col < 40) province.owner = nation1;
		else province.owner = nation2;
		return province;
	}

	// Generates a new nation given a name and color
	function generateNation(name, color) {
		var nation = {};
		nation.name = name;
		nation.color = color;
		nation.ownedProvinces = [];
		nation.targetProvince = {};

		return nation;
	}

	// Color each province based on the province owner.
	function drawMap() {
		for (var i = 0; i < numRows; i++) {
			for (var j = 0; j < numCols; j++) {
				ctx.fillStyle = grid[i][j].owner.color;
				ctx.fillRect(j * 10, i * 10, 10, 10);
			}
		}
	}

	// Determine which provinces change ownership this turn.
	function handleWarfare() {
		// Do a basic 1v1 strength comparison. Winner gets a random province.
	}

	// Runs the simulation until stopped.
	function simLoop() {
		ctx.clearRect(0,0,800,400);
		handleWarfare();
		drawMap();
	}
})();
	
