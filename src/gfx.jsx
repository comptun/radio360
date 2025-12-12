import fsPlanet from './planet';
import ImageList from './image_list';
import GeoJson from './data/countries.json';
import { earcut, flatten } from './earcut';

// WebGL gfx functions I made
var gfx = {

    canvas : null,

    // Intialises WebGL with the canvas
    start : function(canvas) {
        this.canvas = canvas;

        // Get the webgl2 rendering context
        this.gl = this.canvas.getContext("webgl2", { premultipliedAlpha: false });

        if (this.gl == null) {
            alert("Unable to initialise webgl");
            return;
        }

        // Enable alpha blending
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        this.gl.clearColor(0, 0, 0, 0);

        // Enable depth testing
        this.gl.enable(this.gl.DEPTH_TEST);

        // The point in time when the app started, for potential use in some shaders
        this.startTime = Date.now();

        // Create appropriate shader programs
        this.planetProgram = this.createShaderProgram(vsSphere, fsPlanet);
        this.geoProgram = this.createShaderProgram(vsGeo2, fsGeo);
        this.pointProgram = this.createShaderProgram(vsPoint, fsPoint);

        // Setup VAO, VBO, and EBO for rendering a simple rectangle/square if needed
        this.squareVAO = this.gl.createVertexArray();
        this.gl.bindVertexArray(this.squareVAO);

        this.squareVBO = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.squareVBO);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, squareVertices, this.gl.STATIC_DRAW);

        this.squareEBO = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.squareEBO);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, squareIndices, this.gl.STATIC_DRAW);

        // Get locations of vertex position and texcoord position locations in shader, this is the same in all of them
        this.positionLocation = this.gl.getAttribLocation(this.planetProgram, "a_position");
        this.gl.enableVertexAttribArray(this.positionLocation);
        this.gl.vertexAttribPointer(this.positionLocation, 2, this.gl.FLOAT, false, 16, 0);

        this.texCoordLocation = this.gl.getAttribLocation(this.planetProgram, "a_texCoord");
        this.gl.enableVertexAttribArray(this.texCoordLocation);
        this.gl.vertexAttribPointer(this.texCoordLocation, 2, this.gl.FLOAT, false, 16, 8);

        // For caching any image data
        this.imageTextures = new Map();
        // For caching shader uniform locations
        this.uniformLocations = new Map();

        // The mouse delta when the mouse is held down
        this.mouseDelta = {"x": 0, "y": 0};
        // Mouse position relative to the canvas
        this.mousePos = {"x": 0, "y": 0};
        // The zoom level from the scroll wheel
        this.zoom = 1;

        // Canvas width and height initialised to window width/height
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        // Model matrix initialised with identity mat4
        this.modelMatrix = mat4.create();

        // Perspective and orthographic projection matrices initialised if either are needed
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

        // Default projection matrix is set as orthographic
        this.projMatrix = this.projOrthoMatrix;
        this.currentProj = "ortho";

        // To store the triangulated vertex positions for all the islands on the globe, to be passed to a vertex buffer
        this.geoData = [];
        // Stores non-triangulated island vertex positions data for the outline rendering of the islands, to be passed to a vertex buffer
        this.geoOutlineData = [];
        // Stores longitude and latitude values transformed into 3d points on a sphere for rendering the radio station point mesh, to be passed to a vertex buffer
        this.stationPoints = [];
        // Stores non mesh related data to do with each radio station point
        this.stationData = [];
        // The vertex array that can be binded to draw the stations in one draw call
        this.stationVAO = null;
        
        // Get the x and y scaling of the islands so it can be rendered to the correct aspect ratio
        this.mapScale = null;
        this.getMapScale();

        this.islandsFramebuffer = this.createFramebuffer();
        
        // Read all geo data from countries.json for each country and translate into vertex buffers linked to vertex arrays
        // each island has an individual vbo and vao
        this.readGeoData();
    },

    // Recalculate projection matrix when the window is resized
    recalculateCanvasSize : function() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        const width = this.canvas.width;
        const height = this.canvas.height;

        const fieldOfView = (45 * Math.PI) / 180;
        const aspect = width/height;
        const zNear = 0.01;
        const zFar = 10000.0;
        this.projPerspectiveMatrix = mat4.create();
        this.projOrthoMatrix = mat4.create();

        mat4.perspective(this.projPerspectiveMatrix, fieldOfView, aspect, zNear, zFar);
        mat4.ortho(this.projOrthoMatrix, -width/2, width/2, height/2, -height/2, zNear, zFar);
        this.projMatrix = this.projOrthoMatrix;
    },

    // Converts a point in 3d space into screen coordinates
    projectToScreen : function(point, modelMatrix, projMatrix) {
        const p = vec4.fromValues(point[0], point[1], point[2], 1.0);

        // Camera view matrix isn't needed
        const view  = mat4.create();

        const mvp = mat4.create();
        mat4.multiply(mvp, modelMatrix, p);
        mat4.multiply(mvp, view, mvp);
        mat4.multiply(mvp, projMatrix, mvp);

        // Perspective divide
        const ndc = [
            mvp[0] / mvp[3],
            mvp[1] / mvp[3],
            mvp[2] / mvp[3]
        ];

        const x = ndc[0] * this.canvas.width;
        const y = ndc[1] * this.canvas.height;
        const z = ndc[2];

        return { x, y, z };
    },

    // Calculates if a radio station point was clicked by the mouse
    clickScreen : function(Pos) {
        for (let i = 0; i < this.stationPoints.length-1; i+=2) {

            let DEG2RAD = 3.141592653589793 / 180.0;
            let radius = 1.0;

            let lon = this.stationPoints[i] * DEG2RAD;
            let lat = this.stationPoints[i+1] * DEG2RAD;

            //lat += lat / 30.0;

            let x = radius * Math.cos(lat) * Math.cos(lon);
            let y = radius * Math.sin(lat);
            let z = radius * Math.cos(lat) * Math.sin(lon);

            this.resetMatrix();
            this.scale(-this.canvas.height * 0.48 * this.zoom/2, this.canvas.height * 0.48 * this.zoom/2);
            this.translate(this.canvas.width / 2, this.canvas.height / 2, 1);
            this.rotate(this.mouseDelta.y, [1,0,0]);
            this.rotate(this.mouseDelta.x, [0,1,0]);

            let worldPos = mat4.create();
            mat4.multiply(worldPos, this.modelMatrix, vec4.fromValues(x,y,z,1.0));
            
            if (worldPos[2] > -990.1) {
                continue;
            }

            let coords = this.projectToScreen([x,y,z], this.modelMatrix, this.projMatrix);
            coords.x *= Math.pow(1.0 / this.zoom, 2);
            coords.y *= Math.pow(1.0 / this.zoom, 2);

            let mx = Pos.x - this.canvas.width / 2.0;
            let my = -Pos.y + this.canvas.height / 2.0;

            const dx = (coords.x - mx);
            const dy = (coords.y - my);
            const pxDist = Math.sqrt(dx*dx + dy*dy);

            if (pxDist < 20.0) {
                return this.stationData[i / 2];
            }
        }
        return null;
    },

    // Add a vertex position to the station vertex buffer list
    addStationPoint : function(x, y, data) {
        this.stationPoints.push(x);
        this.stationPoints.push(y);
        // Add additional data for that index
        this.stationData.push(data);
    },

    // Create VBO and VAO for stations mesh once all points have been added
    createStations : function() {
        this.stationVAO = this.gl.createVertexArray();
        this.gl.bindVertexArray(this.stationVAO);

        let VBO = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, VBO);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.stationPoints), this.gl.STATIC_DRAW);

        let positionLocation = this.gl.getAttribLocation(this.geoProgram, "a_position");
        this.gl.enableVertexAttribArray(positionLocation);
        this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 4*2, 0);

        this.gl.bindVertexArray(null);
    },

    // Draw station points to screen
    drawStations : function() {
        this.gl.useProgram(this.pointProgram);

        this.gl.uniform1f(this.getUniformLocation(this.pointProgram, "zoom"), false, this.zoom);
        this.gl.uniformMatrix4fv(this.getUniformLocation(this.pointProgram, "proj"), false, this.projMatrix);
        this.gl.uniformMatrix4fv(this.getUniformLocation(this.pointProgram, "model"), false, this.modelMatrix);

        let mx = ((this.mousePos.x / this.canvas.width) * 2.0 - 1.0) * this.canvas.width;
        let my = (1.0 - (this.mousePos.y / this.canvas.height) * 2.0) * this.canvas.height;

        // Pass mouse position as uniform so proximity to a point is calculated in the shader and logic can be added there
        this.gl.uniform2fv(this.getUniformLocation(this.pointProgram, "mouse"), [mx,my]);
        this.gl.uniform2fv(this.getUniformLocation(this.pointProgram, "viewportSize"), [this.canvas.width,this.canvas.height]);

        this.gl.bindVertexArray(this.stationVAO);
        this.gl.drawArrays(this.gl.POINTS, 0, this.stationPoints.length/2);
    },

    getIslandsFramebuffer : function() {
        return this.islandsFramebuffer;
    },

    bindFramebuffer : function(fb) {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, fb);
    },

    // Standard function for creating a framebuffer
    createFramebuffer : function() {
        let width = this.mapScale.x*2000;
        let height = this.mapScale.y*2000;

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

    // Get the aspect ratio of the map if it is being rendered to a framebuffer so it can be sized correctly
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

    // For subdividing island geometry in case it appears mangled when projected onto a globe
    // large countries such as Russia need this, or they may appear to be clipping with other things
    subdivideTriangle : function(a, b, c, depth) {
        if (depth === 0) return [a, b, c];

        const ab = [(a[0]+b[0])*0.5, (a[1]+b[1])*0.5];
        const bc = [(b[0]+c[0])*0.5, (b[1]+c[1])*0.5];
        const ca = [(c[0]+a[0])*0.5, (c[1]+a[1])*0.5];

        return [
            ...gfx.subdivideTriangle(a, ab, ca, depth - 1),
            ...gfx.subdivideTriangle(ab, b, bc, depth - 1),
            ...gfx.subdivideTriangle(ca, bc, c, depth - 1),
            ...gfx.subdivideTriangle(ab, bc, ca, depth - 1)
        ];
    },

    // Read the countries.json file in data/ and create vertex array objects from them so each country can be rendered individually
    readGeoData : function() {

        // For creating the islands
        let read = (coords, name) => {

            let indices = [];
            let vertices = [];

            let data = flatten(coords);
            let tris = earcut(data.vertices, data.holes, data.dimensions);

            for (let t = 0; t < tris.length; t += 3) {
                const i0 = tris[t+0] * 2;
                const i1 = tris[t+1] * 2;
                const i2 = tris[t+2] * 2;

                const a = [data.vertices[i0],     data.vertices[i0+1]];
                const b = [data.vertices[i1],     data.vertices[i1+1]];
                const c = [data.vertices[i2],     data.vertices[i2+1]];

                let subdivisions = 0;
                if (name == "Russia") {
                    subdivisions = 2;
                }
                const subdivided = gfx.subdivideTriangle(a, b, c, subdivisions);

                for (let v = 0; v < subdivided.length; v++) {
                    vertices.push(subdivided[v][0]);
                    vertices.push(subdivided[v][1]);
                }
            }

            let VAO = this.gl.createVertexArray();
            this.gl.bindVertexArray(VAO);

            let VBO = this.gl.createBuffer();
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, VBO);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);

            let positionLocation = this.gl.getAttribLocation(this.geoProgram, "a_position");
            this.gl.enableVertexAttribArray(positionLocation);
            this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 4*2, 0);

            this.geoData.push({
                vao: VAO,
                name: name,
                vertices: vertices,
                indices: indices
            });
        }

        // For creating the country outlines
        let read2 = (coords, name) => {

            let indices = [];
            let vertices = [];
            
            for (let k = 0; k < coords.length; k++) {
                vertices.push(coords[k][0]);
                vertices.push(coords[k][1]);
            }

            let VAO = this.gl.createVertexArray();
            this.gl.bindVertexArray(VAO);

            let VBO = this.gl.createBuffer();
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, VBO);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);

            let positionLocation = this.gl.getAttribLocation(this.geoProgram, "a_position");
            this.gl.enableVertexAttribArray(positionLocation);
            this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 4*2, 0);

            this.geoOutlineData.push({
                vao: VAO,
                name: name,
                vertices: vertices,
                indices: indices
            });
        }

        // Islands
        for (let i = 0; i < GeoJson.features.length; i++) {

            if (GeoJson.features[i].geometry.type != "MultiPolygon") {
                read(GeoJson.features[i].geometry.coordinates, GeoJson.features[i].properties.name);
            }
            else {
                for (let j = 0; j < GeoJson.features[i].geometry.coordinates.length; j++) {
                    read(GeoJson.features[i].geometry.coordinates[j], GeoJson.features[i].properties.name);
                }
            }
        }
        // Island outlines
        for (let i = 0; i < GeoJson.features.length; i++) {

            if (GeoJson.features[i].geometry.type != "MultiPolygon") {
                for (let k = 0; k < GeoJson.features[i].geometry.coordinates.length; k++) {
                    read2(GeoJson.features[i].geometry.coordinates[k], GeoJson.features[i].properties.name);
                }
            }
            else {
                for (let j = 0; j < GeoJson.features[i].geometry.coordinates.length; j++) {
                    for (let k = 0; k < GeoJson.features[i].geometry.coordinates[j].length; k++) {
                        read2(GeoJson.features[i].geometry.coordinates[j][k], GeoJson.features[i].properties.name);
                    }
                }
            }
        }
    },

    // Set mouse delta variable
    setMouseDelta : function(Pos) {
        this.mouseDelta = Pos;
    },
    // Set mouse position
    setMousePos : function(Pos) {
        this.mousePos = Pos;
    },
    // Set zoom from scroll wheel
    setZoom : function(Zoom) {
        this.zoom = Zoom;
    },
    // Toggle the projection matrix from perspective -> ortho, and ortho -> perspective
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

    // Returns he webgl context
    getContext : function() {
        return this.gl;
    },

    clear : function(color, width, height) {
        // Set clear color to black, fully opaque
        this.gl.clearColor(color[0], color[1], color[2], color[3]);
        // Clear the color buffer with specified clear color
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        // Set the viewport size to the window size
        this.gl.viewport(0,0,width,height);
    },

    // Get the cached shader uniform location
    getUniformLocation : function(program, name) {
        if (this.uniformLocations.has(name)) {
            return this.uniformLocations.get(name);
        }
        let location = this.gl.getUniformLocation(program, name);
        this.uniformLocations.set(program + name, location);
        return location;
    },

    // Create and compile a fragment or vertex shader from sourcecode
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

    // Compiles both vert and frag shaders and links them into a shader program
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

    // Create a texture from an image's directory
    createTexture : function(imageSrc) {
        let texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);

        let image = new Image();
        image.crossOrigin = "anonymous";
        image.src = ImageList[imageSrc];

        // Cache the texture data
        this.imageTextures.set(imageSrc, {loaded: false, texture: texture});

        // Generate texture once image has actually loaded
        image.onload = () => {
            this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image);

            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.REPEAT);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.REPEAT);

            // Mark the texture as loaded
            this.imageTextures.get(imageSrc).loaded = true;
        };

        return texture;
    },

    // Return texture data
    getTexture : function(imageSrc) {
        // The texture is already loaded, return the cached data
        if (this.imageTextures.has(imageSrc)) {
            return this.imageTextures.get(imageSrc);
        }
        // Create the texture, it doesn't exist yet
        return this.createTexture(imageSrc);
    },

    // Set the model matrix to the identity mat4
    resetMatrix : function() {
        this.modelMatrix = mat4.create();
    },

    // Change the position of the model matrix
    translate : function(x, y, z) {
        mat4.translate(this.modelMatrix, this.modelMatrix, [x - this.canvas.width / 2, this.canvas.height / 2 - y, -1000.0 + z]);
    },
    // Change the rotation of the model matrix
    rotate : function(rotation, axis) {
        mat4.rotate(this.modelMatrix, this.modelMatrix, -rotation, axis);
    },
    // Change the scale of the model matrix
    scale : function(x, y) {
        mat4.scale(this.modelMatrix, this.modelMatrix, [x , -y , 1]);
    },

    // Draw islands for all countries
    drawIslands : function() {
        this.gl.useProgram(this.geoProgram);

        this.gl.uniformMatrix4fv(this.getUniformLocation(this.geoProgram, "proj"), false, this.projMatrix);
        this.gl.uniformMatrix4fv(this.getUniformLocation(this.geoProgram, "model"), false, this.modelMatrix);
        this.gl.uniform4fv(this.getUniformLocation(this.geoProgram, "color"), [1.0,1.0,1.0,1.0]);

        for (let i = 0; i < this.geoData.length; i++) {
            this.gl.bindVertexArray(this.geoData[i].vao);
            this.gl.drawArrays(this.gl.TRIANGLES, 0, this.geoData[i].vertices.length/2);
        }
    },

    // Draw island outlines for all countries
    drawIslandsOutline : function() {
        this.gl.useProgram(this.geoProgram);

        this.gl.uniformMatrix4fv(this.getUniformLocation(this.geoProgram, "proj"), false, this.projMatrix);
        this.gl.uniformMatrix4fv(this.getUniformLocation(this.geoProgram, "model"), false, this.modelMatrix);
        this.gl.uniform4fv(this.getUniformLocation(this.geoProgram, "color"), [0.62,0.62,0.62,1.0]);

        for (let i = 0; i < this.geoOutlineData.length; i++) {
            this.gl.bindVertexArray(this.geoOutlineData[i].vao);
            this.gl.drawArrays(this.gl.LINE_STRIP, 0, this.geoOutlineData[i].vertices.length/2);
        }
    },

    // Draw the planet ocean that has the appearance of having reflectance
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
        this.gl.uniform2fv(this.getUniformLocation(this.planetProgram, "iMouse"), [this.mouseDelta.x, this.mouseDelta.y]);
        this.gl.uniform1f(this.getUniformLocation(this.planetProgram, "Zoom"), this.zoom);

        let Channel0 = gfx.getIslandsFramebuffer();//gfx.getTexture("map");
        let Channel1 = gfx.getTexture("cloud");
        let Channel2 = gfx.getTexture("light");

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

