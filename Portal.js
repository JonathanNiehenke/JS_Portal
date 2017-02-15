let db = console.log;

function TilePortal() {
    this.__proto__ = new Engine(undefined, "v");
    this.playerFacing = "v";
    this.object = " ";
    this.Portal1 = {
        "type": "*",
        "index": undefined,
        "facing": undefined,
    };
    this.Portal2 = {
        "type": "+",
        "index": undefined,
        "facing": undefined,
    };
    this.keyInput = {
        "movementKeys": {
            "38": new IndexObj(-1, 0), // Up Arrow
            "40": new IndexObj(1, 0),  // Down Arrow
            "37": new IndexObj(0, -1), // Left Arrow
            "39": new IndexObj(0, 1),  // Right Arrow
            "87": new IndexObj(-1, 0), // W Key (Up)
            "83": new IndexObj(1, 0),  // S Key (Down)
            "65": new IndexObj(0, -1), // A Key (Left)
            "68": new IndexObj(0, 1),  // D Key (Right)
            "73": new IndexObj(-1, 0), // I key (Up)
            "75": new IndexObj(1, 0),  // K Key (Down)
            "74": new IndexObj(0, -1), // J key (Left)
            "76": new IndexObj(0, 1),  // L key (Right)
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
                let moveTo = this.Environment.player.add(Movement);
                let cellTo = this.Environment.cell[moveTo.toString()];
                let cellAction = this.Tile[cellTo].action;
                if (cellAction) {
                    cellAction.call(this, moveTo, cellTo, Movement);
                }
            }
            else if (Portal) {
                this.shootPortal(Portal);
            }
            else if (keyEvent.keyCode == 32){
                this.dropObject();
            }
        },
    };
    this.convert = {
        "toDirection": {"-1,0": "^", "1,0": "v", "0,-1": "<", "0,1": ">"},
        "reverseFacing": {"^": "v", "v": "^", "<": ">", ">": "<"},
        "toMovement": {
            "^": new IndexObj(-1,0),
            "v": new IndexObj(1,0),
            "<": new IndexObj(0,-1),
            ">": new IndexObj(0,1)
        },
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
            else if (Begin !== "/" && Begin) {
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
    this.movePlayer = function(moveTo, _, Movement) {
        let Facing = this.convert.toDirection[Movement.toString()];
        this.placePlayer(moveTo, Facing)
        this.playerFacing = Facing;
    };
    this.changeFacing = function(_, _, Movement) {
        this.movePlayer(this.Environment.player, _, Movement);
    };
    this.removePortal = function(Portal) {
        if (Portal.index) {
            this.replaceCell(Portal.index, "#");
        }
    };
    this.placePortal = function(Portal, newPortalIndex, Facing) {
        Portal.index = newPortalIndex;
        Portal.facing = Facing;
        this.replaceCell(newPortalIndex, Portal.type);
    };
    this.shootPortal = function(Portal) {
        let Movement = this.convert.toMovement[this.playerFacing];
        let portalFacing = this.convert.reverseFacing[this.playerFacing];
        let targetIndex = this.Environment.player.add(Movement);
        let targetCell = this.Environment.cell[targetIndex.toString()];
        while (targetCell) {
            if (targetCell === "#" || targetCell === Portal.type) {
                this.removePortal(Portal);
                this.placePortal(Portal, targetIndex, portalFacing);
                break;
            }
            // Breakoff search if target cell is the remaining portal.
            else if (targetCell === "*" || targetCell === "+" ||
                     targetCell === "X")
            {
                break;
            }
            targetIndex = targetIndex.add(Movement);
            targetCell = this.Environment.cell[targetIndex.toString()];
        }
    };
    // Very similar to keyInput.handle
    this.portalTransit = function(moveTo, cellTo, Movement) {
        let portalTo = cellTo === "*" ? this.Portal2 : this.Portal1;
        let portalMovement = this.convert.toMovement[portalTo.facing];
        let Exit = portalTo.index.add(portalMovement);
        let exitCell = this.Environment.cell[Exit.toString()];
        let exitAction = this.Tile[exitCell].action;
        Movement = (exitCell === "@") ? Movement : portalMovement;
        if (exitAction) {
            exitAction.call(this, Exit, exitCell, Movement);
        }
    };
    this.revealWall = function(_, cellTo, _) {
        this.replaceAllCells(cellTo.toUpperCase(), "#");
    };
    this.revealEmpty = function(_, cellTo, _) {
        this.replaceAllCells(cellTo.toUpperCase(), " ");
    };
    this.__replaceObject = function(cellValue) {
        this.object = cellValue;
        let newImgEl = this.Tile[cellValue].image.cloneNode();
        let currentImgEl = document.getElementById("Object");
        currentImgEl.parentNode.replaceChild(newImgEl, currentImgEl);
        newImgEl.id = "Object";
    };
    this.Pickup = function(moveTo, cellTo, Movement) {
        if (this.object === " ") {
            this.__replaceObject(cellTo);
            this.Environment.cell[moveTo] = " ";
        }
        this.movePlayer(moveTo, cellTo, Movement);
    };
    this.dropObject = function() {
        let currentPos = this.Environment.player.toString();
        if (this.Environment.cell[currentPos] === " ") {
            this.Environment.cell[currentPos] = this.object;
            this.__replaceObject(" ");
        }
    };
    this.__constructTiles = function() {
        let getImg = document.getElementById.bind(document);
        let Tile = {
            " ": {"image": getImg("Empty"), "action": this.movePlayer},
            "@": {"image": getImg("Hazard"), "action": this.changeFacing},
            "#": {"image": getImg("Wall"), "action": this.changeFacing},
            "$": {"image": getImg("Down"), "action": undefined},
            "^": {"image": getImg("Up"), "action": undefined},
            "v": {"image": getImg("Down"), "action": undefined},
            "<": {"image": getImg("Left"), "action": undefined},
            ">": {"image": getImg("Right"), "action": undefined},
            "*": {"image": getImg("Portal1"), "action": this.portalTransit},
            "+": {"image": getImg("Portal2"), "action": this.portalTransit},
            "X": {
                "image": getImg("Exit"),
                "action": function(){
                    this.Environment = this.nextEnvironment();
                    this.playerFacing = "v";
                    this.Portal1.index = undefined;
                    this.Portal2.index = undefined;
                    if (Object.keys(this.Environment.cell).length === 0) {
                        let structureEl = document.getElementById("Structure");
                        structureEl.innerHTML = "Complete";
                    }
                }
            },
            "a": {"image": getImg("PushButton"), "action": this.revealWall},
            "b": {"image": getImg("PushButton"), "action": this.revealWall},
            "c": {"image": getImg("PushButton"), "action": this.revealWall},
            "d": {"image": getImg("PushButton"), "action": this.revealWall},
            "e": {"image": getImg("PushButton"), "action": this.revealEmpty},
            "f": {"image": getImg("PushButton"), "action": this.revealEmpty},
            "g": {"image": getImg("PushButton"), "action": this.revealEmpty},
            "h": {"image": getImg("PushButton"), "action": this.revealEmpty},
            "i": {"image": getImg("Button"), "action": this.revealWall},
            "j": {"image": getImg("Button"), "action": this.revealWall},
            "k": {"image": getImg("Button"), "action": this.revealWall},
            "l": {"image": getImg("Button"), "action": this.revealWall},
            "m": {"image": getImg("Button"), "action": this.revealEmpty},
            "n": {"image": getImg("Button"), "action": this.revealEmpty},
            "o": {"image": getImg("Button"), "action": this.revealEmpty},
            "p": {"image": getImg("Button"), "action": this.revealEmpty},
            "A": {"image": getImg("Hazard"), "action": this.changeFacing},
            "B": {"image": getImg("Hazard"), "action": this.changeFacing},
            "C": {"image": getImg("Hazard"), "action": this.changeFacing},
            "D": {"image": getImg("Hazard"), "action": this.changeFacing},
            "E": {"image": getImg("Hazard"), "action": this.changeFacing},
            "F": {"image": getImg("Hazard"), "action": this.changeFacing},
            "G": {"image": getImg("Hazard"), "action": this.changeFacing},
            "H": {"image": getImg("Hazard"), "action": this.changeFacing},
            "I": {"image": getImg("Hazard"), "action": this.changeFacing},
            "J": {"image": getImg("Hazard"), "action": this.changeFacing},
            "K": {"image": getImg("Hazard"), "action": this.changeFacing},
            "L": {"image": getImg("Hazard"), "action": this.changeFacing},
            "M": {"image": getImg("Hazard"), "action": this.changeFacing},
            "N": {"image": getImg("Hazard"), "action": this.changeFacing},
            "O": {"image": getImg("Hazard"), "action": this.changeFacing},
            "P": {"image": getImg("Hazard"), "action": this.changeFacing},
            "Q": {"image": getImg("Hazard"), "action": this.changeFacing},
            "z": {"image": getImg("Cube"), "action": this.Pickup},
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
