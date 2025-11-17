import fsPlanet from './planet';
import ImageList from './image_list';
import GeoJson from './data/countries.json';
import { earcut, flatten } from './earcut';


function toVec3(lat, lon) {
  lat = lat * Math.PI/180;
  lon = lon * Math.PI/180;
  return new THREE.Vector3(
    Math.cos(lat) * Math.cos(lon),
    Math.cos(lat) * Math.sin(lon),
    Math.sin(lat)
  );
}

function toLatLon(v) {
  const lat = Math.atan2(v.z, Math.sqrt(v.x*v.x + v.y*v.y)) * 180/Math.PI;
  const lon = Math.atan2(v.y, v.x) * 180/Math.PI;
  return { lat, lon };
}

function slerp(a, b, t) {
  const dot = a.dot(b);
  const theta = Math.acos(dot);
  const sinTheta = Math.sin(theta);

  const w1 = Math.sin((1 - t) * theta) / sinTheta;
  const w2 = Math.sin(t * theta) / sinTheta;

  return new THREE.Vector3(
    a.x * w1 + b.x * w2,
    a.y * w1 + b.y * w2,
    a.z * w1 + b.z * w2
  ).normalize();
}

function subdivideGreatCircle(lat1, lon1, lat2, lon2, segments = 10) {
  const a = toVec3(lat1, lon1);
  const b = toVec3(lat2, lon2);

  const points = [];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const v = slerp(a, b, t);
    points.push(toLatLon(v));
  }

  return points;
}

