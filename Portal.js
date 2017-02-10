let db = console.log;

function TilePortal() {
    this.__proto__ = new Engine(undefined, "v");
    this.Portal1 = {
        "type": "o",
        "index": undefined,
        "onCell": undefined,
        "facing": undefined,
    };
    this.Portal2 = {
        "type": "O",
        "index": undefined,
        "onCell": undefined,
        "facing": undefined,
    };
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
    this.__replaceMap = function(moveTo, cellTo) {
        this.Inventory.map[moveTo] = cellTo;
        this.replaceImage(moveTo, cellTo);
    };
    */ 
    this.changeFacing = function(_, _, Movement) {
        let toDirection  = {"-1,0": "^", "1,0": "v", "0,-1": "<", "0,1": ">"};
        this.replaceImage(this.Environment.player, toDirection[Movement]);
        this.Environment.facing = toDirection[Movement];
    };
    this.shootPortal = function(Portal) {
        let toMovement = {"^": [-1,0], "v": [1,0], "<": [0,-1], ">": [0,1]};
        let Movement = toMovement[this.Environment.facing];
        let toReverse = {"^": "v", "v": "^", "<": ">", ">": "<"};
        let targetIndex = [
            this.Environment.player[0] + Movement[0],
            this.Environment.player[1] + Movement[1]
        ];
        while (this.Environment.cell.hasOwnProperty(targetIndex)) {
            if (this.Environment.cell[targetIndex] === "#" ||
                this.Environment.cell[targetIndex] === Portal.type)
            {
                let portalFacing = toReverse[this.Environment.facing];
                this.removePortal(Portal);
                this.placePortal(Portal, targetIndex, portalFacing);
                break;
            }
            // Breakoff search if the other portal.
            else if (this.Environment.cell[targetIndex] === "o" ||
                     this.Environment.cell[targetIndex] === "O")
            {
                break;
            }
            targetIndex = [
                targetIndex[0] + Movement[0],
                targetIndex[1] + Movement[1]
            ];
        }
    }
    this.placePortal = function(Portal, portalIndex, Facing) {
        Portal.index = portalIndex;
        Portal.value = this.Environment.cell[portalIndex];
        Portal.facing = Facing;
        this.replaceCell(portalIndex, Portal.type);
    };
    this.removePortal = function(Portal) {
        if (Portal.index) {
            this.replaceCell(Portal.index, Portal.value);
        }
    };
    this.portalTransit = function(moveTo, cellTo) {
        let Environment = this.Environment;
        let Portal = cellTo === "o" ? this.Portal2 : this.Portal1;
        let toMovement = {"^": [-1,0], "v": [1,0], "<": [0,-1], ">": [0,1]};
        let Movement = toMovement[Portal.facing];
        let Exit = [
            Portal.index[0] + Movement[0],
            Portal.index[1] + Movement[1]
        ];
        if (Environment.cell[Exit] === " ") {
            this.movePlayer(Exit, cellTo, Movement);
        }
    };
    this.__constructTiles = function() {
        let getImg = document.getElementById.bind(document);
        Tile = {
            " ": {"image": getImg("Empty"), "action": this.movePlayer},
            "@": {"image": getImg("Hazard"), "action": this.changeFacing},
            "#": {"image": getImg("Wall"), "action": this.changeFacing},
            "$": {"image": getImg("Down"), "action": undefined},
            "^": {"image": getImg("Up"), "action": undefined},
            "v": {"image": getImg("Down"), "action": undefined},
            "<": {"image": getImg("Left"), "action": undefined},
            ">": {"image": getImg("Right"), "action": undefined},
            "o": {"image": getImg("Portal1"), "action": this.portalTransit},
            "O": {"image": getImg("Portal2"), "action": this.portalTransit},
        };
        return Tile;
    };
    this.keyInput = {
        "movementKeys": {
            "38": [-1, 0], // Up Arrow
            "40": [1, 0],  // Down Arrow
            "37": [0, -1], // Left Arrow
            "39": [0, 1],  // Right Arrow
            "87": [-1, 0], // W Key (Up)
            "83": [1, 0],  // S Key (Down)
            "65": [0, -1], // A Key (Left)
            "68": [0, 1],  // D Key (Right)
            "73": [-1, 0], // I key (Up)
            "75": [1, 0],  // K Key (Down)
            "74": [0, -1], // J key (Left)
            "76": [0, 1],  // L key (Right)
        },
        "portalKeys": {
            "81": this.Portal1,  // Q Key
            "69": this.Portal2,  // E Key
            "85": this.Portal1,  // U Key
            "79": this.Portal2,  // O Key
            "17": this.Portal1,  // Ctrl Key
            "16": this.Portal2,  // Shift Key
        },
        "handle": function(keyEvent) {
            let Movement = this.keyInput.movementKeys[keyEvent.keyCode];
            let Portal = this.keyInput.portalKeys[keyEvent.keyCode];
            if (Movement) {
                let moveTo = [
                    this.Environment.player[0] + Movement[0],
                    this.Environment.player[1] + Movement[1]];
                let cellTo = this.Environment.cell[moveTo];
                let cellAction = this.Tile[cellTo].action;
                if (moveTo in this.Environment.cell && cellAction) {
                    cellAction.call(this, moveTo, cellTo, Movement);
                }
            }
            else if (Portal) {
                this.shootPortal(Portal);
            }
        },
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
