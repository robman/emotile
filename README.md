# emotile
Turn sounds into motion & emotion

**emotile.js** is a dynamic JavaScript library designed to transform audio signals into engaging visual experiences by linking sound with motion and emotion in web applications. It leverages the Web Audio API to seamlessly interact with audio data, allowing developers to create customized animations based on audio levels — great for music visualizations, creative projects, or interactive applications.

## Table of Contents
- [Features](#features)
- [Getting Started](#getting-started)
- [Usage](#usage)
  - [Initialization](#initialization)
  - [Callbacks and Timeline Actions](#callbacks-and-timeline-actions)
  - [Example](#example)
- [Contributing](#contributing)
- [License](#license)

## Features
- **Audio Level Visualization:** Real-time updates based on audio's frequency data for synchronized animations.
- **Customizable Timeline:** Execute specific actions at designated points in the audio timeline.
- **Event Callbacks:** Lifecycle callbacks (`start`, `update`, and `end`) to tailor behavior based on audio state.
- **Audio Source Flexibility:** Use local or external audio sources, including live user media input.

## Getting Started
To try `emotile.js` for yourself.

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/robman/emotile.js.git
   ```

2. **Install the dependencies:**
   ```plaintext
   npm install 
   ```

3. **Run the server:**
   ```plaintext
   node server.js $YOUR_IP
   ```

Now you can open and test files like `/examples/mp3-02.html` in your browser.


To integrate **emotile.js** into your web project:

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/robman/emotile.js.git
   ```

2. **Add the `emotile.js` file to your project directory:**
   ```plaintext
   /emotile.js
   ```

3. **Import `emotile.js` in your HTML or JavaScript file:**
   ```javascript
   import { default as emotile } from './emotile.js';
   ```

## Usage

### Initialization
Create an instance of `emotile` by providing a configuration object with options for audio source and callback functions:

```javascript
const emotile_instance = new emotile({
  url: 'https://example.com/audio.mp3', // Provide your audio URL here
  start: () => { console.log('Audio started') }, // Optional - Executes when audio begins
  update: (level) => { /* Use level for animations */ },
  end: () => { console.log('Audio ended') }, // Optional - Executes when audio ends
  timeline: [ // Optional - Handle events based on the playback time
    {
      time: 10, // Execute action at 10 seconds
      action: () => { console.log('Timeline action at 10s') }
    }
    // Add more timeline actions as desired
  ]
});
```

### Callbacks and Timeline Actions

- **Start Callback:** Function executed when the audio starts playing.
- **Update Callback:** Continuous callback providing normalized audio level data (`0 - 1`), for use in animations.
- **End Callback:** Function executed when the audio finishes playing.
- **Timeline Actions:** Predefined actions triggered at specific timestamps during audio playback.

### Example

Below is an example that demonstrates setting up a basic HTML page using `emotile.js` for audio-based dynamic effects:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>emotile.js Example</title>
  <style>
    #start { cursor: pointer; }
    .hidden { display: none; }
    /* Additional styles for elements */
  </style>
</head>
<body>
  <div id="start">Click to Start</div>
  <div id="box1" class="visual-element"></div>
  <script type="module">
    import { default as emotile } from './emotile.js';

    const start_div = document.getElementById('start');
    const visual_element = document.getElementById('box1');

    const emotile_instance = new emotile({
      url: 'https://example.com/your-audio.mp3',
      start: () => { console.log('Playing') },
      update: (level) => {
        visual_element.style.transform = `scale(${level * 2})`;
      },
      end: async () => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        alert('Audio Finished');
      },
      timeline: [
        {
          time: 5,
          action: () => { visual_element.style.backgroundColor = 'green'; }
        }
      ]
    });

    start_div.onclick = async () => {
      await emotile_instance.initialize();
      emotile_instance.audio.play();
    };
  </script>
</body>
</html>
```

## Contributing
Contributions are welcome! If you'd like to contribute to emotile.js, please fork the repository and create a pull request with your improvements or bug fixes.

## License
This project is licensed under the GPL License. See the [LICENSE](LICENSE) file for details.