var gfx = {

    canvas : null,

    start : function(canvas) {
        this.canvas = canvas;
        this.gl = this.canvas.getContext("webgl2", { premultipliedAlpha: false });

        if (this.gl == null) {
            alert("Unable to initialise webgl");
            return;
        }

        // Enable alpha blending
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        this.gl.clearColor(0, 0, 0, 0); // Ensure transparent background

        // this.gl.enable(this.gl.CULL_FACE);
        // this.gl.cullFace(this.gl.BACK);

        this.gl.enable(this.gl.DEPTH_TEST);

        this.startTime = Date.now();

        this.imageProgram = this.createShaderProgram(vsSource, fsSource);
        this.backgroundProgram = this.createShaderProgram(vsBackgroundSource, fsSpace);
        this.imageColourProgram = this.createShaderProgram(vsSource, fsImageColourSource);
        this.floorProgram = this.createShaderProgram(vsBackgroundSource, fsGround);
        this.sphereProgram = this.createShaderProgram(vsSphere, fsSphere);
        this.planetProgram = this.createShaderProgram(vsSphere, fsPlanet);
        this.geoProgram = this.createShaderProgram(vsGeo, fsGeo);

        this.squareVAO = this.gl.createVertexArray();
        this.gl.bindVertexArray(this.squareVAO);

        this.squareVBO = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.squareVBO);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, squareVertices, this.gl.STATIC_DRAW);

        this.squareEBO = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.squareEBO);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, squareIndices, this.gl.STATIC_DRAW);

        this.positionLocation = this.gl.getAttribLocation(this.imageProgram, "a_position");
        this.gl.enableVertexAttribArray(this.positionLocation);
        this.gl.vertexAttribPointer(this.positionLocation, 2, this.gl.FLOAT, false, 16, 0);

        this.texCoordLocation = this.gl.getAttribLocation(this.imageProgram, "a_texCoord");
        this.gl.enableVertexAttribArray(this.texCoordLocation);
        this.gl.vertexAttribPointer(this.texCoordLocation, 2, this.gl.FLOAT, false, 16, 8);

        this.imageTextures = new Map();
        this.uniformLocations = new Map();

        this.mousePos = {"x": 0, "y": 0};
        this.zoom = 1;

        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        this.modelMatrix = mat4.create();

        const width = this.canvas.width;
        const height = this.canvas.height;

        const fieldOfView = (45 * Math.PI) / 180; // in radians
        const aspect = width/height;
        const zNear = 0.01;
        const zFar = 10000.0;
        this.projMatrix = mat4.create();
        this.projPerspectiveMatrix = mat4.create();
        this.projOrthoMatrix = mat4.create();

        mat4.perspective(this.projPerspectiveMatrix, fieldOfView, aspect, zNear, zFar);
        mat4.ortho(this.projOrthoMatrix, -width/2, width/2, height/2, -height/2, zNear, zFar);

        this.projMatrix = this.projOrthoMatrix;
        this.currentProj = "ortho";

        this.geoData = [];

        this.mapScale = null;
        this.getMapScale();

        this.islandsFramebuffer = this.createFramebuffer();
        
        this.readGeoData();
    },

    getIslandsFramebuffer : function() {
        return this.islandsFramebuffer;
    },

    bindFramebuffer : function(fb) {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, fb);
    },

    createFramebuffer : function() {
        let width = this.mapScale.y*2000;//this.canvas.width;
        let height = this.mapScale.y*2000;//this.canvas.height;
        console.log(width);
        console.log(height);
        const texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.gl.texImage2D(
            this.gl.TEXTURE_2D,
            0,
            this.gl.RGBA,
            width,
            height,
            0,
            this.gl.RGBA,
            this.gl.UNSIGNED_BYTE,
            null
        );

        // Required texture parameters for FBO attachments
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.REPEAT);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.REPEAT);

        const framebuffer = this.gl.createFramebuffer();
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer);

        // Attach the texture as the color buffer
        this.gl.framebufferTexture2D(
            this.gl.FRAMEBUFFER,
            this.gl.COLOR_ATTACHMENT0,
            this.gl.TEXTURE_2D,
            texture,
            0
        );

        const depthBuffer = this.gl.createRenderbuffer();
        this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, depthBuffer);
        this.gl.renderbufferStorage(this.gl.RENDERBUFFER, this.gl.DEPTH_COMPONENT16, width, height);

        this.gl.framebufferRenderbuffer(
            this.gl.FRAMEBUFFER,
            this.gl.DEPTH_ATTACHMENT,
            this.gl.RENDERBUFFER,
            depthBuffer
        );

        if (this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER) !== this.gl.FRAMEBUFFER_COMPLETE) {
            console.error("Framebuffer not complete");
        }
        
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);

        return {
            texture:texture,
            framebuffer:framebuffer
        }
    },

    getMapScale : function() {
        if (this.mapScale!=null) {
            return this.mapScale;
        }
        let minX = +Infinity, maxX = -Infinity;
        let minY = +Infinity, maxY = -Infinity;

        for (const f of GeoJson.features) {
            const coords = f.geometry.type === "MultiPolygon"
                ? f.geometry.coordinates.flat(2)
                : f.geometry.coordinates.flat(1);

            for (const [x, y] of coords) {
                minX = Math.min(minX, x);
                maxX = Math.max(maxX, x);
                minY = Math.min(minY, y);
                maxY = Math.max(maxY, y);
            }
        }

        let mapW = maxX - minX;
        let mapH = maxY - minY;

        let scale = Math.min(this.canvas.width / mapW, this.canvas.height / mapH);
        this.mapScale = {
            x:this.canvas.width / mapW,
            y:this.canvas.height / mapH
        };
        return this.mapScale;
    },

    readGeoData : function() {

        for (let i = 0; i < GeoJson.features.length; i++) {

            let indices = [];
            let vertices = [];

            if (GeoJson.features[i].geometry.type != "MultiPolygon") {
                //ensureWinding(GeoJson.features[i].geometry.coordinates);
                let data = flatten(GeoJson.features[i].geometry.coordinates);
                let tris = earcut(data.vertices, data.holes, data.dimensions);
                for (let k = 0; k < tris.length; k++) {
                    indices.push(tris[k]);
                }
                for (let k = 0; k < data.vertices.length; k++) {
                    vertices.push(data.vertices[k]);
                }
            }
            else {
                for (let j = 0; j < GeoJson.features[i].geometry.coordinates.length; j++) {
                    //ensureWinding(GeoJson.features[i].geometry.coordinates[j]);
                    let data = flatten(GeoJson.features[i].geometry.coordinates[j]);
                    let tris = earcut(data.vertices, data.holes, data.dimensions);
                    for (let k = 0; k < tris.length; k++) {
                        indices.push(tris[k] + vertices.length / 2);
                    }
                    for (let k = 0; k < data.vertices.length; k++) {
                        vertices.push(data.vertices[k]);
                    }
                }
            }


            let VAO = this.gl.createVertexArray();
            this.gl.bindVertexArray(VAO);

            let VBO = this.gl.createBuffer();
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, VBO);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);

            let EBO = this.gl.createBuffer();
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, EBO);
            this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), this.gl.STATIC_DRAW);

            let positionLocation = this.gl.getAttribLocation(this.geoProgram, "a_position");
            this.gl.enableVertexAttribArray(positionLocation);
            this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 4*2, 0);

            this.geoData.push({
                vao: VAO,
                name: GeoJson.features[i].properties.name,
                vertices: vertices,
                indices: indices
            })
        }
    },

    setMousePos : function(Pos) {
        this.mousePos = Pos;
    },

    setZoom : function(Zoom) {
        this.zoom = Zoom;
    },

    togglePerspective : function() {
        if (this.currentProj == "ortho") {
            this.currentProj = "perspective";
            this.projMatrix = this.projPerspectiveMatrix;
        }
        else {
            this.currentProj = "ortho";
            this.projMatrix = this.projOrthoMatrix;
        }
    },

    getContext : function() {
        return this.gl;
    },

    clear : function(color, width, height) {
        // Set clear color to black, fully opaque
        this.gl.clearColor(color[0], color[1], color[2], color[3]);
        // Clear the color buffer with specified clear color
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        //this.gl.disable(this.gl.DEPTH_TEST);

        this.gl.viewport(0,0,width,height);
    },

    getUniformLocation : function(program, name) {
        if (this.uniformLocations.has(name)) {
            return this.uniformLocations.get(name);
        }
        let location = this.gl.getUniformLocation(program, name);
        this.uniformLocations.set(program + name, location);
        return location;
    },

    createShader : function(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error("Shader compile failed: ", this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }
        return shader;
    },

    createShaderProgram : function(vert, frag) {
        let vertexShader = this.createShader(this.gl.VERTEX_SHADER, vert);
        let fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, frag);
        let program = this.gl.createProgram();
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.error("Program linking failed: ", this.gl.getProgramInfoLog(program));
        }

        return program;
    },

    createTexture : function(imageSrc) {
        let texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);

        let image = new Image();
        image.crossOrigin = "anonymous"; // Enable cross-origin loading
        image.src = ImageList[imageSrc];

        this.imageTextures.set(imageSrc, {loaded: false, texture: texture});

        image.onload = () => {
            this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image);

            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.REPEAT);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.REPEAT);

            //this.gl.generateMipmap(this.gl.TEXTURE_2D);

            this.imageTextures.get(imageSrc).loaded = true;
        };

        return texture;
    },

    getTexture : function(imageSrc) {
        if (this.imageTextures.has(imageSrc)) {
            return this.imageTextures.get(imageSrc);
        }
        return this.createTexture(imageSrc);
    },

    resetMatrix : function() {
        this.modelMatrix = mat4.create();
    },

    translate : function(x, y, z) {
        //this.modelMatrix = mat4.create();
        mat4.translate(this.modelMatrix, this.modelMatrix, [x - this.canvas.width / 2, this.canvas.height / 2 - y, -1000.0 + z]);
    },
    rotate : function(rotation, axis) {
        mat4.rotate(this.modelMatrix, this.modelMatrix, -rotation, axis);
    },
    scale : function(x, y) {
        mat4.scale(this.modelMatrix, this.modelMatrix, [x , -y , 1]);
    },
    getScreenPos : function(x, y, z) {
        const point3D = vec4.fromValues(x, y, z, 1.0); // Replace x, y, z with your 3D point

        // Model, view, projection matrices (assume these are predefined)
        this.modelMatrix = mat4.create();
        this.translate(x,y,z);
        const modelMatrix = this.modelMatrix;
        const projectionMatrix = this.projMatrix;

        // Apply the model, view, and projection matrices
        const mvpMatrix = mat4.create();
        mat4.multiply(mvpMatrix, projectionMatrix, modelMatrix);

        // Transform the point using the MVP matrix
        const transformedPoint = vec4.transformMat4([], [0,0,0,1], mvpMatrix);

        // Perform the perspective divide (to get normalized device coordinates)
        const ndcX = transformedPoint[0] / transformedPoint[3];
        const ndcY = transformedPoint[1] / transformedPoint[3];
        const ndcZ = transformedPoint[2] / transformedPoint[3];

        // Viewport transformation (assumes viewport width and height)
        const screenX = (ndcX * 0.5 + 0.5) * this.canvas.width;
        const screenY = this.canvas.height - (ndcY * 0.5 + 0.5) * this.canvas.height;

        console.log(`Screen Coordinates: (${screenX}, ${screenY})`);
        return {x:screenX,y:screenY};
    },

    drawImage : function(image, alpha=1.0) {
        let texture = this.getTexture(image);

        if (!texture.loaded) {
            return;
        }

        this.gl.useProgram(this.imageProgram);

        this.gl.uniform1f(this.getUniformLocation(this.imageProgram, "alpha"), alpha);
        this.gl.uniformMatrix4fv(this.getUniformLocation(this.imageProgram, "proj"), false, this.projMatrix);
        this.gl.uniformMatrix4fv(this.getUniformLocation(this.imageProgram, "model"), false, this.modelMatrix);

        this.gl.bindTexture(this.gl.TEXTURE_2D, texture.texture);
        this.gl.bindVertexArray(this.squareVAO);
        this.gl.drawElements(this.gl.TRIANGLES, squareIndices.length, this.gl.UNSIGNED_SHORT, 0);
        //this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    },

    drawImageColour : function(image, colour) {
        let texture = this.getTexture(image);

        if (!texture.loaded) {
            return;
        }

        this.gl.useProgram(this.imageColourProgram);

        this.gl.uniformMatrix4fv(this.getUniformLocation(this.imageColourProgram, "proj"), false, this.projMatrix);
        this.gl.uniformMatrix4fv(this.getUniformLocation(this.imageColourProgram, "model"), false, this.modelMatrix);

        this.gl.uniform4fv(this.getUniformLocation(this.imageColourProgram, "u_colour"), colour);

        this.gl.bindTexture(this.gl.TEXTURE_2D, texture.texture);
        this.gl.bindVertexArray(this.squareVAO);
        this.gl.drawElements(this.gl.TRIANGLES, squareIndices.length, this.gl.UNSIGNED_SHORT, 0);
    },

    drawBackground : function(transparency) {
        this.gl.useProgram(this.backgroundProgram);

        this.gl.uniformMatrix4fv(this.getUniformLocation(this.backgroundProgram, "proj"), false, this.projMatrix);
        this.gl.uniformMatrix4fv(this.getUniformLocation(this.backgroundProgram, "model"), false, this.modelMatrix);

        let time = (new Date().getTime() - this.startTime) / 1000.0 + 10.0;
        this.gl.uniform1f(this.getUniformLocation(this.backgroundProgram, "time"), time);
        this.gl.uniform1f(this.getUniformLocation(this.backgroundProgram, "transparency"), transparency);
        this.gl.uniform2f(this.getUniformLocation(this.backgroundProgram, "resolution"), this.canvas.width, this.canvas.height);

        this.gl.bindVertexArray(this.squareVAO);
        this.gl.drawElements(this.gl.TRIANGLES, squareIndices.length, this.gl.UNSIGNED_SHORT, 0);
    },

    drawFloor : function() {
        this.gl.useProgram(this.floorProgram);

        this.gl.uniformMatrix4fv(this.getUniformLocation(this.floorProgram, "proj"), false, this.projMatrix);
        this.gl.uniformMatrix4fv(this.getUniformLocation(this.floorProgram, "model"), false, this.modelMatrix);

        let time = (new Date().getTime() - this.startTime) / 1000.0 + 10.0;
        this.gl.uniform1f(this.getUniformLocation(this.floorProgram, "time"), time);
        this.gl.uniform2f(this.getUniformLocation(this.floorProgram, "resolution"), this.canvas.width, 100);

        this.gl.bindVertexArray(this.squareVAO);
        this.gl.drawElements(this.gl.TRIANGLES, squareIndices.length, this.gl.UNSIGNED_SHORT, 0);
    },

    drawSphere : function() {
        this.gl.useProgram(this.sphereProgram);

        this.gl.uniformMatrix4fv(this.getUniformLocation(this.sphereProgram, "proj"), false, this.projMatrix);
        this.gl.uniformMatrix4fv(this.getUniformLocation(this.sphereProgram, "model"), false, this.modelMatrix);

        this.gl.bindVertexArray(this.squareVAO);
        this.gl.drawElements(this.gl.TRIANGLES, squareIndices.length, this.gl.UNSIGNED_SHORT, 0);
    },

    drawIslands : function() {
        this.gl.useProgram(this.geoProgram);

        this.gl.uniformMatrix4fv(this.getUniformLocation(this.geoProgram, "proj"), false, this.projMatrix);
        this.gl.uniformMatrix4fv(this.getUniformLocation(this.geoProgram, "model"), false, this.modelMatrix);

        for (let i = 0; i < this.geoData.length; i++) {
            this.gl.bindVertexArray(this.geoData[i].vao);
            this.gl.drawElements(this.gl.TRIANGLES, this.geoData[i].indices.length, this.gl.UNSIGNED_SHORT, 0);
        }
    },

    drawPlanet : function() {

        this.gl.useProgram(this.planetProgram);

        this.gl.uniformMatrix4fv(this.getUniformLocation(this.planetProgram, "proj"), false, this.projMatrix);
        this.gl.uniformMatrix4fv(this.getUniformLocation(this.planetProgram, "model"), false, this.modelMatrix);

        this.gl.uniform2fv(this.getUniformLocation(this.planetProgram, "iResolution"), [this.canvas.width, this.canvas.height]);
        this.gl.uniform1f(this.getUniformLocation(this.planetProgram, "iTime"), (Date.now() - this.startTime) / 1000.0);
        this.gl.uniform2fv(this.getUniformLocation(this.planetProgram, "iMouse"), [0.0,0.0]);
        this.gl.uniform1i(this.getUniformLocation(this.planetProgram, "iChannel0"), 0);
        this.gl.uniform1i(this.getUniformLocation(this.planetProgram, "iChannel1"), 1);
        this.gl.uniform1i(this.getUniformLocation(this.planetProgram, "iChannel2"), 2);
        this.gl.uniform2fv(this.getUniformLocation(this.planetProgram, "iMouse"), [this.mousePos.x, this.mousePos.y]);
        this.gl.uniform1f(this.getUniformLocation(this.planetProgram, "Zoom"), this.zoom);

        let Channel0 = gfx.getIslandsFramebuffer();//gfx.getTexture("map");
        let Channel1 = gfx.getTexture("cloud");
        let Channel2 = gfx.getTexture("light");

        // if (!Channel0.loaded || !Channel1.loaded || !Channel2.loaded) {
        //     return;
        // }

        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, Channel0.texture);

        this.gl.activeTexture(this.gl.TEXTURE0 + 1);
        this.gl.bindTexture(this.gl.TEXTURE_2D, Channel1.texture);

        this.gl.activeTexture(this.gl.TEXTURE0 + 2);
        this.gl.bindTexture(this.gl.TEXTURE_2D, Channel2.texture);

        this.gl.bindVertexArray(this.squareVAO);
        this.gl.drawElements(this.gl.TRIANGLES, squareIndices.length, this.gl.UNSIGNED_SHORT, 0);
    }
}

