/**
 * @author: prozac <516060659@qq.com>
 * @createTime: 2018-7-3
 * @copyRight: UNDEFINED
 */

/*------------------------------------------------------------------------------------*/
var QuadTreeNode = function(id){
    this.tag = "node";
    this._id = id;
    this._parentNode = null;
    this._childNodes = [];
};

QuadTreeNode.prototype.setChildNodes = function (nodeList) {
    var nodeLimitMin = 4;
    if(nodeList.length < nodeLimitMin){
        console.log("QuadTree needs " + String(nodeLimitMin) + " nodes!");
        return;
    }else{
        for(var i = 0; i < nodeList.length; i++){
            var node = nodeList[i];
            if(node.tag == "node"){
                this._childNodes.push(node);
                node.setParentNode(this);
            }
        }
    }
};
QuadTreeNode.prototype.getChildNodes = function () {
    return this._childNodes;
};
QuadTreeNode.prototype.setParentNode = function (pNode) {
    if(pNode.tag == "node"){
        this._parentNode = pNode;
    }else{
        console.log("The input parentNode is not a standard node!");
        return;
    }
};
QuadTreeNode.prototype.getParentNode = function () {
    return this._parentNode;
};
QuadTreeNode.prototype.getId = function () {
    return this._id;
};
QuadTreeNode.prototype.getDepth = function() {
    var depth = 1;
    var currentNode = this;
    while(true){
        if(currentNode._parentNode !== null){
            depth += 1;
            currentNode = currentNode._parentNode;
        }else{
            break;
        }
    }
    return depth;
};
QuadTreeNode.prototype.moveUp = function(step, inputPath) {
    var that = this;
    var path = inputPath || null;
    for(var i = 0; i < step; i++){
        if(that._parentNode !== null){
            that = that._parentNode;
            if(path !== null){
                path.push(that.getId() + 1);
            }
        }else{
            console.log('Node move up to a limit!');
        }
    }

    return that;
};

/*------------------------------------------------------------------------------------*/
var QuadTree = function (num) {
    this.nodes = [];
    this.nodeNum = num;
    this.rootNodeId = null;
    this.nodeDecPer = 0.8;
    this.fstNodeSize = 20;

    this.createNodes();
};
QuadTree.prototype.createNodes = function(){
    var num = this.nodeNum;
    for(var i = 0; i < num; i++){
        var node = new QuadTreeNode(i);
        this.nodes.push(node);
    }
};
QuadTree.prototype.createCoordBuffer = function() {
    var coordList = [0.0, 0.0];
    var id2coord = {};
    id2coord[this.rootNodeId] = [0.0, 0.0];
    var ptSizeList = [this.fstNodeSize];
    var nodeDecPer = this.nodeDecPer;
    var fstNodeSize = this.fstNodeSize;
    var currentNode = this.getNodeById(this.rootNodeId);
    var currentSideLen = 1.0;
    var currentCenterPos = [0.0, 0.0];
    var childNodes = [];
    var childNode, x, y;

    function getChildCoord(node, centerPos, sideLen){
        if(node.getChildNodes().length !== 0){
            for(var i = 0; i < 4; i++){
                childNodes = node.getChildNodes();
                childNode = childNodes[i];
                if(i == 0 || i == 3){
                    x = centerPos[0] - sideLen / 2;
                }else{
                    x = centerPos[0] + sideLen / 2;
                }

                if(i == 0 || i == 1){
                    y = centerPos[1] + sideLen / 2;
                }else{
                    y = centerPos[1] - sideLen / 2;
                }
                coordList.push(x);
                coordList.push(y);
                var nodeLevel = myLog(0.5, sideLen / 2);
                ptSizeList.push(fstNodeSize * Math.pow(nodeDecPer, nodeLevel));
                var id = childNode.getId() + 1;
                id2coord[id] = [x, y];
                getChildCoord(childNode, [x, y], sideLen / 2);
            }
        }else{
            return;
        }
    }
    getChildCoord(currentNode, currentCenterPos, currentSideLen);
    this.coordBuffer =  createBuffer(gl, new Float32Array(coordList));
    this.ptSizeBuffer = createBuffer(gl, new Float32Array(ptSizeList));
    return [this.coordBuffer, this.ptSizeBuffer, id2coord];
};
QuadTree.prototype.getNodeById = function (id){
    return this.nodes[id - 1];
};
QuadTree.prototype.setParentRel = function (pNodeId, cNodesId) {
    var pNode = this.getNodeById(pNodeId);
    var cNodes = [];
    for(var i = 0; i< cNodesId.length; i++){
        var id = cNodesId[i];
        var cNode = this.getNodeById(id);
        cNodes.push(cNode);
    }
    pNode.setChildNodes(cNodes);
};
QuadTree.prototype.getPath = function (n1Id, n2Id) {
    var n1 = this.getNodeById(n1Id);
    var n2 = this.getNodeById(n2Id);
    var len1 = n1.getDepth();
    var len2 = n2.getDepth();
    var dis = Math.abs(len1 - len2);
    var path1 = [n1.getId() + 1], path2 = [n2.getId() + 1];

    if(len1 > len2){
        n1 = n1.moveUp(dis, path1);
    }else{
        n2 = n2.moveUp(dis, path2);
    }

    if(n1.getId() !== n2.getId()){
        while(n1.getParentNode().getId() !== n2.getParentNode().getId()){
            n1 = n1.moveUp(1);
            n2 = n2.moveUp(1);
            path1.push(n1.getId() + 1);
            path2.push(n2.getId() + 1);
        }
        var LCA = n1.getParentNode().getId() + 1;
        path1.push(LCA);
    }else{
        path2.remove(n2.getId() + 1);
    }

    return path1.merge(path2.reverse());
};
QuadTree.prototype.findRootNode = function(){
    var rootNodeNum = 0;
    var rootNodeId = null;
    this.nodes.forEach(function(node){
        if(node.getParentNode() == null){
            rootNodeNum += 1;
            rootNodeId = node.getId() + 1;
        }
    });
    if(rootNodeNum == 1){
        this.rootNodeId = rootNodeId;
    }
};

