class emotile_webgl {
  
  // Class constructor: initializes the WebGL setup with provided or default settings
  constructor(io = {}) {
    // Initialize settings and defaults
    this.initialize_defaults(io);
  }

  // Initializes default values and checks for required elements (video and canvas)
  initialize_defaults(io) {
    this.input = 0; // Placeholder input value for effects

    // Initialize video element
    this.video = this.setup_video_element(io);
    if (!this.video) return;

    // Initialize canvas element
    this.canvas = this.setup_canvas_element(io);
    if (!this.canvas) return;

    // Initialize WebGL and shader variables
    this.gl = null;
    this.video_texture = null;
    this.program = null;
    this.input_variable = null;
    this.resolution_uniform = null;

    // Allow custom shader sources, default to placeholders if not provided
    this.vertex_shader_source = io.vertex_shader_source || this.default_vertex_shader();
    this.fragment_shader_source = io.fragment_shader_source || this.default_fragment_shader();

    // Camera facing mode (user/environment)
    this.facing = io.facing || 'environment';
  }

  // Setup and return a video element, appending to container if necessary
  setup_video_element(io) {
    if (io.video) {
      return io.video;
    } else if (io.container) {
      const video = document.createElement('video');
      video.setAttribute('playsinline', '');  // Ensure inline video playback on mobile
      if (io.video_id) video.id = io.video_id;
      if (io.video_class) video.classList.add(io.video_class);
      io.container.appendChild(video);
      return video;
    } else {
      console.error('A video element or video element container is required.');
      return null;
    }
  }

  // Setup and return a canvas element, appending to container if necessary
  setup_canvas_element(io) {
    if (io.canvas) {
      return io.canvas;
    } else if (io.container) {
      const canvas = document.createElement('canvas');
      if (io.canvas_id) canvas.id = io.canvas_id;
      if (io.canvas_class) canvas.classList.add(io.canvas_class);
      io.container.appendChild(canvas);
      return canvas;
    } else {
      console.error('A canvas element or canvas element container is required.');
      return null;
    }
  }

  // Initialize WebGL context, set up shaders, buffers, and textures
  async init_webgl() {
    this.gl = this.canvas.getContext('webgl');
    if (!this.gl) {
      console.error('WebGL not supported, unable to initialize.');
      return;
    }

    this.gl.clearColor(0, 0, 0, 1);  // Clear color is black, fully opaque

    this.vertex_shader = this.create_shader(this.gl.VERTEX_SHADER, this.vertex_shader_source);
    this.fragment_shader = this.create_shader(this.gl.FRAGMENT_SHADER, this.fragment_shader_source);

    if (!this.vertex_shader || !this.fragment_shader) return;

    this.program = this.create_program(this.vertex_shader, this.fragment_shader);
    if (!this.program) return;

    this.setup_gl_attributes_and_uniforms();
    this.setup_video_texture();
  }

  // Define a default vertex shader
  default_vertex_shader() {
    return `
      attribute vec4 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;

      void main() {
        gl_Position = a_position;  // Transform vertex position
        v_texCoord = a_texCoord;  // Pass texture coordinates to fragment shader
      }
    `;
  }

  // Define a default fragment shader
  default_fragment_shader() {
    return `
      precision mediump float;
      uniform sampler2D u_video;
      uniform float u_input_variable;  // Placeholder for input effects
      varying vec2 v_texCoord;

      void main() {
        vec4 color = texture2D(u_video, v_texCoord);  // Sample video texture
        gl_FragColor = color;  // Output sampled color
      }
    `;
  }

  // Create and compile shader from source
  create_shader(type, source) {
    const shader = this.gl.createShader(type);
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error('Shader compile failed:', this.gl.getShaderInfoLog(shader));
      this.gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  // Create and link WebGL program from compiled shaders
  create_program(vertex_shader, fragment_shader) {
    const program = this.gl.createProgram();
    this.gl.attachShader(program, vertex_shader);
    this.gl.attachShader(program, fragment_shader);
    this.gl.linkProgram(program);
    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      console.error('Program link failed:', this.gl.getProgramInfoLog(program));
      this.gl.deleteProgram(program);
      return null;
    }
    return program;
  }

