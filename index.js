#!/usr/bin/env node

const puppeteer = require('puppeteer')
const ora = require('ora')
const creds = require('./creds.json')
const selectors = require('./selectors.json');

(async () => {
  console.log(process.argv)
  const spinner = new ora()
  let browser
  try {
    spinner.start('Launching browser...')
    browser = await puppeteer.launch({ headless: process.env.NODE_ENV === 'production' });
    const page = await browser.newPage();
    await page.setViewport({
      width: 1280,
      height: 768,
    })
    spinner.succeed()

    // open login page
    spinner.start('Opening login page...')
    await page.goto('https://bpnet.gbp.ma/');
    await page.click(selectors.login_link)
    await page.waitFor(3000)
    spinner.succeed()

    // enter creds
    spinner.start('Entering creds...')
    await page.click(selectors.id_input)
    await page.keyboard.type(creds.id)
    await page.click(selectors.password_input)
    await page.keyboard.type(creds.password)
    await page.click(selectors.login_btn)
    await page.waitFor(3000)
    await page.waitForSelector(selectors.credit_txt)
    await page.waitForSelector(selectors.credit_realtime_txt)
    spinner.succeed()

    // query credit
    spinner.start('Querying credit values...')
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
    await browser.close();
  }
})()
