const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const path = require("path");

const aduioToAAc = async (inputFile, outputFile) => {
  return new Promise((resolve, reject) => {
    ffmpeg(inputFile)
      .output(outputFile)
      .audioCodec("aac")
      .on("end", () => resolve("success"))
      .on("error", (err) => reject(err))
      .run();
  });
};

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

 async function audioToHlsStream(audioPath, hlsPathNews) {
    return new Promise((resolve, reject) => {
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
}

module.exports.aduioToAAc = aduioToAAc;
module.exports.createDirectoryIfNotExists = createDirectoryIfNotExists;
module.exports.audioToHlsStream = audioToHlsStream;