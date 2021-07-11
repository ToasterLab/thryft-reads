const fs = require(`fs`)
const axios = require(`axios`)
const cheerio = require(`cheerio`)
const parse = require(`csv-parse`)

const searchThryft = async (query, { unavailableProducts = `hide` } = {}) => {
  const { data } = await axios.get(`https://thryft.sg/search`, {
    params: {
      view: `ajax`,
      q: query,
      "options[prefix]": `last`,
      "options[unavailable_products]": unavailableProducts,
      type: `product`,
    }
  })

  const $ = cheerio.load(data)

  const results = $(`.search-bar__result-item`).map((_, el) => {
    const url = $(el).attr(`href`)
    const title = $(`.search-bar__item-info > .search-bar__item-title`, el).text()
    const price = $(`.search-bar__item-info > .search-bar__item-price`, el).text()
    return {
      title,
      price,
      url: `https://thryft.sg${url}`
    }
  }).get()

  return results
}

const parseGoodreadsImport = async (filename) => {
  const parser = fs.createReadStream(filename).pipe(parse())
  for await (const row of parser) {
    const title = row[1]
    const shelf = row[18]
    if(shelf === `to-read`){

      const thryftResults = await searchThryft(title)
      if(thryftResults.length > 0){
        console.log(title)
        console.log(JSON.stringify(thryftResults, null, 2))
        console.log(`\n`)
      }
    }
  }
}

parseGoodreadsImport(process.argv[2])