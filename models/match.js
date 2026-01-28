import { randomUUID } from 'node:crypto'
import { readJSON } from '../utils.js'
import { writeJSON } from '../utils.js'

const matches = await readJSON('./matches.json')

export class MatchModel {
  static getAll ({ name }) {
    if (name) {
      return matches.filter(
        match => match.name.toLowerCase() === name.toLowerCase()
      )
    }

    return matches
  }

  static getById ({ id }) {
    const match = matches.find(match => match.id === id)
    return match
  }

  static create ({ input }) {
    try {
        const newmatch = {
            id: randomUUID(),
            ...input
        }
        matches.push(newmatch)

        writeJSON('./matches.json', matches)

        return newmatch
    } catch (error) {
        console.error('Error al insertar:', error)
        throw error
    }
  }

  static update ({ id, input }) {
    const matchIndex = matches.findIndex(match => match.id === id)
    if (matchIndex === -1) return false

    matches[matchIndex] = {
      ...matches[matchIndex],
      ...input
    }

    writeJSON('./matches.json', matches)

    return matches[matchIndex]
  }

  static delete ({ id }) {
    const matchIndex = matches.findIndex(match => match.id === id)
    if (matchIndex === -1) return false

    matches.splice(matchIndex, 1)

    writeJSON('./matches.json', matches)

    return true
  }

  static deleteAll = () => {
    matches.splice(0, matches.length)

    writeJSON('./matches.json', matches)

    return true
  }
}