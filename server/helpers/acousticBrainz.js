const axios = require("axios");

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchFeatures(mbids) {
  let lowLevelRemaining = 0;
  let lowLevelResetIn = 0;
  let highLevelRemaining = 0;
  let highLevelResetIn = 0;
  let lowLevel;
  let highLevel;

  const mbidQuery = mbids.join(";");

  // Initialise features object
  const features = {};

  try {
    const res = await axios.get(
      `https://acousticbrainz.org/api/v1/low-level?recording_ids=${mbidQuery}&features=rhythm.bpm;tonal.key_key;tonal.key_scale`
    );

    // AcousticBrainz uses lower case for the rate limit headers
    lowLevelRemaining = res.headers["x-ratelimit-remaining"];
    lowLevelResetIn = res.headers["x-ratelimit-reset-in"];

    lowLevel = res.data;

    for (const mbid of mbids) {
      features.mbid = {
        bpm: res.data[mbid].rhythm.bpm,
        key: res.data[mbid].tonal.key_key,
        mode: res.data[mbid].tonal.key_scale,
      };
    }
  } catch (error) {
    console.warn(
      `Could not fetch low level features`,
      error.response.data.message
    );
    return null;
  }

  const now = new Date();
  const currentTime = now.toLocaleString();

  // Convervative pause to ensure no rate limits are hit
  if (lowLevelRemaining < 30) {
    console.log("Awaiting AcousticBrainz rate limit reset");
    await delay(lowLevelResetIn * 1000);
  }

  try {
    const res = await axios.get(
      `https://acousticbrainz.org/api/v1/high-level?recording_ids=${mbidQuery}`
    );

    // AcousticBrainz uses lower case for the rate limit headers
    highLevelRemaining = res.headers["x-ratelimit-remaining"];
    highLevelResetIn = res.headers["x-ratelimit-reset-in"];

    for (const mbid of mbids) {
      features.mbid = {
        ...features.mbid,
        danceability: res.data[mbid].danceability.value,
        gender: res.data[mbid].gender.value,
        acoustic: res.data[mbid].acoustic.value,
        aggressive: res.data[mbid].aggressive.value,
        electronic: res.data[mbid].electronic.value,
        happy: res.data[mbid].happy.value,
        party: res.data[mbid].party.value,
        relaxed: res.data[mbid].relaxed.value,
        sad: res.data[mbid].sad.value,
        timbre: res.data[mbid].timbre.value,
      };
    }
  } catch (error) {
    console.warn(`Could not fetch high level features`);
    return null;
  }

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

  return features;
}

module.exports = {
  fetchFeatures,
};
