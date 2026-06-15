const AVATAR_URL =
  'https://images.unsplash.com/photo-1490650034439-fd184c3c86a5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxjb2xsZWN0aW9uLXBhZ2V8MXwxNDk0OTAwfHxlbnwwfHx8fHw%3D&w=1000&q=80';

export const EXPAND_MENU_ITEMS = [
  { name: 'My accounts', href: 'https://myaccount.google.com/', img: AVATAR_URL },
  { name: 'Gmail', href: 'https://mail.google.com/', img: '/icons/gmail.png' },
  { name: 'Drive', href: 'https://drive.google.com/', img: '/icons/drive.png' },
  { name: 'Doc', href: 'https://docs.google.com/', img: '/icons/doc.png' },
  { name: 'Sheet', href: 'https://docs.google.com/spreadsheets/', img: '/icons/sheet.png' },
  { name: 'Colab', href: 'https://colab.google/', img: '/icons/colab.png', style: { width: '76px' } },
  { name: 'Calendar', href: 'https://calendar.google.com/', img: '/icons/calendar.png' },
  {
    name: 'Chat',
    href: 'https://mail.google.com/chat/',
    img: '/icons/chat.png',
    style: { borderRadius: 0, width: '40px', height: '40px' },
  },
  {
    name: 'Meet',
    href: 'https://meet.google.com/',
    img: '/icons/meet.png',
    style: { borderRadius: 0, width: '40px', height: '40px' },
  },
  { name: 'Leetcode', href: 'https://leetcode.com/problemset/all/', img: '/icons/leetcode.png' },
  { name: 'Stackoverflow', href: 'https://stackoverflow.com/', img: '/icons/stackoverflow.png' },
  { name: 'AWS', href: 'https://aws.amazon.com/', img: '/icons/aws.png' },
  { name: 'VSCode', href: 'vscode://', img: '/icons/vscode.png' },
  { name: 'Youtube', href: 'https://www.youtube.com/', img: '/icons/youtube.png', style: { borderRadius: 0 } },
  { name: 'Facebook', href: 'https://www.facebook.com/', img: '/icons/facebook.png' },
];

export { DEFAULT_SHORTCUTS as APP_ITEMS } from './defaultShortcuts';

export { AVATAR_URL };
