const axios = require("axios");

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchFeatures(mbid) {
  let lowLevelRemaining = 0;
  let lowLevelResetIn = 0;
  let highLevelRemaining = 0;
  let highLevelResetIn = 0;
  let lowLevel;
  let highLevel;

  try {
    const res = await axios.get(
      `https://acousticbrainz.org/api/v1/${mbid}/low-level`
    );

    // AcousticBrainz uses lower case for the rate limit headers
    lowLevelRemaining = res.headers["x-ratelimit-remaining"];
    lowLevelResetIn = res.headers["x-ratelimit-reset-in"];

    lowLevel = {
      bpm: res.data.rhythm.bpm,
      key: res.data.tonal.key_key,
      mode: res.data.tonal.key_scale,
    };
  } catch (error) {
    console.warn(
      `Could not fetch low level features for track: ${mbid} (mbid)`,
      error.response.data.message
    );
    return null;
  }

  const now = new Date();
  const currentTime = now.toLocaleString();
  console.log(`${currentTime}: low level remaining: ${lowLevelRemaining}`);
  console.log(`${currentTime}: low level reset: ${lowLevelResetIn}`);

  // Convervative pause to ensure no rate limits are hit
  if (lowLevelRemaining < 30) {
    console.log("Awaiting AcousticBrainz rate limit reset");
    await delay(lowLevelResetIn * 1000);
  }

  try {
    const res = await axios.get(
      `https://acousticbrainz.org/api/v1/${mbid}/high-level`
    );

    // AcousticBrainz uses lower case for the rate limit headers
    highLevelRemaining = res.headers["x-ratelimit-remaining"];
    highLevelResetIn = res.headers["x-ratelimit-reset-in"];

    const data = res.data.highlevel;
    highLevel = {
      danceability: data.danceability.value,
      gender: data.gender.value,
      acoustic: data.mood_acoustic.value,
      aggressive: data.mood_aggressive.value,
      electronic: data.mood_electronic.value,
      happy: data.mood_happy.value,
      party: data.mood_party.value,
      relaxed: data.mood_relaxed.value,
      sad: data.mood_sad.value,
      timbre: data.timbre.value,
    };
  } catch (error) {
    console.warn(`Could not fetch features for track: ${mbid} (mbid)`);
    return null;
  }

  console.log(`${currentTime}: high level remaining: ${highLevelRemaining}`);
  console.log(`${currentTime}: high level reset: ${highLevelResetIn}`);
  // Convervative pause to ensure no rate limits are hit
  if (highLevelRemaining < 30) {
    console.log("Awaiting AcousticBrainz rate limit reset");
    await delay(highLevelResetIn * 1000);
  }

  console.log(
    `${currentTime}: rate limit array: [${Math.min(
      lowLevelRemaining,
      highLevelRemaining
    )}, ${Math.max(lowLevelResetIn, highLevelResetIn)}]`
  );

  // Combine high and low level features
  const features = {
    rateLimit: [
      Math.min(lowLevelRemaining, highLevelRemaining),
      Math.max(lowLevelResetIn, highLevelResetIn),
    ],
    data: {
      ...lowLevel,
      ...highLevel,
    },
  };

  return features;
}

module.exports = {
  fetchFeatures,
};
