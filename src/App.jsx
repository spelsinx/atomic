/** @jsx atomic.createElement */
/** In the comment above we are telling babel which function it should
use the default is React.createElement and we want to use
our own createElement function*/

// NEED TO IMPORT!!!
import atomic from "atomic-nodejs";
import { Welcome } from "./Welcome.jsx";

// imports and renders the Welcome.
atomic.render(Welcome, document.body);

// class component example.
class LikeButton extends atomic.Component {
  constructor(props) {
    super(props);
    this.state = { liked: false };
  }

  render() {
  	const { liked } = this.state;
      if(liked) {
 return console.log("You liked this."), alert("Like! :)")
 }

    return (
     <button onClick={() => {
 this.setState({ liked: true }) }}>
        Like
      </button> 
    );
  }
} 

// actually, everything is almost like in React.
let domContainer = document.getElementById("app"); // container defines for render.
atomic.render(<LikeButton />, domContainer); // renders the component to app section.