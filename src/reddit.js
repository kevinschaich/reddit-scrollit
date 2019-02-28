////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// start https://gist.github.com/james2doyle/5694700
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// easing functions http://goo.gl/5HLl8
Math.easeInOutQuad = function(t, b, c, d) {
  t /= d / 2;
  if (t < 1) {
    return (c / 2) * t * t + b;
  }
  t--;
  return (-c / 2) * (t * (t - 2) - 1) + b;
};

Math.easeInCubic = function(t, b, c, d) {
  var tc = (t /= d) * t * t;
  return b + c * tc;
};

Math.inOutQuintic = function(t, b, c, d) {
  var ts = (t /= d) * t,
    tc = ts * t;
  return b + c * (6 * tc * ts + -15 * ts * ts + 10 * tc);
};

// requestAnimationFrame for Smart Animating http://goo.gl/sx5sts
var requestAnimFrame = (function() {
  return (
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    function(callback) {
      window.setTimeout(callback, 1000 / 60);
    }
  );
})();

function scrollTo(to, callback, duration) {
  const overlayScrollContainer = document.body.querySelector("#overlayScrollContainer");

  // because it's so fucking difficult to detect the scrolling element, just move them all
  function move(amount) {
    if (overlayScrollContainer) {
      overlayScrollContainer.scrollTop = amount;
    }
    document.documentElement.scrollTop = amount;
    document.body.parentNode.scrollTop = amount;
    document.body.scrollTop = amount;
  }
  function position() {
    return (
      // (overlayScrollContainer ? overlayScrollContainer.scrollTop : undefined) ||
      document.documentElement.scrollTop ||
      document.body.parentNode.scrollTop ||
      document.body.scrollTop
    );
  }
  var start = position(),
    change = to - start,
    currentTime = 0,
    increment = 20;
  duration = typeof duration === "undefined" ? 500 : duration;
  var animateScroll = function() {
    // increment the time
    currentTime += increment;
    // find the value with the quadratic in-out easing function
    var val = Math.easeInOutQuad(currentTime, start, change, duration);
    // move the document.body
    move(val);
    // do the animation unless its over
    if (currentTime < duration) {
      requestAnimFrame(animateScroll);
    } else {
      if (callback && typeof callback === "function") {
        // the animation is done so lets callback
        callback();
      }
    }
  };
  animateScroll();
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// end https://gist.github.com/james2doyle/5694700
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const removeButton = () => [...document.body.querySelectorAll("#scroll-to-next-top-comment")].forEach(e => e.remove());

const addButton = () => {
  // set up our button
  const button = document.createElement("BUTTON");
  button.id = "scroll-to-next-top-comment";
  button.onclick = handleButtonClick;
  button.innerHTML = '<span class="chevron top"></span>';

  // only add the button on a post comments page (not the Reddit homepage)
  if (document.URL.includes("comments")) {
    document.body.appendChild(button);
  }
};

const SCROLL_PADDING = 50;

const updateCommentStyling = comment => {
  // get to a fresh page state
  [...document.body.querySelectorAll(".scrolled-comment")].forEach(e => e.classList.remove("scrolled-comment"));
  clearTimeout(window.scrolledCommentTimeout);

  // highlight our target comment in blue
  comment.classList.add("scrolled-comment");

  // fade out after 1s
  window.scrolledCommentTimeout = setTimeout(() => {
    comment.classList.remove("scrolled-comment");
  }, 1000);
};

const handleButtonClick = (e, i = 0) => {
  // don't try more than 5 times (slow network connections, errors, etc.)
  if (i < 5) {
    // get the initial set of top-level comments on the page
    if (!window.topLevelComments) {
      refreshTopLevelComments();
    }
    const current = window.scrollY;

    // if we find a top-level comment that's below our current scroll position, scroll to it
    for (comment of window.topLevelComments) {
      if (comment.top - SCROLL_PADDING * 1.25 > current) {
        return scrollTo(comment.top - SCROLL_PADDING, () => updateCommentStyling(comment), 250);
      }
    }

    // if we haven't reached the next comment, scroll to the bottom to auto-reload more comments
    scrollTo(document.body.scrollHeight, () => {}, 250);
    refreshTopLevelComments();

    // if we STILL haven't reached the next comment, wait a bit longer and try again
    return setTimeout(() => {
      handleButtonClick(e, i + 1);
    }, (i + 1) * 500);
  }
};

const getOffset = elem => {
  const parentX = window.scrollX;
  const parentY = window.scrollY;

  // offset the bounding box's position with the current page scroll position
  const rect = elem.getBoundingClientRect();
  return { left: rect.left + parentX, top: rect.top + parentY };
};

const refreshTopLevelComments = () => {
  const topLevelComments = [...document.body.querySelectorAll(".Comment.top-level")];

  // get the position of the comments & sort them
  const comments = topLevelComments
    .map(elem => {
      return { top: getOffset(elem).top, classList: elem.classList };
    })
    .sort((a, b) => a.top - b.top);

  // store in window to save memory & persist between button clicks
  window.topLevelComments = comments;
};

const observer = new MutationObserver(mutations => {
  // https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver
  mutations.forEach(mutation => {
    removeButton();
    addButton();
  });
});

// listen for page changes so we only display the button on non-comment pages
observer.observe(document.body, { attributes: true, childList: false });

// need to manually call this once for page load
addButton();
