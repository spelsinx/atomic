const TEXT_ELEMENT = "TEXT";

/**
 * @param {string} type - the node type
 * @param {?object} configObject - the props
 * @param  {?...any} args - the children array
 * @returns {object} - to be called by atomic.render
 */
function createElement(type, configObject, ...args) {
  const props = Object.assign({}, configObject);
  const hasChildren = args.length > 0;
  const nodeChildren = hasChildren ? [...args] : [];
  props.children = nodeChildren
    .filter(Boolean)
    .map(c => (c instanceof Object ? c : createTextElement(c)));

  return { type, props };
}

/**
 * @param {string} nodeValue - the text of the node
 * @returns {object} - a call to createElement
 */
function createTextElement(nodeValue) {
  return createElement(TEXT_ELEMENT, { nodeValue });
}

/**
 * @param {HTMLElement} dom - the html element where props get applied to
 * @param {object} props - consists of both attributes and event listeners.
 */
function updateDomProperties(dom, prevProps, nextProps) {
  const isEvent = name => name.startsWith("on");
  const isAttribute = name => !isEvent(name) && name != "children";

  // Remove event listeners
  Object.keys(prevProps)
    .filter(isEvent)
    .forEach(name => {
      const eventType = name.toLowerCase().substring(2);
      dom.removeEventListener(eventType, prevProps[name]);
    });

  // Remove attributes
  Object.keys(prevProps)
    .filter(isAttribute)
    .forEach(name => {
      dom[name] = null;
    });

  // Set attributes
  Object.keys(nextProps)
    .filter(isAttribute)
    .forEach(name => {
      dom[name] = nextProps[name];
    });

  // Add event listeners
  Object.keys(nextProps)
    .filter(isEvent)
    .forEach(name => {
      const eventType = name.toLowerCase().substring(2);
      dom.addEventListener(eventType, nextProps[name]);
    });
}

const ENOUGH_TIME = 1; // we set ours to 1 millisecond.

let workQueue = []; // there is no work initially
let nextUnitOfWork = null; // the nextUnitOfWork is null on initial render.
let pendingCommit = null;
const CLASS_COMPONENT = "class";
const HOST_ROOT = "root";
const HOST_COMPONENT = "host";

// code..

function render(elements, containerDom) {
  workQueue.push({
    from: HOST_ROOT, // the root/parent fiber
    dom: containerDom, // document.getElementById("app") just a dom node where this fiber will be appended to as a child
    newProps: { children: elements }
  });
  requestIdleCallback(performWork);
}

function performWork(deadline) {
  if (!nextUnitOfWork) {
    // on initial render
    // or if all work is complete and the nextUnitOfWork is null
    //grab the first item on the workInProgress queue.
    initialUnitOfWork();
  }
  loopThroughWork(deadline);
  if (nextUnitOfWork || workQueue.length > 0) {
    // if theres more work to be done. get to know when the browser will be occupied
    // and check if we can perform some work with the timing provided.
    requestIdleCallback(performWork);
  }
  if (pendingCommit) {
    commitAllWork(pendingCommit);
  }
}

function initialUnitOfWork() {
  //grab the first item in the array
  // its a first come first serve scenario.
  const update = workQueue.shift();

  // if there are no updates pending
  // abort since there is no work to do.
  if (!update) {
    return;
  }

  // this call will apply if the update came from setState
  // we need the object passed in this.setState to the
  // partialState of the current fiber
  if (update.partialState) {
    update.instance.__fiber.partialState = update.partialState;
  }

  const root =
    update.from === HOST_ROOT
      ? update.dom._rootContainerFiber
      : getRootNode(update.instance.__fiber);

  nextUnitOfWork = {
    tag: HOST_ROOT,
    stateNode: update.dom || root.stateNode, // the properties from the update are checked first for existence
    props: update.newProps || root.props, // if the update properties are missing default back to the root properties
    alternate: root
  };
}

function getRootNode(fiber) {
  // climb up the fiber until we find its parentNode.
  let node = fiber;
  while (node.parent) {
    // as long as the current node has a parent keep climbing up
    // until node.parent is null.
    node = node.parent;
  }
  return node;
}

function loopThroughWork(deadline) {
  while (nextUnitOfWork && deadline.timeRemaining() > ENOUGH_TIME) {
    /**
     * perform unitofwork on a fiber if there's enough time to spare
     * from the browser's end.
     */
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
  }
}

function scheduleUpdate(instance, partialState) {
  workQueue.push({
    from: CLASS_COMPONENT,
    instance: instance,
    partialState: partialState
  });
  requestIdleCallback(performWork);
}

