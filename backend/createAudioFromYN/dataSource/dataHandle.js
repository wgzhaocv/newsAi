const getNews = require("../dataSource/scraper");
const {
  saveNews,
  findBycondition,
  getLast10,
  updateNews,
  getNewsWithin24Hours,
  getNewsByIds
} = require("../../db/dbIO");
const { generateScript } = require("./chatgptModify");
const { getAduioFromText } = require("../tts/textToSpeech");
const moment = require("moment");

// get data, if failed try one more time, max 10 times
async function getAndSaveData(useChatGPT = false) {
  try {
    if (!useChatGPT) return 0;
    let newsList = await getNews();
    console.log(newsList);
    if (newsList && newsList.length > 0) {
      const ids = newsList.map((item) => item.id);
      const existingData = await findBycondition({ id: { $in: ids } });
      const existingIds = existingData.map((item) => item.id);

      let newData = newsList.filter((item) => !existingIds.includes(item.id));

      const modifiedDataPromises = newData.map(async (item) => {
        return {
          ...item,
          modifiedText: item.content
            ? await generateScript(item.content)
            : undefined,
        };
      });

      newData = await Promise.all(modifiedDataPromises);

      console.log(newData);

      const newsTarget = newData.filter((item) => item.modifiedText);
      const saveResult = await saveNews(newsTarget);
      console.log(newData.length, " rows newData inserted");
      return { saveResult, newsTarget };
    }
  } catch (error) {
    console.log(error);
  }
}

async function textToAudios(dataIds=[]) {
  try {
    let lastNews=[];
    if(dataIds.length>0){
      lastNews = await getNewsByIds(dataIds);
    }else {
      lastNews = await getNewsWithin24Hours();
    }
    // const lastNews = await getLast10();
    console.log("text to audios");
    const toSpeechPromises = lastNews.map((item) => {
      return getAduioFromText(item.modifiedText, item.id);
    });

    const speachResult = await Promise.all(toSpeechPromises);

    const newLast10 = last10.map((item, index) => {
      if (speachResult[index]) {
        return {
          ...item,
          audio: speachResult[index],
        };
      }
      return item;
    });

    const updateResult = await updateNews(
      newLast10.filter((item) => item.audio)
    );

    console.log(updateResult.modifiedCount, " rows updated");
    
  } catch (error) {
    console.log(error);
  }
}

const resetMyDB = async () => {
  const last10 = await getLast10();
  const last10_2 = last10.map((item) => {
    if (typeof item.dateTime === "string") {
      item.publishDateTime = moment(item.dateTime, "YYYY:M:D H:mm:ss").toDate();
    }
    const newItem = { ...item };
    delete newItem.dateTime;
    return newItem;
  });

  console.log(last10_2);
  console.log("\n\n>>>>", last10_2[0]);
  updateNews(last10_2);
};

module.exports.getAndSaveData = getAndSaveData;
module.exports.textToAudios = textToAudios;
module.exports.resetMyDB = resetMyDB;
