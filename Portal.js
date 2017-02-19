let db = console.log;

function TilePortal() {
    this.__proto__ = new Engine(undefined, "v");
    this.playerFacing = "v";
    this.Inventory = {
        "object": " ",
        "map": {},
    }
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
            else if (keyEvent.keyCode == 32) {  // A space
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
    this.movePlayer = function(moveTo, cellTo, Movement) {
        let onCell = this.Environment.cell[this.Environment.player.toString()];
        if ("ijklmnop".indexOf(onCell) !== -1) {
            this.Tile[onCell].action.call(this, moveTo, onCell, Movement, true);
        }
        let Facing = this.convert.toDirection[Movement.toString()];
        this.placePlayer(moveTo, Facing)
        this.playerFacing = Facing;
    };
    this.changeFacing = function(_, toCell, Movement) {
        let Facing = this.convert.toDirection[Movement.toString()];
        this.placePlayer(this.Environment.player, Facing)
        this.playerFacing = Facing;
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
            if (targetCell === Portal.type ||
                "#EFGHMXOP".indexOf(targetCell) !== -1)
            {
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
    this.adjustHW = function(_, cellTo, _, hide) {
        this.replaceAllCells(cellTo.toUpperCase(), hide ? "@" : "#");
    };
    this.adjustHE = function(_, cellTo, _, hide) {
        this.replaceAllCells(cellTo.toUpperCase(), hide ? "@" : " ");
    };
    this.adjustWE = function(_, cellTo, _, hide) {
        this.replaceAllCells(cellTo.toUpperCase(), hide ? "#" : " ");
    };
    this.adjustWH = function(_, cellTo, _, hide) {
        this.replaceAllCells(cellTo.toUpperCase(), hide ? "#" : "@");
    };
    this.pushHW = function(_, cellTo, Movement, hide) {
        this.adjustHW(_, cellTo, Movement);
        this.changeFacing(_, cellTo, Movement);
    };
    this.pushHE = function(_, cellTo, Movement, hide) {
        this.adjustHE(_, cellTo, Movement);
        this.changeFacing(_, cellTo, Movement);
        this.replaceAllCells(cellTo.toUpperCase(), hide ? "@" : " ");
    };
    this.pushWE = function(_, cellTo, Movement, hide) {
        this.adjustWE(_, cellTo, Movement);
        this.changeFacing(_, cellTo, Movement);
    };
    this.pushWH = function(_, cellTo, Movement, hide) {
        this.adjustWH(_, cellTo, Movement);
        this.changeFacing(_, cellTo, Movement);
    };
    this.buttonHW = function(moveTo, cellTo, Movement, hide) {
        if (!hide) {
            this.movePlayer(moveTo, cellTo, Movement);
        }
        this.adjustHW(moveTo, cellTo, Movement, hide);
    };
    this.buttonHE = function(moveTo, cellTo, Movement, hide) {
        if (!hide) {
            this.movePlayer(moveTo, cellTo, Movement);
        }
        this.adjustHE(moveTo, cellTo, Movement, hide);
    };
    this.buttonWE = function(moveTo, cellTo, Movement, hide) {
        if (!hide) {
            this.movePlayer(moveTo, cellTo, Movement);
        }
        this.adjustWE(moveTo, cellTo, Movement, hide);
    };
    this.buttonWH = function(moveTo, cellTo, Movement, hide) {
        if (!hide) {
            this.movePlayer(moveTo, cellTo, Movement);
        }
        this.adjustWH(moveTo, cellTo, Movement, hide);
    };
    this.__replaceObject = function(cellValue) {
        this.Inventory.object = cellValue;
        let newImgEl = this.Tile[cellValue].image.cloneNode();
        let currentImgEl = document.getElementById("Object");
        currentImgEl.parentNode.replaceChild(newImgEl, currentImgEl);
        newImgEl.id = "Object";
    };
    this.Pickup = function(moveTo, cellTo, Movement) {
        if (cellTo === "Z" && this.Inventory.object === " ") {
            this.__replaceObject("z");
            let rep = this.Inventory.map[moveTo.toString()];
            this.Environment.cell[moveTo] = rep;
        }
        else if (this.Inventory.object === " ") {
            this.__replaceObject(cellTo);
            this.Environment.cell[moveTo] = " ";
        }
        this.movePlayer(moveTo, cellTo, Movement);
    };
    this.dropObject = function() {
        if (this.Inventory.object !== "z") return;
        let currentPos = this.Environment.player.toString();
        let currentCell = this.Environment.cell[currentPos];
        db(currentPos, currentCell, this.Inventory.object);
        if (currentCell === " ") {
            this.Environment.cell[currentPos] = this.Inventory.object;
            this.__replaceObject(" ");
        }
        else if ("ijklmnop".indexOf(currentCell) !== -1) {
            this.__replaceObject(" ");
            this.Environment.cell[currentPos] = "Z";
            this.Inventory.map[currentPos] = currentCell;
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
            "a": {"image": getImg("PushButton"), "action": this.pushHW},
            "b": {"image": getImg("PushButton"), "action": this.pushHW},
            "c": {"image": getImg("PushButton"), "action": this.pushHE},
            "d": {"image": getImg("PushButton"), "action": this.pushHE},
            "e": {"image": getImg("PushButton"), "action": this.pushWE},
            "f": {"image": getImg("PushButton"), "action": this.pushWE},
            "g": {"image": getImg("PushButton"), "action": this.pushWH},
            "h": {"image": getImg("PushButton"), "action": this.pushWH},
            "i": {"image": getImg("Button"), "action": this.buttonHW},
            "j": {"image": getImg("Button"), "action": this.buttonHW},
            "k": {"image": getImg("Button"), "action": this.buttonHE},
            "l": {"image": getImg("Button"), "action": this.buttonHE},
            "m": {"image": getImg("Button"), "action": this.buttonWE},
            "n": {"image": getImg("Button"), "action": this.buttonWE},
            "o": {"image": getImg("Button"), "action": this.buttonWH},
            "p": {"image": getImg("Button"), "action": this.buttonWH},
            "A": {"image": getImg("Hazard"), "action": this.changeFacing},
            "B": {"image": getImg("Hazard"), "action": this.changeFacing},
            "C": {"image": getImg("Hazard"), "action": this.changeFacing},
            "D": {"image": getImg("Hazard"), "action": this.changeFacing},
            "E": {"image": getImg("Wall"), "action": this.changeFacing},
            "F": {"image": getImg("Wall"), "action": this.changeFacing},
            "G": {"image": getImg("Wall"), "action": this.changeFacing},
            "H": {"image": getImg("Wall"), "action": this.changeFacing},
            "I": {"image": getImg("Hazard"), "action": this.changeFacing},
            "J": {"image": getImg("Hazard"), "action": this.changeFacing},
            "K": {"image": getImg("Hazard"), "action": this.changeFacing},
            "L": {"image": getImg("Hazard"), "action": this.changeFacing},
            "M": {"image": getImg("Wall"), "action": this.changeFacing},
            "N": {"image": getImg("Wall"), "action": this.changeFacing},
            "O": {"image": getImg("Wall"), "action": this.changeFacing},
            "P": {"image": getImg("Wall"), "action": this.changeFacing},
            "z": {"image": getImg("Cube"), "action": this.Pickup},
            "Z": {"image": getImg("CubeButton"), "action": this.Pickup},
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
