import express from "express";
import axios from "axios";
import * as cheerio from "cheerio";
import { prisma } from "../utils/index.js";

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

const objects ={
  "economy": "경제",
  "politics": "정치",
  "world": "세계",
  "tech": "테크",
  "labor": "노동",
  "environment": "환경",
  "social-rights": "인권",
  "domestic-issue": "사회",
  "culture": "문화",
  "life": "라이프"
}

const router = express.Router();

// 카테고리에 따라 뉴스 데이터를 불러오는 API
router.get("/tag/:category", async (req, res, next) => {
  try {
    const { category } = req.params;
    const findCategory = objects[category];
    if(!findCategory){
      return res.status(404).json({errorMessage: "존재하지 않는 카테고리입니다."})
    }
    const data = await prisma.news.findMany({
      where: {category: findCategory},
      orderBy: {date: "desc"},
      take: 12,
    })

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
    const data = await prisma.news.findMany({
      orderBy:{
        date: 'desc',
      },
      take: 12,
    })

    const organizedData = {
      "news": data
    }
    return res.status(200).json({ data: organizedData });
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

// 카테고리별로 DB에 뉴스를 저장하는 API
router.get("/news/upload/:category", async (req, res, next) => {
  try {
    const { category } = req.params;
    const data = await parsingCategory(category);
    const existingNews = await prisma.news.findMany({
      select: {
        newsCode: true,
      },
    });

    const existingNewsData = new Set(existingNews.map(itm => itm.newsCode));
    const filteredData = data.filter(itm => !existingNewsData.has(itm.newsCode));
    await prisma.news.createMany({data: filteredData})

    return res.status(201).json({ message: "DB에 해당 카테고리 데이터가 저장되었습니다." });
  } catch (error) {
    console.log(error);
  }
});

export default router;
