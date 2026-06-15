import { useCallback, useEffect, useRef, useState } from 'react';
import NavBar from './components/NavBar';
import ExpandMenu from './components/ExpandMenu';
import SearchContainer from './components/SearchContainer';
import SpeechContainer from './components/SpeechContainer';
import AppList from './components/AppList';
import SpotifyPlayer from './components/SpotifyPlayer';
import TamagotchiWidget from './components/TamagotchiWidget';
import TodayPanel from './components/TodayPanel';
import WeatherWidget from './components/WeatherWidget';
import { useSearchEngine } from './hooks/useSearchEngine';
import { useShortcuts } from './hooks/useShortcuts';

export default function App() {
  const { engine, setEngine, buildSearchUrl } = useSearchEngine();
  const { shortcuts, removeShortcut, addShortcut, updateShortcut } = useShortcuts();

  const [expandOpen, setExpandOpen] = useState(false);
  const [tooltipText, setTooltipText] = useState('');
  const [tooltipRight, setTooltipRight] = useState(14);
  const [dropdownTooltip, setDropdownTooltip] = useState({
    visible: false,
    text: '',
    left: '0px',
    top: '0px',
  });
  const [searchValue, setSearchValue] = useState('');
  const [speechVisible, setSpeechVisible] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('Speak now');

  const speechRecognitionRef = useRef(null);
  const finalTranscriptRef = useRef('');
  const buildSearchUrlRef = useRef(buildSearchUrl);

  buildSearchUrlRef.current = buildSearchUrl;

  const handleToggleExpand = useCallback(() => {
    setExpandOpen((prev) => !prev);
  }, []);

  const handleExpandButtonEnter = useCallback(() => {
    setTooltipText('Recommended apps');
    setTooltipRight(14);
  }, []);

  const handleExpandButtonLeave = useCallback(() => {
    setTooltipText('');
  }, []);

  const handleAvatarEnter = useCallback(() => {
    setTooltipText('Vincent Mai\nminhmv249@gmail.com');
    setTooltipRight(8);
  }, []);

  const handleAvatarLeave = useCallback(() => {
    setTooltipText('');
    setTooltipRight(14);
  }, []);

  const handleItemHover = useCallback((index, name, event) => {
    setDropdownTooltip({
      visible: true,
      text: name,
      left: `${event.clientX}px`,
      top: `${event.clientY}px`,
    });
  }, []);

  const handleItemLeave = useCallback(() => {
    setDropdownTooltip((prev) => ({ ...prev, visible: false }));
  }, []);

  const handleSearchSubmit = useCallback(() => {
    if (searchValue.trim()) {
      window.location.href = buildSearchUrl(searchValue);
    }
  }, [buildSearchUrl, searchValue]);

  const handleAppClick = useCallback(
    (app) => {
      if (searchValue.trim()) {
        window.location.href = app.queryUrl + encodeURIComponent(searchValue);
      } else {
        window.location.href = app.baseUrl;
      }
    },
    [searchValue],
  );

  const handleExitSpeech = useCallback(() => {
    setSpeechVisible(false);
    setListening(false);
    speechRecognitionRef.current?.stop();
    finalTranscriptRef.current = '';
    setTranscript('Speak now');
  }, []);

  const handleStartListening = useCallback(() => {
    if (!speechRecognitionRef.current) return;
    setListening(true);
    finalTranscriptRef.current = '';
    setTranscript('Speak now');
    speechRecognitionRef.current.start();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const expandWrapper = document.querySelector('.expand-wrapper');
      const expandButton = document.querySelector('.expand-button');
      if (
        expandWrapper &&
        expandButton &&
        !expandWrapper.contains(event.target) &&
        !expandButton.contains(event.target)
      ) {
        setExpandOpen(false);
      }
    };

    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) return;

    const speechRecognition = new window.webkitSpeechRecognition();
    speechRecognition.continuous = false;
    speechRecognition.interimResults = true;
    speechRecognition.lang = 'en-US';

    speechRecognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        if (event.results[i].isFinal) {
          finalTranscriptRef.current += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setTranscript(finalTranscriptRef.current || interim || 'Speak now');
    };

    speechRecognition.onend = () => {
      setListening(false);
      const result = finalTranscriptRef.current.trim();
      if (result) {
        window.location.href = buildSearchUrlRef.current(result);
      }
    };

    speechRecognitionRef.current = speechRecognition;

    return () => {
      speechRecognition.stop();
    };
  }, []);

  return (
    <>
      <TodayPanel />
      <div className="top-chrome">
        <WeatherWidget />
        <NavBar
          expandOpen={expandOpen}
          onToggleExpand={handleToggleExpand}
          tooltipText={tooltipText}
          tooltipRight={tooltipRight}
          onExpandButtonEnter={handleExpandButtonEnter}
          onExpandButtonLeave={handleExpandButtonLeave}
          onAvatarEnter={handleAvatarEnter}
          onAvatarLeave={handleAvatarLeave}
        />
        <ExpandMenu
          open={expandOpen}
          onItemHover={handleItemHover}
          onItemLeave={handleItemLeave}
          dropdownTooltip={dropdownTooltip}
        />
      </div>
      <SearchContainer
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onSearchSubmit={handleSearchSubmit}
        onMicClick={() => setSpeechVisible(true)}
        searchEngine={engine}
        onSearchEngineChange={setEngine}
      />
      <SpeechContainer
        visible={speechVisible}
        listening={listening}
        transcript={transcript}
        onExit={handleExitSpeech}
        onStartListening={handleStartListening}
      />
      <AppList
        shortcuts={shortcuts}
        onAppClick={handleAppClick}
        onRemove={removeShortcut}
        onAdd={addShortcut}
        onUpdate={updateShortcut}
      />
      <div className="bottom-dock">
        <SpotifyPlayer />
        <TamagotchiWidget />
      </div>
    </>
  );
}
