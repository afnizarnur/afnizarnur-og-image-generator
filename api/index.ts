import { NowRequest, NowResponse } from "@now/node"
import chrome from "chrome-aws-lambda"
import fs from "fs"
import path from "path"
import puppeteer from "puppeteer-core"

const loadFont = (file) => {
  const font = fs.readFileSync(path.join(__dirname, `../static/${file}`))
  return font.toString("base64")
}

const generateHTML = (title = "Hello world") => {
  return `<html>
    <style>
      * {
        margin: 0;
        padding: 0;
      }

      html {
        width: 1200px;
        height: 628px;
        background-image: linear-gradient(180deg, rgba(25,26,27,0.07) 0%, rgba(255,255,255,0.00) 100%);
      }

      body {
        position: relative;
      }

      @font-face {
        font-family: 'Inter';
        font-style: normal;
        font-weight: 700;
        src: url('data:font/woff2;base64,${loadFont(
          "Inter-Bold.woff2"
        )}') format('woff2');
      }

      @font-face {
        font-family: 'Inter';
        font-style: normal;
        src: url('data:font/woff2;base64,${loadFont(
          "Inter-Regular.woff2"
        )}') format('woff2');
      }

      .title {
        font: 96px/1 "Inter", sans-serif;
        font-weight: 700;
        color: #191A1B;
        max-width: 1008px;
      }

      .title p {
        position: absolute;
        top: 50%;
        left: 96px;
        letter-spacing: -1.8px;
        transform: translateY(-70%);
        line-height: 1.1;
        margin: 0;
      }

      .author {
        font: 36px/1 "Inter", sans-serif;
        font-style: normal;
        color: #191A1B;
        opacity: .8;
        position: absolute;
        bottom: 80px;
        left: 96px;
      }
    </style>
    
    <div class="title" style="position: relative; height: 100%; width: 100%;">
      <p>${title.replace(/ ([^ ]*)$/, "\u00A0$1")}</p>
    </div>
    
    <p class="author">Afnizar Nur Ghifari, Designer</p>
    
  </html>
  `
}

const getScreenshot = async function ({ html, type = "png" }) {
  if (!html) {
    throw Error("You must provide an html property.")
  }

  const browser = await puppeteer.launch({
    args: chrome.args,
    executablePath: await chrome.executablePath,
    headless: false,
  })

  const page = await browser.newPage()
  await page.setContent(html, { waitUntil: "networkidle2" })
  const element = await page.$("html")
  await page.evaluateHandle("document.fonts.ready")
  return await element.screenshot({ type }).then(async (data) => {
    await browser.close()
    return data
  })
}

export default async (request: NowRequest, response: NowResponse) => {
  const { title } = request.query

  if (!title) {
    response.status(404).end()
  }

  const html = generateHTML(String(title))
  const result = await getScreenshot({ html })
  response.writeHead(200, { "Content-Type": "image/png" })
  response.end(result)
}