  // Setup WebGL attributes and uniforms
  setup_gl_attributes_and_uniforms() {
    this.gl.useProgram(this.program); // Use the created program

    // Get attribute and uniform locations in the program
    this.position_location = this.gl.getAttribLocation(this.program, 'a_position');
    this.texcoord_location = this.gl.getAttribLocation(this.program, 'a_texCoord');
    this.input_variable = this.gl.getUniformLocation(this.program, 'u_input_variable');
    this.resolution_uniform = this.gl.getUniformLocation(this.program, 'u_resolution');

    // Create a buffer to hold vertex and texture coordinate data
    const buffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);

    // Store quad vertices data (position and texture coordinates)
    const vertices = new Float32Array([
      -1.0, -1.0, 0.0, 0.0,
       1.0, -1.0, 1.0, 0.0,
      -1.0,  1.0, 0.0, 1.0,
       1.0,  1.0, 1.0, 1.0,
    ]);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);

    // Configure the position attribute
    this.gl.enableVertexAttribArray(this.position_location);
    this.gl.vertexAttribPointer(this.position_location, 2, this.gl.FLOAT, false, 16, 0);

    // Configure the texture coordinate attribute
    this.gl.enableVertexAttribArray(this.texcoord_location);
    this.gl.vertexAttribPointer(this.texcoord_location, 2, this.gl.FLOAT, false, 16, 8);
  }

  // Setup video texture parameters
  setup_video_texture() {
    this.video_texture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.video_texture);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
    this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);  // Flip video texture on Y-axis
  }

  // Initialize camera stream and attach it to the video element
  async init_camera(stream) {
    try {
      if (!stream) {
        this.stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720, facingMode: this.facing }
        });
      } else {
        this.stream = stream;
      }
      this.video.srcObject = this.stream;  // Set video source to the camera stream
      this.video.play();  // Start video playback
      this.video.addEventListener('loadedmetadata', () => {
        this.start();  // Start rendering once metadata is loaded
      });
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  }

  // Start the WebGL rendering process
  async start() {
    this.canvas.width = this.video.videoWidth;  // Match canvas size to video dimensions
    this.canvas.height = this.video.videoHeight;
    await this.init_webgl();
    requestAnimationFrame(() => this.render_frame());  // Start rendering loop
  }

  // Render a frame from the video to the canvas
  render_frame() {
    if (this?.gl) {
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);  // Clear the canvas

      if (this.video.readyState >= this.video.HAVE_CURRENT_DATA) {
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.video_texture);  // Bind video texture
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.video);  // Update texture with current video frame

        this.gl.uniform1f(this.input_variable, parseFloat(this.input));  // Pass input variable to shader
        this.gl.uniform2f(this.resolution_uniform, this.canvas.width, this.canvas.height);  // Set shader resolution

        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);  // Draw the quad covering the canvas
      }
    }
    requestAnimationFrame(() => this.render_frame());  // Request next frame render
  }

  // Change the current shaders and compile a new program
  change_shader(vertex_shader_source, fragment_shader_source) {
    this.vertex_shader_source = vertex_shader_source;
    this.fragment_shader_source = fragment_shader_source;

    // Create new shaders
    const new_vertex_shader = this.create_shader(this.gl.VERTEX_SHADER, vertex_shader_source);
    const new_fragment_shader = this.create_shader(this.gl.FRAGMENT_SHADER, fragment_shader_source);

    if (!new_vertex_shader || !new_fragment_shader) {
      console.error('Failed to compile shaders during change.');
      return;
    }

    // Create and use the new program
    const new_program = this.create_program(new_vertex_shader, new_fragment_shader);
    if (new_program) {
      this.program = new_program;
      this.setup_gl_attributes_and_uniforms();  // Re-setup attributes and uniforms
    }
  }
}

// Export emotile_webgl class as the default export
export { emotile_webgl as default };