const squareVertices = new Float32Array([
    -0.5,  0.5, 0.0, 0.0,  // v0
     0.5,  0.5, 0.0, 0.0,  // v1
     0.5, -0.5, 0.0, 0.0,  // v2
    -0.5, -0.5, 0.0, 0.0   // v3
]);

// Two triangles
const squareIndices = new Uint16Array([
    2, 1, 0,
    3, 2, 0
]);

const vsGeo2 = `
    attribute vec2 a_position;

    uniform mat4 model;
    uniform mat4 proj;

    void main() {
        float radius = 1.0;
        float lon = radians(a_position.x);
        float lat = radians(a_position.y);

        float x = cos(lat) * cos(lon);
        float y = sin(lat);
        float z = cos(lat) * sin(lon);

        vec3 spherePos = vec3(x, y, z) * radius;

        gl_Position = proj * model * vec4(spherePos, 1.0);
    }
`;

const vsGeo = `
    attribute vec2 a_position;

    uniform mat4 model;
    uniform mat4 proj;

    void main() {
        gl_Position = proj * model * vec4(a_position.x, a_position.y, 0.0, 1.0);
    }
`;

const fsGeo = `
    precision mediump float;

    void main() {
        gl_FragColor = vec4(0.114, 0.651, 0.0,1.0);
    }
`;

