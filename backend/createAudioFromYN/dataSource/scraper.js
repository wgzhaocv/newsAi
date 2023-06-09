const axios = require("axios");
const cheerio = require("cheerio");
const moment = require("moment");
const now = moment();

const url = "https://news.yahoo.co.jp/topics/top-picks?page=";
const headers = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36",
};

const delay = 1000;

let lastExecutionTime = null;
const minInterval = 5000; // 5秒（毫秒）

const newsList = [];

async function getNews() {
  try {
    const currentTime = new Date().getTime();

    if (lastExecutionTime && currentTime - lastExecutionTime < minInterval)
      return;

    const year = now.format("YYYY");

    const regex = /（[^）]*）/g;

    const promises1 = new Array(1)
      .fill(0)
      .map((_, i) => axios.get(url + (i + 1), { headers }));
    const results1 = await Promise.all(promises1);

    const promises2 = results1
      .map((res) => {
        const $ = cheerio.load(res.data);

        return Array.from(
          $(".newsFeed_item")
            .find("a")
            .map((index, element) => {
              const title = $(element).find(".newsFeed_item_title").text();
              const dateTime = $(element).find(".newsFeed_item_date").text();
              const urlSummary = $(element).attr("href");

              return {
                title,
                dateTime,
                urlSummary,
                req2: axios.get(urlSummary, { headers }),
              };
            })
        );
      })
      .flat();

    // const promises2Flat = Array.from(promises2).flat();

    // console.log("promises2", promises2);

    const reqs = promises2.map((item) => item.req2);

    const results2 = await Promise.all(reqs);

    // console.log("results2", results2);

    const promises3 = results2.map((res, index) => {
      const $ = cheerio.load(res.data);

      let urlArticleTemp = $('[data-ual-view-type="digest"]').children(
        ":eq(3)"
      );
      if (!urlArticleTemp || urlArticleTemp.length === 0) {
        urlArticleTemp = $('[data-ual-view-type="digest"]').children(":eq(2)");
      }
      if (!urlArticleTemp || urlArticleTemp.length === 0) {
        urlArticleTemp = $('[data-ual-view-type="digest"]').children(":eq(1)");
      }
      if (!urlArticleTemp || urlArticleTemp.length === 0) {
        urlArticleTemp = $('[data-ual-view-type="digest"]').children(":eq(0)");
      }

      let urlArticle = urlArticleTemp
        .children(":eq(0)")
        .children(":eq(0)")
        .attr("href");

      urlArticle =
        urlArticle?.includes("baseball") ||
        urlArticle?.includes("soccer") ||
        urlArticle?.includes("weather")
          ? undefined
          : urlArticle;

      console.log("urlArticle", promises2[index].urlSummary, urlArticle);
      promises2[index].urlArticle = urlArticle;

      return new Promise((resolve, reject) => {
        setTimeout(() => {
          console.log("requesting", urlArticle);
          resolve(urlArticle ? axios.get(urlArticle, { headers }) : urlArticle);
        }, delay * index);
      });
    });

    const results3 = await Promise.all(promises3);

    results3.forEach((res, i) => {
      if (!res) {
        return;
      }
      const $ = cheerio.load(res.data);
      const content = $("[data-ual-view-type='detail']");
      const imageLink = content.find("a").filter(function () {
        return $(this).attr("data-cl-params") !== undefined;
      });
      imageLink.remove();

      const allChildNodes = content.contents();

      // console.log(
      //   "\nallChildNodes: ",
      //   Object.prototype.toString.call(allChildNodes),
      //   allChildNodes,
      //   "\n\n"
      // );
      // 创建一个递归函数，用于提取所有文本
      function extractText(element) {
        let result = "";

        element.each((index, el) => {
          if (el.type === "text") {
            result += el.data;
          } else if (el.type === "tag") {
            result += extractText($(el).contents());
          }
        });

        return result;
      }

      // 使用 extractText 函数提取所有文本
      const allText = extractText(allChildNodes);

      // console.log("\nallText: ", allText, "\n\n");

      const regexText = allText.replace(regex, "").replace(/\n+/g, "\n");

      const [month, day, hour, min] = promises2[i].dateTime.match(/\d+/g);

      newsList.push({
        id: promises2[i].urlSummary.split("/").at(-1),
        title: promises2[i].title,
        publishDateTime: moment({
          year,
          month: month - 1,
          day,
          hour,
          minutes: min,
        }).toDate(),
        url: promises2[i].urlArticle,
        content: regexText,
      });
    });

    // console.log("newsList", newsList);

    return Promise.resolve(newsList);
  } catch (error) {
    console.log(error);
  }
}

module.exports = getNews;
