var Tile = function(options){
	this.type = options.type; // mines, number, expander
	this.visible = options.visible; // is it hidden or shown?
	this.number = options.number; // number of adjacent mines
	this.x = options.x; // x coordinate
	this.y = options.y; // y coordinate
	this.$el = "";
}

var Field = function(rows, cols){
	this.tiles = []; // array of Tile instances
	this.fieldObj = {}; // initial Obj to generate tiles array
	this.rows = rows; // number of rows
	this.cols = cols; // number of cols
	this.tilesLeft = rows * cols;
	this.minesLeft = 0;
	this.remainingMines = 0; // number of remaining mines
}

var StatBoard = function(){
	this.time = 0;
	this.minesLeft = 0;
	this.timer = "";
}

StatBoard.prototype = {
	resetTime: function(){
		this.time = 0;
		clearInterval(this.timer);
	},
	startCounting: function(){
		var that = this;
		that.timer = window.setInterval(function(){
			that.time += 1;
			that.renderTime();
		}, 1000);
	},
	renderTime: function(){
		var timeStringArray = (this.time + "").split("");
		var $timerContainer = $(".timer");
		var className = "";

		$timerContainer.empty();
		for (var i=0, l=timeStringArray.length; i<l; i++) {
			className = "display number-" + timeStringArray[i];
			$timerContainer.append($("<div>").addClass(className));
		}
	},
	init: function(){
		this.resetTime();
		this.startCounting();
	}
}

Field.prototype = {
	forHiddenAdjacentTiles: function(tile, callback) {
		var x = tile.x;
		var y = tile.y;
		var tiles = [];
		var RangeMinX = (x - 1) < 0 ? 0 : x - 1;
		var RangeMaxX = (x + 1) > (this.rows - 1) ? this.rows - 1 : x + 1;
		var RangeMinY = (y - 1) < 0 ? 0 : y - 1;
		var RangeMaxY = (y + 1) > (this.cols - 1) ? this.cols - 1 : y + 1;

		for (var i=RangeMinX, l=RangeMaxX; i<=l; i++) {
			for (var j=RangeMinY, m=RangeMaxY; j<=m; j++) {
				if (!(i === x && j === y)) {
					// A flag to stop is required, otherwise AdjacentTiles will endlessly call each other.
					if (!(this.tiles[i][j].visible)) callback.call(this, this.tiles[i][j]);
				}
			}
		}
	},
	forAdjacentObjects: function(Obj, x, y, callback) {
		var RangeMinX = (x - 1) < 0 ? 0 : x - 1;
		var RangeMaxX = (x + 1) > this.rows - 1  ? this.rows - 1 : x + 1;
		var RangeMinY = (y - 1) < 0 ? 0 : y - 1;
		var RangeMaxY = (y + 1) > this.cols - 1 ? this.cols - 1 : y + 1;

		for (var i=RangeMinX, l=RangeMaxX; i<=l; i++) {
			for (var j=RangeMinY, m=RangeMaxY; j<=m; j++) {
				if (!(i === x && j === y)) {
					callback.call(this, Obj, i, j);
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
		var mineCounts = Math.floor(this.rows * this.cols * 0.25);
		var randomX, randomY;

		this.minesLeft = mineCounts;

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
		var $container = $(".game-board");
		var $ul = $("<ul>");
		var $li, liClassName;
		var that = this;

		$ul.addClass("minefield").css({
			width: 16 * this.cols + 8
		});

		$(".stat-board").css({
			width: 16 * this.cols + 8
		});

		$(".game-window").css({
			width: 16 * this.cols + 20
		});

		$container.empty().off("*");

		$(".emote").on("click", function(e){
			e.preventDefault();
			that.init();
		});

		for (var x=0,l=this.rows; x<l; x++) {
			for (var y=0,m=this.cols; y<m; y++) {
				liClassName = "tile";
				$li = $("<li>").addClass(liClassName).attr({
					"data-x": x,
					"data-y": y
				});
				this.attachRevealTileEvent($li);
				this.tiles[x][y].$el = $li;
				$ul.append($li);
			}
		}
		
		$container.append($ul);
	},
	attachRevealTileEvent: function($li) {
		var that = this;
		$li.one("click", function(){
			var x = $(this).attr('data-x');
			var y = $(this).attr('data-y');
			var tile = that.tiles[x][y];
			var className;

			tile.visible = true;
			className = tile.type;
			if (tile.type === "number") className += "-" + tile.number;
			$(this).removeClass("tile").addClass(className);
			that.expandAdjacentTiles.call(that, tile);
		});
	},
	expandAdjacentTiles: function(tile) {
		if (!tile.visible) tile.$el.trigger("click"); 
		if (tile.type === "expander") this.forHiddenAdjacentTiles.call(this, tile, this.expandAdjacentTiles);
	},
	init: function() {
		this.reset();
		this.render();
	}
}

new Field(50,30).init();
new StatBoard().init();