// Vertex shader
const vsSource = `
    attribute vec4 a_position;
    
    uniform mat4 model;
    uniform mat4 proj;
    
    attribute vec2 a_texCoord;
    varying vec2 v_texCoord;
    void main() {
        gl_Position = proj * model * a_position;
        v_texCoord = a_texCoord;
    }
`;

// Fragment shader
const fsSource = `
    precision mediump float;
    varying vec2 v_texCoord;
    uniform float alpha;
    uniform sampler2D u_texture;
    void main() {
        vec4 colour = texture2D(u_texture, v_texCoord);
        if (colour.a == 1.0) {
            colour.a = alpha;
        }
        gl_FragColor = colour;
    }
`;

const vsSphere = `
    attribute vec4 a_position;
    
    uniform mat4 model;
    uniform mat4 proj;

    varying vec4 fragCoord;

    void main() {
        fragCoord = a_position;
        gl_Position = proj * model * a_position;
    }
`;

const vsPlanet = `
    attribute vec4 a_position;
    
    uniform mat4 model;
    uniform mat4 proj;

    attribute vec2 a_texCoord;
    varying vec2 v_texCoord;

    varying vec4 fragCoord;

    void main() {
        v_texCoord = a_texCoord;
        fragCoord = a_position;
        gl_Position = proj * model * a_position;
    }
`;

