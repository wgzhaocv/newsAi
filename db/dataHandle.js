const getNews = require("../dataSource/scraper");
const { saveNews } = require("./dbIO");

// get data, if failed try one more time, max 10 times
async function getAndSaveData() {
  try {
    let newsList = await getNews();
    console.log(newsList);
    if (newsList && newsList.length > 0) {
      const saveResult = await saveNews(newsList);
      return saveResult;
    }
  } catch (error) {
    console.log(error);
  }
}

module.exports.getAndSaveData = getAndSaveData;
