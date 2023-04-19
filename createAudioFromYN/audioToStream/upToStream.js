const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const path = require("path");
const {
  getNewsByIds,
  getNewsWithin24Hours,
  updateNews,
} = require("../../db/dbIO");

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let loopNewsFlag = true;
const hlsPathNews = process.env.HLS_PATH_NEWS + "/output.m3u8"; // 更改为实际的HLS输出目录

const aacPath = process.env.AUDIO_PATH + "aac/";
const wavPath = process.env.AUDIO_PATH + "convertedWav/";
const dingPath = process.env.AUDIO_PATH + "soundEffect/" + "ding.aac";

function createDirectoryIfNotExists(path) {
  return new Promise((resolve, reject) => {
    fs.mkdir(path, { recursive: true }, (err) => {
      if (err && err.code !== "EEXIST") {
        reject(err);
        return;
      }
      resolve();
    });
  });
}

const wavToAAc = async (inputFile, outputFile) => {
  return new Promise((resolve, reject) => {
    ffmpeg(inputFile)
      .output(outputFile)
      .audioCodec("aac")
      .on("end", () => resolve("success"))
      .on("error", (err) => reject(err))
      .run();
  });
};

const convertAllWaveToAAC = async () => {
  try {
    // get all files in the directory
    const files = fs.readdirSync(process.env.AUDIO_PATH);
    const wavFiles = files.filter((file) => path.extname(file) === ".wav");
    console.log(wavFiles);
    const audioIds = wavFiles.map((file) => path.basename(file, ".wav"));

    const news = await getNewsByIds(audioIds);

    createDirectoryIfNotExists(aacPath)
      .then(() => console.log("目录创建成功"))
      .catch((err) => console.error("目录创建失败：", err));

    createDirectoryIfNotExists(wavPath)
      .then(() => console.log("目录创建成功"))
      .catch((err) => console.error("目录创建失败：", err));
    // convert all files
    const convertPromises = wavFiles.map((file, index) => {
      const inputFile = process.env.AUDIO_PATH + file;

      const outputFile =
        process.env.AUDIO_PATH + "aac/" + path.basename(file, ".wav") + ".aac";
      return wavToAAc(inputFile, outputFile);
    });

    await Promise.all(convertPromises);

    const movePromises = wavFiles.map((file) => {
      const inputFile = process.env.AUDIO_PATH + file;
      const outputFile = process.env.AUDIO_PATH + "convertedWav/" + file;
      return new Promise((resolve, reject) => {
        fs.rename(inputFile, outputFile, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve("success");
          }
        });
      });
    });

    await Promise.all(movePromises);

    // update database
    const updatedNews = news.map((newsItem) => {
      return {
        ...newsItem,
        audio: process.env.AUDIO_PATH + "aac/" + newsItem.id + ".aac",
      };
    });

    const updateResult = await updateNews(updatedNews);

    console.log(updateResult.modifiedCount, " rows updated");
  } catch (error) {
    console.log(error);
  }
};

// upload to nginx HLS
const uploadNewToNginxHLS = async () => {
  try {
    const news = await getNewsWithin24Hours();
    const newsIds = news.map((item) => item.id);
    const aacs = fs.readdirSync(aacPath).filter(
      (file) => path.extname(file) === ".aac"
      // &&
      // newsIds.includes(path.basename(file, ".aac"))
    );
    console.log(aacs);

    const AudioList = aacs.map((file) => aacPath + file);

    console.log(AudioList, dingPath);
    for (const audioPath of AudioList) {
      try {
        await new Promise((resolve, reject) => {
          ffmpeg(dingPath)
            .inputOptions(["-re"]) // 按照原始速率读取文件
            .audioCodec("aac")
            .format("hls")
            .outputOptions(["-hls_time 3", "-hls_list_size 0"])
            .on("start", () => {
              console.log(`开始生成HLS文件 ${dingPath}`);
            })
            .on("end", () => {
              console.log(`生成HLS文件完成 ${dingPath}`);
              resolve();
            })
            .on("error", (error) => {
              console.error("生成HLS文件出错:", error);
              reject();
            })
            .save(hlsPathNews);
        });
      } catch (error) {
        console.log(error);
      }

      try {
        console.log("audioPath playing: ", audioPath);
        await new Promise((resolve, reject) => {
          ffmpeg(audioPath)
            .inputOptions(["-re"]) // 按照原始速率读取文件
            .audioCodec("aac")
            .format("hls")
            .outputOptions(["-hls_time 3", "-hls_list_size 0"])
            .on("start", () => {
              console.log(`开始生成HLS文件 ${audioPath}`);
            })
            .on("end", () => {
              console.log(`生成HLS文件完成 ${audioPath}`);
              resolve();
            })
            .on("error", (error) => {
              console.error("生成HLS文件出错:", error);
              reject();
            })
            .save(hlsPathNews);
        });
      } catch (error) {
        console.log(error);
      }

      await delay(2000);
    }

    await delay(5000);

    loopNewsFlag && uploadToNginxHLS();
  } catch (error) {
    console.log(error);
  }
};

module.exports.convertAllWaveToAAC = convertAllWaveToAAC;
module.exports.uploadNewToNginxHLS = uploadNewToNginxHLS;