const fsSphere = `
    precision mediump float;

    varying vec4 fragCoord;

    void main() {
        vec4 colour = vec4(1.0,1.0,1.0,1.0);
        if (fragCoord.x * fragCoord.x + fragCoord.y * fragCoord.y > 1.0) {
            colour.a = 0.0;
        }
        gl_FragColor = colour;
    }
`;

// Fragment shader
const fsImageColourSource = `
    precision mediump float;
    varying vec2 v_texCoord;
    uniform sampler2D u_texture;
    uniform vec4 u_colour;
    void main() {
        float alpha = texture2D(u_texture, v_texCoord)[3];
        
        if (alpha < 0.5) {
            gl_FragColor = vec4(0.0,0.0,0.0,0.0);
            return;
        }
        
        gl_FragColor = u_colour;
    }
`;

const vsBackgroundSource = `
    attribute vec4 a_position;
    
    uniform mat4 model;
    uniform mat4 proj;
    
    void main() {
        gl_Position = proj * model * a_position;
    }
`;

const fsSpace = `
    precision mediump float;
    
    uniform float time;
    uniform vec2 resolution;
    uniform float transparency;
    
    vec4 textureRND2D(vec2 uv){
        uv = floor(fract(uv)*1e3);
        float v = uv.x+uv.y*1e3;
        return fract(1e5*sin(vec4(v*1e-2, (v+1.)*1e-2, (v+1e3)*1e-2, (v+1e3+1.)*1e-2)));
    }
    
    float noise(vec2 p) {
        vec2 f = fract(p*1e3);
        vec4 r = textureRND2D(p);
        f = f*f*(3.0-2.0*f);
        return (mix(mix(r.x, r.y, f.x), mix(r.z, r.w, f.x), f.y));
    }
    
    float cloud(vec2 p) {
        float v = 0.0;
        v += noise(p*1.)*.50000;
        v += noise(p*2.)*.2;
        v += noise(p*4.)*.12500;
        v += noise(p*8.)*.06250;
        v += noise(p*16.)*.03125;
        return v*v*v;
    }
    
    void main( void ) {
        vec2 p = (floor(gl_FragCoord.xy / 10.0) * 10.0 * 6.0 - resolution.xy) / min(resolution.x, resolution.y) * 0.05 / 8.0;
        //vec2 p = (gl_FragCoord.xy * 6.0 - resolution.xy) / min(resolution.x, resolution.y) * 0.05 / 8.0;
        p.y += sin(p.x * 150.0 + time) / 100.0 * gl_FragCoord.y / resolution.y;
        p.x += time / 1000.0;
        
        vec3 c = vec3(0.0, 0.0, 1.0);
        c.rgb += vec3(0.0, 0.0, 1.0) * cloud(p*.3+time*.001)*.6;
        c.gbr += vec3(0.784, 1.0, 0.) * cloud(p*.2+time*.001)*.8;
        c.grb += vec3(0.784, 0.0, 1.0) * cloud(p*.1+time*.001)*1.;
        gl_FragColor = vec4(c, transparency);
    }

`;