/*------------------------------------------------------------------------------------*/
var App = function () {
    this.nodeNum = 21;
    this.degree = 3;
    this.oriDegree = 3;
    this.lineWidth = 1.5;
    this.numOfSpline = 500;

    // control the b-spline
    this.knots = [];
    this.pathNodeNum = 4;
    this.minKnotPer = 0;
    this.midKnotPer = 0.5;
    this.maxKnotPer = 1.0;

    this.useEdgeBundling = true;

    this.pathPairs = [];
    this.initQuadTree(this.nodeNum);
    this.initPrograms();
    this.draw();
};
App.prototype.loadData = function () {
    this.quadTree.setParentRel(5, [1, 2, 3, 4]);
    this.quadTree.setParentRel(10, [6, 7, 8, 9]);
    this.quadTree.setParentRel(15, [11, 12, 13, 14]);
    this.quadTree.setParentRel(20, [16, 17, 18, 19]);
    this.quadTree.setParentRel(21, [5, 10, 15, 20]);

    this.quadTree.findRootNode();
    this.quadTree.createCoordBuffer();
};
App.prototype.initQuadTree = function (nodeNum) {
    this.quadTree = new QuadTree(nodeNum);
    this.loadData();
};
App.prototype.initPrograms = function() {
    this.pt_program = createProgram(gl, V_pt_shader, F_pt_shader);
    this.spline_program = createProgram(gl, V_spline_shader, F_spline_shader);
};
App.prototype.draw = function() {
    this.drawPoints();
    this.drawSplines();
};
App.prototype.drawPoints = function() {
    var nodeNum = this.quadTree.nodeNum;
    var program = this.pt_program;
    gl.useProgram(program.program);
    var bufferList = this.quadTree.createCoordBuffer();
    var coordBuffer = bufferList[0];
    var ptSizeBuffer = bufferList[1];
    this.id2coord = bufferList[2];
    bindAttribute(gl, coordBuffer, program.a_pos, 2);
    bindAttribute(gl, ptSizeBuffer, program.a_ptSize, 1);
    gl.drawArrays(gl.POINTS, 0, nodeNum);
};
App.prototype.drawSplines = function() {
    for(var i = 0; i < this.nodeNum; i++){
        for(var j = i + 1; j < this.nodeNum; j++){
            this.pathPairs.push([i + 1, j + 1]);
        }
    }

    this.pathPairs.map(path => {
        this.drawSpline(path[0], path[1]);
    });
};
App.prototype.drawSpline = function(p1, p2) {
    var id2coord = this.id2coord;
    var pathId = this.quadTree.getPath(p1, p2);
    var pathLen = pathId.length;
    var degree = this.degree;
    if(pathLen < 3){
        return;
    }
    if(pathLen == 3){
        degree = 2;
    }
    var numOfSpline = this.numOfSpline;
    var splinePoints = [];
    var splineCoords = [];
    var colorLevelList = [];
    var knots = this.genKnots(pathId, degree);
    if(this.pathNodeNum > pathLen) this.pathNodeNum = pathId.length;
    pathId.forEach(function(pt){
        splinePoints.push(id2coord[pt]);
    });

    var t, count, point;
    if(this.useEdgeBundling){
        count = 0;
        for(t = 0; t < 1; t+= 1 / numOfSpline) {
          point = bspline(t, degree, splinePoints, knots);
          splineCoords.push(point[0]);
          splineCoords.push(point[1]);
          colorLevelList.push(count);
          count++;
        }
    }else{
        count = 0;
        for(t = 0; t < 1; t+= 1 / numOfSpline) {
          point = normalLine(t, id2coord[p1], id2coord[p2]);
          splineCoords.push(point[0]);
          splineCoords.push(point[1]);
          colorLevelList.push(count);
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
    gl.uniform1f(program.u_colorLvlMax, this.numOfSpline);
    gl.drawArrays(gl.POINTS, 0, numOfSpline);
};
App.prototype.genKnots = function(points, degree){
    this.knots = [];
    var len = points.length + degree + 1;
    var halfLen = Math.floor(len / 2);

    var minKnotNum = len * this.minKnotPer;
    var midKnotNum = Math.ceil(len * this.midKnotPer);
    var maxKnotNum = len * this.maxKnotPer;
    var i;
    if(points.length == 3){
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
};
