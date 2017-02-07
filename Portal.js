let db = console.log;

function TilePortal() {
    this.__proto__ = new Engine(undefined, "v");
    this.parseLevelFile = function*(levelFile) {
        let fileLines = levelFile.target.result.split("\n");
        Structure = [];
        for (let Line of fileLines) {
            let Begin = Line ? Line[0] : "";
            if (!Begin && Structure.length) {
                yield Structure;
                // Previous references are gone.
                Structure = [];
            }
            else if (Begin === "\\" || !Begin) {
                continue;
            }
            else {
                Structure.push(Line);
            }
        }
    };
    this.handleFileEvent = function(fileEvent) {
        function onFileLoad(levelFile) {
            this.Levels = this.parseLevelFile(levelFile);
            this.Environment = this.nextEnvironment();
        }
        let levelFile = fileEvent.target.files[0];
        if (levelFile) {
            let Reader = new FileReader();
            Reader.onload = onFileLoad.bind(this);
            Reader.readAsText(levelFile);  // Calls Reader.onload.
            document.getElementById("Game").className = "";
            document.getElementById("levels").className = "Hidden";
        }
    };
    // Reimpliment for blocks and spheres.
    /*
    this.__replaceObject = function(cellValue) {
        this.Inventory.object = cellValue;
        let newImgEl = this.Tile[cellValue].image.cloneNode();
        let currentImgEl = document.getElementById("Object");
        currentImgEl.parentNode.replaceChild(newImgEl, currentImgEl);
        newImgEl.id = "Object";  // Reset the id for later use.
        if (cellValue === "@") {
            this.changeRequirements(-1);
            this.replaceAllCells(":", ":");
        }
        else {
            this.changeRequirements(1);
            this.replaceAllCells(":", ";");
        }
    };
    this.pickupObject = function(moveTo, cellTo) {
        if (this.Inventory.object === "@") {
            this.openCell(moveTo);
            this.__replaceObject(cellTo);
        }
    };
    this.dropObject = function(moveTo, cellTo) {
        let object = cellTo.toLowerCase();
        if (object === this.Inventory.object) {
            this.__replaceObject("@");
        }
    };
    */ 
    this.__replaceMap = function(moveTo, cellTo) {
        this.Inventory.map[moveTo] = cellTo;
        this.replaceImage(moveTo, cellTo);
    };
    this.__constructTiles = function() {
        let getImg = document.getElementById.bind(document);
        Tile = {
            " ": {"image": getImg("Empty"), "action": this.movePlayer},
            "#": {"image": getImg("Wall"), "action": undefined},
            "$": {"image": getImg("Down"), "action": undefined},
            "^": {"image": getImg("Up"), "action": undefined},
            "v": {"image": getImg("Down"), "action": undefined},
            "<": {"image": getImg("Left"), "action": undefined},
            ">": {"image": getImg("Right"), "action": undefined},
        };
        return Tile;
    };
    this.Tile = this.__constructTiles();
}

function init() {
    let Portal = new TilePortal();
    let handleFileEvent = Portal.handleFileEvent.bind(Portal);
    document.getElementById("levels").addEventListener(
        "change", handleFileEvent, false);
    let handleKey = Portal.keyInput.handle.bind(Portal);
    document.addEventListener("keydown", handleKey);
}
