require("dotenv").config();

const getNews = require("./dataSource/scraper");
const { connectToDb, saveNews, closeConnection } = require("./db/dbIO");

async function main() {
  const newsList = await getNews();
  console.log(newsList);
  await connectToDb();
  // newsList && newsList.length > 0 && (await saveNews(newsList));
  await closeConnection();
}

main();
