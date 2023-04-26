const { getAndSaveData, textToAudios } = require("./dataSource/dataHandle");
const { convertAllWaveToAAC } = require("./audioToStream/upToStream");

// set up cron job
const cron = require("node-cron");

// generate news aac files from yahoo news
const generateNewsFromYN = async () => {
  try {
    const {saveResult, newsTarget}=await getAndSaveData();
    console.log("getAndSaveData done");

    await textToAudios(newsTarget.map(item=>item.id));
    console.log("textToAudios done");

    await convertAllWaveToAAC();
    console.log("convertAllWaveToAAC done");
  } catch (error) {
    console.log("generateNewsFromYN failed", error);
  }
};

module.exports.generateNewsFromYN = generateNewsFromYN;
