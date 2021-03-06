var VSHADER_SOURCE =
	'attribute vec4 a_Position;\n' +
	'attribute vec4 a_Color;\n' +
	'attribute vec4 a_Normal;\n' +  //vector phap tuyen n
	'uniform mat4 u_MvpMatrix;\n' +  //Ortho + LookAt + (Translate, Rotate, Scale)
	'uniform mat4 u_NormalMatrix;\n' + 
	'uniform vec3 u_LightDirection;\n' + //hướng sáng
	'varying vec4 v_Color;\n' +
	'attribute vec2 a_TexCoord;\n' +
	'varying vec2 v_TexCoord;\n' +
	'uniform vec3 u_DiffuseLight;\n' +   // Màu ánh sáng khuếch tán
	'uniform vec3 u_AmbientLight;\n' +   // Màu ánh sáng xung quanh
	'void main() {\n' +
	'  gl_Position = u_MvpMatrix * a_Position;\n' +
		// Tính toán lại bình thường dựa trên ma trận mô hình và tạo độ dài 1
	'  vec3 normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
		// Tính tích chấm của hướng sáng và hướng của một bề mặt (bình thường)
	'  float nDotL = max(dot(u_LightDirection, normal), 0.0);\n' +
		// Tính màu do phản xạ khuếch tán
	'  vec3 diffuse = u_DiffuseLight * a_Color.rgb * nDotL;\n' +
		// Tính màu do phản xạ xung quanh
	'  vec3 ambient = u_AmbientLight * a_Color.rgb;\n' +
		// Thêm màu sắc bề mặt do phản xạ khuếch tán và phản xạ xung quanh
	'  v_Color = vec4(diffuse + ambient, a_Color.a);\n' +
	'  v_TexCoord = a_TexCoord;\n' +
	'}\n';

// Fragment shader program
var FSHADER_SOURCE =
	'#ifdef GL_ES\n' +
	'precision mediump float;\n' +
	'#endif\n' +
	'varying vec4 v_Color;\n' +
	'uniform sampler2D u_Sampler;\n' +
	'varying vec2 v_TexCoord;\n' +
	'void main() {\n' +
	'  gl_FragColor = v_Color * texture2D(u_Sampler, v_TexCoord);\n' +
	'}\n';


var canvas = document.getElementById('webgl');

var anh = true;
var xoay, goc = 0, pc = 0;
var currentAngleRight = 0.0; // góc xoay theo oy
var currentAngleUp = 0.0;	// góc xoay theo ox

var speed = document.getElementById("speed");

var lightX = document.getElementById("lightX");
var lightY = document.getElementById("lightY");
var lightZ = document.getElementById("lightZ");

var red = document.getElementById("red");
var green = document.getElementById("green");
var blue = document.getElementById("blue");

function main() {
	// Get the rendering context for WebGL
	var gl = getWebGLContext(canvas);
	if (!gl) {
		console.log('Failed to get the rendering context for WebGL');
		return;
	}

	// Initialize shaders
	if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
		console.log('Failed to intialize shaders.');
		return;
	}

	var n = initVertexBuffers(gl);
	if (n < 0) {
		console.log('Failed to set the vertex information');
		return;
	}

	// Set the clear color and enable the depth test
	gl.clearColor(0, 0, 0, 1);
	gl.enable(gl.DEPTH_TEST);

	// Get the storage locations of uniform variables and so on
	var u_AmbientLight = gl.getUniformLocation(gl.program, 'u_AmbientLight');
	var u_DiffuseLight = gl.getUniformLocation(gl.program, 'u_DiffuseLight');
	var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
	var u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
	var u_LightDirection = gl.getUniformLocation(gl.program, 'u_LightDirection'); //
	if (!u_MvpMatrix || !u_NormalMatrix || !u_LightDirection) {
		console.log('Failed to get the storage location');
		return;
	}

	gl.uniform3f(u_DiffuseLight, red.value, green.value, blue.value);
	gl.uniform3f(u_AmbientLight, 0.2, 0.2, 0.2);

	var vpMatrix = new Matrix4(); // View projection matrix
	// Calculate the view projection matrix
	// vpMatrix.setPerspective(30, canvas.width / canvas.height, 1, 100);
	if (goc == 0) {
		vpMatrix.lookAt(3, 3, 7, 0, 0, 0, 0, 1, 0);
	} else {
		vpMatrix.lookAt(0, 1, 0, 0, 0, 0, 0, 0, 1);
	}
	// Set the light direction (in the world coordinate)
	var lightDirection = new Vector3([lightX.value, lightY.value, lightZ.value]);
	lightDirection.normalize(); // Normalize //chuyển thành vecter đơn vị.
	gl.uniform3fv(u_LightDirection, lightDirection.elements);

	var modelMatrix = new Matrix4(); // Model matrix 
	var mvpMatrix = new Matrix4(); // Model view projection matrix
	var normalMatrix = new Matrix4(); // Transformation matrix for normals
  	var projMatrix = new Matrix4();

	// Xoay
	if (xoay == true) {
		modelMatrix.setRotate(currentAngleRight, 0, 1, 0);
	}
	else {
		modelMatrix.setRotate(currentAngleUp, 1, 0, 0);
	}

	//Chiếu phối cảnh
	if (pc == 0) {
		projMatrix.setOrtho(-5.0, 5.0, -5.0, 5.0, -10, 10);
  	} else if (pc == 1) {
    	projMatrix.setOrtho(-10.0, 10.0, -10.0, 10.0, -10, 10);
	} else {
		projMatrix.setOrtho(-2.0, 2.0, -2.0, 2.0, -10, 10);
  	}

	mvpMatrix.set(projMatrix).multiply(vpMatrix).multiply(modelMatrix); //tính mvpMatrix.
	gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);

	// Pass the matrix to transform the normal based on the model matrix to u_NormalMatrix
	normalMatrix.setInverseOf(modelMatrix);
	normalMatrix.transpose();
	gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

	// Clear color and depth buffer
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	// Draw the cube
	gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);

	if (!initTextures(gl, n, dir)) {
		console.log('Failed to intialize the texture.');
		return;
	} 

	anh = false;
	if (anh == false) {
	var path = document.getElementById("img").value;
	var filename = path.replace(/^.*\\/, "");
	var dir = '../resources/' + filename;
	if (!initTextures(gl, n, dir)) {
		console.log('Failed to intialize the texture.');
		return;
	  } 
	}
}

