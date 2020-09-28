/**
 * @author: prozac <516060659@qq.com>
 * @createTime: 2018-7-3
 * @copyRight: UNDEFINED
 */

 var dataHandler = new DataHandler();
 dataHandler.addData('1.2.3');
 dataHandler.addData('1.2.4');
 dataHandler.addData('1.2.5');
 dataHandler.addData('1.2.6');
 dataHandler.addData('1.2.7');
 dataHandler.addData('1.2.8');
 dataHandler.addData('1.2.9');
 dataHandler.addData('1.2.10');
 dataHandler.addData('1.2.11');
 dataHandler.addData('1.2.12');
 dataHandler.addData('1.2.13');
 dataHandler.addData('1.2.14');
 dataHandler.addData('1.2.15');
 dataHandler.addData('1.2.16');
 dataHandler.addData('1.2.17');
 dataHandler.addData('1.2.18');
 dataHandler.addData('1.19.20');
 dataHandler.addData('1.19.21');
 dataHandler.addData('1.19.22');
 dataHandler.addData('1.19.23');
 dataHandler.addData('1.19.24');
 dataHandler.addData('1.19.25');
 dataHandler.addData('1.19.26');
 dataHandler.addData('1.19.27');
 dataHandler.addData('1.19.28');
 dataHandler.addData('1.29.30');
 dataHandler.addData('1.29.31');
 dataHandler.addData('1.29.32');
 dataHandler.addData('1.29.33');
 dataHandler.addData('1.29.34');
 dataHandler.addData('1.29.35');
 dataHandler.addData('1.29.36');
 dataHandler.addData('1.29.37');
 dataHandler.addData('1.29.38');
 dataHandler.addData('1.39.40');
 dataHandler.addData('1.39.41');
 dataHandler.addData('1.39.42');
 dataHandler.addData('1.39.43');
 dataHandler.addData('1.39.44');
 dataHandler.addData('1.39.45');
 dataHandler.addData('1.46.47');
 dataHandler.addData('1.46.48');
 dataHandler.addData('1.46.49');
 dataHandler.addData('1.46.50');
 dataHandler.addData('1.46.51');
 dataHandler.addData('1.46.52');
 dataHandler.addData('1.46.53');
 dataHandler.addData('1.46.54');
 dataHandler.addData('1.46.55');
 dataHandler.addData('1.46.56');
 dataHandler.addData('1.46.57');
 dataHandler.addData('1.46.58');
 dataHandler.generateLayout();

 var nodes = dataHandler.nodes;
 for (var i = 0; i < nodes.length; i++) {
     for (var j = i; j < nodes.length; j++) {
         dataHandler.addPath(nodes[i].id, nodes[j].id);
     }
 }

 var drawer = new Drawer();
 drawer.draw({
     points: dataHandler.getAllNodes(),
     splines: dataHandler.getAllPaths(),
     boxs: dataHandler.layout.getAllBoxs()
 });

initGUI();

function initGUI(){
    var gui = new dat.GUI();
    redraw = function(){
        clearGL(gl);
        drawer.draw({
            points: dataHandler.getAllNodes(),
            splines: dataHandler.getAllPaths(),
            boxs: dataHandler.layout.getAllBoxs()
        });
    };
    var vFolder = gui.addFolder('视觉效果设置');
    vFolder.open();
    vFolder.add(drawer,'basePtSize', 0, 100).name('粒子大小').onChange(redraw);
    vFolder.add(drawer,'lineWidth', 0, 10).name('轨迹宽度').onChange(redraw);
    vFolder.add(drawer,'numOfSpline', 100, 5000).name('轨迹密度').onChange(redraw);

    var aFolder = gui.addFolder('算法参数');
    aFolder.add(drawer,'degree', 2, 5).step(1).name('度').onChange(redraw);
    aFolder.open();

    var dFolder = gui.addFolder('数据设置');
    dFolder.open();
    dFolder.add(drawer,'useEdgeBundling').name("启用边捆绑").onChange(redraw);

}
