import express from "express";
import axios from "axios";
import * as cheerio from "cheerio";

const getHTML = async (URL, keyword) => {
  try {
    const url = await `${URL}${keyword}`;
    console.log(url);
    const response = await axios.get(url);

    return response.data;
  } catch (err) {
    console.log(err);
  }
};

const parsingMain = async () => {
  const html = await getHTML("https://newneek.co/");
  const $ = cheerio.load(html);
  const $newsList = $(".card");
  const $belowList = $(".home-link");
  const $footer_statics = $(".footer-statics");

  const newsCourse = [];
  $newsList.each((idx, module) => {
    const href = $(module).attr("href");
    newsCourse.push({
      image: $(module).find(".card-thumbnail > img").attr("src"),
      title: $(module)
        .find(".card-title")
        .text()
        .replace(/[^\w\sㄱ-ㅎ가-힣]/gi, ""),
      date: $(module).find(".card-date").text(),
      category: $(module).find(".card-category").text(),
      newsCode: href.slice(6),
    });
  });

  const belowCourse = [];
  $belowList.each((idx, module) => {
    belowCourse.push($(module).text());
  });

  const mainTitle = $footer_statics.find("p").first().text();
  belowCourse.push(mainTitle);

  const loads = { ["news"]: newsCourse, ["belows"]: belowCourse };
  return loads;
};

const parsingCategory = async (keyword) => {
  const html = await getHTML("https://newneek.co/tag/", keyword);
  const $ = cheerio.load(html);
  const $courseList = $(".card");

  let courses = [];
  $courseList.each((idx, module) => {
    const href = $(module).attr("href");
    courses.push({
      image: $(module).find(".card-thumbnail > img").attr("src"),
      title: $(module)
        .find(".card-title")
        .text()
        .replace(/[^\w\sㄱ-ㅎ가-힣]/gi, ""),
      date: $(module).find(".card-date").text(),
      category: $(module).find(".card-category").text(),
      newsCode: href.slice(6),
    });
  });
  return courses;
};

const parsingNewsDetail = async (keyword) => {
  const html = await getHTML("https://newneek.co/post/", keyword);
  const $ = cheerio.load(html);
  const theNews = $(".post");

  const hashByClass = $(".post-hashtag-item");
  const hashArray = hashByClass.map((idx, ele) => $(ele).text()).get();

  const context = $(".post-body");
  const contextBy = context
    .find("p, h2")
    .map((idx, ele) => {
      const classify = ele.tagName === "p" ? "본문" : "소제목";
      const text = $(ele).text();
      const line = { [classify]: text };
      return line;
    })
    .get();

  let news = {};
  news.article = {
    cateory: theNews.find(".post-head-runninghead").text(),
    title: theNews.find(".post-head-headline").text(),
    date: theNews.find(".post-head-date").text(),
    image: theNews.find(".post-featured > img").attr("src"),
    content: contextBy,
    hashTag: hashArray,
  };
  return news;
};

const parsingSearch = async (keyword) => {
  const html = await getHTML("https://newneek.co/search/posts?keyword=", keyword);
  const $ = cheerio.load(html);
  const $courseList = $(".card");
  console.log(html);

  // let courses = [];
  // $courseList.each((idx, module) => {
  //   const href = $(module).attr("href");
  //   courses.push({
  //     image: $(module).find(".card-thumbnail > img").attr("src"),
  //     title: $(module)
  //       .find(".card-title")
  //       .text()
  //       .replace(/[^\w\sㄱ-ㅎ가-힣]/gi, ""),
  //     date: $(module).find(".card-date").text(),
  //     category: $(module).find(".card-category").text(),
  //     newsCode: href.slice(6),
  //   });
  // });
  // return courses;
};



const router = express.Router();

// 카테고리에 따라 뉴스 데이터를 불러오는 API
router.get("/tag/:category", async (req, res, next) => {
  try {
    const { category } = req.params;
    const data = await parsingCategory(category);

    return res.status(200).json({ data: data });
  } catch (error) {
    console.log(error);
  }
});

// 해당 카드를 클릭하였을 때, 뉴스 세부 데이터를 가져오는 API
router.get("/news/:newsId", async (req, res, next) => {
  try {
    const { newsId } = req.params;
    const data = await parsingNewsDetail(newsId);

    return res.status(201).json({ data: data });
  } catch (error) {
    console.log(error);
  }
});

// 메인(전체) 페이지 조회하여 전체 데이터를 가져오는 API
router.get("/news", async (req, res, next) => {
  try {
    const data = await parsingMain();

    return res.status(200).json({ data: data });
  } catch (error) {
    console.log(error);
  }
});

// 검색하여 뉴스 목록을 가져오는 API
router.get("/news/find/search", async (req, res, next) => {
  try {
    const { keyword } = req.body;
    const data = await parsingSearch(keyword);

    return res.status(201).json({ data: data });
  } catch (error) {
    console.log(error);
  }
});

export default router;