const fsGround = `
precision mediump float;

uniform float time;
uniform vec2 resolution;

float hash(float n) { return fract(sin(n) * 1e4); }
float hash(vec2 p) { return fract(1e4 * sin(17.0 * p.x + p.y * 0.1) * (0.1 + abs(sin(p.y * 13.0 + p.x)))); }

float noise(float x) {
    float i = floor(x);
    float f = fract(x);
    float u = f * f * (3.0 - 2.0 * f);
    return mix(hash(i), hash(i + 1.0), u);
}

float fbm(float x) {
    float v = 0.0;
    float a = 0.5;
    float shift = float(100);
    for (int i = 0; i < 1; ++i) {
        v += a * noise(x);
        x = x * 2.0 + shift;
        a *= 0.5;
    }
    return v;
}

float noise2D(vec2 x) {
    vec2 i = floor(x);
    vec2 f = fract(x);

    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

#define PIXEL_SIZE 5.0
#define SCROLL_SPEED 1.0

void main() {
    float v = 0.0;
    
    float coord2 = floor(gl_FragCoord.x / PIXEL_SIZE / 5.0 + time * 5.0 * SCROLL_SPEED) * PIXEL_SIZE * 0.05 - 10.0;
    float height = fbm(coord2) * resolution.y / 2.0;
    v = clamp((height - floor(gl_FragCoord.y / PIXEL_SIZE) * PIXEL_SIZE + resolution.y / 2.0) / (resolution.y * 0.02), 0.0, 1.0);
    
    vec3 col = pow(v, 0.35) * 1.3 * normalize(vec3(0.5, gl_FragCoord.xy / resolution.xy)) + vec3(v * 0.25);
    
    if (col.r < 0.1 && col.g < 0.1 && col.b < 0.1) {
        gl_FragColor = vec4(0.0);
        return;
    }
    
    vec2 coord = floor(gl_FragCoord.xy / PIXEL_SIZE) * PIXEL_SIZE * 0.025 + vec2(time * 3.0 * SCROLL_SPEED, resolution.y / 2.0);
    float v2 = noise2D(coord);
    
    gl_FragColor = vec4(1, 0.984, 0, 1.0) + vec4(v2, v2, v2, 0.0) / 2.0;
    //gl_FragColor = vec4(0.788, 0.784, 0.38, 1.0);
    //gl_FragColor = vec4(pow(v, 0.35) * 1.3 * normalize(vec3(0.5, gl_FragCoord.xy / resolution.xy)) + vec3(v * 0.25), 1.0);
}

`;

export default gfx;