//3 ham nguon chieu sang
lightX.oninput = function() {main();} //oninput thanh kéo

lightY.oninput = function() {main();}

lightZ.oninput = function() {main();}

//3 hàm đổi màu vật
red.oninput = function() {main();}

green.oninput = function() {main();}

blue.oninput = function() {main();}


//ham xoay theo truc oy
function right() {
	ANGLE_STEP = speed.value;
	document.getElementById("btnRight").disabled = true;
	document.getElementById("btnUp").disabled = false;
	xoay = true;
	main();
	currentAngleRight = animate(currentAngleRight);
	requestAnimationFrame(right, canvas);
}

//ham xoay theo truc ox
function up() {
	ANGLE_STEP = speed.value;
	document.getElementById("btnUp").disabled = true;
	document.getElementById("btnRight").disabled = false;
	xoay = false;
	main();
	currentAngleUp = animate(currentAngleUp);
	requestAnimationFrame(up, canvas);
}

//cac ham ve radio button
function nhinNghieng() {goc = 0;main();}

function nhinDuoi() {goc = 1; main();}

function nhinGan() {pc = 2;main();}

function nhinXa() {pc = 1;main();}


function initVertexBuffers(gl) {
  // Create a cube
  //    v6----- v5
  //   /|      /|
  //  v1------v0|
  //  | |     | |
  //  | |v7---|-|v4
  //  |/      |/
  //  v2------v3
  // Coordinates
  var vertices = new Float32Array([
     1.0, 1.0, 1.0,  -1.0, 1.0, 1.0,  -1.0,-1.0, 1.0,   1.0,-1.0, 1.0, // v0-v1-v2-v3 front
     1.0, 1.0, 1.0,   1.0,-1.0, 1.0,   1.0,-1.0,-1.0,   1.0, 1.0,-1.0, // v0-v3-v4-v5 right
     1.0, 1.0, 1.0,   1.0, 1.0,-1.0,  -1.0, 1.0,-1.0,  -1.0, 1.0, 1.0, // v0-v5-v6-v1 up
    -1.0, 1.0, 1.0,  -1.0, 1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0,-1.0, 1.0, // v1-v6-v7-v2 left
    -1.0,-1.0,-1.0,   1.0,-1.0,-1.0,   1.0,-1.0, 1.0,  -1.0,-1.0, 1.0, // v7-v4-v3-v2 down
     1.0,-1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0, 1.0,-1.0,   1.0, 1.0,-1.0  // v4-v7-v6-v5 back
  ]);

  // Colors
  var colors = new Float32Array([
	1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1,     // v0-v1-v2-v3 front
    1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1,     // v0-v3-v4-v5 right
    1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1,    // v0-v5-v6-v1 up
    1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1,    // v1-v6-v7-v2 left
    1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1,     // v7-v4-v3-v2 down
    1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1,　    // v4-v7-v6-v5 back
 ]);

  // Normal
  var normals = new Float32Array([
    0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
    1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,  // v0-v3-v4-v5 right
    0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,  // v0-v5-v6-v1 up
   -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
    0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,  // v7-v4-v3-v2 down
    0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0   // v4-v7-v6-v5 back
  ]);

  // Indices of the vertices
  var indices = new Uint8Array([
     0, 1, 2,   0, 2, 3,    // front
     4, 5, 6,   4, 6, 7,    // right
     8, 9,10,   8,10,11,    // up
    12,13,14,  12,14,15,    // left
    16,17,18,  16,18,19,    // down
    20,21,22,  20,22,23     // back
 ]);

 var verticesTexCoords = new Float32Array([
    // Vertex coordinates, texture coordinate
	 1.0,  1.0,   1.0,  1.0, // mat trc
	 0.0,  1.0,   0.0,  1.0,
	 0.0,  0.0,   0.0,  0.0,
	 1.0,  0.0,   1.0,  0.0,
	 
	 1.0,  1.0,   0.0,  1.0,  // ben phai
	 0.0,  1.0,   0.0,  0.0,
	 0.0,  0.0,   1.0,  0.0,
	 1.0,  0.0,   1.0,  1.0,

	 1.0,  1.0,   0.0,  1.0,  // ben tren
	 0.0,  1.0,   0.0,  0.0,
	 0.0,  0.0,   1.0,  0.0,
	 1.0,  0.0,   1.0,  1.0,

	 1.0,  1.0,   1.0,  1.0,  //dang sau
	 0.0,  1.0,   0.0,  1.0,
	 0.0,  0.0,   0.0,  0.0,
	 1.0,  0.0,   1.0,  0.0,

	 0.0,  1.0,   0.0,  0.0,  //ben duoi
	 0.0,  0.0,   1.0,  0.0,
	 1.0,  0.0,   1.0,  1.0,
	 1.0,  1.0,   0.0,  1.0,

	 0.0,  1.0,   -1.0,  -1.0,  //ben trai
	 0.0,  0.0,   0.0,   -1.0,
	 1.0,  0.0,   0.0,    0.0,
	 1.0,  1.0,   -1.0,   0.0,
  ]);


  var vertexTexCoordBuffer = gl.createBuffer();
  if (!vertexTexCoordBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  // Bind the buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexTexCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, verticesTexCoords, gl.STATIC_DRAW);

  var FSIZE = verticesTexCoords.BYTES_PER_ELEMENT;

  var a_TexCoord = gl.getAttribLocation(gl.program, 'a_TexCoord');
  if (a_TexCoord < 0) {
    console.log('Failed to get the storage location of a_TexCoord');
    return -1;
  }
  // Assign the buffer object to a_TexCoord variable
  gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, FSIZE * 4, FSIZE * 2);
  gl.enableVertexAttribArray(a_TexCoord);  // Enable the assignment of the buffer object


	// Write the vertex property to buffers (coordinates, colors and normals)
	if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
	if (!initArrayBuffer(gl, 'a_Color', colors, 3, gl.FLOAT)) return -1;
	if (!initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT)) return -1;

	// Unbind the buffer object
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	// Write the indices to the buffer object
	var indexBuffer = gl.createBuffer();
	if (!indexBuffer) {
		console.log('Failed to create the buffer object');
		return false;
	}
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

	return indices.length;
}

