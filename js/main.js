// Self invoking function to start the simulation scripts.
(function() {
	var canvas = document.getElementById('sim-box');
	var ctx = canvas.getContext('2d');
	var nationInfo = document.getElementById('nation-info');
	var playButton = document.getElementById('play-button');
	var pauseButton = document.getElementById('pause-button');
	var resetButton = document.getElementById('reset-button');
	var nationCount;
	var dxdy = [[-1,0],[1,0],[0,-1],[0,1]]; // Only support 4 direction movement
	var paused = true;
	var loopTimeout;

	/* Add click handler for canvas. */
	canvas.addEventListener('click', function(event) {
	    var x = event.pageX - canvas.offsetLeft;
	    var y = event.pageY - canvas.offsetTop;
	    var gridX = Math.floor(x / 10);
	    var gridY = Math.floor(y / 10);
	    selectedNation = nationsArr[grid[gridY][gridX].ownerIndex];
	    nationInfo.innerHTML = selectedNation.name + '<br>' + 
	                           'Population: ' + selectedNation.population + 
	                           '<br>' + 'Economy: ' + selectedNation.econValue +
	                           '<br>' + 'Military: ' + selectedNation.military +
	                           '<br>' + 'prov borders: ' + grid[gridY][gridX].totalBorders; 
	    for (var i = 0; i < selectedNation.borders.length; i++) {
	    	selectedNation.borders[i].forEach(function(prov) {
	    		ctx.fillStyle = "black";
				ctx.fillRect(prov.y * 10, prov.x * 10, 10, 10);
	    	});
	    }
	}, false);

	/* Add click handler for play, pause, reset. */
	playButton.addEventListener('click', function(event) {
		paused = false;
	});
	pauseButton.addEventListener('click', function(event) {
		paused = true;
	});
	resetButton.addEventListener('click', function(event) {
		resetGame();
	});

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
	var namesArr = ['Red','Green','Yellow','Blue','Orange','Purple','Cyan',
	                'Magenta','Lime','Pink','Teal','Lavender','Brown','Beige',
	                'Maroon','Mint','Olive','Coral','Navy','Grey','White',
	                'Black'];
	var nationsArr = [];
	resetGame();

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
		province.population = Math.floor(Math.random() * 100);
		province.econValue = Math.floor(Math.random() * 10);
		province.ownerIndex = -1;
		province.isCapital = 0;
		province.borders = [];
		province.borders.length = nationCount;
		province.borders.fill(0);
		province.totalBorders = 0;
		return province;
	}

	// Generates a new nation given an index for color and name
	function generateNation(index) {
		var nation = {};
		nation.ownerIndex = index;
		nation.color = colorsArr[index];
		nation.name = namesArr[index];
		nation.population = 0;
		nation.econValue = 0;
		nation.military = 0;
		nation.threats = [];
		nation.borders = [];
		nation.committedMilitary = [];
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
			var nation = generateNation(i);
			nation.capital.ownerIndex = i;
			nation.threats.length = numNations;
			nation.threats.fill(-1);
			nation.borders.length = numNations;
			nation.borders.fill(new Set());
			fillqueue.push(nation.capital);
			nationsArr.push(nation);
		}
		while (fillqueue.length !== 0) {
			if (Math.floor(Math.random() * 2) !== 0) {
				fillqueue.push(fillqueue.shift());
				continue;
			}
			var curr = fillqueue.shift();
			for (var xy = 0; xy < dxdy.length; xy++) {
				var prov = getProvince(curr.x + dxdy[xy][0], curr.y + dxdy[xy][1]);
				if (prov === undefined) continue;
				if (prov.ownerIndex === -1) {
					prov.ownerIndex = curr.ownerIndex;
					fillqueue.push(prov);
					continue;
				}
				curr.borders[prov.ownerIndex]++;
				curr.totalBorders++;
				if (prov.ownerIndex !== curr.ownerIndex) {
					// Might not need both...
					nationsArr[curr.ownerIndex].borders[prov.ownerIndex].add(curr);
					nationsArr[prov.ownerIndex].borders[curr.ownerIndex].add(prov);
					nationsArr[curr.ownerIndex].threats[prov.ownerIndex] = nationsArr[prov.ownerIndex].military;
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
				nationsArr[grid[i][j].ownerIndex].military 
					+= grid[i][j].population + (grid[i][j].econValue * 10);
				nationsArr[grid[i][j].ownerIndex].econValue
					+= grid[i][j].econValue;
			}
		}
		for (var i = 0; i < nationsArr.length; i++) {
			for (var j = 0; j < nationsArr[i].threats.length; j++) {
				if (nationsArr[i].threats[j] === 0)
					nationsArr[i].threats[j] = nationsArr[j].military;
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
		if (selectedNation) {
			nationInfo.innerHTML = selectedNation.name + '<br>' + 
	                           'Population: ' + selectedNation.population + 
	                           '<br>' + 'Economy: ' + selectedNation.econValue +
	                           '<br>' + 'Military: ' + selectedNation.military;
	    }
	    else {
	    	nationInfo.innerHTML = '';
	    }
	}

	// Commit military to threatening nations.
	function commitMilitary() {
		for (var i = 0; i < nationsArr.length; i++) {
			var totalThreat = 0;
			var nation = nationsArr[i];
			for (var j = 0; j < nation.threats.length; j++) {
				if (i === j) continue;
				if (nation.threats[j] === -1) continue;
				totalThreat += nation.threats[j];
			}
			for (var j = 0; j < nation.threats.length; j++) {
				if (i === j) continue;
				if (nation.threats[j] === -1) continue;
				nation.committedMilitary[j] = nation.military * nation.threats[j] / totalThreat;
			}
		}
	}

	// Resolve conflict between nations with committed military forces.
	function resolveConflict() {
		for (var i = 0; i < nationsArr.length; i++) {
			for (var j = i + 1; j < nationsArr.length; j++) {
				var nation1 = nationsArr[i];
				var nation2 = nationsArr[j];
				if (nation1.threats[j] === -1) continue;
				var military1 = Math.floor(nation1.committedMilitary[j] * (Math.random()));
				var military2 = Math.floor(nation2.committedMilitary[i] * (Math.random()));
				if (military1 > military2) winConflict(nation1, nation2, military1, military2);
				if (military1 === military2) continue;
				if (military1 < military2) winConflict(nation2, nation1, military2, military1);
			}
		}
	}

	// Handle border adjustment after conflict.
	function winConflict(winner, loser, winnerForce, loserForce) {
		// Add changes to military value
		// TODO mark which provinces are borders to which nations so these values
		// can easily be updated as they change hands.
		// Use sets to keep track of borders
		// Remove invalid borders from loser 
		// Maybe track internal borders instead of external?
		var loss = Math.min(winnerForce - loserForce, loserForce);
		loser.military = loser.military - loss;
		winner.military = winner.military - Math.floor(loss / 2);
		if (loser.military < 1) loser.military = 1;
		if (winner.military < 1) winner.military = 1;
		var oldBorders = new Set(winner.borders[loser.ownerIndex]);
		var lostProvinces = [];
		oldBorders.forEach(function(curr) {
			// curr is the interal border provinces of the winner
			// prov is a bordering province of a curr
			//if (Math.floor(Math.random() * 2) !== 0) {
				for (var xy = 0; xy < dxdy.length; xy++) {
					var prov = getProvince(curr.x + dxdy[xy][0], curr.y + dxdy[xy][1]);
					if (prov === undefined) continue;
					if (prov.ownerIndex === loser.ownerIndex) {
						prov.ownerIndex = winner.ownerIndex;
						// Handle as adj?
						//curr.borders[loser.ownerIndex]--;
						//curr.borders[winner.ownerIndex]++;
						lostProvinces.push(prov);
					}
				}
			//}
		});
		for (var i = 0; i < lostProvinces.length; i++) {
			adjustBorders(loser, lostProvinces[i]);
		}
	}

	// Fixes borders when a province changes hands
	function adjustBorders(loser, prov) {
		// Economic changes
		loser.econValue -= prov.econValue;
		loser.population -= prov.population;
		nationsArr[prov.ownerIndex].econValue += prov.econValue;
		nationsArr[prov.ownerIndex].population += prov.population;

		setBorders(prov, loser);
		for (var xy = 0; xy < dxdy.length; xy++) {
			var adj = getProvince(prov.x + dxdy[xy][0], prov.y + dxdy[xy][1]);
			if (adj === undefined) continue;
			setBorders(adj, nationsArr[adj.ownerIndex]);
		}
	}

	// Set the borders for a province.
	function setBorders(prov, oldOwner) {
		var owner = nationsArr[prov.ownerIndex];
		for (var i = 0; i < prov.borders.length; i++) {
			if (prov.borders[i] > 0) {
				oldOwner.borders[i].delete(prov);
			}
			// TODO: Deal with threat
			prov.borders[i] = 0;
		}
		for (var xy = 0; xy < dxdy.length; xy++) {
			var adj = getProvince(prov.x + dxdy[xy][0], prov.y + dxdy[xy][1]);
			if (adj === undefined) continue;
			prov.borders[adj.ownerIndex]++;
			if (adj.ownerIndex !== prov.ownerIndex) {
				owner.borders[adj.ownerIndex].add(prov);
			}
		}
	}

	// Every nation creates new forces for war.
	function develop() {
		for (var i = 0; i < nationsArr.length; i++) {
			nationsArr[i].military += Math.floor(nationsArr[i].econValue / 10) + Math.floor(nationsArr[i].population / 100);
		}
	}

	function resetGame() {
		nationCount = document.getElementById('nation-count').value;
		if (nationCount < 2) nationCount = 2;
		if (nationCount > 22) nationCount = 22;
		clearTimeout(loopTimeout);
		nationsArr = [];
		grid = generateGrid();
		selectedNation = undefined;
		createNations(nationCount);
		initNations();
		paused = true;
		drawMap();
		simLoop();
	}

	// Runs the simulation until stopped.
	function simLoop() {
		if (!paused) {
			ctx.clearRect(0,0,800,400);
			commitMilitary();
			resolveConflict();
			develop();
			drawMap();
		}
		loopTimeout = setTimeout(simLoop, 500);
	}

})();
	
