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

const scrollTo = pos => {
  const overlayScrollContainer = document.body.querySelector("#overlayScrollContainer");

  // a modal is open from the homepage – handle offsets appropriately
  if (overlayScrollContainer) {
    overlayScrollContainer.scrollTo({ left: 0, top: pos || overlayScrollContainer.scrollHeight, behavior: "smooth" });
  }

  // otherwise, we're directly on a comments page and can just use document.body
  else {
    window.scrollTo({ left: 0, top: pos || document.body.scrollHeight, behavior: "smooth" });
  }
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
  let comments = topLevelComments.map(elem => {
    return { top: getOffset(elem).top, classList: elem.classList };
  });
  comments.sort((a, b) => a.top - b.top);

  // store in window to save memory & persist between button clicks
  window.topLevelComments = comments;
};

const handleButtonClick = (e, retries = 0) => {
  // setup constants & calculate current scroll position
  const scrollThreshold = 15;
  const overlayScrollContainer = document.body.querySelector("#overlayScrollContainer");
  const commentPaddingTop = overlayScrollContainer ? overlayScrollContainer.getBoundingClientRect().top + 60 : 60;
  const current = overlayScrollContainer ? overlayScrollContainer.scrollTop : window.scrollY;

  // load comments if we haven't yet
  if (window.topLevelComments == undefined) {
    refreshTopLevelComments();
  }

  // an unviewed comment is below the current scroll position (plus padding and a little wiggle room)
  const unviewedComments = window.topLevelComments.filter(
    comment => comment.top > current + commentPaddingTop + scrollThreshold
  );
  const firstUnviewedComment = unviewedComments.length > 0 ? unviewedComments[0] : undefined;

  // if we find a top-level comment that's below our current scroll position, scroll to it
  if (firstUnviewedComment) {
    const pos = firstUnviewedComment.top - commentPaddingTop;
    updateCommentStyling(firstUnviewedComment);
    return scrollTo(pos);
  }

  scrollTo();
  return refreshTopLevelComments();
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
