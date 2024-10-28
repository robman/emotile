import { default as emotile } from '/emotile.js';

// Cache DOM elements for reuse
const divs = [document.getElementById('box2')];
const start_div = document.getElementById('start');
const boxes_div = document.getElementById('boxes');
const end_div = document.getElementById('end');
const message_container = document.getElementById('messages');
const messages = message_container.querySelectorAll('span');

// Helper function to manage DOM class changes
function toggle_class(element, class_name, should_add) {
  if (should_add) {
    element.classList.add(class_name);
  } else {
    element.classList.remove(class_name);
  }
}

// Set initial visibility state for start button
toggle_class(start_div, 'oof', false);

// Function to uniformly scale div elements
function set_scale(scale_value) {
  divs.forEach((div) => {
    div.style.transform = `scale(${scale_value})`;
  });
}

// Instantiate emotile object with necessary configuration
const emotile_instance = new emotile({
  url: 'https://awe.media/funkit.mp3', // By https://audiojungle.net/user/stocksounds
  start: () => {}, // Placeholder for potential startup logic
  update: (level) => {
    // Control scaling based on audio level
    set_scale(level * 2);
  },
  end: async () => {
    await wait(500); // Small delay before showing the end div
    toggle_class(end_div, 'hidden', false);
    toggle_class(end_div, 'oof', false);
  },
  timeline: create_timeline() // Separate function handling
});

// Helper function to generate timeline configuration
function create_timeline() {
  return [
    {
      time: 8,
      action: () => {
        set_scale(0.75);
        divs.splice(0, divs.length, document.getElementById('box1')); // Replace elements in place
      }
    },
    {
      time: 18,
      action: () => {
        set_scale(0.75);
        divs.splice(0, divs.length, document.getElementById('box3'));
      }
    },
    {
      time: 27,
      action: () => {
        boxes_div.animate([{ rotate: '0deg' }, { rotate: '359deg' }], { duration: 4000, iterations: 3 });
      }
    },
    {
      time: 36,
      action: () => {
        divs.splice(0, divs.length,
          document.getElementById('box1'),
          document.getElementById('box2'),
          document.getElementById('box3'));
      }
    },
    {
      time: 45,
      action: () => {
        boxes_div.animate([{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(359deg)' }], { duration: 4000, iterations: 2 });
      }
    },
    {
      time: 54,
      action: () => {
        boxes_div.animate([{ rotate: '0deg' }, { rotate: '-359deg' }], { duration: 2000, iterations: 6 });
      }
    },
    {
      time: 76,
      action: () => {
        divs.forEach((div) => {
          div.animate([{ rotate: '0deg' }, { rotate: '-35deg' }, { rotate: '0deg' }, { rotate: '35deg' }], { duration: 1000, iterations: Infinity });
        });
      }
    },
  ];
}

// Function to initialize and start the interaction
async function start() {
  // Clear event assignments used for starting the sequence
  start_div.ontouchstart = null;
  start_div.onclick = null;

  // Hide start button by setting 'oof' class
  toggle_class(start_div, 'oof', true);

  await emotile_instance.initialize(); // Make sure there's no promises or awaits before this call!

  // Define actions that coincide with message reveal
  const message_actions = [
    async () => {
      toggle_class(boxes_div, 'hidden', false);
      toggle_class(boxes_div, 'oof', false);
      document.getElementById('box2').style.transform = 'scale(1)';
    },
    async () => {
      const box2 = document.getElementById('box2');
      toggle_class(box2, 'corners', true);
      await wait(500);
      toggle_class(box2, 'box_shadow', true);
    },
    () => {
      const box2 = document.getElementById('box2');
      toggle_class(box2, 'grey', false);
      toggle_class(box2, 'green', true);
    },
  ];

  // Reveal and cycle through messages with corresponding actions
  toggle_class(message_container, 'hidden', false);

  for (let i = 0; i < messages.length; i++) {
    toggle_class(messages[i], 'oof', false);
    if (i > 0) toggle_class(messages[i - 1], 'oof', true);
    await wait(1000);
    if (message_actions[i]) {
      await message_actions[i]();
    }
    await wait(2000);
  }
  toggle_class(messages[messages.length - 1], 'oof', true);
  toggle_class(message_container, 'hidden', true);

  // Initiate audio play when setup sequence concludes
  emotile_instance.audio.play();
}

// Bind event handler for user interaction start
if ('ontouchstart' in window) {
  start_div.ontouchstart = start;
} else {
  start_div.onclick = start;
}

// Utility function to wait for specified duration
function wait(duration = 1000) {
  return new Promise(resolve => setTimeout(resolve, duration));
}
