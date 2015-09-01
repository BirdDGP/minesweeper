// Started at 4:37 PM

var Tile = function(options){
	this.type = options.type; // mines, number, expander
	this.visible = options.visible; // is it hidden or shown?
	this.number = options.number; // number of adjacent mines
	this.x = options.x; // x coordinate
	this.y = options.y; // y coordinate
}

var Field = function(rows, cols){
	this.tiles = []; // array of Tile instances
	this.fieldObj = {}; // initial Obj to generate tiles array
	this.rows = rows; // number of rows
	this.cols = cols; // number of cols
	this.remainingMines = 0; // number of remaining mines
}

Field.prototype = {
	getAdjacentTiles: function(Tile) {
		var x = Tile.x;
		var y = Tile.y;
		var tiles = [];
		var RangeMinX = (x - 1) < 0 ? 0 : x - 1;
		var RangeMaxX = (x + 1) > this.rows ? this.rows : x + 1;
		var RangeMinY = (y - 1) < 0 ? 0 : y - 1;
		var RangeMaxY = (y + 1) > this.cols ? this.cols : y + 1;

		for (var i=RangeMinX, l=RangeMaxX; i<l; i++) {
			for (var j=RangeMinY, m=RangeMaxY; j<m; j++) {
				if (i !== x && y !== j) {
					tiles.push(this.tiles[i][j]);
				}
			}
		}

		return tiles;
	},
	forAdjacentObjects: function(Obj, x, y, callback) {
		var RangeMinX = (x - 1) < 0 ? 0 : x - 1;
		var RangeMaxX = (x + 1) > this.rows ? this.rows : x + 1;
		var RangeMinY = (y - 1) < 0 ? 0 : y - 1;
		var RangeMaxY = (y + 1) > this.cols ? this.cols : y + 1;

		for (var i=RangeMinX, l=RangeMaxX; i<=l; i++) {
			for (var j=RangeMinY, m=RangeMaxY; j<=m; j++) {
				if (!(i === x && j === y)) {
					callback(Obj, i, j);
				}
			}
		}
	},
	reset: function() {
		this.fieldObj = {};
		this.generateMinesAndNumbers();
		this.generateTiles();
	},
	generateMinesAndNumbers: function() {
		// fill 30% of the Field with mines.
		var mineCounts = Math.floor(this.rows * this.cols * 0.3);
		var randomX, randomY;

		this.remainingMines = mineCounts;

		do {
			// randomly assign 0 to max 
			randomX = Math.floor(Math.random() * this.rows);
			randomY = Math.floor(Math.random() * this.cols);

			// stub empty placeholder if array doesn't exist.
			if (!this.fieldObj[randomX]) {
				this.fieldObj[randomX] = {};
			}

			// if nothing exists on this tile OR the type of this tile isn't mine, assign it as mine.
			if (!this.fieldObj[randomX][randomY] ||
				this.fieldObj[randomX][randomY].type !== "mine") {

				this.fieldObj[randomX][randomY] = {
					type: "mine",
					number: 0,
					visible: false,
					x: randomX,
					y: randomY
				};

				// increase the nearby mine number on adjacent tiles
				this.forAdjacentObjects(this.fieldObj, randomX, randomY, function(obj, x, y){
					if (!obj[x]) obj[x] = {};
					if (!obj[x][y]) {
						obj[x][y] = {
							type: "number",
							number: 1,
							visible: false,
							x: x,
							y: y
						}
					} else if (obj[x][y] && obj[x][y].type === "number") {
						obj[x][y].number += 1;
					}
				});

				mineCounts--;
			}
		} while (mineCounts > 0);
	},
	generateTiles: function() {
		for (var x=0, l=this.rows; x<l; x++) {
			this.tiles[x] = [];
			for (var y=0, j=this.cols; y<j; y++) {
				if (this.fieldObj[x] && this.fieldObj[x][y]) {
					this.tiles[x][y] = new Tile(this.fieldObj[x][y])
				} else {
					this.tiles[x][y] = new Tile({
						type: "expander",
						number: 0,
						visible: false,
						x: x,
						y: y
					});
				}
			}
		}
	},
	render: function() {
		var $container = $(".container");
		var $ul = $("<ul>");
		var $li, liClassName;

		$ul.addClass("minefield").css({
			width: 16 * this.cols
		});

		for (var x=0,l=this.rows; x<l; x++) {
			for (var y=0,m=this.cols; y<m; y++) {
				liClassName = this.tiles[x][y].type;

				if (this.tiles[x][y].type === "number") {
					liClassName += "-" + this.tiles[x][y].number;
				}
				$li = $("<li>").addClass(liClassName);
				$ul.append($li);
			}
		}
		
		$container.append($ul);
	},
	init: function() {
		this.reset();
		this.render();
	}
}

new Field(50,40).init();