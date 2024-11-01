// example shaders
let shaders = {
  swirl: {
    vertex_shader_source:`
      attribute vec4 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;
      
      void main() {
        gl_Position = a_position;     // Set vertex position
        v_texCoord = a_texCoord;      // Pass texture coordinates to fragment shader
      }
    `,
    fragment_shader_source:`
      precision mediump float;
      uniform sampler2D u_video;
      uniform float u_input_variable; // Controls degree of bubble and swirl effect
      varying vec2 v_texCoord;
      
      void main() {
        // Center the texture coordinates around origin
        vec2 uv = v_texCoord - 0.5;
      
        // Compute the distance from center
        float dist = length(uv); 
        
        // Calculate swirl angle based on distance and input_variable
        float angle = u_input_variable * dist * 8.0;
      
        // Apply swirl effect using rotation matrix
        uv = mix(uv, vec2(
          uv.x * cos(angle) - uv.y * sin(angle),
          uv.x * sin(angle) + uv.y * cos(angle)
        ) * dist, u_input_variable);
      
        // Shift coordinates back to original placing
        uv += 0.5;

        // Sample color using transformed coordinates
        vec4 color = texture2D(u_video, uv);

        gl_FragColor = color;  // Output the final pixel color
      } 
    `,
  },
  edge_tracing:{
    vertex_shader_source:`
      attribute vec4 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;

      void main() {
        gl_Position = a_position;
        v_texCoord = a_texCoord;
      }
    `,
    fragment_shader_source:`
      precision mediump float;
      uniform sampler2D u_video;
      uniform float u_input_variable;
      uniform vec2 u_resolution;
      varying vec2 v_texCoord;

      void main() {
        vec2 one_pixel = vec2(1.0, 1.0) / u_resolution;

        float kernel[9];
        kernel[0] = -1.0;
        kernel[1] = -1.0;
        kernel[2] = -1.0;
        kernel[3] = -1.0;
        kernel[4] =  8.0;
        kernel[5] = -1.0;
        kernel[6] = -1.0;
        kernel[7] = -1.0;
        kernel[8] = -1.0;

        float kernel_norm = 4.0;
        kernel[4] = 8.0 + u_input_variable * kernel_norm;

        vec3 sample_tex[9];

        for (int i = -1; i <= 1; i++) {
          for (int j = -1; j <= 1; j++) {
            sample_tex[(i+1) * 3 + (j+1)] = texture2D(u_video, v_texCoord + vec2(float(i), float(j)) * one_pixel).rgb;
          }
        }

        vec3 edge = vec3(0.0);
        for (int i = 0; i < 9; i++) {
           edge += sample_tex[i] * kernel[i];
        }

        edge = abs(edge);
        gl_FragColor = vec4(edge, 1.0);
      }
    `,
  },
  pixelation: {
    vertex_shader_source:`
      attribute vec4 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;

      void main() {
        gl_Position = a_position;
        v_texCoord = a_texCoord;
      }
    `,
    fragment_shader_source:`
      precision mediump float;
      uniform sampler2D u_video;
      uniform float u_input_variable; // Used as pixelation_level
      uniform vec2 u_resolution;
      varying vec2 v_texCoord;

      void main() {
        vec2 pixel_size = vec2(u_input_variable * 10.0) / u_resolution;
        vec2 coords = v_texCoord / pixel_size;
        coords = floor(coords) * pixel_size;
        vec4 color = texture2D(u_video, coords);
        gl_FragColor = color;
      }
    `,
  },
  colour_shift_and_tint: {
    vertex_shader_source:`
      attribute vec4 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;

      void main() {
        gl_Position = a_position;
        v_texCoord = a_texCoord;
      }
    `,
    fragment_shader_source:`
      precision mediump float;
      uniform sampler2D u_video;
      uniform float u_input_variable; // Controls color shift degree
      varying vec2 v_texCoord;

      void main() {
        vec4 color = texture2D(u_video, v_texCoord);

        // Calculate shifted hue
        color.r = mix(color.r, color.r * cos(u_input_variable * 3.14159), u_input_variable/2.0);
        color.g = mix(color.g, color.g * sin(u_input_variable * 3.14159 + 1.0), u_input_variable/2.0);
        color.b = mix(color.b, color.b * cos(u_input_variable * 3.14159 + 2.0), u_input_variable/2.0);

        gl_FragColor = color;
      }
    `,
  },
  radial_blur: {
    vertex_shader_source:`
      attribute vec4 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;

      void main() {
        gl_Position = a_position;
        v_texCoord = a_texCoord;
      }
    `,
    fragment_shader_source:`
      precision mediump float;
      uniform sampler2D u_video;
      uniform float u_input_variable; // Controls blur intensity from center
      uniform vec2 u_resolution;
      varying vec2 v_texCoord;

      void main() {
        vec2 uv = v_texCoord - 0.5;
        float dist = length(uv);

        vec4 color = texture2D(u_video, v_texCoord);
        vec4 summedColor = vec4(0.0);
        float total_weight = 0.0;

        // Progress from no blur (0.0) to full blur (1.0) based on input_variable
        for (float i = 0.0; i < 1.0; i += 0.1) {
          //vec2 offset = uv * dist * u_input_variable * 2.0 * i;
          vec2 offset = uv * dist * u_input_variable * i;
          summedColor += texture2D(u_video, v_texCoord + offset);
          total_weight += 1.0;
        }

        color = mix(color, summedColor / total_weight, u_input_variable);

        gl_FragColor = color;
      }
    `,
  },
  kaleidescope:{
    vertex_shader_source:`
      attribute vec4 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;

      void main() {    
        gl_Position = a_position;
        v_texCoord = a_texCoord;
      }
    `,
    fragment_shader_source:`
      precision mediump float;
      uniform sampler2D u_video;
      uniform float u_input_variable; // Controls kaleidoscope intensity
      varying vec2 v_texCoord;      

      void main() {
        // Center coordinates around (0.5, 0.5)
        vec2 uv = v_texCoord - 0.5;
        float angle = atan(uv.y, uv.x);
        float radius = length(uv);

        // Determine number of mirrored segments based on input intensity
        float segments = 2.0; // Number of segments when fully active
        float segment_adjustment = 1.0 + (segments - 1.0) * u_input_variable;

        // Compute mirrored angle, ensuring resulting symmetry
        float mirrored_angle = mod(angle + 3.14159, 2.0 * 3.14159 / segment_adjustment) - (3.14159 / segment_adjustment);
        angle = mirrored_angle * segment_adjustment;

        // Reconstruct uv coordinates with adjusted angle
        uv.x = radius * cos(angle);
        uv.y = radius * sin(angle);
        uv += 0.5; // Re-center coordinates

        // Sample texture with potentially mirrored coordinates
        vec4 color = texture2D(u_video, uv);

        // Blend between original and kaleidoscope effect
        vec4 original_color = texture2D(u_video, v_texCoord);
        gl_FragColor = mix(original_color, color, u_input_variable);
      }
    `,
  },
  wave_distortion: {
    vertex_shader_source:`
      attribute vec4 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord; 

      void main() {
        gl_Position = a_position;
        v_texCoord = a_texCoord; 
      } 
    `,
    fragment_shader_source:`
      precision mediump float;
      uniform sampler2D u_video;  
      uniform float u_input_variable; // Controls the wave intensity
      uniform vec2 u_resolution;
      varying vec2 v_texCoord;

      void main() { 
        // Wave parameters
        float frequency = 10.0;
        float amplitude = 0.02 * u_input_variable;
      
        // Calculate the wave distortion
        float dx = amplitude * sin(frequency * (v_texCoord.y * u_resolution.y) + u_input_variable * 10.0);
        float dy = amplitude * cos(frequency * (v_texCoord.x * u_resolution.x) + u_input_variable * 10.0);

        // Apply wave distortion
        vec2 uv = vec2(v_texCoord.x + dx, v_texCoord.y + dy);

        // Sample the texture at the distorted coordinates
        gl_FragColor = texture2D(u_video, uv);
      }
    `,
  },
  zoom_and_rotate: {
    vertex_shader_source:`
      attribute vec4 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;

      void main() {
        gl_Position = a_position;
        v_texCoord = a_texCoord;
      }
    `,
    fragment_shader_source:`
      precision mediump float;
      uniform sampler2D u_video;
      uniform float u_input_variable; // Controls the zoom and rotation effect
      varying vec2 v_texCoord;

      void main() {
        vec2 uv = v_texCoord - 0.5; // Center coordinates

        // Calculate zoom effect
        float zoom_factor = 1.0 + u_input_variable * 2.0;
        uv *= zoom_factor;

        // Calculate rotation effect
        float angle = u_input_variable * 3.14159 * 0.5; // Rotation in radians
        float s = sin(angle);
        float c = cos(angle);
        uv = vec2(c * uv.x - s * uv.y, s * uv.x + c * uv.y);

        uv += 0.5; // Re-center the UV coordinates

        // Sample the texture at the transformed coordinates
        gl_FragColor = texture2D(u_video, uv);
      }
    `,
  },
};
