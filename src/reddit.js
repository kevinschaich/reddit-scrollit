const addButton = () => {
  var button = document.createElement("BUTTON");
  button.id = "scroll-to-next-top-comment";
  button.innerHTML = '<span class="chevron top"></span>';
  button.onclick = handleButtonClick;
  document.body.appendChild(button);
};

const handleButtonClick = () => {
  const comments = getTopLevelComments();
  const current = window.scrollY;

  for (comment of comments) {
    if (comment.top - 100 > current) {
      comment.classList.add("scrolled-comment");
      setTimeout(() => {
        comment.classList.remove("scrolled-comment");
      }, 2000);
      return scrollToHeight(comment.top - 50);
    }
  }

  scrollToBottom();
  return setTimeout(function() {
    handleButtonClick();
  }, 500);
};

const scrollToHeight = height => {
  window.scrollTo(0, height);
};

const scrollToBottom = () => {
  window.scrollTo(0, document.body.scrollHeight);
};

const getOffset = elem => {
  const rect = elem.getBoundingClientRect();
  return { left: rect.left + window.scrollX, top: rect.top + window.scrollY };
};

const getTopLevelComments = () => {
  const topLevelComments = [...document.body.querySelectorAll(".Comment.top-level")];
  let comments = topLevelComments.map(elem => {
    return { top: getOffset(elem).top, classList: elem.classList };
  });
  comments.sort((a, b) => a.top - b.top);
  return comments;
};

addButton();
