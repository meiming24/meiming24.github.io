export async function fetchAlbumTracks(accessToken, albumId) {
  const albumResponse = await fetch(
    `https://api.spotify.com/v1/albums/${albumId}?fields=name,images`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!albumResponse.ok) {
    throw new Error('Failed to load album');
  }

  const album = await albumResponse.json();
  const tracks = [];
  let nextUrl = `https://api.spotify.com/v1/albums/${albumId}/tracks?limit=50`;

  while (nextUrl) {
    const response = await fetch(nextUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to load album tracks');
    }

    const payload = await response.json();
    const playableTracks = payload.items
      .filter((track) => track?.uri)
      .map((track) => ({
        ...track,
        album: {
          name: album.name,
          images: album.images,
        },
      }));

    tracks.push(...playableTracks);
    nextUrl = payload.next;
  }

  if (!tracks.length) {
    throw new Error('Album has no playable tracks');
  }

  return tracks;
}

export async function fetchPlaylistTracks(accessToken, playlistId) {
  const tracks = [];
  let nextUrl = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100&fields=items(track(id,name,uri,artists(name),album(name,images),is_local)),next`;

  while (nextUrl) {
    const response = await fetch(nextUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to load playlist tracks');
    }

    const payload = await response.json();
    const playableTracks = payload.items
      .map((item) => item.track)
      .filter((track) => track?.uri && !track.is_local);

    tracks.push(...playableTracks);
    nextUrl = payload.next;
  }

  if (!tracks.length) {
    throw new Error('Playlist has no playable tracks');
  }

  return tracks;
}

export async function fetchMusicTracks(accessToken, { playlistId, albumId }) {
  if (albumId) {
    return fetchAlbumTracks(accessToken, albumId);
  }

  if (playlistId) {
    return fetchPlaylistTracks(accessToken, playlistId);
  }

  throw new Error('No Spotify album or playlist configured');
}

async function transferPlayback(accessToken, deviceId) {
  const response = await fetch('https://api.spotify.com/v1/me/player', {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      device_ids: [deviceId],
      play: false,
    }),
  });

  if (response.status !== 204 && !response.ok) {
    throw new Error('Unable to transfer playback');
  }
}

export async function startPlayback(accessToken, deviceId, trackUri) {
  await transferPlayback(accessToken, deviceId);

  const response = await fetch(
    `https://api.spotify.com/v1/me/player/play?device_id=${encodeURIComponent(deviceId)}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uris: [trackUri],
      }),
    },
  );

  if (response.status !== 204 && !response.ok) {
    const message = await response.text();
    throw new Error(message || 'Unable to start playback');
  }
}
