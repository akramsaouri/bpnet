#!/usr/bin/env NODE_ENV=production node

const puppeteer = require('puppeteer')
const ora = require('ora')
const creds = require(require('path').resolve(process.argv[2]))
const selectors = require('./selectors.json');

(async () => {
  const spinner = new ora()
  let browser
  try {
    spinner.start('Launching browser...')
    browser = await puppeteer.launch({
      headless: process.env.NODE_ENV === 'production'
    })
    const page = await browser.newPage()
    await page.setViewport({
      width: 1280,
      height: 768,
    })
    spinner.succeed()

    // open login page
    spinner.start('Opening login page...')
    await page.goto('https://bpnet.gbp.ma/')
    page.click(selectors.login_link)
    await page.waitForNavigation()
    spinner.succeed()

    // enter creds
    spinner.start('Entering creds...')
    await page.click(selectors.id_input)
    await page.keyboard.type(creds.id)
    await page.click(selectors.password_input)
    await page.keyboard.type(creds.password)
    page.click(selectors.login_btn)
    await page.waitForNavigation()
    spinner.succeed()

    // query credit
    spinner.start('Querying credit values...')
    await page.waitForSelector(selectors.credit_txt)
    await page.waitForSelector(selectors.credit_realtime_txt)
    const credit = await page.evaluate(
      (x) => document.querySelector(x).textContent,
      selectors.credit_txt
    )
    const credit_realtime = await page.evaluate(
      (x) => document.querySelector(x).textContent,
      selectors.credit_realtime_txt
    )
    spinner.succeed()
    const str = credit !== credit_realtime ? ` (${credit_realtime} in realtime)` : ' '
    spinner.info(`Main credit: |${credit}|${str}`)
  } catch (e) {
    spinner.fail(e)
    if (process.env.NODE_ENV !== 'production') {
      console.log(e)
    }
  } finally {
    await browser.close()
  }
})()
