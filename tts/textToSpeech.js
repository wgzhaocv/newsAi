const sdk = require("microsoft-cognitiveservices-speech-sdk");
const fs = require("fs");
const { AudioContext } = require("web-audio-api");
const toWav = require("audiobuffer-to-wav");

let speechConfig = sdk.SpeechConfig.fromSubscription(
  process.env.SPEECH_KEY,
  process.env.SPEECH_REGION
);
const casters = [
  {
    name: "Aoi",
    kana: "あおい",
  },
  {
    name: "Mayu",
    kana: "まゆ",
  },
  {
    name: "Nanami",
    kana: "ななみ",
  },
  {
    name: "Shiori",
    kana: "しおり",
  },
];

const greetings = [
  {
    name: "morning",
    kana: "おはようございます",
  },
  {
    name: "day",
    kana: "こんにちは",
  },
  {
    name: "evening",
    kana: "こんばんは",
  },
];

const getAduioFromText = async (text, id) => {
  let fileName = process.env.AUDIO_PATH + id + ".wav";

  if (fs.existsSync(fileName)) {
    return fileName;
  }

  let audioConfig = sdk.AudioConfig.fromAudioFileOutput(fileName);

  speechConfig.speechSynthesisVoiceName = "ja-JP-MayuNeural";

  let synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

  return new Promise((resolve, reject) => {
    console.log("Now synthesizing to: " + fileName);
    if (!text) {
      reject(false);
    }

    synthesizer.speakTextAsync(
      text,
      function (result) {
        if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
          console.log("synthesis finished.");

          let writeStream = fs.createWriteStream(fileName);

          // 将合成器的音频数据写入文件

          let audioBuffer = Buffer.from(result.audioData);

          // 将合成器的音频数据写入文件
          writeStream.write(audioBuffer);
          writeStream.end();
          synthesizer && synthesizer.close();
          synthesizer = null;

          resolve(fileName);
        } else {
          console.error(
            "Speech synthesis canceled, " +
              result.errorDetails +
              "\nDid you set the speech resource key and region values?"
          );
        }
        synthesizer && synthesizer.close();
        synthesizer = null;
        reject(false);
      },
      function (err) {
        console.trace("err - " + err);
        synthesizer && synthesizer.close();
        synthesizer = null;
        reject(false);
      }
    );
  });
};

module.exports.getAduioFromText = getAduioFromText;
