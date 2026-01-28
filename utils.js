import { createRequire } from 'node:module'
import fs from 'fs/promises' // Importa fs.promises para poder usar writeFile

const require = createRequire(import.meta.url)

export const readJSON = async (path) => {
    try {
        const data = await fs.readFile(path, 'utf8')
        return JSON.parse(data)
    } catch (error) {
        console.error('Error al leer el archivo JSON:', error)
        throw error
    }
}

export const writeJSON = async (path, data) => {
    try {
        await fs.writeFile(path, JSON.stringify(data, null, 2), 'utf8')
    } catch (error) {
        console.error('Error al escribir en el archivo JSON:', error)
        throw error
    }
}