function performUnitOfWork(wipFiber) {
  // lets work on the fiber
  beginWork(wipFiber);
  if (wipFiber.child) {
    // if a child exists its passed on as
    // the nextUnitOfWork
    return wipFiber.child;
  }

  // No child, we call completeWork until we find a sibling
  let uow = wipFiber;
  while (uow) {
    completeWork(uow); // completework on the currentFiber
    // return the siblings of the currentFiber to
    // be the nextUnitOfWork
    if (uow.sibling) {
      // Sibling needs to beginWork
      return uow.sibling;
    }
    // if no siblings are present,
    // lets climb up the tree as we call completeWork
    // when no parent is found / if we've reached the top,
    // this function returns null and thats how we know that we have completed
    // working on the work in progress tree.
    uow = uow.parent;
  }
}

function beginWork(wipFiber) {
  if (wipFiber.tag == CLASS_COMPONENT) {
    updateClassFiber(wipFiber);
  } else {
    updateHostFiber(wipFiber);
  }
}

function updateHostFiber(wipFiber) {
  if (!wipFiber.stateNode) {
    // if this is the initialRender and stateNode is null
    // create a new node.
    wipFiber.stateNode = createDomElement(wipFiber);
  }
  const newChildElements = wipFiber.props.children;
  reconcileChildrenArray(wipFiber, newChildElements);
}

function updateClassFiber(wipFiber) {
  let instance = wipFiber.stateNode;
  if (instance == null) {
    // if this is the initialRender call the constructor
    instance = wipFiber.stateNode = createInstance(wipFiber);
  } else if (wipFiber.props == instance.props && !wipFiber.partialState) {
    // nothing has changed here
    // lets clone the children since
    // we know that they also do not change
    cloneChildFibers(wipFiber);
    return;
  }

  instance.props = wipFiber.props;
  instance.state = Object.assign({}, instance.state, wipFiber.partialState);
  wipFiber.partialState = null;

  const newChildElements = wipFiber.stateNode.render();
  reconcileChildrenArray(wipFiber, newChildElements);
}

function createInstance(fiber) {
  //similar to the previous implementation
  // we instanciate a new object of the class provided in the
  // type prop and return the new instance
  const instance = new fiber.type(fiber.props);
  instance.__fiber = fiber;
  return instance;
}

function createDomElement(fiber) {
  // check the type of the fiber object.
  const isTextElement = fiber.type === TEXT_ELEMENT;
  const dom = isTextElement
    ? document.createTextNode("")
    : document.createElement(fiber.type);
  updateDomProperties(dom, [], fiber.props);
  return dom;
}

const PLACEMENT = "PLACEMENT"; // this is for a child that needs to be added
const DELETION = "DELETION"; //for a child that needs to be deleted.
const UPDATE = "UPDATE"; // for a child that needs to be updated. refresh the props

function createArrayOfChildren(children) {
  return !children ? [] : Array.isArray(children) ? children : [children];
}

function reconcileChildrenArray(wipFiber, newChildElements) {
  const elements = createArrayOfChildren(newChildElements);

  let index = 0;
  // let the oldFiber point to the fiber thats been rendered in the
  // dom if its present. if its initialRender then return null.
  let oldFiber = wipFiber.alternate ? wipFiber.alternate.child : null;
  let newFiber = null;
  while (index < elements.length || oldFiber != null) {
    const prevFiber = newFiber;
    // we wither get an element or false back in this check.
    const element = index < elements.length && elements[index];

    // if the type of the old fiber is the same as the new fiber
    // we just need to update this fiber
    // its the same check as the one we had in the previous
    // reconciliation algorithm
    const sameType = oldFiber && element && element.type == oldFiber.type;

    if (sameType) {
      // on an update the only new thing that gets
      // changed is the props of the fiber
      // I should have spread this but for easier
      // understading and so that we understand where everything
      // goes, Ill do what seemengly seems
      //like im repeating myself.
      newFiber = {
        type: oldFiber.type,
        tag: oldFiber.tag,
        stateNode: oldFiber.stateNode,
        props: element.props,
        parent: wipFiber,
        alternate: oldFiber,
        partialState: oldFiber.partialState,
        effectTag: UPDATE
      };
    }

    if (element && !sameType) {
      // this is when an element wasn't present
      // before but is now present.
      newFiber = {
        type: element.type,
        tag:
          typeof element.type === "string" ? HOST_COMPONENT : CLASS_COMPONENT,
        props: element.props,
        parent: wipFiber,
        effectTag: PLACEMENT
      };
    }

    if (oldFiber && !sameType) {
      // in this check  we see its when a component
      // was present, but is now not present.
      // like a deleted to do list.
      oldFiber.effectTag = DELETION;
      wipFiber.effects = wipFiber.effects || [];
      // we need to keep a reference of what gets deleted
      // here we add the fiber to be deleted onto the effects array.
      // we'll work with the effects later on in the commit stages.
      wipFiber.effects.push(oldFiber);
    }

    if (oldFiber) {
      // we are only interested in the siblings of the
      // children that are in the same level here
      // tree level here
      // in other terms we just need the siblings of the array.
      oldFiber = oldFiber.sibling;
    }

    if (index == 0) {
      wipFiber.child = newFiber;
    } else if (prevFiber && element) {
      prevFiber.sibling = newFiber;
    }

    index++;
  }
}

