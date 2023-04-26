const { MongoClient } = require("mongodb");

const uri = process.env.MONGO;

console.log(uri);

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
    console.log("Connected to the MongoDB.");

    // 选择数据库和集合
    db = client.db("news_database"); // 替换 'news_database' 为你的数据库名称
    collection = db.collection("news"); // 替换 'news' 为你的集合名称
    await collection.createIndex({ id: 1 });

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
    const result = await collection.insertMany(
      newsList.map((item) => {
        return {
          ...item,
          createTime: new Date(),
          updateTime: new Date(),
        };
      })
    );
    console.log(
      `Inserted ${result.insertedCount} documents into the news collection.`
    );
    return result;
  } catch (err) {
    console.error("Error:", err);
  }
}

async function closeConnection() {
  await client.close();
  console.log("Closed the database connection.");
}

async function findBycondition(conditon) {
  if (!db || !collection) {
    console.error("Database connection is not established.");
    return;
  }

  try {
    // 查询集合中的所有数据
    const cursor = await collection.find(conditon);
    const result = await cursor.toArray();
    console.log(">>>", result, "<<<");
    return result;
  } catch (err) {
    console.error("Error:", err);
  }
}

async function findAll() {
  if (!db || !collection) {
    console.error("Database connection is not established.");
    return;
  }

  try {
    // 查询集合中的所有数据
    const cursor = await collection.find({});
    const result = await cursor.toArray();
    console.log(result);
    return result;
  } catch (err) {
    console.error("Error:", err);
  }
}

async function getAllIds() {
  if (!db || !collection) {
    console.error("Database connection is not established.");
    return;
  }

  try {
    // 查询集合中的所有数据
    const cursor = await collection.find({}, { projection: { id: 1 } });
    const result = await cursor.toArray();
    console.log(result);
    return result;
  } catch (err) {
    console.error("Error:", err);
  }
}

async function getLast10() {
  if (!db || !collection) {
    console.error("Database connection is not established.");
    return;
  }

  try {
    // 查询集合中的所有数据
    const cursor = await collection.find({}).limit(10);
    const result = await cursor.toArray();
    console.log(result);
    return result;
  } catch (err) {
    console.error("Error:", err);
  }
}

async function updateNews(newsList) {
  if (!db || !collection) {
    console.error("Database connection is not established.");
    return;
  }

  try {
    // 插入新闻列表到集合中
    const result = await collection.bulkWrite(
      newsList.map((item) => {
        return {
          updateOne: {
            filter: { id: item.id },
            update: {
              $set: { ...item, updateTime: new Date() },
            },
            upsert: true,
          },
        };
      })
    );
    console.log(
      `Updated ${result.modifiedCount} documents in the news collection.`
    );
    return result;
  } catch (err) {
    console.error("Error:", err);
  }
}

const getNewsByIds = async (ids) => {
  if (!db || !collection) {
    console.error("Database connection is not established.");
    return;
  }

  try {
    // 查询集合中的所有数据
    const cursor = await collection.find({ id: { $in: ids } });
    const result = await cursor.toArray();
    console.log(result);
    return result;
  } catch (err) {
    console.error("Error:", err);
  }
};

// get the records within 24 hours
const getNewsWithin24Hours = async () => {
  if (!db || !collection) {
    console.error("Database connection is not established.");
    return;
  }

  try {
    // 查询集合中的所有数据
    const cursor = await collection.find({
      publishDateTime: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });
    const result = await cursor.toArray();
    console.log(result);
    return result;
  } catch (err) {
    console.error("Error:", err);
  }
}

module.exports.saveNews = saveNews;
module.exports.closeConnection = closeConnection;
module.exports.connectToDb = connectToDb;
module.exports.findBycondition = findBycondition;
module.exports.findAll = findAll;
module.exports.getLast10 = getLast10;
module.exports.updateNews = updateNews;
module.exports.getNewsByIds = getNewsByIds;
module.exports.getNewsWithin24Hours = getNewsWithin24Hours;