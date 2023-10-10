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

for (const expandMenuItem of expandMenuItems) {
  expandMenuItem.onmouseover = function (event) {
    const index = Array.from(expandMenu.getElementsByTagName('li')).indexOf(expandMenuItem);
    expandMenuTooltip.style.display = 'block';
    expandMenuTooltip.innerHTML = menuItemNames[index];
    const left = event.clientX + "px";
    const top = event.clientY + "px";
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
  if (event.keyCode === 13) {
    window.location.href = `https://www.google.com/search?q=${searchInput.value}`
  }
}

const appLinkQueries = [
  'https://stackoverflow.com/search?q=', 'https://github.com/search?q=', 'https://chat.openai.com/', 'https://www.reddit.com/search/?q=',
  'https://www.youtube.com/results?search_query=', 'https://open.spotify.com/search/', 'https://www.netflix.com/', 'https://store.steampowered.com/search/?term=',
]

const appLinks = [
  'https://stackoverflow.com/', 'https://github.com/', 'https://chat.openai.com/', 'https://www.reddit.com/',
  'https://www.youtube.com/', 'https://open.spotify.com/', 'https://www.netflix.com/', 'https://store.steampowered.com/',
]

const appList = document.getElementsByClassName('app-list')[0];
const appItems = document.getElementsByClassName('app-item');

for (const appItem of appItems) {
  appItem.onclick = function () {
    const index = Array.from(appList.getElementsByTagName('li')).indexOf(appItem);
    if (searchInput.value) {
      console.log(searchInput.value)
      window.location.href = appLinkQueries[index] + searchInput.value;
    }
    else {
      window.location.href = appLinks[index];
    }
  }
}

const micButton = document.getElementsByClassName('mic-button')[0];
const speechButton = document.getElementsByClassName('speech-icon')[0];
const speechContainer = document.getElementsByClassName('speech-container')[0];
const soundContainer = document.getElementsByClassName('sound-container')[0];
const exitSpeech = document.getElementsByClassName('exit-speech')[0];
const transcript = document.getElementById('transcript');

micButton.onclick = function () {
  speechContainer.style.display = 'block';
}

if ("webkitSpeechRecognition" in window) {
  let speechRecognition = new webkitSpeechRecognition();
  speechRecognition.continuous = true;
  speechRecognition.interimResults = true;
  speechRecognition.lang = 'en - US';
  let final_transcript = "";

  speechRecognition.onresult = (event) => {
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        final_transcript += event.results[i][0].transcript;
      }
    }
    transcript.innerHTML = final_transcript;
  }

  exitSpeech.onclick = function () {
    speechContainer.style.display = 'none';
    soundContainer.style.display = 'none';
    speechButton.style.display = 'block';
    speechRecognition.stop();
    final_transcript = "";
    transcript.innerHTML = 'Speak now';
  }

  speechButton.onclick = function () {
    soundContainer.style.display = 'flex';
    speechButton.style.display = 'none';
    speechRecognition.start();
  }

}