// Self invoking function to start the simulation scripts.
(function() {

	// DOM elements used by the game.
	var canvas = document.getElementById('sim-box');
	var ctx = canvas.getContext('2d');
	var nationInfo = document.getElementById('nation-info');
	var playButton = document.getElementById('play-button');
	var pauseButton = document.getElementById('pause-button');
	var resetButton = document.getElementById('reset-button');

	// Global game variables.
	var nationCount;
	// Only support 4 direction movement.
	var dxdy = [[-1,0],[1,0],[0,-1],[0,1]]; 
	var paused = true;
	var timeoutLoop;
	var animationLoop;
	/** 
	 * TODO: Make size of each square dynamic based on canvas size. For now,
	 * assume every square is 10x10 pixels (the entire 800x400 canvas will be
	 * an 80x40 grid).
	 */
	var numRows = 200;
	var numCols = 400;
	var provSize = 2;
	var colorsArr = ['#e6194b','#3cb44b','#ffe119','#0082c8','#f58231',
	                 '#911eb4','#46f0f0','#f032e6','#d2f53c','#fabebe',
	                 '#008080','#e6beff','#aa6e28','#fffac8','#800000',
	                 '#aaffc3','#808000','#ffd8b1','#000080','#808080',
	                 '#FFFFFF','#000000'];
	var namesArr = ['Red','Green','Yellow','Blue','Orange','Purple','Cyan',
	                'Magenta','Lime','Pink','Teal','Lavender','Brown','Beige',
	                'Maroon','Mint','Olive','Coral','Navy','Grey','White',
	                'Black'];
	var nationsArr;
	var grid;
	var selectedNation;
	var changedProvinces;

	// Add click handler for selecting nations on the canvas element.
	canvas.addEventListener('click', function(event) {
	    var x = event.pageX - canvas.offsetLeft;
	    var y = event.pageY - canvas.offsetTop;
	    var gridX = Math.floor(x / provSize);
	    var gridY = Math.floor(y / provSize);
	    selectedNation = nationsArr[grid[gridY][gridX].ownerIndex];
	}, false);

	// Add click handlers for play, pause, and reset buttons.
	playButton.addEventListener('click', function(event) {
		paused = false;
	});
	pauseButton.addEventListener('click', function(event) {
		paused = true;
	});
	resetButton.addEventListener('click', function(event) {
		resetGame();
	});

	// Start the game on page load.
	resetGame();

	/**
	 * Generates the grid for the simulation by creating a province for every
	 * grid space.
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

	// Generates a new province given a position in the main grid. 
	function generateProvince(row, col) {
		var province = {};

		// Row and column position in the grid.
		province.x = row;
		province.y = col;

		// Economic variables.
		province.population = Math.floor(Math.random() * 10);
		province.econValue = Math.floor(Math.random() * 2);

		// Province owner.
		province.ownerIndex = -1;

		// Whether or not province is a capital.
		province.isCapital = 0;

		// Keeps track of every nation that borders this province.
		province.borders = [];
		province.borders.length = nationCount;
		province.borders.fill(0);

		return province;
	}

	// Generates a new nation given an index for color and name.
	function generateNation(index) {
		var nation = {};

		/** 
		 * ownerIndex is the primary identifier between different nations and is
		 * unique for each nation.
		 */
		nation.ownerIndex = index;

		// Map color for this nation.
		nation.color = colorsArr[index];

		// Map name for this nation.
		nation.name = namesArr[index];

		// Economic values.
		nation.population = 0;
		nation.econValue = 0;
		nation.military = 0;

		// Contains the threat of all other nations to this nation.
		nation.threats = [];
		nation.threats.length = nationCount;
		nation.threats.fill(0);

		// Total threat to a nation.
		nation.totalThreat = 0;

		// Contains the nation's border provinces to all other nations.
		nation.borders = [];
		for (var i = 0; i < nationCount; i++) {
			nation.borders.push(new Set());
		}

		/**
		 * Contains the current committed military forces against other nations
		 * for this turn.
		 */
		nation.committedMilitary = [];

		// Select a capital for the nation.
		nation.capital = selectCapital();
		
		return nation;
	}

	// Randomly select the capital for a nation.
	function selectCapital() {
		var capital;
		do {
			var randRow = Math.floor(Math.random() * numRows);
			var randCol = Math.floor(Math.random() * numCols);
			capital = grid[randRow][randCol];
		}
		while (capital.isCapital);
		capital.isCapital = 1;
		return capital;
	}


	// Create all nations on the map.
	function createNations() {
		// Queue for BFS to generate initial borders.
		var fillqueue = [];

		// Generate each nation and add capital to BFS queue.
		for (var i = 0; i < nationCount; i++) {
			var nation = generateNation(i);
			nation.capital.ownerIndex = i;
			fillqueue.push(nation.capital);
			nationsArr.push(nation);
		}

		/** 
		 * Add every province to a nation, spreading out from the nation 
		 * capitals.
		 */
		while (fillqueue.length !== 0) {

			// Current province from queue.
			var curr = fillqueue.shift();

			// Randomly skip provinces to give better borders.
			if (Math.floor(Math.random() * 2) !== 0) {
				fillqueue.push(curr);
				continue;
			}

			// Expand owner to all unowned adjacent provinces.
			for (var xy = 0; xy < dxdy.length; xy++) {
				var prov = getProvince(curr.x + dxdy[xy][0],
					                   curr.y + dxdy[xy][1]);
				if (prov === undefined) continue;
				if (prov.ownerIndex === -1) {
					// If unowned, add owner and push to queue.
					prov.ownerIndex = curr.ownerIndex;
					fillqueue.push(prov);
					continue;
				}

				// Set initial province and nation borders.
				curr.borders[prov.ownerIndex]++;
				if (prov.ownerIndex !== curr.ownerIndex) {
					nationsArr[curr.ownerIndex].borders[prov.ownerIndex]
					                           .add(curr);
				}
			}
		}
	}

	// Initialize economic and threat values for each nation.
	function initNations() {
		// Find initial economic value from owned provinces.
		for (var i = 0; i < numRows; i++) {
			for (var j = 0; j < numCols; j++) {
				var nation = nationsArr[grid[i][j].ownerIndex]
				nation.population += grid[i][j].population;
				nation.econValue += grid[i][j].econValue;
				nation.military += grid[i][j].population
				nation.military += grid[i][j].econValue * 10;
			}
		}

		// Set threat between all bordering nations.
		updateThreats();
	}

	// Returns a province, checking grid bounds.
	function getProvince(x, y) {
		if (x < 0 || x >= numRows || y < 0 || y >= numCols) return undefined;
		else return grid[x][y];
	}

	// Update the threat level between all nations.
	function updateThreats() {
		for (var i = 0; i < nationsArr.length; i++) {
			for (var j = i + 1; j < nationsArr.length; j++) {
				updateThreat(nationsArr[i], nationsArr[j])
			}
		}
	}

	// Update the threat level between two nations given a change in borders.
	function updateThreat(nation1, nation2) {
		// If border exists, threat is equal to the military strength.
		if (nation1.borders[nation2.ownerIndex].size !== 0) {
			nation1.threats[nation2.ownerIndex] = nation2.military;
			nation2.threats[nation1.ownerIndex] = nation1.military;
		}
		else {
			nation1.threats[nation2.ownerIndex] = 0;
			nation2.threats[nation1.ownerIndex] = 0;
		}
	}

	// Get total threat to a specific nation.
	function updateTotalThreat(nation) {
		nation.totalThreat = 0;
		for (var i = 0; i < nation.threats.length; i++) {
			if (i === nation.ownerIndex) continue;
			nation.totalThreat += nation.threats[i];
		}
		// Prevent divide by zero errors.
		if (nation.totalThreat === 0) nation.totalThreat = 1;
	}

	// Commit military to threatening nations.
	function commitMilitary() {
		for (var i = 0; i < nationsArr.length; i++) {
			var nation = nationsArr[i];
			updateTotalThreat(nation);

			// Commit military based on relative threat.
			for (var j = 0; j < nation.threats.length; j++) {
				// Will be zero if no threat (no border).
				nation.committedMilitary[j] = 
					nation.military * nation.threats[j] / nation.totalThreat;
			}
		}
	}

	// Resolve conflict between nations with committed military forces.
	function resolveConflict() {
		for (var i = 0; i < nationsArr.length; i++) {
			for (var j = i + 1; j < nationsArr.length; j++) {
				var nation1 = nationsArr[i];
				var nation2 = nationsArr[j];
				
				// Skip if no threat.
				if (nation1.threats[j] === 0) continue;

				// Determine military strength.
				var military1 = 
					Math.floor(nation1.committedMilitary[j] * (Math.random()));
				var military2 = 
					Math.floor(nation2.committedMilitary[i] * (Math.random()));

				// Determine winner.
				if (military1 > military2) 
					winConflict(nation1, nation2, military1, military2);
				if (military1 === military2) 
					continue;
				if (military1 < military2) 
					winConflict(nation2, nation1, military2, military1);
			}
		}
	}

	// Handle border adjustment after conflict.
	function winConflict(winner, loser, winnerForce, loserForce) {

		// Determine loser's loss. Winner loses half of loser's loss.
		var loss = Math.min(winnerForce - loserForce, loserForce);
		loser.military = loser.military - loss;
		winner.military = winner.military - Math.floor(loss / 2);

		// Prevent 0 threat errors.
		if (loser.military < 1) loser.military = 1;
		if (winner.military < 1) winner.military = 1;

		// Expand into loser from old border provinces.
		var oldBorders = new Set(winner.borders[loser.ownerIndex]);
		var lostProvinces = [];
		oldBorders.forEach(function(curr) {
			// curr is the interal border provinces of the winner
			// prov is a bordering province of a curr
			// Randomly determine if a province will be expanded from.
			if (Math.floor(Math.random() * 2) !== 0) {
				// Update ownership of all lost provinces.
				for (var xy = 0; xy < dxdy.length; xy++) {
					var prov = getProvince(curr.x + dxdy[xy][0], 
						                   curr.y + dxdy[xy][1]);
					if (prov === undefined) continue;
					if (prov.ownerIndex === loser.ownerIndex) {
						// Will be lost if owned by the loser.
						prov.ownerIndex = winner.ownerIndex;
						changedProvinces.push(prov);
						lostProvinces.push(prov);
					}
				}
			}
		});

		// Adjust borders of all lost provinces.
		for (var i = 0; i < lostProvinces.length; i++) {
			adjustBorders(winner, loser, lostProvinces[i]);
		}
	}

	// Fixes borders when a province changes hands.
	function adjustBorders(winner, loser, prov) {
		// Economic changes.
		loser.econValue -= prov.econValue;
		loser.population -= prov.population;
		winner.econValue += prov.econValue;
		winner.population += prov.population;

		// Determine new borders for lost province.
		setBorders(prov, loser);

		// Determine new borders for all adjacent provinces.
		for (var xy = 0; xy < dxdy.length; xy++) {
			var adj = getProvince(prov.x + dxdy[xy][0], prov.y + dxdy[xy][1]);
			if (adj === undefined) continue;
			setBorders(adj, nationsArr[adj.ownerIndex]);
		}
	}

	// Remove a province from borders of an old owner.
	function removeBorders(prov, oldOwner) {
		for (var i = 0; i < prov.borders.length; i++) {
			if (prov.borders[i] > 0) {
				oldOwner.borders[i].delete(prov);
			}
			prov.borders[i] = 0;
		}
	}

	// Set the borders for a province.
	function setBorders(prov, oldOwner) {
		var newOwner = nationsArr[prov.ownerIndex];

		// Remove from borders of old owner.
		removeBorders(prov, oldOwner);

		// Look at adjacent provinces to determine new borders.
		for (var xy = 0; xy < dxdy.length; xy++) {
			var adj = getProvince(prov.x + dxdy[xy][0], prov.y + dxdy[xy][1]);
			if (adj === undefined) continue;
			prov.borders[adj.ownerIndex]++;
			if (adj.ownerIndex !== prov.ownerIndex) {
				newOwner.borders[adj.ownerIndex].add(prov);
			}
		}
	}

	// Every nation creates new forces for war.
	function develop() {
		for (var i = 0; i < nationsArr.length; i++) {
			var nation = nationsArr[i];
			nation.military += Math.floor(nationsArr[i].econValue / 10);
			nation.military += Math.floor(nationsArr[i].population / 100);
		}
	}

	// Draw all provinces that changed this turn.
	function drawChangedProvinces() {
		for (var i = 0; i < changedProvinces.length; i++) {
			drawProvince(changedProvinces[i]);
		}
		changedProvinces = [];
	}

	// Color a single province based on owner.
	function drawProvince(prov) {
		ctx.fillStyle = nationsArr[prov.ownerIndex].color;
		ctx.fillRect(prov.y * provSize, prov.x * provSize, provSize, provSize);
	}

	// Fill in info for selected nation.
	function drawNationInfo() {
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

	// Color each province based on the province owner.
	function drawMap() {
		ctx.clearRect(0,0,800,400);
		for (var i = 0; i < numRows; i++) {
			for (var j = 0; j < numCols; j++) {
				ctx.fillStyle = nationsArr[grid[i][j].ownerIndex].color;
				ctx.fillRect(j * provSize, i * provSize, provSize, provSize);
			}
		}
	}

	// Reset the game and map for a new scenario.
	function resetGame() {
		// Get new nation count from input.
		nationCount = document.getElementById('nation-count').value;
		if (nationCount < 2) nationCount = 2;
		if (nationCount > 22) nationCount = 22;

		// Remove old loops.
		//cancelAnimationFrame(animationLoop);
		clearTimeout(timeoutLoop);

		// Reset global game variables.
		nationsArr = [];
		changedProvinces = [];
		grid = generateGrid();
		selectedNation = undefined;

		// Regenerate the game map.
		createNations();
		initNations();

		// Begin paused with the map drawn.
		paused = true;
		drawMap();
		drawNationInfo();

		// Start game.
		simLoop();
	}

	// Runs the simulation until stopped.
	function simLoop() {
		// Main game loop.
		if (!paused) {
			commitMilitary();
			resolveConflict();
			updateThreats();
			develop();
			drawChangedProvinces();
		}
		drawNationInfo();
		timeoutLoop = setTimeout(simLoop, 100);
		//animationLoop = window.requestAnimationFrame(simLoop);
	}

})();
	
