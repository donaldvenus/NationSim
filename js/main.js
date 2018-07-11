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
	var colorsArr = ['#e6194b','#3cb44b','#ffe119','#0082c8','#f58231',
	                 '#911eb4','#46f0f0','#f032e6','#d2f53c','#fabebe',
	                 '#008080','#e6beff','#aa6e28','#fffac8','#800000',
	                 '#aaffc3','#808000','#ffd8b1','#000080','#808080',
	                 '#FFFFFF','#000000'];
	var nationsArr = [];
	var grid = generateGrid();
	createNations(12);
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
		province.x = row;
		province.col = col;
		province.y = col;
		province.population = Math.floor(Math.random() * 100000);
		province.econValue = Math.floor(Math.random() * 10);
		province.ownerIndex = -1;
		province.isCapital = 0;
		return province;
	}

	// Generates a new nation given a color
	function generateNation(color) {
		var nation = {};
		nation.color = color;
		nation.population = 0;
		nation.econValue = 0;
		nation.armySize = 0;
		do {
			nation.capital = grid[Math.floor(Math.random() * 40)][Math.floor(Math.random() * 80)];
		}
		while (nation.capital.isCapital);
		nation.capital.isCapital = 1;
		return nation;
	}

	// Create all nations on the map.
	function createNations(numNations) {
		var fillqueue = [];
		for (var i = 0; i < numNations; i++) {
			var nation = generateNation(colorsArr[i]);
			nation.capital.ownerIndex = i;
			fillqueue.push(nation.capital);
			nationsArr.push(nation);
		}
		var dx = [-1, 0, 1];
		var dy = [-1, 0, 1];
		while (fillqueue.length !== 0) {
			if (Math.floor(Math.random() * 2) !== 0) {
				fillqueue.push(fillqueue.shift());
				continue;
			}
			var curr = fillqueue.shift();
			for (var x = 0; x < 3; x++) {
				for (var y = 0; y < 3; y++) {
					var prov = getProvince(curr.x + dx[x], curr.y + dy[y]);
					if (prov !== undefined && prov.ownerIndex === -1) {
						prov.ownerIndex = curr.ownerIndex;
						fillqueue.push(prov);
					}
				}
			}
		}
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

	// Color each province based on the province owner.
	function drawMap() {
		for (var i = 0; i < numRows; i++) {
			for (var j = 0; j < numCols; j++) {
				ctx.fillStyle = nationsArr[grid[i][j].ownerIndex].color;
				ctx.fillRect(j * 10, i * 10, 10, 10);
			}
		}
	}

	// Runs the simulation until stopped.
	function simLoop() {
		ctx.clearRect(0,0,800,400);
		drawMap();
		window.requestAnimationFrame(simLoop);
	}

})();
	
