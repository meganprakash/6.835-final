/*

calibration.js

Backend logic for setting calibration information and returning measurements
during gameplay.

Depth calibration is done by recording shoulder width at 4ft and at 8ft.
Shoulder width is inversely proportional to distance. Return depth
in terms of % distance between min and max shoulder width.

Volume calibration is by asking user to say "Hello, my name is ____" at
their normal speaking volume from 4ft. Volume is inversely proportional
to the square of distance. Measure volume in terms of % of speaking volume.

 */

// need to collect shoulder width over 2 seconds and find geometric mean!!