const { MongoClient } = require("mongodb");

const uri = process.env.MONGO;

const client = new MongoClient(uri, {
  useUnifiedTopology: true,
  maxPoolSize: 50,
  minPoolSize: 10,
});

let db, collection;

async function connectToDb() {
  try {
    // 连接到MongoDB
    await client.connect();

    // 选择数据库和集合
    db = client.db("news_database"); // 替换 'news_database' 为你的数据库名称
    collection = db.collection("news"); // 替换 'news' 为你的集合名称

    console.log("Connected to the database.");
  } catch (err) {
    console.error("Error:", err);
  }
}
// 连接到数据库


async function saveNews(newsList) {
  if (!db || !collection) {
    console.error("Database connection is not established.");
    return;
  }

  try {
    // 插入新闻列表到集合中
    const result = await collection.insertMany(newsList);
    console.log(
      `Inserted ${result.insertedCount} documents into the news collection.`
    );
  } catch (err) {
    console.error("Error:", err);
  }
}

async function closeConnection() {
  await client.close();
  console.log("Closed the database connection.");
}

module.exports.saveNews = saveNews;
module.exports.closeConnection = closeConnection;
module.exports.connectToDb = connectToDb;