function cloneChildFibers(parentFiber) {
  const oldFiber = parentFiber.alternate;
  // if there is no child for the alternate
  // there's no more work to do
  // so just kill the execution
  if (!oldFiber.child) {
    return;
  }

  let oldChild = oldFiber.child;
  // on initial render, the prevChild is null.
  let prevChild = null;
  /**
   * below we are essencially looping through all the siblings
   * so that can give them their new parent which is the workInProgress fiber
   * the other properties are hard coded as well.
   * I could have spread them but for understanding of the
   * structure given, We are going to spread them here.
   */
  while (oldChild) {
    const newChild = {
      type: oldChild.type,
      tag: oldChild.tag,
      stateNode: oldChild.stateNode,
      props: oldChild.props,
      partialState: oldChild.partialState,
      alternate: oldChild,
      parent: parentFiber
    };
    if (prevChild) {
      prevChild.sibling = newChild;
    } else {
      parentFiber.child = newChild;
    }
    prevChild = newChild;
    oldChild = oldChild.sibling;
  }
}

function completeWork(fiber) {
  // this function takes the list of effects of the children and appends them to the effects of
  // the parent
  if (fiber.tag == CLASS_COMPONENT) {
    // update the stateNode.__fiber of the
    // class component to the new wipFiber (it doesn't deserve this name anymore since we are done with the work we needed to do to it)
    fiber.stateNode.__fiber = fiber;
  }

  if (fiber.parent) {
    // append the fiber's child effects to the parent of the fiber
    // the effects of the childFiber
    // are appended to the fiber.effects
    const childEffects = fiber.effects || [];
    // if the effectTag is not present of this fiber, if there are none,
    // then return an empty list
    const thisEffect = fiber.effectTag != null ? [fiber] : [];
    const parentEffects = fiber.parent.effects || [];
    // the new parent effects consists of this current fiber's effects +
    // effects of this current Fiber + the parent's own effects
    fiber.parent.effects = parentEffects.concat(childEffects, thisEffect);
  } else {
    // if the fiber does not have a parent then it means we
    // are at the root. and ready to flush the changes to the dom.
    pendingCommit = fiber;
  }
}

function commitAllWork(fiber) {
  // this fiber has all the effects of the entire tree
  fiber.effects.forEach(f => {
    commitWork(f);
  });
  // the wip Fiber becomes the
  // currentFiber
  fiber.stateNode._rootContainerFiber = fiber;
  nextUnitOfWork = null; // no work is left to be done
  pendingCommit = null; // we have just flushed the changes to the dom.
}

function commitWork(fiber) {
  if (fiber.tag == HOST_ROOT) {
    return;
  }
  let domParentFiber = fiber.parent;
  while (domParentFiber.tag == CLASS_COMPONENT) {
    domParentFiber = domParentFiber.parent;
  }
  const domParent = domParentFiber.stateNode;
  if (fiber.effectTag == PLACEMENT && fiber.tag == HOST_COMPONENT) {
    // add the new element to the dom
    domParent.appendChild(fiber.stateNode);
  } else if (fiber.effectTag == UPDATE) {
    // update the dom properties of the element.
    updateDomProperties(fiber.stateNode, fiber.alternate.props, fiber.props);
  } else if (fiber.effectTag == DELETION) {
    // remove the node from the DOM its not needed
    commitDeletion(fiber, domParent);
  }
}

function commitDeletion(fiber, domParent) {
  // this function
  // removes the siblings of the current fiber
  // if a sibling is not present jump back to the parent
  // of the fiber. This is if the node is not equal to the fiber
  let node = fiber;
  while (true) {
    if (node.tag == CLASS_COMPONENT) {
      // check the child of the class component.
      // then loop back.
      node = node.child;
      continue;
    }
    domParent.removeChild(node.stateNode);
    while (node != fiber && !node.sibling) {
      // if there are no siblings jump back up to
      // to the node's parent.
      node = node.parent;
    }
    if (node == fiber) {
      return;
    }
    node = node.sibling;
  }
}

class Component {
  constructor(props) {
    this.props = props || {};
    this.state = this.state || {};
  }

  setState(partialState) {
    // we'll define this function in the reconciler.js file.
    scheduleUpdate(this, partialState);
  }
}

var atomic = {
  render,
  createElement,
  Component
};

export default atomic;
export { Component, createElement, render };
