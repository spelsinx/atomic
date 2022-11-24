/** @jsx atomic.createElement */
/** In the comment above we are telling babel which function it should
use the default is React.createElement and we want to use
our own createElement function*/

// NEED TO IMPORT!!!
import atomic from "atomic-nodejs";

let Welcome = <h1 align="center">Welcome!</h1>;

export { Welcome };