// Vertices for rendering square
const squareVertices = new Float32Array([
    -0.5,  0.5, 0.0, 0.0,
     0.5,  0.5, 0.0, 0.0,
     0.5, -0.5, 0.0, 0.0,
    -0.5, -0.5, 0.0, 0.0
]);
// Indices for square
const squareIndices = new Uint16Array([
    2, 1, 0,
    3, 2, 0
]);



const vsPoint = `
    attribute vec2 a_position;

    uniform mat4 model;
    uniform mat4 proj;
    uniform float zoom;

    uniform vec2 mouse;
    uniform vec2 viewportSize;

    const float DEG2RAD = 3.141592653589793 / 180.0;
    float radius = 1.0;

    void main() {

        float lon = a_position.x * DEG2RAD;
        float lat = a_position.y * DEG2RAD;

        //lat += lat / 30.0;

        // convert spherical to Cartesian
        float x = radius * cos(lat) * cos(lon);
        float y = radius * sin(lat);
        float z = radius * cos(lat) * sin(lon);

        vec3 position = vec3(x, y, z);

        vec3 normalLocal = normalize(position);
        vec3 normalWorld = normalize((model * vec4(normalLocal, 0.0)).xyz);

        vec3 worldPos = (model * vec4(position, 1.0)).xyz;

        if (worldPos.z > -990.1) {

            vec4 clip = proj * model * vec4(position, 1.0);
            vec3 ndc = clip.xyz / clip.w;

            vec2 pointPx;
            pointPx.x = ndc.x * viewportSize.x;
            pointPx.y = ndc.y * viewportSize.y;

            float pxDist = distance(pointPx,mouse);

            // choose sizes
            float base = 8.0;
            float highlight = 40.0;
            float radiusPx = 40.0;  // area where it grows

            float size = base;
            if (pxDist < radiusPx) {
                float t = 1.0 - pxDist / radiusPx;
                size = mix(base, highlight, t);
            }

            gl_Position = clip;
            gl_PointSize = size; // set pixel radius of the vertex
            return;
        }

        gl_PointSize = 0.0;
        gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    }
`;

const fsPoint = `
    precision mediump float;

    void main() {
        // Convert fragment coordinate to [-1,1] range
        vec2 p = gl_PointCoord * 2.0 - 1.0;

        // Kill fragments outside the circle radius
        if (dot(p, p) > 1.0) {
            discard;
        }

        gl_FragColor = vec4(1.0, 0.6, 0.0, 1.0); // orange point
    }
`;




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

const fsGeo = `
    precision mediump float;

    uniform vec4 color;

    void main() {
        gl_FragColor = color;
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

export default gfx;