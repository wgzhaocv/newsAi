const express = require("express");
const router = express.Router();
const ytdl = require("ytdl-core");
const fs = require("fs");
const { aduioToAAc, createDirectoryIfNotExists } = require("../utils");

const orgPath = process.env.YTB_AUDIO_PATH + "original/";
const aacPath = process.env.YTB_AUDIO_PATH + "aac/";
const aacStaticPath = "songs/YT/aac/";
const aacSourcePath =
  process.env.SERVER + ":" + process.env.PORT + "/" + aacStaticPath;

const downloadAndConvert = async (info, format, srcFile, dstFile) => {
  console.log("开始下载", format, srcFile, dstFile);
  return new Promise((resolve, reject) => {
    ytdl
      .downloadFromInfo(info, { format })
      .pipe(fs.createWriteStream(srcFile))
      .on("finish", async () => {
        console.log("下载完成");

        try {
          if (!fs.existsSync(dstFile)) {
            await aduioToAAc(srcFile, dstFile);
            resolve(dstFile);
          }
        } catch (error) {
          console.log(error);
          reject(error);
        }
      })
      .on("error", (err) => {
        console.log(err);
        reject(err);
      });
  });
};

// handle
router.post("/ytdl", async (req, res) => {
  try {
    const { path } = req.body;
    console.log(path);
    createDirectoryIfNotExists(orgPath).catch((err) =>
      console.error("目录创建失败：", err)
    );
    createDirectoryIfNotExists(aacPath).catch((err) =>
      console.error("目录创建失败：", err)
    );

    const info = await ytdl.getInfo(path);

    const formats = info.formats
      .filter(
        (f) =>
          !f.videoCodec &&
          (f.container === "mp4" ||
            f.container === "webm" ||
            f.container === "m4a")
      )
      .sort((a, b) => b.bitrate - a.bitrate);

    const bestAudioFormat = formats[0];

    const fileExtension = bestAudioFormat.container;
    const videoTitle = info.player_response.videoDetails.title.replace(
      /[<>:"/\\|?*]+/g,
      ""
    );

    const srcFile = `${orgPath}${videoTitle}.${fileExtension}`;
    const dstFile = `${aacPath}${videoTitle}.aac`;

    if (fs.existsSync(dstFile)) {
      console.log("文件已存在");
      res.send({ audioUrl: aacSourcePath + videoTitle + ".aac" });
      return;
    }

    await downloadAndConvert(info, bestAudioFormat, srcFile, dstFile);
    console.log("转换完成");

    res.send({ audioUrl: aacSourcePath + videoTitle + ".aac" });
  } catch (error) {
    console.log(error);
    res.send({ audioUrl: "", filename: videoTitle + ".aac" });
  }
});

module.exports = router;