function initArrayBuffer(gl, attribute, data, num, type) {
	// Create a buffer object
	var buffer = gl.createBuffer(); //tạo ra một bộ đệm đối tượng.
	if (!buffer) {
		console.log('Failed to create the buffer object');
		return false;
	}
	// Write date into the buffer object
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer); // gắn bộ đệm vào 1 target
	gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW); //lưu dữ liệu.
	// Assign the buffer object to the attribute variable
	var a_attribute = gl.getAttribLocation(gl.program, attribute);
	if (a_attribute < 0) {
		console.log('Failed to get the storage location of ' + attribute);
		return false;
	}
	gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0); //gán giá trị cho biến thuộc tính.
	// Enable the assignment of the buffer object to the attribute variable
	gl.enableVertexAttribArray(a_attribute); //kích hoạt.

	return true;
}

function initTextures(gl, n, dir) {
	var texture = gl.createTexture();   // Create a texture object
	if (!texture) {
	  console.log('Failed to create the texture object');
	  return false;
	}
  
	// Get the storage location of u_Sampler
	var u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');
	if (!u_Sampler) {
	  console.log('Failed to get the storage location of u_Sampler');
	  return false;
	}
	var image = new Image();  // Create the image object
	if (!image) {
	  console.log('Failed to create the image object');
	  return false;
	}
	// Register the event handler to be called on loading an image
	image.onload = function(){ loadTexture(gl, n, texture, u_Sampler, image); };
	// Tell the browser to load an image
	if (anh == true) {
		image.src = "../resources/2.jpg";
	} else {
		image.src = dir;
	}
	return true;
  }

  function loadTexture(gl, n, texture, u_Sampler, image) {
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis
	// Enable texture unit0
	gl.activeTexture(gl.TEXTURE0);
	// Bind the texture object to the target
	gl.bindTexture(gl.TEXTURE_2D, texture);
  
	// Set the texture parameters
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	
	// Set the texture image
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
	
	// Set the texture unit 0 to the sampler
	gl.uniform1i(u_Sampler, 0);
	
	gl.clear(gl.COLOR_BUFFER_BIT);   // Clear <canvas>
  
	gl.drawElements(gl.TRIANGLE_STRIP, n, gl.UNSIGNED_BYTE, 0); // Draw the rectangle
  }

// Rotation angle (degrees/second)
var ANGLE_STEP = 0.0;
// Last time that this function was called
var g_last = Date.now();

function animate(angle) {
	// Calculate the elapsed time
	var now = Date.now();
	var elapsed = now - g_last;
	g_last = now;
	// Update the current rotation angle (adjusted by the elapsed time)
	var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
	return newAngle %= 360;
}