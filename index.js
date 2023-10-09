const expandButton = document.getElementsByClassName('expand-button')[0];
const expandTooltip = document.getElementsByClassName('expand-tooltip')[0];

expandButton.onmouseover = function () {
  expandTooltip.style.display = 'block';
};
expandButton.onmouseout = function () {
  expandTooltip.style.display = 'none';
};

const avatar = document.getElementsByClassName('avatar')[0];
avatar.onmouseover = function () {
  expandTooltip.style.display = 'block';
  expandTooltip.style.right = '8px';
  expandTooltip.innerHTML = 'Vincent Mai' + '&#10;' + 'minhmv249@gmail.com';
}
avatar.onmouseout = function () {
  expandTooltip.style.display = 'none';
  expandTooltip.style.right = '14px';
  expandTooltip.innerHTML = 'Recommended apps';
};

const expandWrapper = document.getElementsByClassName('expand-wrapper')[0];
expandButton.onclick = function () {
  if (expandWrapper.style.display === "block") {
    expandWrapper.style.display = "none";
  } else {
    expandWrapper.style.display = "block";
  }
}

window.addEventListener('click', function (event) {
  if (!expandWrapper.contains(event.target) && !expandButton.contains(event.target)) {
    expandWrapper.style.display = 'none';
  }
});

const menuItemNames = [
  'My accounts', 'Gmail',
  'Drive', 'Doc',
  'Sheet', 'Colab',
  'Calendar', 'Chat',
  'Meet', 'Leetcode',
  'Stackoverflow', 'AWS',
  'VSCode', 'Youtube',
  'Facebook'
]

const expandMenuItems = document.getElementsByClassName('expand-item');
const expandMenu = document.getElementsByClassName('expand-list')[0];
const expandMenuTooltip = document.getElementsByClassName('dropdown-tooltip')[0];

for(const expandMenuItem of expandMenuItems) {
  expandMenuItem.onmouseover = function (event) {
    const index = Array.from(expandMenu.getElementsByTagName('li')).indexOf(expandMenuItem);
    expandMenuTooltip.style.display = 'block';
    expandMenuTooltip.innerHTML = menuItemNames[index];
    const left  = event.clientX  + "px";
    const top  = event.clientY  + "px";
    console.log(left, top)
    expandMenuTooltip.style.left = left;
    expandMenuTooltip.style.top = top;
  }
  expandMenuItem.onmouseout = function () {
    expandMenuTooltip.style.display = 'none';
  }
}

const searchInput = document.getElementById('search');
searchInput.onkeydown = function (event) {
  if(event.keyCode === 13) {
    window.location.href = `https://www.google.com/search?q=${searchInput.value}`
  }
}
