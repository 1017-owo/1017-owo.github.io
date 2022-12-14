var movesarr = [];
(function (global) {
    if (!global.misohena) { global.misohena = {}; }
    if (!global.misohena.js_pegsolitaire) { global.misohena.js_pegsolitaire = {}; }
    var mypkg = global.misohena.js_pegsolitaire;
    var INVALID_HOLE_ID = -1;
    var INVALID_DIR = -1;
    var MAX_BOARD_SIZE = 50;

    function BoardBase() {
        this.pushPeg = function (holeId) {
            this.setPegExists(holeId, true);
            return this;
        };
        this.pullPeg = function (holeId) {
            this.setPegExists(holeId, false);
            return this;
        };
        this.movePeg = function (fromId, toId) {
            if (this.hasPeg(fromId) && this.hasEmptyHole(toId)) {
                var dir = this.getDirFromToDist2(fromId, toId);
                if (dir != INVALID_DIR) {
                    var nextId = this.getAdjacent(fromId, dir);
                    var nextNextId = this.getAdjacent(nextId, dir);
                    if (this.hasPeg(nextId)) {
                        this.pullPeg(fromId);
                        this.pullPeg(nextId);
                        this.pushPeg(nextNextId);
                        return true;
                    }
                }
            }
            return false;
        };
        this.undoMovePeg = function (fromId, toId) {
            if (this.hasEmptyHole(fromId) && this.hasPeg(toId)) {
                var dir = this.getDirFromToDist2(fromId, toId);
                if (dir != INVALID_DIR) {
                    var nextId = this.getAdjacent(fromId, dir);
                    var nextNextId = this.getAdjacent(nextId, dir);
                    if (this.hasEmptyHole(nextId)) {
                        this.pushPeg(fromId);
                        this.pushPeg(nextId);
                        this.pullPeg(nextNextId);
                        return true;
                    }
                }
            }
            return false;
        };
        this.canMoveFrom = function (fromId) {
            if (this.hasPeg(fromId)) {
                for (var dir = 0; dir < this.getDirCount(); ++dir) {
                    if (this.canMoveDir(fromId, dir)) {
                        return true;
                    }
                }
            }
            return false;
        };
        this.canMoveFromTo = function (fromId, toId) {
            if (this.hasPeg(fromId) && this.hasEmptyHole(toId)) {
                return this.hasPeg(
                    this.getAdjacent(fromId,
                        this.getDirFromToDist2(fromId, toId)));
            }
            return false;
        };
        this.canMoveDir = function (fromId, dir) {
            var nextId = this.getAdjacent(fromId, dir);
            var nextNextId = this.getAdjacent(nextId, dir);
            return this.hasPeg(fromId) &&
                this.hasPeg(nextId) &&
                this.hasEmptyHole(nextNextId);
        };
        this.getDirFromTo = function (fromId, toId) {
            for (var dir = 0; dir < this.getDirCount(); ++dir) {
                var id = this.getAdjacent(fromId, dir);
                while (this.hasValidHole(id)) {
                    if (id == toId) {
                        return dir;
                    }
                    id = this.getAdjacent(id, dir);
                }
            }
            return INVALID_DIR;
        };
        this.getDirFromToDist2 = function (fromId, toId) {
            if (this.hasValidHole(fromId) && this.hasValidHole(toId)) {
                for (var dir = 0; dir < this.getDirCount(); ++dir) {
                    var nextNextId = this.getAdjacent(this.getAdjacent(fromId, dir), dir);
                    if (nextNextId == toId) {
                        return dir;
                    }
                }
            }
            return INVALID_DIR;
        };
        this.findHoleAtPosition = function (x, y, r, includingInvalidHoles) {
            if (!r) { r = 0.5; }
            var count = this.getHoleCount();
            for (var id = 0; id < count; ++id) {
                if (includingInvalidHoles || this.hasValidHole(id)) {
                    var dx = this.getHoleLayoutPositionX(id) - x;
                    var dy = this.getHoleLayoutPositionY(id) - y;
                    if (dx * dx + dy * dy < r * r) {
                        return id;
                    }
                }
            }
            return INVALID_HOLE_ID;
        };
        this.getPegCount = function () {
            var holeCount = this.getHoleCount();
            var pegCount = 0;
            for (var id = 0; id < holeCount; ++id) {
                if (this.hasPeg(id)) {
                    ++pegCount;
                }
            }
            return pegCount;
        };
        this.isSolved = function () {
            return this.getPegCount() == 1;
        };
        this.isEnd = function () {
            var holeCount = this.getHoleCount();
            for (var id = 0; id < holeCount; ++id) {
                if (this.hasPeg(id)) {
                    if (this.canMoveFrom(id)) {
                        return false;
                    }
                }
            }
            return true;
        };
        this.eachHole = function (fun, includingInvalidHoles) {
            var holeCount = this.getHoleCount();
            for (var id = 0; id < holeCount; ++id) {
                if (includingInvalidHoles || this.hasValidHole(id)) {
                    fun(id);
                }
            }
        };
    }

    function GridBoardBase(holes) {
        BoardBase.call(this);

        // Board Interface

        this.getHoleCount = function () {
            return holes.length;
        };
        this.hasValidHole = function (holeId) {
            return holes[holeId] !== undefined;
        };
        this.hasEmptyHole = function (holeId) {
            return holes[holeId] === false;
        };
        this.hasPeg = function (holeId) {
            return holes[holeId] === true;
        };

        this.setHoleState = function (holeId, stateUndefinedOrFlaseOrTrue) {
            if (holeId >= 0 && holeId < holes.length) {
                holes[holeId] = typeof (stateUndefinedOrFlaseOrTrue) == "boolean" ? stateUndefinedOrFlaseOrTrue : undefined;
            }
        };
        this.getHoleState = function (holeId) {
            return holes[holeId];
        };
        this.setPegExists = function (holeId, peg) {
            if (this.hasValidHole(holeId)) {
                holes[holeId] = peg === true;
            }
            return this;
        };
        this.setHoleOpen = function (holeId, open) {
            if (holeId >= 0 && holeId < holes.length) {
                if (open) {
                    holes[holeId] = false;
                }
                else {
                    holes[holeId] = undefined;
                }
            }
            return this;
        };
        this.clear = function () {
            for (var id = 0; id < holes.length; ++id) {
                this.setHoleState(id, undefined);
            }
            return this;
        };
        this.boreHoleAll = function () {
            for (var id = 0; id < holes.length; ++id) {
                this.setHoleOpen(id, true);
            }
            return this;
        };
        this.fillPegAll = function () {
            for (var id = 0; id < holes.length; ++id) {
                this.setPegExists(id, true);
            }
            return this;
        };
        this.getHolesString = function () {
            return GridBoardBase.convertHolesToString(holes);
        };
    }
    GridBoardBase.convertHolesToString = function (holes) {
        var str = "";
        for (var id = 0; id < holes.length; ++id) {
            var h = holes[id];
            str += h === true ? "P" : h === false ? "O" : "_";
        }
        return str;
    };
    GridBoardBase.convertStringToHoles = function (str) {
        var holes = [];
        for (var i = 0; i < str.length; ++i) {
            var c = str.charAt(i);
            holes.push(c == "P" ? true : c == "O" ? false : undefined);
        }
        return holes;
    };


    mypkg.RectangularBoard = RectangularBoard;
    function RectangularBoard(w, h, holes) {
        // ex) w=6, h=3
        // 0  1  2  3  4  5
        // 6  7  8  9  10 11
        // 12 13 14 15 16 17
        if (!holes) { holes = new Array(w * h); }
        GridBoardBase.call(this, holes);

        // Board Interface

        this.xy = function (x, y) {
            if (x >= 0 && x < w && y >= 0 && y < h) {
                return x + y * w;
            }
            else {
                return INVALID_HOLE_ID;
            }
        };
        this.getAdjacent = function (holeId, dir) {
            if (this.hasValidHole(holeId)) {
                switch (dir) {
                    case 0: return toX(holeId) + 1 < w ? holeId + 1 : INVALID_HOLE_ID;
                    case 1: return toY(holeId) + 1 < h ? holeId + w : INVALID_HOLE_ID;
                    case 2: return toX(holeId) > 0 ? holeId - 1 : INVALID_HOLE_ID;
                    case 3: return toY(holeId) > 0 ? holeId - w : INVALID_HOLE_ID;
                }
            }
            return INVALID_HOLE_ID;
        };
        this.getDirCount = function () { return 4; };
        this.getHoleLayoutPositionX = function (holeId) { return toX(holeId); };
        this.getHoleLayoutPositionY = function (holeId) { return toY(holeId); };
        this.getLayoutSizeX = function () { return w - 1; };
        this.getLayoutSizeY = function () { return h - 1; };
        this.getWidth = function () { return w; };
        this.getHeight = function () { return h; };
        this.getSize = function () { return Math.max(w, h); };
        this.getType = function () { return RectangularBoard.TYPEID; };
        this.toString = function () {
            return this.getType() + " " + w + " " + h + " " + this.getHolesString();
        };
        this.copyFrom = function (from, left, top) {
            for (var y = 0; y < h; ++y) {
                for (var x = 0; x < w; ++x) {
                    this.setHoleState(this.xy(x, y), from.getHoleState(from.xy(left + x, top + y)));
                }
            }
        };

        // Rectangular Only

        this.fillRect = function (rectX, rectY, rectW, rectH, state) {
            if (rectW <= 0 || rectH <= 0) {
                return this;
            }
            var holeId = rectX + rectY * w;
            for (var yc = rectH; yc > 0; --yc) {
                for (var xc = rectW; xc > 0; --xc) {
                    holes[holeId] = state;
                    ++holeId;
                }
                holeId += w - rectW;
            }
            return this;
        };

        function toX(holeId) { return holeId % w; }
        function toY(holeId) { return Math.floor(holeId / w); }
    }
    RectangularBoard.TYPEID = "R";

    mypkg.HexGridBoard = HexGridBoard;
    function HexGridBoard(w, h, holes) {
        RectangularBoard.call(this, w, h, holes);

        // Board Interface
        this.getAdjacent = function (holeId, dir) {
            if (this.hasValidHole(holeId)) {
                var x = toX(holeId);
                var y = toY(holeId);
                switch (dir) {
                    case 0: return fromXY(x + 1, y);
                    case 1: return (y & 1) == 0 ? fromXY(x, y + 1) : fromXY(x + 1, y + 1);
                    case 2: return (y & 1) == 0 ? fromXY(x - 1, y + 1) : fromXY(x, y + 1);
                    case 3: return fromXY(x - 1, y);
                    case 4: return (y & 1) == 0 ? fromXY(x - 1, y - 1) : fromXY(x, y - 1);
                    case 5: return (y & 1) == 0 ? fromXY(x, y - 1) : fromXY(x + 1, y - 1);
                }
            }
            return INVALID_HOLE_ID;
        };
        this.getDirCount = function () {
            return 6;
        };
        this.getHoleLayoutPositionX = function (holeId) {
            return toX(holeId) + (toY(holeId) & 1) * 0.5;
        };
        this.getHoleLayoutPositionY = function (holeId) {
            return toY(holeId);
        };
        this.getLayoutSizeX = function () {
            return (w - 1) + (h > 1 ? 0.5 : 0);
        };
        this.getLayoutSizeY = function () {
            return h - 1;
        };
        this.getType = function () { return HexGridBoard.TYPEID; };
        this.toString = function () {
            return this.getType() + " " + w + " " + h + " " + this.getHolesString();
        };

        //

        function fromXY(x, y) {
            return (x >= 0 && y >= 0 && x < w && y < h) ? x + y * w : INVALID_HOLE_ID;
        }
        function toX(holeId) { return holeId % w; }
        function toY(holeId) { return Math.floor(holeId / w); }
    }
    HexGridBoard.TYPEID = "H";



    function parseBoard(str) {
        function createBoardWidthHeight(ctor, lines) {
            var w = parseInt(lines[1], 10);
            var h = parseInt(lines[2], 10);
            var holesStr = lines[3];
            if (!(w >= 0 && w < MAX_BOARD_SIZE) || !(h >= 0 && h < MAX_BOARD_SIZE) || holesStr.length != w * h) {
                return null;
            }
            var holes = GridBoardBase.convertStringToHoles(holesStr);
            return new ctor(w, h, holes);
        }
        function createBoardTriangle(ctor, lines) {
            var size = parseInt(lines[1], 10);
            var holesStr = lines[2];
            if (!(size >= 0 && size < MAX_BOARD_SIZE) || holesStr.length != (size * (size + 1)) / 2) {
                return null;
            }
            var holes = GridBoardBase.convertStringToHoles(holesStr);
            return new ctor(size, holes);
        }
        var lines = str.split(/\s+/);
        var ctor;
        var args = [];
        switch (lines[0]) {
            case RectangularBoard.TYPEID:
                return createBoardWidthHeight(RectangularBoard, lines);
            case HexGridBoard.TYPEID:
                return createBoardWidthHeight(HexGridBoard, lines);
            case TriangularBoard.TYPEID:
                return createBoardTriangle(TriangularBoard, lines);
            default:
                return null;
        }
    }

    // ??????
    mypkg.createHexagonal5Board = createHexagonal5Board;
    function createHexagonal5Board() {
        var board = new HexGridBoard(9, 9);
        board.fillRect(2, 0, 5, 1, true);
        board.fillRect(1, 1, 6, 1, true);
        board.fillRect(1, 2, 7, 1, true);
        board.fillRect(0, 3, 8, 1, true);
        board.fillRect(0, 4, 9, 1, true);
        board.fillRect(0, 5, 8, 1, true);
        board.fillRect(1, 6, 7, 1, true);
        board.fillRect(1, 7, 6, 1, true);
        board.fillRect(2, 8, 5, 1, true);
        board.pullPeg(board.xy(4, 4));
        return board;
    }
    // ??????

    // ????????????
    mypkg.History = History;
    function History() {
        var moves = [];
        var movestr = '';
        var movehtml = document.createElement('div');
        window.onload = function () {
            document.getElementById('vh').appendChild(movehtml)
        }
        this.add = function (from, to) {
            movesarr.push(from, to);
            moves.push({ from: from, to: to });
            movestr = movesarr.join(',');
            movehtml.innerHTML = `${movestr}`;
        };
        this.undo = function (board) {
            if (moves.length > 0) {
                var lastMove = moves.pop();
                movesarr.pop();
                board.undoMovePeg(lastMove.from, lastMove.to);
                document.querySelector(`#vh>div:last-child`).remove();
            }
        };
        this.getMoveCount = function () { return moves.length; };
        this.clear = function () {
            moves.splice(0, moves.length);
        };
    }
    // ????????????

    function ImportData(dts) {
        var x = [], y = [];
        for (i = 0; i < dts.split(',').length; i += 2) {
            x.push(dts.split(',')[i]);
            y.push(dts.split(',')[i + 1])
        }
        console.log(x, y);
    }

    function drawBoardToCanvas(canvas, ctx, board, opt, draggingPeg, drawInvalidHoles) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        var left = opt.paddingLeft;
        var top = opt.paddingTop;
        var holeSpanX = opt.holeSpanX;
        var holeSpanY = opt.holeSpanY;
        var holeRadius = opt.holeRadius;
        var pegRadius = opt.pegRadius;
        if (drawInvalidHoles) {
            board.eachHole(function (holeId) {
                if (!board.hasValidHole(holeId)) {
                    var holeX = left + board.getHoleLayoutPositionX(holeId) * holeSpanX;
                    var holeY = top + board.getHoleLayoutPositionY(holeId) * holeSpanY;
                    ctx.beginPath();
                    ctx.moveTo(holeX - pegRadius, holeY);
                    ctx.lineTo(holeX + pegRadius, holeY);
                    ctx.moveTo(holeX, holeY - pegRadius);
                    ctx.lineTo(holeX, holeY + pegRadius);
                    ctx.strokeStyle = "black";
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }, true);
        }

        // ???
        board.eachHole(function (holeId) {
            var holeX = left + board.getHoleLayoutPositionX(holeId) * holeSpanX;
            var holeY = top + board.getHoleLayoutPositionY(holeId) * holeSpanY;
            ctx.beginPath();
            ctx.arc(holeX, holeY, holeRadius, 0, Math.PI * 2, false);
            ctx.font = "5px";
            ctx.textAlign = 'center'
            ctx.fillStyle = "black";
            if (draggingPeg && holeId == draggingPeg.getDstHoleId() && board.canMoveFromTo(draggingPeg.getHoleId(), holeId)) {
                ctx.strokeStyle = "red";
                ctx.lineWidth = 3;
                ctx.fillText(holeId, holeX, holeY + 2.5);
                // ?????????
            }
            else {
                ctx.strokeStyle = "black";
                ctx.lineWidth = 1;
                ctx.fillText(holeId, holeX, holeY + 2.5);
                // ????????????
            }
            ctx.stroke();
        });

        // Peg
        board.eachHole(function (holeId) {
            if (board.hasPeg(holeId)) {
                var pegX = left + board.getHoleLayoutPositionX(holeId) * holeSpanX;
                var pegY = top + board.getHoleLayoutPositionY(holeId) * holeSpanY;
                if (draggingPeg && holeId == draggingPeg.getHoleId()) {
                    pegX += draggingPeg.getDeltaX();
                    pegY += draggingPeg.getDeltaY();
                }
                ctx.beginPath();
                ctx.arc(pegX, pegY, pegRadius, 0, Math.PI * 2, false);
                ctx.fillStyle = "black";
                ctx.fill();
                ctx.beginPath();
                ctx.fillStyle = "white"
                ctx.fillText(holeId, pegX, pegY + 2.5);
                ctx.fill();
            }
        });
    }
    mypkg.createCanvasView = createCanvasView;
    function createCanvasView(board) {
        var history = new History();
        var HOLE_SPAN = 48;
        var opt = {
            paddingLeft: HOLE_SPAN * 0.5,
            paddingTop: HOLE_SPAN * 0.5,
            paddingRight: HOLE_SPAN * 0.5,
            paddingBottom: HOLE_SPAN * 0.5,
            holeSpanX: HOLE_SPAN,
            holeSpanY: HOLE_SPAN,
            holeRadius: HOLE_SPAN * 0.375,
            pegRadius: HOLE_SPAN * 0.3125
        };

        var canvas = document.createElement("canvas");
        canvas.setAttribute("width", opt.paddingLeft + board.getLayoutSizeX() * opt.holeSpanX + opt.paddingRight);
        canvas.setAttribute("height", opt.paddingTop + board.getLayoutSizeY() * opt.holeSpanY + opt.paddingBottom);

        function update() {
            drawBoardToCanvas(
                canvas,
                canvas.getContext("2d"),
                board,
                opt,
                draggingPeg
            )
        }

        //
        // Board
        //

        function move(fromId, toId) {
            if (board.movePeg(fromId, toId)) {
                history.add(fromId, toId);
                update();
                fireBoardMovedEvent();
            }
        }
        function undo() {
            history.undo(board);
            update();
        }
        function fireBoardMovedEvent() {
            var ev = document.createEvent("HTMLEvents");
            ev.initEvent("boardmoved", true, false);
            canvas.dispatchEvent(ev);
        }

        //
        // Input
        //

        var draggingPeg = null;
        function DraggingPeg(holeId, initialMousePos) {
            var deltaPos = { x: 0, y: 0 };
            var dstHoleId = INVALID_HOLE_ID;

            this.getHoleId = function () { return holeId; };
            this.setMousePosition = function (pos, dstId) { deltaPos.x = pos.x - initialMousePos.x; deltaPos.y = pos.y - initialMousePos.y; dstHoleId = dstId; };
            this.getDeltaX = function () { return deltaPos.x; };
            this.getDeltaY = function () { return deltaPos.y; };
            this.getDstHoleId = function () { return dstHoleId; };

        }
        function mousePosToHoleId(xy, includingInvalidHoles) {
            return board.findHoleAtPosition(
                (xy.x - opt.paddingLeft) / opt.holeSpanX,
                (xy.y - opt.paddingTop) / opt.holeSpanY,
                undefined,
                includingInvalidHoles);
        }
        function PlayingMode() {
            this.leaveMode = function () { this.onMouseLeave(); };
            this.onMouseDown = function (ev) {
                var pos = getMouseEventPositionOnElement(canvas, ev);
                var holeId = mousePosToHoleId(pos);
                if (board.hasPeg(holeId)) { draggingPeg = new DraggingPeg(holeId, pos); update(); }
            };
            this.onMouseMove = function (ev) {
                if (draggingPeg) {
                    var pos = getMouseEventPositionOnElement(canvas, ev);
                    var holeId = mousePosToHoleId(pos);
                    draggingPeg.setMousePosition(pos, holeId);
                    update();
                }
            };
            this.onMouseUp = function (ev) {
                if (draggingPeg) {
                    var dstHoleId = draggingPeg.getDstHoleId();
                    if (board.hasEmptyHole(dstHoleId)) { move(draggingPeg.getHoleId(), dstHoleId); }
                    draggingPeg = null;
                    update();
                }
            };
            this.onMouseLeave = function (ev) {
                if (draggingPeg) { draggingPeg = null; update(); }
            };
        }
        var MODE_PLAY = "?????????";
        var modeObj = new PlayingMode();
        var modeName = MODE_PLAY;
        function setMode(modeStr) {
            var modeCtor =
                modeStr == MODE_PLAY ? PlayingMode : null;
            if (!modeCtor) { return; }
            modeObj.leaveMode();
            modeObj = new modeCtor();
            modeName = modeStr;
            update();
        }
        function getMode() { return modeName; }
        function onMouseDown(ev) { modeObj.onMouseDown(ev); }
        function onMouseMove(ev) { modeObj.onMouseMove(ev); }
        function onMouseUp(ev) { modeObj.onMouseUp(ev); }
        function onMouseLeave(ev) { modeObj.onMouseLeave(ev); }
        function onTouchStart(ev) { onMouseDown(ev.touches[0]); ev.preventDefault(); }
        function onTouchMove(ev) { onMouseMove(ev.touches[0]); ev.preventDefault(); }
        function onTouchEnd(ev) { onMouseUp(); ev.preventDefault(); }
        canvas.addEventListener("mousedown", onMouseDown, false);
        canvas.addEventListener("mousemove", onMouseMove, false);
        canvas.addEventListener("mouseup", onMouseUp, false);
        canvas.addEventListener("mouseleave", onMouseLeave, false);
        canvas.addEventListener("touchstart", onTouchStart, false);
        canvas.addEventListener("touchmove", onTouchMove, false);
        canvas.addEventListener("touchend", onTouchEnd, false);

        // Public Interface

        canvas.pegsolitaire = {
            update: update,
            undo: undo,
            history: history,
            board: board,
            setMode: setMode,
            getMode: getMode,
            MODE_PLAY: MODE_PLAY
        };

        update();
        return canvas;
    }

    mypkg.getBoardCatalog = getBoardCatalog;
    function getBoardCatalog() {
        return [
            { id: "?????????", ctor: createHexagonal5Board, title: "Hexagonal5(61 holes)" }
        ];
    };

    mypkg.createGameBox = createGameBox;
    function createGameBox(opt) {
        if (!opt) {
            opt = {};
        }
        var catalog = opt.catalog || getBoardCatalog();
        if (opt.boardText) {
            catalog.splice(0, 0, { id: "Default", ctor: function () { return parseBoard(opt.boardText); }, title: "Default" });
        }
        var gameDiv = newElem("div");
        gameDiv.id = "gc"
        var controlDiv = newElem("div", gameDiv);
        var boardCtors = {};
        var selectBoard = null;
        if (!opt.disableNewGame) {
            newButton(controlDiv, "??????", newGame);
        }
        if (!opt.disableUndo) {
            newButton(controlDiv, "??????", undo);
        }
        var ipt = document.createElement('input');
        ipt.id = 'impipt';
        controlDiv.appendChild(ipt);
        var importbtn = document.createElement('button');
        importbtn.addEventListener('click', () => {
            ImportData(document.getElementById('impipt').value)
        });
        importbtn.innerHTML = '??????'
        controlDiv.appendChild(importbtn);

        // status

        var statusDiv = newElem("div", gameDiv);
        var spanMoves = newElem("span", statusDiv);
        spanMoves.id = 'moves'
        statusDiv.appendChild(document.createTextNode(" "));
        var spanGameState = newElem("span", statusDiv);
        function updateStatus() {
            if (currentCanvas) {
                spanMoves.innerHTML = "????????????:" + currentCanvas.pegsolitaire.history.getMoveCount();
            }
        }

        // canvas

        var currentCanvas = null;
        function newBoard(board) {
            if (board) {
                var newCanvas = createCanvasView(board);
                (currentCanvas) ? (currentCanvas.parentNode.insertBefore(newCanvas, currentCanvas), currentCanvas.parentNode.removeChild(currentCanvas)) : (gameDiv.appendChild(newCanvas))
                currentCanvas = newCanvas;
                currentCanvas.addEventListener("boardmoved", onBoardMoved, false);
                updateStatus();
            }
        }
        function newGame() {
            var creator =
                selectBoard ? boardCtors[selectBoard.value] :
                    catalog.length > 0 ? catalog[0].ctor :
                        null;
            if (document.querySelector('#vh') !== null) document.getElementById('vh').innerHTML = '';
            movesarr = [];
            if (creator) {
                newBoard(creator());
            }
        }
        function undo() {
            if (currentCanvas) {
                currentCanvas.pegsolitaire.undo();
                updateStatus();
            }
        }
        function onBoardMoved(ev) { updateStatus(); }
        newGame();
        return gameDiv;
    }

    mypkg.insertGameBoxBeforeCurrentScript = insertGameBoxBeforeCurrentScript;
    function insertGameBoxBeforeCurrentScript(opt) {
        var script = getLastScriptNode();
        var gameBox = createGameBox(opt);
        script.parentNode.insertBefore(gameBox, script);
        return gameBox;
    }
    //
    // HTML Utility
    //
    mypkg.getLastScriptNode = getLastScriptNode;
    function getLastScriptNode() {
        var n = document;
        while (n && n.nodeName.toLowerCase() != "script") { n = n.lastChild; }
        return n;
    }
    function getMouseEventPositionOnElement(elem, ev) {
        var rect = elem.getBoundingClientRect();
        return { x: ev.clientX - rect.left, y: ev.clientY - rect.top };
    }
    function newElem(tagName, parentNode) {
        var elem = document.createElement(tagName);
        if (parentNode) {
            parentNode.appendChild(elem);
        }
        return elem;
    }
    function newButton(parentNode, value, onClick) {
        var button = newElem("input", parentNode);
        button.setAttribute("type", "button");
        button.setAttribute("value", value);
        button.addEventListener("click", onClick, false);
        return button;
    }
})(this);
