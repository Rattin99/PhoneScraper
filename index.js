
const urls = [
    "airforce1.mx",
    "autoservicelohe.de",
    "bingamanhess.com",
]

const puppeteer = require('puppeteer');


async function launchBrowser() {
    return await puppeteer.launch({
        headless: false,
    });
}


function constructWaybackUrl(baseUrl) {
    return `https://web.archive.org/web/20230000000000*/${baseUrl}`;
}


async function findSnapshotUrl(page) {
  
    const content = await page.content();
  
    await page.waitForSelector('.calendar-day a', { timeout: 60000 });
   
    return await page.evaluate(() => {
        const snapshotLink = document.querySelector('.calendar-day a');
        console.log(snapshotLink);
        return snapshotLink ? snapshotLink.href : null;
    });
}

function extractPhoneNumbers() {
    const phoneNumbers = new Set();

    
    const phoneRegex = /^\s*(?:\+?(\d{1,3}))?[-. (]*(\d{3})[-. )]*(\d{3})[-. ]*(\d{4})(?: *x(\d+))?\s*$/gm;
    const pageText = document.body.innerText;
    const matches = pageText.match(phoneRegex);
    if (matches) {
        matches.forEach(number => phoneNumbers.add(number));
    }

    
    const aTags = Array.from(document.querySelectorAll('a[href]'));
    aTags.forEach(link => {
        const href = link.getAttribute('href').trim();
        
     
        if (href.startsWith('tel:')) {
            const telNumber = href.replace('tel:', '').trim();
            phoneNumbers.add(telNumber);
        } 
    
        else if (href.includes('wa.me')) {
            const match = href.match(/wa.me\/(\d+)/);
            if (match) {
                phoneNumbers.add(match[1].trim());
            }
        } 
    
        else {
            const match = href.match(phoneRegex);
            if (match) {
                phoneNumbers.add(match[0].trim());
            }
        }
    });
}


async function scrapePhoneNumbersFromUrl(waybackUrl, browser) {
    const page = await browser.newPage();
    await page.goto(waybackUrl, { waitUntil: 'networkidle2', timeout: 0 });

    const snapshotUrl = await findSnapshotUrl(page);
    console.log("snapshoturl: ",snapshotUrl);

    if (!snapshotUrl) {
        console.log(`No 2023 snapshot found for ${waybackUrl}`);
        await page.close();
        return [];
    }

    await page.goto(snapshotUrl, { waitUntil: 'networkidle2', timeout: 0 });
    const phoneNumbers = await page.evaluate(extractPhoneNumbers);

    await page.close();
    return phoneNumbers;
}


async function scrapePhoneNumbers(urls) {
    const browser = await launchBrowser();

    try {
        for (const url of urls) {
            const waybackUrl = constructWaybackUrl(url);
            console.log(`Navigating to: ${waybackUrl}`);
            const phoneNumbers = await scrapePhoneNumbersFromUrl(waybackUrl, browser);
            console.log(`WhatsApp numbers found for ${url}:`, phoneNumbers);
        }
    } catch (error) {
        console.error('Error occurred during scraping:', error);
    } finally {
        await browser.close();
    }
}


scrapePhoneNumbers(urls);


