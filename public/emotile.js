class emotile {
  // emotile.js - turn sounds into motion & emotion

  constructor(io = {}) {
    // Initialize settings and defaults
    this.initialize_defaults(io);
  }

  // Initializes all default values and references
  initialize_defaults(io) {
    const self = this;
    // Set up media constraints, with default being audio input
    self.constraints = io.constraints || { audio: true };
    self.url = io.url || null;  // Optional source URL for audio
    self.timeline = io.timeline || []; // Timeline of actions based on audio time
    self.timeline_id = 0;  // Index for the current timeline action
    
    // Audio elements and state
    self.audio = new Audio();  // Main audio element
    self.audio.setAttribute('crossorigin', ''); // Make audio CORS compliant
    self.audio_context = null; // Placeholder for the Web Audio API context
    self.analyser = null;      // AnalyserNode to capture frequency data
    self.source = null;        // Source node for the audio

    // Audio and state flags
    self.audio_played = false;   // Tracks if audio has been played
    self.audio_playing = false;  // Tracks if audio is currently playing
    self.audio_ended = false;    // Tracks if audio has ended
    self.initialized = false;    // Ensures setup has been completed

    // Method bindings: Ensure correct `this` context
    self.update = this.update_level.bind(self, io);
    self.start = this.start_audio.bind(self, io);
    self.pause = this.pause_audio.bind(self, io);
    self.end = this.end_audio.bind(self, io);
  }

  // Event Handlers for audio states
  start_audio(io) {
    if (!this.audio_played && io.start) {
      io.start();  // Invoke external start callback if provided
    }
    this.audio_played = true;  // Mark audio as played
    this.audio_playing = true; // Set playing state to true
  }

  pause_audio(io) {
    this.audio_playing = false; // Set playing state to false
    if (io.pause) {
      io.pause(); // Invoke external pause callback if provided
    }
  }

  end_audio(io) {
    this.audio_ended = true; // Mark audio as ended
    if (io.end) {
      io.end();  // Invoke external end callback if provided
    }
  }

  update_level(io, level) {
    if (this.audio && this.audio_playing && io.update) {
      io.update(level);  // Invoke update callback with current audio level
    }
  }

  // Initializes and sets up the audio processing chain
  async initialize() {
    const empty_mp3 = this.create_empty_mp3();
    this.audio.src = empty_mp3;
    await this.audio.play();
    this.audio.pause();
    await this.init_media();
    this.initialized = true; // Mark this instance as initialized
    this.render(); // Begin rendering loop for audio analysis
  }

  // Generates an empty MP3 file as a placeholder
  create_empty_mp3() {
    // Base64 encoded empty MP3 file
    const base64 = "SUQzBAAAAAACPFRYWFgAAAAYAAADVFNTAExvZ2ljIFBybyBYIDEwLjUuMABUWFhYAAAAZQAAA2lUdW5OT1JNACAwMDAwMTI3OCAwMDAwMTE3MiAwMDAxMTNDMSAwMDAxMUJGRiAwMDAwREVGNSAwMDAwNDgwQSAwMDAwN0ZGMSAwMDAwN0ZGMSAwMDAxMkQzOSAwMDAwQTM5MgBUWFhYAAAAfwAAA2lUdW5TTVBCACAwMDAwMDAwMCAwMDAwMDIxMCAwMDAwMDk2OCAwMDAwMDAwMDAwNDJGNjg4IDAwMDAwMDAwIDAwM0NBNjg4IDAwMDAwMDAwIDAwMDAwMDAwIDAwMDAwMDAwIDAwMDAwMDAwIDAwMDAwMDAwIDAwMDAwMDAwAFRTU0UAAAAOAAADTGF2ZjYxLjEuMTAwAAAAAAAAAAAAAAD/+1AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABJbmZvAAAADwAAAAIAAAGhAL+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7///////////////////////////////////////////////////////////////////wAAAABMYXZjNjEuMy4AAAAAAAAAAAAAAAAkBeMAAAAAAAABoRDTgUIAAAAAAAAAAAAAAAAAAAAA//sQZAAP8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAETEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+xJkIg/wAABpAAAACAAADSAAAAEAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVU=";
    const raw = window.atob(base64);
    const binary = new Uint8Array(new ArrayBuffer(raw.length));

    // Convert base64 to binary data
    for (let i = 0; i < raw.length; i++) {
      binary[i] = raw.charCodeAt(i);
    }

    // Create a Blob with type 'audio/mp3' and convert it to a URL
    const blob = new Blob([binary], { type: 'audio/mp3' });
    return URL.createObjectURL(blob);
  }

  // Setup audio stream from URL or user media
  async init_media(audio_source) {
    try {
      // Load audio from URL if provided
      if (this.url) {
        audio_source = await this.load_url();
      } else if (!audio_source) {
        // Request user media if no source provided
        audio_source = await navigator.mediaDevices.getUserMedia(this.constraints);
      } else {
        // Assume audio_source is an existing stream
      }
      this.init_audio(audio_source); // Initialize audio context and nodes
    } catch (error) {
      console.error('Error initializing audio:', error); // Log any initialization errors
    }
  }

  // Load audio from a specified URL
  load_url() {
    return new Promise((resolve) => {
      this.audio.src = this.url; // Set audio source from URL

      // Resolve the promise once audio is ready to play
      this.audio.oncanplay = () => resolve(this.audio);

      // Attach event handlers for media state changes
      this.audio.onplaying = this.start;
      this.audio.onpause = this.pause;
      this.audio.onended = this.end;

      // Start and immediately pause the audio to trigger events
      this.audio.play();
      this.audio.pause();
    });
  }

  // Initialize the audio processing chain using Web Audio API
  init_audio(audio_source) {
    // Create a new audio context to process audio data
    this.audio_context = new window.AudioContext();
    // Create an analyser node to perform audio frequency analysis
    this.analyser = this.audio_context.createAnalyser();

    // Set up analyser to capture frequency bin data
    this.buffer_length = this.analyser.frequencyBinCount;
    this.data_array = new Uint8Array(this.buffer_length);

    // Create and set up a media source node linked to the audio element
    this.source = new MediaElementAudioSourceNode(this.audio_context, { mediaElement: audio_source });

    // Connect the source to the analyser, then to the audio output (speakers)
    this.source.connect(this.analyser);
    this.analyser.connect(this.audio_context.destination);
  }

  // Main function responsible for rendering updates
  render() {
    if (this.audio_ended) return; // Exit if audio session has ended
    if (!this.initialized) return requestAnimationFrame(() => this.render()); // Ensure initialization complete

    // Check and execute any timeline actions as per current time
    if (this.should_execute_timeline_action()) {
      this.execute_timeline_action();
    }

    // Obtain and process audio frequency data to adjust rendering
    this.update_audio_frequency();
    requestAnimationFrame(() => this.render()); // Continue the render loop
  }

  // Check if any action in the timeline should be executed
  should_execute_timeline_action() {
    return this.timeline.length > 0 &&
           this.timeline[this.timeline_id] &&
           this.audio_playing &&
           this.audio.currentTime >= this.timeline[this.timeline_id]?.time;
  }

  // Execute the current timeline action and proceed to the next
  execute_timeline_action() {
    if (this.timeline[this.timeline_id]) {
      this.timeline[this.timeline_id].action(); // Perform the action
      this.timeline_id++; // Move to the next timeline action
    }
  }

  // Update and process audio frequency data for analysis
  update_audio_frequency() {
    // Retrieve current frequency data from the analyser
    this.analyser.getByteFrequencyData(this.data_array);

    // Calculate the average audio level from frequency data
    let average = this.data_array.reduce((acc, val) => acc + val, 0) / this.buffer_length;
    let audio_level = average / 255;  // Normalize level to a value between 0 and 1

    // Use the audio level to update visual/sound elements via the update method
    this.update(audio_level);
  }
}

export { emotile as default };
