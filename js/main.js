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

		/** 
		 * TODO: create nation objects that own the provinces and associate the
		 * color with the owner.
		 */
		if (Math.floor(Math.random() * 2)) province.owner = 'red';
		else province.owner = 'blue';
		return province;
	}

	// Runs the simulation until stopped.
	function simLoop() {
		ctx.clearRect(0,0,800,400);
		for (var i = 0; i < numRows; i++) {
			for (var j = 0; j < numCols; j++) {
				ctx.fillStyle = grid[i][j].owner;
				ctx.fillRect(j * 10, i * 10, 10, 10);
			}
		}
	}
})();
	
