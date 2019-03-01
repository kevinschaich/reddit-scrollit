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
    } else {
      document.documentElement.scrollTop = amount;
      document.body.parentNode.scrollTop = amount;
      document.body.scrollTop = amount;
    }
  }
  function position() {
    return (
      (overlayScrollContainer && overlayScrollContainer.scrollTop) ||
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
  // only add the button on a post comments page (not the Reddit homepage)
  if (document.URL.includes("comments")) {
    const button = document.createElement("BUTTON");
    button.id = "scroll-to-next-top-comment";
    button.onclick = handleButtonClick;
    button.innerHTML = '<span class="chevron top"></span>';
    document.body.appendChild(button);
  }
};

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

const handleButtonClick = () => {
  // get the set of top-level comments on the page
  refreshTopLevelComments();

  const overlayScrollContainer = document.body.querySelector("#overlayScrollContainer");
  const current = overlayScrollContainer ? overlayScrollContainer.scrollTop : window.scrollY;
  const commentPaddingTop = overlayScrollContainer ? overlayScrollContainer.getBoundingClientRect().top + 60 : 60;
  const threshold = 15;

  // if we find a top-level comment that's below our current scroll position, scroll to it
  for (comment of window.topLevelComments) {
    if (comment.top > current + commentPaddingTop + threshold) {
      console.log("SCROLLING");
      return scrollTo(comment.top - commentPaddingTop, () => updateCommentStyling(comment));
    }
  }

  return scrollTo((overlayScrollContainer && overlayScrollContainer.scrollHeight) || document.body.scrollHeight);
};

const getOffset = elem => {
  const overlayScrollContainer = document.body.querySelector("#overlayScrollContainer");
  const parentX = overlayScrollContainer ? overlayScrollContainer.scrollLeft : window.scrollX;
  const parentY = overlayScrollContainer ? overlayScrollContainer.scrollTop : window.scrollY;

  const rect = elem.getBoundingClientRect();

  // offset the bounding box's position with the current page scroll position
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
