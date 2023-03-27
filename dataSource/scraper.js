const axios = require("axios");
const cheerio = require("cheerio");

const url = "https://news.yahoo.co.jp/topics/top-picks?page=";
const headers = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36",
};

const delay = 1000;

const newsList = [];

async function getNews() {
  try {
    const promises1 = new Array(4)
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

      urlArticle = urlArticle.includes("baseball") ? undefined : urlArticle;

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

      const textNodes = allChildNodes.filter(function () {
        return this.nodeType === 3;
      });

      console.log("\n\ntextNodes\n\n", textNodes);

      let allText = "";
      textNodes.each(function () {
        allText += this.textContent;
      });

      newsList.push({
        title: promises2[i].title,
        dateTime: promises2[i].dateTime,
        url: promises2[i].urlArticle,
        content: allText,
      });
    });

    // console.log("newsList", newsList);

    return Promise.resolve(newsList);
  } catch (error) {
    console.log(error);
  }
}

// getNews();

module.exports = getNews;

// for (let i = 1; i <= 4; i++) {
//   axios.get(url + i).then((res) => {
//     const $ = cheerio.load(res.data);
//     $(".newsFeed_item")
//       .find("a")
//       .each((index, element) => {
//         const title = $(element).find(".newsFeed_item_title").text();
//         const dateTime = $(element).find(".newsFeed_item_date").text();
//         const urlSummary = $(element).attr("href");

//         axios.get(urlSummary).then((summary) => {
//           const $ = cheerio.load(summary.data);

//           const urlArticle = $('[data-ual-view-type="digest"]')
//             .children(":eq(3)")
//             .children(":eq(0)")
//             .children(":eq(0)")
//             .attr("href");

//           axios.get(urlArticle).then((article) => {
//             const $ = cheerio.load(article.data);
//             const content = $("[data-ual-view-type='detail']");
//             const imageLink = content.find('a:contains("【写真ニュース】")');
//             imageLink.remove();

//             const allChildNodes = content.contents();

//             const textNodes = allChildNodes.filter(function () {
//               return this.nodeType === 3;
//             });

//             let allText = "";
//             textNodes.each(function () {
//               allText += this.textContent;
//             });

//             newsList.push({
//               title,
//               dateTime,
//               content: allText,
//             });
//           });
//         });
//       });
//   });
// }
