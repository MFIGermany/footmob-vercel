import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)

import fetch from 'node-fetch'
import { JSDOM } from 'jsdom'
import dotenv from 'dotenv'
import request from 'request'
//Para el time zone
import countryIso from 'country-iso-2-to-3'


dotenv.config();
const leagues = require('../leagues.json')
const zonesByCountry = require('../TimeZonesByCountry.json')

export class FootMobModel {
  static function
  static timezone
  static ccode
  static lang

  constructor({ url }) {
    this.requestOptions = {
      method: 'GET', // Método de solicitud (GET en este caso)
      headers: {
        'Content-Type': 'application/json', // Tipo de contenido de la solicitud
        'x-mas': process.env.XFMREQ
      },
    }

    this.requestOptionsPage = {
      method: 'GET', // Método de solicitud (GET en este caso)
      headers: {
        'Content-Type': 'application/json'
      },
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

  getLang = () => {
    return this.lang
  }

  getAll = ({ name }) => {
    if (name) {
      return leagues.filter(
        league => league.name.toLowerCase() === name.toLowerCase()
      )
    }

    return leagues
  }

  getByCountryCode = (code) => {
    if (code) {
      return zonesByCountry.filter(
        timezone => timezone.isoCountryCode === code
      )
    }

    return zonesByCountry
  }

  getByRegionCode = (arr, code) => {
    if (!Array.isArray(arr) || arr.length === 0) return null

    const timeZones = arr[0].timeZones || []
    if (timeZones.length === 0) return null

    return (
      timeZones.find(r => r.regionId === code) ||
      timeZones.find(r => r.regionId === "ALL") ||
      timeZones[0]
    )
  }

  setParams = async () => {
    const resp = await fetch('https://pub.fotmob.com/prod/pub/odds/mylocation')
    const loc = await resp.json() // { countryCode: "BR", regionId: "SP", ... }
    
    // Por defecto el idioma español
    this.lang = 'es'

    const reg = loc.regionId
    const cc2 = loc.countryCode    
    const ccode3 = countryIso(cc2) || cc2
    
    this.timezone = 'UTC'
    const countryZones = this.getByCountryCode(cc2)
    //console.log(countryZones)
    if (countryZones && countryZones[0].timeZones.length > 0) {
      const region = this.getByRegionCode(countryZones, reg)
      if(region){
        this.timezone = region.timeZoneIdentifier
        this.timezone = encodeURIComponent(this.timezone)
      }
      this.ccode = ccode3
    }
  }

  /*
  checkSite = (url) => {
    console.log(url)
    const client = url.startsWith('https') ? https : http
  
    const req = client.get(url, (res) => {
      console.log(`Status Code: ${res.statusCode}`)
      if (res.statusCode == 200) {
        return true
      } else {
        return false
      }
    })
  
    req.on('error', (err) => {
      return false
    })
  }*/

  getRequest = async (fecha='') => {
    try {
      // console.log(fecha)
      //const url = this.url + this.function + '?ccode3=' + this.ccode + '&lang=' + this.lang + ((fecha) ? '&timezone=' + this.timezone + '&date=' + fecha : '')
      var url = this.url + this.function + '?' + ((fecha) ? 'date=' + fecha + '&timezone=' + this.timezone : '') + '&ccode3=' + this.ccode
      if(this.function != 'data/matches')
        url = this.url + this.function + '?' + 'lang=' + this.lang + '&ccode3=' + this.ccode
      //const url = 'https://www.fotmob.com/api/data/matches?date=20250816&timezone=America%2FSao_Paulo&ccode3=BRA'
      //console.log(url)
      // Hacer la solicitud HTTP
      const response = await fetch(url, this.requestOptions)
      //console.log(response)
      // Verificar si la respuesta fue exitosa
      if (!response.ok) {
        console.log(url)
        console.log(response.status)
        return false
      }
      console.log(url)
      // Convertir la respuesta a JSON
      const data = await response.json()

      return data
    } catch (error) {
      // Manejar errores de la solicitud
      console.error('Error en la solicitud:', error)
      throw error
    }
  }

  getRequestPage = async (url) => {
    try {
      console.log(url)
      // Hacer la solicitud HTTP
      const response = await fetch(url)

      // Verificar si la respuesta fue exitosa
      if (!response.ok) {
        throw new Error('Error al obtener la página')
      }

      // Leer el contenido HTML de la respuesta
      const html = await response.text()

      // Crear un objeto DOM simulado con jsdom
      const dom = new JSDOM(html)

      // Obtener el documento y el objeto window del DOM
      const document = dom.window.document

      // Buscar el elemento meta con el atributo name="canonicalUrl"
      const linkElement  = document.querySelector('link[rel="canonical"]')

      if (linkElement) {
        const href = linkElement.getAttribute('href')
        return href
      } else {
          throw new Error('No se encontró la URL en la página')
      }
    } catch (error) {
      // Manejar errores de la solicitud
      console.error('Error en la solicitud:', error)
      throw error
    }
  }

  getRequestPageJson = async (url, opt=0) => {
    try {
      // Hacer la solicitud HTTP
      console.log(url)
      const response = await fetch(url, (opt) ? this.requestOptions : this.requestOptionsPage)

      // Verificar si la respuesta fue exitosa
      if (!response.ok) {
        console.log('Error al obtener la página')
        return false
      }

      return response.json()
    } catch (error) {
      // Manejar errores de la solicitud
      console.log(error)
      return false
    }
  }

  getMatches = async (url) => {
    try {
      //let url = "https://www.elitegoltv.org/home.php"
      // Hacer la solicitud HTTP
      const response = await fetch(url)

      // Verificar si la respuesta fue exitosa
      if (!response.ok) {
        return false
        //throw new Error('Error al obtener la página')
      }

      // Leer el contenido HTML de la respuesta
      const html = await response.text()

      // Crear un objeto DOM simulado con jsdom
      const dom = new JSDOM(html)

      // Obtener el documento y el objeto window del DOM
      const document = dom.window.document

      // Buscar el elemento meta con el atributo name="canonicalUrl"
      const menu = document.querySelector('ul.menu')

      if (menu) {
        return menu          
      } else {
          console.log('No se encontró ningún elemento <ul> con la clase "menu"')
      }
    } catch (error) {
      // Manejar errores de la solicitud
      console.error('Error en la solicitud:', error)
      throw error
    }
  }
  
  str_replace = async (search, replace, str) => {
    return str.replace(new RegExp(search, 'g'), replace)
  }
  
  getShortUrl = async (longUrl) => {
    const apiToken = 'bae820bb5d932c409f82abd67'

    if(!longUrl.includes('http') && !longUrl.includes('https')){
      const base_url = await this.str_replace('api/', '', this.url)
      longUrl = base_url + this.lang + longUrl
    }

    const apiUrl = `https://api.cuty.io/quick?token=${apiToken}&url=${encodeURIComponent(longUrl)}&alias=CustomAlias`

    try {
        // Hacer la solicitud HTTP
        const response = await fetch(apiUrl, this.requestOptions)

        // Verificar si la respuesta fue exitosa
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`)
        }

        // Convertir la respuesta a JSON
        const data = await response.json()

        if(data.success === true) {
          return data.short_url
        }
        else{
          console.log(data.message)
          return longUrl
        }
    } catch (error) {
      // Manejar errores de la solicitud
      console.error('Error en la solicitud:', error)
      throw error
    }
  }

}