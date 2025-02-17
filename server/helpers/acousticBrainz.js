const axios = require("axios");

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchFeatures(mbids) {
  let lowLevelRemaining = 0;
  let lowLevelResetIn = 0;
  let highLevelRemaining = 0;
  let highLevelResetIn = 0;

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

    for (const mbid of mbids) {
      const result = res.data[mbid];
      if (result) {
        const bpm = result[0].rhythm.bpm;
        const key = result[0].tonal.key_key;
        const mode = result[0].tonal.key_scale;
        if (bpm && key && mode) {
          features[mbid] = {
            bpm,
            key,
            mode,
          };
        }
      }
    }
  } catch (error) {
    console.warn(`Could not fetch low level features`);
    if (error.response.data.message) {
      console.log(error.response.data.message);
    }
    return null;
  }

  const now = new Date();
  const currentTime = now.toLocaleString();

  // Convervative pause to ensure no rate limits are hit
  if (lowLevelRemaining < 50) {
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
      const result = res.data[mbid];
      if (result) {
        const highLevelFeats = result[0].highlevel;

        features[mbid] = {
          ...features[mbid],
          danceability: highLevelFeats.danceability.value,
          gender: highLevelFeats.gender.value,
          acoustic: highLevelFeats.mood_acoustic.value,
          aggressive: highLevelFeats.mood_aggressive.value,
          electronic: highLevelFeats.mood_electronic.value,
          happy: highLevelFeats.mood_happy.value,
          party: highLevelFeats.mood_party.value,
          relaxed: highLevelFeats.mood_relaxed.value,
          sad: highLevelFeats.mood_sad.value,
          timbre: highLevelFeats.timbre.value,
        };
      }
    }
  } catch (error) {
    console.warn(`Could not fetch high level features`, error);
    return null;
  }

  // Convervative pause to ensure no rate limits are hit
  if (highLevelRemaining < 50) {
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
