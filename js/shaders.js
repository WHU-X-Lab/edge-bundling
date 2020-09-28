/**
 * @author: prozac <516060659@qq.com>
 * @createTime: 2018-7-3
 * @copyRight: UNDEFINED
 */

/*------------------------------------------------------------------------------------*/
var V_pt_shader = `
    attribute vec4 a_pos;
    attribute float a_ptSize;
    void main(){
        gl_Position = a_pos;
        gl_PointSize = a_ptSize;
    }
`;
var F_pt_shader = `
    void main(){
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    }
`;
/*------------------------------------------------------------------------------------*/
var V_spline_shader = `
    precision mediump float;
    attribute float a_index;
    attribute vec4 a_pos;

    uniform float u_lineWidth;
    uniform float u_colorLvlMax;

    varying float v_colorIndex;
    void main(){
        gl_Position = a_pos;
        gl_PointSize = u_lineWidth;
        v_colorIndex = a_index;
    }
`;
var F_spline_shader = `
    precision mediump float;

    varying float v_colorIndex;
    void main(){
        float colorPer = v_colorIndex;
        float r = 1.0 - colorPer;
        float g = colorPer;
        gl_FragColor = vec4(r, g, 0.0, 1.0);
    }
`;
/*------------------------------------------------------------------------------------*/

var V_box_shader = `
    attribute vec4 a_pos;
    void main() {
        gl_Position = a_pos;
    }
`;

var F_box_shader = `
    precision mediump float;
    void main() {
        float grey_level = 0.3;
        gl_FragColor = vec4(grey_level, grey_level, grey_level, 1.0);
    }
`;
