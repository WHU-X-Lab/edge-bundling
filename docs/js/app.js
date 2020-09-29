/**
 * @author: prozac <516060659@qq.com>
 * @createTime: 2018-7-21
 * @copyRight: UNDEFINED
 */

(function(win) {
    /* Basic Node */
    var Node = function(id, parentIds, value) {
        this.id = id || "";
        this.parentIds = parentIds || [];
        this.value = value || 0;
        sizeIndex = parentIds.length;
        this.size = Math.pow(0.8, sizeIndex);
    };

    /* Data handler */
    var DataHandler = win.DataHandler = function() {
        this.layoutIsGenerated = false;
        this.nodes = [];
        this.paths = [];
        this.struct = {};
        this.id2NodeDict = {};
    };
    DataHandler.prototype = {
        addData: function(idStr, value) {
            value = value || 100;
            var nodeList = idStr.split(".");
            var currentStruct = this.struct;
            nodeList.map(nodeId => {
                var node = new Node(nodeId, nodeList.slice(0, nodeList.indexOf(nodeId)));
                node.value = nodeList.indexOf(nodeId) == nodeList.length - 1 ? value : 0;
                /* addTo nodes */
                if (!this.id2NodeDict.hasOwnProperty(nodeId)) this.nodes.push(node);
                /* addTo dict */
                this.id2NodeDict[nodeId] = node;
                /* addTo struct */
                if (nodeList.indexOf(nodeId) == nodeList.length - 1) {
                    currentStruct[nodeId] = node;
                } else if(!currentStruct.hasOwnProperty(nodeId)) {
                    currentStruct[nodeId] = {};
                }
                currentStruct = currentStruct[nodeId];
            });
        },
        getNodeById: function(id) {
            if (!this.layoutIsGenerated) console.log('layout has not been generated!');
            return this.nodes.filter(node => node.id == id)[0];
        },
        addPath: function(id1, id2) {
            this.paths.push([this.getNodeById(id1),
                             this.getNodeById(id2)]);
        },
        getAllNodes: function() {
            if (!this.layoutIsGenerated) console.log('layout has not been generated!');
            return this.nodes;
        },
        getAllPaths: function() {
            if (!this.layoutIsGenerated) console.log('layout has not been generated!');
            var paths = [];
            for(var i = 0; i < this.paths.length; i++) {
                var LCA = this.findLCA(this.paths[i][0].id, this.paths[i][1].id);
                var LCANodes = [];
                for(var j = 0; j < LCA.length; j++) {
                    LCANodes.push(this.getNodeById(LCA[j]));
                }
                paths.push(LCANodes);
            }
            return paths;
        },
        findLCA: function(id1, id2) {
            var node1 = this.getNodeById(id1);
            var node2 = this.getNodeById(id2);
            var path1 = node1.parentIds.merge([id1]).reverse();
            var path2 = node2.parentIds.merge([id2]);
            var LCA = [];
            path1.map(nodeId => {
                if (path2.indexOf(nodeId) !== -1 && LCA.length == 0) {
                    LCA = path1.slice(0, path1.indexOf(nodeId) + 1)
                               .merge(path2.slice(path2.indexOf(nodeId) + 1, path2.length)
                                           .remove(nodeId));
                }
            });
            return LCA;
        },
        exportLayoutData: function() {
            function transformData(root) {
                var container = [];
                if (!root.hasOwnProperty('value')){
                    for (var key in root) {
                        idList.push(key);
                        container.push(transformData(root[key]));

                    }
                    return container;
                }else {
                    return [root.value];
                }
            }
            var idList = [];
            return {
                data: transformData(this.struct),
                idList: idList
            };
        },
        generateLayout: function() {
            this.layoutIsGenerated = true;
            this.layout = new LayoutHandler(this.exportLayoutData());
            /* For each node add coord */
                this.nodes.map(node => {
                var coord = this.layout.getCoordById(node.id);
                node.x = coord[0];
                node.y = coord[1];
            });
        }
    };

    /* Drawer */
    var Drawer = win.Drawer = function() {
        /* GL */
        var gl = getGL(win, {preserveDrawingBuffer:true});

        /* Control all points */
        this.basePtSize = 20;

        /* Control the B-Spline */
        this.degree = 4;
        this.lineWidth = 1.5;
        this.numOfSpline = 2000;
        this.useEdgeBundling = true;

        /* Control the Knots */
        this.knots = [];
        this.pathNodeNum = 4;
        this.minKnotPer = 0;
        this.midKnotPer = 0.5;
        this.maxKnotPer = 1.0;

        /* Init Drawer */
        this.initPrograms();
    };
    Drawer.prototype = {
        initPrograms: function() {
            this.pt_program = createProgram(gl, V_pt_shader, F_pt_shader);
            this.spline_program = createProgram(gl, V_spline_shader, F_spline_shader);
            this.box_program = createProgram(gl, V_box_shader, F_box_shader);
        },
        draw: function(data) {
            data.points = data.points || [];
            data.splines = data.splines || [];
            data.boxs = data.boxs || [];

            this.drawBoxs(data.boxs);
            this.drawSplines(data.splines);
            this.drawPoints(data.points);
        },
        drawPoints: function(nodeList) {
            var basePtSize = this.basePtSize;
            var ptSizeList = nodeList.map(node => basePtSize * node.size);
            var coordList = [];
            nodeList.map(coord => {
                coordList.push(coord.x * 2 - 1);
                coordList.push(coord.y * 2 - 1);
            });
            var program = this.pt_program;
            gl.useProgram(program.program);
            var coordBuffer =  createBuffer(gl, new Float32Array(coordList));
            var ptSizeBuffer = createBuffer(gl, new Float32Array(ptSizeList));
            bindAttribute(gl, coordBuffer, program.a_pos, 2);
            bindAttribute(gl, ptSizeBuffer, program.a_ptSize, 1);
            gl.drawArrays(gl.POINTS, 0, ptSizeList.length);
        },
        drawSplines: function(paths) {
            var degree = this.degree;
            var numOfSpline = this.numOfSpline;

            for(var i = 0; i < paths.length; i++){
                var path = paths[i];
                var pathLen = path.length;
                var splinePoints = [];
                var splineCoords = [];
                var colorLevelList = [];
                path.map(node => {
                    splinePoints.push([node.x * 2 - 1,
                                       node.y * 2 - 1]);
                });

                var t, count = 0, point;
                if(this.useEdgeBundling){
                    var spline = new BSpline(splinePoints, degree)
                    for(t = 0; t < 1; t+= 1 / numOfSpline) {
                      point = spline.calcAt(t);
                      splineCoords.push(point[0]);
                      splineCoords.push(point[1]);
                      colorLevelList.push(count / this.numOfSpline);
                      count++;
                    }
                }else{
                    for(t = 0; t < 1; t+= 1 / numOfSpline) {
                      point = normalLine(t, [path[0].x, path[0].y], [path[path.length - 1].x, path[path.length - 1].y]);
                      splineCoords.push(point[0] * 2 - 1);
                      splineCoords.push(point[1] * 2 - 1);
                      colorLevelList.push(count / this.numOfSpline);
                      count++;
                    }
                }

                var program = this.spline_program;
                gl.useProgram(program.program);
                var splineCoordBuffer = createBuffer(gl, new Float32Array(splineCoords));
                var colorLevelBuffer = createBuffer(gl, new Float32Array(colorLevelList));
                bindAttribute(gl, splineCoordBuffer, program.a_pos, 2);
                bindAttribute(gl, colorLevelBuffer, program.a_index, 1);
                gl.uniform1f(program.u_lineWidth, this.lineWidth);
                gl.drawArrays(gl.POINTS, 0, numOfSpline);
            }

        },
        drawBoxs: function(boxs) {
            boxs.map(box => {
                var program = this.box_program;
                gl.useProgram(program.program);
                box = box.map(coord => (coord * 2 - 1));
                var boxCoords = [box[0], box[1], box[2], box[1], box[2], box[3], box[0], box[3]];
                var boxBuffer = createBuffer(gl, new Float32Array(boxCoords));
                bindAttribute(gl, boxBuffer, program.a_pos, 2);
                gl.drawArrays(gl.LINE_LOOP, 0, 4);
            })
        },
        generateKnots: function(ctrlPtNum, degree) {
            this.knots = [];
            var len = ctrlPtNum + degree + 1;
            var halfLen = Math.floor(len / 2);

            var minKnotNum = len * this.minKnotPer;
            var midKnotNum = Math.ceil(len * this.midKnotPer);
            var maxKnotNum = len * this.maxKnotPer;
            var i;
            if(ctrlPtNum == 3){
                this.knots = [0, 2, 2, 4, 4, 0];
                return this.knots;
            }
            if(isEven(len)){
                halfLen -= 1;
                for(i = 0; i < halfLen; i++){
                    this.knots.push(minKnotNum);
                }
                this.knots.push(midKnotNum);
                this.knots.push(midKnotNum);
                for(i = 0; i < halfLen; i++){
                    this.knots.push(maxKnotNum);
                }
            }else{
                for(i = 0; i < halfLen; i++){
                    this.knots.push(minKnotNum);
                }
                this.knots.push(midKnotNum);
                for(i = 0; i < halfLen; i++){
                    this.knots.push(maxKnotNum);
                }
            }

            return this.knots;
        }
    };

    /* LayoutHandler */
    var LayoutHandler = win.LayoutHandler = function(data) {
        this.idToCoord = {};
        this.boxs = [];
        this.createLayout(data);
    };
    LayoutHandler.prototype = {
        createLayout: function(data) {
            /* 输出当前节点下的box的范围 */
            function getBoxRange(currentBox) {
                var childBoxs = [];
                var minX = 10000, maxX = 0, minY = 10000, maxY = 0;
                getAllChildBox(childBoxs, currentBox);
                childBoxs.map(childBox => {
                    minX = childBox[0] < minX ? childBox[0] : minX;
                    minY = childBox[1] < minY ? childBox[1] : minY;
                    maxX = childBox[2] > maxX ? childBox[2] : maxX;
                    maxY = childBox[3] > maxY ? childBox[3] : maxY;
                });

                return [minX, minY, maxX, maxY];
            }
            /* 输出当前节点下的box的全部子集 */
            function getAllChildBox(container, currentBox) {
                if (typeof(currentBox[0]) !== "number") {
                    currentBox.map(childBox => {
                        getAllChildBox(container, childBox);
                    });
                } else {
                    container.push(currentBox);
                }
            }
            function traverse(container, currentBox) {
                if (typeof(currentBox[0]) !== "number") {
                    container.push(getBoxRange(currentBox));
                    currentBox.map(childBox => {
                        traverse(container, childBox);
                    });
                }
            }
            this.boxList = Treemap.generate(data.data, 1, 1);
            /* get All BoxRangeList */
            var boxRangeList = [];
            traverse(boxRangeList, this.boxList[0]);
            for (var i = 0; i < boxRangeList.length; i++) {
                var boxRange = boxRangeList[i];
                var id = data.idList[i];
                this.idToCoord[id] = this.getBoxCenter(boxRange);
                this.boxs.push(boxRange);
            }
        },
        getCoordById: function(id) {
            return this.idToCoord[id];
        },
        getAllBoxs: function() {
            return this.boxs;
        },
        getBoxCenter: function(coordList) {
            if (coordList.length !== 4) {
                console.log("Given box's format is not valid.");
                return;
            }
            return [(coordList[0] + coordList[2]) / 2,
                    (coordList[1] + coordList[3]) / 2];
        },
    };
})(window);
