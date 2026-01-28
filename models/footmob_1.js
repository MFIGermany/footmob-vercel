import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)

import { JSDOM } from 'jsdom'
import dotenv from 'dotenv'
import request from 'request'
import countryIso from 'country-iso-2-to-3'

dotenv.config();
const leagues = require('../leagues.json')
const zonesByCountry = require('../TimeZonesByCountry.json')
function requestAsync(options) {
  return new Promise((resolve, reject) => {
    request(options, (error, response, body) => {
      if (error) return reject(error)
      resolve({ response, body })
    })
  })
}

export class FootMobModel {
  static function
  static timezone
  static ccode
  static lang

  constructor({ url }) {
    this.requestOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-mas': process.env.XFMREQ
      }
    }

    this.requestOptionsPage = {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    }

    this.url = url
    this.setParams()
  }

  setFunction = async (func) => {
    this.function = func
  }

  setLang = async (lg) => {
    this.lang = lg
  }

  getLang = () => this.lang

  getAll = ({ name }) => {
    if (name) {
      return leagues.filter(l => l.name.toLowerCase() === name.toLowerCase())
    }
    return leagues
  }

  getByCountryCode = (code) => {
    if (code) return zonesByCountry.filter(t => t.isoCountryCode === code)
    return zonesByCountry
  }

  getByRegionCode = (arr, code) => {
    if (!Array.isArray(arr) || arr.length === 0) return null
    const timeZones = arr[0].timeZones || []
    if (timeZones.length === 0) return null

    return (
      timeZones.find(r => r.regionId === code) ||
      timeZones.find(r => r.regionId === 'ALL') ||
      timeZones[0]
    )
  }

  // --- reemplazo TOTAL de fetch por request ---
  setParams = async () => {
    try {
      const { body } = await requestAsync({
        url: 'https://pub.fotmob.com/prod/pub/odds/mylocation',
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })

      const loc = JSON.parse(body)

      this.lang = 'es'
      const reg = loc.regionId
      const cc2 = loc.countryCode
      const ccode3 = countryIso(cc2) || cc2

      this.timezone = 'UTC'
      const countryZones = this.getByCountryCode(cc2)

      if (countryZones && countryZones[0].timeZones.length > 0) {
        const region = this.getByRegionCode(countryZones, reg)
        if (region) {
          this.timezone = encodeURIComponent(region.timeZoneIdentifier)
        }
        this.ccode = ccode3
      }
    } catch (err) {
      console.error("Error en setParams:", err)
    }
  }

  // --- getRequest ahora usando request ---
  getRequest = async (fecha = '') => {
    try {
      let url = this.url + this.function + '?' +
        ((fecha) ? `date=${fecha}&timezone=${this.timezone}` : '') +
        `&ccode3=${this.ccode}`

      if (this.function !== 'data/matches') {
        url = this.url + this.function + `?lang=${this.lang}&ccode3=${this.ccode}`
      }

      console.log("URL:", url)

      const opt = { ...this.requestOptions, url }

      const { response, body } = await requestAsync(opt)

      if (response.statusCode !== 200) {
        console.log(response)
        console.log("Status:", response.statusCode)
        return false
      }

      return JSON.parse(body)

    } catch (error) {
      console.error('Error en getRequest:', error)
      return false
    }
  }

  // --- getRequestPage con request ---
  getRequestPage = async (url) => {
    try {
      console.log(url)

      const { response, body } = await requestAsync({ url, method: 'GET' })

      if (response.statusCode !== 200)
        throw new Error('Error al obtener la página')

      const dom = new JSDOM(body)
      const document = dom.window.document
      const linkEl = document.querySelector('link[rel="canonical"]')

      return linkEl ? linkEl.getAttribute('href') : false

    } catch (error) {
      console.error('Error en getRequestPage:', error)
      return false
    }
  }

  // --- JSON desde una página ---
  getRequestPageJson = async (url, opt = 0) => {
    try {
      console.log(url)

      const reqOpt = opt ? this.requestOptions : this.requestOptionsPage
      reqOpt.url = url

      const { response, body } = await requestAsync(reqOpt)

      if (response.statusCode !== 200) {
        console.log('Error al obtener la página')
        return false
      }

      return JSON.parse(body)

    } catch (error) {
      console.log(error)
      return false
    }
  }

  // --- obtener HTML y parsearlo ---
  getMatches = async (url) => {
    try {
      const { response, body } = await requestAsync({ url, method: 'GET' })

      if (response.statusCode !== 200) return false

      const dom = new JSDOM(body)
      const menu = dom.window.document.querySelector('ul.menu')

      return menu || false

    } catch (error) {
      console.error('Error en getMatches:', error)
      return false
    }
  }

  str_replace = async (search, replace, str) => {
    return str.replace(new RegExp(search, 'g'), replace)
  }

  // --- Short URL usando request ---
  getShortUrl = async (longUrl) => {
    const apiToken = 'bae820bb5d932c409f82abd67'

    if (!longUrl.includes('http')) {
      const base_url = await this.str_replace('api/', '', this.url)
      longUrl = base_url + this.lang + longUrl
    }

    const apiUrl = `https://api.cuty.io/quick?token=${apiToken}&url=${encodeURIComponent(longUrl)}&alias=CustomAlias`

    try {
      const opt = { ...this.requestOptions, url: apiUrl }

      const { response, body } = await requestAsync(opt)

      if (response.statusCode !== 200)
        throw new Error(`HTTP error! Status: ${response.statusCode}`)

      const data = JSON.parse(body)

      return data.success ? data.short_url : longUrl

    } catch (error) {
      console.error('Error getShortUrl:', error)
      return longUrl
    }
  }

}